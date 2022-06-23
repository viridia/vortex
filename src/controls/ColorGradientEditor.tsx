import {
  batch,
  Component,
  createEffect,
  createMemo,
  createSelector,
  createSignal,
  For,
} from 'solid-js';
import { DragState, usePointerDrag } from '../hooks/usePointerDrag';
import { makeObservable } from '../lib/makeObservable';
import { ColorGradient, ColorStop, formatRGBAColor, RGBAColor } from '../render/colors';
import styles from './ColorGradientEditor.module.scss';
import { ColorPicker } from './ColorPicker';
import { ColorStopDragger } from './ColorStopDragger';
// import { ComboSlider } from './ComboSlider';

interface Props {
  value: ColorGradient;
  onChange: (newValue: ColorGradient) => void;
}

export const ColorGradientEditor: Component<Props> = props => {
  let gradientElt: HTMLDivElement;
  let stopsElt: HTMLDivElement;
  // const [position, setPosition] = createSignal(0);
  const [selected, setSelected] = createSignal(0);

  const getTargetStopIndex = (elt: HTMLElement): number => {
    for (let node = elt; node && node !== gradientElt; node = node.parentElement as HTMLElement) {
      if (node.dataset.stopindex) {
        return Number(node.dataset.stopindex);
      }
    }
    return -1;
  };

  const pointerMethods = usePointerDrag<HTMLDivElement>({
    onDragStart(e: DragState) {
      // Test if we clicked on an existing stop; if so then select it and start dragging.
      const index = getTargetStopIndex(e.target!);
      if (index >= 0) {
        // const color = Array.from(gradient[index].value) as RGBAColor;
        setSelected(index);
        // colorPicker.current?.setRGBA(color, true);
        // First and last color stops cannot be dragged.
        return index > 0 && index < props.value.length - 1;
      }

      const position = Math.min(1.0, Math.max(0, e.x / e.rect.width));
      // const stop = getColorAt(gradient, position);
      setSelected(-1);
      // setPosition(position);
      // colorPicker.current?.setRGBA(stop.value, true);
      return false;
    },

    onDragMove(e: DragState) {
      const index = selected();
      const gradient = props.value;
      if (index > 0) {
        const fraction = Math.min(1.0, Math.max(0, e.x / e.rect.width));
        const min = index > 0 ? gradient[index - 1].position : 0;
        const max = index < gradient.length - 1 ? gradient[index + 1].position : 1;
        gradient[index].position = Math.max(min, Math.min(max, fraction));
        // props.onChange();
      }
    },
  });

  const onDoubleClick = (e: MouseEvent) => {
    e.stopPropagation();

    // Needed because double-click returns the wrong target after pointer down.
    const clickElement = document.elementFromPoint(e.clientX, e.clientY);

    // Test if we clicked on an existing stop; if so then delete it.
    const gradient = props.value;
    const index = getTargetStopIndex(clickElement as HTMLElement);
    if (index >= 0) {
      if (index > 0 && index < gradient.length - 1) {
        props.onChange([...gradient.slice(0, index), ...gradient.slice(index + 1)]);
        setSelected(-1);
      }
      return;
    }

    // Our shaders only support 32 stops
    if (gradientElt && gradient.length < 32) {
      const rect = gradientElt.getBoundingClientRect();
      const fraction = Math.min(1.0, Math.max(0, (e.clientX - rect.left) / rect.width));
      const nextIndex = findEnclosingStops(gradient, fraction)[1];
      const newStop = getColorAt(gradient, fraction);
      makeObservable(newStop, ['position', 'value']);
      props.onChange([...gradient.slice(0, nextIndex), newStop, ...gradient.slice(nextIndex)]);
      setSelected(nextIndex);
      stopsElt.focus();
    }
  };

  const onChangeColor = (color: RGBAColor) => {
    const index = selected();
    const gradient = props.value;
    if (index >= 0) {
      gradient[index].value = color;
    }
  };

  // const onChangePosition = (value: number) => {
  //   const index = selected();
  //   const gradient = props.value;
  //   if (index > 0 && index < gradient.length - 1) {
  //     const min = gradient[index - 1].position;
  //     const max = gradient[index + 1].position;
  //     setPosition(value);
  //     gradient[index].position = Math.max(min, Math.min(max, value));
  //   }
  // };

  const gradientFill = createMemo(
    () =>
      `linear-gradient(to right, ${props.value
        .map(
          ({ value, position }) => `${formatRGBAColor(value)} ${Math.round(position * 1000) / 10}%`
        )
        .join(', ')})`
  );

  const selectedStop = createSelector(selected);
  return (
    <div class={styles.editor}>
      <div
        ref={stopsElt}
        class={styles.colorStops}
        tabIndex={0}
        onKeyPress={e => {
          switch (e.key) {
            case 'Backspace':
            case 'Delete': {
              e.preventDefault();
              e.stopPropagation();
              const index = selected();
              if (index > 0 && index < props.value.length - 1) {
                batch(() => {
                  props.onChange([...props.value.slice(0, index), ...props.value.slice(index + 1)]);
                  setSelected(-1);
                });
              }
            }
          }
        }}
      >
        <div
          {...pointerMethods}
          class={styles.gradient}
          style={{ 'background-image': gradientFill() }}
          ref={gradientElt}
          onDblClick={onDoubleClick}
        >
          <For each={props.value}>
            {(cs, i) => (
              <ColorStopDragger
                color={cs.value}
                value={cs.position}
                index={i()}
                selected={selectedStop(i())}
              />
            )}
          </For>
        </div>
        {/* <ComboSlider
          classList={{ [styles.stopSlider]: true }}
          name="Position"
          value={position}
          max={selected() < props.value.length - 1 ? props.value[selected() + 1].position : 1}
          min={selected() > 0 ? props.value[selected() - 1].position : 0}
          increment={1 / 256.0}
          precision={2}
          onChange={onChangePosition}
        /> */}
      </div>
      <ColorPicker
        onChange={onChangeColor}
        value={props.value[selected()]?.value ?? [0, 0, 0, 1]}
        disabled={selected() < 0}
        alpha={true}
      />
    </div>
  );
};

function getColorAt(gradient: ColorGradient, position: number): ColorStop {
  const [prevIndex, nextIndex] = findEnclosingStops(gradient, position);
  const prev = gradient[prevIndex];
  const next = gradient[nextIndex];
  const t =
    next.position > prev.position
      ? (position - prev.position) / (next.position - prev.position)
      : 0;
  return {
    position: Math.max(prev.position, Math.min(next.position, position)),
    value: [
      prev.value[0] + t * (next.value[0] - prev.value[0]),
      prev.value[1] + t * (next.value[1] - prev.value[1]),
      prev.value[2] + t * (next.value[2] - prev.value[2]),
      prev.value[3] + t * (next.value[3] - prev.value[3]),
    ],
  };
}

/** Given a position value in the range [0, 1], returns the index of the color stops
    before and after that position. If the input value is before the first stop then both
    numbers will be zero; if the input value is after the last stop then both numbers will
    be the index of the last stop.

    The idea is that these would be used to interpolate between the two stops to get the
    color at that point in the gradient. In the case where the position is before the first
    or after the last stop, the color is constant so the interpolation degenerates into a
    constant color.
*/
function findEnclosingStops(gradient: ColorGradient, position: number): [number, number] {
  const index = gradient.findIndex(cs => cs.position > position);
  let next: number;
  let prev: number;
  if (index < 0) {
    next = prev = gradient.length - 1;
  } else {
    next = index;
    prev = Math.max(0, index - 1);
  }
  return [prev, next];
}
