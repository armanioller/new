import { Engine } from './core/Engine.js';
import { CameraManager } from './systems/CameraManager.js';
import { EnvironmentManager } from './systems/EnvironmentManager.js';
import { Terrain } from './world/Terrain.js';
import { Player } from './entities/Player.js';
import { UIManager } from './ui/UIManager.js';
import { Settings } from './core/Settings.js';
import * as THREE from 'three';

class Game {
    constructor() {
        this.engine = new Engine('#game-canvas');
        this.cameraManager = new CameraManager(this.engine);
        this.environment = new EnvironmentManager(this.engine.scene);
        this.terrain = new Terrain(this.engine.scene);
        this.player = new Player(this.engine.scene, this.terrain);

        this.ui = new UIManager(this);

        this.animate();
        window.game = this;
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

        this.player.update(delta, this.cameraManager.camera);
        this.cameraManager.update(delta, this.player);
        this.ui.update();

        this.engine.render(this.cameraManager.camera);
    }
}

new Game();
