
import * as THREE from 'three';
import {GUI} from './build/dat.gui.module.js';
import {OrbitControls} from './build/OrbitControls.js';
import {FBXLoader} from './build/FBXLoader.js';
import {EffectComposer} from './build/EffectComposer.js';
import {RenderPass} from './build/RenderPass.js';
import {NURBSCurve} from './build/NURBSCurve.js';

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

var fireflyColorHex = new THREE.Color( 0x33ff33 );
var rate = Math.random() * 0.005 + 0.005;

//fireflys variable 
let pLight;
const pLights = [];

let plane;

//shaders
let vertexShader, fragmentShader, uniforms, leavesMaterial;
//deltaTime
const clock = new THREE.Clock();

//create the scene
scene = new THREE.Scene();
ratio = window.innerWidth/window.innerHeight;
//create the perspective camera
//for parameters see https://threejs.org/docs/#api/cameras/PerspectiveCamera
camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 1000);
//set the camera position
camera.position.set(0,50,50);
// and the direction
camera.lookAt(0,0,0);

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
var controls = new OrbitControls(camera, renderer.domElement );

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

// Fireflies
function getPointLight(color){

  var light = new THREE.PointLight(color, 1, 15.0);

  //light ball
  const geo = new THREE.SphereGeometry(0.05, 30, 30);
  var mat = new THREE.MeshBasicMaterial({color});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.add(light);

  const circle = new THREE.Object3D();
  circle.position.x = (25 * Math.random()) - 12.5;
  circle.position.y = (5 * Math.random()) + 10;
  circle.position.z = (25 * Math.random()) - 12.5;
  const radius = 5;
  mesh.position.x = radius;
  mesh.position.y = radius;
  mesh.position.z = radius;
  circle.rotation.x = THREE.MathUtils.degToRad(90);
  circle.rotation.y = Math.random() * Math.PI * 2;
  circle.add(mesh)

  var glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15
    });

    const glowMesh = new THREE.Mesh(geo, glowMat);
    glowMesh.scale.multiplyScalar(1.5);
    const glowMesh2 = new THREE.Mesh(geo, glowMat);
    glowMesh2.scale.multiplyScalar(2.5);
    const glowMesh3 = new THREE.Mesh(geo, glowMat);
    glowMesh3.scale.multiplyScalar(4);
    const glowMesh4 = new THREE.Mesh(geo, glowMat);
    glowMesh4.scale.multiplyScalar(6);

    mesh.add(glowMesh);
    mesh.add(glowMesh2);
    mesh.add(glowMesh3);
    mesh.add(glowMesh4);

  function update(){
      circle.rotation.z += rate;
  }

  return{
      obj: circle,
      update,
  }
}

for(let i = 0; i< 10; i+= 1){
  pLight = getPointLight(fireflyColorHex)
  scene.add(pLight.obj);
  pLights.push(pLight);
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
    plantThirdColour: 0xffffff, //white
    fireflyColor: 0x33ff33,
    fireflySpeed: 0.0005,
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

  gui.addColor(col, 'fireflyColor').name("Firefly Color").onChange(() => {
    fireflyColorHex.setHex(col.fireflyColor);
  });

  gui.add(col, "fireflySpeed", 0.0005, 0.05, 0.0005).name("Firefly Speed").onChange(() =>
  {
      rate = col.fireflySpeed;
  });
;
  //colourFolder.addColor(col, "ambLightColour").name("Ambient Light").onChange(() => 
  //{
    //ambLight.color.set(col.ambLightColour);
  //})
  //colourFolder.add(col, "ambLightColour", 0, 1, 0.005).name("AL Intensity");

  //colourFolder.add(mesh.rotation, "y", 0, Math.PI * 2, 0.001).name("Secondary Clour");
  //colourFolder.add(mesh.rotation, "z", 0, Math.PI * 2, 0.001).name("Accent Colour");
  //colourFolder.add(mesh.rotation, "z", 0, Math.PI * 2, 0.001).name("Regenerate");
}

//Animate
function animate(){
  requestAnimationFrame(animate);
  render();
  //grass shader animation
  // Hand a time variable to vertex shader for wind displacement.
	leavesMaterial.uniforms.time.value = clock.getElapsedTime();
  leavesMaterial.uniformsNeedUpdate = true;

  //firefly animation
  pLights.forEach( l => l.update());

  let increment = 0.001;
  scene.rotation.y += increment;
  controls.update();

}

function render() 
{
    composer.render(scene,camera);
}

//this fucntion is called when the window is resized
var MyResize = function ( )
{
var width = window.innerWidth;
var height = window.innerHeight;
renderer.setSize(width,height);
camera.aspect = width/height;
camera.updateProjectionMatrix();
renderer.render(scene,camera);
};

//link the resize of the window to the update of the camera
window.addEventListener( 'resize', MyResize);


