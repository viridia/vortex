import { Component, createEffect, createMemo, createSignal } from 'solid-js';
import {
  formatCssColor,
  formatRGBAColor,
  hsl2rgb,
  hsla2rgba,
  rgba2hsla,
  RGBAColor,
} from '../render/colors';
import styles from './ColorPicker.module.scss';
import { GradientSlider } from './GradientSlider';

interface Props {
  value: RGBAColor;
  onChange: (color: RGBAColor) => void;
  disabled?: boolean;
  alpha?: boolean;
}

const HUE_COLORS = ['#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f', '#f00'];

/** Edit an RGB or HSL color. Note that this control is stateful because we want the HSL
    color to be the source of truth while editing; otherwise we run into problems with
    precision errors and 'gimble-lock' with the hue slider. */
export const ColorPicker: Component<Props> = props => {
  const [hue, setHue] = createSignal(0);
  const [saturation, setSaturation] = createSignal(0);
  const [lightness, setLightness] = createSignal(0);
  const [alpha, setAlpha] = createSignal(0);

  /* Set the current color given an RGBA color. If the input color is such that either hue and
      saturation values are indeterminate (for example, if the lightness is set to 0 then hue
      and saturation don't matter), this preserves the existing values instead of setting the to 0.
  */
  createEffect(() => {
    const [h, s, l, a] = rgba2hsla(props.value);
    if (l >= 0.0001 && l <= 0.999) {
      setHue(h);
      setSaturation(s);
    }
    setLightness(l);
    setAlpha(a);
  });

  function updateRgb(h: number, s: number, l: number, a: number) {
    const rgba = hsla2rgba([h, s, l, props.alpha ? a : 1]);
    props.onChange(rgba);
  }

  const cssColor = createMemo(() => formatCssColor(props.value));

  const satGradient = createMemo(() => [
    formatCssColor(hsl2rgb([hue(), 0, lightness()])),
    formatCssColor(hsl2rgb([hue(), 1, lightness()])),
  ]);

  const lightGradient = createMemo(() => [
    formatCssColor(hsl2rgb([hue(), saturation(), 0])),
    formatCssColor(hsl2rgb([hue(), saturation(), 0.5])),
    formatCssColor(hsl2rgb([hue(), saturation(), 1])),
  ]);

  const alphaGradient = createMemo(() => {
    const [r, g, b] = props.value;
    return [formatRGBAColor([r, g, b, 0]), formatRGBAColor([r, g, b, 1])];
  });

  return (
    <div class={styles.picker}>
      <div class={styles.sliders}>
        <GradientSlider
          classList={{ [styles.slider]: true, [styles.hue]: true }}
          colors={HUE_COLORS}
          value={hue()}
          max={1.0}
          onChange={hue => {
            updateRgb(setHue(hue), saturation(), lightness(), alpha());
          }}
          disabled={props.disabled}
        />
        <GradientSlider
          classList={{ [styles.slider]: true, [styles.saturation]: true }}
          colors={satGradient()}
          value={saturation()}
          max={1.0}
          onChange={saturation => {
            updateRgb(hue(), setSaturation(saturation), lightness(), alpha());
          }}
          disabled={props.disabled}
        />
        <GradientSlider
          classList={{ [styles.slider]: true, [styles.lightness]: true }}
          colors={lightGradient()}
          value={lightness()}
          max={1.0}
          onChange={lightness => {
            updateRgb(hue(), saturation(), setLightness(lightness), alpha());
          }}
          disabled={props.disabled}
        />
        {props.alpha && (
          <GradientSlider
            classList={{ [styles.slider]: true, [styles.alpha]: true }}
            colors={alphaGradient()}
            value={alpha()}
            max={1.0}
            onChange={alpha => {
              updateRgb(hue(), saturation(), lightness(), setAlpha(alpha));
            }}
            disabled={props.disabled}
          />
        )}
      </div>
      <div class={styles.color}>
        <div class={styles.swatch} style={{ 'background-color': cssColor() }} />
        <input
          class={styles.hex}
          type="text"
          value={cssColor()}
          disabled={props.disabled}
          onChange={e => {
            const rgba = hexToRgb(e.currentTarget.value);
            if (rgba) {
              props.onChange(rgba);
            } else {
              updateRgb(hue(), saturation(), lightness(), alpha());
            }
          }}
        />
      </div>
    </div>
  );
};

export function hexToRgb(hex: string): RGBAColor | undefined {
  let m = /^#?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(hex);
  if (m) {
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16), 1];
  }

  m = /^#?([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])$/.exec(hex);
  if (m) {
    return [parseInt(m[1], 16) * 17, parseInt(m[2], 16) * 17, parseInt(m[3], 16) * 17, 1];
  }

  m = /^#?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})?$/.exec(hex);
  if (m) {
    return [
      parseInt(m[1], 16),
      parseInt(m[2], 16),
      parseInt(m[3], 16),
      m[4] ? parseInt(m[4], 16) / 255 : 1,
    ];
  }

  m = /^#?([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])([0-9A-Fa-f])?$/.exec(hex);
  if (m) {
    return [
      parseInt(m[1], 16) * 17,
      parseInt(m[2], 16) * 17,
      parseInt(m[3], 16) * 17,
      m[4] ? (parseInt(m[4], 16) * 17) / 255 : 1,
    ];
  }

  return undefined;
}
