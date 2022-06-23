import { DataType, Input, Operator, Output, Parameter } from '..';
import {
  Expr,
  add,
  defineFn,
  divide,
  fork,
  getAttr,
  literal,
  multiply,
  refInput,
  refTexCoords,
  refUniform,
} from '../../render/Expr';
import { GraphNode } from '../../graph';
import { cross, normalize, vec3, vec4 } from '../../render/glIntrinsics';
import { makeFunctionType } from '../FunctionDefn';

export const dFdx = defineFn({
  name: 'dFdx',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3],
  }),
});

export const dFdy = defineFn({
  name: 'dFdy',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3],
  }),
});

class NormalMap extends Operator {
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
      id: 'scale',
      name: 'Height Scale',
      type: DataType.FLOAT,
      min: -0.5,
      max: 0.5,
      precision: 3,
      increment: 0.001,
      default: 0.2,
    },
  ];

  public readonly description = `
Treating the grayscale input as a height map, computes normals.
`;

  public getCode(node: GraphNode): Expr {
    const scale = refUniform('scale', DataType.FLOAT, node);
    const uv = fork(refTexCoords(), 'uv');
    const t = fork(refInput('in', DataType.VEC4, node, uv), 't');
    const h = fork(
      divide(
        multiply(
          add(
            add(getAttr(t, 'x', DataType.FLOAT), getAttr(t, 'y', DataType.FLOAT), DataType.FLOAT),
            getAttr(t, 'z', DataType.FLOAT),
            DataType.FLOAT
          ),
          scale,
          DataType.FLOAT
        ),
        literal('3.0', DataType.FLOAT),
        DataType.FLOAT
      ),
      'h'
    );
    const dx = dFdx(vec3(uv, h));
    const dy = dFdy(vec3(uv, h));
    const normal = normalize(cross(dx, dy));

    return vec4(
      add(
        multiply(normal, vec3(0.5, 0.5, -0.5), DataType.VEC3),
        literal('0.5', DataType.FLOAT),
        DataType.VEC3
      ),
      literal('1.0', DataType.FLOAT)
    );
  }

  constructor() {
    super('filter', 'Normal Map', 'filter_normal_map');
  }
}

export default new NormalMap();
