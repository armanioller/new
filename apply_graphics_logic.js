        if (this.elements.graphicsQuality) {
            this.elements.graphicsQuality.addEventListener('change', (e) => {
                const q = e.target.value;
                import('../core/Settings.js').then(({ Settings, GraphicsQuality }) => {
                    Settings.graphics.quality = q;
                    const config = GraphicsQuality[q];

                    Settings.terrain.quality = config.terrainQuality;
                    Settings.resources.maxTrees = Math.floor(80 * config.resourceDensity);
                    Settings.resources.maxRocks = Math.floor(50 * config.resourceDensity);

                    // Re-init systems
                    this.game.terrain.init();
                    if (this.game.environment.stars) {
                        this.game.engine.scene.remove(this.game.environment.stars);
                        this.game.environment.initStars();
                    }

                    // Shadow resolution update (requires light recreation)
                    const sun = this.game.environment.sunLight;
                    sun.shadow.mapSize.set(config.shadowRes, config.shadowRes);
                    sun.shadow.map.dispose();
                    sun.shadow.map = null;
                });
            });
        }
