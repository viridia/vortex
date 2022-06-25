import glsl from '../glsl';

export default glsl`
float periodicNoiseTurbulence(
    vec2 uv,
    int scale_x,
    int scale_y,
    float offset_z,
    int start_band,
    int end_band,
    float roughness,
    float turbulence) {
  float coeff = 1.0;
  vec2 accum = vec2(0.0, 0.0);
  float total = 0.0;
  float sx = float(scale_x);
  float sy = float(scale_y);

  // First calculate the turbulence
  for (int i = 1; i <= 16; i += 1) {
    if (i >= start_band && i <= end_band) {
      accum += vec2(
        pnoise(vec3(uv.x * sx + 23., uv.y * sy + 29., offset_z), vec3(sx, sy, 1000)),
        pnoise(vec3(uv.x * sx + 13., uv.y * sy + 17., offset_z), vec3(sx, sy, 1000))
       ) * coeff;
      total += coeff;
      coeff *= roughness;
      uv.x += 3.;
      uv.y += 5.;
    }
    sx *= 2.0;
    sy *= 2.0;
  }
  vec2 turboCoords = (accum / total) * turbulence;

  // Then the noise output
  coeff = 1.0;
  float accum2 = 0.0;
  total = 0.0;
  sx = float(scale_x);
  sy = float(scale_y);
  for (int i = 1; i <= 16; i += 1) {
    if (i >= start_band && i <= end_band) {
      accum2 += pnoise(
        vec3(uv.x * sx + turboCoords.x, uv.y * sy + turboCoords.y, offset_z),
        vec3(sx, sy, 1000)
      ) * coeff;
      total += coeff;
      coeff *= roughness;
      uv.x += 11.;
      uv.y += 37.;
    }
    sx *= 2.0;
    sy *= 2.0;
  }
  return (accum2 / total) + 0.5;
}
`;
