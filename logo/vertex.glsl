#version 300 es

layout(location=0) in vec4 position;
layout(location=1) in vec4 color;

uniform float seconds;

out vec4 vColor;
uniform vec2 uScale;

void main() {
    vColor = color;
    gl_Position = vec4(uScale);
}