import { Component, createMemo, For } from 'solid-js';
import { Bounds, Graph, GraphNode } from '../graph';
import { RenderedImage } from '../render/RenderedImage';
import { TerminalRendition } from './TerminalRendition';
import styles from './NodeRendition.module.scss';

interface Props {
  node: GraphNode;
  graph: Graph;
  selectionRect: Bounds | null;
}

const NODE_WIDTH = 94;
const NODE_HEIGHT = 120;

/** A visual representation of a node in the graph. */
export const NodeRendition: Component<Props> = props => {
  const { node, graph } = props;
  const style = createMemo(() => ({
    left: `${node.x}px`,
    top: `${node.y}px`,
  }));

  const selected = createMemo(() => {
    const rect = props.selectionRect;
    return (
      rect &&
      node.x < rect.xMax &&
      node.y < rect.yMax &&
      node.x + NODE_WIDTH > rect.xMin &&
      node.y + NODE_HEIGHT > rect.yMin
    );
  });

  return (
    <div
      classList={{ [styles.node]: true, [styles.selected]: node.selected || selected() }}
      data-node={node.id}
      style={style()}
    >
      <div class={styles.body}>
        <div class={styles.header}>{node.name}</div>
        <div class={styles.preview}>
          <RenderedImage width={64} height={64} node={node} />
        </div>
        {node.error && <div class={styles.errorBadge}>!</div>}
      </div>
      <For each={node.inputs ?? []}>
        {input => <TerminalRendition node={node} graph={graph} terminal={input} />}
      </For>
      <For each={node.outputs ?? []}>
        {output => <TerminalRendition node={node} graph={graph} terminal={output} />}
      </For>
    </div>
  );
};
