import { createEffect, createSignal, JSX, onCleanup } from 'solid-js';

export interface DragState<T extends HTMLElement = HTMLElement> {
  /** Whether a drag is in progress. */
  dragging: boolean;
  /** X-coordinate of the pointer relative to the element bounds. */
  x: number;
  /** Y-coordinate of the pointer relative to the element bounds. */
  y: number;
  /** X-coordinate of the pointer in client coordinates. */
  clientX: number;
  /** Y-coordinate of the pointer in client coordinates. */
  clientY: number;
  /** Client rect of element. */
  rect: DOMRect;
  /** Whether the pointer has dragged outside the bounds of the element. */
  inBounds: boolean;
  /** The target element that was clicked on to initiate the drag. */
  target: T | undefined;
}

type PointerEventHandler<T extends HTMLElement = HTMLElement> = JSX.EventHandler<T, PointerEvent>;

type DragMethod<T extends HTMLElement, R> = (dragState: DragState<T>, e: PointerEvent) => R;

export interface DragMethods<T extends HTMLElement = HTMLElement> {
  onDragStart?: DragMethod<T, boolean | void>;
  onDragEnd?: DragMethod<T, void>;
  onDragMove?: DragMethod<T, void>;
  onDragEnter?: DragMethod<T, void>;
  onDragLeave?: DragMethod<T, void>;
}

export interface PointerEventHandlers<T extends HTMLElement = HTMLElement> {
  onPointerDown: PointerEventHandler<T>;
  onPointerUp?: PointerEventHandler<T>;
  onPointerMove?: PointerEventHandler<T>;
  onPointerEnter?: PointerEventHandler<T>;
  onPointerLeave?: PointerEventHandler<T>;
}

/** Hook that manages dragging on a control using pointer events.

    This is not 'drag and drop', but merely dragging within a single widget.
 */
export const usePointerDrag = <T extends HTMLElement = HTMLElement>(
  callbacks: DragMethods<T>
): PointerEventHandlers<T> => {
  const [target, setTarget] = createSignal<T>();
  const [pointerId, setPointerId] = createSignal(-1);
  const dragState: DragState<T> = {
    target: undefined,
    dragging: false,
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    rect: new DOMRect(),
    inBounds: false,
  };

  createEffect(() => {
    const t = target();
    const p = pointerId();
    if (t && p >= 0) {
      t.setPointerCapture(p);
      onCleanup(() => t.releasePointerCapture(p));
    }
  });

  const updateDragPosition = (e: PointerEvent) => {
    dragState.dragging = true;
    dragState.target = e.target as T;
    dragState.rect = (e.currentTarget as T).getBoundingClientRect();
    dragState.clientX = e.clientX;
    dragState.clientX = e.clientY;
    dragState.x = e.clientX - dragState.rect.left;
    dragState.y = e.clientY - dragState.rect.top;
  };

  const onPointerUp: PointerEventHandler<T> = e => {
    if (e.pointerId === pointerId()) {
      setTarget(undefined);
      setPointerId(-1);
      dragState.dragging = false;
      callbacks.onDragEnd?.(dragState, e);
    }
  };

  const onPointerEnter: PointerEventHandler<T> = e => {
    if (e.pointerId === pointerId()) {
      dragState.inBounds = true;
      updateDragPosition(e);
      callbacks.onDragEnter?.(dragState, e);
    }
  };

  const onPointerLeave: PointerEventHandler<T> = e => {
    if (e.pointerId === pointerId()) {
      dragState.inBounds = false;
      updateDragPosition(e);
      callbacks.onDragLeave?.(dragState, e);
    }
  };

  const onPointerMove: PointerEventHandler<T> = e => {
    if (e.pointerId === pointerId()) {
      e.preventDefault();
      updateDragPosition(e);
      callbacks.onDragMove?.(dragState, e);
    }
  };

  const onPointerDown: PointerEventHandler<T> = e => {
    e.stopPropagation();
    updateDragPosition(e);
    dragState.inBounds = true;
    // Cancel the drag if onDragStart explicitly returns false (not falsey)
    if (callbacks.onDragStart?.(dragState, e) === false) {
      return;
    }
    setPointerId(e.pointerId);
    setTarget(() => e.currentTarget);
  };

  if (target) {
    return {
      onPointerDown,
      onPointerMove,
      onPointerEnter,
      onPointerLeave,
      onPointerUp,
    };
  } else {
    return {
      onPointerDown,
    };
  }
};
