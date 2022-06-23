import { Component } from 'solid-js';
import { RGBAColor, formatCssColor } from '../render/colors';
import styles from './ColorStopDragger.module.scss';

interface Props {
  color: RGBAColor;
  selected: boolean;
  value: number;
  index: number;
}

export const ColorStopDragger: Component<Props> = (props) => {
  return (
    <div
      classList={{ [styles.dragger]: true, [styles.selected]: props.selected }}
      style={{ left: `${props.value * 100}%` }}
      data-stopindex={props.index}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="25" viewBox="-1 -1 16 24">
        <defs>
          <linearGradient id="a" gradientTransform="rotate(65 -4 -2)">
            <stop offset="0" stop-color="#dedede" />
            <stop offset=".3" stop-color="#9d9d9d" />
            <stop offset=".6" stop-color="#747474" />
          </linearGradient>
        </defs>
        <path d="M2 8 L8 2 L14 8 V22 H2z" fill="#000" opacity=".3" />
        <path d="M1 7 L7 1 L13 7 V21 H1z" fill="url(#a)" />
      </svg>
      <div class={styles.swatch} style={{ 'background-color': formatCssColor(props.color) }} />
    </div>
  );
};
