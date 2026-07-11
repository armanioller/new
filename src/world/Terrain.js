import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class Terrain {
    constructor(scene) {
        this.scene = scene;
        this.floor = null;
        this.water = null;
        this.skydome = null;

        this.floorMaterial = new THREE.MeshStandardMaterial({
            vertexColors: true,
            flatShading: Settings.terrain.triangulated
        });

        this.waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x004466,
            transparent: true,
            opacity: Settings.water.opacity,
            roughness: 0.1,
            metalness: 0.1,
            flatShading: false
        });

        this._tempColor = new THREE.Color();
        this._depthColor = new THREE.Color(0x000102);

        this.init();
    }

    init() {
        const { size, quality, seaDepth } = Settings.terrain;

        if (this.floor) { this.scene.remove(this.floor); this.floor.geometry.dispose(); }
        if (this.water) { this.scene.remove(this.water); this.water.geometry.dispose(); }
        const oldSky = this.scene.getObjectByName("skydome");
        if (oldSky) { this.scene.remove(oldSky); oldSky.geometry.dispose(); }

        const floorSize = size * 15;
        const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize, quality + 25, quality + 25);
        const vertices = floorGeometry.attributes.position.array;

        const maxRadius = floorSize / 2;
        const dropStart = maxRadius * 0.95;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];

            const dist = Math.sqrt(x * x + y * y);
            const islandRadius = size * 1.5;

            let height = 0;

            if (dist < islandRadius * 4) {
                const edgeFactor = Math.pow(Math.max(0, 1 - dist / (islandRadius * 3.5)), 2.0);
                height = (Math.sin(x * 0.15) + Math.cos(y * 0.15)) * 2.5;
                height += (Math.sin(x * 0.4) * Math.cos(y * 0.4)) * 1.5;
                height = (height * edgeFactor) + (1 - edgeFactor) * seaDepth;
            } else {
                height = seaDepth;
            }

            // Steep drop-off to hide mesh boundary
            if (dist > dropStart) {
                const dropFactor = (dist - dropStart) / (maxRadius - dropStart);
                height = THREE.MathUtils.lerp(height, -500, Math.pow(dropFactor, 2.0));
            }

            vertices[i + 2] = height;
        }

        floorGeometry.computeVertexNormals();
        floorGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(floorGeometry.attributes.position.count * 3), 3));

        this.floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        const waterGeo = new THREE.CircleGeometry(10000, 64);
        this.water = new THREE.Mesh(waterGeo, this.waterMaterial);
        this.water.name = "water";
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = Settings.terrain.waterLevel;
        this.water.receiveShadow = true;
        this.scene.add(this.water);

        const skyGeo = new THREE.SphereGeometry(9500, 32, 15);
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

    updateVisuals(fogColor = null) {
        if (!this.floor) return;
        const geo = this.floor.geometry;
        const vertices = geo.attributes.position.array;
        const colors = geo.attributes.color.array;

        const dirtColor = Settings.terrain.colors.dirt;
        const grassColor = Settings.terrain.colors.grass;
        const seaColor = Settings.terrain.colors.sea;
        const targetFogColor = fogColor || this._tempColor.set(0x87ceeb);

        const floorSize = Settings.terrain.size * 15;
        const maxRadius = floorSize / 2;
        const fadeStart = maxRadius * 0.5;

        for (let i = 0, j = 0; i < vertices.length; i += 3, j += 3) {
            const vx = vertices[i];
            const vy = vertices[i+1];
            const height = vertices[i + 2];

            if (height < Settings.terrain.waterLevel + 0.3) {
                const depth = Math.max(0, Settings.terrain.waterLevel - height);
                const depthFactor = Math.min(1, depth / 15);
                this._tempColor.copy(dirtColor).lerp(this._depthColor, depthFactor);
            } else if (height < Settings.terrain.grassLevel) {
                this._tempColor.copy(dirtColor);
            } else {
                this._tempColor.copy(grassColor);
            }

            const dist = Math.sqrt(vx * vx + vy * vy);
            if (dist > fadeStart) {
                const fadeFactor = Math.min(1, (dist - fadeStart) / (maxRadius - fadeStart));
                this._tempColor.lerp(targetFogColor, Math.pow(fadeFactor, 1.2));
            }

            colors[j] = this._tempColor.r;
            colors[j+1] = this._tempColor.g;
            colors[j+2] = this._tempColor.b;
        }
        geo.attributes.color.needsUpdate = true;

        if (this.water) {
            this.water.position.y = Settings.terrain.waterLevel;
            this.water.material.opacity = Settings.water.opacity;
            this.water.material.color.copy(seaColor);
        }

        if (this.floorMaterial.flatShading !== Settings.terrain.triangulated) {
            this.floorMaterial.flatShading = Settings.terrain.triangulated;
            this.floorMaterial.needsUpdate = true;
        }
    }

    getHeight(x, z) {
        if (!this.floor) return 0;
        const raycaster = new THREE.Raycaster(
            new THREE.Vector3(x, 100, z),
            new THREE.Vector3(0, -1, 0)
        );
        const intersects = raycaster.intersectObject(this.floor);
        return (intersects.length > 0) ? intersects[0].point.y : Settings.terrain.seaDepth;
    }

    updateWater(time) {
    }
}
