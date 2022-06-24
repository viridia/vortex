import { Component, createSignal } from 'solid-js';
import { Button } from '../controls/Button';
import { Graph, GraphNode, quantize } from '../graph';
import { Operator } from '../operators';
import { registry } from '../operators/Registry';
import styles from './CatalogPanel.module.scss';
import { OperatorCatalog } from './OperatorCatalog';
import { OperatorDetails } from './OperatorDetails';

interface Props {
  graph: Graph;
  graphElt: HTMLDivElement;
}

export const CatalogPanel: Component<Props> = props => {
  const [operator, setOperator] = createSignal<Operator | null>(null);

  const onSelectOperator = (id: string) => {
    setOperator(registry.get(id));
  };

  const onAddNode = () => {
    const gr = props.graph;
    gr.clearSelection();
    const node = new GraphNode(operator(), gr.nextId());
    const rect = props.graphElt.getBoundingClientRect();
    const bounds = gr.bounds;
    node.x = quantize(bounds.xMin + rect.width * 0.5 + props.graphElt.scrollLeft - 45);
    node.y = quantize(bounds.yMin + rect.height * 0.5 + props.graphElt.scrollTop - 60);
    node.selected = true;
    gr.add(node);
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
