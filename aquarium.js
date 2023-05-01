//import "./style.css";

import * as THREE from "three";
import { PointerLockControls } from "./build/PointerLockControls.js";

//前進か後進か変数宣言 Forward or backward variable declaration
let moveForward = false;
let moveBackword = false;
let moveLeft = false;
let moveRight = false;

//移動速度と移動方向の定義 Definition of movement speed and direction of movement
const velocity = new THREE.Vector3(); //=0,0,0
const direction = new THREE.Vector3();

const color = new THREE.Color();

/**
 *  scene 
 **/
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.Fog(0xffffff, 0, 750);

/**
 *  camera 
 **/
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 2);

/**
 *  renderer 
 **/
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/**
 *  Light 
 **/
const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
light.position.set(0.5, 1, 0.75);
scene.add(light);

//FPS point of view setting 
const controls = new PointerLockControls(camera, renderer.domElement);
window.addEventListener("click", ()=> {
    controls.lock();
});

/**
 * create random object
 **/
const planeGeometry = new THREE.PlaneGeometry(400, 400, 100, 100);
const material = new THREE.MeshBasicMaterial({
  color: "orange",
  wireframe: true,
});
const plane = new THREE.Mesh(planeGeometry, material);
plane.rotateX(-Math.PI / 2);
scene.add(plane);

const boxGeometry = new THREE.BoxGeometry(20, 20, 20);
let position = boxGeometry.attributes.position;
const colorsBox = [];
for (let i = 0, l = position.count; i < l; i++) {
  color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
  colorsBox.push(color.r, color.g, color.b);
}
boxGeometry.setAttribute(
  "color",
  new THREE.Float32BufferAttribute(colorsBox, 3)
);
for (let i = 0; i < 200; i++) {
  const boxMaterial = new THREE.MeshPhongMaterial({
    specular: 0xffffff,
    flatShading: true,
    vertexColors: true,
  });
  boxMaterial.color.setHSL(
    Math.random() * 0.2 + 0.5,
    0.75,
    Math.random() * 0.25 + 0.75
  );
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
  box.position.y = Math.floor(Math.random() * 20) * 20 + 10;
  box.position.z = Math.floor(Math.random() * 20 - 10) * 20;
  scene.add(box);
}

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


document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

let prevTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();

  // 前進後進判定 forward and backward decisions
  direction.z = Number(moveForward) - Number(moveBackword); //cast two variable to 1 to 0
  direction.x = Number(moveRight) - Number(moveLeft);

  //ポインターがONになったら When the pointer turns ON
  if(controls.isLocked){
    const delta = (time - prevTime) / 1000;

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

  renderer.render(scene, camera);
}

animate();

/**
 * screen resize 
 **/
window.addEventListener("resize", onWindowResize);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
