import glsl from '../operators/library/glsl';
import { ColorGradient, RGBAColor } from './colors';
import { DataType } from '../operators';
import { GLResources } from './GLResources';
import { GraphNode } from '../graph';
import { batch, createContext } from 'solid-js';

type RenderTaskState = 'running' | 'finishing' | 'stopped';

const vertexShaderSource = glsl`
#version 300 es
in vec4 aVertexPosition;
in vec4 aTextureCoords;
out highp vec2 vTextureCoord;

void main() {
  vTextureCoord = aTextureCoords.xy;
  gl_Position = aVertexPosition;
}`;

/** Renders a node into an HTML canvas element. */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private vertexShader: WebGLShader | null;
  private tiling: number;
  private vertexBuffers: WebGLBuffer[];
  private vertexBuffersInverted: WebGLBuffer[];
  private frameBuffer: WebGLFramebuffer;
  private nextTextureUnit: number;
  private invertY = false;
  private taskState: RenderTaskState = 'stopped';

  constructor() {
    this.canvas = document.createElement('canvas');
    this.gl = this.canvas.getContext('webgl2') as WebGLRenderingContext;
    if (!this.gl) {
      alert('Vortex requires a browser that supports WebGL 2.0.');
    }
    this.tiling = 1;
    const gl = this.gl;
    this.vertexBuffers = [this.createBuffer(1), this.createBuffer(2), this.createBuffer(3)];
    this.vertexBuffersInverted = [
      this.createBuffer(1, true),
      this.createBuffer(2, true),
      this.createBuffer(3, true),
    ];
    this.vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);

    this.frameBuffer = gl.createFramebuffer()!;
    this.nextTextureUnit = 0;
  }

  public get busy() {
    return this.taskState !== 'stopped';
  }

  public setTiling(tiling: number) {
    this.tiling = tiling;
  }

  public render(node: GraphNode, width: number, height: number, out: CanvasRenderingContext2D) {
    // this.taskState = 'running';
    const shaderSource = node.source;
    this.canvas.width = width;
    this.canvas.height = height;

    const gl = this.gl;

    if (shaderSource !== node.prevSource) {
      this.deleteShaderResources(node.glResources);
    }

    // Update buffered inputs - that is, nodes whose inputs require a texture.
    if (node.inputs.length > 0) {
      node.visitUpstreamNodes((upstreamNode, connection) => {
        const input = connection.dest.node.operator.getInput(connection.dest.id);
        if (input.buffered) {
          // TODO: We don't always need to redraw this every time.
          this.renderNodeToBuffer(upstreamNode, connection.dest.node, input.id);
        }
      });
    }

    this.nextTextureUnit = 0;
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.invertY = false;
    if (!node.glResources?.program) {
      node.prevSource = shaderSource;
      this.compileShaderProgram(shaderSource, node);
    }
    this.renderNode(node);
    out.drawImage(this.canvas, 0, 0);
    this.taskState = 'stopped';
  }

  // Render a node to a texture buffer, used by nodes that have buffered inputs.
  private renderNodeToBuffer(srcNode: GraphNode, dstNode: GraphNode, inputId: string) {
    const shaderSource = srcNode.source;
    const gl = this.gl;
    const width: number = nextHighestPowerOfTwo(this.canvas.width);
    const height: number = nextHighestPowerOfTwo(this.canvas.height);

    this.nextTextureUnit = 0;

    // We're rendering the source node and caching the result on the destination node.
    if (shaderSource !== srcNode.prevSource) {
      this.deleteShaderResources(srcNode.ensureGLResources());
    }

    const destResources = dstNode.ensureGLResources();
    let texture = destResources.textures.get(inputId) || null;
    if (!texture) {
      texture = gl.createTexture();
      batch(() => {
        if (texture) {
          destResources.textures.set(inputId, texture);
        }
      });
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const fb: any = this.frameBuffer; // WebGL type definitions missing frame buffer properties
    fb.width = width;
    fb.height = height;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.viewport(0, 0, width, height);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(1.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.invertY = true;
    if (!srcNode.glResources?.program) {
      srcNode.prevSource = shaderSource;
      this.compileShaderProgram(shaderSource, srcNode);
    }
    this.renderNode(srcNode);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  // Render a node with the specified renderer.
  public renderNode(node: GraphNode): void {
    const program: WebGLProgram = node.glResources?.program!;
    if (program) {
      this.executeShaderProgram(node, gl => {
        // Set the uniforms for this node and all upstream nodes.
        this.setShaderUniforms(node, program);
        for (const input of node.operator.inputs) {
          if (input.buffered) {
            this.setShaderInputBufferUniforms(node, program, input.id);
          }
        }
        node.visitUpstreamNodes((upstream, connection) => {
          this.setShaderUniforms(upstream, program);
          for (const input of upstream.operator.inputs) {
            if (input.buffered) {
              this.setShaderInputBufferUniforms(upstream, program, input.id);
            }
          }
        });
      });
    }
  }

  public executeShaderProgram(
    node: GraphNode,
    setShaderVars?: (gl: WebGLRenderingContext) => void
  ) {
    // This will happen if the shader failed to compile.
    const program = node.glResources?.program;
    if (!program) {
      return;
    }

    const gl = this.gl;
    const tiling = this.invertY ? 1 : this.tiling;

    gl.useProgram(program);
    if (this.invertY) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffersInverted[tiling - 1]);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffers[tiling - 1]);
    }

    // Set up the vertex buffer
    const vertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 4 * 4, 0);
    gl.enableVertexAttribArray(vertexPosition);

    const textureCoords = gl.getAttribLocation(program, 'aTextureCoords');
    if (textureCoords >= 0) {
      // If there's no generators connected, then no texture coords.
      gl.vertexAttribPointer(textureCoords, 2, gl.FLOAT, false, 4 * 4, 2 * 4);
      gl.enableVertexAttribArray(textureCoords);
    }

    if (setShaderVars) {
      setShaderVars(gl);
    }

    gl.drawArrays(gl.TRIANGLES, 0, tiling ** 2 * 6);
  }

  public setShaderUniforms(node: GraphNode, program: WebGLProgram) {
    const params = node.operator.paramList;
    const paramValues = node.paramValues;
    const gl = this.gl;
    for (const param of params) {
      if (param.pre) {
        continue;
      }
      const value = param.computed ? param.computed(node) : paramValues.get(param.id);
      const uniformName = node.operator.uniformName(node.id, param.id);
      switch (param.type) {
        case DataType.INTEGER:
          gl.uniform1i(
            gl.getUniformLocation(program, uniformName),
            value !== undefined ? value : 0
          );
          break;
        case DataType.FLOAT:
          gl.uniform1f(
            gl.getUniformLocation(program, uniformName),
            value !== undefined ? value : 0
          );
          break;
        case DataType.VEC2:
          if (value !== undefined) {
            gl.uniform2f(
              gl.getUniformLocation(program, uniformName),
              value[0],
              value[1],
            );
          } else {
            gl.uniform2f(gl.getUniformLocation(program, uniformName), 0, 0);
          }
          break;
        case DataType.VEC3:
          if (value !== undefined) {
            gl.uniform3f(
              gl.getUniformLocation(program, uniformName),
              value[0],
              value[1],
              value[2],
            );
          } else {
            gl.uniform3f(gl.getUniformLocation(program, uniformName), 0, 0, 0);
          }
          break;
        case DataType.VEC4:
          if (value !== undefined) {
            gl.uniform4f(
              gl.getUniformLocation(program, uniformName),
              value[0],
              value[1],
              value[2],
              value[3]
            );
          } else {
            gl.uniform4f(gl.getUniformLocation(program, uniformName), 0, 0, 0, 1);
          }
          break;
        case DataType.RGBA_GRADIENT: {
          // Shader requires a fixed-length array of 32 entries. Copy the colors into the
          // array and then pad the rest of the array with the final color;
          const gradient: ColorGradient = value !== undefined ? value : [];
          const colors: number[] = [];
          const positions: number[] = [];
          let lastColor: RGBAColor = [0, 0, 0, 1];
          gradient.forEach((cs, i) => {
            const color = Array.from(cs.value) as RGBAColor;
            if (colors.length < 32) {
              if (i === 0 && cs.position > 0) {
                colors.push(...color);
                positions.push(0);
              }
              colors.push(...color);
              positions.push(cs.position);
              lastColor = color;
            }
          });
          while (colors.length < 32) {
            colors.push(...lastColor);
            positions.push(1);
          }
          // Trick with concat() to flatten the color array.
          gl.uniform4fv(gl.getUniformLocation(program, `${uniformName}_colors`), colors);
          gl.uniform1fv(gl.getUniformLocation(program, `${uniformName}_positions`), positions);
          break;
        }
        case DataType.IMAGE: {
          if (value && node.glResources?.textures.has(param.id)) {
            this.bindTexture(program, node.getTexture(param.id), uniformName);
          } else {
            this.bindTexture(program, undefined, uniformName);
          }
          break;
        }
      }
    }
  }

  public setShaderInputBufferUniforms(node: GraphNode, program: WebGLProgram, id: string) {
    const input = node.getInputTerminal(id);
    this.bindTexture(
      program,
      input.connection ? node.getTexture(id) : undefined,
      node.operator.uniformName(node.id, id)
    );
  }

  public bindTexture(
    program: WebGLProgram,
    texture: WebGLTexture | undefined,
    uniformName: string
  ) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + this.nextTextureUnit);
    if (texture) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(gl.getUniformLocation(program, uniformName), this.nextTextureUnit);
      this.nextTextureUnit += 1;
    } else {
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  public compileShaderProgram(fsSource: string, node: GraphNode): void {
    const gl = this.gl;
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource, node);
    if (!fragmentShader) {
      console.error('Compilation failed');
      console.debug(fsSource);
      return;
      // console.debug(fragmentShader);
      //
      // const compiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
      // console.debug('Shader compiled successfully: ' + compiled);
      // const compilationLog = gl.getShaderInfoLog(fragmentShader);
      // console.debug('Shader compiler log: ' + compilationLog);
    }

    node.clearError();
    if (!this.vertexShader) {
      return;
    }

    // Create the shader program
    const shaderProgram = gl.createProgram()!;
    try {
      gl.attachShader(shaderProgram, this.vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);
    } catch (e) {
      console.error(e);
      console.debug(fsSource);
      return;
    }

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      node.setError(gl.getProgramInfoLog(shaderProgram));
      return;
    }
    node.clearError();
    node.ensureGLResources().fragment = fragmentShader;
    node.ensureGLResources().program = shaderProgram;
  }

  public deleteShaderResources(resources: GLResources | undefined) {
    const gl = this.gl;
    if (resources) {
      if (resources.program) {
        gl.deleteProgram(resources.program);
        resources.program = null;
      }
      if (resources.fragment) {
        gl.deleteShader(resources.fragment);
        resources.fragment = null;
      }
    }
  }

  public deleteTextureResources(resources: GLResources | undefined) {
    const gl = this.gl;
    if (resources) {
      resources.textures.forEach(texture => gl.deleteTexture(texture));
      resources.textures.clear();
    }
  }

  public loadTexture(url: string, callback: (texture: WebGLTexture) => void) {
    const gl = this.gl;

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const pixel = new Uint8Array([0, 100, 0, 255]); // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

    const image = new Image();
    image.onload = function () {
      // console.log('onLoad', texture, image.width, image.height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      callback(texture);
    };
    image.onerror = function (err) {
      console.error(err);
    }

    console.log('setting url', url);
    image.crossOrigin = '';
    image.src = url;
  }

  private compileShader(type: number, source: string, node?: GraphNode): WebGLShader | null {
    const gl = this.gl;
    const shader = gl.createShader(type)!;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const errorMessage = gl.getShaderInfoLog(shader);
      if (node) {
        node.setError(errorMessage);
      } else {
        alert('An error occurred compiling the shaders: ' + errorMessage);
      }
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private createBuffer(tiling: number, invert = false): WebGLBuffer {
    const gl = this.gl;
    const positions: number[] = [];
    const ty0 = invert ? 1 : 0;
    const ty1 = invert ? 0 : 1;
    for (let y = 0; y < tiling; y += 1) {
      const y0 = (y * 2) / tiling - 1;
      const y1 = ((y + 1) * 2) / tiling - 1;
      for (let x = 0; x < tiling; x += 1) {
        const x0 = (x * 2) / tiling - 1;
        const x1 = ((x + 1) * 2) / tiling - 1;
        // prettier-ignore
        positions.splice(positions.length, 0,
          x0, y0, 0, ty1,
          x0, y1, 0, ty0,
          x1, y0, 1, ty1,

          x0, y1, 0, ty0,
          x1, y0, 1, ty1,
          x1, y1, 1, ty0,
        );
      }
    }
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    return buffer;
  }
}

export const renderer = new Renderer();

function isPowerOf2(value: number) {
  return (value & (value - 1)) === 0;
}

function nextHighestPowerOfTwo(value: number): number {
  let result = 2;
  while (result < value) {
    result *= 2;
  }
  return result;
}
