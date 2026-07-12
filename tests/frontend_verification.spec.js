import { test, expect } from '@playwright/test';

test('verify minimap and terrain visuals', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:5173');

    // Wait for the minimap to render its first frame (2 seconds delay in init + interval)
    await page.waitForTimeout(6000);

    // Screenshot of the whole UI
    await page.screenshot({ path: 'screenshots/verify-minimap-final.png' });

    // Verify minimap container visibility
    const minimap = page.locator('#minimap-container');
    await expect(minimap).toBeVisible();

    // Check if player marker exists
    const marker = page.locator('#minimap-player-marker');
    await expect(marker).toBeVisible();
});
