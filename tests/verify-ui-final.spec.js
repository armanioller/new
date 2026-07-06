import { test, expect } from '@playwright/test';

test('Verify UI Tabs and Modal', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#game-canvas');

  // Open sidebar
  await page.click('#settings-toggle');

  // Check initial state (Ambiente tab should be active)
  const ambienteTab = page.locator('#tab-ambiente');
  await expect(ambienteTab).toHaveClass(/active/);

  // Click Camera tab
  await page.click('button[data-tab="tab-camera"]');
  const cameraTab = page.locator('#tab-camera');
  await expect(cameraTab).toHaveClass(/active/);
  await expect(ambienteTab).not.toHaveClass(/active/);

  // Test Modal
  await page.click('button[data-tab="tab-presets"]');
  await page.click('#btn-reset-defaults');
  const modal = page.locator('#global-modal');
  await expect(modal).toHaveCSS('display', 'flex');
  await page.screenshot({ path: 'verification-ui-modal.png' });

  // Close Modal
  await page.click('#modal-cancel');
  await expect(modal).toHaveCSS('display', 'none');

  // Change Camera to Third Person
  await page.click('button[data-tab="tab-camera"]');
  await page.selectOption('#camera-mode', 'thirdperson');
  await page.screenshot({ path: 'verification-camera-thirdperson.png' });
});
