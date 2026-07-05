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
            color: 0x0077be,
            transparent: true,
            opacity: Settings.water.opacity,
            flatShading: true
        });

        this.init();
    }

    init() {
        const { size, quality } = Settings.terrain;

        if (this.floor) {
            this.scene.remove(this.floor);
            this.floor.geometry.dispose();
        }
        if (this.water) {
            this.scene.remove(this.water);
            this.water.geometry.dispose();
        }
        const oldSky = this.scene.getObjectByName("skydome");
        if (oldSky) {
            this.scene.remove(oldSky);
            oldSky.geometry.dispose();
        }

        const floorGeometry = new THREE.PlaneGeometry(size, size, quality, quality);
        const vertices = floorGeometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const dx = (x / (size / 2));
            const dy = (y / (size / 2));
            const dist = Math.sqrt(dx * dx + dy * dy);
            const edgeFactor = Math.max(0, 1 - Math.pow(dist, 4));
            let height = (Math.sin(x * 0.2) + Math.cos(y * 0.2)) * 2;
            height += (Math.sin(x * 0.5) * Math.cos(y * 0.5)) * 1;
            vertices[i + 2] = height * edgeFactor - (1 - edgeFactor) * 2;
        }

        floorGeometry.computeVertexNormals();
        floorGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(floorGeometry.attributes.position.count * 3), 3));

        this.floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.floor.position.y = 0; // Ensure base at 0
        this.scene.add(this.floor);

        const waterGeometry = new THREE.CircleGeometry(size * 4, 32);
        this.water = new THREE.Mesh(waterGeometry, this.waterMaterial);
        this.water.rotation.x = -Math.PI / 2;
        this.water.receiveShadow = true;
        this.scene.add(this.water);

        const skyGeo = new THREE.SphereGeometry(size * 5, 32, 15);
        const skyMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, opacity: 0.8 });
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

        for (let i = 0; i < vertices.length; i += 3) {
            const height = vertices[i + 2];
            let color;
            if (height < Settings.terrain.waterLevel) color = Settings.terrain.colors.sea;
            else if (height < Settings.terrain.grassLevel) color = Settings.terrain.colors.dirt;
            else color = Settings.terrain.colors.grass;

            colors[i] = color.r;
            colors[i+1] = color.g;
            colors[i+2] = color.b;
        }
        geo.attributes.color.needsUpdate = true;
        this.water.position.y = Settings.terrain.waterLevel;
        this.floorMaterial.flatShading = Settings.terrain.triangulated;
        this.floorMaterial.needsUpdate = true;
        this.waterMaterial.opacity = Settings.water.opacity;
    }

    getHeight(x, z) {
        if (!this.floor) return 0;
        const { size, quality } = Settings.terrain;
        const col = Math.round(((x / size) + 0.5) * quality);
        const row = Math.round(((z / size) + 0.5) * quality);
        const index = (row * (quality + 1) + col) * 3;
        return this.floor.geometry.attributes.position.array[index + 2] || 0;
    }

    updateWater(time) {
        if (!this.water) return;
        const geo = this.water.geometry;
        const vertices = geo.attributes.position.array;
        const timeScale = time * 0.001 * Settings.water.speed;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i]; const y = vertices[i + 1];
            vertices[i + 2] = Math.sin(x * 0.5 + timeScale) * Math.cos(y * 0.5 + timeScale) * Settings.water.intensity;
        }
        geo.attributes.position.needsUpdate = true;
    }
}
