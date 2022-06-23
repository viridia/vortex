import { Component, createMemo, For } from 'solid-js';
import { Graph, GraphNode } from '../graph';
import { RenderedImage } from '../render/RenderedImage';
import { TerminalRendition } from './TerminalRendition';
import styles from './NodeRendition.module.scss';

interface Props {
  node: GraphNode;
  graph: Graph;
}

/** A visual representation of a node in the graph. */
export const NodeRendition: Component<Props> = ({ node, graph }) => {
  const style = createMemo(() => ({
    left: `${node.x - graph.bounds.xMin}px`,
    top: `${node.y - graph.bounds.yMin}px`,
  }));

  return (
    <div
      classList={{ [styles.node]: true, [styles.selected]: node.selected }}
      data-node={node.id}
      style={style()}
    >
      <div class={styles.body}>
        <div class={styles.header}>{node.name}</div>
        <div class={styles.preview}>
          <RenderedImage width={80} height={80} node={node} />
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
