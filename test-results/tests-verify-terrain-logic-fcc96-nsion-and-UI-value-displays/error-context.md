# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/verify-terrain-logic-and-ui.spec.js >> Verify terrain expansion and UI value displays
- Location: tests/verify-terrain-logic-and-ui.spec.js:3:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "60"
Received: ""
```

# Page snapshot

```yaml
- generic [active]:
  - generic:
    - generic [ref=e2]:
      - generic [ref=e3]: Mochila
      - generic [ref=e4]:
        - generic [ref=e5]:
          - generic [ref=e6]: 🪵
          - generic [ref=e7]: "0"
        - generic [ref=e8]:
          - generic [ref=e9]: 🪨
          - generic [ref=e10]: "0"
    - generic [ref=e11]: 12:00
    - button "⚙️" [ref=e12] [cursor=pointer]
    - generic [ref=e13]:
      - heading "Configurações" [level=2] [ref=e15]
      - generic [ref=e16]:
        - button "Ambiente" [ref=e17] [cursor=pointer]
        - button "Câmera" [ref=e18] [cursor=pointer]
        - button "Construção" [ref=e19] [cursor=pointer]
        - button "Terreno" [ref=e20] [cursor=pointer]
        - button "Sistema" [ref=e21] [cursor=pointer]
      - generic [ref=e23]:
        - generic [ref=e24]:
          - heading "Controle do Tempo" [level=3] [ref=e25]
          - generic [ref=e26]:
            - generic [ref=e27]:
              - checkbox
            - generic [ref=e29]: Tempo Real (UTC)
          - generic [ref=e30]:
            - generic [ref=e31]:
              - checkbox
            - generic [ref=e33]: Congelar Tempo
        - generic [ref=e34]:
          - heading "Cores do Céu" [level=3] [ref=e35]
          - generic [ref=e36]:
            - generic [ref=e37]:
              - generic [ref=e38]: Noite
              - textbox [ref=e39] [cursor=pointer]: "#020205"
            - generic [ref=e40]:
              - generic [ref=e41]: Alvorada
              - textbox [ref=e42] [cursor=pointer]: "#ffa07a"
            - generic [ref=e43]:
              - generic [ref=e44]: Dia
              - textbox [ref=e45] [cursor=pointer]: "#87ceeb"
            - generic [ref=e46]:
              - generic [ref=e47]: Sunset
              - textbox [ref=e48] [cursor=pointer]: "#ff4500"
    - generic: "[F] Colher | [B] Construir | [Espaço] Pular"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  |
  3  | test('Verify terrain expansion and UI value displays', async ({ page }) => {
  4  |     await page.setViewportSize({ width: 1280, height: 720 });
  5  |     await page.goto('http://localhost:5173');
  6  |     await page.waitForTimeout(3000);
  7  |
  8  |     // Toggle settings and switch to Terreno tab
  9  |     await page.evaluate(() => {
  10 |         document.getElementById('settings-menu').classList.add('open');
  11 |         const tabBtn = document.querySelector('button[data-tab="tab-terreno"]');
  12 |         if (tabBtn) tabBtn.click();
  13 |     });
  14 |
  15 |     await page.waitForTimeout(500);
  16 |
  17 |     // Check specifically for the Terrain Size value
  18 |     const sizeVal = await page.locator('#val-terrain-size').textContent();
  19 |     console.log('Current Terrain Size UI Value:', sizeVal);
  20 |
> 21 |     expect(sizeVal).toBe('60'); // Our new default
     |                     ^ Error: expect(received).toBe(expected) // Object.is equality
  22 |
  23 |     // Change slider and check if UI update
  24 |     await page.fill('#terrain-size', '70');
  25 |     await page.dispatchEvent('#terrain-size', 'change');
  26 |
  27 |     const newSizeVal = await page.locator('#val-terrain-size').textContent();
  28 |     expect(newSizeVal).toBe('70');
  29 |
  30 |     // Take screenshot
  31 |     await page.screenshot({ path: 'screenshots/verify-terrain-logic.png' });
  32 | });
  33 |
```