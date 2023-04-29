
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

//create the scene
scene = new THREE.Scene();
ratio = window.innerWidth/window.innerHeight;
//create the perspective camera
//for parameters see https://threejs.org/docs/#api/cameras/PerspectiveCamera
camera = new THREE.PerspectiveCamera(55, ratio, 45, 30000); //Ryu- the original value is (45, ration, 0.1, 1000);
//set the camera position
camera.position.set(-900,-200,-900);//original value was( 0, 50, 50)
// and the direction
camera.lookAt(0,0,0);

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
  ambientLight = new THREE.AmbientLight(new THREE.Color(159,43,104), 0.05);
  scene.add(ambientLight);

  //orange - Coral shade
  dirLight = new THREE.DirectionalLight(new THREE.Color(255,127,80), 0.005);
  dirLight.position.set(0, 500, 500);
}

/*
//skybox - desert skybox
function skybox(){
let materialArray = [];
let texture_ft = new THREE.TextureLoader().load('Image/Skybox2/desertdawn_ft.jpg');
let texture_bk = new THREE.TextureLoader().load('Image/Skybox2/desertdawn_bk.jpg');
let texture_up = new THREE.TextureLoader().load('Image/Skybox2/desertdawn_up.jpg');
let texture_dn = new THREE.TextureLoader().load('Image/Skybox2/desertdawn_dn.jpg');
let texture_rt = new THREE.TextureLoader().load('Image/Skybox2/desertdawn_rt.jpg');
let texture_lf = new THREE.TextureLoader().load('Image/Skybox2/desertdawn_lf.jpg');

materialArray.push(new THREE.MeshBasicMaterial({map: texture_ft}));
materialArray.push(new THREE.MeshBasicMaterial({map: texture_bk}));
materialArray.push(new THREE.MeshBasicMaterial({map: texture_up}));
materialArray.push(new THREE.MeshBasicMaterial({map: texture_dn}));
materialArray.push(new THREE.MeshBasicMaterial({map: texture_rt}));
materialArray.push(new THREE.MeshBasicMaterial({map: texture_lf}));

//set texture inside of the box 
for(let i=0; i<6; i++)
   materialArray[i].side = THREE.BackSide;
let skyboxGeo = new THREE.BoxGeometry(10000, 10000, 10000);
let skybox = new THREE.Mesh(skyboxGeo, materialArray);
scene.add(skybox);
//animate(); //mesh in animate function is not defined 
}
skybox();
*/

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
}

//create the webgl renderer
var renderer = new THREE.WebGLRenderer({antialias:true});
//set the size of the rendering window
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled = true;
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
//limit control so user won't exit the outside of the skybox 
controls.minDistance = 500;
controls.maxDistance = 1500;

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