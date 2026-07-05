import { test, expect } from '@playwright/test';

test('verify medieval resources and inventory', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(3000); // Wait for assets

  // Check if HUD inventory exists
  const woodCount = page.locator('#count-wood');
  const stoneCount = page.locator('#count-stone');
  await expect(woodCount).toBeVisible();
  await expect(stoneCount).toBeVisible();
  await expect(woodCount).toHaveText('0');

  // Take screenshot of the world with resources
  await page.screenshot({ path: '/home/jules/verification/screenshots/verification-resources.png' });

  // Simulate movement and interaction (this is hard without visual feedback, but let's try to check console)
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  // Press Space to harvest (might hit nothing but should trigger logic)
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  console.log('Interaction check complete');
});
