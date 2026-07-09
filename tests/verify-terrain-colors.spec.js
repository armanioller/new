import { test, expect } from '@playwright/test';

test('Verify Terrain Color UI', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Open settings
  await page.click('#settings-toggle');

  // Click Terreno tab
  await page.click('button[data-tab="tab-terreno"]');

  // Verify color inputs exist
  const seaColor = page.locator('#color-sea');
  const dirtColor = page.locator('#color-dirt');
  const grassColor = page.locator('#color-grass');

  await expect(seaColor).toBeVisible();
  await expect(dirtColor).toBeVisible();
  await expect(grassColor).toBeVisible();

  // Change color and verify it is applied in Settings (mock check via evaluation)
  await seaColor.fill('#ff0000');
  const hex = await page.evaluate(() => {
    return window.Settings.terrain.colors.sea.getHexString();
  });
  expect(hex).toBe('ff0000');

  await page.screenshot({ path: 'screenshots/terrain-colors.png' });
});
