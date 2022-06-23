import { DataType, Input, Operator, Output, Parameter } from '..';
import {
  Expr,
  fork,
  getAttr,
  multiply,
  refInput,
  refTexCoords,
  refUniform,
} from '../../render/Expr';
import { GraphNode } from '../../graph';
import { fract, vec2 } from '../../render/glIntrinsics';

class Repeat extends Operator {
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
  ];

  public readonly description = `Produces a tiled copy of the input.`;

  constructor() {
    super('transform', 'Repeat', 'transform_repeat');
  }

  public getCode(node: GraphNode): Expr {
    const tuv = fork(refTexCoords(), 'uv');
    const countX = refUniform('count_x', DataType.INTEGER, node);
    const countY = refUniform('count_y', DataType.INTEGER, node);
    const ruv = vec2(
      fract(multiply(getAttr(tuv, 'x', DataType.FLOAT), countX, DataType.FLOAT)),
      fract(multiply(getAttr(tuv, 'y', DataType.FLOAT), countY, DataType.FLOAT))
    );
    return refInput('in', DataType.FLOAT, node, ruv);
  }
}

export default new Repeat();
