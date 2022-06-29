import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refInput, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['modulus']);

export const modulus = defineFn({
  name: 'modulus',
  type: makeFunctionType({
    result: DataType.FLOAT,
    args: [DataType.FLOAT, DataType.INTEGER, DataType.FLOAT, DataType.FLOAT],
  }),
});

class Modulus extends Operator {
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
      type: DataType.VEC4,
    },
  ];
  public readonly params: Parameter[] = [
    {
      id: 'frequency',
      name: 'Frequency',
      type: DataType.INTEGER,
      min: 1,
      max: 100,
      default: 2,
    },
    {
      id: 'offset',
      name: 'Offset',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      precision: 2,
      increment: 0.01,
      default: 0,
    },
    {
      id: 'phase',
      name: 'Phase',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      precision: 2,
      increment: 0.01,
      default: 1,
    },
  ];
  public readonly description = `
Performs a modulus operation on the input. A monotonically increasing input signal will be
converted into a sequence of sawtooth waves.
* **frequency** - indicates how often the input value should repeat.
* **offset** - amount to be added to the value before applying the mod operator.
* **phase** - used to control where the 'peak' of the output is within the interval. Setting
  the value to 1 produces a sawtooth wave, while setting it to .5 will produce a triangle wave.
`;

  constructor() {
    super('filter', 'Modulus', 'filter_modulus');
  }

  public getImports(_node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    return modulus(
      refInput('input', DataType.FLOAT, node, refTexCoords()),
      ...this.params.map(param => refUniform(param.id, param.type, node))
    );
  }
}

export default new Modulus();
