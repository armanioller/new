import * as THREE from 'three';

// --- CONFIGURAÇÃO INICIAL ---
const scene = new THREE.Scene();

// --- SISTEMA DE CONTROLE E UI ---
let useRealTime = true;
let timeOfDay = 12; // 0 a 24
let timeSpeed = 1.0;
let cameraMode = 'follow'; // 'follow' ou 'free'

const timeDisplay = document.getElementById('time-display');
const timeSlider = document.getElementById('time-slider');
const timeSpeedSlider = document.getElementById('time-speed');
const settingsToggle = document.getElementById('settings-toggle');
const settingsMenu = document.getElementById('settings-menu');
const realTimeToggle = document.getElementById('real-time-toggle');
const manualTimeControls = document.getElementById('manual-time-controls');
const cameraModeSelect = document.getElementById('camera-mode');

settingsToggle.addEventListener('click', () => {
    settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
});

timeSlider.addEventListener('input', (e) => {
    timeOfDay = parseFloat(e.target.value);
});

timeSpeedSlider.addEventListener('input', (e) => {
    timeSpeed = parseFloat(e.target.value);
});

realTimeToggle.addEventListener('change', (e) => {
    useRealTime = e.target.checked;
    manualTimeControls.style.display = useRealTime ? 'none' : 'block';
});

cameraModeSelect.addEventListener('change', (e) => {
    cameraMode = e.target.value;
});

function formatTime(t) {
    const hours = Math.floor(t);
    const minutes = Math.floor((t % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// --- CÂMERA ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 8, 8);
camera.lookAt(0, 0, 0);

// --- RENDERIZADOR ---
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game-canvas'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// --- ILUMINAÇÃO ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(5, 10, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

// --- TERRENO (Low-Poly) ---
// Criando um terreno levemente acidentado
const floorGeometry = new THREE.PlaneGeometry(30, 30, 10, 10);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a5a40,
    flatShading: true
});

// "Bagunçar" um pouco os vértices para o visual low-poly
const vertices = floorGeometry.attributes.position.array;
for (let i = 0; i < vertices.length; i += 3) {
    vertices[i + 2] = Math.random() * 0.5;
}
floorGeometry.computeVertexNormals();

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// --- ELEMENTOS DO MUNDO ---
// Jogador Placeholder
const player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
player.position.y = 1;
player.castShadow = true;
scene.add(player);

// --- CONTROLES ---
const keys = {
    w: false, a: false, s: false, d: false,
    q: false, e: false,
    arrowup: false, arrowdown: false, arrowleft: false, arrowright: false,
    pageup: false, pagedown: false
};

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
        // Impedir scroll padrão em teclas de navegação
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'pageup', 'pagedown'].includes(key)) {
            e.preventDefault();
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

const playerSpeed = 0.1;
const cameraSpeed = 0.2;

function updateMovement() {
    if (cameraMode === 'follow') {
        updatePlayerFollow();
    } else {
        updateFreeCamera();
    }
}

function updatePlayerFollow() {
    const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

    if (moveX !== 0 || moveZ !== 0) {
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        player.position.x += (moveX / length) * playerSpeed;
        player.position.z += (moveZ / length) * playerSpeed;

        const targetAngle = Math.atan2(moveX, moveZ);
        player.rotation.y = targetAngle;
    }

    // Câmera segue o jogador
    camera.position.lerp(new THREE.Vector3(player.position.x + 8, player.position.y + 8, player.position.z + 8), 0.1);
    camera.lookAt(player.position);
}

let cameraRotation = { x: -Math.PI / 4, y: Math.PI / 4 };
let isRightMouseDown = false;

window.addEventListener('mousedown', (e) => {
    if (e.button === 2) isRightMouseDown = true;
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 2) isRightMouseDown = false;
});

window.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('mousemove', (e) => {
    if (isRightMouseDown && cameraMode === 'free') {
        cameraRotation.y -= e.movementX * 0.005;
        cameraRotation.x -= e.movementY * 0.005;
        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));
    }
});

function updateFreeCamera() {
    // 1. Movimentação (WASD + PageUp/PageDown/QE)
    const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    const moveY = (keys.pageup || keys.q ? 1 : 0) - (keys.pagedown || keys.e ? 1 : 0);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    // Movimento horizontal travado no plano XZ
    forward.y = 0;
    forward.normalize();
    right.y = 0;
    right.normalize();

    if (moveX !== 0 || moveZ !== 0 || moveY !== 0) {
        camera.position.add(forward.multiplyScalar(-moveZ * cameraSpeed));
        camera.position.add(right.multiplyScalar(moveX * cameraSpeed));
        camera.position.y += moveY * cameraSpeed;
    }

    // 2. Rotação (Arrow Keys)
    const rotationSpeed = 0.03;
    if (keys.arrowleft) cameraRotation.y += rotationSpeed;
    if (keys.arrowright) cameraRotation.y -= rotationSpeed;
    if (keys.arrowup) cameraRotation.x += rotationSpeed;
    if (keys.arrowdown) cameraRotation.x -= rotationSpeed;

    // Limitar rotação vertical para não "virar cambalhota"
    cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));

    camera.rotation.order = 'YXZ';
    camera.rotation.set(cameraRotation.x, cameraRotation.y, 0);
}

// Algumas árvores espalhadas
function createTree(x, z) {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 1, 6),
        new THREE.MeshStandardMaterial({ color: 0x582f0e })
    );
    trunk.position.y = 0.5;
    trunk.castShadow = true;
    group.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1, 2, 6),
        new THREE.MeshStandardMaterial({ color: 0x344e41, flatShading: true })
    );
    leaves.position.y = 2;
    leaves.castShadow = true;
    group.add(leaves);

    group.position.set(x, 0, z);
    scene.add(group);
}

createTree(4, -3);
createTree(-5, 2);
createTree(2, 6);

// --- ATUALIZAÇÃO DO AMBIENTE ---
function updateEnvironment() {
    // 1. Atualizar Hora
    if (useRealTime) {
        const now = new Date();
        // Sincronizar com UTC para ser "global" ou local? O usuário pediu global/SecondLife.
        // Second Life usa o horário do Pacífico (PT), mas vamos usar UTC para ser verdadeiramente global.
        timeOfDay = now.getUTCHours() + (now.getUTCMinutes() / 60) + (now.getUTCSeconds() / 3600);
    } else {
        timeOfDay = (timeOfDay + (0.002 * timeSpeed)) % 24;
    }

    timeDisplay.innerText = formatTime(timeOfDay);
    timeSlider.value = timeOfDay;

    // 2. Cores do Céu e Intensidade da Luz
    // Mapear timeOfDay para cores e posições
    // Às 12h (meio-dia), o sol deve estar no topo (y > 0).
    // Às 0h (meia-noite), o sol deve estar embaixo (y < 0).
    const angle = ((timeOfDay - 6) / 24) * Math.PI * 2;

    // Posição do sol/lua
    sunLight.position.set(
        Math.cos(angle) * 20,
        Math.sin(angle) * 20,
        10
    );

    // Lógica de cores baseada na fase (Transição Suave)
    let skyColor, sunIntensity, ambientIntensity;
    const dawnStart = 5, dawnEnd = 8;
    const dayStart = 8, dayEnd = 17;
    const sunsetStart = 17, sunsetEnd = 20;

    const colors = {
        midnight: new THREE.Color(0x020205),
        dawn: new THREE.Color(0xffa07a),
        noon: new THREE.Color(0x87ceeb),
        sunset: new THREE.Color(0xff4500)
    };

    if (timeOfDay >= dawnStart && timeOfDay < dawnEnd) { // Madrugada -> Amanhecer (05h - 08h)
        const t = (timeOfDay - dawnStart) / (dawnEnd - dawnStart);
        if (t < 0.5) {
            skyColor = colors.midnight.clone().lerp(colors.dawn, t * 2);
        } else {
            skyColor = colors.dawn.clone().lerp(colors.noon, (t - 0.5) * 2);
        }
        sunIntensity = t;
        ambientIntensity = 0.1 + (t * 0.4);
    } else if (timeOfDay >= dayStart && timeOfDay < dayEnd) { // Dia (08h - 17h)
        skyColor = colors.noon;
        sunIntensity = 1;
        ambientIntensity = 0.5;
    } else if (timeOfDay >= sunsetStart && timeOfDay < sunsetEnd) { // Entardecer -> Noite (17h - 20h)
        const t = (timeOfDay - sunsetStart) / (sunsetEnd - sunsetStart);
        if (t < 0.5) {
            skyColor = colors.noon.clone().lerp(colors.sunset, t * 2);
        } else {
            skyColor = colors.sunset.clone().lerp(colors.midnight, (t - 0.5) * 2);
        }
        sunIntensity = 1 - t;
        ambientIntensity = 0.5 - (t * 0.4);
    } else { // Noite (20h às 05h)
        skyColor = colors.midnight;
        sunIntensity = 0.01;
        ambientIntensity = 0.1;
    }

    scene.background = skyColor;
    sunLight.intensity = sunIntensity;
    ambientLight.intensity = ambientIntensity;

    // Cor da luz (mais quente no amanhecer/entardecer)
    if (timeOfDay > 5 && timeOfDay < 8 || timeOfDay > 17 && timeOfDay < 20) {
        sunLight.color.setHex(0xffaa55);
    } else {
        sunLight.color.setHex(0xffffff);
    }
}

// --- LOOP ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);

    updateEnvironment();
    updateMovement();

    renderer.render(scene, camera);
}

animate();
