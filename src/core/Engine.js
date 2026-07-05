import * as THREE from 'three';

export class Engine {
    constructor(canvasId) {
        this.scene = new THREE.Scene();
        this.canvas = document.querySelector(canvasId);

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

        // Track UI interaction to prevent slider fighting
        const uiLayer = document.getElementById('ui-layer');
        uiLayer.addEventListener('mousedown', () => this.isInteractingWithUI = true);
        window.addEventListener('mouseup', () => this.isInteractingWithUI = false);
    }

    onResize() {
        if (this.camera) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render(camera) {
        this.renderer.render(this.scene, camera);
    }
}
