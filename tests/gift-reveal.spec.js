const { test, expect } = require('@playwright/test');

test.describe('Gift reveal interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Navigate to gift tab
    await page.locator('.tab').nth(4).click();
    await page.waitForTimeout(600);
  });

  test('gift reveal button is visible before click', async ({ page }) => {
    const btn = page.locator('#gift-reveal-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('reveal panel is hidden before click', async ({ page }) => {
    const panel = page.locator('#gift-reveal-panel');
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    // Check panel has max-height: 0 (hidden)
    const maxHeight = await panel.evaluate(el => getComputedStyle(el).maxHeight);
    expect(maxHeight).toBe('0px');
  });

  test('clicking reveal button shows the panel', async ({ page }) => {
    await page.locator('#gift-reveal-btn').click();
    await page.waitForTimeout(1500); // wait for GSAP animation

    const panel = page.locator('#gift-reveal-panel');
    await expect(panel).toHaveAttribute('aria-hidden', 'false');

    // Panel should now be visible
    const opacity = await panel.evaluate(el => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(1);
  });

  test('reveal button disappears after click', async ({ page }) => {
    await page.locator('#gift-reveal-btn').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('#gift-reveal-btn')).not.toBeVisible();
  });

  test('YouTube iframe loads on reveal', async ({ page }) => {
    const iframe = page.locator('#gift-video-iframe');
    // Before click: src should be about:blank
    const srcBefore = await iframe.getAttribute('src');
    expect(srcBefore).toBe('about:blank');

    await page.locator('#gift-reveal-btn').click();
    await page.waitForTimeout(1000);

    // After click: src should be YouTube embed
    const srcAfter = await iframe.getAttribute('src');
    expect(srcAfter).toContain('youtube.com/embed');
  });

  test('expo card link points to reptile expo', async ({ page }) => {
    await page.locator('#gift-reveal-btn').click();
    await page.waitForTimeout(1500);

    const card = page.locator('.expo-card');
    await expect(card).toHaveAttribute('href', /reptileexpo\.com/);
  });

  test('coda text appears after reveal', async ({ page }) => {
    await page.locator('#gift-reveal-btn').click();
    await page.waitForTimeout(2000); // wait for panel + coda delay

    const coda = page.locator('#gift-coda');
    const opacity = await coda.evaluate(el => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0);
  });
});
