import { Expr } from '../render/Expr';
import { GraphNode, OutputTerminal } from '../graph';
import { Input } from './Input';
import { Output } from './Output';
import { Parameter } from './Parameter';
import { vec4 } from '../render/glIntrinsics';

const EMPTY_SET = new Set<string>();

/** Defines a type of node. */
export abstract class Operator {
  public readonly group: string; // Which group, e.g. 'math', 'generator', 'filter', 'display'
  public readonly name: string; // Type name, e.g. 'noise'
  public readonly id: string; // Unique id of this operator
  public readonly inputs: Input[] = [];
  public readonly outputs: Output[] = [];
  public readonly params: Parameter[] = [];
  public abstract readonly description?: string;
  public readonly deprecated: boolean = false;

  constructor(group: string, name: string, id: string) {
    this.group = group;
    this.name = name;
    this.id = id;
  }

  public getName(node: GraphNode) {
    return this.name;
  }

  /** Retrieve the set of imports needed for a given node. */
  public getImports(node: GraphNode): Set<string> {
    return EMPTY_SET;
  }

  /** Return the expression for this node. */
  public getCode(node: GraphNode, terminal: OutputTerminal, prologue: Expr[]): Expr {
    return vec4(0, 0, 0, 1);
  }

  /** Locate an operator input by id. */
  public getInput(id: string): Input {
    const result = this.inputs?.find(i => i.id === id);
    if (!result) {
      throw Error(`Operator input not found: ${this.id}:${id}`);
    }
    return result;
  }

  /** Locate an operator output by id. */
  public getOutput(id: string): Output {
    const result = this.outputs?.find(i => i.id === id);
    if (!result) {
      throw Error(`Operator outputs not found: ${this.id}:${id}`);
    }
    return result;
  }

  /** Locate an operator output by id. */
  public getParam(id: string): Parameter {
    for (const p of this.params) {
      if (p.id === id) {
        return p;
      } else if (p.children) {
        for (const c of p.children) {
          if (c.id === id) {
            return c;
          }
        }
      }
    }
    throw Error(`Parameter not found: ${this.id}.${id}`);
  }

  /** Return parameters as a flat list. */
  public get paramList(): Parameter[] {
    const result: Parameter[] = [];
    for (const param of this.params) {
      if (param.children) {
        result.splice(result.length, 0, ...param.children);
      } else {
        result.push(param);
      }
    }
    return result;
  }

  /** Flat list of all parameters that set uniforms. */
  public get uniformParamList(): Parameter[] {
    return this.paramList.filter(param => !param.pre);
  }

  public uniformPrefix(nodeId: number) {
    const opName = this.id.slice(0, 1).toUpperCase() + this.id.slice(1);
    return `u${opName}${nodeId}`;
  }

  public uniformName(nodeId: number, param: Parameter | string) {
    if (typeof param === 'string') {
      return `${this.uniformPrefix(nodeId)}_${param}`;
    }
    return `${this.uniformPrefix(nodeId)}_${param.id}`;
  }
}
