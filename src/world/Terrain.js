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
            transparent: false,
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
        if (this.water) { this.scene.remove(this.water); this.water.geometry.dispose(); }
        const oldSky = this.scene.getObjectByName("skydome");
        if (oldSky) { this.scene.remove(oldSky); oldSky.geometry.dispose(); }

        // Create Island
        const floorGeometry = new THREE.PlaneGeometry(size, size, quality, quality);
        const vertices = floorGeometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const dx = (x / (size / 2));
            const dy = (y / (size / 2));
            const dist = Math.sqrt(dx * dx + dy * dy);

            const edgeFactor = Math.max(0, 1 - Math.pow(dist, 3));
            let height = (Math.sin(x * 0.2) + Math.cos(y * 0.2)) * 2;
            height += (Math.sin(x * 0.5) * Math.cos(y * 0.5)) * 1.5;

            vertices[i + 2] = height * edgeFactor - (1 - edgeFactor) * 5;
        }

        floorGeometry.computeVertexNormals();
        floorGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(floorGeometry.attributes.position.count * 3), 3));

        this.floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.receiveShadow = true;
        this.floor.position.y = 0;
        this.scene.add(this.floor);

        // EXPANDED: Water Plane for "Infinite" look
        const waterGeometry = new THREE.CircleGeometry(8000, 64);
        this.water = new THREE.Mesh(waterGeometry, this.waterMaterial); this.water.name = "water";
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = Settings.terrain.waterLevel;
        this.water.receiveShadow = true;
        this.scene.add(this.water);

        // EXPANDED: Skydome larger than water
        const skyGeo = new THREE.SphereGeometry(8500, 32, 15);
        const skyMat = new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
            transparent: false,
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

        const seaColor = Settings.terrain.colors.sea;
        const dirtColor = Settings.terrain.colors.dirt;
        const grassColor = Settings.terrain.colors.grass;

        for (let i = 0; i < vertices.length; i += 3) {
            const height = vertices[i + 2];
            let color;
            if (height < Settings.terrain.waterLevel + 0.1) color = seaColor;
            else if (height < Settings.terrain.grassLevel) color = dirtColor;
            else color = grassColor;

            colors[i] = color.r;
            colors[i+1] = color.g;
            colors[i+2] = color.b;
        }
        geo.attributes.color.needsUpdate = true;

        this.water.position.y = Settings.terrain.waterLevel;
        this.floorMaterial.flatShading = Settings.terrain.triangulated;
        this.floorMaterial.needsUpdate = true;
        this.waterMaterial.opacity = Settings.water.opacity;
        this.waterMaterial.color.copy(Settings.terrain.colors.sea);
    }

    getHeight(x, z) {
        if (!this.floor) return 0;
        const { size, quality } = Settings.terrain;
        const gridX = ((x / size) + 0.5) * quality;
        const gridZ = ((z / size) + 0.5) * quality;
        const col = Math.round(gridX);
        const row = Math.round(gridZ);
        if (col < 0 || col > quality || row < 0 || row > quality) return Settings.terrain.waterLevel - 1;
        const index = (row * (quality + 1) + col) * 3;
        const h = this.floor.geometry.attributes.position.array[index + 2];
        return (h !== undefined) ? h : Settings.terrain.waterLevel;
    }

    updateWater(time) {}
}
