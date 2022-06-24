import { AbstractTerminal } from '../graph/AbstractTerminal';
import { CompassRose } from '../controls/CompassRose';
import {
  Connection,
  Graph,
  GraphNode,
  InputTerminal,
  OutputTerminal,
  Terminal,
  quantize,
} from '../graph';
import { ConnectionProps, ConnectionRendition } from './ConnectionRendition';
import { NodeRendition } from './NodeRendition';
import { isInputTerminal } from '../graph/InputTerminal';
import { isOutputTerminal } from '../graph/OutputTerminal';
import { registry } from '../operators/Registry';
import {
  batch,
  Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
  onCleanup,
  Show,
} from 'solid-js';
import styles from './GraphView.module.scss';
import { createStore } from 'solid-js/store';

type DragType = 'input' | 'output' | 'node' | null;

interface Props {
  graph: Graph;
  ref: (elt: HTMLDivElement) => void;
}

interface State {
  pointerId: number;
  dragX: number;
  dragY: number;
  dragXOffset: number;
  dragYOffset: number;
  dragNode: GraphNode | null;
  dragSource: OutputTerminal | null;
  dragSink: InputTerminal | null;
}

export const GraphView: Component<Props> = props => {
  let scrollEl: HTMLDivElement;
  let scrollContentEl: HTMLDivElement;

  const [dragType, setDragType] = createSignal<DragType>(null);
  const [dxScroll, setDXScroll] = createSignal(0);
  const [dyScroll, setDYScroll] = createSignal(0);
  const [dragConnection, setDragConnection] = createStore<ConnectionProps>({
    ts: null,
    xs: 0,
    ys: 0,
    te: null,
    xe: 0,
    ye: 0,
    pending: false,
  });
  const [editConnection, setEditConnection] = createSignal<Connection | null>(null);
  const [activeTerminal, setActiveTerminal] = createSignal<Terminal | null>(null);

  let pointerId = -1;
  let dragX = 0;
  let dragY = 0;
  let dragXOffset = 0;
  let dragYOffset = 0;
  let dragNode: GraphNode | null = null;
  let dragSource: OutputTerminal | null = null;
  let dragSink: InputTerminal | null = null;

  const onChangeScroll = (dx: number, dy: number) => {
    if (scrollEl) {
      scrollEl.scrollBy(-dx, -dy);
    }
  };

  const pickGraphEntity = (x: number, y: number): GraphNode | Terminal | undefined => {
    let elt = document.elementFromPoint(x, y);
    const graph = props.graph;
    while (elt) {
      if (elt instanceof HTMLElement) {
        if (elt.dataset.terminal) {
          const node = graph.findNode(Number(elt.dataset.node));
          return node?.findTerminal(elt.dataset.terminal);
        } else if (elt.dataset.node) {
          return graph.findNode(Number(elt.dataset.node));
        }
      }
      elt = elt.parentElement;
    }
  };

  const updateScrollVelocity: JSX.EventHandler<HTMLElement | SVGElement, PointerEvent> = e => {
    const parentEl = e.currentTarget.parentElement?.parentElement as HTMLElement;
    let dxScroll = 0;
    if (e.clientX < parentEl.offsetLeft) {
      dxScroll = -1;
    } else if (e.clientX > parentEl.offsetLeft + parentEl.offsetWidth) {
      dxScroll = 1;
    }
    setDXScroll(dxScroll);

    let dyScroll = 0;
    if (e.clientY < parentEl.offsetTop) {
      dyScroll = -1;
    } else if (e.clientY > parentEl.offsetTop + parentEl.offsetHeight) {
      dyScroll = 1;
    }
    setDYScroll(dyScroll);
  };

  createEffect(() => {
    const dx = dxScroll();
    const dy = dyScroll();
    if (dx !== 0 || dy !== 0) {
      const timer = window.setInterval(() => {
        onChangeScroll(-dx * 10, -dy * 10);
      }, 16);

      onCleanup(() => window.clearInterval(timer));
    }
  });

  const scrollToCenter = () => {
    if (scrollEl && scrollContentEl) {
      const scrollRect = scrollEl.getBoundingClientRect();
      const contentRect = scrollContentEl.getBoundingClientRect();
      scrollEl.scrollTo(
        (contentRect.width - scrollRect.width) / 2,
        (contentRect.height - scrollRect.height) / 2
      );
    }
  };

  // const bounds = props.graph.bounds;

  // const onDragEnter: JSX.EventHandler<HTMLElement, DragEvent> = e => {
  //   if (e.dataTransfer.types.indexOf('application/x-vortex-operator') >= 0) {
  //     e.preventDefault();
  //     e.dataTransfer.dropEffect = 'copy';
  //   }
  // };

  // const onDragOver: JSX.EventHandler<HTMLElement, DragEvent> = e => {
  //   if (e.dataTransfer.types.indexOf('application/x-vortex-operator') >= 0) {
  //     e.preventDefault();
  //     e.dataTransfer.dropEffect = 'copy';
  //   }
  // };

  // const onDrop: JSX.EventHandler<HTMLElement, DragEvent> = e => {
  //   const data = e.dataTransfer.getData('application/x-vortex-operator');
  //   if (data) {
  //     e.preventDefault();
  //     // e.stopPropagation();
  //     const gr = props.graph;
  //     gr.clearSelection();
  //     const op = registry.get(data);
  //     const node = new GraphNode(op, gr.nextId());
  //     const rect = e.currentTarget.getBoundingClientRect();
  //     node.x = quantize(e.clientX - rect.left + gr.bounds.xMin - 45);
  //     node.y = quantize(e.clientY - rect.top + gr.bounds.yMin - 60);
  //     node.selected = true;
  //     gr.add(node);
  //   }
  // };

  const onPointerDown: JSX.EventHandler<HTMLElement, PointerEvent> = e => {
    e.preventDefault();
    const graph = props.graph;
    const entity = pickGraphEntity(e.clientX, e.clientY);
    if (entity) {
      if (entity instanceof GraphNode) {
        batch(() => {
          if (e.ctrlKey || e.metaKey) {
            entity.selected = !entity.selected;
          } else if (!entity.selected) {
            if (!e.shiftKey) {
              graph.clearSelection();
            }
            entity.selected = true;
          }
        });

        const rect = e.currentTarget.getBoundingClientRect();
        if (entity.selected) {
          dragXOffset = e.clientX - rect.left - entity.x;
          dragYOffset = e.clientY - rect.top - entity.y;
          dragNode = entity;
          pointerId = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragType('node');
        }
      } else if (entity instanceof AbstractTerminal) {
        const rect = e.currentTarget.getBoundingClientRect();
        dragX = e.clientX - rect.left + graph.bounds.xMin;
        dragY = e.clientY - rect.top + graph.bounds.yMin;
        setActiveTerminal(null);
        if (isOutputTerminal(entity)) {
          dragSource = entity;
          dragSink = null;
          setDragType('input'); // Dragging *to* an input terminal
        } else if (isInputTerminal(entity)) {
          dragSource = null;
          dragSink = entity;
          setDragType('output'); // Dragging *to* an output terminal
        }
        pointerId = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);

        setDragConnection({
          ts: dragSource,
          xs: dragX,
          ys: dragY,
          te: dragSink,
          xe: dragX,
          ye: dragY,
          pending: !dragSource || !dragSink,
        });
      }
    } else {
      graph.clearSelection();
    }
  };

  const onPointerMove: JSX.EventHandler<HTMLElement, PointerEvent> = e => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    batch(() => {
      if (dragType() === 'input' || dragType() === 'output') {
        const rect = e.currentTarget.getBoundingClientRect();
        const gr = props.graph;
        dragX = e.clientX - rect.left + gr.bounds.xMin;
        dragY = e.clientY - rect.top + gr.bounds.yMin;

        const entity = pickGraphEntity(e.clientX, e.clientY);
        if (dragType() === 'input') {
          dragSink =
            entity &&
            entity instanceof AbstractTerminal &&
            isInputTerminal(entity) &&
            dragSource &&
            !gr.detectCycle(dragSource, entity)
              ? entity
              : null;
          setActiveTerminal(dragSink);
        } else {
          dragSource =
            entity &&
            entity instanceof AbstractTerminal &&
            isOutputTerminal(entity) &&
            dragSink &&
            !gr.detectCycle(entity, dragSink)
              ? entity
              : null;
          setActiveTerminal(dragSource);
        }

        setDragConnection({
          ts: dragSource,
          xs: dragX,
          ys: dragY,
          te: dragSink,
          xe: dragX,
          ye: dragY,
          pending: !dragSource || !dragSink,
        });

        updateScrollVelocity(e);
      } else if (dragNode) {
        dragNode.x = quantize(
          e.clientX - rect.left - dragXOffset
          // Math.min(rect.width, Math.max(0, e.clientX - rect.left)) - dragXOffset
        );
        dragNode.y = quantize(
          e.clientY - rect.top - dragYOffset
          // Math.min(rect.height, Math.max(0, e.clientY - rect.top)) - dragYOffset
        );
      }
      props.graph.modified = true;
    });

    updateScrollVelocity(e);
  };

  const onPointerUp: JSX.EventHandler<HTMLElement, PointerEvent> = e => {
    e.preventDefault();
    if (pointerId >= 0) {
      e.currentTarget.releasePointerCapture(pointerId);
    }

    batch(() => {
      if (dragType() === 'input' || dragType() === 'output') {
        if (editConnection()) {
          editConnection().source.disconnect(editConnection());
          editConnection().dest.connection = null;
        }

        if (dragSource && dragSink) {
          props.graph.connectTerminals(dragSource, dragSink);
        }
      }
      setDragType(null);
      setDragConnection({ ts: null, te: null });
      setEditConnection(null);
      setActiveTerminal(null);
      setDXScroll(0);
      setDYScroll(0);
    });

    dragSource = null;
    dragSink = null;
    dragNode = null;
    pointerId = -1;
    props.graph.computeBounds();
  };

  const onConnectionPointerDown: JSX.EventHandler<SVGElement, PointerEvent> = e => {
    e.stopPropagation();
    e.preventDefault();
    const sourceId = e.currentTarget.dataset.source?.split(':', 2);
    const sinkId = e.currentTarget.dataset.sink?.split(':');
    const gr = props.graph;
    const ts = sourceId ? gr.findOutputTerminal(sourceId[0], sourceId[1]) : undefined;
    const te = sinkId ? gr.findInputTerminal(sinkId[0], sinkId[1]) : undefined;
    const connection = te?.connection;

    if (ts && te && connection) {
      const svgDoc = e.currentTarget.parentNode as SVGSVGElement;
      const parentEl = svgDoc.parentElement!;

      // Determine which endpoint is closer to the pointer coordinates. That's the one to drag.
      const clientRect = svgDoc.getBoundingClientRect();
      const x = e.clientX - clientRect.left + svgDoc.viewBox.baseVal.x;
      const y = e.clientY - clientRect.top + svgDoc.viewBox.baseVal.y;

      const de = (x - te.x - te.node.x - 10) ** 2 + (y - te.y - te.node.y - 10) ** 2;
      const ds = (x - ts.x - ts.node.x - 10) ** 2 + (y - ts.y - ts.node.y - 10) ** 2;

      const rect = parentEl.getBoundingClientRect();
      dragX = e.clientX - rect.left + gr.bounds.xMin;
      dragY = e.clientY - rect.top + gr.bounds.yMin;

      if (ds > de) {
        dragSource = ts;
        dragSink = null;
        setDragType('input'); // Dragging *to* an input terminal
      } else {
        dragSource = null;
        dragSink = te;
        setDragType('output'); // Dragging *to* an output terminal
      }

      pointerId = e.pointerId;
      parentEl.setPointerCapture(e.pointerId);

      setDragConnection({
        ts: dragSource,
        xs: dragX,
        ys: dragY,
        te: dragSink,
        xe: dragX,
        ye: dragY,
        pending: !dragSource || !dragSink,
      });
      setEditConnection(connection);
    }
  };

  createEffect(() => {
    const active = activeTerminal();
    if (active) {
      active.hover = true;
      onCleanup(() => {
        active.hover = false;
      });
    }
  });

  queueMicrotask(() => {
    scrollToCenter();
  });

  const connections = createMemo(() => {
    const edit = editConnection();
    const isNotEditing = (conn: Connection) =>
      !(edit && conn.dest === edit.dest && conn.source === edit.source);
    return props.graph.nodes
      .map(node => node.outputs.map(output => output.connections.filter(isNotEditing)))
      .flat(2);
  });

  const viewBox = createMemo(() => {
    const bounds = props.graph.bounds;
    return `${bounds.xMin} ${bounds.yMin} ${bounds.width} ${bounds.height}`;
  });

  const setRef = (element: HTMLDivElement) => {
    scrollEl = element;
    props.ref(element);
  };

  return (
    <section class={styles.graph} id="graph">
      <div classList={{ [styles.graphScroll]: true, 'rounded-scrollbars': true }} ref={setRef}>
        <div
          ref={scrollContentEl}
          class={styles.graphScrollContent}
          // onDragEnter={onDragEnter}
          // onDragOver={onDragOver}
          // onDrop={onDrop}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            width: `${props.graph.bounds.width}px`,
            height: `${props.graph.bounds.height}px`,
          }}
        >
          <For each={props.graph.nodes}>
            {node => <NodeRendition node={node} graph={props.graph} />}
          </For>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', left: '0', top: '0' }}
            viewBox={viewBox()}
            class="connectors"
            width={props.graph.bounds.width}
            height={props.graph.bounds.height}
          >
            <For each={connections()}>
              {conn => (
                <ConnectionRendition
                  onPointerDown={onConnectionPointerDown}
                  ts={conn.source}
                  te={conn.dest}
                />
              )}
            </For>
            <Show when={dragConnection.ts || dragConnection.te}>
              <ConnectionRendition {...dragConnection} />
            </Show>
          </svg>
        </div>
      </div>
      <CompassRose onScroll={onChangeScroll} onScrollToCenter={scrollToCenter} />
    </section>
  );
};
