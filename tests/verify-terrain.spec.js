import { test, expect } from '@playwright/test';

test('verify terrain borders and UI tabs', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Aguarda o canvas carregar
  await page.waitForSelector('#game-canvas');

  // Abre o menu de configurações
  await page.click('#settings-toggle');
  await page.waitForSelector('#settings-menu', { state: 'visible' });

  // Verifica as Tabs
  const tabs = ['tab-ambiente', 'tab-camera', 'tab-terreno', 'tab-presets'];
  for (const tabId of tabs) {
    const btnSelector = `.tab-btn[data-tab="${tabId}"]`;
    await page.click(btnSelector);
    await expect(page.locator(`#${tabId}`)).toBeVisible();
    await page.screenshot({ path: `screenshot-tab-${tabId}.png` });
  }

  // Testa o nível da água no terreno (usando dispatchEvent para ranges)
  await page.click('.tab-btn[data-tab="tab-terreno"]');
  await page.locator('#water-level').evaluate((el, val) => {
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, '4.0');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-high-water.png' });

  // Volta para ambiente e muda a hora para Noite
  await page.click('.tab-btn[data-tab="tab-ambiente"]');
  await page.uncheck('#real-time-toggle');
  await page.locator('#time-slider').evaluate((el, val) => {
    el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, '0');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-midnight.png' });
});
