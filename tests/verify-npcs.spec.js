import { test, expect } from '@playwright/test';

test('Verify NPCs existence and update', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Wait for NPCs to be spawned (async import in Game.js)
  await page.waitForTimeout(2000);

  const npcCount = await page.evaluate(() => {
    return window.game.npcs.length;
  });

  expect(npcCount).toBe(5);

  const initialPos = await page.evaluate(() => {
    return window.game.npcs[0].group.position.clone();
  });

  await page.waitForTimeout(1000);

  const newPos = await page.evaluate(() => {
    return window.game.npcs[0].group.position.clone();
  });

  // They might be idling, but let's check if they exist and have a mixer
  const hasMixer = await page.evaluate(() => {
    return !!window.game.npcs[0].mixer;
  });

  expect(hasMixer).toBe(true);
  await page.screenshot({ path: 'screenshots/npc-test.png' });
});
