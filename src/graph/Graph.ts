import { Connection, ConnectionJson, connectionToJs } from './Connection';
import { Operator } from '../operators';
import { GraphNode, GraphNodeJson, ParamValue } from './GraphNode';
import { InputTerminal } from './InputTerminal';
import { OutputTerminal } from './OutputTerminal';
import { Terminal } from './Terminal';
import { makeObservable } from '../lib/makeObservable';
import { batch, untrack } from 'solid-js';
import { renderer } from '../render/Renderer';
import { EventSource } from './EventSource';
import { AddDeleteAction, ChangeParamAction, ConnectAction, UndoAction, UndoStack } from './Undo';
import { registry } from '../operators/Registry';

export interface GraphJson {
  nodes: GraphNodeJson[];
  connections: ConnectionJson[];
}

export interface GraphEvents {
  add: Operator;
}

export interface NodesToMove {
  node: GraphNode;
  xFrom: number;
  yFrom: number;
  xTo: number;
  yTo: number;
}

export class Graph extends EventSource<GraphEvents> {
  public path: string | null = null;
  public nodes: ReadonlyArray<GraphNode> = [];
  public modified = false;

  private nodeCount = 0;
  private undoStack: UndoStack = [];
  private redoStack: UndoStack = [];
  private nodeIndex = new Map<number, GraphNode>();

  constructor() {
    super();
    makeObservable(this, ['path', 'modified', 'nodes']);
    this.nodes = [];
  }

  public dispose() {
    this.nodes.forEach(node => node.dispose(renderer));
  }

  /** Add a node to the list. */
  public addNode(node: GraphNode) {
    const undoNodes: GraphNodeJson[] = [];
    batch(() => {
      this.nodeCount = Math.max(this.nodeCount, node.id + 1);
      this.nodes = [...this.nodes, node];
      this.modified = true;
      this.nodeIndex.set(node.id, node);
      undoNodes.push(node.toJs());
    });

    this.addUndoAction({
      type: 'add',
      caption: 'Add',
      nodes: undoNodes,
      connections: [],
    });
  }

  /** Add an array of nodes all at once. Does not record an undo action. */
  private addNodes(nodes: GraphNode[]) {
    batch(() => {
      nodes.forEach(n => {
        this.nodeCount = Math.max(this.nodeCount, n.id + 1);
        this.nodeIndex.set(n.id, n);
      });
      this.nodes = [...this.nodes, ...nodes];
      this.modified = true;
    });
  }

  /** Return the next node id. */
  public nextId() {
    this.nodeCount += 1;
    return this.nodeCount;
  }

  /** Locate a node by id. */
  public findNode(id: number | string): GraphNode | undefined {
    const nid = Number(id);
    return this.nodeIndex.get(nid);
  }

  /** Locate a terminal by id. */
  public findTerminal(nodeId: number | string, terminalId: string): Terminal | undefined {
    const node = this.findNode(nodeId);
    return node?.findTerminal(terminalId);
  }

  public findInputTerminal(nodeId: number | string, terminalId: string): InputTerminal | undefined {
    const node = this.findNode(nodeId);
    return node?.findInputTerminal(terminalId);
  }

  public findOutputTerminal(
    nodeId: number | string,
    terminalId: string
  ): OutputTerminal | undefined {
    const node = this.findNode(nodeId);
    return node?.findOutputTerminal(terminalId);
  }

  public connect(
    srcNode: GraphNode | number,
    srcTerm: string,
    dstNode: GraphNode | number,
    dstTerm: string
  ) {
    const sn: GraphNode | undefined =
      typeof srcNode === 'number' ? this.findNode(srcNode) : srcNode;
    const dn: GraphNode | undefined =
      typeof dstNode === 'number' ? this.findNode(dstNode) : dstNode;
    if (!sn) {
      throw new Error(`Unknown source node id: ${srcNode}`);
    }
    if (!dn) {
      throw new Error(`Unknown destination node id: ${dstNode}`);
    }

    const st = sn.findOutputTerminal(srcTerm);
    const dt = dn.findInputTerminal(dstTerm);

    if (!st) {
      throw new Error(`Unknown source node id: ${sn.operator.name}.${st}`);
    }

    if (!dt) {
      throw new Error(`Unknown destination node id: ${dn.operator.name}.${dt}`);
    }

    this.connectTerminals(st, dt);
  }

  public connectTerminals(src: OutputTerminal, dst: InputTerminal, withUndo = false) {
    return batch(() => {
      if (!src.output) {
        throw Error('Attempt to connect source to input terminal');
      }
      if (dst.output) {
        throw Error('Attempt to connect destination to output terminal');
      }

      const undoAction: ConnectAction = {
        caption: 'Connection',
        type: 'connect',
        added: [],
        removed: [],
      };

      if (dst.connection) {
        if (dst.connection.source === src) {
          return;
        }
        // Disconnect existing connection
        undoAction.removed.push(connectionToJs(dst.connection));
        dst.connection.source?.disconnect(dst.connection);
        dst.connection = null;
      }

      // Create new connection
      const conn: Connection = {
        source: src,
        dest: dst,
        recalc: true,
      };

      if (withUndo) {
        undoAction.added.push(connectionToJs(conn));
        this.addUndoAction(undoAction);
      }

      src.connections.push(conn);
      dst.connection = conn;
      this.modified = true;
    });
  }

  public moveNodes(nodesToMove: NodesToMove[]) {
    this.addUndoAction({
      caption: 'Move',
      type: 'move',
      nodes: nodesToMove.map(mv => ({
        node: mv.node.id,
        xFrom: mv.xFrom,
        yFrom: mv.yFrom,
        xTo: mv.xTo,
        yTo: mv.yTo,
      })),
    });
  }

  public setParamVal(node: GraphNode, paramId: string, value: ParamValue) {
    // Coalesce undo records
    let matchingUndo: ChangeParamAction;
    if (this.undoStack.length > 0) {
      const top = this.undoStack.at(-1);
      if (top.type === 'chgparam' && top.node === node.id && paramId in top.before) {
        matchingUndo = top;
      }
    }

    if (matchingUndo) {
      matchingUndo.after[paramId] = value;
    } else {
      this.addUndoAction({
        type: 'chgparam',
        caption: 'Change Parameter',
        node: node.id,
        before: { [paramId]: node.paramValues.get(paramId) },
        after: { [paramId]: value },
      });
    }

    node.paramValues.set(paramId, value);
  }

  public undo() {
    if (this.undoStack.length > 0) {
      const action = this.undoStack.pop();
      this.redoStack.push(this.applyUndoAction(action));
    }
  }

  public redo() {
    if (this.redoStack.length > 0) {
      const action = this.redoStack.pop();
      this.undoStack.push(this.applyUndoAction(action));
    }
  }

  /** Return a list of all selected nodes. */
  public get selection(): GraphNode[] {
    return this.nodes.filter(node => node.selected);
  }

  /** Select all nodes. */
  public selectAll() {
    batch(() => {
      this.nodes.forEach(n => {
        n.selected = true;
      });
    });
  }

  /** Clear the current selection. */
  public clearSelection() {
    batch(() => {
      this.nodes.forEach(n => {
        n.selected = false;
      });
    });
  }

  /** Delete all selected nodes. */
  public deleteSelection() {
    const selection = this.selection;
    if (selection.length === 0) {
      return;
    }

    batch(() => {
      const action: AddDeleteAction = {
        type: 'delete',
        caption: 'Clear',
        nodes: [],
        connections: [],
      };
      const disconnects = new Set<Connection>();

      // Disconnect all selected nodes
      selection.forEach(node => {
        this.removeNode(node, action, disconnects);
      });
      action.connections = Array.from(disconnects).map(connection => connectionToJs(connection));

      // Delete all selected nodes
      this.addUndoAction(action);
      this.nodes = this.nodes.filter(n => !n.selected);
      this.modified = true;
    });
  }

  /** Delete all nodes and connections. */
  public clear() {
    if (this.nodes.length === 0) {
      return;
    }

    batch(() => {
      const action: AddDeleteAction = {
        type: 'delete',
        caption: 'Delete',
        nodes: [],
        connections: [],
      };
      const disconnects = new Set<Connection>();

      // Dispose all nodes.
      this.nodes.forEach(node => {
        this.removeNode(node, action, disconnects);
      });
      action.connections = Array.from(disconnects).map(connection => connectionToJs(connection));

      this.nodes = [];
      this.modified = true;
      this.addUndoAction(action);
    });
  }

  private removeConnection(srcNode: number, srcTerm: string, dstNode: number, dstTerm: string) {
    const sn: GraphNode | undefined = this.findNode(srcNode);
    const dn: GraphNode | undefined = this.findNode(dstNode);
    if (!sn) {
      throw new Error(`Unknown source node id: ${srcNode}`);
    }
    if (!dn) {
      throw new Error(`Unknown destination node id: ${dstNode}`);
    }

    const st = sn.findOutputTerminal(srcTerm);
    const dt = dn.findInputTerminal(dstTerm);

    if (!st) {
      throw new Error(`Unknown source node id: ${sn.operator.name}.${st}`);
    }

    if (!dt) {
      throw new Error(`Unknown destination node id: ${dn.operator.name}.${dt}`);
    }

    if (dt.connection && dt.connection.source === st) {
      dt.connection.source?.disconnect(dt.connection);
      dt.connection = null;
    }
  }

  /** Add a new undo action to the undo stack and clear the redo stack. */
  private addUndoAction(action: UndoAction) {
    this.redoStack.length = 0;
    this.undoStack.push(action);
    if (this.undoStack.length > 100) {
      this.undoStack.splice(0, this.undoStack.length - 100);
    }
  }

  private applyUndoAction(action: UndoAction): UndoAction {
    return batch(() => {
      switch (action.type) {
        case 'add': {
          // Delete the connections which were added.
          action.connections.forEach(conn => {
            const [src, srcTerminal] = conn.src;
            const [dst, dstTerminal] = conn.dst;
            this.removeConnection(src, srcTerminal, dst, dstTerminal);
          });

          // Delete the nodes which were added.
          const nodesToDelete = action.nodes.map(n => this.nodeIndex.get(n.id)).filter(Boolean);
          nodesToDelete.forEach(node => {
            node.setDeleted();
            this.nodeIndex.delete(node.id);
          });
          this.nodes = this.nodes.filter(n => this.nodeIndex.has(n.id));

          // Return an inverse action
          return {
            ...action,
            type: 'delete',
          };
        }

        case 'delete': {
          // Add back the deleted nodes
          this.clearSelection();
          const nodes = action.nodes.map(nodeJson => {
            const n = new GraphNode(registry.get(nodeJson.operator), nodeJson.id);
            n.x = nodeJson.x;
            n.y = nodeJson.y;
            n.unmarshalParams(nodeJson.params);
            n.selected = true;
            return n;
          });

          this.addNodes(nodes);

          // Reconnect the connections
          action.connections.forEach(conn => {
            const [source, srcTerminal] = conn.src;
            const [dest, dstTerminal] = conn.dst;
            this.connect(source, srcTerminal, dest, dstTerminal);
          });

          // Return an inverse action
          return {
            ...action,
            type: 'add',
          };
        }

        case 'connect': {
          // Delete the connections which were added.
          action.added.forEach(conn => {
            const [src, srcTerminal] = conn.src;
            const [dst, dstTerminal] = conn.dst;
            this.removeConnection(src, srcTerminal, dst, dstTerminal);
          });

          // Add the connections which were deleted
          action.removed.forEach(conn => {
            const [source, srcTerminal] = conn.src;
            const [dest, dstTerminal] = conn.dst;
            this.connect(source, srcTerminal, dest, dstTerminal);
          });

          return {
            ...action,
            type: 'connect',
            added: action.removed,
            removed: action.added,
          };
        }

        case 'move': {
          action.nodes.forEach(mv => {
            const node = this.nodeIndex.get(mv.node);
            if (node) {
              node.x = mv.xFrom;
              node.y = mv.yFrom;
            }
          });

          // TODO
          return {
            ...action,
            type: 'move',
            nodes: action.nodes.map(mv => ({
              ...mv,
              xFrom: mv.xTo,
              yFrom: mv.yTo,
              xTo: mv.xFrom,
              yTo: mv.yFrom,
            })),
          };
        }

        case 'chgparam': {
          const node = this.findNode(action.node);
          if (node) {
            this.redoStack.push(action);
            node.unmarshalParams(action.before);
          }

          // Inverse action
          return {
            ...action,
            type: 'chgparam',
            before: action.after,
            after: action.before,
          };
        }
      }
    });
  }

  private removeNode(node: GraphNode, action: AddDeleteAction, disconnects: Set<Connection>) {
    node.outputs.forEach(output => {
      output.connections.forEach(connection => {
        disconnects.add(connection);
        if (connection.dest) {
          connection.dest.connection = null;
        }
        output.disconnect(connection);
      });
    });

    node.inputs.forEach(input => {
      if (input.connection) {
        disconnects.add(input.connection);
        input.connection.source?.disconnect(input.connection);
      }
    });

    // Add to undo action
    action.nodes.push(node.toJs());

    // Release any rendering resources
    node.setDeleted();
    this.nodeIndex.delete(node.id);
  }

  public get asJson() {
    return this.toJs();
  }

  /** Return true if adding a connection between the given terminals would create a cycle. */
  public detectCycle(a: Terminal, b: Terminal): boolean {
    if (a.output === b.output) {
      return false;
    }
    if (a.output && !b.output) {
      return this.detectCycle(b, a);
    }
    const input = a;
    const output = b;
    const visited = new Set<number>();
    const toVisit: GraphNode[] = [];
    visited.add(output.node.id);
    toVisit.push(input.node);
    while (toVisit.length > 0) {
      const node = toVisit.pop()!;
      if (visited.has(node.id)) {
        return true;
      }
      visited.add(node.id);
      for (const term of node.outputs) {
        for (const connection of term.connections) {
          toVisit.push(connection.dest.node);
        }
      }
    }

    return false;
  }

  public toJs(): GraphJson {
    const connections: ConnectionJson[] = [];
    const nodes: GraphNodeJson[] = [];
    this.nodes.forEach(node => {
      nodes.push(node.toJs());
      node.outputs.forEach(output => {
        output.connections.forEach(connection => {
          if (connection.source && connection.dest) {
            connections.push(connectionToJs(connection));
          }
        });
      });
    });
    return { nodes, connections };
  }

  public fromJs(json: GraphJson) {
    this.dispose();
    const nodes = untrack(() =>
      json.nodes.map(node => {
        const n = new GraphNode(registry.get(node.operator), node.id);
        n.x = node.x;
        n.y = node.y;
        n.unmarshalParams(node.params);
        return n;
      })
    );
    batch(() => {
      this.addNodes(nodes);
      json.connections.forEach(connection => {
        const [src, srcTerminal] = connection.src;
        const [dst, dstTerminal] = connection.dst;
        this.connect(src, srcTerminal, dst, dstTerminal);
      });
      this.undoStack.length = 0;
      this.redoStack.length = 0;
      this.modified = false;
    });
  }
}
