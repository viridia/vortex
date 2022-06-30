import { ConnectionJson } from './Connection';
import { GraphNodeJson, ParamsJson } from './GraphNode';

export type ActionType = 'move' | 'add' | 'delete' | 'connect' | 'chgparam';

export interface BaseAction {
  caption: string;
}

export interface MoveAction extends BaseAction {
  type: 'move';
  nodes: ReadonlyArray<{
    xFrom: number;
    yFrom: number;
    xTo: number;
    yTo: number;
    node: number;
  }>;
}

export interface AddDeleteAction extends BaseAction {
  type: 'add' | 'delete';
  nodes: GraphNodeJson[];
  connections: ConnectionJson[];
}

export interface ConnectAction extends BaseAction {
  type: 'connect';
  added: ConnectionJson[];
  removed: ConnectionJson[];
}

export interface ChangeParamAction extends BaseAction {
  type: 'chgparam';
  node: number;
  before: ParamsJson;
  after: ParamsJson;
}

export type UndoAction = MoveAction | AddDeleteAction | ConnectAction | ChangeParamAction;

export type UndoStack = UndoAction[];
