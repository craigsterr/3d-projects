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
const IlliniOrange = new Float32Array([0.82, 0.71, 0.40, 1])
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

    let terrainScale = 3 / globalGridSize

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

    let gridsize = 50
    let faults = 50

    let grid = createSquareGrid(gridsize)
    createFaults(grid, faults, gridsize)
    createTerrain(grid)

    document.querySelector('#submit').addEventListener('click', event => {
        const gridsize = Number(document.querySelector('#gridsize').value) || 2
        const faults = Number(document.querySelector('#faults').value) || 0
    
        let grid = createSquareGrid(gridsize)
        createFaults(grid, faults, gridsize)
        createTerrain(grid)
    })

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

let globalGridSize = 50

function createSquareGrid(gridSize) {
    globalGridSize = gridSize
    let grid = [];
    for (let i = 0; i < gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gridSize; j++) {
            grid[i][j] = 0;
        }
    }
    return grid
}

function createFaults(grid, faults, size) {
    let max = Number.MIN_VALUE;
    let min = Number.MAX_VALUE;

    for (let i = 0; i < faults; i++) {
        let angle = Math.PI * 2 * Math.random();
        let dx = Math.cos(angle);
        let dy = Math.sin(angle);
        let x = Math.random() * size;
        let y = Math.random() * size;

        

        for (let j = 0; j < size; j++) {
            for (let k = 0; k < size; k++) {
                let dist = (k - x) * dy - (j - y) * dx;

                if (dist > 0) {
                    grid[j][k] += 1;
                } else {
                    grid[j][k] -= 1;
                }

                if (grid[j][k] > max) {
                    max = grid[j][k]
                } 

                if (grid[j][k] < min) {
                    min = grid[j][k]
                }
            }
        }
        
        
    }

    let c = 30

    for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
            grid[j][k] = c * ((grid[j][k] - (0.5 * (max + min))) / (max - min));
            console.log(grid[j][k])
        }
    }
}

function createTerrain(grid) {
    let vertices = [];
    let triangles = [];
    let size = grid.length;

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let x = i - size / 2;
            let y = grid[i][j];
            let z = j - size / 2;
            vertices.push([x, y, z]);
        }
    }

    for (let i = 0; i < size - 1; i++) {
        for (let j = 0; j < size - 1; j++) {
            let idx1 = i * size + j;
            let idx2 = (i + 1) * size + j;
            let idx3 = i * size + (j + 1);
            let idx4 = (i + 1) * size + (j + 1);

            triangles.push([idx1, idx2, idx3]);
            triangles.push([idx2, idx4, idx3]);
        }
    }

    let geometry = {
        attributes: [vertices],
        triangles: triangles
    };

    console.log(geometry)
    
    addNormals(geometry)
    window.geom = setupGeomery(geometry);
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
