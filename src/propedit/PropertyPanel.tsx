import { Component, createMemo, createSignal, Show } from 'solid-js';
import { Graph, GraphNode } from '../graph';
import { PropertyEditor } from './PropertyEditor';
import styles from './PropertyPanel.module.scss';
import { RenderedImage } from '../render/RenderedImage';
import { NodeActions } from './NodeActions';

interface Props {
  graph: Graph;
}

export const PropertyPanel: Component<Props> = (props) => {
  const [lockedNode, setLockedNode] = createSignal<GraphNode | null>(null);
  const [tiling, setTiling] = createSignal(1);

  const selectedNode = createMemo(() => (props.graph.selection.length === 1 ? props.graph.selection[0] : null));
  const previewNode = createMemo(() => lockedNode() || selectedNode());

  return (
    <aside classList={{ [styles.panel]: true }} id="property-panel">
      <Show when={selectedNode()}>
        {node => (
          <>
            <PropertyEditor graph={props.graph} node={node} />
            <NodeActions
              graph={props.graph}
              node={node}
              locked={lockedNode() !== null}
              tiling={tiling()}
              onSetTiling={setTiling}
              onLock={lock => {
                if (lock) {
                  setLockedNode(selectedNode());
                } else {
                  setLockedNode(null);
                }
              }}
            />
          </>
        )}
      </Show>
      <Show when={selectedNode()}>
        {node => (
          <Show
            when={node.error}
            fallback={
              <RenderedImage
                class={styles.imagePreview}
                node={previewNode()}
                width={320}
                height={320}
                tiling={tiling()}
              />
            }
          >
            <div class={styles.errorDisplay} classList={{ 'rounded-scrollbars': true }}>
              {node.error}
            </div>
          </Show>
        )}
      </Show>
    </aside>
  );
};
