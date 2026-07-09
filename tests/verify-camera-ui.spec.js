import { test, expect } from '@playwright/test';

test('Verify Camera UI Sliders', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Open settings
  await page.click('#settings-toggle');

  // Click Camera tab
  await page.click('button[data-tab="tab-camera"]');

  // Verify sliders exist
  const distanceSlider = page.locator('#camera-distance');
  const heightSlider = page.locator('#camera-height');
  const offsetSlider = page.locator('#camera-offset');

  await expect(distanceSlider).toBeVisible();
  await expect(heightSlider).toBeVisible();
  await expect(offsetSlider).toBeVisible();

  // Change a value and verify it persists in UI (simple check)
  await distanceSlider.fill('25');
  expect(await distanceSlider.inputValue()).toBe('25');

  await page.screenshot({ path: 'screenshots/camera-ui.png' });
});
