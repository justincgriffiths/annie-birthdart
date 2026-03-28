const { test, expect } = require('@playwright/test');

test.describe('Page structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('all 5 nav tabs exist with correct labels', async ({ page }) => {
    const tabs = page.locator('.tab');
    await expect(tabs).toHaveCount(5);
    const labels = ['Home', 'Weekend', 'Menu', 'Résumé', 'Gift'];
    for (let i = 0; i < labels.length; i++) {
      await expect(tabs.nth(i).locator('.tab-label')).toHaveText(labels[i]);
    }
  });

  test('all 5 page sections exist with matching IDs', async ({ page }) => {
    const ids = ['home', 'weekend', 'menu', 'pubs', 'gift'];
    for (const id of ids) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test('nav tab data-page indices match section order', async ({ page }) => {
    const tabs = page.locator('.tab');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      const dataPage = await tabs.nth(i).getAttribute('data-page');
      expect(Number(dataPage)).toBe(i);
    }
  });

  test('home page is active by default', async ({ page }) => {
    await expect(page.locator('#home')).toHaveClass(/active/);
    await expect(page.locator('.tab').first()).toHaveClass(/active/);
  });

  test('no console errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});
