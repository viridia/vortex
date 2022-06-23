import glsl from '../glsl';

export default glsl`
float modulus(
    float inputVal,
    int frequency,
    float offset,
    float phase) {
  float period = 1.0 / float(frequency);
  float v = inputVal + offset * period;
  v = fract(v / period);
  if (v > phase) {
    v = 1. - (v - phase) / (1. - phase);
  } else {
    v *= 1.0 / phase;
  }
  return smoothstep(0., 1., v);
}
`;
