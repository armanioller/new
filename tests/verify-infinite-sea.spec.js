import { test, expect } from '@playwright/test';

test('Verify Infinite Sea Geometry and Fog', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
        const water = window.game.engine.scene.getObjectByName("water");
        const fog = window.game.engine.scene.fog;
        const camera = window.game.engine.camera;

        return {
            waterRadius: water.geometry.parameters.radius,
            fogDensity: fog.density,
            cameraFar: camera.far
        };
    });

    console.log('Infinite Sea Data:', data);

    expect(data.waterRadius).toBeGreaterThanOrEqual(8000);
    expect(data.fogDensity).toBeGreaterThan(0.0005);
});
