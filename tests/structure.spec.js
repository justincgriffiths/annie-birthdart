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

  test('nav tab data-page values match section IDs', async ({ page }) => {
    const tabs = page.locator('.tab');
    const sections = page.locator('.page');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      const dataPage = await tabs.nth(i).getAttribute('data-page');
      const sectionId = await sections.nth(i).getAttribute('id');
      expect(dataPage).toBe(sectionId);
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

  test('tab count matches section count (extensibility check)', async ({ page }) => {
    const tabCount = await page.locator('.tab').count();
    const sectionCount = await page.locator('.page').count();
    expect(tabCount).toBe(sectionCount);
    expect(tabCount).toBeGreaterThanOrEqual(5);
  });

  test('ARIA tab attributes are correctly wired', async ({ page }) => {
    const nav = page.locator('.nav-bar');
    await expect(nav).toHaveAttribute('role', 'tablist');

    const tabs = page.locator('.tab');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      await expect(tab).toHaveAttribute('role', 'tab');
      const dataPage = await tab.getAttribute('data-page');
      await expect(tab).toHaveAttribute('id', 'tab-' + dataPage);
      await expect(tab).toHaveAttribute('aria-controls', dataPage);
    }

    const sections = page.locator('.page');
    const sectionCount = await sections.count();
    for (let i = 0; i < sectionCount; i++) {
      const section = sections.nth(i);
      await expect(section).toHaveAttribute('role', 'tabpanel');
      const id = await section.getAttribute('id');
      await expect(section).toHaveAttribute('aria-labelledby', 'tab-' + id);
    }
  });
});
