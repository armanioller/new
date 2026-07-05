import { test, expect } from '@playwright/test';

test('Verify Medieval UI and Camera fixes', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#game-canvas');

  await page.screenshot({ path: 'verification-medieval-error.png' });

  // Try to find any error text
  const overlay = page.locator('vite-error-overlay');
  if (await overlay.isVisible()) {
      const text = await overlay.innerText();
      console.log('VITE ERROR:', text);
  }
});
