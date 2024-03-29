import { Component, createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import styles from './App.module.scss';
import { appWindow, PhysicalPosition, PhysicalSize } from '@tauri-apps/api/window';
import { CatalogPanel } from './catalog/CatalogPanel';
import { PropertyPanel } from './propedit/PropertyPanel';
import { Graph } from './graph';
import { GraphView } from './graphview/GraphView';
import { dialog, invoke } from '@tauri-apps/api';
import { dirname } from '@tauri-apps/api/path';
import { readTextFile, writeFile } from '@tauri-apps/api/fs';
import { settingsManager } from './Settings';
import { getDefaultDir, setDefaultDir } from './lib/defaultDir';
import path from 'path';
import './global.scss';
import { AboutDialog } from './About';
import { useDragNode } from './catalog/useDragNode';
import { NodeRendition } from './graphview/NodeRendition';

const LOCAL_STORAGE_KEY = 'current-graph';

const App: Component = () => {
  const [graph, setGraph] = createSignal(new Graph());
  const [openAbout, setOpenAbout] = createSignal(false);
  let graphElt: HTMLDivElement;

  const json = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (json) {
    try {
      graph().fromJs(JSON.parse(json));
    } catch (e) {
      console.error(e); // Swallow error.
    }
  }

  onMount(() => {
    settingsManager.initialize().then(async () => {
      const windowSize = settingsManager.getCache('windowSize');
      if (Array.isArray(windowSize)) {
        const [width, height] = windowSize;
        await appWindow.setSize(new PhysicalSize(width, height));
      }

      const windowPosition = settingsManager.getCache('windowPosition');
      if (Array.isArray(windowPosition)) {
        const [x, y] = windowPosition;
        await appWindow.setPosition(new PhysicalPosition(x, y));
      }

      invoke('show_main_window');
    });
  });

  const { dragNode, onStartDrag, onCancelDrag, ...dragMethods } = useDragNode({
    graph,
  });

  document.addEventListener('keypress', e => {
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        e.stopPropagation();
        graph().deleteSelection();
        break;

      case 'Escape':
        if (dragNode()) {
          e.preventDefault();
          e.stopPropagation();
          onCancelDrag();
        }
        break;
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
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gr.toJs()));
  }

  createEffect(() => {
    const unlisten1 = appWindow.listen('tauri://menu', async ({ payload }) => {
      const gr = graph();
      switch (payload) {
        case 'about': {
          setOpenAbout(true);
          break;
        }

        case 'new': {
          if (gr.modified) {
            // Prompt save
          }
          gr.dispose();
          setGraph(new Graph());
          localStorage.removeItem(LOCAL_STORAGE_KEY);
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
              g.fromJs(parsed);
              localStorage.setItem(LOCAL_STORAGE_KEY, json);
              setGraph(g);
              gr.dispose();
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

        case 'undo': {
          gr.undo();
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gr.toJs()));
          break;
        }

        case 'redo': {
          gr.redo();
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gr.toJs()));
          break;
        }

        default: {
          console.warn('unhandled window action', payload);
          break;
        }
      }
    });

    const unlisten2 = appWindow.listen<PhysicalSize>('tauri://resize', ({ payload }) => {
      if (payload.width > 0 && payload.height > 0) {
        settingsManager.setCache('windowSize', [payload.width, payload.height]);
      }
    });

    const unlisten3 = appWindow.listen<PhysicalPosition>('tauri://move', ({ payload }) => {
      settingsManager.setCache('windowPosition', [payload.x, payload.y]);
    });

    const unlisten4 = appWindow.listen('tauri://close-requested', async () => {
      await settingsManager.syncCache();
      await appWindow.close();
    });

    onCleanup(async () => {
      // This runs on a hot reload, we want to make sure we don't double-subscribe.
      (await unlisten1)();
      (await unlisten2)();
      (await unlisten3)();
      (await unlisten4)();
    });
  });

  // Maintain a copy of the graph in local storage in case we reload the page.
  createEffect(() => {
    const gr = graph();
    if (gr) {
      onCleanup(
        gr.subscribe('changed', () => {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gr.toJs()));
        })
      );
    }
  });

  return (
    <main class={styles.main}>
      <section {...dragMethods} class={styles.appBody}>
        <Show when={dragNode()}>
          {node => <NodeRendition node={node} graph={graph()} selectionRect={null} />}
        </Show>
        <CatalogPanel graph={graph()} onStartDrag={onStartDrag} />
        <GraphView graph={graph()} ref={graphElt} />
        <PropertyPanel graph={graph()} />
      </section>
      <AboutDialog open={openAbout()} onClose={() => setOpenAbout(false)} />
    </main>
  );
};

export default App;
