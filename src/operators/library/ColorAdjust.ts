import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refInput, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['hsv', 'color-adjust']);

export const colorAdjust = defineFn({
  name: 'colorAdjust',
  type: makeFunctionType({
    result: DataType.VEC4,
    args: [DataType.VEC4, DataType.FLOAT, DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
  }),
});

class ColorAdjust extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
      type: DataType.VEC4,
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
      id: 'contrast',
      name: 'Contrast',
      type: DataType.FLOAT,
      min: -1,
      max: 1,
      default: 0,
      precision: 2,
    },
    {
      id: 'brightness',
      name: 'Brightness',
      type: DataType.FLOAT,
      min: -1,
      max: 1,
      default: 0,
      precision: 2,
    },
    {
      id: 'hue',
      name: 'Hue',
      type: DataType.FLOAT,
      min: -1,
      max: 1,
      default: 0,
      precision: 2,
    },
    {
      id: 'saturation',
      name: 'Saturation',
      type: DataType.FLOAT,
      min: -2,
      max: 2,
      default: 0,
      precision: 1,
    },
  ];

  public readonly description = `Adjust colors.`;

  constructor() {
    super('filter', 'Color Adjust', 'filter_color_adjust');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    return colorAdjust(
      refInput('in', DataType.VEC4, node, refTexCoords()),
      ...this.params.map(param => refUniform(param.id, param.type, node))
    );
  }
}

export default new ColorAdjust();
