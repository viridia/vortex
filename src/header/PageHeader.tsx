import { Component } from 'solid-js';
import styles from './PageHeader.module.scss';
import vortexImg from '../images/vortex.png';

export const PageHeader: Component = () => {
  const modified = false;
  // const modified = graph.modified;

  return (
    <header class={styles.pageHeader}>
      <img class={styles.logo} src={vortexImg} alt="Vortex" />
      <div classList={{ [styles.title]: true, modified }}>Vortex</div>
      <div class={styles.docName}>-</div>
      {/* <GraphNameInput graph={graph} />
      <GraphActions graph={graph} docId={docId} onSave={onClickSave} onNew={onNew} /> */}
    </header>
  );
};
