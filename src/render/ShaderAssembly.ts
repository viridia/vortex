import { DataType } from '../operators';
import { Expr, assign, refLocal } from './Expr';
import { GraphNode } from '../graph';
import { byName } from '../operators/library/shaders';
import { transform } from './pass/transform';
import { generate } from './pass/generate';
import { printToString } from './codefmt/print';

/** Observer that regenerates a shader when the inputs change. */
export class ShaderAssembly {
  constructor(private node: GraphNode) {}

  public dispose() {}

  public get source(): string {
    return [...this.prelude, ...this.imports, ...this.attribs, ...this.uniforms, ...this.main].join(
      '\n'
    );
  }

  private get prelude(): string[] {
    return [
      '#version 300 es',
      'precision mediump float;',
      '',
      `// Shader for ${this.node.operator.name}`,
      '',
    ];
  }

  private get imports(): string[] {
    const result: string[] = [];
    this.node.transitiveImports.forEach(name => {
      const chunk = byName[name];
      if (!chunk) {
        throw Error(`Invalid shader fragment: ${name}`);
      }

      result.push(`// Imported from ${name}.glsl`);
      result.push(chunk);
    });

    return result;
  }

  private get attribs(): string[] {
    return ['in highp vec2 vTextureCoord;', 'out vec4 fragColor;', ''];
  }

  /** List of uniform declarations. */
  private get uniforms(): string[] {
    const result: string[][] = [];
    const visitedNodes = new Set<GraphNode>();
    this.node.visitUpstreamNodes(node => {
      if (!visitedNodes.has(node)) {
        visitedNodes.add(node);
        result.push(node.uniforms);
      }
    });
    return ([] as string[]).concat(...result, this.node.uniforms);
  }

  private get main(): string[] {
    return ['void main() {', this.body, '}'];
  }

  private get body(): string {
    // Get expressions
    const result = this.node.outputCode;

    // Transform expessions
    const stmts: Expr[] = [];
    transform(assign(refLocal('fragColor', DataType.VEC4), result), stmts);

    return printToString(stmts.map(generate), {
      maxWidth: 100,
      initialIndent: 1,
    });
  }
}
