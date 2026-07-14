import * as THREE from 'three';

export class Engine {
    constructor(canvasId) {
        this.scene = new THREE.Scene();
        this.canvas = document.querySelector(canvasId);

        if (!this.canvas) {
            console.error(`Engine Error: Canvas element with selector "${canvasId}" not found.`);
            return;
        }

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;

        this.clock = new THREE.Clock();
        this.isInteractingWithUI = false;

        window.addEventListener('resize', () => this.onResize());

        // Track UI interaction broadly on the document if needed,
        // or let UIManager handle it specifically.
        window.addEventListener('mouseup', () => this.isInteractingWithUI = false);
    }

    onResize() {
        if (this.camera) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    render(camera) {
        if (this.renderer && camera) {
            this.renderer.render(this.scene, camera);
        }
    }
}
