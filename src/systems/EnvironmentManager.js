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

        // THICK FOG for seamless horizon
        this.fog = new THREE.FogExp2(0x87ceeb, 0.0006);
        this.scene.fog = this.fog;
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
        }

        const skydome = this.scene.getObjectByName("skydome");
        if (skydome) {
            skydome.material.color.copy(skyColor);
        }

        const water = this.scene.getObjectByName("water");
        if (water && water.material) {
            const dayFactor = Math.max(0, Math.sin(angle));
            const baseWaterColor = Settings.terrain.colors.sea;
            const nightWaterColor = new THREE.Color(0x00050a);

            water.material.color.copy(nightWaterColor).lerp(baseWaterColor, dayFactor);
            // Ambient reflection of sky - very subtle
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
    }
}
