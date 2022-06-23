import opDragImg from '../images/opdrag.png';
import { Operator } from '../operators';
import { registry } from '../operators/Registry';
import { Component, createSelector, For } from 'solid-js';
import styles from './OperatorCatalog.module.scss';

interface Props {
  selected: () => Operator | null;
  onSelect: (id: string) => void;
}

const img = document.createElement('img');
img.src = opDragImg;

export const OperatorCatalog: Component<Props> = ({ selected, onSelect }) => {
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
              onClick={e => {
                e.preventDefault();
                onSelect(op.id);
              }}
              onDragStart={(e: DragEvent) => {
                e.dataTransfer.dropEffect = 'copy';
                e.dataTransfer.setDragImage(img, 45, 60);
                e.dataTransfer.setData('application/x-vortex-operator', `${op.id}`);
              }}
              draggable={true}
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
