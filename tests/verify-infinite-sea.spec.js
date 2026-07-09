import { test, expect } from '@playwright/test';

test('Verify Infinite Sea Geometry and Fog', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
        const water = window.game.engine.scene.getObjectByName("water");
        const fog = window.game.engine.scene.fog;
        const camera = window.game.engine.camera;

        return {
            waterRadius: water.geometry.parameters.radius,
            waterSegments: water.geometry.parameters.segments,
            fogDensity: fog.density,
            cameraFar: camera.far
        };
    });

    console.log('Infinite Sea Data:', data);

    expect(data.waterRadius).toBeGreaterThanOrEqual(8000);
    expect(data.waterSegments).toBe(64);
    expect(data.fogDensity).toBe(0.002);
    expect(data.cameraFar).toBeGreaterThanOrEqual(10000);
});
