import { test, expect } from '@playwright/test';

test('verify ui and water', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Open settings
  await page.click('#settings-toggle');
  await page.waitForTimeout(500);

  // Check if tabs work
  await page.click('button[data-tab="tab-terreno"]');
  const terrenoVisible = await page.isVisible('#tab-terreno.active');
  console.log('Terreno tab visible:', terrenoVisible);

  await page.click('button[data-tab="tab-presets"]');
  const presetsVisible = await page.isVisible('#tab-presets.active');
  console.log('Presets tab visible:', presetsVisible);

  // Check if water meshes exist in the scene (via console)
  const data = await page.evaluate(() => {
    let count = 0;
    let waterNames = [];
    window.game.engine.scene.traverse(obj => {
      if (obj.name && obj.name.includes('water')) {
        count++;
        waterNames.push(obj.name);
      }
    });
    return { count, waterNames };
  });
  console.log('Water meshes found:', data.count, data.waterNames);

  // Take screenshot of the horizon
  await page.screenshot({ path: 'screenshots/verify-horizon-final.png' });
});
