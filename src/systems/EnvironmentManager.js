import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class EnvironmentManager {
    constructor(scene) {
        this.scene = scene;

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;

        this.sunLight.shadow.mapSize.set(2048, 2048);
        this.sunLight.shadow.camera.left = -150;
        this.sunLight.shadow.camera.right = 150;
        this.sunLight.shadow.camera.top = 150;
        this.sunLight.shadow.camera.bottom = -150;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 2500;
        this.scene.add(this.sunLight);

        // THICK FOG
        this.fog = new THREE.FogExp2(0x87ceeb, 0.0012);
        this.scene.fog = this.fog;

        this.initStars();
    }

    initStars() {
        const starCount = 3000;
        const starGeometry = new THREE.BufferAttribute(new Float32Array(starCount * 3), 3);
        const starPositions = starGeometry.array;

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            // Distribute stars on a large sphere
            const r = 8000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            starPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPositions[i3 + 2] = r * Math.cos(phi);
        }

        const bufferGeometry = new THREE.BufferGeometry();
        bufferGeometry.setAttribute('position', starGeometry);

        this.starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            sizeAttenuation: false,
            transparent: true,
            opacity: 0,
            fog: false // Stars shouldn't be affected by ground fog
        });

        this.stars = new THREE.Points(bufferGeometry, this.starMaterial);
        this.stars.name = "stars";
        this.scene.add(this.stars);
    }

    update(timeOfDay) {
        const angle = ((timeOfDay - 6) / 24) * Math.PI * 2;

        const sunDist = 1800;
        this.sunLight.position.set(
            Math.cos(angle) * sunDist,
            Math.sin(angle) * sunDist,
            sunDist * 0.3
        );

        const t = timeOfDay;
        const c = Settings.time.colors;
        let skyColor = new THREE.Color();

        if (t >= 5 && t < 8) {
            skyColor.copy(c.midnight).lerp(c.dawn, (t - 5) / 3);
        } else if (t >= 8 && t < 17) {
            skyColor.copy(c.dawn).lerp(c.noon, (t - 8) / 9);
        } else if (t >= 17 && t < 20) {
            skyColor.copy(c.noon).lerp(c.sunset, (t - 17) / 3);
        } else if (t >= 20 && t < 23) {
            skyColor.copy(c.sunset).lerp(c.midnight, (t - 20) / 3);
        } else {
            skyColor.copy(c.midnight);
        }

        this.scene.background = skyColor;
        if (this.scene.fog) {
            this.scene.fog.color.copy(skyColor);
            const dayFactor = Math.max(0, Math.sin(angle));
            this.scene.fog.density = 0.0012 + (1 - dayFactor) * 0.0008;
        }

        const skydome = this.scene.getObjectByName("skydome");
        if (skydome) {
            skydome.material.color.copy(skyColor);
        }

        // UPDATE STARS OPACITY
        // Stars should be visible when it's dark
        let starOpacity = 0;
        if (t < 5 || t > 20) {
            starOpacity = 1;
        } else if (t >= 5 && t < 7) {
            starOpacity = 1 - (t - 5) / 2;
        } else if (t >= 18 && t <= 20) {
            starOpacity = (t - 18) / 2;
        }

        if (this.starMaterial) {
            this.starMaterial.opacity = starOpacity;
            this.stars.visible = starOpacity > 0;
            // Rotate stars slightly for life
            this.stars.rotation.y += 0.0001;
        }

        const water = this.scene.getObjectByName("water");
        if (water && water.material) {
            const dayFactor = Math.max(0, Math.sin(angle));
            const baseWaterColor = Settings.terrain.colors.sea;
            const nightWaterColor = new THREE.Color(0x00050a);

            water.material.color.copy(nightWaterColor).lerp(baseWaterColor, dayFactor);
            water.material.emissive.copy(skyColor).multiplyScalar(0.04);
        }

        const dayFactor = Math.max(0, Math.sin(angle));
        this.sunLight.intensity = dayFactor * 1.6;
        this.ambientLight.intensity = 0.25 + (dayFactor * 0.35);

        if (t > 16 && t < 20) {
            this.sunLight.color.setHex(0xffaa88);
        } else if (t > 5 && t < 9) {
            this.sunLight.color.setHex(0xffccaa);
        } else {
            this.sunLight.color.setHex(0xffffff);
        }

        return skyColor;
    }
}
