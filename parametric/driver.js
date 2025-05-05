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

const IlliniBlue = new Float32Array([1, 1, 1, 1])
const IlliniOrange = new Float32Array([1.0, 0.35, 0.0, 1.0]);
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])

function draw(milliseconds) {
    seconds = milliseconds / 1000
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program)

    gl.bindVertexArray(geom.vao)

    gl.uniform4fv(program.uniforms.color, IlliniOrange)

    let ld = normalize([1.0,1.0,1.0])
    let h = normalize(add(ld, [0,0,1]))
    gl.uniform3fv(program.uniforms.lightdir, ld)
    gl.uniform3fv(program.uniforms.lightcolor, [1,1, 1])
    gl.uniform3fv(program.uniforms.halfway, h)

    let terrainScale = 1

    let m = m4mul(m4trans(0, 0, 0), m4rotZ(Math.PI / 1), m4rotY(Math.PI / 2), m4scale(terrainScale, terrainScale, terrainScale))
    let vStart = m4view([1, 2, 3], [0,0,0], [0,1,0])
    v = m4mul(vStart, m4rotY(seconds * Math.PI / 6))
    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(v,m))
    gl.uniformMatrix4fv(program.uniforms.p, false, p)
    
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
}

function tick(milliseconds) {
    draw(milliseconds)
    requestAnimationFrame(tick) // asks browser to call tick before next frame
}

window.addEventListener('load', async (event) => {
    window.gl = document.querySelector('canvas').getContext('webgl2')

    let vs = await fetch('vertex.glsl').then(res => res.text())
    let fs = await fetch('fragment.glsl').then(res => res.text())
    window.program = compileShader(vs,fs)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    let rings = 50
    let slices = 50

    generateTorus(rings, slices)

    document.querySelector('#submit').addEventListener('click', () => {
        const rings = Number(document.querySelector('#rings').value);
        const slices = Number(document.querySelector('#slices').value);
        const isTorus = document.querySelector('#torus').checked;
    
        let geom;
        if (isTorus) {
            geom = generateTorus(rings, slices);
        } else {
            geom = generateSphere(rings, slices);
        }
    });
    
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

        // n = n.map(component => -component); 

        geom.attributes[ni][geom.triangles[i][0]] = add(geom.attributes[ni][geom.triangles[i][0]], n)
        geom.attributes[ni][geom.triangles[i][1]] = add(geom.attributes[ni][geom.triangles[i][1]], n)
        geom.attributes[ni][geom.triangles[i][2]] = add(geom.attributes[ni][geom.triangles[i][2]], n)
    }
    for(let i = 0; i < geom.attributes[0].length; i+=1) {
        geom.attributes[ni][i] = normalize(geom.attributes[ni][i])
    }
}

function generateSphere(rings, slices, outerRadius = 1.0, innerRadius = 0.3) {
    const vertices = [];
    const triangles = [];

    n = slices;

    for (let ring = 0; ring <= rings; ring++) {
        const theta = Math.PI * ring / rings;
        for (let pt = 0; pt < n; pt++) {
            const phi = 2 * Math.PI * pt / n;

            const x = Math.sin(phi) * Math.sin(theta);
            const y = Math.cos(theta);
            const z = Math.cos(phi) * Math.sin(theta);

            vertices.push([x, y, z]);

            if (ring > 0) {
                const i = n * ring + pt;
                const i1 = n * ring + (pt + 1) % n;

                triangles.push([i, i - n, i1]);
                triangles.push([i1 - n, i - n, i1]);
            }
        }
    }

    let geometry = {
        attributes: [vertices],
        triangles: triangles
    };

    console.log(geometry);

    addNormals(geometry);
    window.geom = setupGeomery(geometry);
}

function generateTorus(rings, slices, outerRadius = 1.0, innerRadius = 0.3) {
    const vertices = [];
    const triangles = [];

    n = slices;

    for (let ring = 0; ring <= rings; ring++) {
        const theta = 2 * Math.PI * ring / rings;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        for (let pt = 0; pt < n; pt++) {
            const phi = 2 * Math.PI * pt / n;
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);

            const x = (outerRadius + innerRadius * sinTheta) * sinPhi;
            const y = innerRadius * cosTheta;
            const z = (outerRadius + innerRadius * sinTheta) * cosPhi;

            vertices.push([x, y, z]);

            if (ring > 0) {
                const i = n * ring + pt;
                const i1 = n * ring + (pt + 1) % n;

                triangles.push([i, i - n, i1]);
                triangles.push([i1 - n, i - n, i1]);
            }
        }
    }

    let geometry = {
        attributes: [vertices],
        triangles: triangles
    };

    console.log(geometry);

    addNormals(geometry);
    window.geom = setupGeomery(geometry);
}