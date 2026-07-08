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

        this.physicalRotation = 0;
        this.inventory = { wood: 0, stone: 0 };
        this.keys = {};

        this.mixer = null;
        this.animations = {};
        this.currentAction = null;

        // Jump Physics
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.jumpHeight = 0;
        this.gravity = 30;

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

    update(delta, camera) {
        if (this.mixer) this.mixer.update(delta);
        if (Settings.camera.mode === 'free') return;

        // 1. WASD Input relative to camera vectors (FIX: NO INVERSIONS)
        const moveX = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
        const moveZ = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);
        const isMoving = moveX !== 0 || moveZ !== 0;

        if (isMoving) {
            // Get camera direction projected on ground plane
            const camForward = new THREE.Vector3();
            camera.getWorldDirection(camForward);
            camForward.y = 0;
            camForward.normalize();

            const camRight = new THREE.Vector3();
            camRight.crossVectors(THREE.Object3D.DEFAULT_UP, camForward);

            // Combine based on input
            // moveZ is negative for W (meaning move FORWARD along camForward)
            // moveX is positive for D (meaning move RIGHT along camRight)
            const moveVec = new THREE.Vector3();
            moveVec.addScaledVector(camForward, -moveZ);
            moveVec.addScaledVector(camRight, -moveX);
            moveVec.normalize();

            this.physicalRotation = Math.atan2(moveVec.x, moveVec.z);

            const speed = Settings.player.moveSpeed * delta;
            this.group.position.addScaledVector(moveVec, speed);

            this.fadeToAction('walking');
        } else {
            this.fadeToAction('idle');
            if (Settings.camera.mode === 'firstperson') {
                const camForward = new THREE.Vector3();
                camera.getWorldDirection(camForward);
                this.physicalRotation = Math.atan2(camForward.x, camForward.z);
            }
        }

        // Jump Handling
        if (this.keys[' '] && !this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = 10;
            this.fadeToAction('jump');
        }

        if (this.isJumping) {
            this.jumpHeight += this.jumpVelocity * delta;
            this.jumpVelocity -= this.gravity * delta;
            if (this.jumpHeight <= 0) {
                this.jumpHeight = 0;
                this.isJumping = false;
            }
        }

        // Shortest Angle Mesh Rotation
        let rotDiff = this.physicalRotation - this.group.rotation.y;
        rotDiff = Math.atan2(Math.sin(rotDiff), Math.cos(rotDiff));
        this.group.rotation.y += rotDiff * Math.min(1.0, 12 * delta);

        const h = this.terrain.getHeight(this.group.position.x, this.group.position.z);
        this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, h + this.jumpHeight, 10 * delta);
    }

    get position() { return this.group.position; }
}
