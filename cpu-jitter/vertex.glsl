#version 300 es

layout(location=0) in vec4 position;
layout(location=1) in vec4 color;

uniform float seconds;

out vec4 vColor;

void main() {
    vColor = color;
    
    vec4 jPosition = position;

    jPosition.xy *= 0.25;

    gl_Position = jPosition;
}
