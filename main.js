import * as THREE from 'three';

// --- CONFIGURAÇÃO INICIAL ---
const scene = new THREE.Scene();

// --- ESTADO GLOBAL / CONFIGURAÇÕES ---
let settings = {
    time: {
        useRealTime: true,
        timeOfDay: 12,
        timeSpeed: 1.0,
        colors: {
            midnight: new THREE.Color(0x020205),
            dawn: new THREE.Color(0xffa07a),
            noon: new THREE.Color(0x87ceeb),
            sunset: new THREE.Color(0xff4500)
        }
    },
    camera: {
        mode: 'follow'
    },
    terrain: {
        size: 50,
        quality: 40,
        triangulated: true,
        waterLevel: 1.5,
        grassLevel: 2.0,
        colors: {
            sea: new THREE.Color(0x2a4d69),
            dirt: new THREE.Color(0x8b5a2b),
            grass: new THREE.Color(0x3a5a40)
        }
    },
    water: {
        speed: 1.0,
        intensity: 0.5,
        opacity: 0.6
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

    // Presets
    btnSavePreset: document.getElementById('btn-save-preset'),
    btnLoadPreset: document.getElementById('btn-load-preset'),
    btnResetDefaults: document.getElementById('btn-reset-defaults')
};

// --- LÓGICA DE UI (TABS E TOGGLES) ---
elements.settingsToggle.addEventListener('click', () => {
    elements.settingsMenu.style.display = elements.settingsMenu.style.display === 'block' ? 'none' : 'block';
});

elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        elements.tabButtons.forEach(b => b.classList.remove('active'));
        elements.tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// --- LISTENERS DE CONFIGURAÇÃO ---
elements.realTimeToggle.addEventListener('change', (e) => {
    settings.time.useRealTime = e.target.checked;
    elements.manualTimeControls.style.display = settings.time.useRealTime ? 'none' : 'block';
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

elements.cameraModeSelect.addEventListener('change', (e) => {
    settings.camera.mode = e.target.value;
});

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

// --- ILUMINAÇÃO ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(5, 10, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048; // Melhor qualidade de sombra
sunLight.shadow.mapSize.height = 2048;
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

    floorGeometry = new THREE.PlaneGeometry(size, size, quality, quality);
    const vertices = floorGeometry.attributes.position.array;

    // Aplicar Relevo com Borda Grampeada (Border Clamping)
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];

        // Calcular distância do centro para grampear as bordas
        // Normalizado de 0 (centro) a 1 (borda)
        const dx = (x / (size / 2));
        const dy = (y / (size / 2));
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Fator de borda: 1 no centro, 0 na borda
        const edgeFactor = Math.max(0, 1 - Math.pow(dist, 4));

        // Ruído/Seno
        let height = (Math.sin(x * 0.2) + Math.cos(y * 0.2)) * 2;
        height += (Math.sin(x * 0.5) * Math.cos(y * 0.5)) * 1;

        // Aplicar grampo de borda (forçar para baixo do nível da água)
        vertices[i + 2] = height * edgeFactor - (1 - edgeFactor) * 2;
    }

    floorGeometry.computeVertexNormals();
    floorGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(floorGeometry.attributes.position.count * 3), 3));

    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    waterGeometry = new THREE.PlaneGeometry(size, size, quality, quality);
    water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.receiveShadow = true;
    scene.add(water);

    updateTerrainVisuals();
}

function updateTerrainVisuals() {
    if (!floorGeometry) return;

    const vertices = floorGeometry.attributes.position.array;
    const colors = floorGeometry.attributes.color.array;

    for (let i = 0; i < vertices.length; i += 3) {
        const height = vertices[i + 2];
        let color;

        if (height < settings.terrain.waterLevel) {
            color = settings.terrain.colors.sea;
        } else if (height < settings.terrain.grassLevel) {
            color = settings.terrain.colors.dirt;
        } else {
            color = settings.terrain.colors.grass;
        }

        colors[i] = color.r;
        colors[i+1] = color.g;
        colors[i+2] = color.b;
    }

    floorGeometry.attributes.color.needsUpdate = true;
    water.position.y = settings.terrain.waterLevel;
}

function regenerateTerrain() {
    initTerrain();
}

initTerrain();

// --- ELEMENTOS DO MUNDO (JOGADOR) ---
const player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
player.position.y = 5; // Começar alto para não cair do mapa
player.castShadow = true;
scene.add(player);

// --- CONTROLES ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

const playerSpeed = 0.2;
const cameraSpeed = 0.4;
let cameraRotation = { x: -Math.PI / 4, y: Math.PI / 4 };
let isRightMouseDown = false;

window.addEventListener('mousedown', (e) => { if (e.button === 2) isRightMouseDown = true; });
window.addEventListener('mouseup', (e) => { if (e.button === 2) isRightMouseDown = false; });
window.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('mousemove', (e) => {
    if (isRightMouseDown && settings.camera.mode === 'free') {
        cameraRotation.y -= e.movementX * 0.005;
        cameraRotation.x -= e.movementY * 0.005;
        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));
    }
});

function updateMovement() {
    if (settings.camera.mode === 'follow') {
        const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
        const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
        if (moveX !== 0 || moveZ !== 0) {
            const angle = Math.atan2(moveX, moveZ);
            player.position.x += Math.sin(angle) * playerSpeed;
            player.position.z += Math.cos(angle) * playerSpeed;
            player.rotation.y = angle;
        }
        // Raycast simples para altura do terreno (placeholder)
        player.position.y = 1.5;

        camera.position.lerp(new THREE.Vector3(player.position.x + 15, player.position.y + 15, player.position.z + 15), 0.05);
        camera.lookAt(player.position);
    } else {
        const moveX = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
        const moveZ = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
        const moveY = (keys.q || keys.pageup ? 1 : 0) - (keys.e || keys.pagedown ? 1 : 0);

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        forward.y = 0; right.y = 0;
        forward.normalize(); right.normalize();

        camera.position.add(forward.multiplyScalar(-moveZ * cameraSpeed));
        camera.position.add(right.multiplyScalar(moveX * cameraSpeed));
        camera.position.y += moveY * cameraSpeed;

        if (keys.arrowleft) cameraRotation.y += 0.03;
        if (keys.arrowright) cameraRotation.y -= 0.03;
        if (keys.arrowup) cameraRotation.x += 0.03;
        if (keys.arrowdown) cameraRotation.x -= 0.03;

        camera.rotation.order = 'YXZ';
        camera.rotation.set(cameraRotation.x, cameraRotation.y, 0);
    }
}

// --- AMBIENTE E ANIMAÇÃO ---
function updateEnvironment(time) {
    if (settings.time.useRealTime) {
        const now = new Date();
        settings.time.timeOfDay = now.getUTCHours() + (now.getUTCMinutes() / 60) + (now.getUTCSeconds() / 3600);
    } else {
        settings.time.timeOfDay = (settings.time.timeOfDay + (0.005 * settings.time.timeSpeed)) % 24;
    }

    elements.timeDisplay.innerText = `${Math.floor(settings.time.timeOfDay).toString().padStart(2, '0')}:${Math.floor((settings.time.timeOfDay % 1) * 60).toString().padStart(2, '0')}`;
    elements.timeSlider.value = settings.time.timeOfDay;

    const angle = ((settings.time.timeOfDay - 6) / 24) * Math.PI * 2;
    sunLight.position.set(Math.cos(angle) * 40, Math.sin(angle) * 40, 20);

    // Interpolação de cores
    let skyColor, sunInt, ambInt;
    const t = settings.time.timeOfDay;
    const c = settings.time.colors;

    if (t >= 5 && t < 8) { // Dawn
        const f = (t - 5) / 3;
        skyColor = c.midnight.clone().lerp(c.dawn, f);
        sunInt = f; ambInt = 0.2 + f * 0.3;
    } else if (t >= 8 && t < 17) { // Noon
        const f = (t - 8) / 9;
        skyColor = c.dawn.clone().lerp(c.noon, f);
        sunInt = 1; ambInt = 0.5;
    } else if (t >= 17 && t < 20) { // Sunset
        const f = (t - 17) / 3;
        skyColor = c.noon.clone().lerp(c.sunset, f);
        sunInt = 1 - f; ambInt = 0.5 - f * 0.3;
    } else { // Night
        skyColor = c.midnight;
        sunInt = 0; ambInt = 0.2;
    }

    scene.background = skyColor;
    sunLight.intensity = sunInt;
    ambientLight.intensity = ambInt;

    // Animar Água (Ondas simples)
    if (water) {
        const waterVertices = waterGeometry.attributes.position.array;
        const timeScale = time * 0.001 * settings.water.speed;
        for (let i = 0; i < waterVertices.length; i += 3) {
            const x = waterVertices[i];
            const y = waterVertices[i + 1];
            waterVertices[i + 2] = Math.sin(x * 0.5 + timeScale) * Math.cos(y * 0.5 + timeScale) * settings.water.intensity;
        }
        waterGeometry.attributes.position.needsUpdate = true;
    }
}

// --- PRESETS ---
function savePreset() {
    const preset = JSON.parse(JSON.stringify(settings));
    // Converter cores para Hex para salvar
    preset.time.colors = {
        midnight: settings.time.colors.midnight.getHexString(),
        dawn: settings.time.colors.dawn.getHexString(),
        noon: settings.time.colors.noon.getHexString(),
        sunset: settings.time.colors.sunset.getHexString()
    };
    preset.terrain.colors = {
        sea: settings.terrain.colors.sea.getHexString(),
        dirt: settings.terrain.colors.dirt.getHexString(),
        grass: settings.terrain.colors.grass.getHexString()
    };
    localStorage.setItem('rpg_preset_v1', JSON.stringify(preset));
    alert('Configurações salvas!');
}

function loadPreset() {
    const data = localStorage.getItem('rpg_preset_v1');
    if (!data) return alert('Nenhum preset encontrado.');
    const preset = JSON.parse(data);

    // Restaurar Settings
    settings.time.useRealTime = preset.time.useRealTime;
    settings.time.timeOfDay = preset.time.timeOfDay;
    settings.time.timeSpeed = preset.time.timeSpeed;
    settings.time.colors.midnight.set('#' + preset.time.colors.midnight);
    settings.time.colors.dawn.set('#' + preset.time.colors.dawn);
    settings.time.colors.noon.set('#' + preset.time.colors.noon);
    settings.time.colors.sunset.set('#' + preset.time.colors.sunset);

    settings.terrain.size = preset.terrain.size;
    settings.terrain.quality = preset.terrain.quality;
    settings.terrain.waterLevel = preset.terrain.waterLevel;
    settings.terrain.grassLevel = preset.terrain.grassLevel;
    settings.terrain.colors.sea.set('#' + preset.terrain.colors.sea);
    settings.terrain.colors.dirt.set('#' + preset.terrain.colors.dirt);
    settings.terrain.colors.grass.set('#' + preset.terrain.colors.grass);

    settings.water.speed = preset.water.speed;
    settings.water.intensity = preset.water.intensity;
    settings.water.opacity = preset.water.opacity;

    // Atualizar UI
    syncUI();
    regenerateTerrain();
}

function syncUI() {
    elements.realTimeToggle.checked = settings.time.useRealTime;
    elements.timeSlider.value = settings.time.timeOfDay;
    elements.timeSpeedSlider.value = settings.time.timeSpeed;
    elements.colorMidnight.value = '#' + settings.time.colors.midnight.getHexString();
    elements.colorDawn.value = '#' + settings.time.colors.dawn.getHexString();
    elements.colorNoon.value = '#' + settings.time.colors.noon.getHexString();
    elements.colorSunset.value = '#' + settings.time.colors.sunset.getHexString();

    elements.terrainSize.value = settings.terrain.size;
    elements.terrainQuality.value = settings.terrain.quality;
    elements.waterLevel.value = settings.terrain.waterLevel;
    elements.grassLevel.value = settings.terrain.grassLevel;
    elements.colorSea.value = '#' + settings.terrain.colors.sea.getHexString();
    elements.colorDirt.value = '#' + settings.terrain.colors.dirt.getHexString();
    elements.colorGrass.value = '#' + settings.terrain.colors.grass.getHexString();

    elements.waterSpeed.value = settings.water.speed;
    elements.waterIntensity.value = settings.water.intensity;
    elements.waterOpacity.value = settings.water.opacity;

    elements.manualTimeControls.style.display = settings.time.useRealTime ? 'none' : 'block';
}

elements.btnSavePreset.addEventListener('click', savePreset);
elements.btnLoadPreset.addEventListener('click', loadPreset);
elements.btnResetDefaults.addEventListener('click', () => {
    if(confirm('Resetar todas as configurações?')) {
        localStorage.removeItem('rpg_preset_v1');
        window.location.reload();
    }
});

// Loop principal
function animate(time) {
    requestAnimationFrame(animate);
    updateEnvironment(time);
    updateMovement();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate(0);
