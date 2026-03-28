const { test, expect } = require('@playwright/test');

test.describe('Layout and responsive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('no horizontal overflow on any page', async ({ page }) => {
    const tabs = page.locator('.tab');
    for (let i = 0; i < 5; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(600);

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow, `Page ${i} has horizontal overflow`).toBe(false);
    }
  });

  test('nav bar is fully visible and not overlapping content', async ({ page }) => {
    const nav = page.locator('.nav-bar');
    const box = await nav.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.height).toBeGreaterThanOrEqual(40);
    expect(box.height).toBeLessThanOrEqual(80);
  });

  test('all tab icons are visible (not clipped)', async ({ page }) => {
    const icons = page.locator('.tab-icon');
    const count = await icons.count();
    for (let i = 0; i < count; i++) {
      const box = await icons.nth(i).boundingBox();
      expect(box, `Tab icon ${i} has no bounding box`).toBeTruthy();
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    }
  });

  test('page content does not exceed max-width', async ({ page }) => {
    const tabs = page.locator('.tab');
    for (let i = 0; i < 5; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(600);

      const contents = page.locator('.page.active .page-content');
      const count = await contents.count();
      if (count > 0) {
        const box = await contents.first().boundingBox();
        if (box) {
          expect(box.width).toBeLessThanOrEqual(530); // max-width: 520px + tolerance
        }
      }
    }
  });

  test('menu card double border renders correctly', async ({ page }) => {
    await page.locator('.tab').nth(2).click();
    await page.waitForTimeout(600);

    const card = page.locator('.menu-card');
    const box = await card.boundingBox();
    expect(box).toBeTruthy();
    expect(box.width).toBeGreaterThan(200);
    expect(box.height).toBeGreaterThan(200);
  });

  test('gift reveal button is centered', async ({ page }) => {
    await page.locator('.tab').nth(4).click();
    await page.waitForTimeout(600);

    const btn = page.locator('#gift-reveal-btn');
    const btnBox = await btn.boundingBox();
    const viewport = page.viewportSize();

    if (btnBox && viewport) {
      const btnCenter = btnBox.x + btnBox.width / 2;
      const vpCenter = viewport.width / 2;
      expect(Math.abs(btnCenter - vpCenter)).toBeLessThan(20);
    }
  });

  test('CSS custom properties resolve (no raw var references)', async ({ page }) => {
    const unresolved = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const vars = ['--bg', '--cream', '--orange', '--gold', '--nav-bg'];
      const broken = [];
      for (const v of vars) {
        const val = root.getPropertyValue(v).trim();
        if (!val || val.includes('var(')) broken.push(v);
      }
      return broken;
    });
    expect(unresolved).toEqual([]);
  });
});

test.describe('Typography', () => {
  test('hero title uses gradient text (not plain color)', async ({ page }) => {
    await page.goto('/');
    const title = page.locator('.hero-title');
    const fill = await title.evaluate(el => getComputedStyle(el).webkitTextFillColor);
    // Chromium returns rgba(0,0,0,0) instead of "transparent"
    expect(fill === 'transparent' || fill === 'rgba(0, 0, 0, 0)').toBe(true);
  });

  test('text is readable (not same color as background)', async ({ page }) => {
    await page.goto('/');
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    const textColor = await page.evaluate(() =>
      getComputedStyle(document.body).color
    );
    expect(bgColor).not.toBe(textColor);
  });
});
