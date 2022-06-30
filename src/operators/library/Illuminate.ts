import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr, defineFn, fork, refInput, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['illuminate']);

export const illuminate = defineFn({
  name: 'illuminate',
  type: makeFunctionType({
    result: DataType.VEC4,
    args: [
      DataType.VEC4,
      DataType.VEC4,
      DataType.VEC3,
      DataType.FLOAT,
      DataType.VEC4,
      DataType.VEC4,
      DataType.VEC4,
    ],
  }),
});

class Illuminate extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
      type: DataType.VEC4,
    },
    {
      id: 'normal',
      name: 'Normal',
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
      id: 'azimuth',
      name: 'Azimuth',
      type: DataType.FLOAT,
      min: 0,
      max: 360,
      precision: 0,
      increment: 1,
      default: 45,
      pre: true,
    },
    {
      id: 'elevation',
      name: 'Elevation',
      type: DataType.FLOAT,
      min: 0,
      max: 90,
      precision: 0,
      increment: 1,
      default: 45,
      pre: true,
    },
    {
      id: 'lightDir',
      name: 'Light Direction',
      type: DataType.VEC3,
      default: [0.5, 0.5, 0.5, 1.0],
      computed: node => {
        const a: number = (node.paramValues.get('azimuth') as number * -Math.PI) / 180;
        const e: number = (node.paramValues.get('elevation') as number * Math.PI) / 180;
        return [Math.sin(a) * Math.cos(e), Math.cos(a) * Math.cos(e), Math.sin(e)];
      },
    },
    {
      id: 'shininess',
      name: 'Shininess',
      type: DataType.FLOAT,
      min: 1,
      max: 100,
      precision: 0,
      increment: 1,
      default: 10,
    },
    {
      id: 'ambient',
      name: 'Ambient Color',
      type: DataType.VEC4,
      editor: 'color',
      noAlpha: true,
      default: [0.0, 0.0, 0.0, 1.0],
    },
    {
      id: 'diffuse',
      name: 'Diffuse Color',
      type: DataType.VEC4,
      editor: 'color',
      noAlpha: true,
      default: [0.5, 0.5, 0.5, 1.0],
    },
    {
      id: 'specular',
      name: 'Specular Color',
      type: DataType.VEC4,
      editor: 'color',
      noAlpha: true,
      default: [0.5, 0.5, 0.5, 1.0],
    },
  ];

  public readonly description = `
Illuminate the input texture.
* **Azimuth** and **Elevation** control the direction of the light source.
* **Shininess** controls the falloff for the specular highlight.
* **Ambient Color** lights all surfaces regardless of their orientation.
* **Diffuse Color** only lights surfaces oriented towards the light source.
* **Specular Color** affects the color of the specular highlight.
`;

  constructor() {
    super('filter', 'Illuminate', 'filter_illuminate');
  }

  public getImports(_node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    const tuv = fork(refTexCoords(), 'uv');
    return illuminate(
      refInput('in', DataType.VEC4, node, tuv),
      refInput('normal', DataType.VEC4, node, tuv),
      ...this.uniformParamList.map(param => refUniform(param.id, param.type, node))
    );
  }
}

export default new Illuminate();
