import { GraphNode } from './GraphNode';

export interface Terminal {
  // GraphNode this terminal belongs to
  readonly node: GraphNode;

  // Id of terminal within that node.
  readonly id: string;

  // Coordinates of terminal, relative to the node
  readonly x: number;
  readonly y: number;

  // human-readable name of this terminal
  readonly name: string;

  // Whether this is an input or output terminal
  readonly output: boolean;

  // True when dragging a connection to this terminal and it can connect.
  hover: boolean;
}
