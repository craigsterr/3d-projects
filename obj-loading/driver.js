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
let IlliniOrange = new Float32Array([0.7, 0.7, 0.7, 1])
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

    let m = m4mul(m4trans(0, 0, 0), m4rotZ(Math.PI / 2), m4rotY(Math.PI / 2), m4scale(3, 3, 3))
    let vStart = m4view([1, 2, 3], [0,0,0], [0,1,0])
    v = m4mul(vStart, m4rotY(seconds * Math.PI / 6))
    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(v,m))
    gl.uniformMatrix4fv(program.uniforms.p, false, p)

    gl.uniform1i(program.uniforms.aTextureIPlanToUse, 0) // where `slot` is same it was in step 2 above
    
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
}

function tick(milliseconds) {
    draw(milliseconds)
    requestAnimationFrame(tick) // asks browser to call tick before next frame
}

window.addEventListener('load', async (event) => {
    window.gl = document.querySelector('canvas').getContext('webgl2')

    let vs = await fetch('vertexDefault.glsl').then(res => res.text())
    let fs = await fetch('fragmentDefault.glsl').then(res => res.text())

    window.program = compileShader(vs,fs)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    createFallbackGeometry()

    // loadOBJ("triangle.obj")

    document.getElementById("material").addEventListener("input", handleMaterialInput);
    document.getElementById("object").addEventListener("input", handleOBJInput);

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
    let ni = geom.attributes.length;
    geom.attributes.push([]);
    
    for (let i = 0; i < geom.attributes[0].length; i++) {
        geom.attributes[ni].push([0, 0, 0]);
    }
    
    for (let i = 0; i < geom.triangles.length; i++) {
        let p0 = geom.attributes[0][geom.triangles[i][0]];
        let p1 = geom.attributes[0][geom.triangles[i][1]];
        let p2 = geom.attributes[0][geom.triangles[i][2]];
        
        let e1 = sub(p1, p0);
        let e2 = sub(p2, p0);
        
        let n = cross(e1, e2);
        
        geom.attributes[ni][geom.triangles[i][0]] = add(geom.attributes[ni][geom.triangles[i][0]], n);
        geom.attributes[ni][geom.triangles[i][1]] = add(geom.attributes[ni][geom.triangles[i][1]], n);
        geom.attributes[ni][geom.triangles[i][2]] = add(geom.attributes[ni][geom.triangles[i][2]], n);
    }
}

function handleMaterialInput(event) {
    const value = event.target.value;
    console.log("Material input changed to:", value); // Log the material input value

    if (value === "") {
        color = [0.7, 0.7, 0.7, 1];
        IlliniOrange = color
        useTextureShader = false;
        console.log("NONE");
        reloadShaders("vertexDefault.glsl", "fragmentDefault.glsl")
    } else if (/^#[0-9a-fA-F]{8}$/.test(value)) {
        let alpha = 1 - parseInt(value.substr(7, 2), 16) / 255
        color = [
            alpha * parseInt(value.substr(1, 2), 16) / 255,
            alpha * parseInt(value.substr(3, 2), 16) / 255,
            alpha * parseInt(value.substr(5, 2), 16) / 255,
            1
        ];
        console.log(color)
        IlliniOrange = color
        useTextureShader = false;
        reloadShaders("vertexDefault.glsl", "fragmentDefault.glsl")
        console.log("HEX");
    } else if (/\.(jpg|png)$/.test(value)) {
        useTextureShader = true;
        console.log("TEX");

        color = [0.7, 0.7, 0.7, 1];
        IlliniOrange = color
        
        let img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = value;

        img.addEventListener('error', (callback) => {
            color = [0, 0, 0, 1];
            IlliniOrange = color
            useTextureShader = false;
            console.log("NONE");
            reloadShaders("vertexDefault.glsl", "fragmentDefault.glsl")
        });

        
        img.addEventListener('load', (event) => {
            let slot = 0; // or a larger integer if this isn't the only texture
            let texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + slot);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(
                gl.TEXTURE_2D, // destination slot
                0, // the mipmap level this data provides; almost always 0
                gl.RGBA, // how to store it in graphics memory
                gl.RGBA, // how it is stored in the image object
                gl.UNSIGNED_BYTE, // size of a single pixel-color in HTML
                img, // source data
            );
            gl.generateMipmap(gl.TEXTURE_2D) // lets you use a mipmapping min filter
            reloadShaders("vertex.glsl", "fragment.glsl")
        })
    } else {
        color = [1, 0, 1, 0];
        useTextureShader = false;
        console.log("ELSE");
    }
}

async function reloadShaders(vertexSource, fragmentSource) {
    try {
        let vs = await fetch(vertexSource).then(res => res.text())
        let fs = await fetch(fragmentSource).then(res => res.text())

        window.program = compileShader(vs, fs);
        gl.useProgram(window.program);

        geom.vao && gl.bindVertexArray(geom.vao);

        console.log("Shaders reloaded successfully.");
    } catch (err) {
        console.error("Error reloading shaders:", err);
    }
}

async function loadOBJ(url) {
    const response = await fetch(url);
    const objText = await response.text();

    vertices = [];
    normals = [];
    textureCoords = [];

    tempVertices = []
    tempNormals = []
    tempTextureCoords = []
    tempTriangles = []

    triangles = []
    colors = []
    newIndex = 0;
    indexMapping = {};

    objText.split('\n').forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts[0] == 'v') {
            vertices.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
            if (parts[4]) { // Check for color
                colors.push([parseFloat(parts[4]), parseFloat(parts[5]), parseFloat(parts[6])])
            } else {
                colors.push([0.8, 0.8, 0.8])
            }
        } else if (parts[0] == 'vt') {
            textureCoords.push(parts.slice(1).map(Number));
        } else if (parts[0] == 'vn') {
            normals.push(parts.slice(1).map(Number));
        } else if (parts[0] == 'f') {
            for (let i = 1; i < parts.length; i += 1) {
                let indices = [];
                key = parts[i];
                if (!(key in indexMapping)) {
                    indexMapping[key] = newIndex;
                    newIndex += 1;

                    indices = parts[i].split('/');

                    if (indices[0]) {
                        let positionIdx = parseInt(indices[0]) - 1;
                        tempVertices.push(vertices[positionIdx]);
                    }

                    if (indices[1]) {
                        let textureIdx = parseInt(indices[1]) - 1;
                        tempTextureCoords.push(textureCoords[textureIdx]);
                    }

                    if (indices[2]) {
                        let normalIdx = parseInt(indices[2]) - 1;
                        tempNormals.push(normals[normalIdx]);
                    }
                }
            }

            for (let i = 2; i < parts.length - 1; i++) {
                let indexValue0 = indexMapping[parts[1]]
                let indexValue1 = indexMapping[parts[i]]
                let indexValue2 = indexMapping[parts[i + 1]]
                tempTriangles.push([indexValue0, indexValue1, indexValue2]);
            }
        }
    });

    if (tempVertices) vertices = tempVertices;
    if (tempNormals) normals = tempNormals;
    if (tempNormals) textureCoords = tempTextureCoords;
    if (tempNormals) triangles = tempTriangles;

    console.log(url)
    console.log("vertices: ", vertices);
    console.log("triangles: ", triangles);
    console.log("colors: ", colors);
    console.log("textureCoords: ", textureCoords);
    console.log("normals: ", normals);

    let maxDistance = 0;
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            let v1 = vertices[i];
            let v2 = vertices[j];
            let dist = Math.sqrt(Math.pow(v2[0] - v1[0], 2) + Math.pow(v2[1] - v1[1], 2) + Math.pow(v2[2] - v1[2], 2));
            if (dist > maxDistance) {
                maxDistance = dist;
            }
        }
    }

    const scaleFactor = 1 / maxDistance;

    for (let i = 0; i < vertices.length; i++) {
        vertices[i] = vertices[i].map(coord => coord * scaleFactor);
    }

    let geometry = {
        attributes: [vertices],
        triangles: triangles
    };

    if (normals.length != 0) {
        geometry.attributes.push(normals)
    } else {
        addNormals(geometry);
    }

    geometry.attributes.push(colors)
    

    if (textureCoords.length != 0) {
        geometry.attributes.push(textureCoords)
    }

    console.log(geometry.attributes)

    

    window.geom = setupGeomery(geometry);
}

async function handleOBJInput(event) {
    const objUrl = event.target.value;
    await loadOBJ(objUrl);
}

function createFallbackGeometry() {
    let vertices = [
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
    ];

    let triangles = [[0, 1, 2]];

    let geometry = {
        attributes: [vertices],
        triangles: triangles
    };

    console.log(geometry)

    addNormals(geometry);
    window.geom = setupGeomery(geometry);
}