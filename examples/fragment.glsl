#version 300 es
precision highp float;

in vec4 vColor;

uniform float seconds;

out vec4 fragColor;

void main() {
    gl_FragColor = vec4(0.6, 0.4, 0.1, 1.0);
}

