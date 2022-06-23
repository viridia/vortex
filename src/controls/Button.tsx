import { JSX, ParentComponent, splitProps } from 'solid-js';
import styles from './Button.module.scss';

export const Button: ParentComponent<JSX.ButtonHTMLAttributes<HTMLButtonElement>> = props => {
  const [local, rest] = splitProps(props, ['classList']);
  return <button {...rest} classList={{ [styles.button]: true, ...local.classList }} />;
};
