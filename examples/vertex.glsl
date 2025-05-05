#version 300 es

layout(location=0) in vec4 position;
layout(location=1) in vec4 color;

uniform float seconds;

out vec4 vColor;
uniform float uScale;
uniform float uRotation;  // Rotation angle in radians

void main() {
    vColor = color;
    vec4 offsetPosition = position;

    offsetPosition.x = (offsetPosition.x - 0.99 - (cos(seconds * 3.00)));
    offsetPosition.y = offsetPosition.y - 0.75 - (cos(seconds * 2.00));

    mat2 rotationMatrix = mat2(
        cos(uRotation), -sin(uRotation),
        sin(uRotation), cos(uRotation)
    );

    vec2 rotatedPosition = rotationMatrix * offsetPosition.xy;
    vec4 scaledPosition = vec4(uScale * rotatedPosition, offsetPosition.zw);

    gl_Position = vec4(scaledPosition.xy, offsetPosition.zw);
}
