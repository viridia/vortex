import { DataType, Input, Operator, Output, Parameter } from '..';
import {
  Expr,
  defineFn,
  fork,
  refInput,
  refTexCoords,
  refUniform,
  add,
  subtract,
  literal,
} from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';
import { smoothstep } from './SmoothStep';

const IMPORTS = new Set<string>();

export const length = defineFn({
  name: 'length',
  type: makeFunctionType({
    result: DataType.FLOAT,
    args: [DataType.VEC4],
  }),
});

class ColorKey extends Operator {
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
      type: DataType.FLOAT,
    },
  ];

  public readonly params: Parameter[] = [
    {
      id: 'color',
      name: 'Key Color',
      type: DataType.VEC4,
      editor: 'color',
      noAlpha: true,
      default: [0.0, 0.0, 0.0, 1.0],
    },
    {
      id: 'tolerance',
      name: 'Tolerance',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      precision: 2,
      increment: 0.01,
      default: 0.1,
    },
    {
      id: 'soft',
      name: 'Softness',
      type: DataType.FLOAT,
      min: 0,
      max: 0.5,
      precision: 2,
      increment: 0.01,
      default: 0,
    },
  ];

  public readonly description = `
Detects when the input color is equal to the key color.
* **Key Color** is the color we want to detect.
* **Threshold** is how close the input color needs to be in order to be detected.
* **Softness** determines whether the detection threshold is hard or soft.
`;

  constructor() {
    super('filter', 'Color Key', 'filter_color_key');
  }

  public getImports(_node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    const tuv = fork(refTexCoords(), 'uv');
    const inputColor = refInput('in', DataType.VEC4, node, tuv);
    const keyColor = refUniform('color', DataType.VEC4, node);
    const tolerance = refUniform('tolerance', DataType.FLOAT, node);
    const soft = refUniform('soft', DataType.FLOAT, node);

    return subtract(
      literal('1.', DataType.FLOAT),
      smoothstep(
        subtract(tolerance, soft, DataType.FLOAT),
        add(tolerance, soft, DataType.FLOAT),
        length(subtract(inputColor, keyColor, DataType.VEC4))
      ),
      DataType.FLOAT
    );
  }
}

export default new ColorKey();
