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
            stoneCount: document.getElementById('count-stone'),
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
        this.elements.cameraMode.addEventListener('change', (e) => {
            Settings.camera.mode = e.target.value;
            if (e.target.value !== 'firstperson' && document.pointerLockElement) {
                document.exitPointerLock();
            }
        });

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
            this.showModal(
                "Santuário de Memórias",
                "Desejas gravar o progresso atual do seu reino nos pergaminhos locais?",
                () => {
                    localStorage.setItem('rpg_medieval_save', JSON.stringify(this.getPreset()));
                }
            );
        });

        this.elements.btnLoadPreset.addEventListener('click', () => {
            const data = localStorage.getItem('rpg_medieval_save');
            if (data) {
                this.showModal(
                    "Restaurar Reino",
                    "Desejas carregar o estado salvo? O progresso atual será perdido.",
                    () => this.applyPreset(JSON.parse(data))
                );
            } else {
                this.showModal("Aviso", "Nenhum pergaminho de salvamento encontrado.", null, false);
            }
        });

        this.elements.btnResetDefaults.addEventListener('click', () => {
            this.showModal(
                "Destruição Total",
                "Tem certeza que deseja resetar todo o mundo? Esta ação é irreversível!",
                () => {
                    localStorage.removeItem('rpg_medieval_save');
                    location.reload();
                }
            );
        });

        // JSON Actions
        this.elements.btnExportJSON.addEventListener('click', () => {
            const json = JSON.stringify(this.getPreset(), null, 4);
            this.elements.importArea.value = json;
            navigator.clipboard.writeText(json);
            this.showModal("Exportação", "JSON copiado para a área de transferência!", null, false);
        });

        this.elements.btnImportJSON.addEventListener('click', () => {
            try {
                const data = JSON.parse(this.elements.importArea.value);
                this.applyPreset(data);
                this.showModal("Sucesso", "Configurações importadas com sucesso!", null, false);
            } catch (e) {
                this.showModal("Erro", "Falha ao ler o JSON. Verifique o pergaminho.", null, false);
            }
        });

        this.syncUI();
    }

    showModal(title, message, onConfirm = null, showCancel = true) {
        this.elements.modalTitle.innerText = title;
        this.elements.modalMessage.innerText = message;
        this.elements.modalCancel.style.display = showCancel ? 'block' : 'none';

        this.elements.modal.classList.add('active');

        const close = () => {
            this.elements.modal.classList.remove('active');
            this.elements.modalConfirm.onclick = null;
            this.elements.modalCancel.onclick = null;
        };

        this.elements.modalConfirm.onclick = () => {
            if (onConfirm) onConfirm();
            close();
        };

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
        p.terrain.colors = {
            sea: Settings.terrain.colors.sea.getHexString(),
            dirt: Settings.terrain.colors.dirt.getHexString(),
            grass: Settings.terrain.colors.grass.getHexString()
        };
        return p;
    }

    applyPreset(p) {
        // Safe deep assign to avoid replacing THREE.Color instances with strings
        Object.keys(p.time).forEach(k => {
            if (k !== 'colors') Settings.time[k] = p.time[k];
        });
        Object.keys(p.camera).forEach(k => {
            Settings.camera[k] = p.camera[k];
        });
        Object.keys(p.terrain).forEach(k => {
            if (k !== 'colors') Settings.terrain[k] = p.terrain[k];
        });
        Object.keys(p.water).forEach(k => {
            Settings.water[k] = p.water[k];
        });

        // Restore Colors using .set()
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
        this.elements.realTimeToggle.checked = Settings.time.useRealTime;
        this.elements.timeSlider.value = Settings.time.timeOfDay;
        this.elements.cameraMode.value = Settings.camera.mode;
        this.elements.terrainSize.value = Settings.terrain.size;
        this.elements.terrainQuality.value = Settings.terrain.quality;
        this.elements.terrainTriangulate.checked = Settings.terrain.triangulated;
        this.elements.waterLevel.value = Settings.terrain.waterLevel;
        this.elements.grassLevel.value = Settings.terrain.grassLevel;
        this.elements.waterSpeed.value = Settings.water.speed;
        this.elements.waterIntensity.value = Settings.water.intensity;
        this.elements.waterOpacity.value = Settings.water.opacity;

        // Color pickers
        this.elements.colorMidnight.value = '#' + Settings.time.colors.midnight.getHexString();
        this.elements.colorDawn.value = '#' + Settings.time.colors.dawn.getHexString();
        this.elements.colorNoon.value = '#' + Settings.time.colors.noon.getHexString();
        this.elements.colorSunset.value = '#' + Settings.time.colors.sunset.getHexString();
        this.elements.colorSea.value = '#' + Settings.terrain.colors.sea.getHexString();
        this.elements.colorDirt.value = '#' + Settings.terrain.colors.dirt.getHexString();
        this.elements.colorGrass.value = '#' + Settings.terrain.colors.grass.getHexString();
    }

    update() {
        const inventory = this.game.player.inventory;
        if (this.elements.woodCount) this.elements.woodCount.innerText = inventory.wood || 0;
        if (this.elements.stoneCount) this.elements.stoneCount.innerText = inventory.stone || 0;

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
