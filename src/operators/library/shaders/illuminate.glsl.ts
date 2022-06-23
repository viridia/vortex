import glsl from '../glsl';

export default glsl`
vec4 illuminate(
    vec4 src,
    vec4 normal,
    vec3 lightDir,
    float shininess,
    vec4 ambient,
    vec4 diffuse,
    vec4 specular) {
  vec3 n = normal.xyz * 2.0 - 1.0;
  vec3 color = (src * ambient).xyz;
  vec3 ref = reflect(vec3(0., 0., -1.), n);
  float d = max(dot(n, lightDir), 0.);
  color += src.xyz * diffuse.xyz * d;
  float r = max(dot(ref, lightDir), 0.);
  color += specular.xyz * pow(r, shininess);
  return vec4(color, src.a);
}
`;
