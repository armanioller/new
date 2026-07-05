import * as THREE from 'three';

export const Settings = {
    time: {
        useRealTime: false,
        timeOfDay: 12.0,
        timeSpeed: 0.1,
        frozen: false,
        colors: {
            midnight: new THREE.Color(0x020205),
            dawn: new THREE.Color(0xffa07a),
            noon: new THREE.Color(0x87ceeb),
            sunset: new THREE.Color(0xff4500)
        }
    },
    camera: {
        mode: 'isometric', // isometric, thirdperson, firstperson, free
        fov: 75,
        distance: 12,
        height: 12,
        verticalOffset: 1.5,
        rotation: { x: -Math.PI / 4, y: Math.PI / 4 }
    },
    terrain: {
        size: 50,
        quality: 40,
        triangulated: true,
        waterLevel: 1.5,
        grassLevel: 2.0,
        colors: {
            sea: new THREE.Color(0x1a3d59),
            dirt: new THREE.Color(0x5d4037), // Medieval Wood/Dirt
            grass: new THREE.Color(0x3e4e20)  // Deep Medieval Green
        }
    },
    water: {
        speed: 0.4,
        intensity: 0.15,
        opacity: 0.7
    },
    resources: {
        maxTrees: 40,
        maxRocks: 20,
        spawnRadius: 24,
        minSpawnHeight: 1.8
    }
};
