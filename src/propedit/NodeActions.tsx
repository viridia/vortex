import { Component, createEffect, createSignal } from 'solid-js';
import { Button } from '../controls/Button';
import { ButtonGroup } from '../controls/ButtonGroup';
import { Graph, GraphNode } from '../graph';
import lockImg from '../images/lock.png';
import { ExportImageModal } from './ExportImageModal';
import styles from './NodeActions.module.scss';
import { ShaderSourceDialog } from './ShaderSourceDialog';

interface Props {
  graph: Graph;
  node: GraphNode;
  tiling: number;
  onSetTiling: (tiling: number) => void;
  locked: boolean;
  onLock: (lock: boolean) => void;
}

export const NodeActions: Component<Props> = props => {
  const [showSource, setShowSource] = createSignal(false);
  const [showExport, setShowExport] = createSignal(false);

  function setRepeat(repeat: number) {
    props.onSetTiling(repeat);
  }

  return (
    <section class={styles.nodeActions}>
      <ButtonGroup>
        <Button classList={{ selected: props.tiling === 1 }} onClick={() => setRepeat(1)}>
          1x1
        </Button>
        <Button classList={{ selected: props.tiling === 2 }} onClick={() => setRepeat(2)}>
          2x2
        </Button>
        <Button classList={{ selected: props.tiling === 3 }} onClick={() => setRepeat(3)}>
          3x3
        </Button>
      </ButtonGroup>
      <div class="spacer" />
      <Button
        classList={{ selected: props.locked }}
        onClick={() => {
          props.onLock(!props.locked);
        }}
      >
        <img class="lock" src={lockImg} width="12" style={{ opacity: 0.6 }} alt="Lock" />
      </Button>
      <div class="spacer" />
      <Button
        onClick={() => {
          setShowSource(true);
        }}
      >
        Source&hellip;
      </Button>
      <Button
        onClick={() => {
          setShowExport(true);
        }}
      >
        Export&hellip;
      </Button>
      <ShaderSourceDialog
        open={showSource()}
        onClose={() => {
          setShowSource(false);
        }}
        node={props.node}
        graph={props.graph}
      />
      <ExportImageModal
        node={props.node}
        graph={props.graph}
        open={showExport()}
        onClose={() => {
          setShowExport(false);
        }}
      />
    </section>
  );
};
