import { Component, createSignal } from 'solid-js';
import { Button } from '../controls/Button';
import { Graph } from '../graph';
import { Operator } from '../operators';
import { registry } from '../operators/Registry';
import styles from './CatalogPanel.module.scss';
import { OperatorCatalog } from './OperatorCatalog';
import { OperatorDetails } from './OperatorDetails';

interface Props {
  graph: Graph;
  onStartDrag: (x: number, y: number, op: Operator, elt: HTMLDivElement, pointerId: number) => void;
}

export const CatalogPanel: Component<Props> = props => {
  let ref: HTMLDivElement;
  const [operator, setOperator] = createSignal<Operator | null>(null);

  const onSelectOperator = (id: string) => {
    setOperator(registry.get(id));
  };

  const onAddNode = () => {
    props.graph.emit('add', operator());
  };

  return (
    <aside class={styles.panel} id="tool-panel" ref={ref}>
      <header class={styles.header}>
        <Button class={styles.addButton} disabled={!operator()} onClick={onAddNode}>
          Add {operator()?.name ?? 'Node'}
        </Button>
      </header>
      <OperatorCatalog
        selected={operator}
        onSelect={onSelectOperator}
        onAdd={onAddNode}
        onStartDrag={(x, y, pointerId) => props.onStartDrag(x, y, operator(), ref, pointerId)}
      />
      <OperatorDetails operator={operator} />
    </aside>
  );
};
