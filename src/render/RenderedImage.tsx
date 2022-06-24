import { createEffect } from 'solid-js';
import { GraphNode } from '../graph';
import { renderer } from './Renderer';

interface Props {
  node: GraphNode | null;
  width: number;
  height: number;
  tiling?: number;
  class?: string;
  // ref?: HTMLCanvasElement;
}

export const RenderedImage = (props: Props) => {
  let canvas: HTMLCanvasElement; // = useRef<HTMLCanvasElement>(null);
  // const renderer = useContext(RendererContext);
  // const ref = useCallback(
  //   (elt: HTMLCanvasElement) => {
  //     (canvas as MutableRefObject<HTMLCanvasElement>).current = elt;
  //     if (typeof canvasRef === 'function') {
  //       canvasRef(elt);
  //     } else if (canvasRef) {
  //       canvasRef.current = elt;
  //     }
  //   },
  //   [canvasRef]
  // );

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

  return (
    <canvas
      class={props.class}
      style={{ width: `${props.width}px`, height: `${props.height}px` }}
      width={props.width}
      height={props.height}
      ref={canvas}
    />
  );
};
