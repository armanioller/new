import { test, expect } from '@playwright/test';

test('Verify Environment and Infinite Sea', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Check if scene background is set (indicating environment manager is working)
  const backgroundSet = await page.evaluate(() => {
    return !!window.game.engine.scene.background;
  });
  expect(backgroundSet).toBe(true);

  // Check if water is large (Infinite Sea)
  const waterRadius = await page.evaluate(() => {
    const water = window.game.terrain.water;
    return water.geometry.parameters.radius;
  });
  expect(waterRadius).toBeGreaterThan(1000);

  // Check if Fog is active
  const hasFog = await page.evaluate(() => {
    return !!window.game.engine.scene.fog;
  });
  expect(hasFog).toBe(true);
});
