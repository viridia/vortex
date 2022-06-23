import { Component, createEffect, createSignal, JSX, onCleanup } from 'solid-js';
import { usePointerDrag } from '../hooks/usePointerDrag';

const PERIOD_MS = 100;
const INITIAL_DELAY_MS = 400;

const noOpCallback = (active: boolean) => {
  return;
};

interface Props {
  classList?: {
    [k: string]: boolean | undefined;
  };
  onChange?: (active: boolean) => void;
  onHeld?: () => void;
  children?: JSX.Element | JSX.Element[];
  period?: number;
  delay?: number;
}

/** A button which causes a value to change for as long as it is held down. */
export const MomentaryButton: Component<Props> = ({
  classList,
  onChange = noOpCallback,
  onHeld,
  children,
  period = PERIOD_MS,
  delay = INITIAL_DELAY_MS,
}) => {
  const [isActive, setIsActive] = createSignal(false);
  const [inFirstInterval, setInFirstInterval] = createSignal(false);

  function onDragStart() {
    setIsActive(true);
    setInFirstInterval(true);
    onChange(true);
  }

  function onDragEnd() {
    setIsActive(false);
    onChange(false);
  }

  function onDragEnter() {
    setIsActive(true);
    onChange(true);
  }

  function onDragLeave() {
    setIsActive(false);
    onChange(false);
  }

  const dragMethods = usePointerDrag({
    onDragStart,
    onDragEnd,
    onDragEnter,
    onDragLeave,
  });

  // Call `onHeld` callback continuously.
  createEffect(() => {
    if (isActive() && onHeld) {
      // Initial delay is often different than subsequent delays.
      if (inFirstInterval()) {
        const timer = window.setTimeout(() => {
          onHeld();
          setInFirstInterval(false);
        }, delay);
        onCleanup(() => window.clearTimeout(timer));
      } else {
        const timer = window.setInterval(onHeld, period);
        onCleanup(() => window.clearInterval(timer));
      }
    }
  });

  return (
    <div {...dragMethods} classList={{ ...classList, active: isActive() }}>
      {children}
    </div>
  );
};
