#version 300 es
precision highp float;

in vec2 vTexCoord;
in vec3 vnormal;

uniform sampler2D aTextureIPlanToUse;
uniform vec4 color;

out vec4 fragColor;

void main() {
    vec4 lookedUpRGBA = texture(aTextureIPlanToUse, vTexCoord);
    fragColor = lookedUpRGBA * color;
}