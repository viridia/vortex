import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refTexCoords, refUniform } from '../../render/Expr';
import { vec4 } from '../../render/glIntrinsics';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['blur']);

export const blur = defineFn({
  name: 'blur',
  type: makeFunctionType({
    result: DataType.VEC4,
    args: [DataType.IMAGE, DataType.FLOAT, DataType.VEC2],
  }),
});

class Blur extends Operator {
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
      id: 'radius',
      name: 'Radius',
      type: DataType.FLOAT,
      min: 0.01,
      max: 0.1,
      default: 0.05,
    },
  ];

  public readonly description = `
Gaussian blur operator.

**Caution**: This operator is fairly slow. There are faster blur algorithms, however this one is
designed to scale with the size of the input, which requires a large amount of sampling.
`;

  constructor() {
    super('filter', 'Blur', 'filter_blur');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    if (!node.getInputTerminal('in').connection) {
      return vec4(.5, .5, .5, 1);
    }

    return blur(
        refUniform('in', DataType.IMAGE, node),
        refUniform('radius', DataType.FLOAT, node),
        refTexCoords()
      );
  }
}

export default new Blur();
