import glsl from '../glsl';

export const blend_screen = glsl`
vec3 blend_screen(vec3 a, vec3 b, float strength) {
  const vec3 ONE = vec3(1.0, 1.0, 1.0);
  const vec3 ZERO = vec3(0.0, 0.0, 0.0);
  return ONE - (ONE - a ) * (ONE - b);
}
`;

export const blend_overlay = glsl`
float blend_overlay_helper(float a, float b) {
  return a < .5 ? (2. * a * b) : (1. - 2. * (1. - a) * (1. - b));
}

vec3 blend_overlay(vec3 a, vec3 b, float strength) {
  return vec3(
    blend_overlay_helper(a.r, b.r),
    blend_overlay_helper(a.g, b.g),
    blend_overlay_helper(a.b, b.b));
}
`;

export const blend_dodge = glsl`
vec3 blend_dodge(vec3 a, vec3 b, float strength) {
  const vec3 ONE = vec3(1.0, 1.0, 1.0);
  const vec3 ZERO = vec3(0.0, 0.0, 0.0);
  const vec3 SMALL = vec3(1.0/256.0, 1.0/256.0, 1.0/256.0);
  return a / max(SMALL, ONE - b);
}
`;

export const blend_burn = glsl`
vec3 blend_burn(vec3 a, vec3 b, float strength) {
  const vec3 ONE = vec3(1.0, 1.0, 1.0);
  const vec3 ZERO = vec3(0.0, 0.0, 0.0);
  const vec3 SMALL = vec3(1.0/256.0, 1.0/256.0, 1.0/256.0);
  return ONE - (ONE - a) / max(SMALL, b);
}
`;
