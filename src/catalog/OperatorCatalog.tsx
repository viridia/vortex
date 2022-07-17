// import opDragImg from '../images/opdrag.png';
import { Component, createSelector, For } from 'solid-js';
import { Operator } from '../operators';
import { registry } from '../operators/Registry';
import styles from './OperatorCatalog.module.scss';

interface Props {
  selected: () => Operator | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onStartDrag: (x: number, y: number, pointerId: number) => void;
}

export const OperatorCatalog: Component<Props> = ({ selected, onSelect, onAdd, onStartDrag }) => {
  const opList = registry.list.map(
    (op: Operator) => [op.group, op.name, op] as [string, string, Operator]
  );
  opList.sort();

  const isSelected = createSelector(selected);
  return (
    <section class={styles.catalog} classList={{ 'rounded-scrollbars': true }}>
      <For each={opList}>
        {([group, name, op]) => {
          return (
            <div
              classList={{ [styles.row]: true, [styles.selected]: isSelected(op) }}
              data-id={`${op.id}`}
              onPointerDown={e => {
                if (e.button === 0) {
                  e.preventDefault();
                  onSelect(op.id);
                  onStartDrag(e.x, e.y, e.pointerId);
                }
              }}
              onDblClick={e => {
                onAdd();
              }}
            >
              <div class={styles.rowGroup}>{group}</div>
              <div class={styles.rowName}>{name}</div>
            </div>
          );
        }}
      </For>
      <div />
    </section>
  );
};
