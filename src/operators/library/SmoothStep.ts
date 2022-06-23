import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refInput, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['steppers']);

export const linear = defineFn({
  name: 'linearstep',
  type: makeFunctionType({
    result: DataType.FLOAT,
    args: [DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
  }),
});

export const smoothstep = defineFn({
  name: 'smoothstep',
  type: makeFunctionType({
    result: DataType.FLOAT,
    args: [DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
  }),
});

export const smootherstep = defineFn({
  name: 'smootherstep',
  type: makeFunctionType({
    result: DataType.FLOAT,
    args: [DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
  }),
});

class Smooth extends Operator {
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
  public readonly params: Parameter[] = [
    {
      id: 'function',
      name: 'Function',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Linear', value: 0 },
        { name: 'Smoothstep', value: 1 },
        { name: 'Smootherstep', value: 2 },
      ],
      default: 1,
      pre: true,
    },
    {
      id: 'lower',
      name: 'Lower threshold',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      precision: 2,
      increment: 0.01,
      default: 0,
    },
    {
      id: 'upper',
      name: 'Upper threshold',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      precision: 2,
      increment: 0.01,
      default: 1,
    },
  ];
  public readonly description = `
Perform Hermite interpolation between two values.
* **Function** - indicates the desired type of smoothing.
* **low** - the lower threshold.
* **high** - the upper threshold.
`;

  constructor() {
    super('filter', 'Smoothstep', 'filter_smoothstep');
  }

  public getImports(node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    const input = refInput('input', DataType.FLOAT, node, refTexCoords());
    const lower = refUniform('lower', DataType.FLOAT, node);
    const upper = refUniform('upper', DataType.FLOAT, node);
    const fn = node.paramValues.get('function');

    if (fn === 0) {
      return linear(lower, upper, input);
    } else if (fn === 1) {
      return smoothstep(lower, upper, input);
    } else {
      return smootherstep(lower, upper, input);
    }
  }
}

export default new Smooth();
