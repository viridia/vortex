export interface ICallOptions {
  isHook?: boolean;
  isIdempotent?: boolean;
}

/** Line-wrapping styles:

    * flat - prefer to break in as few places as possible.
*/
export type OutputChunk =
  | { kind: 'parens' | 'brackets'; fragments: OutputChunk[] }
  | { kind: 'flat'; fragments: (OutputChunk | string)[] }
  | { kind: 'stmt' | 'ret'; fragments: OutputChunk[] }
  | { kind: 'lit'; fragments: string }
  | {
      kind: 'infix';
      fn: string;
      args: OutputChunk[];
      precedence?: number;
    }
  | {
      kind: 'fcall';
      fn: string;
      args: OutputChunk[];
      opts: ICallOptions;
    };

export const parens = (...fragments: OutputChunk[]): OutputChunk => ({
  kind: 'parens',
  fragments,
});

export const brackets = (...fragments: OutputChunk[]): OutputChunk => ({
  kind: 'brackets',
  fragments,
});

export const flat = (...fragments: (OutputChunk | string)[]): OutputChunk => ({
  kind: 'flat',
  fragments,
});

export const fcall = (fn: string, args: OutputChunk[], opts: ICallOptions = {}): OutputChunk => ({
  kind: 'fcall',
  fn,
  args,
  opts,
});

export const infix = (fn: string, ...args: OutputChunk[]): OutputChunk => ({
  kind: 'infix',
  fn,
  args,
});

export const stmt = (arg: OutputChunk): OutputChunk => ({
  kind: 'stmt',
  fragments: [arg],
});

export const ret = (arg: OutputChunk): OutputChunk => ({
  kind: 'ret',
  fragments: [arg],
});

export const lit = (text: string): OutputChunk => ({
  kind: 'lit',
  fragments: text,
});
