
import * as THREE from 'three';
import {GUI} from './build/dat.gui.module.js';
import {OrbitControls} from './build/OrbitControls.js';
import {FBXLoader} from './build/FBXLoader.js';
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

let plane;


//const image = new Image();
//image.src = ;

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

//Controls
var controls = new OrbitControls(camera, renderer.domElement );

//========DEBUG===========
initLights();
//loadTestSphere();
loadSkybox();
loadBaseGroundModel();
renderGui();
animate();
//========================

function loadSkybox(){
  //adding textures 
  //const texture = new THREE.TextureLoader().load(
  //'../Images/Background3JS.jpeg');

  //background texture 
  //scene.background = texture;
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

function loadTestSphere(){
  const planeGeometry = new THREE.PlaneGeometry(32, 32);
  const planeMaterial = new THREE.MeshLambertMaterial({
    color: 0xFFFFF,
    side: THREE.DoubleSide
  });

plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -0.5 * Math.PI;
//Plane.castShadow = true;
plane.recieveShadow = true;
scene.add(plane);

const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
const sphereMaterial = new THREE.MeshPhongMaterial({color: 0x0000FF, /*texture for sphere */ //map: texture
})
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.castShadow = true;
//Sphere.recieveShadow = true;
sphere.position.set(-4,14,-1);

scene.add(sphere);
}

//adding basic fod effect
//Note: we don't need fog, consider removing it
//scene.fog = new THREE.Fog(0xFFFFFF, 0, 200);

//Lighting
function initLights(){
  ambLight = new THREE.AmbientLight(ambLightColour, ambLightInten);
  scene.add(ambLight);

  dirLight = new THREE.DirectionalLight(dirLightColour, dirLightInten);
  dirLight.position.set(0, 500, 500);
  scene.add(dirLight);
}

// --- Sounds ---
//start button 
var stratButton = document.getElementById('startButton');
stratButton.addEventListener('click', PlayAudio);

function PlayAudio(){
const listener = new THREE.AudioListener();
//laod audio file 
camera.add( listener );
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('./sounds/sandyBeach.mp3', function(buffer){
  sound.setBuffer( buffer );
  sound.setLoop( true );
  sound.setVolume( 0.5 );
  sound.play();
});
stratButton.remove();//once user click it, delete button. 
}

//Base Ground Model
function loadBaseGroundModel(){

      const fbXLoader = new FBXLoader();
      fbXLoader.load('./model/chimney_canopy_base.fbx', function(chimneyCanopyBase) {

      chimneyCanopyBase.traverse(function(child){
          if (child.isMesh) 
          {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        } 
      );

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
  //Test shere
  let options = {
    sphereColor: '#ffea00',
    angle: 0.2,
    penumbra: 0,
    intensity: 1,
  }


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
    dirLight.intensity.set(col.dirLightInten);
  })
  //colourFolder.addColor(col, "ambLightColour").name("Ambient Light").onChange(() => 
  //{
    //ambLight.color.set(col.ambLightColour);
  //})
  //colourFolder.add(col, "ambLightColour", 0, 1, 0.005).name("AL Intensity");

  //colourFolder.add(mesh.rotation, "y", 0, Math.PI * 2, 0.001).name("Secondary Clour");
  //colourFolder.add(mesh.rotation, "z", 0, Math.PI * 2, 0.001).name("Accent Colour");
  //colourFolder.add(mesh.rotation, "z", 0, Math.PI * 2, 0.001).name("Regenerate");

  //let SphereFolder = gui.addFolder("Sphere Management");
  //SphereFolder.addColor(options, 'sphereColor').onChange(function(e){
    //Sphere.material.color.set(e)
  //});

  //below three gui options are for the light
  let lightFolder = gui.addFolder("Light Attributes Management");
  lightFolder.add(options, 'angle', 0, 1)
  lightFolder.add(options, 'penumbra', 0, 1)
  lightFolder.add(options, 'intensity', 0, 1)
}

function animate(){
  requestAnimationFrame(animate);
  render();
  //mesh.geometry.attributes.position.needsUpdate = true;
  //dirLight.angle = options.angle;
  //dirLight.angle = options.angle;
  //dirLight.intensity = options.intensity;
  let increment = 0.001;
  //scene.rotation.x += increment;
  scene.rotation.y += increment;
  //mesh.rotation.z += increment;
  controls.update();

}

/**
 *  L system //still in progress
 */
function Params() {
  this.iterations= 2;
  this.theta= 18;
  this.thetaRandomness= 0;
  this.angle= 0;
  this.scale= 4;
  this.scaleRandomness= 0;
  this.constantWidth= true;
  this.deltarota =30;
}

function Rules()  {
  this.axiom = 'F';
  this.mainRule = 'FF-[-F+F+F]+[+F-F-F]';
  this.Rule2 = '';
}

var rules = new Rules();
var params = new Params();

function drawLine(x,y, x0,y0, color, width) {
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x0,y0);
  ctx.strokeStyle = color;
  if (params.constantWidth) ctx.lineWidth = 1; else
  ctx.lineWidth = width;
  ctx.stroke();
}

function getRandomColor() {
  var r = ~~( 255 * Math.random());
 var g = ~~( 255 * Math.random());
var b = ~~( 255 * Math.random() );
  var a = colors.alpha;  
 return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

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

function DrawTheTree(geom, x_init, y_init, z_init){ 
  var geometry = geom; //var geometry 
    var Wrule = GetAxiomTree();
    var n = Wrule.length;
    var stackX = []; var stackY = [];  var stackZ = []; var stackA = [];
    var stackV = []; var stackAxis = [];
    
    var theta = params.theta * Math.PI / 180; 
    var scale = params.scale;
    var angle = params.angle * Math.PI / 180;
    
    var x0 = x_init;    var y0 = y_init;   var z0 = z_init ;
    var x;    var y;    var z;  
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
        if (a == "+"){angle -= theta;                     
                     }
        if (a == "-"){angle += theta;                     
                     }
        if (a == "F"){
          var a = vector_delta.clone().applyAxisAngle( axis_y, angle );          
          endpoint.addVectors(startpoint, a);  
         
          geometry.vertices.push(startpoint.clone());
          geometry.vertices.push(endpoint.clone());

          prev_startpoint.copy(startpoint);
          startpoint.copy(endpoint);
          axis_delta = new THREE.Vector3().copy(a).normalize();
          rota += deltarota;// + (5.0 - Math.random()*10.0);
          
        } 
        if (a == "L"){
          endpoint.copy(startpoint);
          endpoint.add(new THREE.Vector3(0, scale*1.5, 0));
          var vector_delta2 = new THREE.Vector3().subVectors(endpoint, startpoint);
          vector_delta2.applyAxisAngle( axis_delta, rota2 );
          endpoint.addVectors(startpoint, vector_delta2); 
          
          geometry.vertices.push(startpoint.clone());
          geometry.vertices.push(endpoint.clone());          

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
  return geometry;
}

function setRules0(){
  rules.axiom = "F";
  rules.mainRule = "F-F[-F+F[LLLLLLLL]]++F[+F[LLLLLLLL]]--F[+F[LLLLLLLL]]";
  params.iterations =3;
  params.angle = 0;
  params.theta = 30;
  params.scale = 6;    
}

setRules0();
  
var material = new THREE.LineBasicMaterial({color: 0x333333});
var line_geometry = new THREE.BufferGeometry(); //changed from geometry to buffer geo 
line_geometry = DrawTheTree(line_geometry, 0, -150, 0);  
//plant = new THREE.Mesh(line_geometry, material);
plant = new THREE.Line(line_geometry, material, THREE.LinePieces);
scene.add(plant);

function addTree(x,y){
  var material = new THREE.LineBasicMaterial({color: 0xaaa});
  var line_geometry = new THREE.Geometry();
  line_geometry = DrawTheTree(line_geometry, x, y, 0);
}

function render() 
{
    //controls.update(clock.getDelta());
    //scene.clear();
    renderer.render(scene,camera);
}

