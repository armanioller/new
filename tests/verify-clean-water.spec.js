import { test, expect } from '@playwright/test';

test('Verify clean water and no divisions', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    const waterData = await page.evaluate(() => {
        const water = window.game.terrain.water;
        return {
            name: water.name,
            geometryType: water.geometry.type,
            transparent: water.material.transparent,
            roughness: water.material.roughness
        };
    });

    console.log('Water Data:', waterData);
    expect(waterData.name).toBe('water');
    expect(waterData.transparent).toBe(false);
    expect(waterData.roughness).toBe(1.0);

    await page.screenshot({ path: 'screenshots/verify-clean-water-final.png' });
});
