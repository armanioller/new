import { test, expect } from '@playwright/test';

test('Frontend Verification - Horizon and Waves', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // 1. Noon Horizon
  await page.evaluate(() => {
    window.Settings.time.frozen = true;
    window.Settings.time.timeOfDay = 12;
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/verify-horizon-noon.png' });

  // 2. Sunset Horizon
  await page.evaluate(() => {
    window.Settings.time.timeOfDay = 18;
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/verify-horizon-sunset.png' });

  // 3. Midnight Horizon
  await page.evaluate(() => {
    window.Settings.time.timeOfDay = 0;
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/verify-horizon-midnight.png' });

  // 4. Verify UI Tab "Sistema" (previously broken)
  await page.click('#settings-toggle');
  await page.waitForTimeout(500);
  await page.click('button[data-tab="tab-presets"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/verify-ui-sistema.png' });
});
