import { test, expect } from '@playwright/test';

test('Verify Camera Modes and Tracking', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('#game-canvas');

    // Helper to get camera and player data from window
    const getCamData = () => page.evaluate(() => {
        const cam = window.game.engine.camera;
        const player = window.game.player.position;
        return {
            pos: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
            playerPos: { x: player.x, y: player.y, z: player.z },
            mode: window.Settings.camera.mode
        };
    });

    // 1. Check Isometric
    let data = await getCamData();
    expect(data.mode).toBe('isometric');

    // 2. Switch to Third Person
    await page.evaluate(() => {
        window.Settings.camera.mode = 'thirdperson';
    });
    await page.waitForTimeout(500);
    data = await getCamData();
    expect(data.mode).toBe('thirdperson');
    await page.screenshot({ path: 'verify-camera-thirdperson.png' });

    // 3. Switch to First Person
    await page.evaluate(() => {
        window.Settings.camera.mode = 'firstperson';
    });
    await page.waitForTimeout(500);
    data = await getCamData();
    expect(data.mode).toBe('firstperson');

    // Check Y position: player.y + 1.6 + slight forward offset adjustment
    // Since we add forward offset, it might change Y if camera is tilted, but in FP we start at phi=0
    expect(data.pos.y).toBeGreaterThan(data.playerPos.y + 1);
    await page.screenshot({ path: 'verify-camera-firstperson.png' });
});
