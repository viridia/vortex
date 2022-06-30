import { Component, createMemo, createSignal, JSX } from 'solid-js';
import { usePointerDrag } from '../hooks/usePointerDrag';
import styles from './ComboSlider.module.scss';
import { MomentaryButton } from './MomentaryButton';

// TODO: log scale testing

interface Props {
  name: string;
  value: () => number;
  min?: number;
  max: number;
  precision?: number; // 0 = integer, undefined == unlimited
  increment?: number;
  enumVals?: string[];
  classList?: {
    [k: string]: boolean | undefined;
  };
  onChange: (value: number) => void;
}

export const ComboSlider: Component<Props> = ({
  name,
  value,
  min = 0,
  max,
  precision,
  increment = 1,
  classList,
  enumVals,
  onChange,
}) => {
  let element: HTMLDivElement;
  let inputEl: HTMLInputElement;
  const [dragOrigin, setDragOrigin] = createSignal(0);
  const [dragValue, setDragValue] = createSignal(0);
  const [textActive, setTextActive] = createSignal(false);

  const setValue = (value: number) => {
    let newValue = value;
    if (precision !== undefined) {
      const mag = 10 ** precision;
      newValue = Math.round(newValue * mag) / mag;
    }
    onChange(Math.min(max, Math.max(min, newValue)));
  };

  function onLeftChange(active: boolean) {
    if (active) {
      setValue(value() - increment);
    }
  }

  function onLeftHeld() {
    setValue(value() - increment);
  }

  function onRightChange(active: boolean) {
    if (active) {
      setValue(value() + increment);
    }
  }

  function onRightHeld() {
    setValue(value() + increment);
  }

  function valueFromX(dx: number): number {
    let newValue = dragValue();
    return Math.max(min, Math.min(max, newValue + dx * (max - min)));
  }

  const dragMethods = usePointerDrag({
    onDragStart(ds) {
      setDragOrigin(ds.x);
      setDragValue(value);
    },

    onDragMove(ds) {
      if (element) {
        setValue(valueFromX((ds.x - dragOrigin()) / element.offsetWidth));
      }
    },
  });

  const onDoubleClick = () => {
    if (!enumVals && inputEl) {
      inputEl.value = value().toString();
      setTextActive(true);
      window.setTimeout(() => {
        const length = inputEl.value.length;
        inputEl.setSelectionRange(length, length);
        inputEl.focus();
      }, 5);
    }
  };

  const onBlurInput = () => {
    if (inputEl) {
      setTextActive(false);
      const newValue = parseFloat(inputEl.value);
      if (!isNaN(newValue)) {
        setValue(newValue);
      }
    }
  };

  const onInputKey: JSX.EventHandler<HTMLElement, KeyboardEvent> = e => {
    if (e.key === 'Enter' && inputEl) {
      e.preventDefault();
      const newValue = parseFloat(inputEl.value);
      if (!isNaN(newValue)) {
        setValue(newValue);
        setTextActive(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTextActive(false);
    }
  };

  const percent = createMemo(() => {
    return enumVals ? 100 : ((value() - min) * 100) / (max - min);
  });

  return (
    <div
      classList={{ [styles.comboSlider]: true, [styles.textActive]: textActive(), ...classList }}
    >
      <MomentaryButton
        classList={{ [styles.arrow]: true, [styles.arrowLeft]: true }}
        onChange={onLeftChange}
        onHeld={onLeftHeld}
      />
      <div class={styles.container} {...dragMethods} onDblClick={onDoubleClick} ref={element}>
        <div class={styles.track} style={{ width: `${percent()}%` }} />
        <span class={styles.name}>{name}: </span>
        <span class={styles.value}>{enumVals ? enumVals[value()] : value()}</span>
        <input
          class={styles.input}
          type="text"
          autofocus={true}
          onKeyDown={onInputKey}
          onBlur={onBlurInput}
          ref={inputEl}
        />
      </div>
      <MomentaryButton
        classList={{ [styles.arrow]: true, [styles.arrowRight]: true }}
        onChange={onRightChange}
        onHeld={onRightHeld}
      />
    </div>
  );
};
