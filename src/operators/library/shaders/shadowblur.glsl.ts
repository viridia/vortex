import glsl from '../glsl';

export default glsl`
vec4 shadowblur(sampler2D src, float radius, vec2 uv) {
  ivec2 sz = textureSize(src, 0);
  vec2 d = 1.0 / vec2(float(sz.x), float(sz.y));
  float total = 0.0;
  float oneOverRadius = radius > 0. ? 1.0 / radius : 1.;
  vec4 accum = texture(src, fract(vec2(uv.x, uv.y)));
  for (float x = 0.0; x < radius; x += d.x) {
    for (float y = 0.0; y < radius; y += d.y) {
      float dist = sqrt(x * x + y * y) * oneOverRadius;
      float s = smoothstep(1.0, 0.0, dist);
      accum = max(accum, s * texture(src, fract(vec2(uv.x + x, uv.y + y))));
      accum = max(accum, s * texture(src, fract(vec2(uv.x - x, uv.y + y))));
      accum = max(accum, s * texture(src, fract(vec2(uv.x + x, uv.y - y))));
      accum = max(accum, s * texture(src, fract(vec2(uv.x - x, uv.y - y))));
    }
  }
  return accum;
}
`;
