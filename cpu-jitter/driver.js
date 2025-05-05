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

let verticesGlobal;
let verticesBufferGlobal;

function setupGeomery(geom) {
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)

    for(let i = 0; i < geom.attributes.length; i+=1) {
        verticesBuffer = gl.createBuffer()
        if (i == 0) {
            verticesBufferGlobal = verticesBuffer
        }
        
        // console.log(vertices)
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer)
        
        

        let vertices = new Float32Array(geom.attributes[i].flat())
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW)
        
        if (i == 0) {
            verticesGlobal = vertices
        }

        gl.vertexAttribPointer(i, geom.attributes[i][0].length, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(i)
    }

    var indices = new Uint16Array(geom.triangles.flat())
    var indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW)

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

function jitterVertices() {
    for (let i = 0; i < verticesGlobal.length; i += 2) {
        let jitterX = (Math.random() - 0.5) * 0.25;
        let jitterY = (Math.random() - 0.5) * 0.1;
        
        verticesGlobal[i] += jitterX;
        verticesGlobal[i + 1] += jitterY;
    }
}

function draw(milliseconds) {
    gl.clear(gl.COLOR_BUFFER_BIT) 
    gl.useProgram(program)

    gl.uniform1f(program.uniforms.seconds, milliseconds/1000)
    

    gl.bindVertexArray(geom.vao)

    jitterVertices();

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBufferGlobal);
    gl.bufferData(gl.ARRAY_BUFFER, verticesGlobal, gl.DYNAMIC_DRAW);

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
    let data = await fetch('geometry.json').then(r=>r.json())
    window.geom = setupGeomery(data)
    requestAnimationFrame(tick) // asks browser to call tick before first frame
})

