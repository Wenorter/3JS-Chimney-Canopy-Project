
import * as THREE from 'three';
import {GUI} from './build/dat.gui.module.js';
import {OrbitControls} from './build/OrbitControls.js';
import {FBXLoader} from './build/FBXLoader.js';
import {NURBSCurve} from './build/NURBSCurve.js';




//==================================
//=======Lindenmayer Plant==========
//==================================

var chimneyCanopyBase;
var scene, ratio, camera;
var ambientLight, ambientLightColour, dirLight, dirLightColour;
var plantFirstColour, plantSecondColour, plantThirdColour;





//parameters for GUI
let params = {
  ambientLightColour: ambientLightColour,
  dirLightColour: dirLightColour,
  plantFirstColour: plantFirstColour,
  plantSecondColour: plantSecondColour,
  plantThirdColour: plantThirdColour
}


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

//create the webgl renderer
const renderer = new THREE.WebGLRenderer();

renderer.shadowMap.enabled = true;
//set the size of the rendering window
renderer.setSize(window.innerWidth,window.innerHeight);

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//add the renderer to the current document
document.body.appendChild(renderer.domElement);

//////////////
// CONTROLS //
//////////////

// move mouse and: left   click to rotate,
//                 middle click to zoom,
//                 right  click to pan
// add the new control and link to the current camera to transform its position

var controls = new OrbitControls(camera, renderer.domElement );

//adding textures 
const texture = new THREE.TextureLoader().load(
  '../Images/Background3JS.jpeg');

 //background texture 
scene.background = texture;



const PlaneGeometry = new THREE.PlaneGeometry(32, 32);
const PlaneMaterial = new THREE.MeshLambertMaterial({
  color: 0xFFFFFF,
  side: THREE.DoubleSide
});
const Plane = new THREE.Mesh(PlaneGeometry, PlaneMaterial);
scene.add(Plane);
Plane.rotation.x = -0.5 * Math.PI;
Plane.receiveShadow = true;

const SphereGeometry = new THREE.SphereGeometry(5, 32, 32);
const SphereMaterial = new THREE.MeshPhongMaterial({color: 0x0000FF, /*terxture for sphere */ map: texture
})
const Sphere = new THREE.Mesh(SphereGeometry, SphereMaterial);
scene.add(Sphere);
Sphere.position.set(-4,14,-1);
Sphere.castShadow = true;

//adding basic fod effect
scene.fog = new THREE.Fog(0xFFFFFF, 0, 200);



//========DEBUG===========
function createScene(){
  initLights();
  initFBXModel();
  renderGui();
}
createScene();
//========================

//Lighting
function initLights(){
  
  //dark pink - Amaranth shade
  //const ambientLightColour = new THREE.Color(159, 43, 104);
  const ambientLight = new THREE.AmbientLight(new THREE.Color(159,43,104), 0.05);
  scene.add(ambientLight);
  

  //orange - Coral shade
  const dirLight = new THREE.DirectionalLight(new THREE.Color(255,189,80), 0.005);
  //const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
  scene.add(dirLight);
  dirLight.position.set(-10, 50, 5);
  dirLight.castShadow = true;
  dirLight.shadow.camera.bottom = -12

  const dLightHelper = new THREE.DirectionalLightHelper(dirLight, 5);
  scene.add(dLightHelper);

  const dLightShadowHelper = new THREE.CameraHelper(dirLight.shadow.camera);
  scene.add(dLightShadowHelper);




}

//Base Ground Model
function initFBXModel(){

  const fbxLoader = new FBXLoader();
  fbxLoader.load('./model/chimney_canopy_base.fbx', function(object) {

    //object.mixer = new THREE.AnimationMixer(object);
    //mixers.push(object.mixer);

    //var action = object.mixer.clipAction( object.animations[ 0 ] );
    //action.play();

    object.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    } );

    chimneyCanopyBase = object;
    //object.rotation.set(0, 200, 0);
    object.scale.set(0.04, 0.04, 0.04);
    dirLight.target = object;
    scene.add(dirLight);
    scene.add(object);
  });
}

//Dat GUI
function renderGui()
{
  const gui = new GUI();

  const options = {
    sphereColor: '#ffea00',
    angle: 0.2,
    penumbra: 0,
    intensity: 1,


  }
  //colour change
  let rotationFolder = gui.addFolder("Scene Rotation");
  //rotationFolder.add(chimneyCanopyBase.rotation,"x", 0, Math.PI * 2, 0.001).name("First Colour");
  //rotationFolder.add(chimneyCanopyBase.rotation, "y", 0, Math.PI * 2, 0.001).name("Secondary Clour");
  //rotationFolder.add(chimneyCanopyBase.rotation, "z", 0, Math.PI * 2, 0.001).name("Accent Colour");

  let colourFolder = gui.addFolder("Scene Colour Management");
  //colourFolder.add(mesh.rotation,"x", 0, Math.PI * 2, 0.001).name("First Colour");
  //colourFolder.add(mesh.rotation, "y", 0, Math.PI * 2, 0.001).name("Secondary Clour");
  //colourFolder.add(mesh.rotation, "z", 0, Math.PI * 2, 0.001).name("Accent Colour");
  //colourFolder.add(mesh.rotation, "z", 0, Math.PI * 2, 0.001).name("Regenerate");

  let SphereFolder = gui.addFolder("Sphere Management");
  SphereFolder.addColor(options, 'sphereColor').onChange(function(e){
    Sphere.material.color.set(e)
  });

  //below three gui options are for the light
  let LightFolder = gui.addFolder("Light Attributes Management");
  LightFolder.add(options, 'angle', 0, 1)
  LightFolder.add(options, 'penumbra', 0, 1)
  LightFolder.add(options, 'intensity', 0, 1)

  

}




function animate(){
  //it's very important to clear the scene!
  //otherwise it has poor performance and pollutes the output with geometry 

  scene.clear();
  scene.add(mesh);

  //this flag needs to be set to be able to update geometry after first render
  mesh.geometry.attributes.position.needsUpdate = true;

  let increment = 0.000005;
  mesh.rotation.x += increment;
  mesh.rotation.y += increment;
  mesh.rotation.z += increment;

  renderer.render(scene,camera);
  controls.update();

  requestAnimationFrame(animate);

  dirLight.angle = options.angle;
  //dirLight.angle = options.angle;
  dirLight.intensity = options.intensity;

}

//final update loop
var MyUpdateLoop = function ( )
{
//call the render with the scene and the camera
renderer.render(scene,camera);
controls.update();

//finally perform a recoursive call to update again
//this must be called because the mouse change the camera position
requestAnimationFrame(MyUpdateLoop);
};

requestAnimationFrame(MyUpdateLoop);

//this fucntion is called when the window is resized
var MyResize = function ()
{
var width = window.innerWidth;
var height = window.innerHeight;
renderer.setSize(width,height);
camera.aspect = width/height;
camera.updateProjectionMatrix();
renderer.render(scene,camera);
};




//link the resize of the window to the update of the camera
window.addEventListener('resize', MyResize);