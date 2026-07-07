import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class CameraManager {
    constructor(engine) {
        this.engine = engine;
        this.camera = new THREE.PerspectiveCamera(Settings.camera.fov.isometric, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.engine.camera = this.camera;

        this.spherical = new THREE.Spherical(
            Settings.camera.distance,
            Math.PI / 2 + Settings.camera.rotation.x,
            Settings.camera.rotation.y
        );

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

        this.currentFollowPos = new THREE.Vector3(0, 5, 0);

        // State tracking
        this.prevMode = null;
    }

    onMouseMove(e) {
        const mode = Settings.camera.mode;
        const isPointerLocked = document.pointerLockElement === this.engine.renderer.domElement;
        const canRotate = this.isRightMouseDown || isPointerLocked || mode === 'free';

        if (canRotate) {
            const sensitivity = 0.003;
            this.spherical.theta -= e.movementX * sensitivity;

            // In Third Person, we might want to allow free look if mouse is down,
            // but the request is "always behind". We'll allow override and then snap back or let it follow.
            this.spherical.phi -= e.movementY * sensitivity;

            const limit = 0.1;
            this.spherical.phi = THREE.MathUtils.clamp(this.spherical.phi, limit, Math.PI - limit);
        }
    }

    update(delta, player) {
        const camSet = Settings.camera;
        const pPos = player ? player.position.clone() : new THREE.Vector3(0, 0, 0);

        if (isNaN(pPos.x)) pPos.set(0, 0, 0);

        // Mode Transition Logic
        if (this.prevMode !== camSet.mode) {
            this.onModeChange(camSet.mode, player);
            this.prevMode = camSet.mode;
        }

        const targetFov = camSet.fov[camSet.mode] || 75;
        if (this.camera.fov !== targetFov) {
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.1);
            this.camera.updateProjectionMatrix();
        }

        switch (camSet.mode) {
            case 'isometric':
                // RIGID FOLLOW: No lerp, camera is static relative to player
                this.currentFollowPos.copy(pPos);
                this.updateIsometric(camSet);
                break;
            case 'thirdperson':
                // Chase logic: theta follows player rotation smoothly
                if (player) {
                    const playerRotY = player.group.rotation.y;
                    // Standard: theta should be playerRotY + PI (to be behind)
                    let targetTheta = playerRotY + Math.PI;

                    // Only auto-follow if not manually orbiting
                    if (!this.isRightMouseDown) {
                        let diff = targetTheta - this.spherical.theta;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        this.spherical.theta += diff * 0.05;
                    }
                }

                this.currentFollowPos.lerp(pPos, 0.1);
                this.updateThirdPerson(camSet);
                break;
            case 'firstperson':
                this.currentFollowPos.copy(pPos);
                this.updateFirstPerson();
                break;
            case 'free':
                this.updateFreeMode();
                break;
        }
    }

    onModeChange(newMode, player) {
        if (!player) return;

        // Handle model visibility
        if (newMode === 'firstperson') {
            player.group.visible = false;
        } else {
            player.group.visible = true;
        }

        // Reset rotation for certain modes if needed
        if (newMode === 'isometric') {
            this.spherical.theta = Settings.camera.rotation.y;
        }
    }

    updateIsometric(camSet) {
        const isoPhi = Math.PI / 2 + 0.615;
        this.spherical.radius = camSet.distance;

        const pos = new THREE.Vector3().setFromSphericalCoords(
            this.spherical.radius,
            isoPhi,
            this.spherical.theta
        );

        this.camera.position.copy(this.currentFollowPos).add(pos);
        this.camera.lookAt(this.currentFollowPos.x, this.currentFollowPos.y + camSet.verticalOffset, this.currentFollowPos.z);
    }

    updateThirdPerson(camSet) {
        this.spherical.radius = camSet.distance;

        const pos = new THREE.Vector3().setFromSphericalCoords(
            this.spherical.radius,
            this.spherical.phi,
            this.spherical.theta
        );

        this.camera.position.copy(this.currentFollowPos).add(pos);
        this.camera.lookAt(this.currentFollowPos.x, this.currentFollowPos.y + camSet.verticalOffset, this.currentFollowPos.z);
    }

    updateFirstPerson() {
        this.camera.position.copy(this.currentFollowPos);
        this.camera.position.y += 1.7;

        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.set(Math.PI / 2 - this.spherical.phi, this.spherical.theta, 0);

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        this.camera.position.add(forward.multiplyScalar(0.25));
    }

    updateFreeMode() {
        const speed = 0.5;
        const moveX = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
        const moveZ = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);
        const moveY = (this.keys.q || this.keys.pageup ? 1 : 0) - (this.keys.e || this.keys.pagedown ? 1 : 0);

        const rot = new THREE.Euler(Math.PI / 2 - this.spherical.phi, this.spherical.theta, 0, 'YXZ');
        const q = new THREE.Quaternion().setFromEuler(rot);

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q);

        this.camera.position.add(forward.multiplyScalar(-moveZ * speed));
        this.camera.position.add(right.multiplyScalar(moveX * speed));
        this.camera.position.y += moveY * speed;

        this.camera.rotation.copy(rot);
    }

    getYRotation() {
        return this.spherical.theta;
    }
}
