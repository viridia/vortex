import { MomentaryButton } from './MomentaryButton';
import { Component } from 'solid-js';
import styles from './CompassRose.module.scss';

interface Props {
  onScroll: (dx: number, dy: number) => void;
  onScrollToCenter: () => void;
}

export const CompassRose: Component<Props> = ({ onScroll, onScrollToCenter }) => (
  <div class={styles.compass}>
    <MomentaryButton
      classList={{ [styles.arrow]: true, [styles.north]: true }}
      period={5}
      delay={0}
      onHeld={() => onScroll(0, 2)}
    />
    <MomentaryButton
      classList={{ [styles.arrow]: true, [styles.east]: true }}
      period={5}
      delay={0}
      onHeld={() => onScroll(-2, 0)}
    />
    <MomentaryButton
      classList={{ [styles.arrow]: true, [styles.south]: true }}
      period={5}
      delay={0}
      onHeld={() => onScroll(0, -2)}
    />
    <MomentaryButton
      classList={{ [styles.arrow]: true, [styles.west]: true }}
      period={5}
      delay={0}
      onHeld={() => onScroll(2, 0)}
    />
    <button class={styles.center} onClick={onScrollToCenter} />
  </div>
);
