import { createMemo, For, Match, Show, Switch } from 'solid-js';
import { Graph, GraphNode } from '../graph';
import { DataType, Parameter } from '../operators';
import { ColorGradientProperty } from './ColorGradientProperty';
import { ColorProperty } from './ColorProperty';
import { ImageProperty } from './ImageProperty';
import styles from './PropertyEditor.module.scss';
import { ScalarProperty } from './ScalarProperty';

interface Props {
  graph: Graph;
  node: GraphNode;
}

interface PropertyGroup {
  title?: string;
  children: Parameter[];
}

export function PropertyEditor({ node, graph }: Props) {
  const groups = createMemo(() => {
    const result: PropertyGroup[] = [];
    let currentGroup: PropertyGroup | undefined;

    function walkGroups(params: Parameter[]) {
      params.forEach(param => {
        if (param.computed) {
          // Don't display
        } else if (param.type === DataType.GROUP) {
          // Explict group
          currentGroup = { children: [], title: param.name };
          result.push(currentGroup);
          walkGroups(param.children);
          currentGroup = undefined;
        } else if (
          (param.type === DataType.VEC4 && param.editor === 'color') ||
          param.type === DataType.IMAGE ||
          param.type === DataType.RGBA_GRADIENT
        ) {
          // Large controls go in a group by themselves
          result.push({ children: [param], title: param.name });
          currentGroup = undefined;
        } else {
          // Individual controls, create a group if none exists.
          if (!currentGroup) {
            currentGroup = { children: [] };
            result.push(currentGroup);
          }
          currentGroup.children.push(param);
        }
      });
    }

    walkGroups(node.operator.params);
    return result;
  });

  return (
    <section class={styles.editor} classList={{ 'rounded-scrollbars': true }}>
      <header>{node.name}</header>
      <For each={groups()}>
        {group => (
          <section class={styles.group}>
            <Show when={group.title}>
              <header>{group.title}</header>
            </Show>
            <For each={group.children}>
              {param => (
                <Switch fallback={<div>Unsupported param type: {param.type}</div>}>
                  <Match when={param.type === DataType.FLOAT || param.type === DataType.INTEGER}>
                    <ScalarProperty graph={graph} node={node} parameter={param} />
                  </Match>
                  <Match when={param.type === DataType.VEC4 && param.editor === 'color'}>
                    <ColorProperty graph={graph} node={node} parameter={param} />
                  </Match>
                  <Match when={param.type === DataType.RGBA_GRADIENT}>
                    <ColorGradientProperty graph={graph} node={node} parameter={param} />
                  </Match>
                  <Match when={param.type === DataType.IMAGE}>
                    <ImageProperty graph={graph} node={node} parameter={param} />
                  </Match>
                </Switch>
              )}
            </For>
          </section>
        )}
      </For>
    </section>
  );
}
