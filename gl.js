import buildingShaderSrc from './building.vert.js';
import flatShaderSrc from './flat.vert.js';
import fragmentShaderSrc from './fragment.glsl.js';

var gl;

var layers = null

var modelMatrix;
var projectionMatrix;
var viewMatrix;

var currRotate = 0;
var currZoom = 0;
var currProj = 'perspective';

/*
    Vertex shader with normals
*/
class BuildingProgram {
    constructor() {
        this.vertexShader = createShader(gl, gl.VERTEX_SHADER, buildingShaderSrc);
        this.fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);

        this.coordsId = gl.getAttribLocation(this.program, 'position');
        this.normalId = gl.getAttribLocation(this.program, 'normal');

        this.uModel = gl.getUniformLocation(this.program, 'uModel');
        this.uProjection = gl.getUniformLocation(this.program, 'uProjection');
        this.uView = gl.getUniformLocation(this.program, 'uView');
        this.uColor = gl.getUniformLocation(this.program, 'uColor');    }

    use() {
        gl.useProgram(this.program);
    }
}

/*
    Vertex shader with uniform colors
*/
class FlatProgram {
    constructor() {
        this.vertexShader = createShader(gl, gl.VERTEX_SHADER, flatShaderSrc);
        this.fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);

        this.coordsId = gl.getAttribLocation(this.program, 'position');

        this.uModel = gl.getUniformLocation(this.program, 'uModel');
        this.uProjection = gl.getUniformLocation(this.program, 'uProjection');
        this.uView = gl.getUniformLocation(this.program, 'uView');
        this.uColor = gl.getUniformLocation(this.program, 'uColor');    }

    use() {
        gl.useProgram(this.program);
    }
}


/*
    Collection of layers
*/
class Layers {
    constructor() {
        this.layers = {};
        this.centroid = [0,0,0];
    }

    addBuildingLayer(name, vertices, indices, normals, color){
        var layer = new BuildingLayer(vertices, indices, normals, color);
        layer.init();
        this.layers[name] = layer;
        this.centroid = this.getCentroid();
    }

    addLayer(name, vertices, indices, color) {
        var layer = new Layer(vertices, indices, color);
        layer.init();
        this.layers[name] = layer;
        this.centroid = this.getCentroid();
    }

    removeLayer(name) {
        delete this.layers[name];
    }

    draw() {
        for(var layer in this.layers) {
            this.layers[layer].draw(this.centroid);
        }
    }

    
    getCentroid() {
        var sum = [0,0,0];
        var numpts = 0;
        for(var layer in this.layers) {
            numpts += this.layers[layer].vertices.length/3;
            for(var i=0; i<this.layers[layer].vertices.length; i+=3) {
                var x = this.layers[layer].vertices[i];
                var y = this.layers[layer].vertices[i+1];
                var z = this.layers[layer].vertices[i+2];
    
                sum[0]+=x;
                sum[1]+=y;
                sum[2]+=z;
            }
        }
        return [sum[0]/numpts,sum[1]/numpts,sum[2]/numpts];
    }
}

/*
    Layers without normals (water, parks, surface)
*/
class Layer {
    constructor(vertices, indices, color) {
        this.vertices = vertices;
        this.indices = indices;
        this.color = color;
    }

    init() {
        // TODO: create program, set vertex and index buffers, vao
        this.program = new FlatProgram();

        this.vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.vertices));
        this.indexBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices));
        this.vao = createVAO(gl, this.program.coordsId, this.vertexBuffer);
    }

    draw(centroid) {
        // TODO: use program, update model matrix, view matrix, projection matrix
        // TODO: set uniforms
        // TODO: bind vao, bind index buffer, draw elements
        this.program.use();

        updateModelMatrix(centroid);
        updateProjectionMatrix();
        updateViewMatrix(centroid);

        gl.uniformMatrix4fv(this.program.uModel, false, new Float32Array(modelMatrix));
        gl.uniformMatrix4fv(this.program.uProjection, false, new Float32Array(projectionMatrix));
        gl.uniformMatrix4fv(this.program.uView, false, new Float32Array(viewMatrix));
        gl.uniform4fv(this.program.uColor, this.color);

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
    }
}

/*
    Layer with normals (building)
*/
class BuildingLayer extends Layer {
    constructor(vertices, indices, normals, color) {
        super(vertices, indices, color);
        this.normals = normals;
    }

    init() {
        // TODO: create program, set vertex, normal and index buffers, vao
        this.program = new BuildingProgram();

        this.vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.vertices));
        this.normalBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.normals));
        this.indexBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices));

        this.vao = createVAO(gl, this.program.coordsId, this.vertexBuffer, this.program.normalId, this.normalBuffer);
    }

    draw(centroid) {
        // TODO: use program, update model matrix, view matrix, projection matrix
        // TODO: set uniforms
        // TODO: bind vao, bind index buffer, draw elements
        this.program.use();

        updateModelMatrix(centroid);
        updateProjectionMatrix();
        updateViewMatrix(centroid);

        gl.uniform4fv(this.program.uColor, this.color);
        gl.uniformMatrix4fv(this.program.uModel, false, new Float32Array(modelMatrix));
        gl.uniformMatrix4fv(this.program.uProjection, false, new Float32Array(projectionMatrix));
        gl.uniformMatrix4fv(this.program.uView, false, new Float32Array(viewMatrix));

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);

    }
}

/*
    Event handlers
*/
window.updateRotate = function() {
    currRotate = parseInt(document.querySelector("#rotate").value);
}

window.updateZoom = function() {
    currZoom = parseFloat(document.querySelector("#zoom").value);
}

window.updateProjection = function() {
    currProj = document.querySelector("#projection").value;
}

function setMouseEvents(canvas){

    var status = "IDLE"

    function mouseDown(event) {
        // captures the event.
        event.preventDefault();
        event.stopPropagation();

        if(event.button == 0 || event.button == 1){ // left click
            status = "DRAG";
        }
    }

    function mouseUp(event) {
        // captures the event.
        event.preventDefault();
        event.stopPropagation();

        status = "IDLE";
    }

    // Constrain function
    function constrain(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Function to handle mouse movement
    function handleMouseMove(event) {

        if(status == "DRAG"){
            const rect = canvas.getBoundingClientRect();
            let mouseX = event.clientX - rect.left;
            let mouseY = event.clientY - rect.top;

            // Constrain mouseX and mouseY to the desired ranges
            mouseX = constrain(mouseX, 0, canvas.width);
            mouseY = constrain(mouseY, 0, canvas.height);

            // Normalize mouseX and mouseY to ranges 0-360 and 1-100 respectively
            currRotate = (mouseX / canvas.width) * 360;
            currZoom = (mouseY / canvas.height) * 99 + 1; // Adding 1 to ensure the range starts from 1
        }   

    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', mouseUp);
    canvas.addEventListener('mousedown', mouseDown);
}



/*
    File handler
*/
window.handleFile = function(e) {
    var reader = new FileReader();
    reader.onload = function(evt) {
        // TODO: parse JSON
        let parsed = JSON.parse(evt.target.result);
        for(var layer in parsed){
            switch (layer) {
                // TODO: add to layers
                case 'buildings':
                    // TODO
                    layers.addBuildingLayer(layer, parsed[layer].coordinates, parsed[layer].indices, parsed[layer].normals, parsed[layer].color);
                    break;
                case 'water':
                    // TODO
                    layers.addLayer(layer, parsed[layer].coordinates, parsed[layer].indices, parsed[layer].color);
                    break;
                case 'parks':
                    // TODO
                    layers.addLayer(layer, parsed[layer].coordinates, parsed[layer].indices, parsed[layer].color);
                    break;
                case 'surface':
                    // TODO
                    layers.addLayer(layer, parsed[layer].coordinates, parsed[layer].indices, parsed[layer].color);
                    break;
                default:
                    break;
            }
        }
    }
    reader.readAsText(e.files[0]);
}

function setFileEvents(){
    document.getElementById('layer').addEventListener('change', function(e) {
        handleFile(e.target);
    });
}

function setSelectEvents(){
    document.getElementById('projection').addEventListener('change', function(e) {
        currProj = e.target.value;
    });  
}


/*
    Update transformation matrices
*/
function updateModelMatrix(centroid) {
    // TODO: update model matrix
    var translation1 = translateMatrix(-centroid[0], -centroid[1], -centroid[2]);
    var translation2 = translateMatrix(centroid[0], centroid[1], centroid[2]);

    var rotate = rotateZMatrix(currRotate * Math.PI / 180.0);

    modelMatrix = multiplyArrayOfMatrices([
        translation2,
        rotate, 
        translation1
    ]);
}

function updateProjectionMatrix() {
    // TODO: update projection matrix
    var aspect = window.innerWidth / window.innerHeight;
    if(currProj == 'perspective'){
        projectionMatrix = perspectiveMatrix(45 * Math.PI / 180.0, aspect, 1, 50000);
    }else{
        var maxzoom = 5000;
        var size = maxzoom-(currZoom/100.0)*maxzoom*0.99;
        projectionMatrix = orthographicMatrix(-aspect*size, aspect*size, -1*size, 1*size, -1, 50000);
    }
}

function updateViewMatrix(centroid){
    // TODO: update view matrix
    // TIP: use lookat function
    var maxzoom = 5000;
    var zoom = maxzoom - (currZoom/100.0)*maxzoom*0.99;

    var lookat = lookAt(add(centroid, [zoom,zoom,zoom]), centroid, [0,0,1]);
    viewMatrix = lookat;
}

/*
    Main draw function (should call layers.draw)
*/
function draw() {

    gl.clearColor(190/255, 210/255, 215/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    layers.draw();

    requestAnimationFrame(draw);

}

/*
    Initialize everything
*/
function initialize() {

    var canvas = document.querySelector("#glcanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl = canvas.getContext("webgl2");

    setMouseEvents(canvas);
    setFileEvents();
    setSelectEvents();


    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    layers = new Layers();

    window.requestAnimationFrame(draw);

}


window.onload = initialize;