#version 300 es
precision highp float;

uniform float seconds;

in vec2 fragPosition;

out vec4 fragColor;

void main() {
    vec2 uv = fragPosition;

    float r = sin(3.0 * uv.x * uv.y + seconds);
    float g = cos(6.0 * uv.y * uv.y + seconds);
    float b = cos(12.0 * sin(uv.x * uv.y) + seconds);

    fragColor = 2.0 * vec4(r, g, b, 1) * vec4(r, g, b, 1) - 0.5 * cos(seconds);
}
