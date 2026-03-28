const { test, expect } = require('@playwright/test');

test.describe('Tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500); // wait for initial animations
  });

  test('clicking each tab shows the correct page', async ({ page }) => {
    const ids = ['home', 'weekend', 'menu', 'pubs', 'gift'];
    const tabs = page.locator('.tab');

    for (let i = 0; i < ids.length; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(600); // wait for GSAP transition
      await expect(page.locator(`#${ids[i]}`)).toHaveClass(/active/);
      await expect(tabs.nth(i)).toHaveClass(/active/);
    }
  });

  test('only one page is active at a time', async ({ page }) => {
    const tabs = page.locator('.tab');
    for (let i = 0; i < 5; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(600);
      const activePages = await page.locator('.page.active').count();
      expect(activePages).toBe(1);
    }
  });

  test('keyboard arrow navigation works', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
    await expect(page.locator('#weekend')).toHaveClass(/active/);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(600);
    await expect(page.locator('#home')).toHaveClass(/active/);
  });

  test('resume toggle switches between Dr. Nigra and College Annie', async ({ page }) => {
    // Navigate to resume tab
    await page.locator('.tab').nth(3).click();
    await page.waitForTimeout(600);

    // Dr. Nigra should be active by default
    await expect(page.locator('#resume-pro')).toHaveClass(/active/);
    await expect(page.locator('#resume-college')).not.toHaveClass(/active/);

    // Click College Annie
    await page.locator('.toggle-btn[data-mode="college"]').click();
    await expect(page.locator('#resume-college')).toHaveClass(/active/);
    await expect(page.locator('#resume-pro')).not.toHaveClass(/active/);

    // Click back to Dr. Nigra
    await page.locator('.toggle-btn[data-mode="pro"]').click();
    await expect(page.locator('#resume-pro')).toHaveClass(/active/);
  });

  test('URL hash updates on tab navigation', async ({ page }) => {
    const tabs = page.locator('.tab');
    await tabs.nth(2).click();
    await page.waitForTimeout(600);
    expect(page.url()).toContain('#menu');

    await tabs.nth(4).click();
    await page.waitForTimeout(600);
    expect(page.url()).toContain('#gift');
  });

  test('loading with hash navigates to correct page', async ({ page }) => {
    await page.goto('/#gift');
    await page.waitForTimeout(1000);
    await expect(page.locator('#gift')).toHaveClass(/active/);
  });

  test('all tab labels are visible (not just active)', async ({ page }) => {
    const labels = page.locator('.tab-label');
    const count = await labels.count();
    for (let i = 0; i < count; i++) {
      await expect(labels.nth(i)).toBeVisible();
    }
  });
});
