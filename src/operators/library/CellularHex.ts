import { DataType, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['permute', 'cellular_hex']);

export const cellular = defineFn({
  name: 'cellularHex',
  type: makeFunctionType({
    result: DataType.FLOAT,
    args: [
      DataType.VEC2,
      DataType.INTEGER,
      DataType.INTEGER,
      DataType.FLOAT,
      DataType.FLOAT,
      DataType.FLOAT,
      DataType.INTEGER,
    ],
  }),
});

class Cellular extends Operator {
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.FLOAT,
    },
  ];

  public readonly params: Parameter[] = [
    {
      id: 'scale_x',
      name: 'Scale X',
      type: DataType.INTEGER,
      min: 1,
      max: 100,
      default: 1,
    },
    {
      id: 'scale_y',
      name: 'Scale Y',
      type: DataType.INTEGER,
      min: 1,
      max: 100,
      default: 1,
    },
    {
      id: 'offset_z',
      name: 'Z Offset',
      type: DataType.FLOAT,
      min: 0,
      max: 10,
      precision: 2,
      increment: 0.05,
      default: 0,
    },
    {
      id: 'jitter',
      name: 'Jitter',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      precision: 2,
      increment: 0.01,
      default: 1,
    },
    {
      id: 'scale_value',
      name: 'Value Scale',
      type: DataType.FLOAT,
      min: 0.01,
      max: 2,
      default: 1,
      precision: 2,
    },
    {
      id: 'func',
      name: 'Function',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'F1', value: 0 },
        { name: 'F2', value: 1 },
        { name: 'F2 - F1', value: 2 },
      ],
      default: 0,
    },
  ];
  public readonly description = `
Generates a periodic Worley noise texture in a hexagonal pattern.
* **Scale X** is the number of cells along the x-axis.
* **Scale Y** is the number of cells along the y-axis.
* **Offset Z** is the z-coordinate in the 3D noise space.
* **Jitter** controls the amount of randomness in determining cell center positions.
* **Value Scale** is a multiplier on the output.
* **Function** controls how the color is computed using the distance to the cell center point:
  * **F1** is the distance to the nearest cell center point.
  * **F2** is the distance to the *second* nearest cell center point.
  * **F2 - F1** is the difference between those two distances.
`;

  constructor() {
    super('generator', 'Cellular Hexagons', 'gen_cellularhex');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    return cellular(
      refTexCoords(),
      ...this.params.map(param => refUniform(param.id, param.type, node))
    );
  }
}

export default new Cellular();
