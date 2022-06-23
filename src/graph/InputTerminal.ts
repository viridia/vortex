import { makeObservable } from '../lib/makeObservable';
import { AbstractTerminal } from './AbstractTerminal';
import type { Connection } from './Connection';
import type { GraphNode } from './GraphNode';
import type { Terminal } from './Terminal';

export class InputTerminal extends AbstractTerminal {
  // Single input connections
  public connection: Connection | null = null;

  constructor(node: GraphNode, name: string, id: string, x: number, y: number, output = false) {
    super(node, name, id, x, y, output);
    makeObservable(this, ['connection']);
  }
}

export function isInputTerminal(terminal: Terminal | null | undefined): terminal is InputTerminal {
  return terminal instanceof AbstractTerminal && !terminal.output;
}
