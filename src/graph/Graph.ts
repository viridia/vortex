import { Connection, ConnectionJson } from './Connection';
import { DataType, Operator, Registry } from '../operators';
import { GraphNode, GraphNodeJson } from './GraphNode';
import { InputTerminal } from './InputTerminal';
import { OutputTerminal } from './OutputTerminal';
import { Terminal } from './Terminal';
import { makeObservable } from '../lib/makeObservable';
import { batch } from 'solid-js';
import { renderer } from '../render/Renderer';
import { EventSource } from './EventSource';

export interface GraphJson {
  nodes: GraphNodeJson[];
  connections: ConnectionJson[];
}

export interface GraphEvents {
  add: Operator;
}

export class Graph extends EventSource<GraphEvents> {
  public path: string | null = null;
  public nodes: ReadonlyArray<GraphNode> = [];
  public modified = false;

  private nodeCount = 0;

  constructor() {
    super();
    makeObservable(this, ['path', 'modified', 'nodes']);
    this.nodes = [];
  }

  public dispose() {
    this.nodes.forEach(node => node.dispose(renderer));
  }

  /** Add a node to the list. */
  public add(node: GraphNode) {
    batch(() => {
      this.nodeCount = Math.max(this.nodeCount, node.id + 1);
      this.nodes = [...this.nodes, node];
      this.modified = true;
    });
  }

  public addMany(nodes: GraphNode[]) {
    batch(() => {
      nodes.forEach(n => {
        this.nodeCount = Math.max(this.nodeCount, n.id + 1);
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
    return this.nodes.find(n => n.id === nid);
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

  public connectTerminals(src: OutputTerminal, dst: InputTerminal) {
    batch(() => {
      if (!src.output) {
        throw Error('Attempt to connect source to input terminal');
      }
      if (dst.output) {
        throw Error('Attempt to connect destination to output terminal');
      }
      if (dst.connection) {
        if (dst.connection.source === src) {
          return;
        }
        // Disconnect existing connection
        dst.connection.source?.disconnect(dst.connection);
        dst.connection = null;
      }
      // Create new connection
      const conn: Connection = {
        source: src,
        dest: dst,
        recalc: true,
      };
      src.connections.push(conn);
      dst.connection = conn;
      this.modified = true;
    });
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

  public deleteSelection() {
    batch(() => {
      // Disconnect all selected nodes
      this.selection.forEach(node => {
        node.outputs.forEach(output => {
          output.connections.forEach(connection => {
            if (connection.dest) {
              connection.dest.connection = null;
            }
            output.disconnect(connection);
          });
        });
        node.inputs.forEach(input => {
          input.connection?.source?.disconnect(input.connection);
          input.connection = null;
        });
        // Release any rendering resources
        node.setDeleted();
      });
      // Delete all selected nodes
      this.nodes = this.nodes.filter(n => !n.selected);
      this.modified = true;
    });
  }

  public clear() {
    batch(() => {
      this.nodes.forEach(node => {
        node.outputs.forEach(output => {
          output.connections.forEach(connection => {
            output.disconnect(connection);
          });
        });
        node.inputs.forEach(input => {
          input.connection?.source?.disconnect(input.connection);
        });
        // Release any rendering resources
        node.setDeleted();
      });
      this.nodes = [];
      this.modified = true;
    });
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
            connections.push({
              src: [connection.source.node.id, connection.source.id],
              dst: [connection.dest.node.id, connection.dest.id],
            });
          }
        });
      });
    });
    return { nodes, connections };
  }

  public fromJs(json: GraphJson, registry: Registry) {
    this.dispose();
    const nodes = json.nodes.map(node => {
      const n = new GraphNode(registry.get(node.operator), node.id);
      n.x = node.x;
      n.y = node.y;
      n.operator.params.forEach(param => {
        if (param.type === DataType.GROUP) {
          param.children?.forEach(childParam => {
            if (childParam.id in node.params) {
              n.paramValues.set(childParam.id, node.params[childParam.id]);
            }
          });
        } else if (param.id in node.params) {
          n.paramValues.set(param.id, node.params[param.id]);
        }
      });
      return n;
    });
    batch(() => {
      this.addMany(nodes);
      json.connections.forEach(connection => {
        const [source, sourceTerminal] = connection.src;
        const [dest, destTerminal] = connection.dst;
        this.connect(source, sourceTerminal, dest, destTerminal);
      });
      this.modified = false;
    });
  }
}
