import { Button } from '../controls/Button';
import { Graph, GraphNode } from '../graph';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../controls/Modal';
import { RenderedImage } from '../render/RenderedImage';
import { Component, createSignal, For } from 'solid-js';
import styles from './ExportImageModal.module.scss';
import { getDefaultDir } from '../lib/defaultDir';
import { dialog, fs, path } from '@tauri-apps/api';

const SIZES = [64, 128, 256, 512, 1024, 2048];

interface Props {
  open: boolean;
  onClose: () => void;
  graph: Graph;
  node: GraphNode;
}

export const ExportImageModal: Component<Props> = props => {
  const [size, setSize] = createSignal(512);
  let canvasRef: HTMLCanvasElement;

  const onExport = async () => {
    if (canvasRef) {
      const defaultPath = props.graph.path ? await path.dirname(props.graph.path) : getDefaultDir();
      const saveResult = await dialog.save({
        defaultPath: await path.join(defaultPath, `${props.node.name.replace(' ', '_')}.png`),
        filters: [
          {
            name: 'PNG image',
            extensions: ['png'],
          },
        ],
      });
      const savePath = Array.isArray(saveResult) ? saveResult[0] : saveResult;
      if (savePath) {
        canvasRef.toBlob(async imgData => {
          fs.writeBinaryFile(savePath, new Uint8Array(await imgData.arrayBuffer()));
        });
      }
    }
  };

  const onChangeSize = (e: any) => {
    setSize(Number(e.target.value));
  };

  return (
    <Modal open={props.open} onClose={props.onClose} ariaLabel="Export image">
      <ModalHeader>
        Generated image for {props.node.operator.name}:{props.node.id}
      </ModalHeader>
      <ModalBody classList={{ [styles.dialogBody]: true, 'rounded-scrollbars': true }}>
        <RenderedImage
          node={props.node}
          width={size()}
          height={size()}
          canvasRef={elt => {
            canvasRef = elt;
          }}
        />
      </ModalBody>
      <ModalFooter>
        <select onChange={onChangeSize} value={size()}>
          <For each={SIZES}>
            {sz => {
              const ss = sz.toString();
              return (
                <option value={ss}>
                  {ss} x {ss}
                </option>
              );
            }}
          </For>
        </select>
        <Button onClick={props.onClose}>Close</Button>
        <Button onClick={onExport} disabled={!canvasRef}>
          Export As&hellip;
        </Button>
      </ModalFooter>
    </Modal>
  );
};
