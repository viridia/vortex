import { Button } from '../controls/Button';
import { GraphNode } from '../graph';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../controls/Modal';
import { RenderedImage } from '../render/RenderedImage';
import { Component, createSignal, For } from 'solid-js';
import styles from './ExportImageModal.module.scss';

// TODO
// const Select = styled.select`
//   height: 32px;
//   padding: 0 12px;
//   border-radius: 4;
//   border: 1px solid ${colors.buttonBorderColor};
//   background-image: ${colors.buttonBg};
//   outline: none;
// `;

const SIZES = [64, 128, 256, 512, 1024, 2048];

interface Props {
  open: boolean;
  onClose: () => void;
  node: GraphNode;
}

export const ExportImageModal: Component<Props> = props => {
  // const image = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = createSignal(512);

  // TODO
  const onClickExport = () => {
  //     image.current?.toBlob(img => {
  //       if (img) {
  //         download(img, `${node.name}-${node.id}.png`, 'image/png');
  //       }
  //     }, 'image/png');
  };

  const onChangeSize = (e: any) => {
    setSize(Number(e.target.value));
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      ariaLabel="Export image"
    >
      <ModalHeader>
        Generated image for {props.node.operator.name}:{props.node.id}
      </ModalHeader>
      <ModalBody classList={{ [styles.dialogBody]: true, 'rounded-scrollbars': true }}>
        <RenderedImage node={props.node} width={size()} height={size()} />
        {/* <RenderedImage node={node} width={size()} height={size()} ref={image} /> */}
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
        <Button onClick={onClickExport} disabled>
          Export As&hellip;
        </Button>
      </ModalFooter>
    </Modal>
  );
};
