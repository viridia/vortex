import { DataType, Parameter } from '../operators';
import { Graph, GraphNode } from '../graph';
import { Component, createMemo, createSignal, For } from 'solid-js';
import { Menu, MenuItem, Popover, PopoverButton, PopoverPanel } from 'solid-headless';
import styles from './EnumProperty.module.scss';

interface Props {
  parameter: Parameter;
  node: GraphNode;
  graph: Graph;
}

export const EnumProperty: Component<Props> = props => {
  function onChange(value: number) {
    props.graph.setParamVal(props.node, props.parameter.id, value);
    props.graph.modified = true;
  }

  const value = createMemo(() => {
    const { parameter, node } = props;
    let result = node.paramValues.has(parameter.id)
      ? node.paramValues.get(parameter.id)
      : parameter.default !== undefined
      ? parameter.default
      : 0;
    if (parameter.enumVals) {
      result = parameter.enumVals.find(e => e.value === result)?.name ?? result;
    }
    return result;
  });

  return (
    <Popover class={styles.enumProp}>
      {({ setState }) => (
        <>
          <PopoverButton class={styles.button}>
            <span class={styles.name}>{props.parameter.name}:</span>
            <span class={styles.value}>{value()}</span>
            <span class={styles.spacer} />
            <span class={styles.arrow}>&#9660;</span>
          </PopoverButton>
          <PopoverPanel class={styles.drop}>
            <Menu>
              <For each={props.parameter.enumVals}>
                {ev => (
                  <MenuItem
                    class={styles.item}
                    onClick={() => {
                      onChange(ev.value);
                      setState(false);
                    }}
                  >
                    {ev.name}
                  </MenuItem>
                )}
              </For>
            </Menu>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};
