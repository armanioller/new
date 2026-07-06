import { test, expect } from '@playwright/test';

test('Player sinks in water (walks on terrain floor)', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Wait for game to load
  await page.waitForTimeout(2000);

  // Set time to day so we can see
  await page.evaluate(() => {
    window.Settings.time.timeOfDay = 12;
  });

  // Move player to a known water position (low height)
  // Our island is centered at 0,0. Let's move them far out.
  await page.evaluate(() => {
    const player = window.game.player;
    player.group.position.set(40, 0, 40); // Likely in water
  });

  await page.waitForTimeout(500);

  const physicsData = await page.evaluate(() => {
    const player = window.game.player;
    const terrain = window.game.terrain;
    const waterLevel = window.Settings.terrain.waterLevel;

    // Get terrain height at player position
    const terrainHeight = terrain.getHeight(player.group.position.x, player.group.position.z);

    return {
      playerY: player.group.position.y,
      terrainHeight: terrainHeight,
      waterLevel: waterLevel
    };
  });

  console.log('Physics Data:', physicsData);

  // Player should be at terrain height, even if it's below water level
  expect(physicsData.playerY).toBeCloseTo(physicsData.terrainHeight, 1);

  if (physicsData.terrainHeight < physicsData.waterLevel) {
    expect(physicsData.playerY).toBeLessThan(physicsData.waterLevel);
    console.log('Verified: Player is below water level at seabed.');
  } else {
    console.log('Warning: Position chosen was not in water. Adjusting test...');
    // Try even further out
    await page.evaluate(() => {
        window.game.player.group.position.set(60, 0, 60);
    });
    await page.waitForTimeout(500);
    const retryData = await page.evaluate(() => {
        return {
            playerY: window.game.player.group.position.y,
            terrainHeight: window.game.terrain.getHeight(window.game.player.group.position.x, window.game.player.group.position.z),
            waterLevel: window.Settings.terrain.waterLevel
        };
    });
    console.log('Retry Physics Data:', retryData);
    expect(retryData.playerY).toBeCloseTo(retryData.terrainHeight, 1);
    expect(retryData.playerY).toBeLessThan(retryData.waterLevel);
  }
});
