/** @ts-ignore */
import hsl2rgb_ext from 'float-hsl2rgb';
/** @ts-ignore */
import rgb2hsl_ext from 'float-rgb2hsl';

// Color types.
export type RGBColor = [number, number, number];
export type HSLColor = [number, number, number];
export type RGBAColor = [number, number, number, number];
export type HSLAColor = [number, number, number, number];

// Color gradients
export interface ColorStop {
  value: RGBAColor;
  position: number;
}

export type ColorGradient = ColorStop[];

// Format as CSS #nnnnnn
function cc(v: number) {
  return ('00' + Math.round(v * 255).toString(16)).substr(-2);
}

export function formatCssColor([r, g, b]: RGBColor | RGBAColor) {
  return `#${cc(r)}${cc(g)}${cc(b)}`;
}

// Format as CSS rgba
export function formatRGBAColor([r, g, b, a]: RGBAColor) {
  const rnd = Math.round;
  return `rgba(${rnd(r  * 255)}, ${rnd(g * 255)}, ${rnd(b * 255)}, ${rnd(a * 1000) / 1000})`;
}

// HSL conversion
export const hsl2rgb: (hsl: HSLColor | HSLAColor) => RGBColor = hsl2rgb_ext;
export const rgb2hsl: (rgb: RGBColor | RGBAColor) => HSLColor = rgb2hsl_ext;

export function hsla2rgba(hsla: HSLAColor): RGBAColor {
  return [...hsl2rgb(hsla), hsla[3]] as RGBAColor;
}

export function rgba2hsla(rgba: RGBAColor): HSLAColor {
  return [...rgb2hsl(rgba), rgba[3]] as HSLAColor;
}
