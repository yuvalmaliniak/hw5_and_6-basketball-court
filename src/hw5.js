import {OrbitControls} from './OrbitControls.js'
const soundScore = new Audio('src/swish.wav');
const soundRim = new Audio('src/rim.mp3');
const soundBounce = new Audio('src/bounce.mp3');

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

// ----- Global Physics and Control Variables -----
let ball;
let velocity = new THREE.Vector3();
let acceleration = new THREE.Vector3(0, -9.8, 0);
let isFlying = false;
let hasScored = false;
let targetHoop = null;
let shotsAttempted = 0;
let shotPower = 0.5;
let shotsMade = 0;
let score = 0;
const radius = 0.24;
const restitution = 0.7;
const rimHeight = 3.05;
const rimRadius = 2;  // Match the TorusGeometry radius used in createHoop
let targetZ = 0;
let comboCount = 0;
const floorY = radius + 0.1;
let spinAxis = new THREE.Vector3(1, 0, 0);
let spinSpeed = 0;  // radians per second
const HALF_WID = 15, HALF_LEN = 7.5;
const leftRimCenter = new THREE.Vector3(-13.5 + 0.15, rimHeight, 0);   // adjusted by board offset
const rightRimCenter = new THREE.Vector3(13.5 - 0.15, rimHeight, 0);

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
  const ballGeo = new THREE.SphereGeometry(radius, 32, 32);
  const ballMat = new THREE.MeshPhongMaterial({ color: 0xFF8C00 });
  ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.set(0, radius, 0);
  ball.castShadow = true;
  scene.add(ball);
}

function resetBall() {
  ball.position.set(0, radius, 0);
  hasScored = false;
  velocity.set(0, 0, 0);
  isFlying = false;
  shotPower = 0.5;
  spinSpeed = 0;
  updateUI();
}

function launchShot() {
  if (isFlying) return;

  // Choose the hoop that's closest to the ball's x position
  const leftHoop = new THREE.Vector3(-13.5, rimHeight, 0);
  const rightHoop = new THREE.Vector3(13.5, rimHeight, 0);

  const distToLeft = ball.position.distanceTo(leftHoop);
  const distToRight = ball.position.distanceTo(rightHoop);

  targetHoop = distToLeft < distToRight ? leftHoop : rightHoop;
  targetZ = targetHoop.z;
  // Raw direction from ball to hoop
  const raw = new THREE.Vector3().subVectors(targetHoop, ball.position);

  // Add some vertical lift to create an arc
  raw.y += 3;

  const dir = raw.normalize();

  const speed = shotPower * 25;
  velocity.copy(dir.multiplyScalar(speed));
  spinAxis.copy(velocity.clone().normalize().cross(new THREE.Vector3(0, 1, 0)).normalize());
  spinSpeed = velocity.length() * 3;  // tweak multiplier for realism
  spinAxis.copy(velocity.clone().normalize().cross(new THREE.Vector3(0, 1, 0)).normalize());
  spinSpeed = velocity.length() * 3; // tweak multiplier for realism
  acceleration.set(0, -9.8, 0);
  isFlying = true;
  hasScored = false;
  shotsAttempted++;
  updateUI();
}

const controlContainer = document.createElement('div');
controlContainer.style.position = 'absolute';
controlContainer.style.top = '50px';
controlContainer.style.left = '20px';
controlContainer.style.color = 'white';
controlContainer.style.fontSize = '16px';
controlContainer.innerHTML = 'Press O to toggle orbit controls';
document.body.appendChild(controlContainer);

// Shot Power UI
const powerDisplay = document.createElement('div');
powerDisplay.style.position = 'absolute';
powerDisplay.style.top = '80px';
powerDisplay.style.left = '20px';
powerDisplay.style.color = 'white';
powerDisplay.style.fontSize = '16px';

document.body.appendChild(powerDisplay);

const statsDisplay = document.createElement('div');
statsDisplay.style.position = 'absolute';
statsDisplay.style.top = '110px';
statsDisplay.style.left = '20px';
statsDisplay.style.color = 'white';
statsDisplay.style.fontSize = '16px';
document.body.appendChild(statsDisplay);

const shotMessage = document.createElement('div');
shotMessage.style.position = 'absolute';
shotMessage.style.top = '150px';
shotMessage.style.left = '20px';
shotMessage.style.color = 'white';
shotMessage.style.fontSize = '28px';
shotMessage.style.fontWeight = 'bold';
shotMessage.style.transition = 'opacity 0.5s ease';
shotMessage.style.opacity = '0'; // start hidden
document.body.appendChild(shotMessage);

function showShotMessage(text, color = "white") {
  shotMessage.innerHTML = text;
  shotMessage.style.color = color;
  shotMessage.style.opacity = '1';
  setTimeout(() => {
    shotMessage.style.opacity = '0';
  }, 1000);
}

function updateUI() {
  powerDisplay.innerHTML = `Shot Power: ${(shotPower * 100).toFixed(0)}%`;
  statsDisplay.innerHTML = `
    Attempts: ${shotsAttempted}<br>
    Made: ${shotsMade}<br>
    Accuracy: ${shotsAttempted > 0 ? ((shotsMade / shotsAttempted) * 100).toFixed(1) : 0}%<br>
    Score: ${score}
  `;
}
updateUI();

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
  <p>Arrow Keys - Move ball (Left/Right/Forward/Back)</p>
  <p>W / S - Increase / Decrease shot power</p>
  <p>Space - Shoot ball</p>
  <p>R - Reset ball to center</p>
  <p>1 - Top-down view</p>
  <p>2 - Side view</p>
  <p>3 - Backboard view</p>`;
instructionsElement.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
instructionsElement.style.padding = "10px";
instructionsElement.style.borderRadius = "8px";
instructionsElement.style.width = "220px";
instructionsElement.style.lineHeight = "1.4";
instructionsElement.style.fontFamily = "Arial, sans-serif";
document.body.appendChild(instructionsElement);

// Handle key events
function handleKeyDown(e) {
  switch (e.key.toLowerCase()) {
    case 'o':
      isOrbitEnabled = !isOrbitEnabled;
      break;
    case 'arrowleft':
      if (!isFlying) ball.position.x = Math.max(-HALF_WID, ball.position.x - 0.5);
      break;
    case 'arrowright':
      if (!isFlying) ball.position.x = Math.min(HALF_WID, ball.position.x + 0.5);
      break;
    case 'arrowup':
      if (!isFlying) ball.position.z = Math.max(-HALF_LEN, ball.position.z - 0.5);
      break;
    case 'arrowdown':
      if (!isFlying) ball.position.z = Math.min(HALF_LEN, ball.position.z + 0.5);
      break;
    case 'w':
      shotPower = Math.min(1, shotPower + 0.05);
      updateUI();
      break;
    case 's':
      shotPower = Math.max(0, shotPower - 0.05);
      updateUI();
      break;
    case 'r':
      resetBall();
      break;
    case ' ':
      if (!isFlying) launchShot();
      break;

    
  }
}


document.addEventListener('keydown', handleKeyDown);

// Animation function
function animate() {
  requestAnimationFrame(animate);
  const dt = 0.016; // ~60fps fixed step

  if (isFlying) {
    // 1) Integrate motion
    velocity.addScaledVector(acceleration, dt);
    ball.position.addScaledVector(velocity, dt);
    // 2) Update & apply decoupled spin
    const tmp = new THREE.Vector3().crossVectors(velocity, new THREE.Vector3(0, 1, 0));
    const speed = velocity.length() / radius;

    if (tmp.lengthSq() > 1e-6) {
      spinAxis.copy(tmp.normalize());
      spinSpeed = speed;
    }

    const spinAngle = spinSpeed * dt;
    ball.rotateOnWorldAxis(spinAxis, spinAngle);


    // 3) Ground collision
    if (ball.position.y <= floorY) {
      ball.position.y = floorY;
      velocity.y *= -restitution;
      soundBounce.play();
      if (Math.abs(velocity.y) < 1) {
        isFlying = false;
        velocity.set(0, 0, 0);
        if (!hasScored) {
          showShotMessage("MISSED SHOT", "red");
          setTimeout(() => (shotMessage.innerHTML = ""), 1000);
        }
      }
    }

    // 4) Backboard collision
    const boardOffset = 0.9 + 0.05 / 2;
    const boardZ = (targetZ > 0)
      ? HALF_LEN - boardOffset
      : -HALF_LEN + boardOffset;

    if (
      Math.abs(ball.position.z - boardZ) < radius &&
      ball.position.y > rimHeight - 1 &&
      ball.position.y < rimHeight + 1
    ) {
      velocity.z = -velocity.z * restitution;
    }

    // 5) Rim collision and scoring
    const rimOffset = 0.9 + 0.05 / 2 + 0.35;
    const rimCenter = (targetHoop.x < 0) ? leftRimCenter : rightRimCenter;
    const dx = ball.position.x - rimCenter.x;
    const dy = ball.position.y - rimCenter.y;
    const dz = ball.position.z - rimCenter.z;

    const horizDist = Math.hypot(dx, dz);
    const ballNearRim = Math.abs(ball.position.y - rimHeight) < 0.4;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

    // Rim collision
    const rimThickness = 0.06; 
    const ballBelowRim = ball.position.y < rimHeight + radius;
    const distXZ = Math.sqrt(dx*dx + dz*dz);

    // Rim collision (side only)
    if (distXZ > rimRadius - rimThickness && distXZ < rimRadius + rimThickness && ballBelowRim) {
      const normal = new THREE.Vector3(dx, 0, dz).normalize();
      const impact = velocity.dot(normal);
      if (impact < 0) {
        velocity.sub(normal.multiplyScalar(impact * restitution));
        ball.position.add(normal.multiplyScalar(0.02));
        soundRim.play();
      }
    }

    // Score detection
    if (
      !hasScored &&
      velocity.y < 0 &&
      ballBelowRim &&
      distXZ < (rimRadius - radius * 1.5) &&
      velocity.angleTo(new THREE.Vector3(0, -1, 0)) < Math.PI / 4 &&
      shotPower > 0.3 &&              
      velocity.length() > 8 && 
      Math.abs(velocity.x) < 10   
    ) {
      hasScored = true;
      shotsMade++;
      score += 2;
      comboCount++;
      soundScore.play();
      if (comboCount > 1) {
        const bonus = comboCount;
        score += bonus;
        showShotMessage(`COMBO x${comboCount}! +${2 + bonus} POINTS`, "lime");

      } else {
        showShotMessage("SHOT MADE!", "lime");
      }
      setTimeout(() => (shotMessage.innerHTML = ""), 1000);
      velocity.set(0, -1, 0);
    }

    // 6) Missed off-court
    if (Math.abs(ball.position.z) > HALF_LEN + 1) {
      isFlying = false;
      if (!hasScored) {
        comboCount = 0;
        showShotMessage("MISSED SHOT", "red");
        setTimeout(() => (shotMessage.innerHTML = ""), 1000);
      }
    }

    updateUI();
  }

  controls.enabled = isOrbitEnabled;
  controls.update();
  renderer.render(scene, camera);
}

animate();
