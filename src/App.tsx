import { Component, createEffect, createSignal } from 'solid-js';
import styles from './App.module.scss';
import { appWindow, PhysicalPosition, PhysicalSize } from '@tauri-apps/api/window';
import { CatalogPanel } from './catalog/CatalogPanel';
import { PropertyPanel } from './propedit/PropertyPanel';
import { Graph } from './graph';
import { GraphView } from './graphview/GraphView';
import { dialog } from '@tauri-apps/api';
import { documentDir, dirname } from '@tauri-apps/api/path';
import { readTextFile, writeFile } from '@tauri-apps/api/fs';

import './global.scss';
import { registry } from './operators/Registry';
import { settingsManager } from './Settings';
import { getDefaultDir, setDefaultDir } from './lib/defaultDir';
import path from 'path';

const App: Component = () => {
  const [graph, setGraph] = createSignal(new Graph());
  const [graphElt, setGraphElt] = createSignal<HTMLDivElement>();

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
    const filePath = await dialog.save({
      defaultPath: graph().path ? await path.dirname(graph().path) : getDefaultDir(),
      filters: [
        {
          name: 'Vortex Graph',
          extensions: ['vtx'],
        },
      ],
    });
    if (filePath) {
      setDefaultDir(await dirname(filePath));
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
          const openResult = await dialog.open({
            defaultPath: getDefaultDir(),
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
            setDefaultDir(await dirname(filePath));
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

        case 'selectall': {
          gr.selectAll();
          break;
        }
      }
    });

    appWindow.listen<PhysicalSize>('tauri://resize', ({ payload }) => {
      // console.log(payload);
      if (payload.width > 0 && payload.height > 0) {
        settingsManager.setCache('windowSize', [payload.width, payload.height]);
        // console.log(settingsManager.getCache('windowSize'));
      }
    });

    appWindow.listen<PhysicalPosition>('tauri://move', ({ payload }) => {
      settingsManager.setCache('windowPosition', [payload.x, payload.y]);
    });

    appWindow.listen('tauri://close-requested', async () => {
      await settingsManager.syncCache();
      await appWindow.close();
    });
  });

  return (
    <main class={styles.main}>
      <section class={styles.appBody}>
        <CatalogPanel graph={graph()} graphElt={graphElt()} />
        <GraphView graph={graph()} ref={setGraphElt} />
        <PropertyPanel graph={graph()} />
        {/* <ErrorDialog errorMsg={errorMessage} onClose={onCloseError} /> */}
      </section>
    </main>
  );
};

export default App;
