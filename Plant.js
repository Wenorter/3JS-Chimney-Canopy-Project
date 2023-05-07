
import * as THREE from 'three';
import {GUI} from './build/dat.gui.module.js';
import {OrbitControls} from './build/OrbitControls.js';
import {FBXLoader} from './build/FBXLoader.js';
import {EffectComposer} from './build/EffectComposer.js';
import {RenderPass} from './build/RenderPass.js';
import {NURBSCurve} from './build/NURBSCurve.js';
import { PointerLockControls } from "./build/PointerLockControls.js";

//==================================
//=======Lindenmayer Plant==========
//==================================

//defaults
let chimneyCanopyBase;
let scene, ratio, camera;
let renderer;

var ambLight, ambLightColour, ambLightInten;
var dirLight, dirLightColour,dirLightInten;
var plantFirstColour, plantSecondColour, plantThirdColour;
var backgroundColour;

let plane;

//shaders
let vertexShader, fragmentShader, uniforms, leavesMaterial;
//deltaTime
const clock = new THREE.Clock();

//FPC
//Forward or backward variable declaration
let moveForward = false;
let moveBackword = false;
let moveLeft = false;
let moveRight = false;


var down = false;

//Definition of movement speed and direction of movement
const velocity = new THREE.Vector3(); //=0,0,0
const direction = new THREE.Vector3();

const color = new THREE.Color();
let prevTime = performance.now();

//create the scene
scene = new THREE.Scene();
ratio = window.innerWidth/window.innerHeight;
//create the perspective camera
//for parameters see https://threejs.org/docs/#api/cameras/PerspectiveCamera
camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 1000);
//set the camera position
camera.position.set(0,10,50);
// and the direction
camera.lookAt(0,0,0);
const raycaster = new THREE.Raycaster();

//Create the webgl renderer
renderer = new THREE.WebGLRenderer();
renderer.antialias = true;
renderer.precision = "highp";
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.powerPreference = "high-performance";
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

//Effect Composer
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

//Controls
//var controls = new OrbitControls(camera, renderer.domElement );
const controls = new PointerLockControls(camera, document.body);//renderer.domElement);
window.addEventListener("click", ()=> {
  controls.lock();
});

//========DEBUG===========
initLights();
loadSkybox();
initGrassShader();
initGrassPlane();
lindenmayerPlant();
loadBaseGroundModel();
loadLizard();
renderGui();
animate(); 
//is placed at the bottom of code for get grass shader working. 
//Edit: I fixed it be declaring shader variables and splitting your code into initGrassShader() and initGrassPlane() at the top of the document;
//========================

//Event Listeners
window.addEventListener('resize', onWindowResize);
window.addEventListener('click', () => {PlayAudio()}, {once: true});

//Handle window resize
function onWindowResize() 
{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  controls.handleResize();
}

//Lighting
function initLights(){
  ambLight = new THREE.AmbientLight(ambLightColour, ambLightInten);
  scene.add(ambLight);

  dirLight = new THREE.DirectionalLight(dirLightColour, dirLightInten);
  dirLight.position.set(0, 500, 500);
  scene.add(dirLight);
}

//Skybox
function loadSkybox(){
  //adding textures 
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  scene.background = cubeTextureLoader.load([
    './images/rwcc/right.png',
    './images/rwcc/left.png',
    './images/rwcc/up.png',
    './images/rwcc/bottom.png',
    './images/rwcc/front.png',
    './images/rwcc/back.png',
  ])
}

//Grass Shader
function initGrassShader(){

  vertexShader = `
    varying vec2 vUv;
    uniform float time;
    
    void main() {

      vUv = uv;
      
      // VERTEX POSITION
      
      vec4 mvPosition = vec4(position, 1.0);
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
      #endif
      
      // DISPLACEMENT
      
      // here the displacement is made stronger on the blades tips.
      float dispPower = 1.0 - cos( uv.y * 3.1416 / 2.0 );
      
      float displacement = sin( mvPosition.z + time * 10.0 ) * ( 0.1 * dispPower );
      mvPosition.z += displacement;
      
      //
      
      vec4 modelViewPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * modelViewPosition;

    }
  `;

  fragmentShader = `
    varying vec2 vUv;
    
    void main() {
      vec3 baseColor = vec3(1, 0.2, 0.7); // was 0.41, 1.0, 0.5 
      float clarity = (vUv.y * 0.5 ) + 0.5;
      gl_FragColor = vec4(baseColor * clarity, 1 );
    }
  `;

  uniforms = {
    time: {
      value: 0
    }
  }

  leavesMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.DoubleSide
  });
}

//Grass Plane
function initGrassPlane(){
  const instanceNumber = 500; //was 5000
  const grass = new THREE.Object3D();

  const geometry = new THREE.PlaneGeometry(0.1, 1, 1, 4);// was 0.1, 1, 1, 4
  geometry.translate(0, 3, 0); // move grass blade geometry lowest point at 0. // original position is 0, 0.5, 0

  const instancedMesh = new THREE.InstancedMesh(geometry, leavesMaterial, instanceNumber);

  scene.add(instancedMesh);

  //Position and scale the grass blade instances randomly.

  for (let i = 0 ; i < instanceNumber; i++) {

    grass.position.set(
      ( Math.random() - 0.5 ) * 40, //original rand is ( Math.random() - 0.5 ) * 10, 0, ( Math.random() - 0.5 ) * 10
      0,
      ( Math.random() - 0.5 ) * 40
    ); 

    grass.userData.name = "grassPlane";
    grass.scale.setScalar(0.5 + Math.random() * 0.5);
    grass.rotation.y = Math.random() * Math.PI;
    grass.updateMatrix();
    instancedMesh.setMatrixAt(i, grass.matrix);
  }
}

//L-System Plant
function lindenmayerPlant(){
  //https://codepen.io/mikkamikka/pen/DrdzVK

  function Params() {
    this.iterations = 2;
    this.theta = 18;
    this.thetaRandomness = 100;
    this.angle = 0;
    this.scale = 4;
    this.scaleRandomness = 100;
    this.constantWidth = true;
    this.deltarota = 30;
  }

  function Rules()  {
    this.axiom = 'F';
    this.mainRule = 'FF-[-F+F+F]+[+F-F-F]';
    this.Rule2 = '';
  }

  var rules = new Rules();
  var params = new Params();

  var clear = {clear: function()
    {canvas.width = canvas.width;}};

  function GetAxiomTree() {
    var Waxiom = rules.axiom;
    var newf = rules.mainRule;
    var newb = 'bb';
    var newx = rules.Rule2;
    var level = params.iterations;    
    while (level > 0) {        
        var m = Waxiom.length;
        var T = '';        
        for (var j=0; j < m; j++) {
            var a = Waxiom[j];
            if (a == 'F'){T += newf;}
            else
              if (a == 'b'){T += newb;}
              else                   
                if (a == 'X'){T += newx;}
                else
                  T += a;
        }
        Waxiom = T;
        level--;
    }
    return Waxiom;
  }

  function DrawTheTree(plantGeometry, x_init, y_init, z_init){   
    let plantVertices = plantGeometry;
    var Wrule = GetAxiomTree();
    var n = Wrule.length;
    var stackX = []; var stackY = [];  var stackZ = []; var stackA = [];
    var stackV = []; var stackAxis = [];

    var theta = params.theta * Math.PI / 180; 
    var scale = params.scale;
    var angle = params.angle * Math.PI / 180;

    var x0 = x_init; var y0 = y_init; var z0 = z_init;
    var x; var y; var z;  
    var rota = 0, rota2 = 0,
        deltarota = 18 * Math.PI/180;  
    var newbranch = false;
    var axis_x = new THREE.Vector3( 1, 0, 0 );
    var axis_y = new THREE.Vector3( 0, 1, 0 );
    var axis_z = new THREE.Vector3( 0, 0, 1 );
    var zero = new THREE.Vector3( 0, 0, 0 );
    var axis_delta = new THREE.Vector3(),
      prev_startpoint = new THREE.Vector3();

    var startpoint = new THREE.Vector3(x0,y0,z0), 
        endpoint = new THREE.Vector3();
    var bush_mark;
    var vector_delta = new THREE.Vector3(scale, scale, 0);

    for (var j=0; j<n; j++){        
        var a = Wrule[j];
        if (a == "+")
        {
          angle -= theta;                     
        }
        if (a == "-")
        {
          angle += theta;                                 
        }
        if (a == "F"){
          var a = vector_delta.clone().applyAxisAngle( axis_y, angle );          
          endpoint.addVectors(startpoint, a);  
          
          plantVertices.push(startpoint.clone());
          plantVertices.push(endpoint.clone());

          prev_startpoint.copy(startpoint);
          startpoint.copy(endpoint);
          axis_delta = new THREE.Vector3().copy(a).normalize();
          rota += deltarota;// + (5.0 - Math.random()*10.0);
          
        } 
        if (a == "L")
        {
          endpoint.copy(startpoint);
          endpoint.add(new THREE.Vector3(0, scale*1.5, 0));
          var vector_delta2 = new THREE.Vector3().subVectors(endpoint, startpoint);
          vector_delta2.applyAxisAngle( axis_delta, rota2 );
          endpoint.addVectors(startpoint, vector_delta2); 
          
          plantVertices.push(startpoint.clone());
          plantVertices.push(endpoint.clone());          

          rota2 += 45 * Math.PI/180;
        }
        if (a == "%"){}
        if (a == "["){
            stackV.push(new THREE.Vector3(startpoint.x, startpoint.y, startpoint.z));            
            stackA[stackA.length] = angle;            
        }
        if (a == "]"){
            var point = stackV.pop();
            startpoint.copy(new THREE.Vector3(point.x, point.y, point.z));
            angle = stackA.pop();
        }        
      bush_mark = a;
    }
  return plantVertices;
  }

  function setRules(){
    rules.axiom = "F";
    rules.mainRule = "F-F[-F+F[LLLLLLLL]]++F[+F[LLLLLLLL]]--F[+F[LLLLLLLL]]";
    params.iterations = 3;
    params.angle = 0;
    params.theta = 30;
    params.scale = 6;    
  }

  function plantInit() {

  setRules();

  let plantGeometry = [];
  var material = new THREE.LineBasicMaterial({color: 0xA91B60}); //pink
  material.linewidth = 3;
  plantGeometry = DrawTheTree(plantGeometry, 0, -150, 0);  
  var geometry = new THREE.BufferGeometry().setFromPoints(plantGeometry);

  //plant = new THREE.Mesh(line_geometry, material);
  var plant = new THREE.Line(geometry, material);
  plant.position.set(8,7,-6);
  plant.scale.setScalar(0.05);
  scene.add(plant);       
  }
  plantInit();
}

//Pink Lizard
function loadLizard(){
  const fbxLoader = new FBXLoader();
  fbxLoader.setResourcePath("./textures/pink_lizard/");
  fbxLoader.load('./model/pink_lizard.fbx', function(lizard) {

    lizard.traverse(function(child){
      if (child.isMesh) 
      {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    } 
  );

  lizard.userData.name = "Pink Lizard";
  lizard.scale.setScalar(0.12);
  lizard.position.set(-10, 2.2, -10);
  lizard.rotation.set(0, 0, 0);
  scene.add(lizard);
  });
}

//Music
function PlayAudio(){
const listener = new THREE.AudioListener();
//laod audio file 
camera.add( listener );
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('./music/progfox-overcast.mp3', function(buffer){
  sound.setBuffer( buffer );
  sound.setLoop( true );
  sound.setVolume( 0.5 );
  sound.play();
});
}

//Base Ground Model
function loadBaseGroundModel(){

      const fbxLoader = new FBXLoader();
      fbxLoader.setResourcePath("./textures/base/");
      fbxLoader.load('./model/chimney_canopy_base.fbx', function(chimneyCanopyBase) {

      chimneyCanopyBase.traverse(function(child){
          if (child.isMesh) 
          {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        } 
      );

      chimneyCanopyBase.userData.name = "Chimney Canopy Base";
      chimneyCanopyBase.scale.setScalar(0.04);
      dirLight.target = chimneyCanopyBase;
      scene.add(chimneyCanopyBase);
    });
}

//Dat GUI
function renderGui()
{
  const gui = new GUI();

  //parameters for GUI
//colour variables
  let col = {
    ambLightColour: 0xe52b50,  //dark pink - Amaranth shade
    ambLightInten: 0.05,
    dirLightColour: 0xfd8535, //orange - Coral shade
    dirLightInten: 0.05,
    plantFirstColour: 0xffffff, //white
    plantSecondColour: 0xffffff, //white
    plantThirdColour: 0xffffff //white
  }

  let colourFolder = gui.addFolder("Scene Colour Management");

  let ambLightFolder = colourFolder.addFolder("Ambient Light Control");
  ambLightFolder.addColor(col, "ambLightColour").name("AL Colour").onChange(() => 
  {
      ambLight.color.setHex(col.ambLightColour);
  });
  ambLightFolder.add(col, "ambLightInten", 0, 10, 0.005).name("AL Intensity").onChange(() =>
  {
      ambLight.intensity = col.ambLightInten;
  });

  //scene colour change
  let dirLightFolder = colourFolder.addFolder("Directional Light Control");
  dirLightFolder.addColor(col, "dirLightColour").name("Directional Light").onChange(() => 
  {
    dirLight.color.setHex(col.dirLightColour);
  })
  dirLightFolder.add(col, "dirLightInten", 0, 1, 0.005).name("Dir Light Intensity").onChange(() => 
  {
    dirLight.intensity = col.dirLightInten;
  })
  //colourFolder.addColor(col, "ambLightColour").name("Ambient Light").onChange(() => 
  //{
    //ambLight.color.set(col.ambLightColour);
  //})
  //colourFolder.add(col, "ambLightColour", 0, 1, 0.005).name("AL Intensity");

  //colourFolder.add(mesh.rotation, "y", 0, Math.PI * 2, 0.001).name("Secondary Clour");
  //colourFolder.add(mesh.rotation, "z", 0, Math.PI * 2, 0.001).name("Accent Colour");
  //colourFolder.add(mesh.rotation, "z", 0, Math.PI * 2, 0.001).name("Regenerate");
}

//FPC Camera movement
//const raycaster = new THREE.Raycaster();

function onPointerMove( event ){
   // console.log("clicked");
    const pointer = new THREE.Vector2();
    pointer.x = ( camera.position.x / window.innerWidth ) * 2 - 1; //event.clientX
    pointer.y = -( camera.position.y / window.innerHeight ) * 2 + 1;
    console.log(pointer.x)
    console.log(pointer.y);

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects( scene.children, false );
    // const intersects1 = raycaster.intersectObjects( plane, false );
    // raycaster.layers.set( 1 ); 
    //plane.layers.enable( 1 );
    if (intersects.length > 0){
       intersects[0].object.material.color.set(0xff0000);
       console.log("hit");
    }
    else {
        console.log(" not hit");
    }
    
}
window.addEventListener( 'mousedown', onPointerMove, false);

var arrow;

// -- Keyboard controls --
const onKeyDown = (e) => {
  switch(e.code) {
      case "KeyW":
          moveForward = true;
          break;
      case "KeyA":
          moveLeft = true;
          break;
      case "KeyS":
      moveBackword = true;
          break;
      case "KeyD":
      moveRight = true;
          break;
  }
};

const onKeyUp = (e) => {
  switch(e.code) {
      case "KeyW":
          moveForward = false;
          break;
      case "KeyA":
          moveLeft = false;
          break;
      case "KeyS":
      moveBackword = false;
          break;
      case "KeyD":
      moveRight = false;
          break;
  }
};

function FPCanimate(){
    //FPS 
    const time = performance.now();

    // forward and backward decisions
    direction.z = Number(moveForward) - Number(moveBackword); //cast two variable to 1 to 0
    direction.x = Number(moveRight) - Number(moveLeft);
  
    // When the pointer turns ON
    if(controls.isLocked){
      
      const delta = (time - prevTime) / 1000;
  
      raycaster.setFromCamera( new THREE.Vector2(), camera );  
      scene.remove ( arrow );
      arrow = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 0.25, 0x000000 );
      scene.add( arrow );
      //Decay 
      velocity.z -= velocity.z * 5.0 * delta;
      velocity.x -= velocity.x * 5.0 * delta;
  
      if(moveForward || moveBackword){
          velocity.z -= direction.z * 200 * delta; //change movement speed here
      }
      if(moveRight || moveLeft){
          velocity.x -= direction.x * 200 * delta; //change movement speed here
      }
      
      controls.moveForward(-velocity.z * delta);
      controls.moveRight(-velocity.x * delta);
    } 
    
    prevTime = time;
}

document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

//Animate
function animate(){
  requestAnimationFrame(animate);
  render();
  //grass shader animation
  // Hand a time variable to vertex shader for wind displacement.
	leavesMaterial.uniforms.time.value = clock.getElapsedTime();
  leavesMaterial.uniformsNeedUpdate = true;

  //let increment = 0.001;
  //scene.rotation.y += increment;
  //controls.update();
  
  FPCanimate();
  renderer.render(scene, camera);

}

function render() 
{
    composer.render(scene,camera);
}


