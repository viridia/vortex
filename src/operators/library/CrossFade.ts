import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';
import { vec4 } from '../../render/glIntrinsics';

const IMPORTS = new Set(['crossfade']);

export const crossfade = defineFn({
  name: 'crossfade',
  type: makeFunctionType({
    result: DataType.VEC4,
    args: [DataType.IMAGE, DataType.FLOAT, DataType.FLOAT, DataType.VEC2],
  }),
});

class CrossFade extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'in',
      name: 'In',
      type: DataType.VEC4,
      buffered: true,
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
      id: 'x_overlap',
      name: 'X Overlap',
      type: DataType.FLOAT,
      min: 0,
      max: 100,
      default: 20,
      precision: 1,
    },
    {
      id: 'y_overlap',
      name: 'Y Overlap',
      type: DataType.FLOAT,
      min: 0,
      max: 100,
      default: 20,
      precision: 1,
    },
  ];

  public readonly description = `Makes non-repeating images repeatable by cross-fading edges.`;

  constructor() {
    super('transform', 'Cross-Fade', 'transform_cross_fade');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    if (!node.getInputTerminal('in').connection) {
      return vec4(0.5, 0.5, 0.5, 1);
    }
    return crossfade(
      refUniform('in', DataType.IMAGE, node),
      refUniform('x_overlap', DataType.FLOAT, node),
      refUniform('y_overlap', DataType.FLOAT, node),
      refTexCoords()
    );
  }
}

export default new CrossFade();
