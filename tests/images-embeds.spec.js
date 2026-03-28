const { test, expect } = require('@playwright/test');

test.describe('Images', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('all images have alt attributes', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `Image ${i} missing alt attribute`).toBeTruthy();
    }
  });

  test('all local images load successfully (no 404)', async ({ page }) => {
    const failed = [];
    page.on('response', response => {
      if (response.url().includes('/images/') && response.status() >= 400) {
        failed.push({ url: response.url(), status: response.status() });
      }
    });

    // Visit all tabs to trigger lazy loading
    const tabs = page.locator('.tab');
    for (let i = 0; i < 5; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(800);
      // Scroll to bottom to trigger lazy images
      await page.locator('.page.active').evaluate(el => el.scrollTo(0, el.scrollHeight));
      await page.waitForTimeout(500);
    }

    expect(failed).toEqual([]);
  });

  test('photo-row images are not distorted (aspect ratio preserved)', async ({ page }) => {
    // Navigate through all tabs
    const tabs = page.locator('.tab');
    for (let i = 0; i < 5; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(600);
    }

    const photoRowImages = page.locator('.photo-row .photo');
    const count = await photoRowImages.count();
    for (let i = 0; i < count; i++) {
      const img = photoRowImages.nth(i);
      const box = await img.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        // In a photo-row with aspect-ratio: 1, images should be roughly square
        // Allow some tolerance for rounding
        const ratio = box.width / box.height;
        expect(ratio, `Photo-row image ${i} has unexpected ratio ${ratio}`)
          .toBeGreaterThan(0.8);
        expect(ratio).toBeLessThan(1.25);
      }
    }
  });

  test('photo-strip is horizontally scrollable', async ({ page }) => {
    const strip = page.locator('.photo-strip').first();
    if (await strip.count() > 0) {
      const scrollWidth = await strip.evaluate(el => el.scrollWidth);
      const clientWidth = await strip.evaluate(el => el.clientWidth);
      expect(scrollWidth).toBeGreaterThan(clientWidth);
    }
  });
});

test.describe('Embeds', () => {
  test('Spotify track embed has valid src', async ({ page }) => {
    await page.goto('/');
    const iframe = page.locator('.hero-player iframe');
    const src = await iframe.getAttribute('src');
    expect(src).toContain('open.spotify.com/embed/track/');
    expect(src).not.toContain('undefined');
    expect(src).not.toContain('null');
  });

  test('Spotify embed iframe is not clipped', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const player = page.locator('.hero-player');
    const iframe = page.locator('.hero-player iframe');

    const playerBox = await player.boundingBox();
    const iframeBox = await iframe.boundingBox();

    if (playerBox && iframeBox) {
      // iframe should fit within or match the player container
      expect(iframeBox.height).toBeGreaterThanOrEqual(100);
      // Player container should be at least as tall as the iframe
      expect(playerBox.height).toBeGreaterThanOrEqual(iframeBox.height - 2);
    }
  });

  test('YouTube embed on gift page has data-src', async ({ page }) => {
    await page.goto('/');
    const iframe = page.locator('#gift-video-iframe');
    const dataSrc = await iframe.getAttribute('data-src');
    expect(dataSrc).toContain('youtube.com/embed');
    // Should NOT be loaded yet (lazy)
    const src = await iframe.getAttribute('src');
    expect(src).toBe('about:blank');
  });
});
