import { DataType, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['steppers', 'bricks']);

export const bricks = defineFn({
  name: 'bricks',
  type: makeFunctionType({
    result: DataType.FLOAT,
    args: [
      DataType.VEC2,
      DataType.INTEGER,
      DataType.INTEGER,
      DataType.FLOAT,
      DataType.FLOAT,
      DataType.FLOAT,
      DataType.FLOAT,
      DataType.FLOAT,
      DataType.FLOAT,
      DataType.FLOAT,
      DataType.INTEGER,
    ],
  }),
});

class Bricks extends Operator {
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.FLOAT,
    },
  ];
  public readonly params: Parameter[] = [
    {
      id: 'count_x',
      name: 'Count X',
      type: DataType.INTEGER,
      min: 1,
      max: 16,
      default: 2,
    },
    {
      id: 'count_y',
      name: 'Count Y',
      type: DataType.INTEGER,
      min: 1,
      max: 16,
      default: 4,
    },
    {
      id: 'spacing_x',
      name: 'Spacing X',
      type: DataType.FLOAT,
      min: 0,
      max: 0.5,
      default: 0.025,
    },
    {
      id: 'spacing_y',
      name: 'Spacing Y',
      type: DataType.FLOAT,
      min: 0,
      max: 0.5,
      default: 0.05,
    },
    {
      id: 'blur_x',
      name: 'Blur X',
      type: DataType.FLOAT,
      min: 0,
      max: 0.5,
      default: 0.1,
    },
    {
      id: 'blur_y',
      name: 'Blur Y',
      type: DataType.FLOAT,
      min: 0,
      max: 0.5,
      default: 0.2,
    },
    {
      id: 'offset_x',
      name: 'Offset X',
      type: DataType.FLOAT,
      min: 0,
      max: 0.5,
    },
    {
      id: 'offset_y',
      name: 'Offset Y',
      type: DataType.FLOAT,
      min: 0,
      max: 0.5,
    },
    {
      id: 'stagger',
      name: 'Stagger',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      default: 0.5,
    },
    {
      id: 'corner',
      name: 'Corner Shape',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Square', value: 0 },
        { name: 'Mitered', value: 1 },
        { name: 'Rounded', value: 2 },
      ],
      default: 0,
    },
  ];
  public readonly description = `
Generates a pattern consisting of alternating rows of bricks.
* **Count X** is the number of bricks along the x-axis.
* **Count Y** is the number of bricks along the y-axis.
* **Spacing X** is the horizontal space between bricks.
* **Spacing Y** is the vertical space between bricks.
* **Blur X** controls the softness of the brick edges in the x direction.
* **Blur Y** controls the softness of the brick edges in the y direction.
* **Offset X** shifts the entire pattern along the X-axis.
* **Offset Y** shifts the entire pattern along the y-axis.
* **Stagger** controls how much the even rows of bricks should be offset relative to the odd rows.
* **Corner** controls the style of the corners (square, round or mitered).
`;

  constructor() {
    super('pattern', 'Bricks', 'pattern_bricks');
  }

  public getImports(_node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    return bricks(
      refTexCoords(),
      ...this.params.map(param => refUniform(param.id, param.type, node))
    );
  }
}

export default new Bricks();
