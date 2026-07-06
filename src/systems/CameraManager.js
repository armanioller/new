import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class CameraManager {
    constructor(engine) {
        this.engine = engine;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.engine.camera = this.camera;

        // Internal state for orbit/rotation (Spherical Coordinates)
        // theta: horizontal rotation (around Y axis)
        // phi: vertical rotation (elevation)
        this.theta = Settings.camera.rotation.y;
        this.phi = Settings.camera.rotation.x;

        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        this.isRightMouseDown = false;

        const canvas = this.engine.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 2) this.isRightMouseDown = true;
            if (e.button === 0 && Settings.camera.mode === 'firstperson') {
                canvas.requestPointerLock();
            }
        });

        window.addEventListener('mouseup', (e) => { if (e.button === 2) this.isRightMouseDown = false; });
        window.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        this.currentFollowPos = new THREE.Vector3();
    }

    onMouseMove(e) {
        const mode = Settings.camera.mode;
        const isPointerLocked = document.pointerLockElement === this.engine.renderer.domElement;
        const canRotate = this.isRightMouseDown || isPointerLocked || mode === 'free';

        if (canRotate) {
            const sensitivity = 0.003;
            // standard FPS/ThirdPerson behavior: movementX rotates around Y (theta), movementY rotates around X (phi)
            this.theta -= e.movementX * sensitivity;
            this.phi -= e.movementY * sensitivity;

            // Global phi clamping to avoid gimbal lock/flipping
            const limit = Math.PI / 2 - 0.05;
            this.phi = Math.max(-limit, Math.min(limit, this.phi));
        }
    }

    update(delta, player) {
        const camSet = Settings.camera;
        const pPos = player ? player.position.clone() : new THREE.Vector3();

        // Smooth target tracking for the camera focus point
        const lerpFactor = 0.1;
        this.currentFollowPos.lerp(pPos, lerpFactor);

        switch (camSet.mode) {
            case 'isometric':
                this.updateIsometric(camSet);
                break;
            case 'thirdperson':
                this.updateThirdPerson(camSet, pPos);
                break;
            case 'firstperson':
                this.updateFirstPerson(pPos);
                break;
            case 'free':
                this.updateFreeMode();
                break;
        }
    }

    updateIsometric(camSet) {
        // Isometric: Fixed vertical angle (approx 35.26 deg) but allow horizontal orbit
        const isoPhi = -0.615;
        const dist = camSet.distance;

        // Calculate position based on theta (user orbit) and fixed isoPhi
        const x = this.currentFollowPos.x + dist * Math.sin(this.theta) * Math.cos(isoPhi);
        const y = this.currentFollowPos.y + dist * Math.sin(-isoPhi);
        const z = this.currentFollowPos.z + dist * Math.cos(this.theta) * Math.cos(isoPhi);

        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.currentFollowPos.x, this.currentFollowPos.y + camSet.verticalOffset, this.currentFollowPos.z);
    }

    updateThirdPerson(camSet, pPos) {
        const dist = camSet.distance;
        // Third Person: True spherical orbit around the player
        // We use this.phi for elevation
        const x = pPos.x + dist * Math.sin(this.theta) * Math.cos(this.phi);
        const y = pPos.y + camSet.verticalOffset + dist * Math.sin(this.phi);
        const z = pPos.z + dist * Math.cos(this.theta) * Math.cos(this.phi);

        this.camera.position.set(x, y, z);
        this.camera.lookAt(pPos.x, pPos.y + camSet.verticalOffset, pPos.z);
    }

    updateFirstPerson(pPos) {
        this.camera.position.copy(pPos);
        this.camera.position.y += 1.6; // Eye level

        // First Person: Rotation is direct from theta/phi
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.set(this.phi, this.theta, 0);

        // Offset slightly forward to avoid clipping through the player mesh
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.camera.position.add(forward.multiplyScalar(0.2));
    }

    updateFreeMode() {
        const speed = 0.5;
        const moveX = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
        const moveZ = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);
        const moveY = (this.keys.q || this.keys.pageup ? 1 : 0) - (this.keys.e || this.keys.pagedown ? 1 : 0);

        // Movement is relative to current rotation
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.phi, this.theta, 0, 'YXZ'));
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q);

        this.camera.position.add(forward.multiplyScalar(-moveZ * speed));
        this.camera.position.add(right.multiplyScalar(moveX * speed));
        this.camera.position.y += moveY * speed;

        this.camera.rotation.set(this.phi, this.theta, 0, 'YXZ');
    }

    getYRotation() {
        return this.theta;
    }
}
