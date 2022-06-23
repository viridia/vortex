import glsl from '../glsl';

export default glsl`
float bricks(
    vec2 uv,
    int xCount,
    int yCount,
    float xSpacing,
    float ySpacing,
    float xBlur,
    float yBlur,
    float xOffset,
    float yOffset,
    float stagger,
    int corner) {
  float y = (uv.y + yOffset) * float(yCount);
  float yr = floor(y);
  float yi = floor(y + 0.5);
  float yf = smootherstep(ySpacing, ySpacing + yBlur, abs(y - yi));
  float x = (uv.x + xOffset) * float(xCount) + (floor(yr * 0.5) * 2.0 == yr ? stagger : 0.0);
  float xi = floor(x + 0.5);
  float xf = smootherstep(xSpacing, xSpacing + xBlur, abs(x - xi));
  float value;
  if (corner == 1) { // Mitered
    value = max(0., (xf + yf) - 1.0);
  } else if (corner == 2) { // Rounded
    value = max(0., 1. - sqrt((1.-xf) * (1.-xf) + (1.-yf) * (1.-yf)));
  } else { // Square
    value = min(xf, yf);
  }
  return value;
}
`;
