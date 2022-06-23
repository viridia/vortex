import { createEffect, createSignal, onCleanup } from 'solid-js';

interface Props {
  in: () => boolean;
  delay?: number;
  exitDelay?: number;
  onExited?: () => void;
}

type TransitionState = 'entering' | 'entered' | 'exiting' | 'exited';

export const useTransitionState = (props: Props): (() => TransitionState) => {
  const [state, setState] = createSignal<TransitionState>('exited');

  createEffect(() => {
    const st = state();
    if (props.in()) {
      if (st === 'exited' || st === 'exiting') {
        setState('entering');
      }
    } else {
      if (st === 'entering' || st === 'entered') {
        setState('exiting');
      }
    }
  });

  createEffect(() => {
    const { delay = 300, exitDelay, onExited } = props;
    const st = state();
    if (st === 'entering' || st === 'exiting') {
      const timer = window.setTimeout(
        () => {
          if (st === 'exiting') {
            setState('exited');
            onExited && onExited();
          } else if (st === 'entering') {
            setState('entered');
          }
        },
        state() === 'entering' ? delay : exitDelay ?? delay
      );

      onCleanup(() => window.clearTimeout(timer));
    }
  });

  return state;
};
