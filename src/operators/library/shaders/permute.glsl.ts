import glsl from '../glsl';

export default glsl`
float permute(float x) {
  return mod((34.0 * x + 1.0) * x, 289.0);
}

vec2 permute(vec2 x) {
  return mod((34.0 * x + 1.0) * x, 289.0);
}

vec3 permute(vec3 x) {
  return mod((34.0 * x + 1.0) * x, 289.0);
}

vec4 permute(vec4 x) {
  return mod((34.0 * x + 1.0) * x, 289.0);
}

float permute2(vec2 v) {
  return permute(permute(v.x) + v.y);
}
`;
