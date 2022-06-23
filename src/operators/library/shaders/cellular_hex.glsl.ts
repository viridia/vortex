import glsl from '../glsl';

export default glsl`
bool evenRow(vec2 id) {
  return fract(id.y * 0.5) > 0.;
}

float distToHexCenter(vec2 uv, vec2 id, vec2 repeat, int x, int y, float jitter) {
  id += vec2(x, y);
  vec2 center = id;
  center.y += 0.5;
  if (evenRow(id)) {
      center.x += 0.5;
  }
  id = mod(id, repeat);
  center.x += permute2(id) / 289. * jitter;
  center.y += permute(permute2(id) + 1.) / 289. * jitter;
  vec2 delta = uv - center;
  delta.y *= 5. / 6.;
  return dot(delta, delta);
}

vec2 cellular6(vec2 uv, vec2 repeat, float jitter) {
  vec2 id = floor(uv);

  float closestDist = 1.0;
  float secondClosestDist = 1.0;
  for (int y = -1; y <= 1; y += 1) {
      for (int x = -1; x <= 1; x += 1) {
          float dist = distToHexCenter(uv, id, repeat, x, y, jitter);
          if (dist < closestDist) {
              secondClosestDist = closestDist;
              closestDist = dist;
          } else {
              secondClosestDist = min(dist, secondClosestDist);
          }
      }
  }

  return sqrt(vec2(closestDist, secondClosestDist));
}

float cellularHex(
  vec2 uv,
  int scale_x,
  int scale_y,
  float offset_z,
  float jitter,
  float scale_value,
  int func)
{
  vec2 s = vec2(float(scale_x), float(scale_y));
  vec2 f = cellular6(
  uv * s,  //  vec3(uv * s, offset_z),
  s,  // vec3(s, 1000),
  jitter /*, false */) * scale_value;
  float v = f.x;
  if (func == 1) {
    v = f.y;
  } else if (func == 2) {
    v = f.y - f.x;
  }
  return v;
}
`;
