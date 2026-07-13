import * as THREE from 'three';
import { Settings } from '../core/Settings.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {
            settingsToggle: document.getElementById('settings-toggle'),
            settingsMenu: document.getElementById('settings-menu'),
            menuOverlay: document.getElementById('menu-overlay'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            timeDisplay: document.getElementById('time-display'),
            woodCount: document.getElementById('count-wood'),
            stoneCount: document.getElementById('count-stone'),
            charPreviewContainer: document.getElementById('character-preview-container'),
            charModelUpload: document.getElementById('char-model-upload'),
            animIdleUpload: document.getElementById('anim-idle-upload'),
            animWalkUpload: document.getElementById('anim-walk-upload'),
            animRunUpload: document.getElementById('anim-run-upload'),
            animJumpUpload: document.getElementById('anim-jump-upload'),
            btnResetCharacter: document.getElementById('btn-reset-character'),
            modal: document.getElementById('global-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalMessage: document.getElementById('modal-message'),
            modalCancel: document.getElementById('modal-cancel'),
            modalConfirm: document.getElementById('modal-confirm')
        };

        this.preview = {
            scene: null, camera: null, renderer: null, model: null, mixer: null, clock: new THREE.Clock()
        };

        this.init();
        this.initCharacterPreview();
        this.game.player.onModelReady = () => this.updatePreviewModel();
    }

    init() {
        if (this.elements.settingsToggle) {
            this.elements.settingsToggle.addEventListener('click', () => {
                const isOpen = this.elements.settingsMenu.classList.toggle('open');
                if (this.elements.menuOverlay) this.elements.menuOverlay.classList.toggle('active', isOpen);
                this.game.engine.isInteractingWithUI = isOpen;
                if (isOpen) {
                    this.elements.menuOverlay.onclick = () => {
                        this.elements.settingsMenu.classList.remove('open');
                        this.elements.menuOverlay.classList.remove('active');
                        this.game.engine.isInteractingWithUI = false;
                    };
                }
            });
        }

        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.tabButtons.forEach(b => b.classList.remove('active'));
                this.elements.tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-tab');
                const target = document.getElementById(targetId);
                if (target) {
                    target.classList.add('active');
                    if (targetId === 'tab-personagem') {
                        setTimeout(() => {
                            this.resizePreview();
                            this.updatePreviewModel();
                        }, 50);
                    }
                }
            });
        });

        const handleUpload = (element, callback) => {
            if (!element) return;
            element.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => callback(event.target.result, file.name);
                    reader.readAsArrayBuffer(file);
                    const span = element.parentElement.querySelector('span');
                    if (span) span.innerText = `✔️ ${file.name.substring(0, 10)}...`;
                }
            });
        };

        handleUpload(this.elements.charModelUpload, (buffer, name) => {
            this.game.player.loadCustomModel(buffer, name);
            setTimeout(() => this.updatePreviewModel(), 500);
        });

        handleUpload(this.elements.animIdleUpload, (buffer, name) => this.game.player.loadCustomAnimation(buffer, name, 'idle'));
        handleUpload(this.elements.animWalkUpload, (buffer, name) => this.game.player.loadCustomAnimation(buffer, name, 'walking'));
        handleUpload(this.elements.animRunUpload, (buffer, name) => this.game.player.loadCustomAnimation(buffer, name, 'running'));
        handleUpload(this.elements.animJumpUpload, (buffer, name) => this.game.player.loadCustomAnimation(buffer, name, 'jump'));

        if (this.elements.btnResetCharacter) {
            this.elements.btnResetCharacter.addEventListener('click', () => {
                this.game.player.loadModel();
                setTimeout(() => this.updatePreviewModel(), 1000);
            });
        }
    }

    resizePreview() {
        if (!this.elements.charPreviewContainer || !this.preview.renderer) return;
        const width = this.elements.charPreviewContainer.clientWidth || 310;
        const height = this.elements.charPreviewContainer.clientHeight || 400;
        this.preview.camera.aspect = width / height;
        this.preview.camera.updateProjectionMatrix();
        this.preview.renderer.setSize(width, height);
    }

    initCharacterPreview() {
        if (!this.elements.charPreviewContainer) return;
        const width = 310; const height = 400;
        this.preview.scene = new THREE.Scene();
        this.preview.scene.background = new THREE.Color(0x050505);
        this.preview.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.preview.camera.position.set(0, 1.2, 3.0);
        this.preview.camera.lookAt(0, 1.0, 0);
        this.preview.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.preview.renderer.setSize(width, height);
        this.preview.renderer.setPixelRatio(window.devicePixelRatio);
        this.elements.charPreviewContainer.appendChild(this.preview.renderer.domElement);
        this.preview.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(5, 10, 5);
        this.preview.scene.add(sun);
        const animate = () => {
            requestAnimationFrame(animate);
            const delta = this.preview.clock.getDelta();
            if (this.preview.mixer) this.preview.mixer.update(delta);
            if (this.preview.model) this.preview.model.rotation.y += delta * 0.4;
            this.preview.renderer.render(this.preview.scene, this.preview.camera);
        };
        animate();
    }

    updatePreviewModel() {
        if (!this.game.player.model) return;
        if (this.preview.model) this.preview.scene.remove(this.preview.model);
        this.preview.model = this.game.player.model.clone();
        this.preview.model.position.set(0, 0, 0);
        this.preview.model.scale.set(1, 1, 1);
        this.preview.scene.add(this.preview.model);
        this.preview.mixer = new THREE.AnimationMixer(this.preview.model);
        const animations = this.game.player.rawAnimations;
        if (animations && animations.length > 0) {
            const idle = animations.find(a => a.name === 'idle') ||
                         animations.find(a => a.name.toLowerCase().includes('idle')) ||
                         animations[0];
            const action = this.preview.mixer.clipAction(idle);
            action.reset().play();
        }
    }

    showModal(title, message, onConfirm = null, showCancel = true) {
        if (!this.elements.modal) return;
        this.elements.modalTitle.innerText = title;
        this.elements.modalMessage.innerText = message;
        this.elements.modalCancel.style.display = showCancel ? 'block' : 'none';
        this.elements.modal.classList.add('active');
        const close = () => this.elements.modal.classList.remove('active');
        this.elements.modalConfirm.onclick = () => { if (onConfirm) onConfirm(); close(); };
        this.elements.modalCancel.onclick = close;
    }

    update() {
        const inv = this.game.player.inventory;
        if (this.elements.woodCount) this.elements.woodCount.innerText = inv.wood || 0;
        if (this.elements.stoneCount) this.elements.stoneCount.innerText = inv.stone || 0;
        const h = Math.floor(Settings.time.timeOfDay);
        const m = Math.floor((Settings.time.timeOfDay % 1) * 60);
        if (this.elements.timeDisplay) this.elements.timeDisplay.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
}
