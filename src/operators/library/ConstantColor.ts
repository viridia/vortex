import { DataType, Operator, Output, Parameter } from '..';
import { Expr, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';

class ConstantColor extends Operator {
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.VEC4,
    },
  ];
  public readonly params: Parameter[] = [
    {
      id: 'color',
      name: 'Color',
      type: DataType.VEC4,
      editor: 'color',
      default: [1.0, 1.0, 1.0, 1.0],
    },
  ];
  public readonly description = `
A constant color.
`;

  constructor() {
    super('generator', 'Uniform Color', 'gen_color');
  }

  public getCode(node: GraphNode): Expr {
    return refUniform('color', DataType.VEC4, node);
  }
}

export default new ConstantColor();
