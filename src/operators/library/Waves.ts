import { DataType, Operator, Output, Parameter } from '..';
import { Expr, defineFn, refTexCoords, refUniform } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['waves']);

export const waves = defineFn({
  name: 'waves',
  type: makeFunctionType({
    result: DataType.FLOAT,
    args: [
      DataType.VEC2,
      DataType.INTEGER,
      DataType.INTEGER,
      DataType.FLOAT,
      DataType.INTEGER,
      DataType.INTEGER,
      DataType.FLOAT,
      DataType.INTEGER,
      DataType.INTEGER,
      DataType.FLOAT,
      DataType.FLOAT,
    ],
  }),
});

class Waves extends Operator {
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.FLOAT,
    },
  ];

  public readonly params: Parameter[] = [
    {
      id: '0',
      name: 'Wave source 1',
      type: DataType.GROUP,
      children: [
        {
          id: 'fx0',
          name: 'X Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 1,
        },
        {
          id: 'fy0',
          name: 'Y Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 0,
        },
        {
          id: 'phase0',
          name: 'Phase',
          type: DataType.FLOAT,
          min: 0,
          max: 1,
          precision: 2,
          increment: 0.01,
          default: 0,
        },
      ],
    },
    {
      id: '1',
      name: 'Wave source 2',
      type: DataType.GROUP,
      children: [
        {
          id: 'fx1',
          name: 'X Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 0,
        },
        {
          id: 'fy1',
          name: 'Y Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 0,
        },
        {
          id: 'phase1',
          name: 'Phase',
          type: DataType.FLOAT,
          min: 0,
          max: 1,
          precision: 2,
          increment: 0.01,
          default: 0,
        },
      ],
    },
    {
      id: '0',
      name: 'Wave source 3',
      type: DataType.GROUP,
      children: [
        {
          id: 'fx2',
          name: 'X Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 1,
        },
        {
          id: 'fy2',
          name: 'Y Frequency',
          type: DataType.INTEGER,
          min: -20,
          max: 20,
          default: 0,
        },
        {
          id: 'phase2',
          name: 'Phase',
          type: DataType.FLOAT,
          min: 0,
          max: 1,
          precision: 2,
          increment: 0.01,
          default: 0,
        },
      ],
    },
    {
      id: 'amplitude',
      name: 'Amplitude',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      default: 0.5,
      precision: 2,
    },
  ];
  public readonly description = `
Sums together up to three wave generators.
`;

  constructor() {
    super('generator', 'Waves', 'gen_waves');
  }

  public getImports(_node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    return waves(
      refTexCoords(),
      refUniform('fx0', DataType.INTEGER, node),
      refUniform('fy0', DataType.INTEGER, node),
      refUniform('phase0', DataType.FLOAT, node),
      refUniform('fx1', DataType.INTEGER, node),
      refUniform('fy1', DataType.INTEGER, node),
      refUniform('phase1', DataType.FLOAT, node),
      refUniform('fx2', DataType.INTEGER, node),
      refUniform('fy2', DataType.INTEGER, node),
      refUniform('phase2', DataType.FLOAT, node),
      refUniform('amplitude', DataType.FLOAT, node)
    );
  }
}

export default new Waves();
