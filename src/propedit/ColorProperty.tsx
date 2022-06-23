import { batch, Component, createEffect, createMemo } from 'solid-js';
import { ColorPicker } from '../controls/ColorPicker';
import { Graph, GraphNode } from '../graph';
import { Parameter } from '../operators';
import { RGBAColor } from '../render/colors';

interface Props {
  parameter: Parameter;
  node: GraphNode;
  graph: Graph;
}

export const ColorProperty: Component<Props> = ({ parameter, node, graph }) => {
  const onChange = (value: RGBAColor) => {
    batch(() => {
      node.paramValues.set(parameter.id, value);
      graph.modified = true;
    });
  };

  const color = createMemo(() => {
    return node.paramValues.has(parameter.id)
      ? node.paramValues.get(parameter.id)
      : parameter.default !== undefined
      ? parameter.default
      : [0, 0, 0, 1];
  }, [node, parameter]);

  return (
    <section>
      <ColorPicker onChange={onChange} value={color()} alpha={!parameter.noAlpha} />
    </section>
  );
};
