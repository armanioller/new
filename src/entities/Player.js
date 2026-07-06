import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Settings } from '../core/Settings.js';

export class Player {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.group = new THREE.Group();
        this.group.position.set(0, 5, 0);
        this.scene.add(this.group);

        this.mixer = null;
        this.animations = {};
        this.currentAction = null;
        this.velocity = new THREE.Vector3();
        this.acceleration = 0.05;
        this.friction = 0.85;

        // Consistent inventory keys
        this.inventory = { wood: 0, stone: 0 };

        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        this.initPlaceholder();
        this.loadModel();
    }

    initPlaceholder() {
        this.placeholder = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1, 4, 8), new THREE.MeshStandardMaterial({ color: 0xcd7f32 }));
        body.position.y = 0.9;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0xc0c0c0 }));
        head.position.y = 1.6;
        this.placeholder.add(body, head);
        this.placeholder.traverse(c => { if(c.isMesh) c.castShadow = true; });
        this.group.add(this.placeholder);
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb', (gltf) => {
            if (this.placeholder) this.group.remove(this.placeholder);
            const model = gltf.scene;
            model.scale.set(0.4, 0.4, 0.4);
            model.traverse(c => { if(c.isMesh) c.castShadow = true; });
            this.group.add(model);
            this.mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach(clip => {
                this.animations[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
            });
            this.fadeToAction('idle');
        });
    }

    fadeToAction(name, duration = 0.2) {
        if (!this.animations[name] || this.currentAction === this.animations[name]) return;
        if (this.currentAction) this.currentAction.fadeOut(duration);
        this.currentAction = this.animations[name];
        this.currentAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
    }

    update(delta, cameraRotationY) {
        if (this.mixer) this.mixer.update(delta);
        if (Settings.camera.mode === 'free') return;

        // Safety: default to 0 if undefined
        const rotY = cameraRotationY || 0;

        const moveX = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
        const moveZ = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);
        const isMoving = moveX !== 0 || moveZ !== 0;

        if (isMoving) {
            const inputAngle = Math.atan2(moveX, moveZ);
            const targetAngle = inputAngle + rotY;

            let diff = targetAngle - this.group.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.group.rotation.y += diff * 0.15;

            this.velocity.x += Math.sin(targetAngle) * this.acceleration;
            this.velocity.z += Math.cos(targetAngle) * this.acceleration;

            if (Settings.camera.mode === 'firstperson') {
                this.group.rotation.y = rotY + Math.PI;
            }

            this.fadeToAction('walking');
        } else {
            this.fadeToAction('idle');
        }

        this.velocity.multiplyScalar(this.friction);

        const isAction = this.currentAction && (this.currentAction.getClip().name.toLowerCase().includes('punch') || this.currentAction.getClip().name.toLowerCase().includes('jump'));

        if (!isAction) {
            // Final safety check for NaN
            if (!isNaN(this.velocity.x) && !isNaN(this.velocity.z)) {
                this.group.position.add(this.velocity);
            }
        }

        const h = this.terrain.getHeight(this.group.position.x, this.group.position.z);
        if (!isNaN(h)) {
            this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, h, 0.2);
        }
    }

    get position() { return this.group.position; }
}
