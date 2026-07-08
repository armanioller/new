import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class ResourceManager {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.resources = [];
        this.init();
    }

    init() {
        // Cleanup old resources
        this.resources.forEach(res => {
            this.scene.remove(res.mesh);
        });
        this.resources = [];

        // Spawn Trees
        for (let i = 0; i < Settings.resources.maxTrees; i++) {
            this.spawnResource('wood');
        }

        // Spawn Rocks
        for (let i = 0; i < Settings.resources.maxRocks; i++) {
            this.spawnResource('stone');
        }
    }

    spawnResource(type) {
        const radius = Settings.resources.spawnRadius;
        const x = (Math.random() - 0.5) * radius * 2;
        const z = (Math.random() - 0.5) * radius * 2;

        const h = this.terrain.getHeight(x, z);

        // Only spawn on high enough ground (not in water)
        if (h > Settings.resources.minSpawnHeight) {
            const mesh = this.createResourceMesh(type);
            mesh.position.set(x, h, z);
            mesh.rotation.y = Math.random() * Math.PI * 2;

            // Random scale variation
            const s = 0.8 + Math.random() * 0.4;
            mesh.scale.set(s, s, s);

            this.scene.add(mesh);
            this.resources.push({ mesh, type, id: Math.random() });
        }
    }

    createResourceMesh(type) {
        const group = new THREE.Group();

        if (type === 'wood') {
            // Trunk
            const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2c2a });
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 1;
            trunk.castShadow = true;
            group.add(trunk);

            // Leaves (Low poly style)
            const leavesGeo = new THREE.IcosahedronGeometry(1, 0);
            const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.y = 2.2;
            leaves.castShadow = true;
            group.add(leaves);
        } else {
            // Rock
            const rockGeo = new THREE.IcosahedronGeometry(0.6, 0);
            const rockMat = new THREE.MeshStandardMaterial({ color: 0x777777 });
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.y = 0.3;
            rock.castShadow = true;
            rock.scale.set(1, 0.7, 1);
            group.add(rock);
        }

        return group;
    }

    harvestAt(position, maxDistance) {
        let nearestIdx = -1;
        let minDist = maxDistance;

        for (let i = 0; i < this.resources.length; i++) {
            const d = position.distanceTo(this.resources[i].mesh.position);
            if (d < minDist) {
                minDist = d;
                nearestIdx = i;
            }
        }

        if (nearestIdx !== -1) {
            const res = this.resources[nearestIdx];
            this.scene.remove(res.mesh);
            this.resources.splice(nearestIdx, 1);

            // Re-spawn a new resource elsewhere to keep world populated
            this.spawnResource(res.type);

            return res.type;
        }

        return null;
    }
}
