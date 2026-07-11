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
        this.fog = new THREE.FogExp2(0x87ceeb, 0.0025);
        this.scene.fog = this.fog;

        this.initStars();
    }

    initStars() {
        const starCount = 4000;
        const positions = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        const twinkleSeeds = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const r = 7000 + Math.random() * 2000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = r * Math.cos(phi);

            sizes[i] = 1.0 + Math.random() * 3.0;
            twinkleSeeds[i] = Math.random() * 10.0;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('twinkleSeed', new THREE.BufferAttribute(twinkleSeeds, 1));

        this.starUniforms = {
            uTime: { value: 0 },
            uOpacity: { value: 0 },
            uColor: { value: new THREE.Color(0xffffff) }
        };

        const vertexShader = `
            attribute float size;
            attribute float twinkleSeed;
            uniform float uTime;
            varying float vTwinkle;

            void main() {
                vTwinkle = sin(uTime * 3.0 + twinkleSeed) * 0.5 + 0.5;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vTwinkle;

            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                if (dist > 0.5) discard;

                // Twinkling effect: modulate brightness slightly
                float brightness = 0.7 + vTwinkle * 0.3;
                gl_FragColor = vec4(uColor, uOpacity * brightness);
            }
        `;

        this.starMaterial = new THREE.ShaderMaterial({
            uniforms: this.starUniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.stars = new THREE.Points(geometry, this.starMaterial);
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
            this.scene.fog.density = 0.0025 + (1 - dayFactor) * 0.0015;
        }

        const skydome = this.scene.getObjectByName("skydome");
        if (skydome) {
            skydome.material.color.copy(skyColor);
        }

        // UPDATE STARS OPACITY AND TIME
        let starOpacity = 0;
        if (t < 5 || t > 20) {
            starOpacity = 1;
        } else if (t >= 5 && t < 7) {
            starOpacity = 1 - (t - 5) / 2;
        } else if (t >= 18 && t <= 20) {
            starOpacity = (t - 18) / 2;
        }

        if (this.starMaterial) {
            this.starUniforms.uOpacity.value = starOpacity;
            this.starUniforms.uTime.value = performance.now() / 1000;
            this.stars.visible = starOpacity > 0;
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
