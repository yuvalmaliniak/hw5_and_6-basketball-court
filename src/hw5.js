import {OrbitControls} from './OrbitControls.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Set background color
scene.background = new THREE.Color(0x000000);

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// BONUS: Extra fill light for stadium effect
const fillLight = new THREE.PointLight(0xffddbb, 0.5, 50);
fillLight.position.set(-15, 10, 15);
scene.add(fillLight);


// Enable shadows
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

// Create basketball court
function createBasketballCourt() {
  // Court floor - just a simple brown surface
  const courtGeometry = new THREE.BoxGeometry(30, 0.2, 15);
  const courtMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xc68642,  // Brown wood color
    shininess: 50
  });
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.receiveShadow = true;
  scene.add(court);
  
  // Note: All court lines, hoops, and other elements have been removed
  // Students will need to implement these features
}

// Create all elements
createBasketballCourt();
// Add Stadium Bleachers
function addBleachers() {
  const tierCount = 6;

  for (let i = 0; i < tierCount; i++) {
    const width = 30 - i * 1;
    const depth = 2;
    const height = 0.5;

    const grayShade = 0x444444 + i * 0x111111; // slightly lighter per row
    const bleacherMaterial = new THREE.MeshPhongMaterial({ color: grayShade });

    const bleacher = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      bleacherMaterial
    );
    const spacing = 0.7; // Increased height spacing
    bleacher.position.set(0, height / 2 + i * spacing, -8.5 - i * depth);

    scene.add(bleacher);

    const backBleacher = bleacher.clone();
    backBleacher.position.set(0, height / 2 + i * spacing, 8.5 + i * depth);
    scene.add(backBleacher);
  }
}


addBleachers();
// Add Scoreboard
function addScoreboard() {
  // Outer frame (larger and closer)
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(5, 2.5, 0.2),
    new THREE.MeshPhongMaterial({ color: 0x000000 })
  );
  frame.position.set(0, 10, -7); // moved closer
  scene.add(frame);

  // Canvas with higher-res text
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = 'yellow';
  ctx.font = 'bold 64px Arial';
  ctx.fillText('SCOREBOARD', 340, 100);

  // Scores
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.fillText('Home: 0', 220, 300);
  ctx.fillText('Away: 0', 620, 300);

  // Apply texture
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: texture });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.4), mat);
  screen.position.set(0, 10, -6.9);
  scene.add(screen);
}


addScoreboard();

//Add court markings
function addCourtLines() {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

  // Center line
  const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.11, -7.5),
    new THREE.Vector3(0, 0.11, 7.5),
  ]);
  const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
  scene.add(centerLine);

  // Center circle
  const circleRadius = 1.8;
  const circleSegments = 64;
  const circleGeometry = new THREE.CircleGeometry(circleRadius, circleSegments);
  const circle = new THREE.LineLoop(circleGeometry, lineMaterial);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.11;
  scene.add(circle);

  // Three-point arcs (both sides)
  const arcRadius = 6.75;
  const arcAngle = Math.PI; // 180 degrees
  const arcSegments = 64;
  const arcMaterial = lineMaterial;

  const arcXPositions = [-13.5, 13.5];
  for (let i of arcXPositions) {
    const arcGeometry = new THREE.BufferGeometry();
    const arcPoints = [];

    for (let a = -arcAngle / 2; a <= arcAngle / 2; a += arcAngle / arcSegments) {
      const angle = a;
      const sign = Math.sign(i); // -1 for left hoop, 1 for right hoop
      arcPoints.push(new THREE.Vector3(
        i - sign * arcRadius * Math.cos(angle), // subtract to pull arc inward
        0.11,
        arcRadius * Math.sin(angle)
      ));
    }

    arcGeometry.setFromPoints(arcPoints);
    const arcLine = new THREE.Line(arcGeometry, arcMaterial);
    scene.add(arcLine);
  }

}

//Add hoops
function createHoop(xPos) {
  const rimHeight = 3.05;
  const side = Math.sign(xPos);
  const boardOffset = 0.15;

  // Backboard
  const boardGeo = new THREE.PlaneGeometry(1.8, 1.05);
  const boardMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,  // ✅ Add this line
  });
  const backboard = new THREE.Mesh(boardGeo, boardMat);
  backboard.position.set(xPos, rimHeight, 0);
  backboard.rotation.y = -side * Math.PI / 2;
  scene.add(backboard);

  // Rim
  const rimGeo = new THREE.TorusGeometry(0.45, 0.03, 16, 100);
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.set(xPos - side * boardOffset, rimHeight, 0);
  rim.rotation.set(Math.PI / 2, 0, 0);


  scene.add(rim);

  // Net (cone shape with vertical lines)
  const netGeo = new THREE.BufferGeometry();
  const netPoints = [];
  const netHeight = 0.6;
  const netRadiusTop = 0.45;
  const netRadiusBottom = 0.1;
  const netSegments = 16;

  for (let i = 0; i < netSegments; i++) {
    const theta = (i / netSegments) * 2 * Math.PI;
    const xTop = netRadiusTop * Math.cos(theta);
    const zTop = netRadiusTop * Math.sin(theta);
    const xBottom = netRadiusBottom * Math.cos(theta);
    const zBottom = netRadiusBottom * Math.sin(theta);

    const rimX = rim.position.x; // Use actual rim position
    const top = new THREE.Vector3(rimX + xTop, rimHeight, zTop);
    const bottom = new THREE.Vector3(rimX + xBottom, rimHeight - netHeight, zBottom);
    netPoints.push(top, bottom);
  }

netGeo.setFromPoints(netPoints);
const net = new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));
scene.add(net);


  // Pole (vertical)
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 16);
  const poleMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(xPos + side * 1.2, 2, 0); // behind the hoop
  pole.castShadow = true;
  scene.add(pole);

  // Arm (angled toward backboard)
  const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 12);
  const arm = new THREE.Mesh(armGeo, poleMat);

  const start = new THREE.Vector3(pole.position.x, rimHeight, 0);
  const end = new THREE.Vector3(xPos - side * 0.05, rimHeight, 0.1 * side);


  arm.position.copy(start.clone().add(end).multiplyScalar(0.5));

  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
  arm.setRotationFromQuaternion(quaternion);

  scene.add(arm);
}




//Create basketball
function createBasketball() {
  const ballGeo = new THREE.SphereGeometry(0.24, 32, 32);
  const ballMat = new THREE.MeshPhongMaterial({ color: 0xFF8C00 });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.set(0, 0.24, 0);
  ball.castShadow = true;
  scene.add(ball);
}

//UI Containers
const scoreContainer = document.createElement('div');
scoreContainer.style.position = 'absolute';
scoreContainer.style.top = '20px';
scoreContainer.style.left = '20px';
scoreContainer.style.color = 'white';
scoreContainer.style.fontSize = '20px';
scoreContainer.style.fontFamily = 'Arial, sans-serif';
scoreContainer.innerHTML = 'Score: 0';
document.body.appendChild(scoreContainer);

const controlContainer = document.createElement('div');
controlContainer.style.position = 'absolute';
controlContainer.style.top = '50px';
controlContainer.style.left = '20px';
controlContainer.style.color = 'white';
controlContainer.style.fontSize = '16px';
controlContainer.innerHTML = 'Press O to toggle orbit controls';
document.body.appendChild(controlContainer);

// Call all setup functions
addCourtLines();

createHoop(-13.5);
createHoop(13.5);
createBasketball();


// Set camera position for better view
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

// Instructions display
const instructionsElement = document.createElement('div');
instructionsElement.style.position = 'absolute';
instructionsElement.style.bottom = '20px';
instructionsElement.style.left = '20px';
instructionsElement.style.color = 'white';
instructionsElement.style.fontSize = '16px';
instructionsElement.style.fontFamily = 'Arial, sans-serif';
instructionsElement.style.textAlign = 'left';
instructionsElement.innerHTML = `
  <h3>Controls:</h3>
  <p>O - Toggle orbit camera</p>
  <p>1 - Top-down view</p>
  <p>2 - Side view</p>
  <p>3 - Backboard view</p>`;
document.body.appendChild(instructionsElement);

// Handle key events
function handleKeyDown(e) {
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
  }
  if (e.key === "1") {
  camera.position.set(0, 25, 0); 
  camera.lookAt(0, 0, 0);
  }
  if (e.key === "2") {
    camera.position.set(0, 10, 20); 
    camera.lookAt(0, 0, 0);
  }
  if (e.key === "3") {
    camera.position.set(-25, 8, 0);
    camera.lookAt(0, 0, 0);
  }

}

document.addEventListener('keydown', handleKeyDown);

// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();
  
  renderer.render(scene, camera);
}

animate();