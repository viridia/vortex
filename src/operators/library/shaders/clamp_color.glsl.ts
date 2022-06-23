import glsl from '../glsl';

export default glsl`
vec3 clamp_color(vec3 color) {
  const vec3 ONE = vec3(1.0, 1.0, 1.0);
  const vec3 ZERO = vec3(0.0, 0.0, 0.0);
  return min(max(color, ZERO), ONE);
}
`;
