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

        // Opaque, matte water to eliminate all "divisions" and "white stains" (specular highlights)
        this.waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x004466,
            transparent: false, // Make it opaque to completely hide what's underneath
            opacity: 1.0,
            roughness: 1.0, // Maximum roughness removes "white stains" (specular highlights)
            metalness: 0.0,
            flatShading: false
        });

        this.init();
    }

    init() {
        const { size, quality } = Settings.terrain;

        if (this.floor) { this.scene.remove(this.floor); this.floor.geometry.dispose(); }
        if (this.water) { this.scene.remove(this.water); this.water.geometry.dispose(); }
        const oldSky = this.scene.getObjectByName("skydome");
        if (oldSky) { this.scene.remove(oldSky); oldSky.geometry.dispose(); }

        // Create Island
        const floorSize = size * 2.5;
        const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize, quality, quality);
        const vertices = floorGeometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];

            const dist = Math.sqrt(x * x + y * y);
            const islandRadius = size * 0.8;
            const edgeFactor = Math.pow(Math.max(0, 1 - dist / islandRadius), 1.5);

            let height = (Math.sin(x * 0.15) + Math.cos(y * 0.15)) * 2.5;
            height += (Math.sin(x * 0.4) * Math.cos(y * 0.4)) * 1.5;

            const deepBottom = -60;
            vertices[i + 2] = (height * edgeFactor) + (1 - edgeFactor) * deepBottom;
        }

        floorGeometry.computeVertexNormals();
        floorGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(floorGeometry.attributes.position.count * 3), 3));

        this.floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        // Single massive water mesh
        const waterGeo = new THREE.CircleGeometry(9000, 64);
        this.water = new THREE.Mesh(waterGeo, this.waterMaterial);
        this.water.name = "water";
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = Settings.terrain.waterLevel;
        this.water.receiveShadow = true;
        this.scene.add(this.water);

        // Skydome
        const skyGeo = new THREE.SphereGeometry(8500, 32, 15);
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

        for (let i = 0; i < vertices.length; i += 3) {
            const height = vertices[i + 2];
            let color;

            if (height < Settings.terrain.waterLevel + 0.3) {
                color = dirtColor; // Keep it simple
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

        if (this.water) {
            this.water.position.y = Settings.terrain.waterLevel;
            this.water.material.color.copy(Settings.terrain.colors.sea);
        }

        this.floorMaterial.flatShading = Settings.terrain.triangulated;
        this.floorMaterial.needsUpdate = true;
    }

    getHeight(x, z) {
        if (!this.floor) return 0;
        const raycaster = new THREE.Raycaster(
            new THREE.Vector3(x, 100, z),
            new THREE.Vector3(0, -1, 0)
        );
        const intersects = raycaster.intersectObject(this.floor);
        return (intersects.length > 0) ? intersects[0].point.y : -60;
    }

    updateWater(time) {
        // No waves
    }
}
