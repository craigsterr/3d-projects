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


vec3 lerp(vec3 x, vec3 y, float t) {
    return (1.0 - t) * x + (t) * y;
}

vec3 heightToRainbow(float height) {
    vec3 r = vec3(1.0, 0.0, 0.0);
    vec3 o = vec3(1.0, 0.65, 0.0);
    vec3 g = vec3(0.0, 1.0, 0.0);
    vec3 b = vec3(0.0, 0.0, 1.0);
    vec3 p = vec3(0.5, 0.0, 0.5);

return (height < 0.0) ? r :
       (height < 0.1) ? lerp(r, o, height) :
       (height < 0.25) ? lerp(o, g, height) :
       (height < 0.5) ? lerp(g, b, height) :
       lerp(b, p, height);
}

void main() {
    vec3 n = normalize(vnormal);
    float lambert = max(dot(n, lightdir), 0.0);
    float blinn = pow(max(dot(n, halfway), 0.0), 20.0);
    float lambert2 = max(dot(n, lightdir2), 0.0);
    float blinn2 = pow(max(dot(n, halfway2), 0.0), 20.0);
    float height = n.y; 

    vec3 rainbowColor = heightToRainbow(height);

    fragColor = vec4(
        rainbowColor * (lightcolor * lambert + lightcolor2 * lambert2)
        +
        (lightcolor * blinn +  lightcolor2 * blinn2) * 2.0
    , color.a);

    vec3 shallowMaterialColor = vec3(0.2, 0.6, 0.1);
    vec3 steepMaterialColor = vec3(0.6, 0.3, 0.3);

    float steepness = n.y;
    float steep = step(0.5, steepness);

    vec3 colorShallow = shallowMaterialColor * (lightcolor * lambert + lightcolor2 * lambert2) + (lightcolor * blinn + lightcolor2 * blinn2) * 0.5;
    vec3 colorSteep = steepMaterialColor * (lightcolor * lambert + lightcolor2 * lambert2) + (lightcolor * blinn + lightcolor2 * blinn2) * 1.0;

    

    // fragColor = vec4(rainbowColor, color.a);
}
