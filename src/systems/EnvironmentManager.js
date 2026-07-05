import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class EnvironmentManager {
    constructor(scene) {
        this.scene = scene;
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(5, 10, 5);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.set(2048, 2048);
        this.sunLight.shadow.camera.left = -50;
        this.sunLight.shadow.camera.right = 50;
        this.sunLight.shadow.camera.top = 50;
        this.sunLight.shadow.camera.bottom = -50;
        this.scene.add(this.sunLight);

        this.fog = new THREE.FogExp2(0x000000, 0.015);
        this.scene.fog = this.fog;
    }

    update(timeOfDay) {
        const angle = ((timeOfDay - 6) / 24) * Math.PI * 2;
        this.sunLight.position.set(Math.cos(angle) * 40, Math.sin(angle) * 40, 20);

        let skyColor;
        const t = timeOfDay;
        const c = Settings.time.colors;

        if (t >= 5 && t < 8) skyColor = c.midnight.clone().lerp(c.dawn, (t - 5) / 3);
        else if (t >= 8 && t < 17) skyColor = c.dawn.clone().lerp(c.noon, (t - 8) / 9);
        else if (t >= 17 && t < 20) skyColor = c.noon.clone().lerp(c.sunset, (t - 17) / 3);
        else if (t >= 20 && t < 23) skyColor = c.sunset.clone().lerp(c.midnight, (t - 20) / 3);
        else skyColor = c.midnight;

        this.scene.background = skyColor;
        if (this.scene.fog) this.scene.fog.color.copy(skyColor);

        const skydome = this.scene.getObjectByName("skydome");
        if (skydome) skydome.material.color.copy(skyColor);

        this.sunLight.intensity = (t > 5 && t < 20) ? 1 : 0;
        this.ambientLight.intensity = (t > 5 && t < 20) ? 0.5 : 0.2;
    }
}
