import glsl from '../glsl';

export default glsl`
float hexgrid(
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
  float s = y * 2.0 + x;
  float t = y * 2.0 - x;

  float xf = floor(x * 2.0);
  float dx = x * 2.0 - xf;
  float sf = floor(s);
  float ds = s - sf;
  float tf = floor(t);
  float dt = t - tf;

  int xi = int(xf - floor(xf / 3.0) * 3.0);
  int si = int(sf - floor(sf / 3.0) * 3.0);
  int ti = int(tf - floor(tf / 3.0) * 3.0);

  int ci = si + ti;
  if (ci > 2) {
    ci -= 3;
  }
  xi += si;
  if (xi > 2) {
    xi -= 3;
  }

  // float value = 0.0;
  if (ci == 0) {
    if (xi == 0) {
      dx = 1.0 - dx;
    }
  } else if (ci == 1) {
    if (xi == 1) {
      ds = 1.0 - ds;
      dx = 1.0 - dx;
    } else {
      dt = 1.0 - dt;
    }
  } else {
    ds = 1.0 - ds;
    dt = 1.0 - dt;
    if (xi != 0) {
      dx = 1.0 - dx;
    }
  }

  dx = linearstep(spacing, spacing + blur * roundness, dx);
  ds = linearstep(spacing, spacing + blur * roundness, ds);
  dt = linearstep(spacing, spacing + blur * roundness, dt);

  float value;
  if (corner == 1) { // Mitered
    value = (dx + ds + dt) - 2.0;
  } else if (corner == 2) { // Rounded
    value = 1. - sqrt((1. - dx) * (1. - dx) + (1. - ds) * (1. - ds) + (1. - dt) * (1. - dt));
  } else { // Sharp
    value = min(min(dx, ds), dt);
  }

  value = smoothstep(0.0, 1.0, value * roundness);
  return value;
}
`;
