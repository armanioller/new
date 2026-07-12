import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Settings } from '../core/Settings.js';

export class Player {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.group = new THREE.Group();
        this.group.position.set(0, 5, 0);
        this.scene.add(this.group);

        this.model = null;
        this.rawAnimations = [];
        this.customClips = {};
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
        this.gravity = 32;

        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        this.initPlaceholder();
        this.loadModel();
    }

    initPlaceholder() {
        if (this.placeholder) this.group.remove(this.placeholder);
        this.placeholder = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0xcd7f32 }));
        body.position.y = 0.6;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xc0c0c0 }));
        head.position.y = 1.45;
        this.placeholder.add(body, head);
        this.group.add(this.placeholder);
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb', (gltf) => {
            this.setupModel(gltf.scene, gltf.animations);
        });
    }

    loadCustomModel(buffer, filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);

        const onLoaded = (object, animations) => {
            this.setupModel(object, animations);
            URL.revokeObjectURL(url);
        };

        if (extension === 'glb' || extension === 'gltf') {
            new GLTFLoader().load(url, (gltf) => onLoaded(gltf.scene, gltf.animations));
        } else if (extension === 'fbx') {
            new FBXLoader().load(url, (object) => onLoaded(object, object.animations));
        }
    }

    loadCustomAnimation(buffer, filename, type) {
        const extension = filename.split('.').pop().toLowerCase();
        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);

        const onLoaded = (animations) => {
            if (animations && animations.length > 0) {
                const clip = animations[0];
                clip.name = type;
                this.customClips[type] = clip;
                if (this.mixer) {
                    this.animations[type] = this.mixer.clipAction(clip);
                }
            }
            URL.revokeObjectURL(url);
        };

        if (extension === 'glb' || extension === 'gltf') {
            new GLTFLoader().load(url, (gltf) => onLoaded(gltf.animations));
        } else if (extension === 'fbx') {
            new FBXLoader().load(url, (object) => onLoaded(object.animations));
        }
    }

    setupModel(model, animations) {
        if (this.placeholder) this.group.remove(this.placeholder);
        if (this.model) this.group.remove(this.model);

        this.model = model;
        this.rawAnimations = animations;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.8 / maxDim;
        this.model.scale.set(scale, scale, scale);

        this.model.traverse(c => { if(c.isMesh) c.castShadow = true; });
        this.group.add(this.model);

        this.mixer = new THREE.AnimationMixer(this.model);
        this.animations = {};

        animations.forEach(clip => {
            const name = clip.name.toLowerCase();
            const action = this.mixer.clipAction(clip);
            if (name.includes('idle')) this.animations['idle'] = action;
            if (name.includes('walk')) this.animations['walking'] = action;
            if (name.includes('run')) this.animations['running'] = action;
            if (name.includes('jump')) this.animations['jump'] = action;
        });

        Object.keys(this.customClips).forEach(type => {
            this.animations[type] = this.mixer.clipAction(this.customClips[type]);
        });

        if (!this.animations['idle'] && animations.length > 0) this.animations['idle'] = this.mixer.clipAction(animations[0]);

        this.fadeToAction('idle');
    }

    fadeToAction(name, duration = 0.15) {
        if (!this.animations[name]) {
            if (name === 'running' && this.animations['walking']) name = 'walking';
            else return;
        }

        const nextAction = this.animations[name];
        if (this.currentAction === nextAction && nextAction.isRunning()) return;

        if (this.currentAction) {
            this.currentAction.fadeOut(duration);
        }

        this.currentAction = nextAction;

        if (name === 'jump' || name.includes('jump')) {
            this.currentAction.setLoop(THREE.LoopOnce);
            this.currentAction.clampWhenFinished = true;
        } else {
            this.currentAction.setLoop(THREE.LoopRepeat);
        }

        this.currentAction
            .reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(duration)
            .play();
    }

    update(delta, camera) {
        if (this.mixer) this.mixer.update(delta);
        if (Settings.camera.mode === 'free') return;

        const moveX = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
        const moveZ = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);
        const isMoving = moveX !== 0 || moveZ !== 0;
        const isRunning = this.keys.shift;

        if (isMoving) {
            const camForward = new THREE.Vector3();
            camera.getWorldDirection(camForward);
            camForward.y = 0;
            camForward.normalize();

            const camRight = new THREE.Vector3();
            camRight.crossVectors(THREE.Object3D.DEFAULT_UP, camForward);

            const moveVec = new THREE.Vector3();
            moveVec.addScaledVector(camForward, -moveZ);
            moveVec.addScaledVector(camRight, -moveX);
            moveVec.normalize();

            this.physicalRotation = Math.atan2(moveVec.x, moveVec.z);

            const baseSpeed = isRunning ? Settings.player.moveSpeed * 1.8 : Settings.player.moveSpeed;
            const speed = baseSpeed * delta;

            const nextPos = this.group.position.clone().addScaledVector(moveVec, speed);
            const distFromCenter = Math.sqrt(nextPos.x * nextPos.x + nextPos.z * nextPos.z);
            if (distFromCenter < Settings.terrain.size * 7.5) {
                this.group.position.copy(nextPos);
            }

            if (!this.isJumping) {
                this.fadeToAction(isRunning ? 'running' : 'walking');
            }
        } else {
            if (!this.isJumping) {
                this.fadeToAction('idle');
            }
            if (Settings.camera.mode === 'firstperson') {
                const camForward = new THREE.Vector3();
                camera.getWorldDirection(camForward);
                this.physicalRotation = Math.atan2(camForward.x, camForward.z);
            }
        }

        if (this.keys[' '] && !this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = 11;
            this.fadeToAction('jump');
        }

        if (this.isJumping) {
            this.jumpHeight += this.jumpVelocity * delta;
            this.jumpVelocity -= this.gravity * delta;
            if (this.jumpHeight <= 0) {
                this.jumpHeight = 0;
                this.isJumping = false;
                this.fadeToAction(isMoving ? (isRunning ? 'running' : 'walking') : 'idle');
            }
        }

        let rotDiff = this.physicalRotation - this.group.rotation.y;
        rotDiff = Math.atan2(Math.sin(rotDiff), Math.cos(rotDiff));
        this.group.rotation.y += rotDiff * Math.min(1.0, 5 * delta);

        const groundH = this.terrain.getHeight(this.group.position.x, this.group.position.z);
        const targetY = groundH + this.jumpHeight;

        if (groundH < Settings.terrain.waterLevel) {
             this.group.position.y = targetY;
        } else {
             this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, targetY, 15 * delta);
        }
    }

    get position() { return this.group.position; }
}
