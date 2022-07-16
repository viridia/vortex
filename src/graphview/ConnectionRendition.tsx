import { Component, createMemo, JSX, Show } from 'solid-js';
import { Connection, Terminal } from '../graph';
import { DataType } from '../operators';
import styles from './ConnectionRendition.module.scss';

export interface ConnectionProps {
  ts: Terminal | null;
  xs?: number;
  ys?: number;
  te: Terminal | null;
  xe?: number;
  ye?: number;
  pending?: boolean;
  onPointerDown?: JSX.EventHandler<SVGElement, PointerEvent>;
  onEdit?: (conn: Connection, output: boolean) => void;
}

export const ConnectionRendition: Component<ConnectionProps> = props => {
  const path = createMemo(() => {
    const { ts, xs, ys, te, xe, ye } = props;
    const x0: number = ts ? ts.x + ts.node.x + 8 : xs || 0;
    const y0: number = ts ? ts.y + ts.node.y + 8 : ys || 0;
    const x1: number = te ? te.x + te.node.x + 10 : xe || 0;
    const y1: number = te ? te.y + te.node.y + 8 : ye || 0;
    return [
      `M${x0} ${y0}`,
      `L${x0 + 5} ${y0}`,
      `C${x0 + 50} ${y0} ${x1 - 50} ${y1} ${x1 - 5} ${y1}`,
      `L${x1} ${y1}`,
    ].join(' ');
  });

  // Just a way to force Solid to re-render us when a node gets deleted.
  const isDeleted = createMemo(() => props.ts?.node.deleted || props.te?.node.deleted);
  const isVectorType = createMemo(
    () => props.ts?.node.operator.getOutput(props.ts.id).type !== DataType.FLOAT
  );
  return (
    <Show when={!isDeleted()}>
      <g
        onPointerDown={props.onPointerDown}
        classList={{ [styles.pending]: props.pending, [styles.vectorType]: isVectorType() }}
        data-source={props.ts && `${props.ts.node.id}:${props.ts.id}`}
        data-sink={props.te && `${props.te.node.id}:${props.te.id}`}
      >
        <path class={styles.shadow} d={path()} transform="translate(0, 3)" />
        <path class={styles.outline} d={path()} />
        <path class={styles.connector} d={path()} />
      </g>
    </Show>
  );
};
