import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class EnvironmentManager {
    constructor(scene) {
        this.scene = scene;

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(20, 50, 20);
        this.sunLight.castShadow = true;

        this.sunLight.shadow.mapSize.set(1024, 1024);
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.scene.add(this.sunLight);

        // PERFECTED: Fog for "Infinite Sea" horizon blend
        // Fog density adjusted for 4000 unit radius water
        this.fog = new THREE.FogExp2(0x000000, 0.0006);
        this.scene.fog = this.fog;
    }

    update(timeOfDay) {
        const angle = ((timeOfDay - 6) / 24) * Math.PI * 2;

        this.sunLight.position.set(
            Math.cos(angle) * 150,
            Math.sin(angle) * 150,
            50
        );

        let skyColor;
        const t = timeOfDay;
        const c = Settings.time.colors;

        if (t >= 5 && t < 8) {
            skyColor = c.midnight.clone().lerp(c.dawn, (t - 5) / 3);
        } else if (t >= 8 && t < 17) {
            skyColor = c.dawn.clone().lerp(c.noon, (t - 8) / 9);
        } else if (t >= 17 && t < 20) {
            skyColor = c.noon.clone().lerp(c.sunset, (t - 17) / 3);
        } else if (t >= 20 && t < 23) {
            skyColor = c.sunset.clone().lerp(c.midnight, (t - 20) / 3);
        } else {
            skyColor = c.midnight;
        }

        this.scene.background = skyColor;
        if (this.scene.fog) {
            this.scene.fog.color.copy(skyColor);
        }

        const skydome = this.scene.getObjectByName("skydome");
        if (skydome) {
            skydome.material.color.copy(skyColor);
        }

        // PERFECTED: Water color reacts to time of day for better horizon blending
        const water = this.scene.getObjectByName("water");
        if (water) {
            const dayFactor = Math.max(0, Math.sin(angle));
            const baseWaterColor = new THREE.Color(0x004466);
            const nightWaterColor = new THREE.Color(0x000811);
            water.material.color.copy(nightWaterColor).lerp(baseWaterColor, dayFactor);
        }

        const dayFactor = Math.max(0, Math.sin(angle));
        this.sunLight.intensity = dayFactor * 1.2;
        this.ambientLight.intensity = 0.2 + (dayFactor * 0.3);

        if (t > 17 || t < 8) {
            this.sunLight.color.setHex(0xffaa88);
        } else {
            this.sunLight.color.setHex(0xffffff);
        }
    }
}
