import * as THREE from 'three';

// --- CONFIGURAÇÃO INICIAL ---
const scene = new THREE.Scene();

// --- SISTEMA DE TEMPO ---
let timeOfDay = 12; // 0 a 24
let timeSpeed = 0.5;

const timeDisplay = document.getElementById('time-display');
const timeSlider = document.getElementById('time-slider');
const timeSpeedSlider = document.getElementById('time-speed');
const settingsToggle = document.getElementById('settings-toggle');
const settingsMenu = document.getElementById('settings-menu');

settingsToggle.addEventListener('click', () => {
    settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
});

timeSlider.addEventListener('input', (e) => {
    timeOfDay = parseFloat(e.target.value);
});

timeSpeedSlider.addEventListener('input', (e) => {
    timeSpeed = parseFloat(e.target.value);
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
    w: false,
    a: false,
    s: false,
    d: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) {
        keys[e.key.toLowerCase()] = false;
    }
});

const playerSpeed = 0.1;

function updatePlayer() {
    const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

    if (moveX !== 0 || moveZ !== 0) {
        // Normalizar vetor de movimento para velocidade diagonal não ser maior
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        player.position.x += (moveX / length) * playerSpeed;
        player.position.z += (moveZ / length) * playerSpeed;

        // Rotacionar o player para a direção do movimento
        const targetAngle = Math.atan2(moveX, moveZ);
        player.rotation.y = targetAngle;
    }

    // Fazer a câmera seguir o jogador (opcional mas bom para o RPG)
    camera.position.x = player.position.x + 8;
    camera.position.z = player.position.z + 8;
    camera.lookAt(player.position);
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
    timeOfDay = (timeOfDay + (0.01 * timeSpeed)) % 24;
    timeDisplay.innerText = formatTime(timeOfDay);
    timeSlider.value = timeOfDay;

    // 2. Cores do Céu e Intensidade da Luz
    // Mapear timeOfDay para cores e posições
    const angle = (timeOfDay / 24) * Math.PI * 2 + Math.PI; // Ajuste para o sol nascer no lugar certo

    // Posição do sol/lua
    sunLight.position.set(
        Math.cos(angle) * 20,
        Math.sin(angle) * 20,
        10
    );

    // Lógica de cores baseada na fase
    let skyColor, sunIntensity, ambientIntensity;

    if (timeOfDay >= 5 && timeOfDay < 8) { // Amanhecer
        const t = (timeOfDay - 5) / 3;
        skyColor = new THREE.Color(0xffa07a).lerp(new THREE.Color(0x87ceeb), t);
        sunIntensity = t;
        ambientIntensity = 0.3 + (t * 0.2);
    } else if (timeOfDay >= 8 && timeOfDay < 17) { // Dia
        skyColor = new THREE.Color(0x87ceeb);
        sunIntensity = 1;
        ambientIntensity = 0.5;
    } else if (timeOfDay >= 17 && timeOfDay < 20) { // Entardecer
        const t = (timeOfDay - 17) / 3;
        skyColor = new THREE.Color(0x87ceeb).lerp(new THREE.Color(0xff4500), t);
        sunIntensity = 1 - (t * 0.8);
        ambientIntensity = 0.5 - (t * 0.2);
    } else { // Noite
        skyColor = new THREE.Color(0x000011);
        sunIntensity = 0.1; // Luz da lua
        ambientIntensity = 0.2;
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
    updatePlayer();

    renderer.render(scene, camera);
}

animate();
