import { DataType, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['steppers', 'triangles']);

export const triangles = defineFn({
  name: 'triangles',
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
      DataType.INTEGER,
    ],
    }),
});

class TriangleGrid extends Operator {
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
      default: 2,
    },
    {
      id: 'margin',
      name: 'Spacing',
      type: DataType.FLOAT,
      min: 0,
      max: 0.5,
      default: 0.025,
    },
    {
      id: 'roundness',
      name: 'Roundness',
      type: DataType.FLOAT,
      min: 1,
      max: 5,
      precision: 1,
      default: 1,
    },
    {
      id: 'blur',
      name: 'Blur',
      type: DataType.FLOAT,
      min: 0,
      max: 0.5,
      default: 0.1,
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
      id: 'corner',
      name: 'Corner Shape',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Sharp', value: 0 },
        { name: 'Mitered', value: 1 },
        { name: 'Smooth', value: 2 },
      ],
      default: 0,
    },
  ];
  public readonly description = `
Generates a triangular grid pattern.
* **Count X** is the number of triangles along the x-axis.
* **Count Y** is the number of triangles along the y-axis.
* **Spacing** is the space between the triangles.
* **Roundness** controls the roundness / sharpness of the tiangle corners.
* **Blur** controls the softness of the triangle edges.
* **Offset X** shifts the entire pattern along the X-axis.
* **Offset Y** shifts the entire pattern along the y-axis.
* **Corner** controls the style of the corners (sharp, round or mitered).
`;

  constructor() {
    super('pattern', 'Triangle Grid', 'pattern_trianglegrid');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    return triangles(
      refTexCoords(),
      ...this.params.map(param => refUniform(param.id, param.type, node))
    );
  }
}

export default new TriangleGrid();
