import glsl from '../glsl';

export default glsl`
float waves(
    vec2 uv,
    int xf0,
    int yf0,
    float phase0,
    int xf1,
    int yf1,
    float phase1,
    int xf2,
    int yf2,
    float phase2,
    float amp) {
  vec2 f0 = uv * 3.14159 * 2.0 * vec2(float(xf0), float(yf0));
  vec2 f1 = uv * 3.14159 * 2.0 * vec2(float(xf1), float(yf1));
  vec2 f2 = uv * 3.14159 * 2.0 * vec2(float(xf2), float(yf2));
  float v = 1.0;
  if (xf0 != 0 || yf0 != 0) {
    v *= sin(f0.x + f0.y + phase0);
  }
  if (xf1 != 0 || yf1 != 0) {
    v *= sin(f1.x + f1.y + phase1);
  }
  if (xf2 != 0 || yf2 != 0) {
    v *= sin(f2.x + f2.y + phase0);
  }
  v *= amp;
  // float v = sin(f0.x + f0.y + phase0) * sin(f1.x + f1.y + phase1)
  //   * sin(u.x * xf1 + u.y * yf0 + phase0)
  //   * sin(u.x * xf1 + u.y * yf0 + phase0);
  //   * amp;
  return v * 0.5 + 0.5;
}
`;
