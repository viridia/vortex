import { Component, createSignal } from 'solid-js';
import styles from './App.module.scss';
import { PageHeader } from './header/PageHeader';
import { CatalogPanel } from './catalog/CatalogPanel';
import { PropertyPanel } from './propedit/PropertyPanel';
import { Graph } from './graph';
import { GraphView } from './graphview/GraphView';
import './global.scss';

const App: Component = () => {
  const [graph, setGraph] = createSignal(new Graph());

  document.addEventListener('keypress', e => {
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        e.stopPropagation();
        graph().deleteSelection();
    }
  });

  return (
    <main class={styles.main}>
      <section class={styles.appBody}>
        <CatalogPanel />
        <GraphView graph={graph} />
        <PropertyPanel graph={graph()} />
        {/* <ErrorDialog errorMsg={errorMessage} onClose={onCloseError} /> */}
      </section>
    </main>
  );
};

export default App;
