import { printToString } from './print';
import { flat, parens, fcall, infix, stmt, lit } from './OutputChunk';

const x = lit('x');
const y = lit('y');
const z = lit('z');
const assign = lit(' = ');

describe('print', () => {
  test('flat', () => {
    expect(printToString(flat(';'), 16)).toBe(`;`);
    expect(printToString(flat(x, assign, y, ';'), 16)).toBe(`x = y;`);
  });

  test('parens', () => {
    expect(printToString(parens(x), 16)).toBe(`(x)`);
    expect(printToString(parens(x, assign, y), 16)).toBe(`(x = y)`);
  });

  test('fcall', () => {
    expect(printToString(fcall('x', []), 16)).toBe(`x()`);
    expect(printToString(fcall('x', [y, y, z]), 16)).toBe(`x(y, y, z)`);
  });

  test('infix', () => {
    expect(printToString(infix('+', x), 16)).toBe(`x`);
    expect(printToString(infix('+', x, y, z), 16)).toBe(`x + y + z`);
    expect(
      printToString(infix('+', lit('x123456789'), lit('y123456789')), 16)
    ).toBe(
      `x123456789 +
  y123456789`
    );
  });

  test('fcall', () => {
    expect(printToString(stmt(x), 16)).toBe(`x;`);
  });
});
