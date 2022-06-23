import { Component, createSignal } from 'solid-js';
import { Operator } from '../operators';
import { registry } from '../operators/Registry';
import styles from './CatalogPanel.module.scss';
import { OperatorCatalog } from './OperatorCatalog';
import { OperatorDetails } from './OperatorDetails';

export const CatalogPanel: Component = () => {
  const [operator, setOperator] = createSignal<Operator | null>(null);

  const onSelectOperator = (id: string) => {
    setOperator(registry.get(id));
  };

  return (
    <aside class={styles.panel} id="tool-panel">
      <section class={styles.note}>Drag an operator to the graph:</section>
      <OperatorCatalog selected={operator} onSelect={onSelectOperator} />
      <OperatorDetails operator={operator} />
    </aside>
  );
};
