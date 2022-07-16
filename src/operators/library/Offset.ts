import { DataType, Input, Operator, Output, Parameter } from '..';
import {
  Expr,
  fork,
  getAttr,
  refInput,
  refTexCoords,
  refUniform,
  subtract,
} from '../../render/Expr';
import { GraphNode } from '../../graph';
import { fract, vec2 } from '../../render/glIntrinsics';

class Offset extends Operator {
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
      id: 'offset_x',
      name: 'Offset X',
      type: DataType.FLOAT,
      min: -1,
      max: 1,
      default: 0,
      precision: 2,
    },
    {
      id: 'offset_y',
      name: 'Offset Y',
      type: DataType.FLOAT,
      min: -1,
      max: 1,
      default: 0,
      precision: 2,
    },
  ];

  public readonly description = `Offsets the pattern in the x and y direction.`;

  constructor() {
    super('transform', 'Offset', 'transform_offset');
  }

  public getCode(node: GraphNode): Expr {
    const tuv = fork(refTexCoords(), 'uv');
    const offsetX = refUniform('offset_x', DataType.FLOAT, node);
    const offsetY = refUniform('offset_y', DataType.FLOAT, node);
    const ruv = vec2(
      fract(subtract(getAttr(tuv, 'x', DataType.FLOAT), offsetX, DataType.FLOAT)),
      fract(subtract(getAttr(tuv, 'y', DataType.FLOAT), offsetY, DataType.FLOAT))
    );
    return refInput('in', DataType.FLOAT, node, ruv);
  }
}

export default new Offset();
