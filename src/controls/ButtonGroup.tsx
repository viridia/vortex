import { JSX, ParentComponent } from 'solid-js';
import styles from './ButtonGroup.module.scss';

export const ButtonGroup: ParentComponent<JSX.HTMLAttributes<HTMLDivElement>> = ({
  classList,
  ...props
}) => <div {...props} classList={{ [styles.buttonGroup]: true, ...classList }} />;
