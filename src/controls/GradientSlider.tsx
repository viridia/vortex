import { Component } from 'solid-js';
import { DragState, usePointerDrag } from '../hooks/usePointerDrag';
import styles from './GradientSlider.module.scss';

interface Props {
  value: number;
  min?: number;
  max: number;
  classList?: {
    [k: string]: boolean | undefined;
  };
  colors: string[];
  disabled?: boolean;
  onChange: (value: number) => void;
}

export const GradientSlider: Component<Props> = props => {
  const { min = 0, max, onChange } = props;
  const valueFromX = (ds: DragState) => {
    const dx = ds.x - 13;
    const value = (dx * (max - min)) / (ds.rect.width - 26) + min;
    return Math.min(max, Math.max(min, value));
  };

  const dragMethods = usePointerDrag({
    onDragStart(ds: DragState) {
      onChange(valueFromX(ds));
    },
    onDragMove(ds: DragState) {
      onChange(valueFromX(ds));
    },
  });

  return (
    <div
      classList={{ [styles.slider]: true, disabled: props.disabled, ...props.classList }}
      {...dragMethods}
    >
      <div class={styles.bg}>
        <div class={styles.left} style={{ 'background-color': props.colors[0] }} />
        <div
          class={styles.middle}
          style={{ 'background-image': `linear-gradient(to right, ${props.colors.join(', ')})` }}
        />
        <div class={styles.right} style={{ 'background-color': props.colors.at(-1) }} />
      </div>
      <div class={styles.track}>
        <div
          class={styles.thumb}
          style={{ left: `${((props.value - min) * 100) / (max - min)}%` }}
        />
      </div>
    </div>
  );
};
