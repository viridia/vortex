import { Connection } from './Connection';
import { DataType, Operator, Parameter } from '../operators';
import { Expr } from '../render/Expr';
import { GLResources } from '../render/GLResources';
import { InputTerminal } from './InputTerminal';
import { OutputTerminal } from './OutputTerminal';
import { Renderer } from '../render/Renderer';
import { ShaderAssembly } from '../render/ShaderAssembly';
import { Terminal } from './Terminal';
import { equalSet } from '../lib/comparators';
import { glType } from '../operators/DataType';
import { union } from '../lib/functional';
import { batch, createMemo, createRoot } from 'solid-js';
import { createMap } from 'solid-proxies';
import { makeObservable } from '../lib/makeObservable';
import { ColorStop } from '../render/colors';

/** A node in the graph. */
export class GraphNode {
  // Node coordinates
  public x: number = 0;
  public y: number = 0;

  // Node i/o
  public inputs: InputTerminal[] = [];
  public outputs: OutputTerminal[] = [];

  // Node parameters
  public paramValues = createMap<string, any>();

  // Node selection state
  public selected: boolean = false;

  // Preview needs recalculation
  public deleted = false;

  // GL resources allocated by the operator for this node.
  public glResources: GLResources | undefined;
  public prevSource: string = '';

  // Report errors compiling this node.
  public errorMsg: string | null = null;

  private generator: ShaderAssembly;
  private disposer?: () => void;

  constructor(
    // Defines what this node does.
    public readonly operator: Operator,
    // Unique id of this node within a graph
    public readonly id: number
  ) {
    makeObservable(this, ['x', 'y', 'selected', 'deleted', 'errorMsg']);
    this.operator = operator;

    // Position input terminals.
    if (operator.inputs) {
      const spacing = Math.min(36, 120 / operator.inputs.length);
      let y = Math.floor((120 - operator.inputs.length * spacing) / 2);
      operator.inputs.forEach(input => {
        this.inputs.push(new InputTerminal(this, input.name, input.id, -9, y));
        y += spacing;
      });
    }

    // Position output terminals.
    if (operator.outputs) {
      const spacing = Math.min(36, 120 / operator.outputs.length);
      let y = Math.floor((120 - operator.outputs.length * spacing) / 2);
      (operator.outputs || []).forEach(output => {
        this.outputs.push(new OutputTerminal(this, output.name, output.id, 93, y));
        y += spacing;
      });
    }

    // Initialize all parameters to default values.
    batch(() => {
      this.operator.paramList.forEach(param => {
        if (param.default !== undefined) {
          if (param.type === DataType.RGBA_GRADIENT) {
            // Make color stops observable and mutable.
            this.paramValues.set(param.id, param.default.map(stop => {
              const result: ColorStop = { ...stop };
              makeObservable(result, ['position', 'value']);
              return result;
            }));
          } else {
            this.paramValues.set(param.id, param.default);
          }
        }
      });
    });

    this.generator = new ShaderAssembly(this);
  }

  // The human-readable name of this node.
  public get name(): string {
    return this.operator.name;
  }

  // Release any GL resources we were holding on to.
  public dispose(renderer: Renderer) {
    renderer.deleteShaderResources(this.glResources);
    renderer.deleteTextureResources(this.glResources);
    this.generator.dispose();
    this.disposer?.();
  }

  public ensureGLResources(): GLResources {
    if (!this.glResources) {
      this.glResources = new GLResources();
    }
    return this.glResources;
  }

  public findInputTerminal(id: string): InputTerminal | undefined {
    return this.inputs.find(t => t.id === id);
  }

  public findOutputTerminal(id: string): OutputTerminal | undefined {
    return this.outputs.find(t => t.id === id);
  }

  public findTerminal(id: string): Terminal | undefined {
    return this.findInputTerminal(id) || this.findOutputTerminal(id);
  }

  public getInputTerminal(id: string): InputTerminal {
    const terminal = this.findInputTerminal(id);
    if (!terminal) {
      throw Error(`Terminal ${this.operator.id}.${id} not found`);
    }
    return terminal;
  }

  public getOutputTerminal(id: string): OutputTerminal {
    const terminal = this.findOutputTerminal(id);
    if (!terminal) {
      throw Error(`Terminal ${this.operator.id}.${id} not found`);
    }
    return terminal;
  }

  public getTerminal(id: string): Terminal | undefined {
    const terminal = this.findTerminal(id);
    if (!terminal) {
      throw Error(`Terminal ${this.operator.id}.${id} not found`);
    }
    return terminal;
  }

  /** Visit all nodes which transitively feed into this node's inputs.
      Return 'false' from the callback to signal that the visitor should not traverse any
      deeper into the graph.
      @param callback A function which is called for every upstream node. Three arguments are
        passed: the upstream node, and the connection leading to that node.
  */
  public visitUpstreamNodes(callback: (node: GraphNode, conn: Connection) => boolean | void) {
    const visited = new Set<number>();
    const visit = (node: GraphNode): void => {
      if (node.id && !visited.has(node.id)) {
        visited.add(node.id);
        for (const input of node.inputs) {
          const connection = input.connection;
          if (connection && connection.source) {
            if (callback(connection.source.node, connection) !== false) {
              visit(connection.source.node);
            }
          }
        }
      }
    };
    visit(this);
  }

  /** Visit all nodes which transitively depend on this node's outputs.
      Return 'false' from the callback to signal that the visitor should not traverse any
      deeper into the graph.
  */
  public visitDownstreamNodes(callback: (node: GraphNode, conn: Connection) => boolean | void) {
    const visited = new Set<number>();
    const visit = (node: GraphNode): void => {
      if (node.id && !visited.has(node.id)) {
        visited.add(node.id);
        for (const output of this.outputs) {
          for (const connection of output.connections) {
            if (connection.dest) {
              if (callback(connection.dest.node, connection) !== false) {
                visit(connection.source.node);
              }
            }
          }
        }
      }
    };
    visit(this);
  }

  public setDeleted() {
    if (!this.deleted) {
      this.deleted = true;
    }
  }

  public toJs(): any {
    const params: any = {};
    for (const param of this.operator.paramList) {
      if (this.paramValues.has(param.id)) {
        params[param.id] = this.paramValues.get(param.id);
      } else if (param.default !== undefined) {
        params[param.id] = param.default;
      }
    }
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      operator: this.operator.id,
      params,
    };
  }

  public loadTextures(renderer: Renderer) {
    for (const param of this.operator.paramList) {
      // console.debug('param', param, this.paramValues.size);
      if (param.type === DataType.IMAGE && this.paramValues.has(param.id)) {
        const imageData = this.paramValues.get(param.id);
        if (imageData?.url) {
          renderer.loadTexture(imageData.url, texture => {
            this.ensureGLResources().textures.set(param.id, texture);
            // TODO: We need to make this an observable.
            // this.notifyChange(ChangeType.PARAM_VALUE_CHANGED);
          });
        }
      }
    }
  }

  public getTexture(id: string): WebGLTexture {
    if (this.glResources) {
      const texture = this.glResources.textures.get(id);
      if (texture) {
        return texture;
      }
    }
    throw Error(`Texture not found: ${id}`);
  }

  // @computed({ requiresReaction: true })
  public get source(): string {
    return this.generator.source;
  }

  /** Return an expression graph representing this node's output. */
  // @computed
  public get outputCode(): Expr {
    return this.operator.getCode(this);
  }

  setError(errorMessage: string | null) {
    this.errorMsg = errorMessage;
  }

  clearError() {
    this.errorMsg = null;
  }

  public get error(): string | null {
    return this.errorMsg;
  }

  // Return the (observable) set of imports needed to compile the code for this node
  // and its dependencies.
  // @computed<Set<string>>({ equals: equalSet, requiresReaction: true })
  public get transitiveImports(): Set<string> {
    let result = this.operatorImports;
    for (const input of this.inputs) {
      const sourceNode = input.connection?.source.node;
      if (sourceNode) {
        result = union(result, sourceNode.transitiveImports);
      }
    }
    return result;
  }

  private operatorImportsMemo = createRoot(disposer => {
    this.disposer = disposer;
    return createMemo<Set<string>>(() => this.operator.getImports(this), new Set(), {
      equals: equalSet,
    });
  });

  // @computed<Set<string>>({ equals: equalSet, requiresReaction: true })
  public get operatorImports(): Set<string> {
    return this.operatorImportsMemo();
    // return this.operator.getImports(this);
  }

  // @computed({ requiresReaction: true })
  public get uniforms(): string[] {
    const result: string[] = [];
    // Buffered inputs also have to be declared as uniforms.
    this.operator.inputs.forEach(input => {
      if (input.buffered) {
        const uniformName = this.operator.uniformName(this.id, input.id);
        result.push(`uniform sampler2D ${uniformName};`);
      }
    });
    const declareUniforms = (params: Parameter[]): void => {
      params.forEach(param => {
        if (param.pre) {
          return;
        } else if (param.type === DataType.GROUP) {
          declareUniforms(param.children!);
        } else {
          const uniformName = this.operator.uniformName(this.id, param);
          if (param.type === DataType.RGBA_GRADIENT) {
            result.push(`uniform vec4 ${uniformName}_colors[32];`);
            result.push(`uniform float ${uniformName}_positions[32];`);
          } else {
            result.push(`uniform ${glType(param.type)} ${uniformName};`);
          }
        }
      });
    };
    declareUniforms(this.operator.paramList);
    if (result.length > 0) {
      return [`// Uniforms for ${this.operator.id}${this.id}`, ...result, ''];
    }
    return result;
  }
}
