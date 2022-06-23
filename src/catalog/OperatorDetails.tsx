import { Component } from 'solid-js';
import { marked } from 'marked';
import { Operator } from '../operators';
import styles from './OperatorDetails.module.scss';

interface Props {
  operator: () => Operator | null;
}

export const OperatorDetails: Component<Props> = props => (
  <div
    classList={{ [styles.details]: true, 'rounded-scrollbars': true }}
    innerHTML={marked(props.operator()?.description || '')}
  />
);
