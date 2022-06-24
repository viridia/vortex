import glsl from '../glsl';

export default glsl`
vec4 hslAdjust(
    vec4 src,
    float contrast,
    float brightness,
    float hue,
    float saturation) {
  src -= 0.5;
  src.rgb *= pow(4.0, contrast);
  src += 0.5 + brightness * 0.5;
  vec3 hsv = rgb2hsv(src.rgb);
  hsv.x = fract(hsv.x + hue * 0.5);
  hsv.y *= pow(2.0, saturation);
  return vec4(hsv2rgb(hsv), src.a);
}
`;
