import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class Terrain {
    constructor(scene) {
        this.scene = scene;
        this.floor = null;
        this.water = null; // Inner water mesh
        this.waterGroup = null;
        this.skydome = null;

        this.floorMaterial = new THREE.MeshStandardMaterial({
            vertexColors: true,
            flatShading: Settings.terrain.triangulated
        });

        this.waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x004466,
            transparent: true,
            opacity: Settings.water.opacity,
            flatShading: true,
            roughness: 0.1,
            metalness: 0.2
        });

        this.init();
    }

    init() {
        const { size, quality } = Settings.terrain;

        if (this.floor) { this.scene.remove(this.floor); this.floor.geometry.dispose(); }
        if (this.waterGroup) { this.scene.remove(this.waterGroup); }
        const oldSky = this.scene.getObjectByName("skydome");
        if (oldSky) { this.scene.remove(oldSky); oldSky.geometry.dispose(); }

        // Create Island
        const floorGeometry = new THREE.PlaneGeometry(size * 2, size * 2, quality, quality);
        const vertices = floorGeometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];

            const maxRadius = size;
            const dist = Math.sqrt(x * x + y * y);
            const edgeFactor = Math.pow(Math.max(0, 1 - dist / maxRadius), 2);

            let height = (Math.sin(x * 0.15) + Math.cos(y * 0.15)) * 2.5;
            height += (Math.sin(x * 0.4) * Math.cos(y * 0.4)) * 1.5;

            vertices[i + 2] = (height * edgeFactor) + (1 - edgeFactor) * -15;
        }

        floorGeometry.computeVertexNormals();
        floorGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(floorGeometry.attributes.position.count * 3), 3));

        this.floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        // SMART WATER SYSTEM
        this.waterGroup = new THREE.Group();
        this.waterGroup.name = "water-system";

        // 1. Inner high-detail water for waves (covers immediate area)
        const innerSize = Math.max(size * 5, 500);
        const waterGeo = new THREE.PlaneGeometry(innerSize, innerSize, 100, 100);
        this.waterInitialPositions = waterGeo.attributes.position.array.slice();
        this.water = new THREE.Mesh(waterGeo, this.waterMaterial);
        this.water.name = "water-inner";
        this.water.receiveShadow = true;
        this.waterGroup.add(this.water);

        // 2. Outer massive circle for horizon (infinite look)
        const outerGeo = new THREE.CircleGeometry(8500, 32);
        const outerWater = new THREE.Mesh(outerGeo, this.waterMaterial);
        outerWater.name = "water-outer";
        outerWater.position.z = -0.05; // Slightly lower to avoid z-fighting
        this.waterGroup.add(outerWater);

        this.waterGroup.rotation.x = -Math.PI / 2;
        this.waterGroup.position.y = Settings.terrain.waterLevel;
        this.scene.add(this.waterGroup);

        // Skydome
        const skyGeo = new THREE.SphereGeometry(8000, 32, 15);
        const skyMat = new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
            transparent: true,
            opacity: 1
        });
        this.skydome = new THREE.Mesh(skyGeo, skyMat);
        this.skydome.name = "skydome";
        this.scene.add(this.skydome);

        this.updateVisuals();
    }

    updateVisuals() {
        if (!this.floor) return;
        const geo = this.floor.geometry;
        const vertices = geo.attributes.position.array;
        const colors = geo.attributes.color.array;

        const dirtColor = Settings.terrain.colors.dirt;
        const grassColor = Settings.terrain.colors.grass;
        const seaColor = Settings.terrain.colors.sea;
        const underwaterColor = seaColor.clone().multiplyScalar(0.3);

        for (let i = 0; i < vertices.length; i += 3) {
            const height = vertices[i + 2];
            let color;

            if (height < Settings.terrain.waterLevel + 0.3) {
                const depth = Math.abs(height - Settings.terrain.waterLevel);
                color = underwaterColor.clone().lerp(dirtColor, Math.max(0, 1 - depth * 0.5));
            } else if (height < Settings.terrain.grassLevel) {
                color = dirtColor;
            } else {
                color = grassColor;
            }

            colors[i] = color.r;
            colors[i+1] = color.g;
            colors[i+2] = color.b;
        }
        geo.attributes.color.needsUpdate = true;

        if (this.waterGroup) {
            this.waterGroup.position.y = Settings.terrain.waterLevel;
        }

        this.floorMaterial.flatShading = Settings.terrain.triangulated;
        this.floorMaterial.needsUpdate = true;
        this.waterMaterial.opacity = Settings.water.opacity;
        this.waterMaterial.color.copy(seaColor);
    }

    getHeight(x, z) {
        if (!this.floor) return 0;
        const raycaster = new THREE.Raycaster(
            new THREE.Vector3(x, 100, z),
            new THREE.Vector3(0, -1, 0)
        );
        const intersects = raycaster.intersectObject(this.floor);
        return (intersects.length > 0) ? intersects[0].point.y : Settings.terrain.waterLevel - 1;
    }

    updateWater(time) {
        if (!this.water) return;

        const positions = this.water.geometry.attributes.position.array;
        const initial = this.waterInitialPositions;
        const speed = Settings.water.speed;
        const intensity = Settings.water.intensity;
        const t = time * 0.001;

        for (let i = 0; i < positions.length; i += 3) {
            const x = initial[i];
            const y = initial[i+1];

            // Chunky low-poly waves
            const wave1 = Math.sin(x * 0.08 + t * speed) * intensity;
            const wave2 = Math.cos(y * 0.08 + t * speed * 0.7) * intensity;
            positions[i + 2] = initial[i + 2] + wave1 + wave2;
        }

        this.water.geometry.attributes.position.needsUpdate = true;
    }
}
