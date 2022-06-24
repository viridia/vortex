import glsl from '../glsl';

export default glsl`
vec4 periodicNoise(
    vec2 uv,
    int scale_x,
    int scale_y,
    float offset_z,
    float scale_value,
    int start_band,
    int end_band,
    float roughness,
    vec4 color_colors[32],
    float color_positions[32]) {
  float accum = 0.0;
  float sx = float(scale_x);
  float sy = float(scale_y);
  float sv = scale_value;
  for (int i = 1; i <= 16; i += 1) {
    if (i >= start_band && i <= end_band) {
      accum += pnoise(vec3(uv.x * sx, uv.y * sy, offset_z), vec3(sx, sy, 1000)) * sv;
      offset_z += 1.0;
      sv *= roughness;
    }
    sx *= 2.0;
    sy *= 2.0;
  }
  return gradientColor(accum + 0.5, color_colors, color_positions);
}
`;
