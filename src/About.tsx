import { Component } from 'solid-js';
import { Button } from './controls/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './controls/Modal';
import { getVersion, getTauriVersion } from '@tauri-apps/api/app';

const version = await getVersion();
const tauriVersion = await getTauriVersion();

interface Props {
  open: boolean;
  onClose: () => void;
}

export const AboutDialog: Component<Props> = props => {


  return (
    <Modal open={props.open} onClose={props.onClose} ariaLabel="About Vortex">
      <ModalHeader>
        About Vortex
      </ModalHeader>
      <ModalBody>
        <div>Version: {version}</div>
        <div>Tauri Version: {tauriVersion}</div>
      </ModalBody>
      <ModalFooter>
        <Button onClick={props.onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};
