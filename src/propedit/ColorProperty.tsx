import { batch, Component, createMemo } from 'solid-js';
import { ColorPicker } from '../controls/ColorPicker';
import { Graph, GraphNode } from '../graph';
import { Parameter } from '../operators';
import { RGBAColor } from '../render/colors';

interface Props {
  parameter: Parameter;
  node: GraphNode;
  graph: Graph;
}

export const ColorProperty: Component<Props> = (props) => {
  const onChange = (value: RGBAColor) => {
    batch(() => {
      const { parameter, node, graph } = props;
      graph.setParamVal(node, parameter.id, value);
      graph.modified = true;
    });
  };

  const color = createMemo(() => {
    const { parameter, node } = props;
    return node.paramValues.has(parameter.id)
      ? node.paramValues.get(parameter.id)
      : parameter.default !== undefined
      ? parameter.default
      : [0, 0, 0, 1];
  });

  return (
    <section>
      <ColorPicker onChange={onChange} value={color()} alpha={!props.parameter.noAlpha} />
    </section>
  );
};
