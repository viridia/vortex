import glsl from '../glsl';

export default glsl`
vec4 gradient(
    vec2 uv,
    int type,
    vec4 color_colors[32],
    float color_positions[32]) {
  float t = 0.0;
  if (type == 0) {
    t = uv.x;
  } else if (type == 1) {
    t = uv.y;
  } else if (type == 2) {
    t = 1. - abs(uv.x - 0.5) * 2.0;
  } else if (type == 3) {
    t = 1. - abs(uv.y - 0.5) * 2.0;
  } else if (type == 4) {
    float x = abs(uv.x - 0.5) * 2.0;
    float y = abs(uv.y - 0.5) * 2.0;
    t = 1. - 0.5 * sqrt(x*x + y*y);
  } else {
    t = 1. - max(abs(uv.x - 0.5), abs(uv.y - 0.5)) * 2.0;
  }
  return gradientColor(t, color_colors, color_positions);
  // return vec4(vec3(1.0, 1.0, 1.0) * t, 1);
}
`;
