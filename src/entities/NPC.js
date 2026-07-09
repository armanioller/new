import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class NPC {
    constructor(scene, terrain, position = new THREE.Vector3()) {
        this.scene = scene;
        this.terrain = terrain;
        this.group = new THREE.Group();
        this.group.position.copy(position);
        this.scene.add(this.group);

        this.mixer = null;
        this.animations = {};
        this.currentAction = null;

        // AI State
        this.state = 'idle'; // idle, wandering
        this.stateTimer = 0;
        this.targetPos = new THREE.Vector3();
        this.moveSpeed = 2.0;

        this.loadModel();
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb', (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.35, 0.35, 0.35); // Slightly smaller than player

            // Random tint for differentiation (simple approach: traverse and change material color)
            const randomColor = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);
            model.traverse(c => {
                if(c.isMesh) {
                    c.castShadow = true;
                    if (c.name.includes('Body')) {
                         c.material = c.material.clone();
                         c.material.color.lerp(randomColor, 0.3);
                    }
                }
            });

            this.group.add(model);
            this.mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach(clip => {
                this.animations[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
            });
            this.fadeToAction('idle');
        });
    }

    fadeToAction(name, duration = 0.5) {
        if (!this.animations[name]) return;
        const nextAction = this.animations[name];
        if (this.currentAction === nextAction && nextAction.isRunning()) return;

        if (this.currentAction) this.currentAction.fadeOut(duration);
        this.currentAction = nextAction;
        this.currentAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
    }

    update(delta) {
        if (this.mixer) this.mixer.update(delta);

        this.stateTimer -= delta;

        if (this.state === 'idle') {
            if (this.stateTimer <= 0) {
                this.startWandering();
            }
        } else if (this.state === 'wandering') {
            this.moveTowardsTarget(delta);
            if (this.group.position.distanceTo(this.targetPos) < 0.5 || this.stateTimer <= 0) {
                this.startIdling();
            }
        }

        // Stick to terrain
        const h = this.terrain.getHeight(this.group.position.x, this.group.position.z);
        this.group.position.y = THREE.MathUtils.lerp(this.group.position.y, h, 10 * delta);
    }

    startIdling() {
        this.state = 'idle';
        this.stateTimer = 2 + Math.random() * 5; // Idle for 2-7 seconds
        this.fadeToAction('idle');
    }

    startWandering() {
        this.state = 'wandering';
        this.stateTimer = 10; // Max wandering time

        // Pick a random direction within a radius
        const angle = Math.random() * Math.PI * 2;
        const dist = 3 + Math.random() * 7;
        this.targetPos.set(
            this.group.position.x + Math.cos(angle) * dist,
            0,
            this.group.position.z + Math.sin(angle) * dist
        );

        // Clamp to island boundaries (simplified)
        const maxDist = 20;
        if (this.targetPos.length() > maxDist) {
            this.targetPos.normalize().multiplyScalar(maxDist);
        }

        this.fadeToAction('walking');
    }

    moveTowardsTarget(delta) {
        const direction = new THREE.Vector3().subVectors(this.targetPos, this.group.position);
        direction.y = 0;
        direction.normalize();

        // Rotate towards target
        const targetRot = Math.atan2(direction.x, direction.z);
        let diff = targetRot - this.group.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.group.rotation.y += diff * 5 * delta;

        // Move
        const step = direction.multiplyScalar(this.moveSpeed * delta);
        this.group.position.add(step);
    }
}
