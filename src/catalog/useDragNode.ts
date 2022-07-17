import { createSignal, JSX } from 'solid-js';
import { Graph, GraphNode } from '../graph';
import { Operator } from '../operators';

interface Props {
  graph: () => Graph;
}

interface UseDragResult {
  dragNode: () => GraphNode;
  onStartDrag: (x: number, y: number, op: Operator, elt: HTMLDivElement, pointerId: number) => void;
  onCancelDrag: () => void;
  onPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent>;
  onPointerMove: JSX.EventHandler<HTMLDivElement, PointerEvent>;
  onPointerUp: JSX.EventHandler<HTMLDivElement, PointerEvent>;
  onContextMenu: JSX.EventHandler<HTMLDivElement, MouseEvent>;
}

export const useDragNode: (props: Props) => UseDragResult = props => {
  const [dragNode, setDragNode] = createSignal<GraphNode | null>(null);
  let xStart = 0;
  let yStart = 0;
  let dragElement: HTMLDivElement | null = null;
  let operator: Operator | null = null;
  let pointer = -1;

  const onStartDrag = (
    x: number,
    y: number,
    op: Operator,
    elt: HTMLDivElement,
    pointerId: number
  ) => {
    xStart = x;
    yStart = y;
    dragElement = elt;
    elt.setPointerCapture(pointerId);
    operator = op;
    pointer = pointerId;
  };

  const onCancelDrag = () => {
    dragNode().dispose();
    setDragNode(null);
    dragElement.releasePointerCapture(pointer);
    dragElement = null;
  };

  const onPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent> = e => {
    if (dragNode() && e.button === 2) {
      dragNode().dispose();
      setDragNode(null);
      dragElement = null;
    }
  };

  const onPointerMove: JSX.EventHandler<HTMLDivElement, PointerEvent> = e => {
    if (dragElement && operator) {
      if (!dragNode()) {
        const dx = Math.abs(e.x - xStart);
        const dy = Math.abs(e.y - yStart);
        if (dx > 3 && dy > 3) {
          const node = new GraphNode(operator, -1);
          node.x = e.x - 35;
          node.y = e.y - 45;
          setDragNode(node);
        }
      } else {
        const node = dragNode();
        node.x = e.x - 35;
        node.y = e.y - 45;
      }
    }
  };

  const onPointerUp: JSX.EventHandler<HTMLDivElement, PointerEvent> = e => {
    const node = dragNode();
    if (dragElement && node) {
      // TODO: subtract client rect of graph view.
      // Insert a copy of the node into the graph.
      props.graph().emit('insert', node);
      node.dispose();
      setDragNode(null);
      dragElement.releasePointerCapture(pointer);
    }
    dragElement = null;
  };

  const onContextMenu: JSX.EventHandler<HTMLDivElement, MouseEvent> = e => {
    if (dragNode()) {
      e.preventDefault();
      onCancelDrag();
    }
  };

  return {
    dragNode,
    onStartDrag,
    onCancelDrag,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onContextMenu,
  };
};
