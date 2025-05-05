#version 300 es
layout(location=0) in vec4 position;
layout(location=1) in vec3 normal;
layout(location=2) in vec3 color;
layout(location=3) in vec2 texCoord;

uniform mat4 mv;
uniform mat4 p;

out vec2 vTexCoord;
out vec3 vnormal;

void main() {
    gl_Position = p * mv * position;
    vnormal = mat3(mv) * normal;
    vTexCoord = texCoord;
}