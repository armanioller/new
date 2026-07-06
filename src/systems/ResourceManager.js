import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class ResourceManager {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.resources = [];

        this.models = {
            wood: this.createTreeModel(), // Map 'wood' to tree
            stone: this.createRockModel()  // Map 'stone' to rock
        };

        this.spawnAll();
    }

    createTreeModel() {
        const group = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.4, 2, 6),
            new THREE.MeshStandardMaterial({ color: 0x4a2c2a, flatShading: true })
        );
        trunk.position.y = 1;

        const leaves1 = new THREE.Mesh(
            new THREE.ConeGeometry(1.2, 1.5, 6),
            new THREE.MeshStandardMaterial({ color: 0x2d5a27, flatShading: true })
        );
        leaves1.position.y = 2.2;

        const leaves2 = new THREE.Mesh(
            new THREE.ConeGeometry(0.8, 1.2, 6),
            new THREE.MeshStandardMaterial({ color: 0x3d7a37, flatShading: true })
        );
        leaves2.position.y = 3;

        group.add(trunk, leaves1, leaves2);
        group.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        return group;
    }

    createRockModel() {
        const group = new THREE.Group();
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.6, 0),
            new THREE.MeshStandardMaterial({ color: 0x7a7a7a, flatShading: true })
        );
        rock.scale.set(1, 0.6, 1.2);
        group.add(rock);
        group.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
        return group;
    }

    spawnAll() {
        this.clear();
        for (let i = 0; i < Settings.resources.maxTrees; i++) this.spawn('wood');
        for (let i = 0; i < Settings.resources.maxRocks; i++) this.spawn('stone');
    }

    clear() {
        this.resources.forEach(r => this.scene.remove(r.mesh));
        this.resources = [];
    }

    spawn(type) {
        const radius = Settings.resources.spawnRadius;
        const x = (Math.random() - 0.5) * radius * 2;
        const z = (Math.random() - 0.5) * radius * 2;
        const h = this.terrain.getHeight(x, z);

        if (h > Settings.resources.minSpawnHeight) {
            const mesh = this.models[type].clone();
            mesh.position.set(x, h, z);
            mesh.rotation.y = Math.random() * Math.PI * 2;
            const s = 0.8 + Math.random() * 0.4;
            mesh.scale.set(s, s, s);

            this.scene.add(mesh);
            this.resources.push({ type, mesh, health: 100 });
        } else {
            if (this.resources.length < (Settings.resources.maxTrees + Settings.resources.maxRocks)) {
                setTimeout(() => this.spawn(type), 1);
            }
        }
    }

    harvestAt(position, radius = 2) {
        let harvested = null;
        for (let i = this.resources.length - 1; i >= 0; i--) {
            const res = this.resources[i];
            const dist = position.distanceTo(res.mesh.position);
            if (dist < radius) {
                res.health -= 50;

                const originalX = res.mesh.position.x;
                res.mesh.position.x += (Math.random() - 0.5) * 0.2;
                setTimeout(() => {
                    if (res.mesh) res.mesh.position.x = originalX;
                }, 50);

                if (res.health <= 0) {
                    this.scene.remove(res.mesh);
                    harvested = res.type; // Returns 'wood' or 'stone'
                    this.resources.splice(i, 1);
                    setTimeout(() => this.spawn(res.type), 10000);
                }
                break;
            }
        }
        return harvested;
    }
}
