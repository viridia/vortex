import { ComboSlider } from '../controls/ComboSlider';
import { DataType, Parameter } from '../operators';
import { Graph, GraphNode } from '../graph';
import { Component, createMemo } from 'solid-js';

interface Props {
  parameter: Parameter;
  node: GraphNode;
  graph: Graph;
}

export const ScalarProperty: Component<Props> = props => {
  function onChange(value: number) {
    const { parameter, node, graph } = props;
    if (parameter.enumVals) {
      node.paramValues.set(parameter.id, parameter.enumVals[value].value);
    } else {
      node.paramValues.set(parameter.id, value);
    }
    graph.modified = true;
  }

  const { parameter, node } = props;
  let min: number = parameter.min!;
  let max: number = parameter.max !== undefined ? parameter.max : min + 1;
  if (parameter.enumVals) {
    min = 0;
    max = parameter.enumVals.length - 1;
  }

  const precision =
    parameter.type === DataType.INTEGER
      ? 0
      : parameter.precision !== undefined
      ? parameter.precision
      : 2;
  const increment =
    parameter.increment !== undefined
      ? parameter.increment
      : parameter.type === DataType.INTEGER
      ? 1
      : 10 ** -precision;

  const value = createMemo(() => {
    let result = node.paramValues.has(parameter.id)
      ? node.paramValues.get(parameter.id)
      : parameter.default !== undefined
      ? parameter.default
      : 0;
    if (parameter.enumVals) {
      result = parameter.enumVals.findIndex(e => e.value === result);
    }
    return result;
  });

  return (
    <ComboSlider
      name={parameter.name}
      value={value}
      max={max}
      min={min}
      increment={increment}
      precision={precision}
      logScale={parameter.logScale}
      enumVals={parameter.enumVals && parameter.enumVals.map(ev => ev.name)}
      onChange={onChange}
    />
  );
};
