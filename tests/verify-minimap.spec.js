import { test, expect } from '@playwright/test';

test('Verify Minimap and Directions', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(5000);

    const minimap = page.locator('#minimap-container');
    await expect(minimap).toBeVisible();

    const marker = page.locator('#minimap-player-marker');
    await expect(marker).toBeVisible();

    await page.screenshot({ path: 'screenshots/verify-minimap-final.png' });
});
