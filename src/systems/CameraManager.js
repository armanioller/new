import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class CameraManager {
    constructor(engine) {
        this.engine = engine;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.engine.camera = this.camera;

        this.rotation = { ...Settings.camera.rotation };
        this.targetRotation = { ...this.rotation };

        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        this.isRightMouseDown = false;
        window.addEventListener('mousedown', (e) => { if (e.button === 2) this.isRightMouseDown = true; });
        window.addEventListener('mouseup', (e) => { if (e.button === 2) this.isRightMouseDown = false; });
        window.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        this.currentFollowY = 0;
    }

    onMouseMove(e) {
        const mode = Settings.camera.mode;
        const isControlMode = this.isRightMouseDown || mode === 'firstperson' || mode === 'thirdperson' || mode === 'free';

        if (isControlMode) {
            // Fix: Mouse rotation direction (now correct)
            this.rotation.y += e.movementX * 0.005;
            this.rotation.x -= e.movementY * 0.005;
            this.rotation.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.rotation.x));
        }
    }

    update(delta, player) {
        const camSet = Settings.camera;
        const pPos = player ? player.position : new THREE.Vector3();

        // Keyboard rotation
        if (this.keys.arrowleft) this.rotation.y += 0.03;
        if (this.keys.arrowright) this.rotation.y -= 0.03;
        if (this.keys.arrowup) this.rotation.x += 0.03;
        if (this.keys.arrowdown) this.rotation.x -= 0.03;
        this.rotation.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.rotation.x));

        switch (camSet.mode) {
            case 'isometric':
                // Use a heavy lerp for Y to stabilize height on uneven terrain
                const targetY = pPos.y;
                if (isNaN(this.currentFollowY)) this.currentFollowY = targetY;
                this.currentFollowY = THREE.MathUtils.lerp(this.currentFollowY, targetY, 0.05);

                const isoX = pPos.x + Math.sin(this.rotation.y) * camSet.distance;
                const isoZ = pPos.z + Math.cos(this.rotation.y) * camSet.distance;

                this.camera.position.set(isoX, this.currentFollowY + camSet.height, isoZ);
                this.camera.lookAt(pPos.x, this.currentFollowY + camSet.verticalOffset, pPos.z);
                break;

            case 'thirdperson':
                const orbitDist = camSet.distance;
                const theta3 = this.rotation.y;
                // Clamp X rotation to avoid flipping or going under ground too much
                const phi3 = Math.max(-Math.PI / 3, Math.min(Math.PI / 4, this.rotation.x));

                const camX3 = pPos.x + orbitDist * Math.sin(theta3) * Math.cos(phi3);
                const camY3 = pPos.y + camSet.verticalOffset + orbitDist * Math.sin(phi3);
                const camZ3 = pPos.z + orbitDist * Math.cos(theta3) * Math.cos(phi3);

                this.camera.position.set(camX3, camY3, camZ3);
                this.camera.lookAt(pPos.x, pPos.y + camSet.verticalOffset, pPos.z);
                break;

            case 'firstperson':
                // Reset rotation order for FPS
                this.camera.rotation.order = 'YXZ';

                this.camera.position.copy(pPos);
                this.camera.position.y += 1.6; // Eye level

                // Set rotation
                this.camera.rotation.set(this.rotation.x, this.rotation.y, 0);

                // Move camera slightly forward so we don't see inside the mesh
                const fpForward = new THREE.Vector3(0, 0, -0.15).applyQuaternion(this.camera.quaternion);
                this.camera.position.add(fpForward);
                break;

            case 'free':
                const f_moveX = (this.keys.d ? 1 : 0) - (this.keys.a ? 1 : 0);
                const f_moveZ = (this.keys.s ? 1 : 0) - (this.keys.w ? 1 : 0);
                const f_moveY = (this.keys.q || this.keys.pageup ? 1 : 0) - (this.keys.e || this.keys.pagedown ? 1 : 0);

                const moveForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                const moveRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);

                this.camera.position.add(moveForward.multiplyScalar(-f_moveZ * 0.4));
                this.camera.position.add(moveRight.multiplyScalar(f_moveX * 0.4));
                this.camera.position.y += f_moveY * 0.4;
                this.camera.rotation.set(this.rotation.x, this.rotation.y, 0, 'YXZ');
                break;
        }
    }
}
