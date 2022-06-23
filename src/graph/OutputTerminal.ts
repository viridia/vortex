import { createArray } from 'solid-proxies';
import { AbstractTerminal } from './AbstractTerminal';
import type { Connection } from './Connection';
import type { GraphNode } from './GraphNode';
import type { Terminal } from './Terminal';

export class OutputTerminal extends AbstractTerminal {
  // List of output connections
  public connections = createArray<Connection>([]);

  constructor(node: GraphNode, name: string, id: string, x: number, y: number) {
    super(node, name, id, x, y, true);
  }

  /** Delete a connection from the list of connections. */
  public disconnect(connection: Connection): boolean {
    const index = this.connections.findIndex(conn => conn.dest === connection.dest);
    if (index >= 0) {
      this.connections.splice(index, 1);
      return true;
    }
    return false;
  }
}

export function isOutputTerminal(
  terminal: Terminal | null | undefined
): terminal is OutputTerminal {
  return terminal instanceof AbstractTerminal && terminal.output;
}
