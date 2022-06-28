import { Component, createMemo, Show } from 'solid-js';
import { ColorGradientEditor } from '../controls/ColorGradientEditor';
import { Graph, GraphNode } from '../graph';
import { Parameter } from '../operators';
import { ColorGradient } from '../render/colors';

interface Props {
  parameter: Parameter;
  graph: Graph;
  node: GraphNode;
}

export const ColorGradientProperty: Component<Props> = props => {
  const { parameter, graph } = props;

  const onChange = (newValue: ColorGradient) => {
    graph.setParamVal(props.node, parameter.id, newValue);
    graph.modified = true;
  };

  const value = createMemo(() => props.node.paramValues.get(parameter.id) as ColorGradient);
  return (
    <Show when={!!value}>
      {() => <ColorGradientEditor value={value()} onChange={onChange} />}
    </Show>
  );
};
