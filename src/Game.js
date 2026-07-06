import { Engine } from './core/Engine.js';
import { CameraManager } from './systems/CameraManager.js';
import { EnvironmentManager } from './systems/EnvironmentManager.js';
import { Terrain } from './world/Terrain.js';
import { Player } from './entities/Player.js';
import { UIManager } from './ui/UIManager.js';
import { ResourceManager } from './systems/ResourceManager.js';
import { Settings } from './core/Settings.js';

class Game {
    constructor() {
        this.engine = new Engine('#game-canvas');
        this.cameraManager = new CameraManager(this.engine);
        this.environment = new EnvironmentManager(this.engine.scene);
        this.terrain = new Terrain(this.engine.scene);
        this.resources = new ResourceManager(this.engine.scene, this.terrain);
        this.player = new Player(this.engine.scene, this.terrain);
        this.ui = new UIManager(this);

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'f' || e.code === 'Space') {
                const item = this.resources.harvestAt(this.player.position, 2.5);
                if (item) {
                    // Normalize item name if necessary, though ResourceManager returns 'tree' or 'rock'
                    this.player.inventory[item]++;
                    this.player.fadeToAction('punch', 0.1);
                    setTimeout(() => this.player.fadeToAction('idle', 0.5), 500);
                }
            }
        });

        this.animate();
        window.game = this; // Expose for debugging and testing
        window.Settings = Settings;
    }

    updateTime() {
        if (!Settings.time.frozen) {
            if (Settings.time.useRealTime) {
                const now = new Date();
                Settings.time.timeOfDay = now.getUTCHours() + (now.getUTCMinutes() / 60) + (now.getUTCSeconds() / 3600);
            } else {
                Settings.time.timeOfDay = (Settings.time.timeOfDay + (0.005 * Settings.time.timeSpeed)) % 24;
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.engine.clock.getDelta();
        const time = this.engine.clock.getElapsedTime() * 1000;

        this.updateTime();
        this.environment.update(Settings.time.timeOfDay);
        this.terrain.updateWater(time);

        // Pass the theta rotation value for camera-relative movement
        this.player.update(delta, this.cameraManager.getYRotation());
        this.cameraManager.update(delta, this.player);
        this.ui.update();

        this.engine.render(this.cameraManager.camera);
    }
}

new Game();
