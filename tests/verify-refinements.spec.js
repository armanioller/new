import { test, expect } from '@playwright/test';

test('Verify Camera Refinements (Visibility and Chase)', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('#game-canvas');

    // 1. First Person: Check player model visibility
    await page.evaluate(() => {
        window.Settings.camera.mode = 'firstperson';
    });
    await page.waitForTimeout(500);
    const isVisibleFP = await page.evaluate(() => window.game.player.group.visible);
    expect(isVisibleFP).toBe(false);
    await page.screenshot({ path: 'verify-fp-hidden.png' });

    // 2. Third Person: Check if model returns to visible
    await page.evaluate(() => {
        window.Settings.camera.mode = 'thirdperson';
    });
    await page.waitForTimeout(500);
    const isVisible3P = await page.evaluate(() => window.game.player.group.visible);
    expect(isVisible3P).toBe(true);

    // 3. Third Person: Test Chase Logic
    // Rotate player and check if camera theta follows
    const initialTheta = await page.evaluate(() => window.game.cameraManager.spherical.theta);
    await page.keyboard.down('KeyD'); // Move/Rotate right
    await page.waitForTimeout(1000);
    await page.keyboard.up('KeyD');

    const newTheta = await page.evaluate(() => window.game.cameraManager.spherical.theta);
    console.log('Initial Theta:', initialTheta, 'New Theta:', newTheta);
    expect(newTheta).not.toBe(initialTheta);

    await page.screenshot({ path: 'verify-tp-chase.png' });
});
