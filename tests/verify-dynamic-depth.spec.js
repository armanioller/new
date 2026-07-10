import { test, expect } from '@playwright/test';

test('Verify dynamic depth and transparency controls', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // 1. Verify initial settings
    const initial = await page.evaluate(() => ({
        depth: window.Settings.terrain.seaDepth,
        opacity: window.Settings.water.opacity
    }));
    expect(initial.depth).toBe(-10);
    expect(initial.opacity).toBe(0.6);

    // 2. Change depth via UI
    await page.evaluate(() => {
        const slider = document.getElementById('terrain-depth');
        slider.value = -5;
        slider.dispatchEvent(new Event('input'));
    });

    await page.waitForTimeout(500);
    const updatedDepth = await page.evaluate(() => window.Settings.terrain.seaDepth);
    expect(updatedDepth).toBe(-5);

    // 3. Change transparency via UI
    await page.evaluate(() => {
        const slider = document.getElementById('water-opacity');
        slider.value = 0.2;
        slider.dispatchEvent(new Event('input'));
    });

    await page.waitForTimeout(500);
    const updatedOpacity = await page.evaluate(() => window.game.terrain.water.material.opacity);
    expect(updatedOpacity).toBe(0.2);

    await page.screenshot({ path: 'screenshots/verify-depth-ui.png' });
});
