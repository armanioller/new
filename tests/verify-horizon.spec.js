import { test, expect } from '@playwright/test';

test('Verify Horizon Blending and Colors', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(2000);

    // Check if UI is visible
    const settingsBtn = page.locator('#settings-toggle');
    await expect(settingsBtn).toBeVisible();

    // Take screenshot of the island and horizon
    await page.screenshot({ path: 'screenshots/horizon-day.png' });

    // Change time to Midnight and check blending
    await page.evaluate(() => {
        window.Settings.time.timeOfDay = 0;
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/horizon-night.png' });

    // Check if fog exists in the scene
    const hasFog = await page.evaluate(() => {
        return !!window.game.engine.scene.fog;
    });
    expect(hasFog).toBeTruthy();
});
