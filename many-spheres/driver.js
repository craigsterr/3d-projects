class Sphere {
    constructor(x, y, z, vx, vy, vz, radius, color, mass) {
        this.position = [x, y, z];
        this.velocity = [vx, vy, vz];
        this.radius = radius;
        this.color = color;
        this.mass = mass;
    }
}

function compileShader(vs_source, fs_source) {
    const vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, vs_source)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs))
        throw Error("Vertex shader compilation failed")
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, fs_source)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs))
        throw Error("Fragment shader compilation failed")
    }

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }
    
    // loop through all uniforms in the shader source code
    // get their locations and store them in the GLSL program object for later use
    const uniforms = {}
    for(let i=0; i<gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i+=1) {
        let info = gl.getActiveUniform(program, i)
        uniforms[info.name] = gl.getUniformLocation(program, info.name)
    }
    program.uniforms = uniforms

    return program
}

function supplyDataBuffer(data, loc, mode) {
    if (mode === undefined) mode = gl.STATIC_DRAW
    
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    const f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, mode)
    
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
    
    return buf;
}

function setupGeomery(geom) {
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)

    for(let i=0; i<geom.attributes.length; i+=1) {
        let data = geom.attributes[i]
        supplyDataBuffer(data, i)
    }

    var indices = new Uint16Array(geom.triangles.flat())
    var indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: triangleArray
    }
}

function calculateScale(milliseconds) {
    const seconds = milliseconds / 1000;
    const scale = 0.5 * Math.cos(seconds * 3.00) + 1;
    return 0.15 * scale;
}

const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1])
const IlliniOrange = new Float32Array([0.82, 0.71, 0.40, 1])
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])

let lastResetTime = 0

function draw(milliseconds) {
    seconds = milliseconds / 1000

    if (seconds - lastResetTime >= 15) {
        lastResetTime = seconds;  
        spheres = generateRandomSpheres(50, 2)
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    // gl.clearColor(...IlliniBlue)
    gl.useProgram(program)

    

    gl.bindVertexArray(geom.vao)

    updateSpheres(spheres, seconds, 2)

    let ld = normalize([1.0,1.0,1.0])
    let h = normalize(add(ld, [0,0,1]))
    gl.uniform3fv(program.uniforms.lightdir, ld)
    gl.uniform3fv(program.uniforms.lightcolor, [1,1, 1])
    gl.uniform3fv(program.uniforms.halfway, h)
    
    for (let i = 0; i < spheres.length; i += 1) {
        gl.uniform4fv(program.uniforms.color, spheres[i].color)
        let m = m4mul(m4trans(spheres[i].position[0], spheres[i].position[1], spheres[i].position[2]), m4rotZ(Math.PI / 1), m4rotY(Math.PI / 2), m4scale(spheres[i].radius, spheres[i].radius, spheres[i].radius))
        let vStart = m4view([1, 2, 3], [0,0,0], [0,1,0])
        v = m4mul(vStart, m4rotY(Math.PI / 6))
        gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(v,m))
        gl.uniformMatrix4fv(program.uniforms.p, false, p)
        
        gl.drawElements(geom.mode, geom.count, geom.type, 0)
    }
}

function tick(milliseconds) {
    draw(milliseconds)
    requestAnimationFrame(tick) // asks browser to call tick before next frame
}

let spheres = [];

window.addEventListener('load', async (event) => {
    fpsDisplay = document.querySelector('#fps');
    const sphereInput = document.querySelector('#spheres');
    const submitButton = document.querySelector('#submit');
    
    window.gl = document.querySelector('canvas').getContext('webgl2')

    let vs = await fetch('vertex.glsl').then(res => res.text())
    let fs = await fetch('fragment.glsl').then(res => res.text())
    window.program = compileShader(vs,fs)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    let data = await fetch('sphere.json').then(r=>r.json())
    addNormals(data)
    window.geom = setupGeomery(data)

    submitButton.addEventListener('click', () => {
        sphereCount = parseInt(sphereInput.value);
        restartSimulation();
    });

    spheres = generateRandomSpheres(50, 2);
    // console.log(spheres)

    fillScreen()
    window.addEventListener('resize',fillScreen)
    
    requestAnimationFrame(tick) // asks browser to call tick before first frame
})

window.addEventListener('resize',fillScreen)

function fillScreen() {
    let canvas = document.querySelector('canvas')
    document.body.style.margin = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    canvas.style.width = ''
    canvas.style.height = ''
    gl.viewport(0,0, canvas.width, canvas.height)
    if (window.gl) {
        gl.viewport(0,0, canvas.width, canvas.height)
        window.p = m4perspNegZ(0.1, 10, 1, canvas.width, canvas.height)
    }
}

function addNormals(geom) {
    let ni = geom.attributes.length
    geom.attributes.push([])
    for(let i = 0; i < geom.attributes[0].length; i+=1) {
        geom.attributes[ni].push([0,0,0])
    }
    for(let i = 0; i < geom.triangles.length; i+=1) {
        let p0 = geom.attributes[0][geom.triangles[i][0]]
        let p1 = geom.attributes[0][geom.triangles[i][1]]
        let p2 = geom.attributes[0][geom.triangles[i][2]]
        let e1 = sub(p1,p0)
        let e2 = sub(p2,p0)
        let n = cross(e1,e2)
        geom.attributes[ni][geom.triangles[i][0]] = add(geom.attributes[ni][geom.triangles[i][0]], n)
        geom.attributes[ni][geom.triangles[i][1]] = add(geom.attributes[ni][geom.triangles[i][1]], n)
        geom.attributes[ni][geom.triangles[i][2]] = add(geom.attributes[ni][geom.triangles[i][2]], n)
    }
    for(let i = 0; i < geom.attributes[0].length; i+=1) {
        geom.attributes[ni][i] = normalize(geom.attributes[ni][i])
    }
}

function generateRandomSpheres(count, size) {
    const spheres = [];
    
    for (let i = 0; i < count; i++) {
        const radius = 0.15 * size;

        const x = Math.random() * (size - 2 * radius) - (size / 2 - radius);
        const y = Math.random() * (size - 2 * radius) - (size / 2 - radius);
        const z = Math.random() * (size - 2 * radius) - (size / 2 - radius);

        const vx = (Math.random() - 0.5) * 0.2;
        const vy = (Math.random() - 0.5) * 0.2;
        const vz = (Math.random() - 0.5) * 0.2;
        
        const color = new Float32Array([Math.random(), Math.random(), Math.random(), 1]);

        mass = 100.0
        
        spheres.push(new Sphere(x, y, z, vx, vy, vz, radius, color, mass));
    }
    
    return spheres;
}

const gravity = -0.002;
const elasticity = 0.9;

function updateSpheres(spheres, deltaTime, cubeSize) {
    for (let i = 0; i < spheres.length; i++) {
        let sphere = spheres[i];

        sphere.position[0] += sphere.velocity[0];
        sphere.position[1] += sphere.velocity[1];
        sphere.position[2] += sphere.velocity[2];

        sphere.velocity[1] += gravity;

        for (let j = i + 1; j < spheres.length; j++) {
            let other = spheres[j];

            if (i != j) {
                distance = Math.sqrt((Math.pow((sphere.position[0] - other.position[0]), 2) 
                + Math.pow((sphere.position[1] - other.position[1]), 2) 
                + Math.pow((sphere.position[2] - other.position[2]), 2)))

                minDist = sphere.radius + other.radius;

                if (distance < minDist) {
                    let delta = sub(sphere.position, other.position);
                    let n = mul(delta, 1 / distance);
                    let rel_vel = sub(sphere.velocity, other.velocity);
                    let n_speed = dot(rel_vel, n);

                    if (n_speed < 0) {
                        let impulse = (1 + elasticity) * n_speed / (1 / sphere.mass + 1 / other.mass);
                        let impulse1 = mul(n, impulse / sphere.mass);
                        let impulse2 = mul(n, -impulse / other.mass);

                        sphere.velocity = sub(sphere.velocity, impulse1);
                        other.velocity = sub(sphere.velocity, impulse2);

                        let overlap = sphere.radius + other.radius - distance;
                        let correction = mul(n, overlap / 2);

                        sphere.position = sub(sphere.position, correction);
                        other.position = sub(other.position, correction);
                    }
                }
            }
        }

        for (let k = 0; k < 3; k++) {
            if (sphere.position[k] + sphere.radius > cubeSize) {
                sphere.position[k] = cubeSize - sphere.radius;
                sphere.velocity[k] *= -elasticity;
            } else if (sphere.position[k] - sphere.radius < -cubeSize) {
                sphere.position[k] = -cubeSize + sphere.radius;
                sphere.velocity[k] *= -elasticity;
            }
        }
    }
}

function resetSpheres(size) {
    console.log("I'M IN!")
    for (let i = 0; i < spheres.length; i++) {
        spheres[i].position[0] = Math.random() * size - size / 2;
        spheres[i].position[1] = Math.random() * size - size / 2;
        spheres[i].position[2] = Math.random() * size - size / 2;
        
        spheres[i].velocity[0] = (Math.random() - 0.5) * 0.2;
        spheres[i].velocity[1] = (Math.random() - 0.5) * 0.2;
        spheres[i].velocity[2] = (Math.random() - 0.5) * 0.2;
    }
}