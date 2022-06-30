import { DataType, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['steppers', 'permute', 'pnoise', 'periodic-noise']);

const noise2Turbo = defineFn({
  name: 'periodicNoiseTurbulence',
  type: makeFunctionType({
    result: DataType.FLOAT,
    args: [
      DataType.VEC2,
      DataType.INTEGER,
      DataType.INTEGER,
      DataType.FLOAT,
      DataType.INTEGER,
      DataType.FLOAT,
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
      max: 32,
      default: 1,
    },
    {
      id: 'scale_y',
      name: 'Scale Y',
      type: DataType.INTEGER,
      min: 1,
      max: 32,
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
      id: 'num_octaves',
      name: 'Octaves',
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
    {
      id: 'turbulence',
      name: 'Turbulence',
      type: DataType.FLOAT,
      min: 0,
      max: 4,
      default: 0,
      precision: 2,
    },
  ];
  public readonly description = `
Generates a periodic Perlin noise texture.
* **Scale X** is the overall scaling factor along the x-axis.
* **Scale Y** is the overall scaling factor along the y-axis.
* **Z Offset** is the z-coordinate within the 3D noise space.
* **Octaves** is the number of octaves of noise to generate.
* **Persistance** determines the amplitude falloff from one octave to the next.
* **Turbulance** distorts the noise coordinate space using a secondary noise signal.
`;

  constructor() {
    super('generator', 'Noise', 'gen_noise');
  }

  public getCode(node: GraphNode): Expr {
    return noise2Turbo(
      refTexCoords(),
      ...this.params.map(param => refUniform(param.id, param.type, node))
    );
  }

  public getImports(_node: GraphNode): Set<string> {
    return IMPORTS;
  }
}

export default new Noise();
