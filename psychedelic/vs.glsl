#version 300 es

out vec2 fragPosition;

// vertex positions
// (-1, -1), (1, -1), (-1, 1), (-1, 1), (1, -1), (1, 1)

void main() {
    vec2 vertex[6] = vec2[6](vec2(-1, -1),vec2(1, -1), vec2(-1, 1),
        vec2(-1, 1), vec2(1, -1), vec2(1, 1)
    );

    gl_Position = vec4(vertex[gl_VertexID], 0, 1);
    fragPosition = vertex[gl_VertexID];
}
