import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class CameraManager {
    constructor(engine) {
        this.engine = engine;
        // Corrected Three.js import version should be handled via package.json or a valid CDN
        this.camera = new THREE.PerspectiveCamera(Settings.camera.fov.isometric, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.engine.camera = this.camera;

        // Internal state for Yaw (horizontal) and Pitch (vertical)
        this.yaw = Settings.camera.rotation.y;
        this.pitch = Settings.camera.rotation.x;

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

        this.prevMode = null;
    }

    onMouseMove(e) {
        const mode = Settings.camera.mode;
        const isPointerLocked = document.pointerLockElement === this.engine.renderer.domElement;
        const canRotate = this.isRightMouseDown || isPointerLocked || mode === 'free';

        if (canRotate && mode !== 'isometric') {
            const sensitivity = 0.002;
            this.yaw -= e.movementX * sensitivity;
            this.pitch -= e.movementY * sensitivity;

            const limit = (Math.PI / 2) * 0.95;
            this.pitch = THREE.MathUtils.clamp(this.pitch, -limit, limit);
        }
    }

    update(delta, player) {
        const camSet = Settings.camera;
        const pPos = player ? player.position.clone() : new THREE.Vector3(0, 5, 0);

        if (this.prevMode !== camSet.mode) {
            this.onModeChange(camSet.mode, player);
            this.prevMode = camSet.mode;
        }

        const targetFov = camSet.fov[camSet.mode] || 75;
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 10 * delta);
        this.camera.updateProjectionMatrix();

        switch (camSet.mode) {
            case 'isometric':
                this.updateIsometric(pPos);
                break;
            case 'thirdperson':
                this.updateThirdPerson(pPos, player, delta);
                break;
            case 'firstperson':
                this.updateFirstPerson(pPos);
                break;
            case 'free':
                this.updateFreeMode(delta);
                break;
        }
    }

    onModeChange(newMode, player) {
        if (player) player.group.visible = (newMode !== 'firstperson');

        if (newMode === 'isometric') {
            this.yaw = Settings.camera.rotation.y;
            this.pitch = Settings.camera.rotation.x;
        }
    }

    updateIsometric(pPos) {
        const isoYaw = 0.785;
        const isoPitch = -0.615;
        const dist = Settings.camera.distance;

        const x = pPos.x + dist * Math.sin(isoYaw) * Math.cos(isoPitch);
        const y = pPos.y + dist * Math.sin(-isoPitch) + Settings.camera.verticalOffset;
        const z = pPos.z + dist * Math.cos(isoYaw) * Math.cos(isoPitch);

        this.camera.position.set(x, y, z);
        this.camera.lookAt(pPos.x, pPos.y + Settings.camera.verticalOffset, pPos.z);
    }

    updateThirdPerson(pPos, player, delta) {
        if (player && !this.isRightMouseDown) {
            const playerRotY = player.physicalRotation;
            let targetYaw = playerRotY + Math.PI;

            let yawDiff = targetYaw - this.yaw;
            yawDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff));
            this.yaw += yawDiff * Math.min(1.0, 5.0 * delta);
        }

        const dist = Settings.camera.distance;
        const x = pPos.x + dist * Math.sin(this.yaw) * Math.cos(this.pitch);
        const y = pPos.y + dist * Math.sin(-this.pitch) + Settings.camera.verticalOffset;
        const z = pPos.z + dist * Math.cos(this.yaw) * Math.cos(this.pitch);

        this.camera.position.set(x, y, z);

        const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, player ? player.physicalRotation : 0, 0));
        const lookTarget = pPos.clone().add(forward.multiplyScalar(2));
        lookTarget.y += Settings.camera.verticalOffset;

        this.camera.lookAt(lookTarget);
    }

    updateFirstPerson(pPos) {
        this.camera.position.set(pPos.x, pPos.y + Settings.camera.eyeHeight, pPos.z);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.set(this.pitch, this.yaw, 0);

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.camera.position.add(forward.multiplyScalar(0.1));
    }

    updateFreeMode(delta) {
        const speed = 20 * delta;
        const moveX = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
        const moveZ = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);
        const moveY = (this.keys.pageup ? 1 : 0) - (this.keys.pagedown ? 1 : 0);

        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.set(this.pitch, this.yaw, 0);

        // Handle rotation with arrows in Free mode as per Master Guide
        const rotSpeed = 2 * delta;
        if (this.keys.arrowleft) this.yaw += rotSpeed;
        if (this.keys.arrowright) this.yaw -= rotSpeed;
        if (this.keys.arrowup) this.pitch += rotSpeed;
        if (this.keys.arrowdown) this.pitch -= rotSpeed;
        this.pitch = THREE.MathUtils.clamp(this.pitch, -1.5, 1.5);

        const q = new THREE.Quaternion().setFromEuler(this.camera.rotation);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q);

        this.camera.position.add(forward.multiplyScalar(-moveZ * speed));
        this.camera.position.add(right.multiplyScalar(moveX * speed));
        this.camera.position.y += moveY * speed;
    }

    // Required by Game.js
    getYRotation() {
        return this.yaw;
    }
}
