import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr, literal, refInput, refTexCoords, subtract } from '../../render/Expr';
import { GraphNode } from '../../graph';

const IMPORTS = new Set(['modulus']);

class Invert extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'input',
      name: 'In',
      type: DataType.FLOAT,
    },
  ];
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.FLOAT,
    },
  ];
  public readonly params: Parameter[] = [];
  public readonly description = `
Inverts the colors of a grayscale image - white becomes black and vice versa.
`;

  constructor() {
    super('filter', 'Invert', 'filter_invert');
  }

  public getImports(_node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    return subtract(
      literal('1.', DataType.FLOAT),
      refInput('input', DataType.FLOAT, node, refTexCoords()),
      DataType.FLOAT
    );
  }
}

export default new Invert();
