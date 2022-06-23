import glsl from '../glsl';

export default glsl`
float triangles(
    vec2 uv,
    int xCount,
    int yCount,
    float spacing,
    float roundness,
    float blur,
    float xOffset,
    float yOffset,
    int corner) {
  float x = (uv.x + xOffset) * float(xCount);
  float y = (uv.y + yOffset) * float(yCount);
  float s = y + x * 0.5;
  float t = y - x * 0.5;

  float xi = floor(x + 0.5);
  float si = floor(s + 0.5);
  float ti = floor(t + 0.5);

  float dx = linearstep(spacing, spacing + blur * roundness, abs(x - xi));
  float ds = linearstep(spacing, spacing + blur * roundness, abs(s - si));
  float dt = linearstep(spacing, spacing + blur * roundness, abs(t - ti));

  float value;
  if (corner == 1) { // Mitered
    value = max(0., (dx + ds + dt) - 2.0);
  } else if (corner == 2) { // Rounded
    value = max(0., 1. - sqrt((1.-dx) * (1.-dx) + (1.-ds) * (1.-ds) + (1.-dt) * (1.-dt)));
  } else { // Sharp
    value = min(min(dx, ds), dt);
  }

  value = smoothstep(0.0, 1.0, value * roundness);
  return value;
}
`;
