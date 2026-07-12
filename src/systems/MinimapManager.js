import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class MinimapManager {
    constructor(game) {
        this.game = game;
        this.scene = game.engine.scene;
        this.renderer = game.engine.renderer;

        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.playerMarker = document.getElementById('minimap-player-marker');

        // Render Target for terrain capture
        this.renderTarget = new THREE.WebGLRenderTarget(512, 512);
        this.minimapCamera = new THREE.OrthographicCamera(-500, 500, 500, -500, 1, 2000);
        this.minimapCamera.position.set(0, 1000, 0);
        this.minimapCamera.lookAt(0, 0, 0);
        this.minimapCamera.up.set(0, 0, -1); // North is up (-Z)

        // Temporary light for clear map rendering
        this.mapLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.mapLight.position.set(0, 1000, 0);

        this.lastRenderTime = 0;
        this.renderInterval = 5000; // Render terrain every 5 seconds

        this.init();
    }

    init() {
        const size = 180;
        this.canvas.width = size;
        this.canvas.height = size;

        // Initial delay to let world load
        setTimeout(() => this.renderTerrain(), 1000);
    }

    renderTerrain() {
        const { terrain } = this.game;
        if (!terrain || !terrain.floor) return;

        // Prepare scene for "map view"
        const oldFog = this.scene.fog;
        this.scene.fog = null;

        const skydome = this.scene.getObjectByName("skydome");
        const oldSkyVisible = skydome ? skydome.visible : true;
        if (skydome) skydome.visible = false;

        // Temporarily add strong light from top
        this.scene.add(this.mapLight);

        const worldSize = Settings.terrain.size * 15;
        const halfSize = worldSize / 2;
        this.minimapCamera.left = -halfSize;
        this.minimapCamera.right = halfSize;
        this.minimapCamera.top = halfSize;
        this.minimapCamera.bottom = -halfSize;
        this.minimapCamera.updateProjectionMatrix();

        // Render to texture
        const oldTarget = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.minimapCamera);
        this.renderer.setRenderTarget(oldTarget);

        // Read pixels
        const pixels = new Uint8Array(512 * 512 * 4);
        this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, 512, 512, pixels);

        const imageData = new ImageData(new Uint8ClampedArray(pixels), 512, 512);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 512;
        tempCanvas.height = 512;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);

        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Circular mask
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width/2, this.canvas.height/2, this.canvas.width/2, 0, Math.PI*2);
        this.ctx.clip();

        this.ctx.translate(0, this.canvas.height);
        this.ctx.scale(1, -1);
        this.ctx.drawImage(tempCanvas, 0, 0, 512, 512, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        // Cleanup
        this.scene.remove(this.mapLight);
        this.scene.fog = oldFog;
        if (skydome) skydome.visible = oldSkyVisible;
    }

    update(time) {
        if (time - this.lastRenderTime > this.renderInterval) {
            this.renderTerrain();
            this.lastRenderTime = time;
        }

        const playerPos = this.game.player.group.position;
        const worldSize = Settings.terrain.size * 15;

        const pctX = (playerPos.x / worldSize) + 0.5;
        const pctZ = (playerPos.z / worldSize) + 0.5;

        if (this.playerMarker) {
            this.playerMarker.style.left = `${pctX * 100}%`;
            this.playerMarker.style.top = `${pctZ * 100}%`;

            // Marker facing direction
            const rot = -this.game.player.group.rotation.y;
            this.playerMarker.style.transform = `translate(-50%, -50%) rotate(${rot}rad)`;
        }
    }
}
