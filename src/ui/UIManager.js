import { Settings } from '../core/Settings.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {
            settingsToggle: document.getElementById('settings-toggle'),
            settingsMenu: document.getElementById('settings-menu'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            timeDisplay: document.getElementById('time-display'),
            timeSlider: document.getElementById('time-slider'),
            realTimeToggle: document.getElementById('real-time-toggle'),
            timeFreezeToggle: document.getElementById('time-freeze-toggle'),
            timeSpeed: document.getElementById('time-speed'),
            cameraMode: document.getElementById('camera-mode'),
            cameraDistance: document.getElementById('camera-distance'),
            cameraHeight: document.getElementById('camera-height'),
            cameraVOffset: document.getElementById('camera-v-offset'),
            terrainSize: document.getElementById('terrain-size'),
            terrainQuality: document.getElementById('terrain-quality'),
            terrainTriangulate: document.getElementById('terrain-triangulate'),
            waterLevel: document.getElementById('water-level'),
            grassLevel: document.getElementById('grass-level'),
            waterSpeed: document.getElementById('water-speed'),
            waterIntensity: document.getElementById('water-intensity'),
            waterOpacity: document.getElementById('water-opacity'),
            colorMidnight: document.getElementById('color-midnight'),
            colorDawn: document.getElementById('color-dawn'),
            colorNoon: document.getElementById('color-noon'),
            colorSunset: document.getElementById('color-sunset'),
            colorSea: document.getElementById('color-sea'),
            colorDirt: document.getElementById('color-dirt'),
            colorGrass: document.getElementById('color-grass'),
            btnSavePreset: document.getElementById('btn-save-preset'),
            btnLoadPreset: document.getElementById('btn-load-preset'),
            btnExportJSON: document.getElementById('btn-export-json'),
            btnImportJSON: document.getElementById('btn-import-json'),
            btnResetDefaults: document.getElementById('btn-reset-defaults'),
            importArea: document.getElementById('import-json-area'),
            woodCount: document.getElementById('count-wood'),
            stoneCount: document.getElementById('count-stone')
        };

        this.init();
    }

    init() {
        this.elements.settingsToggle.addEventListener('click', () => {
            this.elements.settingsMenu.classList.toggle('open');
        });

        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.tabButtons.forEach(b => b.classList.remove('active'));
                this.elements.tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });

        // Time
        this.elements.realTimeToggle.addEventListener('change', (e) => {
            Settings.time.useRealTime = e.target.checked;
            document.getElementById('manual-time-controls').style.display = e.target.checked ? 'none' : 'block';
        });
        this.elements.timeFreezeToggle.addEventListener('change', (e) => Settings.time.frozen = e.target.checked);
        this.elements.timeSlider.addEventListener('input', (e) => Settings.time.timeOfDay = parseFloat(e.target.value));
        this.elements.timeSpeed.addEventListener('input', (e) => Settings.time.timeSpeed = parseFloat(e.target.value));

        // Camera
        this.elements.cameraMode.addEventListener('change', (e) => Settings.camera.mode = e.target.value);
        this.elements.cameraDistance.addEventListener('input', (e) => Settings.camera.distance = parseFloat(e.target.value));
        this.elements.cameraHeight.addEventListener('input', (e) => Settings.camera.height = parseFloat(e.target.value));
        this.elements.cameraVOffset.addEventListener('input', (e) => Settings.camera.verticalOffset = parseFloat(e.target.value));

        // Terrain
        this.elements.terrainSize.addEventListener('change', (e) => {
            Settings.terrain.size = parseInt(e.target.value);
            this.game.terrain.init();
        });
        this.elements.terrainQuality.addEventListener('change', (e) => {
            Settings.terrain.quality = parseInt(e.target.value);
            this.game.terrain.init();
        });
        this.elements.terrainTriangulate.addEventListener('change', (e) => {
            Settings.terrain.triangulated = e.target.checked;
            this.game.terrain.updateVisuals();
        });
        this.elements.waterLevel.addEventListener('input', (e) => {
            Settings.terrain.waterLevel = parseFloat(e.target.value);
            this.game.terrain.updateVisuals();
        });
        this.elements.grassLevel.addEventListener('input', (e) => {
            Settings.terrain.grassLevel = parseFloat(e.target.value);
            this.game.terrain.updateVisuals();
        });

        // Water
        this.elements.waterSpeed.addEventListener('input', (e) => Settings.water.speed = parseFloat(e.target.value));
        this.elements.waterIntensity.addEventListener('input', (e) => Settings.water.intensity = parseFloat(e.target.value));
        this.elements.waterOpacity.addEventListener('input', (e) => {
            Settings.water.opacity = parseFloat(e.target.value);
            this.game.terrain.updateVisuals();
        });

        // Colors
        const updateColor = (category, key, e) => {
            Settings[category].colors[key].set(e.target.value);
            if (category === 'terrain') this.game.terrain.updateVisuals();
        };
        this.elements.colorMidnight.addEventListener('input', (e) => updateColor('time', 'midnight', e));
        this.elements.colorDawn.addEventListener('input', (e) => updateColor('time', 'dawn', e));
        this.elements.colorNoon.addEventListener('input', (e) => updateColor('time', 'noon', e));
        this.elements.colorSunset.addEventListener('input', (e) => updateColor('time', 'sunset', e));
        this.elements.colorSea.addEventListener('input', (e) => updateColor('terrain', 'sea', e));
        this.elements.colorDirt.addEventListener('input', (e) => updateColor('terrain', 'dirt', e));
        this.elements.colorGrass.addEventListener('input', (e) => updateColor('terrain', 'grass', e));

        // Presets
        this.elements.btnSavePreset.addEventListener('click', () => {
            localStorage.setItem('rpg_medieval_save', JSON.stringify(this.getPreset()));
            alert('Progresso Salvo no Reino!');
        });
        this.elements.btnLoadPreset.addEventListener('click', () => {
            const data = localStorage.getItem('rpg_medieval_save');
            if (data) this.applyPreset(JSON.parse(data));
        });
    }

    getPreset() {
        const p = JSON.parse(JSON.stringify(Settings));
        p.time.colors = {
            midnight: Settings.time.colors.midnight.getHexString(),
            dawn: Settings.time.colors.dawn.getHexString(),
            noon: Settings.time.colors.noon.getHexString(),
            sunset: Settings.time.colors.sunset.getHexString()
        };
        p.terrain.colors = {
            sea: Settings.terrain.colors.sea.getHexString(),
            dirt: Settings.terrain.colors.dirt.getHexString(),
            grass: Settings.terrain.colors.grass.getHexString()
        };
        return p;
    }

    applyPreset(p) {
        Object.assign(Settings.time, p.time);
        Object.assign(Settings.camera, p.camera);
        Object.assign(Settings.terrain, p.terrain);
        Object.assign(Settings.water, p.water);

        Settings.time.colors.midnight.set('#' + p.time.colors.midnight);
        Settings.time.colors.dawn.set('#' + p.time.colors.dawn);
        Settings.time.colors.noon.set('#' + p.time.colors.noon);
        Settings.time.colors.sunset.set('#' + p.time.colors.sunset);

        Settings.terrain.colors.sea.set('#' + p.terrain.colors.sea);
        Settings.terrain.colors.dirt.set('#' + p.terrain.colors.dirt);
        Settings.terrain.colors.grass.set('#' + p.terrain.colors.grass);

        this.game.terrain.init();
        this.syncUI();
    }

    syncUI() {
        // Simple sync for common elements
        this.elements.realTimeToggle.checked = Settings.time.useRealTime;
        this.elements.timeSlider.value = Settings.time.timeOfDay;
        this.elements.cameraMode.value = Settings.camera.mode;
    }

    update() {
        if (this.elements.woodCount) this.elements.woodCount.innerText = this.game.player.inventory.tree;
        if (this.elements.stoneCount) this.elements.stoneCount.innerText = this.game.player.inventory.rock;

        const h = Math.floor(Settings.time.timeOfDay);
        const m = Math.floor((Settings.time.timeOfDay % 1) * 60);
        let period = "";
        if (h >= 5 && h < 8) period = " (Alvorada)";
        else if (h >= 8 && h < 17) period = " (Meio-Dia)";
        else if (h >= 17 && h < 20) period = " (Entardecer)";
        else period = " (Meia-Noite)";

        this.elements.timeDisplay.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}${period}`;
        if (!this.game.engine.isInteractingWithUI) {
             this.elements.timeSlider.value = Settings.time.timeOfDay;
        }
    }
}
