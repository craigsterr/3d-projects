#version 300 es
precision highp float;
uniform vec4 color;

uniform vec3 lightdir;
uniform vec3 lightcolor;
uniform vec3 halfway;

uniform vec3 lightdir2;
uniform vec3 lightcolor2;
uniform vec3 halfway2;

out vec4 fragColor;
in vec3 vnormal;
in vec3 vcolor;

void main() {
    vec3 n = normalize(vnormal);
    float lambert = max(dot(n, lightdir), 0.0);
    float blinn = pow(max(dot(n, halfway), 0.0), 20.0);
    float lambert2 = max(dot(n, lightdir2), 0.0);
    float blinn2 = pow(max(dot(n, halfway2), 0.0), 20.0);
    fragColor = vec4(
        color.rgb * (lightcolor * lambert + lightcolor2 * lambert2)
        +
        (lightcolor * blinn +  lightcolor2 * blinn2) * 2.0
    , color.a) * vec4(vcolor, 1);
}