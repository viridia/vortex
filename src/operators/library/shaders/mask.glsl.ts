import glsl from '../glsl';

export default glsl`
vec4 mask(
    vec4 a,
    vec4 b,
    float mask,
    int invert) {
  if (invert != 0) {
    mask = 1.0 - mask;
  }
  return mix(b, a, mask);
}
`;
