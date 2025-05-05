#version 300 es

layout(location=0) in vec4 position;
layout(location=1) in vec4 color;

uniform float seconds;

out vec4 vColor;

void main() {
    vColor = color;

    float XShake = cos(float(gl_VertexID) * 10.0 + seconds * 15.0) * 0.2 - 1.0;
    float YShake = sin(float(gl_VertexID) + seconds * 25.0) * 0.1 - 1.0;

    vec4 jPosition = position;

    jPosition.x += XShake;
    jPosition.y += YShake;

    // scaling
    jPosition.xy *= 0.25;

    gl_Position = jPosition;
}
