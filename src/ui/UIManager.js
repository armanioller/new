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
            // Controls
            realTimeToggle: document.getElementById('real-time-toggle'),
            timeFreezeToggle: document.getElementById('time-freeze-toggle'),
            timeSlider: document.getElementById('time-slider'),
            timeSpeed: document.getElementById('time-speed'),
            cameraMode: document.getElementById('camera-mode'),
            cameraDistance: document.getElementById('camera-distance'),
            cameraHeight: document.getElementById('camera-height'),
            cameraOffset: document.getElementById('camera-offset'),
            terrainSize: document.getElementById('terrain-size'),
            terrainQuality: document.getElementById('terrain-quality'),
            terrainTriangulate: document.getElementById('terrain-triangulate'),
            terrainDepth: document.getElementById('terrain-depth'),
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
            btnResetDefaults: document.getElementById('btn-reset-defaults'),
            woodCount: document.getElementById('count-wood'),
            stoneCount: document.getElementById('count-stone'),
            valCameraDistance: document.getElementById("val-camera-distance"),
            valCameraHeight: document.getElementById("val-camera-height"),
            valCameraOffset: document.getElementById("val-camera-offset"),
            valTerrainSize: document.getElementById("val-terrain-size"),
            valTerrainQuality: document.getElementById("val-terrain-quality"),
            valTerrainDepth: document.getElementById("val-terrain-depth"),
            valWaterOpacity: document.getElementById("val-water-opacity"),
            buildList: document.getElementById('build-list'),
            // Modal
            modal: document.getElementById('global-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalMessage: document.getElementById('modal-message'),
            modalCancel: document.getElementById('modal-cancel'),
            modalConfirm: document.getElementById('modal-confirm')
        };

        this.init();
    }

    init() {
        if (this.elements.settingsToggle) {
            this.elements.settingsToggle.addEventListener('click', () => {
                const isOpen = this.elements.settingsMenu.classList.toggle('open');
                this.elements.settingsToggle.classList.toggle('sidebar-open', isOpen);
            });
        }

        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.tabButtons.forEach(b => b.classList.remove('active'));
                this.elements.tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const target = document.getElementById(btn.dataset.tab);
                if (target) target.classList.add('active');
            });
        });

        // Time
        if (this.elements.realTimeToggle) {
            this.elements.realTimeToggle.addEventListener('change', (e) => {
                Settings.time.useRealTime = e.target.checked;
                const manual = document.getElementById('manual-time-controls');
                if (manual) manual.style.display = e.target.checked ? 'none' : 'block';
            });
        }
        if (this.elements.timeFreezeToggle) {
            this.elements.timeFreezeToggle.addEventListener('change', (e) => Settings.time.frozen = e.target.checked);
        }
        if (this.elements.timeSlider) {
            this.elements.timeSlider.addEventListener('input', (e) => Settings.time.timeOfDay = parseFloat(e.target.value));
        }
        if (this.elements.timeSpeed) {
            this.elements.timeSpeed.addEventListener('input', (e) => Settings.time.timeSpeed = parseFloat(e.target.value));
        }

        // Camera
        if (this.elements.cameraMode) {
            this.elements.cameraMode.addEventListener('change', (e) => {
                Settings.camera.mode = e.target.value;
                if (e.target.value === 'firstperson') {
                    this.game.engine.renderer.domElement.requestPointerLock();
                } else if (document.pointerLockElement) {
                    document.exitPointerLock();
                }
            });
        }
        if (this.elements.cameraDistance) {
            this.elements.cameraDistance.addEventListener('input', (e) => Settings.camera.distance = parseFloat(e.target.value); if(this.elements.valCameraDistance) this.elements.valCameraDistance.innerText = e.target.value);
        }
        if (this.elements.cameraHeight) {
            this.elements.cameraHeight.addEventListener('input', (e) => Settings.camera.height = parseFloat(e.target.value); if(this.elements.valCameraHeight) this.elements.valCameraHeight.innerText = e.target.value);
        }
        if (this.elements.cameraOffset) {
            this.elements.cameraOffset.addEventListener('input', (e) => Settings.camera.verticalOffset = parseFloat(e.target.value); if(this.elements.valCameraOffset) this.elements.valCameraOffset.innerText = parseFloat(e.target.value).toFixed(1));
        }

        // Terrain
        if (this.elements.terrainSize) {
            this.elements.terrainSize.addEventListener('change', (e) => {
                Settings.terrain.size = parseInt(e.target.value); if(this.elements.valTerrainSize) this.elements.valTerrainSize.innerText = e.target.value;
                this.game.terrain.init();
            });
        }
        if (this.elements.terrainQuality) {
            this.elements.terrainQuality.addEventListener('change', (e) => {
                Settings.terrain.quality = parseInt(e.target.value); if(this.elements.valTerrainQuality) this.elements.valTerrainQuality.innerText = e.target.value;
                this.game.terrain.init();
            });
        }
        if (this.elements.terrainTriangulate) {
            this.elements.terrainTriangulate.addEventListener('change', (e) => {
                Settings.terrain.triangulated = e.target.checked;
                this.game.terrain.updateVisuals();
            });
        }
        if (this.elements.terrainDepth) {
            this.elements.terrainDepth.addEventListener('input', (e) => {
                Settings.terrain.seaDepth = parseFloat(e.target.value); if(this.elements.valTerrainDepth) this.elements.valTerrainDepth.innerText = e.target.value;
                this.game.terrain.init();
            });
        }
        if (this.elements.waterOpacity) {
            this.elements.waterOpacity.addEventListener('input', (e) => {
                Settings.water.opacity = parseFloat(e.target.value); if(this.elements.valWaterOpacity) this.elements.valWaterOpacity.innerText = parseFloat(e.target.value).toFixed(2);
                this.game.terrain.updateVisuals();
            });
        }

        // Colors
        const updateColor = (category, key, e) => {
            Settings[category].colors[key].set(e.target.value);
            if (category === 'terrain') this.game.terrain.updateVisuals();
        };
        if (this.elements.colorMidnight) this.elements.colorMidnight.addEventListener('input', (e) => updateColor('time', 'midnight', e));
        if (this.elements.colorDawn) this.elements.colorDawn.addEventListener('input', (e) => updateColor('time', 'dawn', e));
        if (this.elements.colorNoon) this.elements.colorNoon.addEventListener('input', (e) => updateColor('time', 'noon', e));
        if (this.elements.colorSunset) this.elements.colorSunset.addEventListener('input', (e) => updateColor('time', 'sunset', e));
        if (this.elements.colorSea) this.elements.colorSea.addEventListener('input', (e) => updateColor('terrain', 'sea', e));
        if (this.elements.colorDirt) this.elements.colorDirt.addEventListener('input', (e) => updateColor('terrain', 'dirt', e));
        if (this.elements.colorGrass) this.elements.colorGrass.addEventListener('input', (e) => updateColor('terrain', 'grass', e));

        // Presets
        if (this.elements.btnSavePreset) {
            this.elements.btnSavePreset.addEventListener('click', () => {
                this.showModal("Santuário", "Deseja salvar suas configurações atuais?", () => {
                    localStorage.setItem('rpg_medieval_save', JSON.stringify(this.getPreset()));
                });
            });
        }

        if (this.elements.btnLoadPreset) {
            this.elements.btnLoadPreset.addEventListener('click', () => {
                const data = localStorage.getItem('rpg_medieval_save');
                if (data) {
                    this.showModal("Restaurar", "Carregar progresso salvo?", () => {
                        this.applyPreset(JSON.parse(data));
                    });
                } else {
                    this.showModal("Erro", "Nenhum dado salvo encontrado.", null, false);
                }
            });
        }

        if (this.elements.btnResetDefaults) {
            this.elements.btnResetDefaults.addEventListener('click', () => {
                this.showModal("Reiniciar", "Todas as configurações e progresso serão perdidos. Confirmar?", () => {
                    localStorage.removeItem('rpg_medieval_save');
                    location.reload();
                });
            });
        }

        this.syncUI();
    }

    showModal(title, message, onConfirm = null, showCancel = true) {
        if (!this.elements.modal) return;
        this.elements.modalTitle.innerText = title;
        this.elements.modalMessage.innerText = message;
        this.elements.modalCancel.style.display = showCancel ? 'block' : 'none';
        this.elements.modal.classList.add('active');
        const close = () => {
            this.elements.modal.classList.remove('active');
            this.elements.modalConfirm.onclick = null;
        };
        this.elements.modalConfirm.onclick = () => { if (onConfirm) onConfirm(); close(); };
        this.elements.modalCancel.onclick = close;
    }

    getPreset() {
        const p = JSON.parse(JSON.stringify(Settings));
        p.time.colors = {
            midnight: Settings.time.colors.midnight.getHexString(),
            dawn: Settings.time.colors.dawn.getHexString(),
            noon: Settings.time.colors.noon.getHexString(),
            sunset: Settings.time.colors.sunset.getHexString()
        };
        return p;
    }

    applyPreset(p) {
        Object.keys(p.time).forEach(k => { if (k !== 'colors') Settings.time[k] = p.time[k]; });
        Settings.time.colors.midnight.set('#' + p.time.colors.midnight);
        Settings.time.colors.dawn.set('#' + p.time.colors.dawn);
        Settings.time.colors.noon.set('#' + p.time.colors.noon);
        Settings.time.colors.sunset.set('#' + p.time.colors.sunset);
        this.game.terrain.init();
        this.syncUI();
    }

    syncUI() {
        if (this.elements.realTimeToggle) this.elements.realTimeToggle.checked = Settings.time.useRealTime;
        if (this.elements.timeSlider) this.elements.timeSlider.value = Settings.time.timeOfDay;
        if (this.elements.cameraMode) this.elements.cameraMode.value = Settings.camera.mode;
        if (this.elements.cameraDistance) this.elements.cameraDistance.value = Settings.camera.distance;
        if (this.elements.cameraHeight) this.elements.cameraHeight.value = Settings.camera.height;
        if (this.elements.cameraOffset) this.elements.cameraOffset.value = Settings.camera.verticalOffset;
        if (this.elements.terrainSize) this.elements.terrainSize.value = Settings.terrain.size;
        if (this.elements.terrainQuality) this.elements.terrainQuality.value = Settings.terrain.quality;
        if (this.elements.terrainTriangulate) this.elements.terrainTriangulate.checked = Settings.terrain.triangulated;
        if (this.elements.terrainDepth) this.elements.terrainDepth.value = Settings.terrain.seaDepth;
        if (this.elements.waterOpacity) this.elements.waterOpacity.value = Settings.water.opacity;

        if (this.elements.valCameraDistance) this.elements.valCameraDistance.innerText = Settings.camera.distance;
        if (this.elements.valCameraHeight) this.elements.valCameraHeight.innerText = Settings.camera.height;
        if (this.elements.valCameraOffset) this.elements.valCameraOffset.innerText = Settings.camera.verticalOffset.toFixed(1);
        if (this.elements.valTerrainSize) this.elements.valTerrainSize.innerText = Settings.terrain.size;
        if (this.elements.valTerrainQuality) this.elements.valTerrainQuality.innerText = Settings.terrain.quality;
        if (this.elements.valTerrainDepth) this.elements.valTerrainDepth.innerText = Settings.terrain.seaDepth;
        if (this.elements.valWaterOpacity) this.elements.valWaterOpacity.innerText = Settings.water.opacity.toFixed(2);

        const manual = document.getElementById('manual-time-controls');
        if (manual) manual.style.display = Settings.time.useRealTime ? 'none' : 'block';

        if (this.elements.colorSea) this.elements.colorSea.value = '#' + Settings.terrain.colors.sea.getHexString();
        if (this.elements.colorDirt) this.elements.colorDirt.value = '#' + Settings.terrain.colors.dirt.getHexString();
        if (this.elements.colorGrass) this.elements.colorGrass.value = '#' + Settings.terrain.colors.grass.getHexString();
    }

    update() {
        const inv = this.game.player.inventory;
        if (this.elements.woodCount) this.elements.woodCount.innerText = inv.wood || 0;
        if (this.elements.stoneCount) this.elements.stoneCount.innerText = inv.stone || 0;

        const h = Math.floor(Settings.time.timeOfDay);
        const m = Math.floor((Settings.time.timeOfDay % 1) * 60);
        if (this.elements.timeDisplay) this.elements.timeDisplay.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

        if (!this.game.engine.isInteractingWithUI && this.elements.timeSlider) {
             this.elements.timeSlider.value = Settings.time.timeOfDay;
        }
    }
}
