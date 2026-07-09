import { Settings } from './src/core/Settings.js';
import { UIManager } from './src/ui/UIManager.js';

// Mock DOM
global.document = {
    getElementById: (id) => ({
        addEventListener: () => {},
        classList: { toggle: () => {}, add: () => {}, remove: () => {} },
        dataset: {},
        value: '',
        checked: false,
        style: {}
    }),
    querySelectorAll: () => []
};

console.log("Initial Distance:", Settings.camera.distance);
// This is just a sanity check for imports and structure.
