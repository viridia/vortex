import { Component, createEffect, createSignal } from 'solid-js';
import styles from './App.module.scss';
import { appWindow } from '@tauri-apps/api/window';
import { CatalogPanel } from './catalog/CatalogPanel';
import { PropertyPanel } from './propedit/PropertyPanel';
import { Graph } from './graph';
import { GraphView } from './graphview/GraphView';
import { open, save } from '@tauri-apps/api/dialog';
import { documentDir, dirname } from '@tauri-apps/api/path';
import { readTextFile, writeFile } from '@tauri-apps/api/fs';

import './global.scss';
import { registry } from './operators/Registry';

let saveDir = await documentDir();

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

  async function doSaveAs() {
    const filePath = await save({
      defaultPath: saveDir,
      filters: [
        {
          name: 'Vortex Graph',
          extensions: ['vtx'],
        },
      ],
    });
    if (filePath) {
      saveDir = await dirname(filePath)
      graph().path = filePath;
      doSave();
    }
  }

  async function doSave() {
    const gr = graph();
    await writeFile(gr.path, JSON.stringify(gr.asJson));
    gr.modified = false;
  }

  createEffect(() => {
    appWindow.listen('tauri://menu', async ({ event, payload }) => {
      const gr = graph();
      switch (payload) {
        case 'new': {
          if (gr.modified) {
            // Prompt save
          }
          gr.dispose();
          setGraph(new Graph());
          break;
        }

        case 'open': {
          if (gr.modified) {
            // Prompt save
          }
          const openResult = await open({
            defaultPath: saveDir,
            multiple: false,
            filters: [
              {
                name: 'Vortex Graph',
                extensions: ['vtx'],
              },
            ],
          });
          const filePath = Array.isArray(openResult) ? openResult[0] : openResult;
          if (filePath) {
            saveDir = await dirname(filePath)
            const json = await readTextFile(filePath);
            if (json) {
              const parsed = JSON.parse(json);
              const g = new Graph();
              g.path = filePath;
              g.fromJs(parsed, registry);
              setGraph(g);
            }
          }
          break;
        }

        case 'save': {
          if (!gr.path) {
            doSaveAs();
          } else {
            doSave();
          }
          break;
        }

        case 'saveas': {
          doSaveAs();
          break;
        }
      }
    });
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
