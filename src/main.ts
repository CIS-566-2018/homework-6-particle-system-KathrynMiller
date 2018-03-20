import {vec3, vec2} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import Particle from './Particle';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import objLoader from './objLoader';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  Meshes: 0.0,
  attraction: .5,
};

let square: Square;
let particles: Particle;
let time: number = 0.0;
let canvas : HTMLCanvasElement;
let attract: boolean = false;
let repel: boolean = false;
let target: vec3 = vec3.create();
let strength: number = 50;

let camera: Camera;

let lotusVertices: Array<Array<number>>;
let vaseVertices: Array<Array<number>>;
let roseVertices: Array<Array<number>>;
let loader: objLoader;

function loadScene() {

  loader = new objLoader();
  lotusVertices = new Array<Array<number>>();
  vaseVertices = new Array<Array<number>>();
  roseVertices = new Array<Array<number>>();
  square = new Square();
  particles = new Particle();
  particles.setData(vec3.create(), false, false);
  square.create();

  let offsets: Float32Array = new Float32Array(particles.getOffsets());
  let colors: Float32Array = new Float32Array(particles.getColors());
  square.setInstanceVBOs(offsets, colors);
  let n = particles.getNumParticles();
  square.setNumInstances(n * n);

  loader.load('./src/objs/lotus.obj');
  lotusVertices = loader.getPositions();
  loader.load('./src/objs/flower.obj');
  vaseVertices = loader.getPositions();
  loader.load('./src/objs/rose.obj');
  roseVertices = loader.getPositions();

}
// return point at z = 0 from the casted ray direction
function rayCast(pixel: vec2, camera: Camera): vec3 {

  var targetDist = vec3.create();
  let v = vec3.create();
  let h = vec3.create();

  vec3.subtract(targetDist, camera.target, camera.position);
  var len = vec3.length(targetDist);
  
  vec3.scale(v, camera.up, Math.tan(camera.fovy / 2.0) * len);
  vec3.scale(h, camera.right, Math.tan(camera.fovy / 2.0) * len * camera.aspectRatio);
  
  vec3.scale(v, v, pixel[1]);
  vec3.scale(h, h, pixel[0]);

  var point = vec3.create();
  vec3.add(point, h, v);
  vec3.add(point, point, camera.target);
  return point;

}

function mouseDrag(event: MouseEvent): void {
  var x: number = event.screenX;
  var y: number = event.screenY;

  x -= canvas.offsetLeft;
  y -= canvas.offsetTop;
  // convert to ndc
  x = (x / canvas.width) * 2 - 1;
  y = (y / canvas.height) * -2 + 1;
  // tell particles to repel or attract based on mouse button clicked
  if(event.button == 0) {
    target = rayCast(vec2.fromValues(x, y),camera);
    attract = true;
    repel = false;
  } else if (event.button == 2) {
    target = rayCast(vec2.fromValues(x, y), camera);
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
  // convert to ndc
  x = (x / canvas.width) * 2 - 1;
  y = (y / canvas.height) * -2 + 1;
  // tell particles to repel or attract based on mouse button clicked
  if(event.button == 0) {
    target = rayCast(vec2.fromValues(x, y), camera);
    attract = true;
    repel = false;
  } else if (event.button == 2) {
    target = rayCast(vec2.fromValues(x, y), camera);
    repel = true;
    attract = false;
  }
}

function mouseUp(event: MouseEvent): void {
  attract = false;
  repel = false;
  target = vec3.create();
}


function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  let mesh = gui.add(controls, 'Meshes', { 'None': 0.0, 'Lotus': 1.0, 'Flower': 2.0, 'Rose': 3.0} );
  let attractionStrength = gui.add(controls, 'attraction', 0.0, 1.0);

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
  renderer.setClearColor(21.0 / 255.0, 40.0 / 255.0,  147.0 / 255.0, 1);
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

    // try to get particles accelerating more to break away from old mesh quicker
    mesh.onChange(function() {
      particles.applyRandomForce(time);
    }) 

    attractionStrength.onChange(function() {
      
      strength = 100.0 - controls.attraction.valueOf() * 100.0; 
      console.log(strength);
    }) 

    if(controls.Meshes.valueOf() == 0.0) {
      particles.update(time, target, strength, attract, repel, [], false);
    } else if (controls.Meshes.valueOf() == 1.0) {
      //particles.update(time, target, 1, attract, repel);
      particles.update(time, target, strength, attract, repel, lotusVertices, true);
    } else if (controls.Meshes.valueOf() == 2.0) {
      particles.update(time, target, strength, attract, repel, vaseVertices, true);
    } else if (controls.Meshes.valueOf() == 3.0) {
      particles.update(time, target, strength, attract, repel, roseVertices, true);
    }
    particles.setData(target, attract, repel); 

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

main();
