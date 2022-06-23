// Defines built-in GLSL functions
import { DataType } from '../operators';
import { defineFn } from './Expr';
import { makeFunctionType } from '../operators/FunctionDefn';

export const vec2 = defineFn({
  name: 'vec2',
  type: makeFunctionType([
    {
      result: DataType.VEC2,
      args: [DataType.FLOAT, DataType.FLOAT],
    },
    {
      result: DataType.VEC2,
      args: [DataType.FLOAT],
    },
  ]),
});

export const vec3 = defineFn({
  name: 'vec3',
  type: makeFunctionType([
    {
      result: DataType.VEC3,
      args: [DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
    },
    {
      result: DataType.VEC3,
      args: [DataType.VEC2, DataType.FLOAT],
    },
    {
      result: DataType.VEC3,
      args: [DataType.FLOAT, DataType.VEC2],
    },
    {
      result: DataType.VEC3,
      args: [DataType.FLOAT],
    },
  ]),
});

export const vec4 = defineFn({
  name: 'vec4',
  type: makeFunctionType([
    {
      result: DataType.VEC4,
      args: [DataType.FLOAT, DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
    },
    {
      result: DataType.VEC4,
      args: [DataType.VEC2, DataType.FLOAT, DataType.FLOAT],
    },
    {
      result: DataType.VEC4,
      args: [DataType.FLOAT, DataType.VEC2, DataType.FLOAT],
    },
    {
      result: DataType.VEC4,
      args: [DataType.FLOAT, DataType.FLOAT, DataType.VEC2],
    },
    {
      result: DataType.VEC4,
      args: [DataType.VEC3, DataType.FLOAT],
    },
    {
      result: DataType.VEC4,
      args: [DataType.FLOAT, DataType.VEC3],
    },
    {
      result: DataType.VEC4,
      args: [DataType.VEC2, DataType.VEC2],
    },
    {
      result: DataType.VEC4,
      args: [DataType.FLOAT],
    },
  ]),
});

export const fract = defineFn({
  name: 'fract',
  type: makeFunctionType([
    {
      result: DataType.FLOAT,
      args: [DataType.FLOAT],
    },
    {
      result: DataType.VEC2,
      args: [DataType.VEC2],
    },
    {
      result: DataType.VEC3,
      args: [DataType.VEC3],
    },
    {
      result: DataType.VEC4,
      args: [DataType.VEC4],
    },
  ]),
});

export const normalize = defineFn({
  name: 'normalize',
  type: makeFunctionType([
    {
      result: DataType.VEC2,
      args: [DataType.VEC2],
    },
    {
      result: DataType.VEC3,
      args: [DataType.VEC3],
    },
    {
      result: DataType.VEC4,
      args: [DataType.VEC4],
    },
  ]),
});

export const cross = defineFn({
  name: 'cross',
  type: makeFunctionType({
    result: DataType.VEC3,
    args: [DataType.VEC3, DataType.VEC3],
  }),
});

export const abs = defineFn({
  name: 'abs',
  type: makeFunctionType([
    {
      result: DataType.FLOAT,
      args: [DataType.FLOAT],
    },
    {
      result: DataType.VEC2,
      args: [DataType.VEC2],
    },
    {
      result: DataType.VEC3,
      args: [DataType.VEC3],
    },
    {
      result: DataType.VEC4,
      args: [DataType.VEC4],
    },
  ]),
});

export const mix = defineFn({
  name: 'mix',
  type: makeFunctionType([
    {
      result: DataType.FLOAT,
      args: [DataType.FLOAT, DataType.FLOAT, DataType.FLOAT],
    },
    {
      result: DataType.VEC2,
      args: [DataType.VEC2, DataType.VEC2, DataType.FLOAT],
    },
    {
      result: DataType.VEC3,
      args: [DataType.VEC3, DataType.VEC3, DataType.FLOAT],
    },
    {
      result: DataType.VEC4,
      args: [DataType.VEC4, DataType.VEC4, DataType.FLOAT],
    },
  ]),
});

export const max = defineFn({
  name: 'max',
  type: makeFunctionType([
    {
      result: DataType.FLOAT,
      args: [DataType.FLOAT, DataType.FLOAT],
    },
    {
      result: DataType.VEC2,
      args: [DataType.VEC2, DataType.VEC2],
    },
    {
      result: DataType.VEC3,
      args: [DataType.VEC3, DataType.VEC3],
    },
    {
      result: DataType.VEC4,
      args: [DataType.VEC4, DataType.VEC4],
    },
  ]),
});

export const min = defineFn({
  name: 'min',
  type: makeFunctionType([
    {
      result: DataType.FLOAT,
      args: [DataType.FLOAT, DataType.FLOAT],
    },
    {
      result: DataType.VEC2,
      args: [DataType.VEC2, DataType.VEC2],
    },
    {
      result: DataType.VEC3,
      args: [DataType.VEC3, DataType.VEC3],
    },
    {
      result: DataType.VEC4,
      args: [DataType.VEC4, DataType.VEC4],
    },
  ]),
});
