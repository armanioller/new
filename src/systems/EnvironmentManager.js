import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class EnvironmentManager {
    constructor(scene) {
        this.scene = scene;

        // Ambient Light for base visibility
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);

        // Sun / Moon Light
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(20, 50, 20);
        this.sunLight.castShadow = true;

        // Optimize shadow map
        this.sunLight.shadow.mapSize.set(1024, 1024);
        this.sunLight.shadow.camera.left = -60;
        this.sunLight.shadow.camera.right = 60;
        this.sunLight.shadow.camera.top = 60;
        this.sunLight.shadow.camera.bottom = -60;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 200;
        this.scene.add(this.sunLight);

        // Fog is critical for the "Infinite Sea" horizon blend
        // We use FogExp2 for a more natural density falloff
        this.fog = new THREE.FogExp2(0x000000, 0.003);
        this.scene.fog = this.fog;
    }

    update(timeOfDay) {
        const angle = ((timeOfDay - 6) / 24) * Math.PI * 2;

        // Move sun in arc
        this.sunLight.position.set(
            Math.cos(angle) * 80,
            Math.sin(angle) * 80,
            30
        );

        let skyColor;
        const t = timeOfDay;
        const c = Settings.time.colors;

        // Interpolate colors based on time
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

        // Adjust light intensity based on day/night
        const dayFactor = Math.max(0, Math.sin(angle));
        this.sunLight.intensity = dayFactor * 1.2;
        this.ambientLight.intensity = 0.2 + (dayFactor * 0.3);

        // Change sun color slightly during sunset/dawn
        if (t > 17 || t < 8) {
            this.sunLight.color.setHex(0xffaa88);
        } else {
            this.sunLight.color.setHex(0xffffff);
        }
    }
}
