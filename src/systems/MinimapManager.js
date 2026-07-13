import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class MinimapManager {
    constructor(game) {
        this.game = game;
        this.scene = game.engine.scene;
        this.renderer = game.engine.renderer;

        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.playerMarker = document.getElementById('minimap-player-marker');

        this.renderTarget = new THREE.WebGLRenderTarget(1024, 1024);
        this.minimapCamera = new THREE.OrthographicCamera(-300, 300, 300, -300, 1, 5000);
        this.minimapCamera.position.set(0, 2000, 0);
        this.minimapCamera.lookAt(0, 0, 0);
        this.minimapCamera.up.set(0, 0, -1); // North (-Z) is UP

        this.lastRenderTime = 0;
        this.renderInterval = 10000;

        this.init();
    }

    init() {
        if (!this.canvas) return;
        const size = 228;
        this.canvas.width = size;
        this.canvas.height = size;
        setTimeout(() => this.renderTerrain(), 3000);
    }

    renderTerrain() {
        const { terrain, environment } = this.game;
        if (!terrain || !terrain.floor || !this.ctx) return;

        const oldFog = this.scene.fog;
        this.scene.fog = null;

        if (environment && environment.boostForMinimap) environment.boostForMinimap(true);

        const hiddenObjects = [];
        this.scene.traverse(obj => {
            if (obj.name === "skydome" || obj.name === "stars" || obj.name === "player-group") {
                if (obj.visible) {
                    obj.visible = false;
                    hiddenObjects.push(obj);
                }
            }
        });

        const worldSize = Settings.terrain.size * 15;
        const halfSize = worldSize / 2;
        this.minimapCamera.left = -halfSize;
        this.minimapCamera.right = halfSize;
        this.minimapCamera.top = halfSize;
        this.minimapCamera.bottom = -halfSize;
        this.minimapCamera.updateProjectionMatrix();

        const oldTarget = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.minimapCamera);
        this.renderer.setRenderTarget(oldTarget);

        const pixels = new Uint8Array(1024 * 1024 * 4);
        this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, 1024, 1024, pixels);
        const imageData = new ImageData(new Uint8ClampedArray(pixels), 1024, 1024);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1024;
        tempCanvas.height = 1024;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);

        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.translate(0, this.canvas.height);
        this.ctx.scale(1, -1);
        this.ctx.drawImage(tempCanvas, 0, 0, 1024, 1024, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        if (environment && environment.boostForMinimap) environment.boostForMinimap(false);
        this.scene.fog = oldFog;
        hiddenObjects.forEach(obj => obj.visible = true);
    }

    update(time) {
        if (!this.canvas) return;
        if (time - this.lastRenderTime > this.renderInterval) {
            this.renderTerrain();
            this.lastRenderTime = time;
        }

        const playerPos = this.game.player.group.position;
        const worldSize = Settings.terrain.size * 15;
        const halfSize = worldSize / 2;

        const pctX = (playerPos.x + halfSize) / worldSize;
        const pctZ = (playerPos.z + halfSize) / worldSize;

        if (this.playerMarker) {
            this.playerMarker.style.left = `${pctX * 100}%`;
            this.playerMarker.style.top = `${pctZ * 100}%`;
            const rotDeg = (this.game.player.group.rotation.y * 180 / Math.PI) + 180;
            this.playerMarker.style.transform = `translate(-50%, -50%) rotate(${rotDeg}deg)`;
        }
    }
}
