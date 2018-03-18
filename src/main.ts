import {vec3, vec2} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import Particle from './Particle';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

var OBJ = require('webgl-obj-loader');
let apple: object;
window.onload = function() {
  OBJ.downloadMeshes({
    'apple': './src/objs/apple.obj',
  }, function(meshes: any) {
    apple = meshes.apple;
    main2();
  });
}
// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  Meshes: 0.0,
};

let square: Square;
let particles: Particle;
let time: number = 0.0;
let canvas : HTMLCanvasElement;
let attract: boolean = false;
let repel: boolean = false;
let target: vec3 = vec3.create();
let camera: Camera;

function loadScene() {

  square = new Square();
  particles = new Particle();
  particles.setData(vec3.create(), false, false);
  square.create();

  let offsets: Float32Array = new Float32Array(particles.getOffsets());
  let colors: Float32Array = new Float32Array(particles.getColors());
  square.setInstanceVBOs(offsets, colors);
  let n = particles.getNumParticles();
  square.setNumInstances(n * n);
}
// return point at z = 0 from the casted ray direction
function rayCast(pixel: vec2, origin: vec3): vec3 {
  // convert to ndc 
    vec2.scale(pixel, pixel, 2.0);
    vec2.subtract(pixel, pixel, vec2.fromValues(window.innerWidth, window.innerHeight));
    vec2.scale(pixel, pixel, 1 / window.innerHeight);

    let ref = vec3.create();
    let camLook = vec3.create();
    vec3.subtract(camLook, ref, origin);
    vec3.normalize(camLook, camLook);

    let camRight = vec3.create();
    vec3.cross(camRight, camLook, vec3.fromValues(0.0, 1.0, 0.0))
    vec3.normalize(camRight, camRight);

    let camUp = vec3.create();
    vec3.cross(camUp, camRight, camLook);
    vec3.normalize(camUp, camUp);

    let rayPoint = vec3.create();
    vec3.scale(camRight, camRight, pixel[0]);
    vec3.scale(camUp, camUp, pixel[1]);
    vec3.add(rayPoint, camRight, camUp);
    vec3.add(rayPoint, ref, rayPoint);

    let rayDir = vec3.create();
    vec3.subtract(rayDir, rayPoint, origin);
    vec3.normalize(rayDir, rayDir);

    let point = vec3.create();
    let t = -origin[2] / rayDir [2];
    let x = origin[0] + t * rayDir[0];
    let y = origin[1] + t * rayDir[1];

    return vec3.fromValues(x, y, 0);
}

function mouseDrag(event: MouseEvent): void {
  var x: number = event.screenX;
  var y: number = event.screenY;

  x -= canvas.offsetLeft;
  y -= canvas.offsetTop;

  // tell particles to repel or attract based on mouse button clicked
  if(event.button == 0) {
    target = rayCast(vec2.fromValues(x, y), camera.position);
    attract = true;
    repel = false;
  } else if (event.button == 2) {
    target = rayCast(vec2.fromValues(x, y), camera.position);
    repel = true;
    attract = false;
  }
  console.log("drag");
}

function mouseDown(event: MouseEvent): void {
  var x: number = event.screenX;
  var y: number = event.screenY;

  x -= canvas.offsetLeft;
  y -= canvas.offsetTop;

  // tell particles to repel or attract based on mouse button clicked
  if(event.button == 0) {
    target = rayCast(vec2.fromValues(x, y), camera.position);
    attract = true;
    repel = false;
  } else if (event.button == 2) {
    target = rayCast(vec2.fromValues(x, y), camera.position);
    repel = true;
    attract = false;
  }

  //alert('x=' + x + ' y=' + y);
}

function mouseUp(event: MouseEvent): void {
  attract = false;
  repel = false;
  target = vec3.create();
}

function main(){}

function main2() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'Meshes', { 'None': 0.0, 'Apple': 1.0} );

  // get canvas and webgl context
  canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  canvas.addEventListener("dragstart", mouseDrag, false);
  canvas.addEventListener("mousedown", mouseDown, false);
  canvas.addEventListener("mouseup", mouseUp, false);
  canvas.addEventListener("dragend", mouseUp, false);


  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  camera = new Camera(vec3.fromValues(0, 0, 80), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/particle-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    lambert.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    if(controls.Meshes.valueOf() == 0.0) {
      particles.update(time, target, 50, attract, repel);
    } else if (controls.Meshes.valueOf() == 1.0) {
      particles.update(time, target, 1, attract, repel);
      //particles.formMesh(apple, time);
    }
    
    //particles.setData(vec3.create());
    // set square instance data
    let offsets: Float32Array = new Float32Array(particles.getOffsets());
    let colors: Float32Array = new Float32Array(particles.getColors());
    square.setInstanceVBOs(offsets, colors);
    let n = particles.getNumParticles();
    square.setNumInstances(n * n);

    renderer.render(camera, lambert, [
      square,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main2();
