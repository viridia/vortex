import { createContext } from 'solid-js';
import { Operator } from './Operator';

/** Maintains the list of operators. */
export class Registry {
  private operators = new Map<string, Operator>();

  constructor() {
    const catalog = import.meta.globEager('./library/*.ts');
    Object.keys(catalog).forEach(key => {
      const op = catalog[key].default as Operator;
      if (op.group) {
        this.operators.set(op.id, op);
      }
    });
  }

  public has(name: string) {
    return this.operators.has(name);
  }

  public get(name: string): Operator {
    const result = this.operators.get(name);
    if (!result) {
      throw Error(`Operator not found: ${name}.`);
    }
    return result;
  }

  public get list(): Operator[] {
    return Array.from(this.operators.values()).filter(op => !op.deprecated);
  }
}

export const registry = new Registry();
