import { Component } from 'solid-js';
import { Graph, GraphNode } from '../graph';
import { InputTerminal } from '../graph/InputTerminal';
import { OutputTerminal } from '../graph/OutputTerminal';
import styles from './TerminalRendition.module.scss';

interface Props {
  graph: Graph;
  node: GraphNode;
  terminal: InputTerminal | OutputTerminal;
}

/** A visual representation of an input or output terminal in the graph. */
export const TerminalRendition: Component<Props> = ({ node, terminal }) => {
  const output = terminal.output;
  return (
    <div
      classList={{
        [styles.terminal]: true,
        [styles.in]: !output,
        [styles.out]: !!output,
        [styles.active]: terminal.hover,
      }}
      data-id={terminal.id}
      data-node={node.id}
      data-terminal={terminal.id}
      style={{ left: `${terminal.x}px`, top: `${terminal.y}px` }}
    >
      <div class={styles.caption}>{terminal.name}</div>
      <div class={styles.disc} />
    </div>
  );
};
