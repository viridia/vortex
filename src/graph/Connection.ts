import { InputTerminal } from './InputTerminal';
import { OutputTerminal } from './OutputTerminal';

export interface Connection {
  source: OutputTerminal;
  dest: InputTerminal;
  recalc: boolean;
}
