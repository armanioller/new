import { test, expect } from '@playwright/test';

test('Verify terrain expansion and UI value displays', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);

    // Toggle settings and switch to Terreno tab
    await page.evaluate(() => {
        document.getElementById('settings-menu').classList.add('open');
        const tabBtn = document.querySelector('button[data-tab="tab-terreno"]');
        if (tabBtn) tabBtn.click();
    });

    await page.waitForTimeout(500);

    // Check specifically for the Terrain Size value
    const sizeVal = await page.locator('#val-terrain-size').textContent();
    console.log('Current Terrain Size UI Value:', sizeVal);

    expect(sizeVal).toBe('60'); // Our new default

    // Change slider and check if UI update
    await page.fill('#terrain-size', '70');
    await page.dispatchEvent('#terrain-size', 'change');

    const newSizeVal = await page.locator('#val-terrain-size').textContent();
    expect(newSizeVal).toBe('70');

    // Take screenshot
    await page.screenshot({ path: 'screenshots/verify-terrain-logic.png' });
});
