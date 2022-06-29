import { DataType, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['gradient-color', 'gradient']);

export const colorGradient = defineFn({
  name: 'gradient',
  type: makeFunctionType({
    result: DataType.VEC4,
    args: [DataType.VEC2, DataType.INTEGER, DataType.VEC4_ARRAY, DataType.FLOAT_ARRAY],
  }),
});

class ColorGradientMapper extends Operator {
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.VEC4,
    },
  ];
  public readonly params: Parameter[] = [
    {
      id: 'type',
      name: 'Gradient Type',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Linear Horizontal', value: 0 },
        { name: 'Linear Vertical', value: 1 },
        { name: 'Symmetric Horizontal', value: 2 },
        { name: 'Symmetric Vertical', value: 3 },
        { name: 'Radial', value: 4 },
        { name: 'Square', value: 5 },
      ],
      default: 0,
    },
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
  public readonly description = `
Generates a simple gradient.
`;

  constructor() {
    super('generator', 'Color Gradient', 'generator_gradient');
  }

  public getImports(_node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    return colorGradient(
      refTexCoords(),
      refUniform('type', DataType.INTEGER, node),
      refUniform('color_colors', DataType.VEC4_ARRAY, node),
      refUniform('color_positions', DataType.FLOAT_ARRAY, node)
    );
  }
}

export default new ColorGradientMapper();
