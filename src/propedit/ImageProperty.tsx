import { path } from '@tauri-apps/api';
import { open } from '@tauri-apps/api/dialog';
import { batch, Component, createEffect, createSignal } from 'solid-js';
import { Button } from '../controls/Button';
import { Graph, GraphNode } from '../graph';
import { ImageParamData } from '../graph/GraphNode';
import { Parameter } from '../operators';
import { renderer } from '../render/Renderer';
import styles from './ImageProperty.module.scss';

interface Props {
  parameter: Parameter;
  node: GraphNode;
  graph: Graph;
}

const docDir = await path.documentDir();

/** Property editor for Image resources. */
export const ImageProperty: Component<Props> = props => {
  const { parameter, node } = props;
  const [imageName, setImageName] = createSignal('');

  createEffect(() => {
    const imgPath = (props.node.paramValues.get(parameter.id) as ImageParamData)?.path;
    if (imgPath) {
      path.basename(imgPath).then(setImageName);
    } else {
      setImageName('');
    }
  });

  const onOpen = async () => {
    const prevPath = (props.node.paramValues.get(parameter.id) as ImageParamData)?.path;
    const defaultPath = prevPath
      ? await path.dirname(prevPath)
      : props.graph.path
      ? await path.dirname(props.graph.path)
      : docDir;
    const openResult = await open({
      defaultPath,
      multiple: false,
      filters: [
        {
          name: 'Image Files',
          // TODO: See what extensions we can support.
          extensions: ['png', 'jpg', 'jpeg'],
        },
      ],
    });
    const imgPath = Array.isArray(openResult) ? openResult[0] : openResult;
    if (imgPath) {
      renderer.loadTexture(imgPath, texture => {
        batch(() => {
          node.glResources?.textures.set(parameter.id, texture);
          node.paramValues.set(parameter.id, { path: imgPath });
          props.graph.modified = true;
        });
      });
    }
  };

  return (
    <section class={styles.panel}>
      <Button onClick={onOpen}>
        {node.paramValues.get(parameter.id) ? (
          <>
            <span class="name">{parameter.name}:&nbsp;</span>
            <span class="value">{imageName()}</span>
          </>
        ) : (
          <span class={styles.noImage}>Load image&hellip;</span>
        )}
      </Button>
    </section>
  );
};
