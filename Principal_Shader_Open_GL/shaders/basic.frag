#version 330 core
out vec4 FragColor;
  
in vec2 texCoord;
in vec3 worldPos;
in vec3 fragTangent; 
in vec3 fragNormal;

// -- Lighting Uniforms --
uniform vec3 uLight_Position;
uniform vec3 uLight_Color;
uniform vec3 uAmbient;
uniform vec3 uCamera_Position;
uniform int uLightType;
uniform vec3 uDir_Direction;
uniform float uSpotCosInner;
uniform float uSpotCosOuter;

// -- Material controls --
uniform float uRoughness;
uniform float uMetallic;
uniform vec3 uDielectricF0;

// -- Textures --
uniform sampler2D baseColorTex;
uniform bool useBaseColorTex;
uniform vec3 baseColorTint;
uniform sampler2D uNormalTex;
uniform bool uUseNormalTex;
uniform sampler2D roughnessMap;
uniform bool useRoughnessMap;
uniform sampler2D metallicMap;
uniform bool useMetallicMap;
uniform sampler2D aoMap; 
uniform bool useAOMap;

// IBL - IMPORTANT: Need both maps!
uniform samplerCube irradianceMap;  // For diffuse (blurry)
uniform samplerCube environmentMap; // For specular (sharp)
uniform bool useIBL;

// Optional: Add these for more control
uniform float uRoughnessScale;  // Default 1.0 in your app
uniform float uRoughnessOffset; // Default 0.0 in your app

float D_GGX(float NdotH, float roughness) {
    float alpha = roughness * roughness;
    float alpha2 = alpha * alpha;
    float NdotH2 = NdotH * NdotH;
    float denom = NdotH2 * (alpha2 - 1.0) + 1.0;
    denom = 3.14159265 * denom * denom;
    return alpha2 / max(denom, 0.001);
}

float G_SchlickGGX(float NdotV, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;
    float G1 = NdotV / max((NdotV * (1.0 - k) + k), 0.001);
    return G1;
}

float G_Smith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float G1_L = G_SchlickGGX(NdotL, roughness);
    float G1_V = G_SchlickGGX(NdotV, roughness);
    return G1_L * G1_V;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(max(1.0 - cosTheta, 0.0), 5.0);
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(max(1.0 - cosTheta, 0.0), 5.0);
}

void main()
{
    // ========== SURFACE PROPERTIES ==========
    vec3 texColor = useBaseColorTex ? texture(baseColorTex, texCoord).rgb : vec3(1.0);
    vec3 baseColor = texColor * baseColorTint;
    
    // Sample material properties with multiple control options
    float roughness = uRoughness;
    if (useRoughnessMap) {
        // Sample the texture
        float textureRoughness = texture(roughnessMap, texCoord).r;
        roughness = textureRoughness * uRoughness;
    }
    // Allow full range but ensure numerical stability
    roughness = clamp(roughness, 0.01, 1.0);
    
    float metallic = uMetallic;
    if (useMetallicMap) {
        float textureMetallic = texture(metallicMap, texCoord).r;
        metallic = textureMetallic * uMetallic;
    }
    metallic = clamp(metallic, 0.0, 1.0);
    
    float ao = useAOMap ? texture(aoMap, texCoord).r : 1.0;
    
    // ========== NORMAL ==========
    vec3 N = normalize(fragNormal);
    if (uUseNormalTex) {
        vec3 normalSample = texture(uNormalTex, texCoord).rgb * 2.0 - 1.0;
        normalSample = normalize(normalSample);
        vec3 T = normalize(fragTangent);
        vec3 B = normalize(cross(N, T));
        mat3 TBN = mat3(T, B, N);
        N = normalize(TBN * normalSample);
    }
    
    // ========== LIGHTING VECTORS ==========
    vec3 L;
    float attenuation = 1.0;
    
    if (uLightType == 0) {
        L = normalize(-uDir_Direction);
    } else {
        vec3 lightVec = uLight_Position - worldPos;
        L = normalize(lightVec);
        float distance = length(lightVec);
        attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
    }
    
    vec3 V = normalize(uCamera_Position - worldPos);
    vec3 H = normalize(L + V);
    vec3 R = reflect(-V, N);
    
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    float VdotH = max(dot(V, H), 0.0);
    
    // ========== PBR MATERIAL ==========
    // F0: metals use base color, dielectrics use 0.04
    vec3 F0 = mix(vec3(0.04), baseColor, metallic);
    
    // ========== DIRECT LIGHTING ==========
    vec3 F = fresnelSchlick(VdotH, F0);
    float D = D_GGX(NdotH, roughness);
    float G = G_Smith(N, V, L, roughness);
    
    vec3 numerator = D * G * F;
    float denominator = 4.0 * max(NdotV * NdotL, 0.001);
    vec3 specular = numerator / denominator;
    
    // At roughness = 1.0, specular should be nearly invisible
    float specularAttenuation = pow(1.0 - roughness, 2.5);
    specular *= specularAttenuation;
    
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metallic;
    
    vec3 radiance = uLight_Color * attenuation;
    vec3 Lo = (kD * baseColor / 3.14159265 + specular) * radiance * NdotL;
    
    // ========== AMBIENT/IBL ==========
    vec3 ambient = vec3(0.0);
    
    if (useIBL) {
        // Ambient fresnel with roughness
        vec3 F_ambient = fresnelSchlickRoughness(NdotV, F0, roughness);
        vec3 kS_ambient = F_ambient;
        vec3 kD_ambient = vec3(1.0) - kS_ambient;
        kD_ambient *= 1.0 - metallic;
        
        // DIFFUSE IBL: Use irradiance map (blurry)
        vec3 irradiance = texture(irradianceMap, N).rgb;
        vec3 diffuse_ibl = irradiance * baseColor * kD_ambient;
        
        // SPECULAR IBL: Sample environment map with LOD based on roughness
        vec3 R = reflect(-V, N);
        
        // Properly scale LOD based on your cubemap mip levels
        float MAX_REFLECTION_LOD = 4.0; // Adjust based on your cubemap mip levels
        float lod = roughness * MAX_REFLECTION_LOD;
        vec3 prefilteredColor = textureLod(environmentMap, R, lod).rgb;
        // Apply BRDF approximation for IBL
        vec3 specular_ibl = prefilteredColor * F_ambient;
        float iblSpecularAttenuation = pow(1.0 - roughness, 2.0);
        specular_ibl *= iblSpecularAttenuation;
        ambient = (diffuse_ibl + specular_ibl) * ao;
    } else {
        // No IBL fallback
        if (metallic > 0.5) {
            // Fake some environment for metals
            float fresnel = pow(1.0 - NdotV, 2.0);
            vec3 fakeEnv = mix(vec3(0.05), vec3(0.15), fresnel) * baseColor;
            // Attenuate based on roughness - more aggressive
            fakeEnv *= pow(1.0 - roughness, 2.0);
            ambient = fakeEnv * ao;
        } else {
            ambient = baseColor * uAmbient * ao;
        }
    }
    
    // ========== FINAL COLOR ==========
    vec3 color = ambient + Lo;
    
    // Prevent pure black
    color = max(color, baseColor * 0.01);
    
    // Tone mapping (moderate exposure)
    color = color * 1.0;
    color = color / (color + vec3(1.0));
    
    // Gamma correction
    color = pow(color, vec3(1.0/2.2));
    
    FragColor = vec4(color, 1.0);
}
