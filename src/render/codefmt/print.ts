import { OutputChunk } from './OutputChunk';
import { PrintStream } from './PrintStream';

interface PrintOptions {
  maxWidth?: number;
  initialIndent?: number;
}

export function printToString(chunk: OutputChunk | OutputChunk[], options: PrintOptions = {}) {
  const ps = new PrintStream();
  ps.setMaxLineLength(options.maxWidth ?? 100);
  ps.setNextLineIndent(options.initialIndent ?? 0);
  ps.breakLine();
  if (Array.isArray(chunk)) {
    let first = true;
    chunk.forEach(ch => {
      if (!first) {
        ps.append('\n');
      }
      emit(ps, ch);
      first = false;
    });
  } else {
    emit(ps, chunk);
  }
  ps.breakLine();
  return ps.toString();
}

export function emit(out: PrintStream, chunk: OutputChunk | string) {
  if (typeof chunk === 'string' || out.canFit(chunkLength(chunk))) {
    // No need for break, line will fit
    out.append(flatten(chunk));
  } else {
    const saveIndent = out.getNextLineIndent();
    switch (chunk.kind) {
      case 'parens':
        out.append('(');
        greedyWrap(out, chunk.fragments);
        out.append(')');
        break;

      case 'brackets':
        out.append('[');
        greedyWrap(out, chunk.fragments);
        out.append(']');
        break;

      case 'fcall': {
        const { fn, args } = chunk;
        out.append(`${fn}(`);

        // If the call only has one argument, and the argument will fit if broken,
        // then don't break, let the argument break instead.
        if (args.length === 1 && out.canFit(chunkHeadLength(args[0]))) {
          emit(out, args[0]);
          out.append(')');
          break;
        }

        args.forEach((arg, index) => {
          if (args.length > 1) {
            out.setNextLineIndent(saveIndent + 1);
            out.breakLine();
          }
          emit(out, arg);
          if (index < args.length - 1) {
            out.append(', ');
          }
        });
        out.setNextLineIndent(saveIndent);
        if (args.length > 1) {
          out.breakLine();
        }
        out.append(')');
        break;
      }

      case 'flat':
        greedyWrap(out, chunk.fragments);
        break;

      case 'infix': {
        const { fn, args } = chunk;

        // Special case where 1st argument and operator and part of second argument can
        // fit on one line.
        if (args.length === 2 && out.canFit(chunkLength(args[0]) + 3 + chunkHeadLength(args[1]))) {
          emit(out, args[0]);
          out.append(` ${fn} `);
          emit(out, args[1]);
          break;
        }

        args.forEach((arg, index) => {
          if (index > 0) {
            out.append(` ${fn} `);
          }
          if (!out.sticky && !out.canFit(chunkLength(arg))) {
            out.setNextLineIndent(saveIndent + 1);
            out.breakLine();
          }
          emit(out, arg);
        });
        out.setNextLineIndent(saveIndent);
        break;
      }

      case 'ret':
        out.append('return ');
        out.sticky = true;
        greedyWrap(out, chunk.fragments);
        out.append(';');
        break;

      case 'stmt':
        greedyWrap(out, chunk.fragments);
        out.append(';');
        break;

      case 'lit':
        out.append(chunk.fragments);
        break;
    }
  }
}

// Greedy line-breaking algorithm - tries to fit as much into the current line as possible.
function greedyWrap(out: PrintStream, fragments: (OutputChunk | string)[]) {
  const saveIndent = out.getNextLineIndent();
  fragments.forEach((fragment, index) => {
    if (out.canFit(chunkLength(fragment))) {
      out.append(flatten(fragment));
    } else if (typeof fragment === 'string' && !out.sticky) {
      if (index > 0) {
        out.setNextLineIndent(saveIndent + 1);
      }
      out.breakLine();
      out.append(fragment);
    } else {
      emit(out, fragment);
    }
  });
  out.setNextLineIndent(saveIndent);
}

function chunkLength(chunk: string | OutputChunk | (OutputChunk | string)[]): number {
  if (typeof chunk === 'string') {
    return chunk.length;
  } else if (Array.isArray(chunk)) {
    return chunk.reduce((acc: number, elt) => {
      return acc + chunkLength(elt);
    }, 0);
  } else {
    switch (chunk.kind) {
      case 'parens':
        return chunkLength(chunk.fragments) + 2;

      case 'brackets':
        return chunkLength(chunk.fragments) + 2 * chunk.fragments.length;

      case 'fcall':
        return chunk.fn.length + chunkLength(chunk.args) + 2 * chunk.args.length;

      case 'flat':
        return chunkLength(chunk.fragments);

      case 'infix': {
        return chunkLength(chunk.args) + (chunk.args.length - 1) * (chunk.fn.length + 2);
      }

      case 'ret':
        return chunkLength(chunk.fragments) + 'return '.length;

      case 'stmt':
        return chunkLength(chunk.fragments);

      case 'lit':
        return chunk.fragments.length;
    }
  }
}

function chunkHeadLength(chunk: OutputChunk | OutputChunk[]): number {
  if (Array.isArray(chunk)) {
    return chunkLength(chunk[0]);
  } else {
    switch (chunk.kind) {
      case 'parens':
      case 'brackets':
        return 1;

      case 'fcall':
        return chunk.fn.length + 1;

      case 'flat':
        return chunkLength(chunk.fragments);

      case 'infix': {
        return chunkLength(chunk.args[0]) + chunk.fn.length;
      }

      case 'ret':
        return 'return '.length + chunkHeadLength(chunk.fragments);

      case 'stmt':
        return chunkHeadLength(chunk.fragments);

      case 'lit':
        return chunk.fragments.length;
    }
  }
}

function flatten(chunk: string | OutputChunk | OutputChunk[]): string {
  if (typeof chunk === 'string') {
    return chunk;
  } else if (Array.isArray(chunk)) {
    return chunk.map(flatten).join('');
  } else {
    switch (chunk.kind) {
      case 'parens':
        return ['(', ...flatten(chunk.fragments), ')'].join('');

      case 'brackets':
        return ['[', chunk.fragments.map(frag => flatten(frag)).join(', '), ']'].join('');

      case 'fcall': {
        return [chunk.fn, '(', chunk.args.map(flatten).join(', '), ')'].join('');
      }

      case 'flat':
        return chunk.fragments.map(flatten).join('');

      case 'infix': {
        return chunk.args.map(flatten).join(` ${chunk.fn} `);
      }

      case 'ret': {
        return 'return ' + chunk.fragments.map(flatten).join('') + ';';
      }

      case 'stmt': {
        return chunk.fragments.map(flatten).join('') + ';';
      }

      case 'lit':
        return chunk.fragments;
    }
  }
}
