import { DataType, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['steppers', 'permute', 'pnoise', 'periodic-noise2']);

export const noise2 = defineFn({
  name: 'periodicNoise2',
  type: makeFunctionType({
    result: DataType.FLOAT,
    args: [
      DataType.VEC2,
      DataType.INTEGER,
      DataType.INTEGER,
      DataType.FLOAT,
      DataType.INTEGER,
      DataType.INTEGER,
      DataType.FLOAT,
    ],
  }),
});

class Noise extends Operator {
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
      max: 200,
      precision: 1,
      increment: 0.1,
      default: 0,
    },
    {
      id: 'start_band',
      name: 'Start Band',
      type: DataType.INTEGER,
      min: 1,
      max: 12,
      default: 1,
    },
    {
      id: 'end_band',
      name: 'End Band',
      type: DataType.INTEGER,
      min: 1,
      max: 12,
      default: 8,
    },
    {
      id: 'roughness',
      name: 'Roughness',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      default: 0.5,
      precision: 2,
    },
  ];
  public readonly description = `
Generates a periodic Perlin noise texture.
* **Scale X** is the overall scaling factor along the x-axis.
* **Scale Y** is the overall scaling factor along the y-axis.
* **Z Offset** is the z-coordinate within the 3D noise space.
* **Start Band** and **End Band** control the range of frequency bands. Each band represents
  one octave of noise.
* **Persistance** determines the amplitude falloff from one frequencey band to the next.
`;

  constructor() {
    super('generator', 'Noise', 'gen_noise');
  }

  public getCode(node: GraphNode): Expr {
    return noise2(
      refTexCoords(),
      ...this.params.map(param => refUniform(param.id, param.type, node))
    );
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }
}

export default new Noise();
