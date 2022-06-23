import glsl from '../glsl';

export default glsl`
float cellularNoise(
    vec2 uv,
    int scale_x,
    int scale_y,
    float offset_z,
    float jitter,
    float scale_value,
    int func) {
  vec2 s = vec2(float(scale_x), float(scale_y));
  vec2 f = pworley(vec3(uv * s, offset_z), vec3(s, 1000), jitter, false) * scale_value;
  float v = f.x;
  if (func == 1) {
    v = f.y;
  } else if (func == 2) {
    v = f.y - f.x;
  }
  return v;
}
`;
