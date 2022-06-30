import { InputTerminal } from './InputTerminal';
import { OutputTerminal } from './OutputTerminal';

export interface Connection {
  source: OutputTerminal;
  dest: InputTerminal;
  recalc: boolean;
}

export interface ConnectionJson {
  src: [number, string];
  dst: [number, string];
}

export function connectionToJs(cn: Connection): ConnectionJson {
  return {
    src: [cn.source.node.id, cn.source.id],
    dst: [cn.dest.node.id, cn.dest.id],
  };
}
