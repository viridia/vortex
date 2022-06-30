import { Component, createEffect, createSignal, Index } from 'solid-js';
import { Button } from '../controls/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../controls/Modal';
import { Graph, GraphNode } from '../graph';
import { clipboard, path, dialog, fs } from '@tauri-apps/api';
import styles from './ShaderSourceDialog.module.scss';
import { getDefaultDir } from '../lib/defaultDir';

interface Props {
  graph: Graph;
  node: GraphNode;
  open: boolean;
  onClose: () => void;
}

export const ShaderSourceDialog: Component<Props> = props => {
  const [source, setSource] = createSignal('');

  createEffect(() => {
    setSource(props.node.source);
  });

  const onCopy = () => {
    clipboard.writeText(source());
  };

  const onExport = async () => {
    const defaultPath = props.graph.path
      ? await path.dirname(props.graph.path)
      : getDefaultDir();
    const saveResult = await dialog.save({
      defaultPath: await path.join(defaultPath, `${props.node.name.replace(' ', '_')}.txt`),
      filters: [
        {
          name: 'Shader Source Files',
          extensions: ['txt', 'glsl'],
        },
      ],
    });
    const savePath = Array.isArray(saveResult) ? saveResult[0] : saveResult;
    if (savePath) {
      fs.writeTextFile(savePath, source());
    }
  };

  return (
    <Modal open={props.open} onClose={props.onClose} ariaLabel="Shader source">
      <ModalHeader>
        Generated shader code for {props.node.operator.name}:{props.node.id}
      </ModalHeader>
      <ModalBody>
        <section classList={{ [styles.scroll]: true, 'rounded-scrollbars': true }}>
          <table class={styles.table}>
            <tbody>
              <Index each={source().split('\n')}>
                {(line, i) => (
                  <tr>
                    <td class={styles.index}>{i + 1}</td>
                    <td class={styles.text}>
                      {line}
                      {'\n'}
                    </td>
                  </tr>
                )}
              </Index>
            </tbody>
          </table>
        </section>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onExport}>
          Export as&hellip;
        </Button>
        <Button onClick={onCopy}>
          Copy to Clipboard
        </Button>
        <Button onClick={props.onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};
