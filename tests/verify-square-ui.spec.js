import { test, expect } from '@playwright/test';

test('Verify Square UI and Custom Scrollbars', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Open menu
  await page.click('#settings-toggle');
  await page.waitForTimeout(500);

  // Switch to Character Tab to see custom file uploads
  const charTabBtn = page.locator('button[data-tab="tab-personagem"]');
  await charTabBtn.click();
  await page.waitForTimeout(500);

  // Verify file upload inputs are custom
  const fileLabel = page.locator('.custom-file-upload').first();
  await expect(fileLabel).toBeVisible();

  await page.screenshot({ path: 'screenshots/verify-square-menu.png' });
});
