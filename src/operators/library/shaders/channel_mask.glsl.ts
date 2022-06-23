import glsl from '../glsl';

export default glsl`
vec4 channel_mask(
    vec4 base,
    vec4 r,
    vec4 g,
    vec4 b,
    vec4 mask) {
  return mix(mix(mix(base, b, mask.b), g, mask.g), r, mask.r);
}
`;
