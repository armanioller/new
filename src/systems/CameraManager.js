import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class CameraManager {
    constructor(engine) {
        this.engine = engine;
        this.camera = new THREE.PerspectiveCamera(Settings.camera.fov.isometric, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.engine.camera = this.camera;

        // Use standard Spherical coordinates
        this.spherical = new THREE.Spherical(
            Settings.camera.distance,
            Math.PI / 2 + Settings.camera.rotation.x, // phi (vertical offset from north pole)
            Settings.camera.rotation.y                // theta (horizontal orbit)
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
        this.targetFollowPos = new THREE.Vector3(0, 5, 0);
    }

    onMouseMove(e) {
        const mode = Settings.camera.mode;
        const isPointerLocked = document.pointerLockElement === this.engine.renderer.domElement;
        const canRotate = this.isRightMouseDown || isPointerLocked || mode === 'free';

        if (canRotate) {
            const sensitivity = 0.003;

            this.spherical.theta -= e.movementX * sensitivity;
            this.spherical.phi -= e.movementY * sensitivity;

            // Constraints
            const phiMin = 0.1;
            const phiMax = Math.PI - 0.1;
            this.spherical.phi = THREE.MathUtils.clamp(this.spherical.phi, phiMin, phiMax);
        }
    }

    update(delta, player) {
        const camSet = Settings.camera;
        const pPos = player ? player.position.clone() : new THREE.Vector3(0, 0, 0);

        // Safety check
        if (isNaN(pPos.x)) pPos.set(0, 0, 0);

        // Update FOV based on mode
        const targetFov = camSet.fov[camSet.mode] || 75;
        if (this.camera.fov !== targetFov) {
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.1);
            this.camera.updateProjectionMatrix();
        }

        // Smoothly follow player
        this.targetFollowPos.copy(pPos);
        this.currentFollowPos.lerp(this.targetFollowPos, 0.1);

        switch (camSet.mode) {
            case 'isometric':
                this.updateIsometric(camSet);
                break;
            case 'thirdperson':
                this.updateThirdPerson(camSet);
                break;
            case 'firstperson':
                this.updateFirstPerson();
                break;
            case 'free':
                this.updateFreeMode();
                break;
        }
    }

    updateIsometric(camSet) {
        // Fixed Vertical Angle for Isometric
        // phi is 0 (up) to PI (down). ISO is ~35.26 from horizontal.
        // Horizontal is PI/2. ISO is PI/2 + 0.615
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
        this.camera.position.copy(this.targetFollowPos);
        this.camera.position.y += 1.7; // Standard Eye Level

        this.camera.rotation.order = 'YXZ';
        // In FP, rotation is theta and phi directly
        // phi here is from top, so we subtract PI/2
        this.camera.rotation.set(Math.PI / 2 - this.spherical.phi, this.spherical.theta, 0);

        // Offset forward
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
        // Return theta for WASD movement relative to camera
        return this.spherical.theta;
    }
}
