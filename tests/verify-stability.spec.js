import { test, expect } from '@playwright/test';

test('Verify Resource HUD and Movement Stability', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('#game-canvas');

    // 1. Check HUD for "undefined"
    const woodCount = await page.locator('#count-wood').innerText();
    const stoneCount = await page.locator('#count-stone').innerText();

    expect(woodCount).not.toContain('undefined');
    expect(stoneCount).not.toContain('undefined');
    expect(woodCount).toBe('0');
    expect(stoneCount).toBe('0');

    // 2. Test Movement Stability (WASD)
    // Press W and check if camera stays in valid range (not gray void)
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyW');

    const camData = await page.evaluate(() => {
        const cam = window.game.engine.camera;
        return {
            x: cam.position.x,
            y: cam.position.y,
            z: cam.position.z,
            fov: cam.fov
        };
    });

    console.log('Camera after movement:', camData);
    expect(isNaN(camData.x)).toBe(false);
    expect(isNaN(camData.y)).toBe(false);
    expect(camData.y).toBeGreaterThan(-100); // Should not fall through world infinitely

    await page.screenshot({ path: 'verify-stability-after-move.png' });
});
