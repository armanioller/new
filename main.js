import * as THREE from 'three';

// 1. Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Céu azul

// 2. Câmera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// 3. Renderizador
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#game-canvas'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 4. Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// 5. Objetos (Placeholder)
// Chão
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 }); // Verde grama
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Jogador (Cubo)
const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1; // Metade da altura
scene.add(player);

// Árvore (Placeholder Low-Poly)
const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
trunk.position.set(3, 0.5, -2);
scene.add(trunk);

const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x006400 });
const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
leaves.position.set(3, 2, -2);
scene.add(leaves);

// 6. Redimensionamento
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 7. Loop de Animação
function animate() {
    requestAnimationFrame(animate);

    // Pequena animação no player para saber que o loop está rodando
    player.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();
