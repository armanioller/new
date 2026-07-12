import { test, expect } from '@playwright/test';

test('Verify Central Menu and Character Tab', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000); // Wait for initial load

  // Check if settings button exists
  const settingsBtn = page.locator('#settings-toggle');
  await expect(settingsBtn).toBeVisible();

  // Open menu
  await settingsBtn.click();
  await page.waitForTimeout(500);

  // Take screenshot of the new central menu
  await page.screenshot({ path: 'screenshots/verify-central-menu.png' });

  // Verify modal is centered (roughly)
  const menu = page.locator('#settings-menu');
  await expect(menu).toHaveClass(/central-menu-modal/);
  await expect(menu).toHaveClass(/open/);

  // Switch to Character Tab
  const charTabBtn = page.locator('button[data-tab="tab-personagem"]');
  await charTabBtn.click();
  await page.waitForTimeout(500);

  // Check if preview container is visible
  const preview = page.locator('#character-preview-container');
  await expect(preview).toBeVisible();

  await page.screenshot({ path: 'screenshots/verify-character-tab.png' });

  // Close menu by clicking overlay
  await page.click('#menu-overlay', { position: { x: 5, y: 5 } });
  await page.waitForTimeout(500);
  await expect(menu).not.toHaveClass(/open/);

  await page.screenshot({ path: 'screenshots/verify-menu-closed.png' });
});
