import { Dialog, DialogPanel, DialogTitle, DialogOverlay } from 'solid-headless';
import { Component, createEffect, JSX, ParentComponent, Show, splitProps } from 'solid-js';
import styles from './Modal.module.scss';

import { useTransitionState } from '../hooks/useTransitionState';

interface Props {
  ariaLabel: string;
  children?: any;
  className?: string;
  open: boolean;
  onClose?: () => void;
  onExited?: () => void;
}

export const ModalHeader: ParentComponent<JSX.HTMLAttributes<HTMLElement>> = props => {
  const [local, rest] = splitProps(props, ['classList']);
  return <header {...rest} classList={{ [styles.header]: true, ...local.classList }} />;
};

export const ModalFooter: ParentComponent<JSX.HTMLAttributes<HTMLElement>> = props => {
  const [local, rest] = splitProps(props, ['classList']);
  return <footer {...rest} classList={{ [styles.footer]: true, ...local.classList }} />;
};

export const ModalBody: ParentComponent<JSX.HTMLAttributes<HTMLElement>> = props => {
  const [local, rest] = splitProps(props, ['classList']);
  return <section {...rest} classList={{ [styles.body]: true, ...local.classList }} />;
};

/** Modal dialog class. */
export const Modal: Component<Props> = props => {
  const state = useTransitionState({ in: () => props.open, onExited: props.onExited });

  return (
    <Show when={props.open || state() !== 'exited'}>
      {() => (
        <Dialog
          classList={{ [styles.frame]: true, [state()]: true }}
          isOpen={props.open || state() !== 'exited'}
          onClose={props.onClose}
          onKeyPress={e => {
            e.stopPropagation();
          }}
        >
          <DialogOverlay classList={{ [styles.overlay]: true }} />
          <DialogPanel classList={{ [styles.modal]: true }} aria-label={props.ariaLabel}>
            {props.children}
          </DialogPanel>
        </Dialog>
      )}
    </Show>
  );
};
