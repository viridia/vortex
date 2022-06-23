import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr, defineFn, fork, refInput, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['mask']);

export const mask = defineFn({
  name: 'mask',
  type: makeFunctionType({
    result: DataType.VEC4,
    args: [DataType.VEC4, DataType.VEC4, DataType.FLOAT, DataType.INTEGER],
  }),
});

class Mask extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'a',
      name: 'A',
      type: DataType.VEC4,
    },
    {
      id: 'b',
      name: 'B',
      type: DataType.VEC4,
    },
    {
      id: 'mask',
      name: 'Mask',
      type: DataType.FLOAT,
    },
  ];
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.VEC4,
    },
  ];
  public readonly params: Parameter[] = [
    {
      id: 'invert',
      name: 'Invert',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Off', value: 0 },
        { name: 'On', value: 1 },
      ],
      default: 0,
    },
  ];
  public readonly description = `
Blends two source images based on a grayscale mask.
`;

  constructor() {
    super('filter', 'Mask', 'filter_mask');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    const tuv = fork(refTexCoords(), 'uv');
    return mask(
      refInput('a', DataType.VEC4, node, tuv),
      refInput('b', DataType.VEC4, node, tuv),
      refInput('mask', DataType.FLOAT, node, tuv),
      refUniform('invert', DataType.INTEGER, node)
    );
  }
}

export default new Mask();
