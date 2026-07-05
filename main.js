import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// --- CONFIGURAÇÃO INICIAL ---
const scene = new THREE.Scene();

// --- ESTADO GLOBAL / CONFIGURAÇÕES ---
let settings = {
    time: {
        useRealTime: false,
        timeOfDay: 12.0,
        timeSpeed: 0.1,
        frozen: false, // Nova opção: Congelar tempo
        colors: {
            midnight: new THREE.Color(0x020205),
            dawn: new THREE.Color(0xffa07a),
            noon: new THREE.Color(0x87ceeb),
            sunset: new THREE.Color(0xff4500)
        }
    },
    camera: {
        mode: 'isometric', // isometric, thirdperson, firstperson, free
        fov: 75,
        distance: 12,
        height: 12,
        verticalOffset: 1.5
    },
    terrain: {
        size: 50,
        quality: 40,
        triangulated: true,
        waterLevel: 1.5,
        grassLevel: 2.0,
        colors: {
            sea: new THREE.Color(0x1a3d59),
            dirt: new THREE.Color(0x7b4a1b),
            grass: new THREE.Color(0x2a4a30)
        }
    },
    water: {
        speed: 0.4, // Reduzido por padrão
        intensity: 0.15, // Reduzido por padrão
        opacity: 0.7
    }
};

// --- ELEMENTOS UI ---
const elements = {
    settingsToggle: document.getElementById('settings-toggle'),
    settingsMenu: document.getElementById('settings-menu'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Ambiente
    realTimeToggle: document.getElementById('real-time-toggle'),
    timeFreezeToggle: document.getElementById('time-freeze-toggle'),
    timeDisplay: document.getElementById('time-display'),
    timeSlider: document.getElementById('time-slider'),
    timeSpeedSlider: document.getElementById('time-speed'),
    manualTimeControls: document.getElementById('manual-time-controls'),
    colorMidnight: document.getElementById('color-midnight'),
    colorDawn: document.getElementById('color-dawn'),
    colorNoon: document.getElementById('color-noon'),
    colorSunset: document.getElementById('color-sunset'),

    // Câmera
    cameraModeSelect: document.getElementById('camera-mode'),
    cameraDistance: document.getElementById('camera-distance'),
    cameraHeight: document.getElementById('camera-height'),
    cameraVOffset: document.getElementById('camera-v-offset'),

    // Terreno
    terrainSize: document.getElementById('terrain-size'),
    terrainQuality: document.getElementById('terrain-quality'),
    terrainTriangulate: document.getElementById('terrain-triangulate'),
    waterLevel: document.getElementById('water-level'),
    grassLevel: document.getElementById('grass-level'),
    colorSea: document.getElementById('color-sea'),
    colorDirt: document.getElementById('color-dirt'),
    colorGrass: document.getElementById('color-grass'),

    // Água
    waterSpeed: document.getElementById('water-speed'),
    waterIntensity: document.getElementById('water-intensity'),
    waterOpacity: document.getElementById('water-opacity'),

    // HUD
    countWood: document.getElementById('count-wood'),
    countStone: document.getElementById('count-stone'),

    // Presets
    btnSavePreset: document.getElementById('btn-save-preset'),
    btnLoadPreset: document.getElementById('btn-load-preset'),
    btnResetDefaults: document.getElementById('btn-reset-defaults'),
    btnExportJSON: document.getElementById('btn-export-json'),
    btnImportJSON: document.getElementById('btn-import-json'),
    importJSONArea: document.getElementById('import-json-area')
};

// --- LÓGICA DE UI ---
elements.settingsToggle.addEventListener('click', () => {
    elements.settingsMenu.classList.toggle('open');
});

elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.tabButtons.forEach(b => b.classList.remove('active'));
        elements.tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// Listeners de Ambiente
elements.realTimeToggle.addEventListener('change', (e) => {
    settings.time.useRealTime = e.target.checked;
    elements.manualTimeControls.style.display = settings.time.useRealTime ? 'none' : 'block';
});

elements.timeFreezeToggle.addEventListener('change', (e) => {
    settings.time.frozen = e.target.checked;
});

elements.timeSlider.addEventListener('input', (e) => {
    settings.time.timeOfDay = parseFloat(e.target.value);
});

elements.timeSpeedSlider.addEventListener('input', (e) => {
    settings.time.timeSpeed = parseFloat(e.target.value);
});

const updateColorSetting = (category, key, hex) => {
    settings[category].colors[key].set(hex);
};

elements.colorMidnight.addEventListener('input', (e) => updateColorSetting('time', 'midnight', e.target.value));
elements.colorDawn.addEventListener('input', (e) => updateColorSetting('time', 'dawn', e.target.value));
elements.colorNoon.addEventListener('input', (e) => updateColorSetting('time', 'noon', e.target.value));
elements.colorSunset.addEventListener('input', (e) => updateColorSetting('time', 'sunset', e.target.value));

// Listeners de Câmera
elements.cameraModeSelect.addEventListener('change', (e) => {
    settings.camera.mode = e.target.value;
    if (e.target.value === 'firstperson') {
        camera.fov = 90;
    } else {
        camera.fov = settings.camera.fov;
    }
    camera.updateProjectionMatrix();
});

elements.cameraDistance.addEventListener('input', (e) => settings.camera.distance = parseFloat(e.target.value));
elements.cameraHeight.addEventListener('input', (e) => settings.camera.height = parseFloat(e.target.value));
elements.cameraVOffset.addEventListener('input', (e) => settings.camera.verticalOffset = parseFloat(e.target.value));

// Terreno Listeners
elements.terrainSize.addEventListener('change', (e) => {
    settings.terrain.size = parseInt(e.target.value);
    regenerateTerrain();
});

elements.terrainQuality.addEventListener('change', (e) => {
    settings.terrain.quality = parseInt(e.target.value);
    regenerateTerrain();
});

elements.terrainTriangulate.addEventListener('change', (e) => {
    settings.terrain.triangulated = e.target.checked;
    floorMaterial.flatShading = settings.terrain.triangulated;
    floorMaterial.needsUpdate = true;
});

elements.waterLevel.addEventListener('input', (e) => {
    settings.terrain.waterLevel = parseFloat(e.target.value);
    updateTerrainVisuals();
});

elements.grassLevel.addEventListener('input', (e) => {
    settings.terrain.grassLevel = parseFloat(e.target.value);
    updateTerrainVisuals();
});

elements.colorSea.addEventListener('input', (e) => {
    settings.terrain.colors.sea.set(e.target.value);
    updateTerrainVisuals();
});

elements.colorDirt.addEventListener('input', (e) => {
    settings.terrain.colors.dirt.set(e.target.value);
    updateTerrainVisuals();
});

elements.colorGrass.addEventListener('input', (e) => {
    settings.terrain.colors.grass.set(e.target.value);
    updateTerrainVisuals();
});

// Água Listeners
elements.waterSpeed.addEventListener('input', (e) => settings.water.speed = parseFloat(e.target.value));
elements.waterIntensity.addEventListener('input', (e) => settings.water.intensity = parseFloat(e.target.value));
elements.waterOpacity.addEventListener('input', (e) => {
    settings.water.opacity = parseFloat(e.target.value);
    waterMaterial.opacity = settings.water.opacity;
});

// --- CÂMERA ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 20, 20);

// --- RENDERIZADOR ---
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game-canvas'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// --- ILUMINAÇÃO E ATMOSFERA ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const fog = new THREE.FogExp2(0x000000, 0.015);
scene.fog = fog;

const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(5, 10, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -50;
sunLight.shadow.camera.right = 50;
sunLight.shadow.camera.top = 50;
sunLight.shadow.camera.bottom = -50;
scene.add(sunLight);

// --- TERRENO ---
let floorGeometry, floorMaterial, floor;
let waterGeometry, waterMaterial, water;

floorMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: settings.terrain.triangulated
});

waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x0077be,
    transparent: true,
    opacity: settings.water.opacity,
    flatShading: true
});

function initTerrain() {
    const { size, quality } = settings.terrain;

    if (floor) {
        scene.remove(floor);
        floor.geometry.dispose();
    }
    if (water) {
        scene.remove(water);
        water.geometry.dispose();
    }
    const oldSky = scene.getObjectByName("skydome");
    if (oldSky) {
        scene.remove(oldSky);
        oldSky.geometry.dispose();
    }

    floorGeometry = new THREE.PlaneGeometry(size, size, quality, quality);
    const vertices = floorGeometry.attributes.position.array;

    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const dx = (x / (size / 2));
        const dy = (y / (size / 2));
        const dist = Math.sqrt(dx * dx + dy * dy);
        const edgeFactor = Math.max(0, 1 - Math.pow(dist, 4));
        let height = (Math.sin(x * 0.2) + Math.cos(y * 0.2)) * 2;
        height += (Math.sin(x * 0.5) * Math.cos(y * 0.5)) * 1;
        vertices[i + 2] = height * edgeFactor - (1 - edgeFactor) * 2;
    }

    floorGeometry.computeVertexNormals();
    floorGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(floorGeometry.attributes.position.count * 3), 3));

    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    waterGeometry = new THREE.CircleGeometry(size * 4, 32);
    water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.receiveShadow = true;
    scene.add(water);

    const skyGeo = new THREE.SphereGeometry(size * 5, 32, 15);
    const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, opacity: 0.8 });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.name = "skydome";
    scene.add(sky);

    updateTerrainVisuals();
}

function updateTerrainVisuals() {
    if (!floorGeometry) return;
    const vertices = floorGeometry.attributes.position.array;
    const colors = floorGeometry.attributes.color.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const height = vertices[i + 2];
        let color;
        if (height < settings.terrain.waterLevel) color = settings.terrain.colors.sea;
        else if (height < settings.terrain.grassLevel) color = settings.terrain.colors.dirt;
        else color = settings.terrain.colors.grass;
        colors[i] = color.r;
        colors[i+1] = color.g;
        colors[i+2] = color.b;
    }
    floorGeometry.attributes.color.needsUpdate = true;
    water.position.y = settings.terrain.waterLevel;
}

// --- RECURSOS E INVENTÁRIO ---
const resources = [];
const inventory = { wood: 0, stone: 0 };
function updateHUD() {
    elements.countWood.innerText = inventory.wood;
    elements.countStone.innerText = inventory.stone;
}

function spawnResources() {
    resources.forEach(res => scene.remove(res));
    resources.length = 0;
    const { size, grassLevel } = settings.terrain;
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * size;
        const z = (Math.random() - 0.5) * size;
        const height = getTerrainHeight(x, z);
        if (height >= grassLevel) {
            const type = Math.random() > 0.3 ? 'tree' : 'rock';
            const res = type === 'tree' ? createTreeMesh() : createRockMesh();
            res.position.set(x, height, z);
            res.userData = { type, health: 3 };
            scene.add(res);
            resources.push(res);
        }
    }
}

function getTerrainHeight(x, z) {
    if (!floorGeometry) return 0;
    const size = settings.terrain.size;
    const quality = settings.terrain.quality;
    const col = Math.round(((x / size) + 0.5) * quality);
    const row = Math.round(((z / size) + 0.5) * quality);
    const index = (row * (quality + 1) + col) * 3;
    return floorGeometry.attributes.position.array[index + 2] || 0;
}

function createTreeMesh() {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1, 6), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
    trunk.position.y = 0.5;
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 6), new THREE.MeshStandardMaterial({ color: 0x2e7d32, flatShading: true }));
    leaves.position.y = 1.8;
    group.add(trunk, leaves);
    group.traverse(c => { if(c.isMesh) c.castShadow = true; });
    return group;
}

function createRockMesh() {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x757575, flatShading: true }));
    rock.position.y = 0.2;
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    return rock;
}

function tryHarvest() {
    if (settings.camera.mode === 'free') return;
    let closest = null; let minDist = 2.5;
    resources.forEach(res => {
        const dist = playerGroup.position.distanceTo(res.position);
        if (dist < minDist) { minDist = dist; closest = res; }
    });
    if (closest) {
        playerGroup.lookAt(closest.position.x, playerGroup.position.y, closest.position.z);
        const actionName = animations['punch'] ? 'punch' : (animations['jump'] ? 'jump' : 'idle');
        fadeToAction(actionName, 0.1);
        setTimeout(() => {
            closest.userData.health -= 1;
            closest.position.x += (Math.random() - 0.5) * 0.2;
            closest.position.z += (Math.random() - 0.5) * 0.2;
            if (closest.userData.health <= 0) {
                if (closest.userData.type === 'tree') inventory.wood += 5;
                else inventory.stone += 5;
                scene.remove(closest);
                resources.splice(resources.indexOf(closest), 1);
                updateHUD();
            }
            setTimeout(() => fadeToAction('idle'), 500);
        }, 300);
    }
}

function regenerateTerrain() { initTerrain(); spawnResources(); }
initTerrain(); spawnResources();

// --- PERSONAGEM ---
let mixer = null; let animations = {}; let currentAction = null;
const playerGroup = new THREE.Group();
playerGroup.position.y = 5;
scene.add(playerGroup);

const playerPlaceholder = new THREE.Group();
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1, 4, 8), new THREE.MeshStandardMaterial({ color: 0xff4444 }));
body.position.y = 0.9;
const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
head.position.y = 1.6;
playerPlaceholder.add(body, head);
playerPlaceholder.traverse(child => { if(child.isMesh) child.castShadow = true; });
playerGroup.add(playerPlaceholder);

const loader = new GLTFLoader();
loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb', (gltf) => {
    playerGroup.remove(playerPlaceholder);
    const model = gltf.scene;
    model.scale.set(0.4, 0.4, 0.4);
    model.traverse(child => { if(child.isMesh) child.castShadow = true; });
    playerGroup.add(model);
    mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach(clip => { animations[clip.name.toLowerCase()] = mixer.clipAction(clip); });
    fadeToAction('idle');
});

function fadeToAction(name, duration = 0.2) {
    if (!animations[name] || currentAction === animations[name]) return;
    if (currentAction) currentAction.fadeOut(duration);
    currentAction = animations[name];
    currentAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
}

// --- CONTROLES ---
const keys = {};
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    if (key === ' ' || key === 'f') tryHarvest();
});
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

let cameraRotation = { x: -Math.PI / 4, y: Math.PI / 4 };
let isRightMouseDown = false;
window.addEventListener('mousedown', (e) => { if (e.button === 2) isRightMouseDown = true; });
window.addEventListener('mouseup', (e) => { if (e.button === 2) isRightMouseDown = false; });
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('mousemove', (e) => {
    const isControlMode = isRightMouseDown || settings.camera.mode === 'firstperson' || settings.camera.mode === 'thirdperson' || settings.camera.mode === 'free';
    if (isControlMode) {
        cameraRotation.y += e.movementX * 0.005; // Ajustado para rotação natural
        cameraRotation.x -= e.movementY * 0.005;
        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));
    }
});

let playerVelocity = new THREE.Vector3();
const ACCELERATION = 0.02;
const FRICTION = 0.85;

function updateMovement(delta) {
    const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
    const isMoving = moveX !== 0 || moveZ !== 0;

    if (settings.camera.mode !== 'free') {
        if (isMoving) {
            // W deve mover sempre "para frente" em relação à visão da câmera
            // Se a câmera está em +Y_rot, W (para frente) deve ser no ângulo oposto (Y_rot + PI)
            const angleOffset = Math.atan2(moveX, moveZ);
            const targetAngle = angleOffset + cameraRotation.y;

            const currentRot = playerGroup.rotation.y;
            let diff = targetAngle - currentRot;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            playerGroup.rotation.y += diff * 0.15;

            // Converter ângulo em vetor de movimento (ajustado para sin/cos padrão)
            playerVelocity.x += Math.sin(targetAngle) * ACCELERATION;
            playerVelocity.z += Math.cos(targetAngle) * ACCELERATION;
            fadeToAction('walking' || 'walk');
        } else {
            fadeToAction('idle');
        }
        playerVelocity.multiplyScalar(FRICTION);

        const isAction = currentAction && (currentAction.getClip().name.toLowerCase().includes('punch') || currentAction.getClip().name.toLowerCase().includes('jump'));
        if (!isAction) playerGroup.position.add(playerVelocity);

        const h = getTerrainHeight(playerGroup.position.x, playerGroup.position.z);
        playerGroup.position.y = THREE.MathUtils.lerp(playerGroup.position.y, Math.max(settings.terrain.waterLevel, h), 0.2);
    }

    // Lógica da Câmera
    const pPos = playerGroup.position;
    const camSet = settings.camera;

    // Rotação por setas (Requisito Builder/Free e outros modos orbitais)
    if (keys.arrowleft) cameraRotation.y += 0.03;
    if (keys.arrowright) cameraRotation.y -= 0.03;
    if (keys.arrowup) cameraRotation.x += 0.03;
    if (keys.arrowdown) cameraRotation.x -= 0.03;
    cameraRotation.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, cameraRotation.x));

    switch (camSet.mode) {
        case 'isometric':
            const isoX = pPos.x + Math.sin(cameraRotation.y) * camSet.distance;
            const isoZ = pPos.z + Math.cos(cameraRotation.y) * camSet.distance;
            camera.position.lerp(new THREE.Vector3(isoX, pPos.y + camSet.height, isoZ), 0.1);
            camera.lookAt(pPos.x, pPos.y, pPos.z);
            break;
        case 'thirdperson':
            const orbitDist = camSet.distance;
            const camX = pPos.x + Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x) * orbitDist;
            const camY = pPos.y + camSet.verticalOffset + Math.sin(cameraRotation.x) * orbitDist;
            const camZ = pPos.z + Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x) * orbitDist;
            camera.position.lerp(new THREE.Vector3(camX, Math.max(camY, pPos.y + 0.5), camZ), 0.1);
            camera.lookAt(pPos.x, pPos.y + camSet.verticalOffset, pPos.z);
            break;
        case 'firstperson':
            camera.position.copy(pPos);
            camera.position.y += 1.6;
            camera.rotation.set(cameraRotation.x, cameraRotation.y, 0, 'YXZ');
            // No modo 1ª pessoa, o corpo gira com a câmera se estiver andando
            if (isMoving) playerGroup.rotation.y = cameraRotation.y;
            break;
        case 'free':
            const f_moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
            const f_moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
            const f_moveY = (keys.q || keys.pageup ? 1 : 0) - (keys.e || keys.pagedown ? 1 : 0);
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
            forward.y = 0; right.y = 0; forward.normalize(); right.normalize();
            camera.position.add(forward.multiplyScalar(-f_moveZ * 0.4));
            camera.position.add(right.multiplyScalar(f_moveX * 0.4));
            camera.position.y += f_moveY * 0.4;
            camera.rotation.set(cameraRotation.x, cameraRotation.y, 0, 'YXZ');
            break;
    }
}

// --- AMBIENTE E ANIMAÇÃO ---
function updateEnvironment(time) {
    if (!settings.time.frozen) {
        if (settings.time.useRealTime) {
            const now = new Date();
            settings.time.timeOfDay = now.getUTCHours() + (now.getUTCMinutes() / 60) + (now.getUTCSeconds() / 3600);
        } else {
            settings.time.timeOfDay = (settings.time.timeOfDay + (0.005 * settings.time.timeSpeed)) % 24;
        }
    }
    const hours = Math.floor(settings.time.timeOfDay);
    const minutes = Math.floor((settings.time.timeOfDay % 1) * 60);
    let period = "";
    if (hours >= 5 && hours < 8) period = " (Alvorada)";
    else if (hours >= 8 && hours < 17) period = " (Meio-Dia)";
    else if (hours >= 17 && hours < 20) period = " (Entardecer)";
    else period = " (Meia-Noite)";

    elements.timeDisplay.innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}${period}`;
    elements.timeSlider.value = settings.time.timeOfDay;
    const angle = ((settings.time.timeOfDay - 6) / 24) * Math.PI * 2;
    sunLight.position.set(Math.cos(angle) * 40, Math.sin(angle) * 40, 20);
    let skyColor; const t = settings.time.timeOfDay; const c = settings.time.colors;
    if (t >= 5 && t < 8) skyColor = c.midnight.clone().lerp(c.dawn, (t - 5) / 3);
    else if (t >= 8 && t < 17) skyColor = c.dawn.clone().lerp(c.noon, (t - 8) / 9);
    else if (t >= 17 && t < 20) skyColor = c.noon.clone().lerp(c.sunset, (t - 17) / 3);
    else if (t >= 20 && t < 23) skyColor = c.sunset.clone().lerp(c.midnight, (t - 20) / 3);
    else skyColor = c.midnight;
    scene.background = skyColor;
    if (scene.fog) scene.fog.color.copy(skyColor);
    const skydome = scene.getObjectByName("skydome");
    if (skydome) skydome.material.color.copy(skyColor);
    sunLight.intensity = (t > 5 && t < 20) ? 1 : 0;
    ambientLight.intensity = (t > 5 && t < 20) ? 0.5 : 0.2;

    if (water) {
        const waterVertices = waterGeometry.attributes.position.array;
        const timeScale = time * 0.001 * settings.water.speed;
        for (let i = 0; i < waterVertices.length; i += 3) {
            const x = waterVertices[i]; const y = waterVertices[i + 1];
            waterVertices[i + 2] = Math.sin(x * 0.5 + timeScale) * Math.cos(y * 0.5 + timeScale) * settings.water.intensity;
        }
        waterGeometry.attributes.position.needsUpdate = true;
    }
}

// --- PRESETS ---
function getPresetObject() {
    const p = JSON.parse(JSON.stringify(settings));
    p.time.colors = { midnight: settings.time.colors.midnight.getHexString(), dawn: settings.time.colors.dawn.getHexString(), noon: settings.time.colors.noon.getHexString(), sunset: settings.time.colors.sunset.getHexString() };
    p.terrain.colors = { sea: settings.terrain.colors.sea.getHexString(), dirt: settings.terrain.colors.dirt.getHexString(), grass: settings.terrain.colors.grass.getHexString() };
    return p;
}
function applyPreset(p) {
    settings.time.useRealTime = p.time.useRealTime; settings.time.timeOfDay = p.time.timeOfDay; settings.time.timeSpeed = p.time.timeSpeed; settings.time.frozen = !!p.time.frozen;
    settings.time.colors.midnight.set('#' + p.time.colors.midnight); settings.time.colors.dawn.set('#' + p.time.colors.dawn); settings.time.colors.noon.set('#' + p.time.colors.noon); settings.time.colors.sunset.set('#' + p.time.colors.sunset);
    settings.terrain.size = p.terrain.size; settings.terrain.quality = p.terrain.quality; settings.terrain.waterLevel = p.terrain.waterLevel; settings.terrain.grassLevel = p.terrain.grassLevel;
    settings.terrain.colors.sea.set('#' + p.terrain.colors.sea); settings.terrain.colors.dirt.set('#' + p.terrain.colors.dirt); settings.terrain.colors.grass.set('#' + p.terrain.colors.grass);
    settings.water.speed = p.water.speed; settings.water.intensity = p.water.intensity; settings.water.opacity = p.water.opacity;
    if (p.camera) { settings.camera.mode = p.camera.mode; settings.camera.distance = p.camera.distance; settings.camera.height = p.camera.height; settings.camera.verticalOffset = p.camera.verticalOffset; }
    syncUI(); regenerateTerrain();
}
function syncUI() {
    elements.realTimeToggle.checked = settings.time.useRealTime; elements.timeFreezeToggle.checked = settings.time.frozen; elements.timeSlider.value = settings.time.timeOfDay; elements.timeSpeedSlider.value = settings.time.timeSpeed;
    elements.manualTimeControls.style.display = settings.time.useRealTime ? 'none' : 'block';
    elements.colorMidnight.value = '#' + settings.time.colors.midnight.getHexString(); elements.colorDawn.value = '#' + settings.time.colors.dawn.getHexString(); elements.colorNoon.value = '#' + settings.time.colors.noon.getHexString(); elements.colorSunset.value = '#' + settings.time.colors.sunset.getHexString();
    elements.terrainSize.value = settings.terrain.size; elements.terrainQuality.value = settings.terrain.quality; elements.waterLevel.value = settings.terrain.waterLevel; elements.grassLevel.value = settings.terrain.grassLevel;
    elements.colorSea.value = '#' + settings.terrain.colors.sea.getHexString(); elements.colorDirt.value = '#' + settings.terrain.colors.dirt.getHexString(); elements.colorGrass.value = '#' + settings.terrain.colors.grass.getHexString();
    elements.waterSpeed.value = settings.water.speed; elements.waterIntensity.value = settings.water.intensity; elements.waterOpacity.value = settings.water.opacity;
    elements.cameraModeSelect.value = settings.camera.mode; elements.cameraDistance.value = settings.camera.distance; elements.cameraHeight.value = settings.camera.height; elements.cameraVOffset.value = settings.camera.verticalOffset;
    elements.manualTimeControls.style.display = settings.time.useRealTime ? 'none' : 'block';
}
elements.btnSavePreset.addEventListener('click', () => { localStorage.setItem('rpg_preset_v1', JSON.stringify(getPresetObject())); alert('Salvo!'); });
elements.btnLoadPreset.addEventListener('click', () => { const d = localStorage.getItem('rpg_preset_v1'); if (d) applyPreset(JSON.parse(d)); });
elements.btnExportJSON.addEventListener('click', () => { navigator.clipboard.writeText(JSON.stringify(getPresetObject(), null, 4)); alert('Copiado!'); });
elements.btnImportJSON.addEventListener('click', () => { try { applyPreset(JSON.parse(elements.importJSONArea.value)); alert('Importado!'); } catch (e) { alert('Erro: ' + e.message); } });
elements.btnResetDefaults.addEventListener('click', () => { if(confirm('Resetar?')) { localStorage.removeItem('rpg_preset_v1'); window.location.reload(); } });

const clock = new THREE.Clock();
function animate(time) {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    updateEnvironment(time);
    updateMovement(delta);
    renderer.render(scene, camera);
}
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
animate(0);
