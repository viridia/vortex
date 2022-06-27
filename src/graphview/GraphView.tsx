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
import { Bounds } from '../graph/Bounds';

type DragType = 'input' | 'output' | 'node' | 'scroll' | null;

interface Props {
  graph: Graph;
}

const DOC_MARGIN = 32;
const NODE_WIDTH = 94;
const NODE_HEIGHT = 120;

export const GraphView: Component<Props> = props => {
  let viewEl: HTMLDivElement;
  const [dragType, setDragType] = createSignal<DragType>(null);
  const [dxScroll, setDXScroll] = createSignal(0);
  const [dyScroll, setDYScroll] = createSignal(0);
  const [graphOriginX, setGraphOriginX] = createSignal(0);
  const [graphOriginY, setGraphOriginY] = createSignal(0);
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

  const graphBounds = createMemo(() => {
    const graph = props.graph;
    const bounds = new Bounds();
    graph.nodes.forEach(node => {
      bounds.expandVertex(node.x - DOC_MARGIN, node.y - DOC_MARGIN);
      bounds.expandVertex(node.x + NODE_WIDTH + DOC_MARGIN, node.y + NODE_HEIGHT + DOC_MARGIN);
    });
    if (bounds.empty) {
      bounds.set(0, 0, 0, 0);
    }
    return bounds;
  });

  const scrollLimits = () => {
    const bounds = graphBounds();
    const limits = new Bounds();
    limits.xMin = -bounds.xMax + NODE_WIDTH;
    limits.xMax = viewEl.offsetWidth - bounds.xMin - NODE_WIDTH;
    limits.yMin = -bounds.yMax + NODE_HEIGHT;
    limits.yMax = viewEl.offsetHeight - bounds.yMin - NODE_HEIGHT;
    return limits;
  };

  const onChangeScroll = (dx: number, dy: number) => {
    batch(() => {
      const limits = scrollLimits();
      setGraphOriginX(x => {
        return Math.min(limits.xMax, Math.max(limits.xMin, x + dx));
      });
      setGraphOriginY(y => {
        return Math.min(limits.yMax, Math.max(limits.yMin, y + dy));
      });
    });
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
    let dxScroll = 0;
    if (e.offsetX < 0) {
      dxScroll = -1;
    } else if (e.offsetX > viewEl.offsetWidth) {
      dxScroll = 1;
    }
    setDXScroll(dxScroll);

    let dyScroll = 0;
    if (e.offsetY < 0) {
      dyScroll = -1;
    } else if (e.offsetY > viewEl.offsetHeight) {
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
    const bounds = graphBounds();
    setGraphOriginX((viewEl.offsetWidth - bounds.width) * 0.5 - bounds.xMin);
    setGraphOriginY((viewEl.offsetHeight - bounds.height) * 0.5 - bounds.yMin);
  };

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
    if (e.button === 1) {
      setDragType('scroll');
      pointerId = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (entity) {
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
          dragXOffset = e.clientX - rect.left - entity.x - graphOriginX();
          dragYOffset = e.clientY - rect.top - entity.y - graphOriginY();
          dragNode = entity;
          pointerId = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragType('node');
        }
      } else if (entity instanceof AbstractTerminal) {
        const rect = e.currentTarget.getBoundingClientRect();
        dragX = e.clientX - rect.left - graphOriginX();
        dragY = e.clientY - rect.top - graphOriginY();
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
      if (dragType() === 'scroll') {
        onChangeScroll(e.movementX, e.movementY);
      } else if (dragType() === 'input' || dragType() === 'output') {
        const gr = props.graph;
        dragX = e.offsetX - graphOriginX();
        dragY = e.offsetY - graphOriginY();
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
        dragNode.x = quantize(e.clientX - rect.left - graphOriginX() - dragXOffset);
        dragNode.y = quantize(e.clientY - rect.top - graphOriginY() - dragYOffset);
      }
      updateScrollVelocity(e);
      props.graph.modified = true;
    });
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
      const bounds = graphBounds();
      dragX = e.clientX - rect.left + bounds.xMin;
      dragY = e.clientY - rect.top + bounds.yMin;

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

  const onWheel: JSX.EventHandler<HTMLElement, WheelEvent> = e => {
    e.preventDefault();
    batch(() => {
      onChangeScroll(-e.deltaX, -e.deltaY);
    });
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

  createEffect(() => {
    const gr = props.graph;
    onCleanup(
      gr.subscribe('add', op => {
        const gr = props.graph;
        const node = new GraphNode(op, gr.nextId());
        const rect = viewEl.getBoundingClientRect();
        node.x = quantize(rect.width * 0.5 - graphOriginX() - 45);
        node.y = quantize(rect.height * 0.5 - graphOriginY() - 60);
        node.selected = true;
        gr.clearSelection();
        gr.add(node);
      })
    );
  });

  createEffect(() => {
    if (dxScroll() || dyScroll()) {
      const timer = window.setInterval(() => {
        onChangeScroll(dxScroll(), dyScroll());
      }, 16);
      onCleanup(() => window.clearInterval(timer));
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

  // SVG view box string
  const viewBox = createMemo(() => {
    const b = graphBounds();
    return `${b.xMin} ${b.yMin} ${b.width} ${b.height}`;
  });

  return (
    <section
      classList={{ [styles.graph]: true, [styles.scroll]: dragType() === 'scroll' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      id="graph"
      ref={viewEl}
    >
      <div
        class={styles.graphScrollContent}
        style={{
          width: `${graphBounds().width}px`,
          height: `${graphBounds().height}px`,
          left: `${graphOriginX()}px`,
          top: `${graphOriginY()}px`,
        }}
      >
        <For each={props.graph.nodes}>
          {node => <NodeRendition node={node} graph={props.graph} />}
        </For>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', left: graphBounds().xMin, top: graphBounds().yMin }}
          viewBox={viewBox()}
          class="connectors"
          width={graphBounds().width}
          height={graphBounds().height}
        >
          <Show when={dragConnection.ts || dragConnection.te}>
            <ConnectionRendition {...dragConnection} />
          </Show>
          <For each={connections()}>
            {conn => (
              <ConnectionRendition
                onPointerDown={onConnectionPointerDown}
                ts={conn.source}
                te={conn.dest}
              />
            )}
          </For>
        </svg>
      </div>
      <CompassRose onScroll={onChangeScroll} onScrollToCenter={scrollToCenter} />
    </section>
  );
};
