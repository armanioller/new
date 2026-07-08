import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class BuildingManager {
    constructor(game) {
        this.game = game;
        this.scene = game.engine.scene;
        this.terrain = game.terrain;
        this.buildings = [];

        this.active = false;
        this.selectedId = null;
        this.ghostMesh = null;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.models = {
            wall: this.createWallModel(),
            floor: this.createFloorModel(),
            fire: this.createFireModel()
        };

        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'b') this.toggleMode();
        });
    }

    createWallModel() {
        const group = new THREE.Group();
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x4a2c2a }));
        post.position.y = 0.6;
        const plank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 0.1), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
        plank.position.y = 0.8;
        group.add(post, plank);
        return group;
    }

    createFloorModel() {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.1, 2),
            new THREE.MeshStandardMaterial({ color: 0x7a7a7a })
        );
        mesh.position.y = 0.05;
        return mesh;
    }

    createFireModel() {
        const group = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        const wood = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.15), new THREE.MeshStandardMaterial({ color: 0x4a2c2a }));
        wood.position.y = 0.2;
        wood.rotation.z = Math.PI / 4;
        group.add(base, wood);
        return group;
    }

    toggleMode(id = null) {
        if (id) {
            this.selectedId = id;
            this.active = true;
        } else {
            this.active = !this.active;
            if (!this.active) this.clearGhost();
        }
    }

    clearGhost() {
        if (this.ghostMesh) {
            this.scene.remove(this.ghostMesh);
            this.ghostMesh = null;
        }
    }

    onMouseMove(e) {
        if (!this.active || !this.selectedId) return;

        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.game.engine.camera);
        const intersects = this.raycaster.intersectObject(this.terrain.floor);

        if (intersects.length > 0) {
            const point = intersects[0].point;

            if (!this.ghostMesh) {
                this.ghostMesh = this.models[this.selectedId].clone();
                this.ghostMesh.traverse(c => {
                    if (c.material) {
                        c.material = c.material.clone();
                        c.material.transparent = true;
                        c.material.opacity = 0.5;
                    }
                });
                this.scene.add(this.ghostMesh);
            }

            // Snapping to grid or terrain
            const gridSize = 1.0;
            const sx = Math.round(point.x / gridSize) * gridSize;
            const sz = Math.round(point.z / gridSize) * gridSize;
            const sy = this.terrain.getHeight(sx, sz);

            this.ghostMesh.position.set(sx, sy, sz);

            // Check if player has resources
            const itemDef = Settings.buildings.items.find(i => i.id === this.selectedId);
            const canAfford = this.game.player.inventory.wood >= itemDef.wood &&
                               this.game.player.inventory.stone >= itemDef.stone;

            this.ghostMesh.traverse(c => {
                if (c.material) c.material.color.set(canAfford ? 0x00ff00 : 0xff0000);
            });
        }
    }

    onMouseDown(e) {
        if (!this.active || !this.selectedId || e.button !== 0) return;
        if (!this.ghostMesh) return;

        const itemDef = Settings.buildings.items.find(i => i.id === this.selectedId);
        const inventory = this.game.player.inventory;

        if (inventory.wood >= itemDef.wood && inventory.stone >= itemDef.stone) {
            // Deduct resources
            inventory.wood -= itemDef.wood;
            inventory.stone -= itemDef.stone;

            // Place permanent mesh
            const built = this.models[this.selectedId].clone();
            built.position.copy(this.ghostMesh.position);
            built.rotation.copy(this.ghostMesh.rotation);

            this.scene.add(built);
            this.buildings.push({ id: this.selectedId, mesh: built });

            this.game.ui.showModal("Construção", `${itemDef.name} construído com sucesso!`, null, false);
        } else {
            this.game.ui.showModal("Erro", "Recursos insuficientes para construir este item.", null, false);
        }
    }
}
