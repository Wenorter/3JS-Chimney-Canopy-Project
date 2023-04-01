
import * as THREE from 'three';
import { OrbitControls } from './build/controls/OrbitControls.js';

//create the scene
var scene = new THREE.Scene( );
var ratio = window.innerWidth/window.innerHeight;
//create the perspective camera
//for parameters see https://threejs.org/docs/#api/cameras/PerspectiveCamera
var camera = new THREE.PerspectiveCamera(45,ratio,0.1,1000);

//set the camera position
camera.position.set(0,0,15);
// and the direction
  camera.lookAt(0,0,1);

//create the webgl renderer
var renderer = new THREE.WebGLRenderer( );

//set the size of the rendering window
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//add the renderer to the current document
document.body.appendChild(renderer.domElement );

//create the material of the cube (basic material)
var material_cube = new THREE.MeshLambertMaterial();
//set the color of the cube
material_cube.color=  new THREE.Color(1,0,0);
//then set the renderer to wireframe
material_cube.wireframe=false;
//create the mesh of a cube
var geometry_cube = new THREE.BoxGeometry(1,1,1);
var cubes=[];


//the number of cubes composing the strip
var n=36;

//this clear the scene when parameters are updated
function ClearScene()
{
  for (let i = scene.children.length - 1; i >= 0; i--)
    if(scene.children[i].type == "Mesh")
        scene.remove(scene.children[i]);
}

var sphere_mesh;

function CreateScene()
{
  for (var i=0;i<n;i++)
  {
    //all the transformation are 4x4 matrices as
    //discussed in class
    var rot2 = new THREE.Matrix4();
    var sca = new THREE.Matrix4();
    var rot = new THREE.Matrix4();
    var tra = new THREE.Matrix4();
    var combined = new THREE.Matrix4();
    //this is a simple scale matrix to distort the cube to a
    // simple tile elongated
    sca.makeScale(0.5,3,1.5);
    //this rotate the cube along Z axis consider the angle and the
    //number of subdivisions it makes the moebois join to itself
    rot2.makeRotationZ ( i*(Math.PI/n) );
    //this translate the element on the border of the circle and
    //along the Y
    tra.makeTranslation (10,0,0);
    //this rotate each element to the right position on the circle
    rot.makeRotationY ( i*(2*Math.PI/n) );
    //notice: this are applied in backward order
    //4. it is rotate (notice the object is not on the center of rotation anymore)
    combined.multiply(rot);
    //3.then it is translated of a certain radius and along a certain y
    combined.multiply(tra);
    //2.each tile is rotate along itself to make a strip that join itself
    combined.multiply(rot2);
    //1. the simple cube is scaled on 0,0,0 to make it become a tile
    combined.multiply(sca);
    cubes[i] = new THREE.Mesh(geometry_cube,material_cube);
    cubes[i].castShadow = true;
    cubes[i].applyMatrix4(combined);

    cubes[i].geometry.computeBoundingBox();
    scene.add(cubes[i]);
  }

  //add a sphere in the middle of the moebius strip
  //then create a spotlight position and color
  var sphere_color = new THREE.Color(0.8,0.8,0.8);
  var sphere_geometry = new THREE.SphereGeometry(2,32,16);
  var sphere_material = new THREE.MeshPhongMaterial();

  //shininess and color
  sphere_material.color=sphere_color;
  sphere_material.shininess=80;

  sphere_material.wireframe=false;
  sphere_mesh = new THREE.Mesh( sphere_geometry, sphere_material );
  sphere_mesh.castShadow = true;
  scene.add( sphere_mesh );
}

CreateScene();

//lighting
//basic light from camera towards the scene
/*var cameralight = new THREE.PointLight( new THREE.Color(1,1,1), 0.7 );
cameralight.position.set(10,20,20);
scene.add(cameralight);*/

//then add ambient
//ambient lighting
var ambientlight = new THREE.AmbientLight(new THREE.Color(1,1,1), 0.2);
scene.add(ambientlight);

var spotlight = new THREE.SpotLight(new THREE.Color(1,1,1), 0.7);
spotlight.position.set(0, 30, 0);
spotlight.target = (sphere_mesh);
spotlight.angle = Math.PI / 7;
spotlight.penumbra = 0.5;
spotlight.castShadow = true;
spotlight.shadow.mapSize.width = 2048;
spotlight.shadow.mapSize.height = 2048;
var spotlightHelper = new THREE.SpotLightHelper(spotlight);
scene.add(spotlight);
scene.add(spotlightHelper);

var floorMaterial = new THREE.MeshLambertMaterial({side: THREE.DoubleSide});
floorMaterial.color = new THREE.Color(0.7,0.7,0.7);
var floorGeometry = new THREE.PlaneGeometry(50, 50, 200, 200);
var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.receiveShadow = true;
floor.rotation.x = Math.PI / 2
floor.position.set(0, -10, 0);
scene.add(floor);


//////////////
// CONTROLS //
//////////////

// move mouse and: left   click to rotate,
//                 middle click to zoom,
//                 right  click to pan
// add the new control and link to the current camera to transform its position

var controls = new OrbitControls( camera, renderer.domElement );

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