import { Engine } from './core/Engine.js';
import { CameraManager } from './systems/CameraManager.js';
import { EnvironmentManager } from './systems/EnvironmentManager.js';
import { Terrain } from './world/Terrain.js';
import { Player } from './entities/Player.js';
import { UIManager } from './ui/UIManager.js';
import { MinimapManager } from './systems/MinimapManager.js';
import { Settings } from './core/Settings.js';
import * as THREE from 'three';

export class Game {
    constructor() {
        this.engine = new Engine('#game-canvas');
        this.cameraManager = new CameraManager(this.engine);
        this.environment = new EnvironmentManager(this.engine.scene);
        this.terrain = new Terrain(this.engine.scene);
        this.player = new Player(this.engine.scene, this.terrain);

        this.ui = new UIManager(this);
        this.minimap = new MinimapManager(this);

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

    handleUnderwaterEffects(skyColor) {
        const camY = this.cameraManager.camera.position.y;
        const waterY = Settings.terrain.waterLevel;
        const fog = this.engine.scene.fog;

        if (camY < waterY) {
            const depth = Math.abs(camY - waterY);
            const murkyFactor = Math.min(1, depth / 20);
            const murkyColor = new THREE.Color(0x001a1a).lerp(new THREE.Color(0x000505), murkyFactor);
            if (fog) {
                fog.color.copy(murkyColor);
                fog.density = 0.15 + (murkyFactor * 0.1);
            }
            if (this.environment.stars) this.environment.stars.visible = false;
            this.engine.scene.background = murkyColor;
            const skydome = this.engine.scene.getObjectByName("skydome");
            if (skydome) skydome.material.color.copy(murkyColor);
        } else {
            if (fog) {
                fog.color.copy(skyColor);
                const angle = ((Settings.time.timeOfDay - 6) / 24) * Math.PI * 2;
                const dayFactor = Math.max(0, Math.sin(angle));
                fog.density = 0.0025 + (1 - dayFactor) * 0.0015;
            }
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.engine.clock.getDelta();
        const time = this.engine.clock.getElapsedTime() * 1000;
        this.updateTime();
        const currentSkyColor = this.environment.update(Settings.time.timeOfDay, this.cameraManager.camera.position);
        this.player.update(delta, this.cameraManager.camera);
        this.cameraManager.update(delta, this.player);
        this.handleUnderwaterEffects(currentSkyColor);
        this.terrain.updateVisuals(this.engine.scene.fog.color);
        this.terrain.updateWater(time);
        this.ui.update();
        this.minimap.update(time);
        this.engine.render(this.cameraManager.camera);
    }
}
