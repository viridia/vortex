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
}

export const CatalogPanel: Component<Props> = props => {
  const [operator, setOperator] = createSignal<Operator | null>(null);

  const onSelectOperator = (id: string) => {
    setOperator(registry.get(id));
  };

  const onAddNode = () => {
    props.graph.emit('add', operator());
  };

  return (
    <aside class={styles.panel} id="tool-panel">
      <header class={styles.header}>
        <Button class={styles.addButton} disabled={!operator()} onClick={onAddNode}>
          Add {operator()?.name ?? 'Node'}
        </Button>
      </header>
      <OperatorCatalog selected={operator} onSelect={onSelectOperator} onAdd={onAddNode} />
      <OperatorDetails operator={operator} />
    </aside>
  );
};
