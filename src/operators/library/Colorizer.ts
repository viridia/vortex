import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refInput, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['gradient-color']);

export const gradientColor = defineFn({
  name: 'gradientColor',
  type: makeFunctionType({
    result: DataType.VEC4,
    args: [DataType.FLOAT, DataType.VEC4_ARRAY, DataType.FLOAT_ARRAY],
  }),
});

class Colorizer extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
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
      id: 'color',
      name: 'Gradient color',
      type: DataType.RGBA_GRADIENT,
      max: 32,
      default: [
        {
          value: [0, 0, 0, 1],
          position: 0,
        },
        {
          value: [1, 1, 1, 1],
          position: 1,
        },
      ],
    },
  ];

  public readonly description = `Maps input value through a color gradient.`;

  constructor() {
    super('filter', 'Colorize', 'filter_colorize');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    return gradientColor(
      refInput('in', DataType.FLOAT, node, refTexCoords()),
      refUniform('color_colors', DataType.VEC4_ARRAY, node),
      refUniform('color_positions', DataType.FLOAT_ARRAY, node)
    );
  }
}

export default new Colorizer();
