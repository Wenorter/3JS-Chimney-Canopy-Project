// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
camera.position.set(0, 0, 5);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// center the canvas
renderer.domElement.style.margin = "0 auto";

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// Create the cubes
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.7 });

const cube1 = new THREE.Mesh(geometry, material);
scene.add(cube1);
cube1.position.x = -3.5;

const cube2 = new THREE.Mesh(geometry, material);
scene.add(cube2);
cube2.position.x = 3.5;

// Create the popups
const popup1 = createPopup('I am Cube 1 and if you want to hide me Press ESc');
const popup2 = createPopup('I am Cube 2 and if you want to hide me Press ESc');
// Position popup1 above cube1
popup1.style.top = `400 px`;
popup1.style.left = `300px`;
console.log(cube1.y,cube1.x);

// Position popup2 above cube2
popup2.style.top = `400px`;
popup2.style.left = `1100px`;



function createPopup(text) {
  const popup = document.createElement('div');
  popup.textContent = text;
  popup.style.backgroundColor = '#f2f2f2';
  popup.style.color = 'black';
  popup.style.position = 'absolute';
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.padding = '20px';
  popup.style.border = '1px solid black';
  return popup;
}

// Add an event listener for click on the cubes
let popupOpen = false;
renderer.domElement.addEventListener('click', (event) => {
  console.log('Canvas clicked');
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    if (intersects[0].object === cube1) {
      console.log('Cube 1 clicked');
      if (!popupOpen) {
        // Show popup 1
        document.body.appendChild(popup1);
        popupOpen = true;
        // Add a click listener to the document to close the popup
        const closePopup = () => {
          console.log('Popup closed');
          if (popupOpen) {
            document.body.removeChild(popup1);
            popupOpen = false;
            document.removeEventListener('keydown', closePopup);
          }
        };
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            closePopup();
          }
        });
        // Add a click listener to the popup to stop propagation
        popup1.addEventListener('click', (event) => {
          console.log('Popup 1 clicked');
          event.stopPropagation();
        });
      }
    }
    else if (intersects[0].object === cube2) {
      console.log('Cube 2 clicked');
      if (!popupOpen) {
        // Show popup 2
        document.body.appendChild(popup2);
        popupOpen = true;
        // Add a click listener to the document to close the popup
        const closePopup = () => {
          console.log('Popup closed');
          if (popupOpen) {
            document.body.removeChild(popup2);
            popupOpen = false;
            document.removeEventListener('keydown', closePopup);
          }
        };
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            closePopup();
          }
        });
        // Add a click listener to the popup to stop propagation
        popup2.addEventListener('click', (event) => {
          console.log('Popup 2 clicked');
          event.stopPropagation();
        });
      }
    }
  }
});

// Animate the scene
function animate() {
requestAnimationFrame(animate);

// Rotate the cubes
cube1.rotation.x += 0.01;
cube1.rotation.y += 0.01;
cube2.rotation.x += 0.01;
cube2.rotation.y += 0.01;

renderer.render(scene, camera);
}

animate();

    