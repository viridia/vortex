import { Component, createEffect, createSignal, Index } from 'solid-js';
import { Button } from '../controls/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../controls/Modal';
import { GraphNode } from '../graph';
import { clipboard } from '@tauri-apps/api';
import styles from './ShaderSourceDialog.module.scss';

interface Props {
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

  const onExport = () => {
    // TODO
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
        <Button onClick={onExport} disabled>
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
