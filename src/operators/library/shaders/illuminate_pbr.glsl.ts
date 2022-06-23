import glsl from '../glsl';

export default glsl`

const float PI = 3.14159265359;

float D_BeckmannNormal(float NdotH, float roughness) {
  float roughnessSqr = roughness*roughness;
  float NdotHSqr = NdotH*NdotH;
  return max(
    0.000001,
    (1.0 / (PI * roughnessSqr * NdotHSqr*NdotHSqr)) * exp((NdotHSqr - 1.)/(roughnessSqr * NdotHSqr)));
}

float GeometrySchlickGGX(float NdotV, float roughness) {
  float r = (roughness + 1.0);
  float k = (r * r) / 8.0;

  float num = NdotV;
  float denom = NdotV * (1.0 - k) + k;

  return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float ggx2  = GeometrySchlickGGX(NdotV, roughness);
  float ggx1  = GeometrySchlickGGX(NdotL, roughness);

  return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

/* void main2()
{
    vec3 N = normalize(Normal);
    vec3 V = normalize(camPos - WorldPos);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    // reflectance equation
    vec3 Lo = vec3(0.0);
    for(int i = 0; i < 4; ++i)
    {
        // calculate per-light radiance
        vec3 L = normalize(lightPositions[i] - WorldPos);
        vec3 H = normalize(V + L);
        float distance    = length(lightPositions[i] - WorldPos);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance     = lightColors[i] * attenuation;

        // cook-torrance brdf
        float NDF = DistributionGGX(N, H, roughness);
        float G   = GeometrySmith(N, V, L, roughness);
        vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        vec3 numerator    = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0);
        vec3 specular     = numerator / max(denominator, 0.001);

        // add to outgoing radiance Lo
        float NdotL = max(dot(N, L), 0.0);
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    vec3 ambient = vec3(0.03) * albedo * ao;
    vec3 color = ambient + Lo;

    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));

    FragColor = vec4(color, 1.0);
}   */

vec4 illuminate_pbr(
    vec4 src,
    vec4 normalEncoded,
    vec3 lightDir,
    float roughness,
    float metalness,
    vec4 ambient,
    vec4 diffuse) {
  lightDir = normalize(lightDir);
  vec3 normal = normalize(normalEncoded.xyz * 2. - 1.);
  vec3 albedo = src.rgb;
  vec3 radiance = diffuse.xyz;

  vec3 F0 = vec3(0.04);
  F0 = mix(F0, albedo, metalness);

  // calculate per-light radiance
  vec3 V = vec3(0., 0., 1.); // We are always looking straight down
  vec3 H = normalize(V + lightDir);

  float NDF = D_BeckmannNormal(dot(normal, H), roughness);
  float G = GeometrySmith(normal, V, lightDir, roughness);
  vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

  vec3 kD = vec3(1.0) - F;
  kD *= 1.0 - metalness;

  float NdotL = max(dot(normal, lightDir), 0.0);
  vec3 specular = NDF * G * F / max(4.0 * NdotL, 0.001);
  vec3 Lo = (kD * albedo / PI + specular) * radiance * NdotL;

  vec3 ambient2 = albedo * ambient.rgb;
  vec3 color = ambient2 + Lo;

  color = color / (color + vec3(1.0));
  color = pow(color, vec3(1.0 / 2.2));

  // Debug
  // color = lightDir * vec3(0.5, 0.5, 0.5) + 0.5;
  // color = albedo * max(dot(normal, lightDir), 0.);

  return vec4(color, src.a);
}
`;
