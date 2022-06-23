import glsl from '../glsl';

export default glsl`
float linearstep(float low, float high, float t) {
  if (t <= low) { return 0.0; }
  if (t >= high) { return 1.0; }
  return (t - low) / (high - low);
}

float smootherstep(float low, float high, float t) {
  if (t <= low) { return 0.0; }
  if (t >= high) { return 1.0; }
  float e = (t - low) / (high - low);
  return e * e * e * (e * (e * 6.0 - 15.0) + 10.0);
}
`;
