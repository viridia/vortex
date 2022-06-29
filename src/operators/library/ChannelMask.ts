import { DataType, Input, Operator, Output, Parameter } from '..';
import { Expr, defineFn, fork, refInput, refTexCoords } from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';

const IMPORTS = new Set(['channel_mask']);

export const channelMask = defineFn({
  name: 'channel_mask',
  type: makeFunctionType({
    result: DataType.VEC4,
    args: [DataType.VEC4, DataType.VEC4, DataType.VEC4, DataType.VEC4, DataType.VEC4],
  }),
});

class ChannelMask extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'base',
      name: 'Base',
      type: DataType.VEC4,
    },
    {
      id: 'r',
      name: 'R',
      type: DataType.VEC4,
    },
    {
      id: 'g',
      name: 'G',
      type: DataType.VEC4,
    },
    {
      id: 'b',
      name: 'B',
      type: DataType.VEC4,
    },
    {
      id: 'mask',
      name: 'Mask',
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
  public readonly params: Parameter[] = [];
  public readonly description = `
Blends three source images based on an RGB mask.
`;

  constructor() {
    super('filter', 'Channel Mask', 'filter_channel_mask');
  }

  public getImports(_node: GraphNode): Set<string> {
    return IMPORTS;
  }

  public getCode(node: GraphNode): Expr {
    const tuv = fork(refTexCoords(), 'uv');
    return channelMask(
      refInput('base', DataType.VEC4, node, tuv),
      refInput('r', DataType.VEC4, node, tuv),
      refInput('g', DataType.VEC4, node, tuv),
      refInput('b', DataType.VEC4, node, tuv),
      refInput('mask', DataType.VEC4, node, tuv)
    );
  }
}

export default new ChannelMask();
