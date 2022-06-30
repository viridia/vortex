import { createEffect } from 'solid-js';
import { GraphNode } from '../graph';
import { renderer } from './Renderer';

interface Props {
  node: GraphNode | null;
  width: number;
  height: number;
  tiling?: number;
  class?: string;
  canvasRef?: (ref: HTMLCanvasElement) => void;
}

export const RenderedImage = (props: Props) => {
  let canvas: HTMLCanvasElement;

  createEffect(() => {
    const node = props.node;
    if (node) {
      if (node.deleted) {
        node.dispose(renderer);
      } else {
        const context = canvas?.getContext('2d');
        if (context && node.source.length > 0) {
          renderer.setTiling(props.tiling ?? 1);
          renderer.render(node, props.width, props.height, context);
        }
      }
    }
  });

  const setRef = (elt: HTMLCanvasElement) => {
    canvas = elt;
    props.canvasRef?.(elt);
  }

  return (
    <canvas
      class={props.class}
      style={{ width: `${props.width}px`, height: `${props.height}px` }}
      width={props.width}
      height={props.height}
      ref={setRef}
    />
  );
};
