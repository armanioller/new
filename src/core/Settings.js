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
        mode: 'isometric',
        fov: {
            isometric: 40,
            thirdperson: 70,
            firstperson: 80,
            free: 75
        },
        distance: 15,
        height: 12,
        verticalOffset: 1.5,
        eyeHeight: 1.65,
        rotation: { x: -0.615, y: 0.785 }
    },
    player: {
        moveSpeed: 5,
        rotateSpeed: 3,
        acceleration: 12,
        friction: 8
    },
    terrain: {
        size: 60,
        quality: 50,
        triangulated: true,
        waterLevel: 0,
        grassLevel: 1.2,
        seaDepth: -10, // New setting
        colors: {
            sea: new THREE.Color(0x004466),
            dirt: new THREE.Color(0x5d4037),
            grass: new THREE.Color(0x3e4e20)
        }
    },
    water: {
        speed: 0.4,
        intensity: 0,
        opacity: 0.6 // Default transparency
    },
    resources: {
        maxTrees: 80,
        maxRocks: 50,
        spawnRadius: 55,
        minSpawnHeight: 1.2
    },
    buildings: {
        items: [
            { id: 'wall', name: 'Cerca de Madeira', wood: 2, stone: 0, icon: '🪵' },
            { id: 'floor', name: 'Piso de Pedra', wood: 0, stone: 2, icon: '🪨' },
            { id: 'fire', name: 'Fogueira', wood: 4, stone: 1, icon: '🔥' }
        ]
    }
};
