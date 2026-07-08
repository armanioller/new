import { Engine } from './core/Engine.js';
import { CameraManager } from './systems/CameraManager.js';
import { EnvironmentManager } from './systems/EnvironmentManager.js';
import { Terrain } from './world/Terrain.js';
import { Player } from './entities/Player.js';
import { NPC } from './entities/NPC.js';
import { UIManager } from './ui/UIManager.js';
import { ResourceManager } from './systems/ResourceManager.js';
import { BuildingManager } from './systems/BuildingManager.js';
import { Settings } from './core/Settings.js';
import * as THREE from 'three';

class Game {
    constructor() {
        this.engine = new Engine('#game-canvas');
        this.cameraManager = new CameraManager(this.engine);
        this.environment = new EnvironmentManager(this.engine.scene);
        this.terrain = new Terrain(this.engine.scene);
        this.resources = new ResourceManager(this.engine.scene, this.terrain);
        this.player = new Player(this.engine.scene, this.terrain);
        this.buildings = new BuildingManager(this);
        this.ui = new UIManager(this);

        this.npcs = [];
        this.spawnNPCs(5);

        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'f') {
                // Try to interact with NPC first
                const nearestNPC = this.getNearestNPC(2.5);
                if (nearestNPC) {
                    this.ui.showModal("Cidadão", "Olá, viajante! Belo dia para colher recursos, não acha?", null, false);
                } else {
                    // Harvest resource
                    const item = this.resources.harvestAt(this.player.position, 2.5);
                    if (item) {
                        this.player.inventory[item]++;
                        this.player.fadeToAction('punch', 0.1);
                        setTimeout(() => this.player.fadeToAction('idle', 0.5), 500);
                    }
                }
            }
        });

        this.animate();
        window.game = this;
        window.Settings = Settings;
    }

    spawnNPCs(count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 30;
            const z = (Math.random() - 0.5) * 30;
            const h = this.terrain.getHeight(x, z);
            const npc = new NPC(this.engine.scene, this.terrain, new THREE.Vector3(x, h, z));
            this.npcs.push(npc);
        }
    }

    getNearestNPC(maxDist) {
        let nearest = null;
        let minDist = maxDist;
        for (const npc of this.npcs) {
            const d = this.player.position.distanceTo(npc.group.position);
            if (d < minDist) {
                minDist = d;
                nearest = npc;
            }
        }
        return nearest;
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

        for (const npc of this.npcs) {
            npc.update(delta);
        }

        this.cameraManager.update(delta, this.player);
        this.ui.update();

        this.engine.render(this.cameraManager.camera);
    }
}

new Game();
