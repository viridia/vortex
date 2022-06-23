import glsl from '../glsl';

export default glsl`
vec4 crossfade(sampler2D src, float x_overlap, float y_overlap, vec2 uv) {
  vec2 overlap = vec2(x_overlap * 0.005, y_overlap * 0.005);
  vec2 sz = 1.0 - overlap;
  vec2 uv0 = uv * sz;
  vec2 uv1 = (uv + 1.0) * sz;
  vec2 m = min(vec2(1.0, 1.0), uv / overlap);

  return mix(
      mix(texture(src, uv1), texture(src, vec2(uv0.x, uv1.y)), m.x),
      mix(texture(src, vec2(uv1.x, uv0.y)), texture(src, uv0), m.x),
      m.y);
}
`;
