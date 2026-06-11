const counterDOM = document.getElementById("counter");
const endDOM = document.getElementById("end");
const pauseMenuDOM = document.getElementById("pause-menu");

const scene = new THREE.Scene();

const distance = 500;
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  0.1,
  10000
);

camera.rotation.x = (50 * Math.PI) / 180;
camera.rotation.y = (20 * Math.PI) / 180;
camera.rotation.z = (10 * Math.PI) / 180;

const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
const initialCameraPositionX =
  Math.tan(camera.rotation.y) *
  Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;

// Dynamic zoom adjusted for better mobile scaling
const baseZoom = 2;
const minZoom = 1.5; // Increased to ensure objects aren't too small
const zoom = Math.max(minZoom, baseZoom * (Math.min(window.innerWidth, 800) / 800));
console.log(`Zoom level: ${zoom}`); // Debug log

const chickenSize = 15;

const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;

const stepTime = 200; // Miliseconds it takes for the chicken to take a step forward, backward, left or right

let lanes;
let currentLane;
let currentColumn;
let score;
let highScore = localStorage.getItem("highScore") || 0;

let previousTimestamp;
let startMoving;
let moves;
let stepStartTimestamp;
let isPaused = false;
let animationFrameId;

// Sound effects (you'll need to provide these files)
const jumpSound = new Audio("jump.mp3");
const crashSound = new Audio("crash.mp3");

// Themes
const themes = {
  day: { grass: 0xbaf455, grassSide: 0x99c846, road: 0x454a59, roadSide: 0x393d49 },
  night: { grass: 0x4a8b2d, grassSide: 0x3a6a23, road: 0x2a2e3b, roadSide: 0x1a1e29 }
};
let currentTheme = "day";

// Achievements
const achievements = [
  { name: "Lane Master", condition: () => currentLane >= 10, unlocked: false }
];

// Load texture for the truck's side facing the player with debug logging
const textureLoader = new THREE.TextureLoader();
const truckSideFacingPlayerTexture = textureLoader.load(
  "truck-side-facing-player.png", // Replace with your image path
  (texture) => {
    console.log("Texture loaded successfully:", texture.image.src);
  },
  undefined,
  (error) => {
    console.error("Error loading texture:", error);
  }
);

const carFrontTexture = new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110, 40, [
  { x: 10, y: 0, w: 50, h: 30 },
  { x: 70, y: 0, w: 30, h: 30 },
]);
const carLeftSideTexture = new Texture(110, 40, [
  { x: 10, y: 10, w: 50, h: 30 },
  { x: 70, y: 10, w: 30, h: 30 },
]);

const truckFrontTexture = new Texture(30, 30, [{ x: 15, y: 0, w: 10, h: 30 }]);
const truckRightSideTexture = new Texture(25, 30, [
  { x: 0, y: 15, w: 10, h: 10 },
]);
const truckLeftSideTexture = new Texture(25, 30, [
  { x: 0, y: 5, w: 10, h: 10 },
]);

const generateLanes = () =>
  [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((index) => {
      const lane = new Lane(index);
      lane.mesh.position.y = index * positionWidth * zoom;
      scene.add(lane.mesh);
      return lane;
    })
    .filter((lane) => lane.index >= 0);

const addLane = () => {
  const index = lanes.length;
  const lane = new Lane(index);
  lane.mesh.position.y = index * positionWidth * zoom;
  scene.add(lane.mesh);
  lanes.push(lane);
};

const chicken = new Chicken();
scene.add(chicken);

hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight);

const initialDirLightPositionX = -100;
const initialDirLightPositionY = -100;
dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
dirLight.castShadow = true;
dirLight.target = chicken;
scene.add(dirLight);

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
var d = 500;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

backLight = new THREE.DirectionalLight(0x000000, 0.4);
backLight.position.set(200, 200, 50);
backLight.castShadow = true;
scene.add(backLight);

const laneTypes = ["car", "truck", "forest"];
const laneSpeeds = [2, 2.5, 3];
const vehicleColors = [0xa52523, 0xbdb638, 0x78b14b];
const threeHeights = [20, 45, 60];

const initializeValues = () => {
  lanes = generateLanes();

  currentLane = 0;
  currentColumn = Math.floor(columns / 2);
  score = 0;

  previousTimestamp = null;

  startMoving = false;
  moves = [];
  stepStartTimestamp = null;
  isPaused = false; // Ensure paused state is reset

  chicken.position.x = 0;
  chicken.position.y = 0;
  chicken.position.z = 10 * zoom + 5; // Match original z-position
  chicken.rotation.set(0, 0, 0);

  camera.position.y = initialCameraPositionY;
  camera.position.x = initialCameraPositionX;

  dirLight.position.x = initialDirLightPositionX;
  dirLight.position.y = initialDirLightPositionY;

  console.log(`Chicken position: ${JSON.stringify(chicken.position)}`);
  console.log(`Camera position: ${JSON.stringify(camera.position)}`);

  counterDOM.innerHTML = `Lane: ${currentLane} | Score: ${score}`;
};

initializeValues();

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Resize handler
const updateCameraAndRenderer = () => {
  camera.left = window.innerWidth / -2;
  camera.right = window.innerWidth / 2;
  camera.top = window.innerHeight / 2;
  camera.bottom = window.innerHeight / -2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};
window.addEventListener('resize', updateCameraAndRenderer);
// Call once to ensure initial setup is correct
updateCameraAndRenderer();

// Pause menu logic
document.getElementById("pause").addEventListener("click", () => {
  if (!isPaused) {
    isPaused = true;
    cancelAnimationFrame(animationFrameId);
    pauseMenuDOM.style.display = "flex";
  }
});

document.getElementById("resume").addEventListener("click", () => {
  if (isPaused) {
    isPaused = false;
    pauseMenuDOM.style.display = "none";
    previousTimestamp = null; // Reset timestamp to avoid large delta
    animationFrameId = requestAnimationFrame(animate); // Restart animation loop
  }
});

document.getElementById("restart").addEventListener("click", () => {
  if (isPaused) {
    isPaused = false;
    pauseMenuDOM.style.display = "none";
    lanes.forEach((lane) => scene.remove(lane.mesh));
    initializeValues();
    previousTimestamp = null; // Reset timestamp to avoid large delta
    animationFrameId = requestAnimationFrame(animate); // Restart animation loop
  }
});

// Theme toggle
document.getElementById("theme-toggle").addEventListener("click", () => {
  currentTheme = currentTheme === "day" ? "night" : "day";
  lanes.forEach((lane) => {
    if (lane.type === "field" || lane.type === "forest") {
      lane.mesh.children.forEach((section, idx) => {
        if (idx === 0) section.material.color.set(themes[currentTheme].grass);
        else section.material.color.set(themes[currentTheme].grassSide);
      });
    } else if (lane.type === "car" || lane.type === "truck") {
      lane.mesh.children.forEach((section, idx) => {
        if (idx === 0) section.material.color.set(themes[currentTheme].road);
        else section.material.color.set(themes[currentTheme].roadSide);
      });
    }
  });
});

function Texture(width, height, rects) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(0,0,0,0.6)";
  rects.forEach((rect) => {
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
  });
  return new THREE.CanvasTexture(canvas);
}

function Wheel() {
  const wheel = new THREE.Mesh(
    new THREE.BoxBufferGeometry(12 * zoom, 33 * zoom, 12 * zoom),
    new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true })
  );
  wheel.position.z = 6 * zoom;
  return wheel;
}

function Car() {
  const car = new THREE.Group();
  const color =
    vehicleColors[Math.floor(Math.random() * vehicleColors.length)];

  const main = new THREE.Mesh(
    new THREE.BoxBufferGeometry(60 * zoom, 30 * zoom, 15 * zoom),
    new THREE.MeshPhongMaterial({ color, flatShading: true })
  );
  main.position.z = 12 * zoom;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main);

  const cabin = new THREE.Mesh(
    new THREE.BoxBufferGeometry(33 * zoom, 24 * zoom, 12 * zoom),
    [
      new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        flatShading: true,
        map: carBackTexture,
      }),
      new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        flatShading: true,
        map: carFrontTexture,
      }),
      new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        flatShading: true,
        map: carRightSideTexture,
      }),
      new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        flatShading: true,
        map: carLeftSideTexture,
      }),
      new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }), // top
      new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }), // bottom
    ]
  );
  cabin.position.x = 6 * zoom;
  cabin.position.z = 25.5 * zoom;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add(cabin);

  const frontWheel = new Wheel();
  frontWheel.position.x = -18 * zoom;
  car.add(frontWheel);

  const backWheel = new Wheel();
  backWheel.position.x = 18 * zoom;
  car.add(backWheel);

  car.castShadow = true;
  car.receiveShadow = false;

  return car;
}

function Truck() {
  const truck = new THREE.Group();
  const color =
    vehicleColors[Math.floor(Math.random() * vehicleColors.length)];

  const base = new THREE.Mesh(
    new THREE.BoxBufferGeometry(100 * zoom, 25 * zoom, 5 * zoom),
    new THREE.MeshLambertMaterial({ color: 0xb4c6fc, flatShading: true })
  );
  base.position.z = 10 * zoom;
  truck.add(base);

  const cargo = new THREE.Mesh(
    new THREE.BoxBufferGeometry(75 * zoom, 35 * zoom, 40 * zoom),
    [
      new THREE.MeshPhongMaterial({ color: 0xff0000, flatShading: true, map: truckSideFacingPlayerTexture }), // right side (visible when moving left-to-right)
      new THREE.MeshPhongMaterial({ color: 0xff0000, flatShading: true, map: truckSideFacingPlayerTexture }), // left side (visible when moving right-to-left)
      new THREE.MeshPhongMaterial({ color: 0xb4c6fc, flatShading: true }), // top
      new THREE.MeshPhongMaterial({ color: 0xb4c6fc, flatShading: true }), // bottom
      new THREE.MeshPhongMaterial({ color: 0xb4c6fc, flatShading: true }), // front
      new THREE.MeshPhongMaterial({ color: 0xb4c6fc, flatShading: true }), // back
    ]
  );
  cargo.position.x = 15 * zoom;
  cargo.position.z = 30 * zoom;
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  truck.add(cargo);

  const cabin = new THREE.Mesh(
    new THREE.BoxBufferGeometry(25 * zoom, 30 * zoom, 30 * zoom),
    [
      new THREE.MeshPhongMaterial({ color, flatShading: true }), // back
      new THREE.MeshPhongMaterial({
        color,
        flatShading: true,
        map: truckFrontTexture,
      }),
      new THREE.MeshPhongMaterial({
        color,
        flatShading: true,
        map: truckRightSideTexture,
      }),
      new THREE.MeshPhongMaterial({
        color,
        flatShading: true,
        map: truckLeftSideTexture,
      }),
      new THREE.MeshPhongMaterial({ color, flatShading: true }), // top
      new THREE.MeshPhongMaterial({ color, flatShading: true }), // bottom
    ]
  );
  cabin.position.x = -40 * zoom;
  cabin.position.z = 20 * zoom;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  truck.add(cabin);

  const frontWheel = new Wheel();
  frontWheel.position.x = -38 * zoom;
  truck.add(frontWheel);

  const middleWheel = new Wheel();
  middleWheel.position.x = -10 * zoom;
  truck.add(middleWheel);

  const backWheel = new Wheel();
  backWheel.position.x = 30 * zoom;
  truck.add(backWheel);

  return truck;
}

function Three() {
  const three = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.BoxBufferGeometry(15 * zoom, 15 * zoom, 20 * zoom),
    new THREE.MeshPhongMaterial({ color: 0x4d2926, flatShading: true })
  );
  trunk.position.z = 10 * zoom;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  three.add(trunk);

  const height = threeHeights[Math.floor(Math.random() * threeHeights.length)];

  const crown = new THREE.Mesh(
    new THREE.BoxBufferGeometry(30 * zoom, 30 * zoom, height * zoom),
    new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading: true })
  );
  crown.position.z = (height / 2 + 20) * zoom;
  crown.castShadow = true;
  crown.receiveShadow = false;
  three.add(crown);

  return three;
}

function Chicken() {
  const chicken = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxBufferGeometry(
      chickenSize * zoom,
      chickenSize * zoom,
      20 * zoom
    ),
    new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true })
  );
  body.position.z = 10 * zoom;
  body.castShadow = true;
  body.receiveShadow = true;
  chicken.add(body);

  const rowel = new THREE.Mesh(
    new THREE.BoxBufferGeometry(2 * zoom, 4 * zoom, 2 * zoom),
    new THREE.MeshLambertMaterial({ color: 0xf0619a, flatShading: true })
  );
  rowel.position.z = 21 * zoom;
  rowel.castShadow = true;
  rowel.receiveShadow = false;
  chicken.add(rowel);

  return chicken;
}

function Road() {
  const road = new THREE.Group();

  const createSection = (color) =>
    new THREE.Mesh(
      new THREE.PlaneBufferGeometry(boardWidth * zoom, positionWidth * zoom),
      new THREE.MeshPhongMaterial({ color })
    );

  const middle = createSection(themes[currentTheme].road);
  middle.receiveShadow = true;
  road.add(middle);

  const left = createSection(themes[currentTheme].roadSide);
  left.position.x = -boardWidth * zoom;
  road.add(left);

  const right = createSection(themes[currentTheme].roadSide);
  right.position.x = boardWidth * zoom;
  road.add(right);

  return road;
}

function Grass() {
  const grass = new THREE.Group();

  const createSection = (color) =>
    new THREE.Mesh(
      new THREE.BoxBufferGeometry(
        boardWidth * zoom,
        positionWidth * zoom,
        3 * zoom
      ),
      new THREE.MeshPhongMaterial({ color })
    );

  const middle = createSection(themes[currentTheme].grass);
  middle.receiveShadow = true;
  grass.add(middle);

  const left = createSection(themes[currentTheme].grassSide);
  left.position.x = -boardWidth * zoom;
  grass.add(left);

  const right = createSection(themes[currentTheme].grassSide);
  right.position.x = boardWidth * zoom;
  grass.add(right);

  grass.position.z = 1.5 * zoom;
  return grass;
}

function Lane(index) {
  this.index = index;
  this.type =
    index <= 0
      ? "field"
      : laneTypes[Math.floor(Math.random() * laneTypes.length)];

  switch (this.type) {
    case "field": {
      this.type = "field";
      this.mesh = new Grass();
      break;
    }
    case "forest": {
      this.mesh = new Grass();

      this.occupiedPositions = new Set();
      const treeCount = 4 + Math.floor(this.index / 10); // Increase trees with difficulty
      this.threes = Array.from({ length: treeCount }, () => {
        const three = new Three();
        let position;
        do {
          position = Math.floor(Math.random() * columns);
        } while (this.occupiedPositions.has(position));
        this.occupiedPositions.add(position);
        three.position.x =
          (position * positionWidth + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2;
        this.mesh.add(three);
        return three;
      });
      break;
    }
    case "car": {
      this.mesh = new Road();
      this.direction = Math.random() >= 0.5;

      const occupiedPositions = new Set();
      const vehicleCount = 3 + Math.floor(this.index / 5); // Increase cars with difficulty
      this.vehicles = Array.from({ length: Math.min(vehicleCount, columns / 2) }, () => {
        const vehicle = new Car();
        let position;
        do {
          position = Math.floor((Math.random() * columns) / 2);
        } while (occupiedPositions.has(position));
        occupiedPositions.add(position);
        vehicle.position.x =
          (position * positionWidth * 2 + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2;
        if (!this.direction) vehicle.rotation.z = Math.PI;
        this.mesh.add(vehicle);
        return vehicle;
      });

      this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)] * (1 + this.index * 0.05); // Increase speed with difficulty
      break;
    }
    case "truck": {
      this.mesh = new Road();
      this.direction = Math.random() >= 0.5;

      const occupiedPositions = new Set();
      const vehicleCount = 2 + Math.floor(this.index / 5); // Increase trucks with difficulty
      this.vehicles = Array.from({ length: Math.min(vehicleCount, columns / 3) }, () => {
        const vehicle = new Truck();
        let position;
        do {
          position = Math.floor((Math.random() * columns) / 3);
        } while (occupiedPositions.has(position));
        occupiedPositions.add(position);
        vehicle.position.x =
          (position * positionWidth * 3 + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2;
        if (!this.direction) vehicle.rotation.z = Math.PI;
        this.mesh.add(vehicle);
        return vehicle;
      });

      this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)] * (1 + this.index * 0.05); // Increase speed with difficulty
      break;
    }
  }
}

document.querySelector("#retry").addEventListener("click", () => {
  lanes.forEach((lane) => scene.remove(lane.mesh));
  initializeValues();
  endDOM.style.visibility = "hidden";
  previousTimestamp = null; // Reset timestamp to avoid large delta
  if (!isPaused) {
    animationFrameId = requestAnimationFrame(animate); // Restart animation loop
  }
});

document
  .getElementById("forward")
  .addEventListener("click", () => move("forward"));

document
  .getElementById("backward")
  .addEventListener("click", () => move("backward"));

document.getElementById("left").addEventListener("click", () => move("left"));

document.getElementById("right").addEventListener("click", () => move("right"));

window.addEventListener("keydown", (event) => {
  if (event.keyCode == "38") {
    // up arrow
    move("forward");
  } else if (event.keyCode == "40") {
    // down arrow
    move("backward");
  } else if (event.keyCode == "37") {
    // left arrow
    move("left");
  } else if (event.keyCode == "39") {
    // right arrow
    move("right");
  }
});

function move(direction) {
  const finalPositions = moves.reduce(
    (position, move) => {
      if (move === "forward")
        return { lane: position.lane + 1, column: position.column };
      if (move === "backward")
        return { lane: position.lane - 1, column: position.column };
      if (move === "left")
        return { lane: position.lane, column: position.column - 1 };
      if (move === "right")
        return { lane: position.lane, column: position.column + 1 };
    },
    { lane: currentLane, column: currentColumn }
  );

  if (direction === "forward") {
    if (
      lanes[finalPositions.lane + 1].type === "forest" &&
      lanes[finalPositions.lane + 1].occupiedPositions.has(
        finalPositions.column
      )
    )
      return;
    if (!stepStartTimestamp) {
      startMoving = true;
      jumpSound.play();
    }
    addLane();
  } else if (direction === "backward") {
    if (finalPositions.lane === 0) return;
    if (
      lanes[finalPositions.lane - 1].type === "forest" &&
      lanes[finalPositions.lane - 1].occupiedPositions.has(
        finalPositions.column
      )
    )
      return;
    if (!stepStartTimestamp) {
      startMoving = true;
      jumpSound.play();
    }
  } else if (direction === "left") {
    if (finalPositions.column === 0) return;
    if (
      lanes[finalPositions.lane].type === "forest" &&
      lanes[finalPositions.lane].occupiedPositions.has(
        finalPositions.column - 1
      )
    )
      return;
    if (!stepStartTimestamp) {
      startMoving = true;
      jumpSound.play();
    }
  } else if (direction === "right") {
    if (finalPositions.column === columns - 1) return;
    if (
      lanes[finalPositions.lane].type === "forest" &&
      lanes[finalPositions.lane].occupiedPositions.has(
        finalPositions.column + 1
      )
    )
      return;
    if (!stepStartTimestamp) {
      startMoving = true;
      jumpSound.play();
    }
  }
  moves.push(direction);
}

function animate(timestamp) {
  if (isPaused) return;
  animationFrameId = requestAnimationFrame(animate);

  if (!previousTimestamp) previousTimestamp = timestamp;
  const delta = timestamp - previousTimestamp;
  previousTimestamp = timestamp;

  // Animate cars and trucks moving on the lane
  lanes.forEach((lane) => {
    if (lane.type === "car" || lane.type === "truck") {
      const aBitBeforeTheBeginningOfLane =
        (-boardWidth * zoom) / 2 - positionWidth * 2 * zoom;
      const aBitAfterTheEndOfLane =
        (boardWidth * zoom) / 2 + positionWidth * 2 * zoom;
      lane.vehicles.forEach((vehicle) => {
        if (lane.direction) {
          vehicle.position.x =
            vehicle.position.x < aBitBeforeTheBeginningOfLane
              ? aBitAfterTheEndOfLane
              : (vehicle.position.x -= (lane.speed / 16) * delta);
        } else {
          vehicle.position.x =
            vehicle.position.x > aBitAfterTheEndOfLane
              ? aBitBeforeTheBeginningOfLane
              : (vehicle.position.x += (lane.speed / 16) * delta);
        }
      });
    }
  });

  if (startMoving) {
    stepStartTimestamp = timestamp;
    startMoving = false;
  }

  if (stepStartTimestamp) {
    const moveDeltaTime = timestamp - stepStartTimestamp;
    const moveDeltaDistance =
      Math.min(moveDeltaTime / stepTime, 1) * positionWidth * zoom;
    const jumpDeltaDistance =
      Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * 8 * zoom;
    const rotationAngle =
      Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * Math.PI / 4;

    switch (moves[0]) {
      case "forward": {
        const positionY =
          currentLane * positionWidth * zoom + moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        chicken.position.y = positionY;
        chicken.position.z = 10 * zoom + 5 + jumpDeltaDistance;
        chicken.rotation.x = rotationAngle;
        break;
      }
      case "backward": {
        const positionY = currentLane * positionWidth * zoom - moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        chicken.position.y = positionY;
        chicken.position.z = 10 * zoom + 5 + jumpDeltaDistance;
        chicken.rotation.x = -rotationAngle;
        break;
      }
      case "left": {
        const positionX =
          (currentColumn * positionWidth + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2 -
          moveDeltaDistance;
        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        chicken.position.x = positionX;
        chicken.position.z = 10 * zoom + 5 + jumpDeltaDistance;
        chicken.rotation.z = rotationAngle;
        break;
      }
      case "right": {
        const positionX =
          (currentColumn * positionWidth + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2 +
          moveDeltaDistance;
        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        chicken.position.x = positionX;
        chicken.position.z = 10 * zoom + 5 + jumpDeltaDistance;
        chicken.rotation.z = -rotationAngle;
        break;
      }
    }
    // Once a step has ended
    if (moveDeltaTime > stepTime) {
      switch (moves[0]) {
        case "forward": {
          currentLane++;
          score += 10; // Add 10 points per lane advanced
          if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore);
          }
          counterDOM.innerHTML = `Lane: ${currentLane} | Score: ${score}`;
          break;
        }
        case "backward": {
          currentLane--;
          score -= 10; // Subtract 10 points when moving back (but not below 0)
          score = Math.max(0, score);
          counterDOM.innerHTML = `Lane: ${currentLane} | Score: ${score}`;
          break;
        }
        case "left": {
          currentColumn--;
          break;
        }
        case "right": {
          currentColumn++;
          break;
        }
      }
      moves.shift();
      chicken.rotation.set(0, 0, 0);
      stepStartTimestamp = moves.length === 0 ? null : timestamp;
    }
  }

  // Check achievements
  achievements.forEach((achievement) => {
    if (!achievement.unlocked && achievement.condition()) {
      achievement.unlocked = true;
      alert(`Achievement Unlocked: ${achievement.name}`);
    }
  });

  // Hit test
  if (
    lanes[currentLane].type === "car" ||
    lanes[currentLane].type === "truck"
  ) {
    const chickenMinX = chicken.position.x - (chickenSize * zoom) / 2;
    const chickenMaxX = chicken.position.x + (chickenSize * zoom) / 2;
    const vehicleLength = { car: 60, truck: 105 }[lanes[currentLane].type];
    lanes[currentLane].vehicles.forEach((vehicle) => {
      const carMinX = vehicle.position.x - (vehicleLength * zoom) / 2;
      const carMaxX = vehicle.position.x + (vehicleLength * zoom) / 2;
      if (chickenMaxX > carMinX && chickenMinX < carMaxX) {
        crashSound.play();
        endDOM.style.visibility = "visible";
      }
    });
  }
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);