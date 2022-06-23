import { DataType, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['steppers', 'hexgrid']);

export const hexgrid = defineFn({
  name: 'hexgrid',
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

class HexGrid extends Operator {
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
      name: 'Margin',
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
Generates a tiled pattern of hexagons.
* **Count X** number of hexagons in the X direction.
* **Count Y** number of hexagons in the Y direction.
* **Margin** controls spacing between hexagons.
* **Roundness** controls roundness of hexagon corners.
* **Blur** controls softness of hexagon edges.
* **Offset X** shifts the whole pattern in the X direction.
* **Offset Y** shifts the whole pattern in the Y direction.
* **Corner Shape** allows sharp, mitered or rounded corners.
`;

  constructor() {
    super('pattern', 'Hex Grid', 'pattern_hexgrid');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    return hexgrid(
      refTexCoords(),
      ...this.params.map(param => refUniform(param.id, param.type, node))
    );
  }
}

export default new HexGrid();
