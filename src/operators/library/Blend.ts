import { DataType, Input, Operator, Output, Parameter } from '..';
import {
  Expr,
  defineFn,
  fork,
  refInput,
  refTexCoords,
  refUniform,
  getAttr,
  multiply,
  add,
  subtract,
} from '../../render/Expr';
import { GraphNode } from '../../graph';
import { makeFunctionType } from '../FunctionDefn';
import { vec4, mix, max, min, abs } from '../../render/glIntrinsics';

enum BlendOp {
  MIX = 0,
  ADD = 1,
  SUBTRACT = 2,
  MULTIPLY = 3,
  DIFFERENCE = 4,
  LIGHTEN = 10,
  DARKEN = 11,
  SCREEN = 20,
  OVERLAY = 21,
  DODGE = 22,
  BURN = 23,
}

export const blend_screen = defineFn({
  name: 'blend_screen',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3, DataType.VEC3, DataType.FLOAT],
  }),
});

export const blend_overlay = defineFn({
  name: 'blend_overlay',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3, DataType.VEC3, DataType.FLOAT],
  }),
});

export const blend_dodge = defineFn({
  name: 'blend_dodge',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3, DataType.VEC3, DataType.FLOAT],
  }),
});

export const blend_burn = defineFn({
  name: 'blend_burn',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3, DataType.VEC3, DataType.FLOAT],
  }),
});

export const clamp_color = defineFn({
  name: 'clamp_color',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3],
  }),
});

class Blend extends Operator {
  public readonly inputs: Input[] = [
    {
      id: 'a',
      name: 'A',
      type: DataType.VEC4,
    },
    {
      id: 'b',
      name: 'B',
      type: DataType.VEC4,
    },
  ];
  public readonly outputs: Output[] = [
    {
      id: 'out',
      name: 'Out',
      type: DataType.VEC4,
    },
  ];
  public readonly params: Parameter[] = [
    {
      id: 'op',
      name: 'Operator',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Mix', value: BlendOp.MIX },
        { name: 'Add', value: BlendOp.ADD },
        { name: 'Subtract', value: BlendOp.SUBTRACT },
        { name: 'Multiply', value: BlendOp.MULTIPLY },
        { name: 'Difference', value: BlendOp.DIFFERENCE },
        { name: 'Lighten', value: BlendOp.LIGHTEN },
        { name: 'Darken', value: BlendOp.DARKEN },
        { name: 'Screen', value: BlendOp.SCREEN },
        { name: 'Overlay', value: BlendOp.OVERLAY },
        { name: 'Color Dodge', value: BlendOp.DODGE },
        { name: 'Color Burn', value: BlendOp.BURN },
      ],
      default: 1,
      pre: true,
    },
    {
      id: 'strength',
      name: 'Strength',
      type: DataType.FLOAT,
      min: 0,
      max: 1,
      default: 1,
    },
    {
      id: 'norm',
      name: 'Normalize',
      type: DataType.INTEGER,
      enumVals: [
        { name: 'Off', value: 0 },
        { name: 'On', value: 1 },
      ],
      default: 1,
      pre: true,
    },
  ];
  public readonly description = `
Blends two source images, similar to layer operations in GIMP or PhotoShop.
* **operator** determines the formula used to blend the two images.
* **strength** affects how much of the original image shows through.
* **normalize** controls whether the result is clamped to a [0..1] range.
`;

  constructor() {
    super('filter', 'Blend', 'filter_blend');
  }

  public getImports(node: GraphNode): Set<string> {
    const imports = new Set<string>();
    const op: BlendOp = node.paramValues.get('op');
    if (node.paramValues.get('norm')) {
      imports.add('clamp_color');
    }

    if (op === BlendOp.OVERLAY) {
      imports.add('blend_overlay');
    } else if (op === BlendOp.SCREEN) {
      imports.add('blend_screen');
    } else if (op === BlendOp.DODGE) {
      imports.add('blend_dodge');
    } else if (op === BlendOp.BURN) {
      imports.add('blend_burn');
    }

    return imports;
  }

  public getCode(node: GraphNode): Expr {
    const tuv = fork(refTexCoords(), 'uv');
    if (!node.getInputTerminal('a').connection) {
      return vec4(0.5, 0.5, 0.5, 1);
    }

    const a = fork(refInput('a', DataType.VEC4, node, tuv), 'a');
    const b = refInput('b', DataType.VEC4, node, tuv);
    const strength = refUniform('strength', DataType.FLOAT, node);
    const ca = getAttr(a, 'rgb', DataType.VEC3);
    const cb = getAttr(b, 'rgb', DataType.VEC3);
    const alpha = getAttr(a, 'a', DataType.FLOAT);

    if (!node.getInputTerminal('b').connection) {
      return a;
    }

    const op: BlendOp = node.paramValues.get('op');
    const norm: boolean = node.paramValues.get('norm');

    // Ops which don't require normalization
    if (op === BlendOp.MIX) {
      return vec4(mix(ca, cb, strength), alpha);
    } else if (op === BlendOp.ADD) {
      if (norm) {
        return vec4(mix(ca, clamp_color(add(ca, cb, DataType.VEC3)), strength), alpha);
      } else {
        return vec4(mix(ca, add(ca, cb, DataType.VEC3), strength), alpha);
      }
    } else if (op === BlendOp.SUBTRACT) {
      if (norm) {
        return vec4(mix(ca, clamp_color(subtract(ca, cb, DataType.VEC3)), strength), alpha);
      } else {
        return vec4(mix(ca, subtract(ca, cb, DataType.VEC3), strength), alpha);
      }
    } else if (op === BlendOp.MULTIPLY) {
      return vec4(mix(ca, multiply(ca, cb, DataType.VEC3), strength), alpha);
    } else if (op === BlendOp.DIFFERENCE) {
      return vec4(mix(ca, abs(subtract(ca, cb, DataType.VEC3)), strength), alpha);
    } else if (op === BlendOp.LIGHTEN) {
      return vec4(mix(ca, max(ca, cb), strength), alpha);
    } else if (op === BlendOp.DARKEN) {
      return vec4(mix(ca, min(ca, cb), strength), alpha);
    } else if (op === BlendOp.OVERLAY) {
      if (norm) {
        return vec4(mix(ca, clamp_color(blend_overlay(ca, cb, DataType.VEC3)), strength), alpha);
      } else {
        return vec4(mix(ca, blend_overlay(ca, cb, DataType.VEC3), strength), alpha);
      }
    } else if (op === BlendOp.SCREEN) {
      if (norm) {
        return vec4(mix(ca, clamp_color(blend_screen(ca, cb, DataType.VEC3)), strength), alpha);
      } else {
        return vec4(mix(ca, blend_screen(ca, cb, DataType.VEC3), strength), alpha);
      }
    } else if (op === BlendOp.DODGE) {
      if (norm) {
        return vec4(mix(ca, clamp_color(blend_dodge(ca, cb, DataType.VEC3)), strength), alpha);
      } else {
        return vec4(mix(ca, blend_dodge(ca, cb, DataType.VEC3), strength), alpha);
      }
    } else if (op === BlendOp.BURN) {
      if (norm) {
        return vec4(mix(ca, clamp_color(blend_burn(ca, cb, DataType.VEC3)), strength), alpha);
      } else {
        return vec4(mix(ca, blend_burn(ca, cb, DataType.VEC3), strength), alpha);
      }
    }

    throw Error('Invalid blend operator: ' + op);
  }
}

export default new Blend();
