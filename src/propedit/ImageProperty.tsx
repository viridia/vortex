import { batch, Component } from 'solid-js';
import { Button } from '../controls/Button';
import { Graph, GraphNode } from '../graph';
import { Parameter } from '../operators';
import styles from './ImageProperty.module.scss';

interface Props {
  parameter: Parameter;
  node: GraphNode;
  graph: Graph;
}

/** Property editor for Image resources. */
export const ImageProperty: Component<Props> = (props) => {
  const { parameter, node, graph } = props;

  // const fileEl = useRef<HTMLInputElement>(null);
  // const [imageName, setImageName] = useState<string | null>(null);
  // const renderer = useContext(RendererContext);

  // const onClick = useCallback((e: React.MouseEvent) => {
  //   e.preventDefault();
  //   fileEl.current?.click();
  // }, []);

  // useEffect(() => {
  //   return reaction(
  //     () => node.paramValues.get(parameter.id),
  //     data => {
  //       if (typeof data === 'string') {
  //         const url = data;
  //         if (url) {
  //           Axios.head(url).then(resp => {
  //             const name = resp.headers['x-amz-meta-name'];
  //             if (name) {
  //               setImageName(name);
  //             } else if (name) {
  //               setImageName(null);
  //             }
  //           });
  //         }
  //       } else if (typeof data?.name === 'string') {
  //         setImageName(data.name);
  //       }
  //     },
  //     { fireImmediately: true }
  //   );
  // }, [node, parameter]);

  // const onFileChanged = useCallback(() => {
  //   if (fileEl.current && fileEl.current.files && fileEl.current.files.length > 0) {
  //     const file = fileEl.current.files[0];
  //     const formData = new FormData();
  //     formData.append('attachment', file);
  //     // axiosInstance.post('/api/images', formData).then(
  //     //   resp => {
  //     //     renderer.loadTexture(resp.data.url, texture => {
  //     //       batch(() => {
  //     //         node.glResources?.textures.set(parameter.id, texture);
  //     //         node.paramValues.set(parameter.id, resp.data);
  //     //         graph.modified = true;
  //     //       });
  //     //     });
  //     //   },
  //     //   error => {
  //     //     console.error(error);
  //     //   }
  //     // );
  //   } else {
  //     batch(() => {
  //       node.paramValues.set(parameter.id, null);
  //       graph.modified = true;
  //     });
  //   }
  // }, [graph, node, parameter, renderer]);

  return (
    <section class={styles.panel}>
      {/* <input
        ref={fileEl}
        type="file"
        style={{ display: 'none' }}
        accept="image/*"
        onChange={onFileChanged}
      /> */}
      <Button>
        {node.paramValues.get(parameter.id) ? (
          <>
            <span class="name">{parameter.name}:&nbsp;</span>
            {/* <span class="value">{imageName}</span> */}
          </>
        ) : (
          <span class={styles.noImage}>Load image&hellip;</span>
        )}
      </Button>
    </section>
  );
};
