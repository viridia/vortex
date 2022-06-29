import { printToString } from './print';
import { flat, parens, fcall, infix, stmt, lit } from './OutputChunk';
import { describe, test, expect } from 'vitest';

const x = lit('x');
const y = lit('y');
const z = lit('z');
const assign = lit(' = ');

describe('print', () => {
  test('flat', () => {
    expect(printToString(flat(';'), { maxWidth: 16 })).toBe(`;`);
    expect(printToString(flat(x, assign, y, ';'), { maxWidth: 16 })).toBe(`x = y;`);
  });

  test('parens', () => {
    expect(printToString(parens(x), { maxWidth: 16 })).toBe(`(x)`);
    expect(printToString(parens(x, assign, y), { maxWidth: 16 })).toBe(`(x = y)`);
  });

  test('fcall', () => {
    expect(printToString(fcall('x', []), { maxWidth: 16 })).toBe(`x()`);
    expect(printToString(fcall('x', [y, y, z]), { maxWidth: 16 })).toBe(`x(y, y, z)`);
  });

  test('infix', () => {
    expect(printToString(infix('+', x), { maxWidth: 16 })).toBe(`x`);
    expect(printToString(infix('+', x, y, z), { maxWidth: 16 })).toBe(`x + y + z`);
    expect(printToString(infix('+', lit('x123456789'), lit('y123456789')), { maxWidth: 16 })).toBe(
      `x123456789 +
  y123456789`
    );
  });

  test('fcall', () => {
    expect(printToString(stmt(x), { maxWidth: 16 })).toBe(`x;`);
  });
});
