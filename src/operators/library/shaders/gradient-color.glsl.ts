import glsl from '../glsl';

// Due to limitations of GLSL, arrays must have a fixed length. It's the responsibility of the
// operator to pad the array to 32 entries. This won't be inefficient since the GPU executes
// all of the loop iterations in parallel.
export default glsl`
vec4 gradientColor(
    float inputValue,
    vec4 stopColors[32],
    float stopPositions[32]) {
  inputValue = max(0.0, min(0.99999, inputValue));
  vec4 result = vec4(0.0, 0.0, 0.0, 1.0);
  for (int nextStop = 1; nextStop < 32; nextStop++) {
    float t0 = stopPositions[nextStop - 1];
    float t1 = stopPositions[nextStop];
    if (inputValue >= t0 && inputValue < t1) {
      result = mix(stopColors[nextStop - 1], stopColors[nextStop], (inputValue - t0) / (t1 - t0));
    }
  }
  return result;
}
`;
