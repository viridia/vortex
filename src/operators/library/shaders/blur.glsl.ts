import glsl from '../glsl';

export default glsl`
vec4 blur(sampler2D src, float radius, vec2 uv) {
  vec4 accum = vec4(0.0);
  ivec2 sz = textureSize(src, 0);
  vec2 d = 1.0 / vec2(float(sz.x), float(sz.y));
  float total = 0.0;
  float oneOverRadius = 1.0 / radius;
  for (float x = 0.0; x < radius; x += d.x) {
    for (float y = 0.0; y < radius; y += d.y) {
      float dist = sqrt(x * x + y * y) * oneOverRadius;
      float s = smoothstep(1.0, 0.0, dist);
      if (x == 0.0) { // Center column samples the same texel twice
        s *= 0.5;
      }
      if (y == 0.0) { // Center row samples the same texel twice
        s *= 0.5;
      }
      accum += s * (texture(src, fract(vec2(uv.x + x, uv.y + y)))
                  + texture(src, fract(vec2(uv.x - x, uv.y + y)))
                  + texture(src, fract(vec2(uv.x + x, uv.y - y)))
                  + texture(src, fract(vec2(uv.x - x, uv.y - y))));
      total += s * 4.0;
    }
  }
  return accum / total;
}
`;
