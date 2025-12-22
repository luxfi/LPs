import { test, expect } from '@playwright/test';

// Increase timeout for all tests in this file
test.setTimeout(60000);

test.describe('LP Page Routing', () => {
  test('should load docs index page', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('domcontentloaded');

    // Page should have content
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('should load LP-0000 foundation page', async ({ page }) => {
    await page.goto('/docs/lp-0000');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('article, main');
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test('should load LRC-20 token standard page', async ({ page }) => {
    await page.goto('/docs/lp-3020');
    await page.waitForLoadState('domcontentloaded');

    const content = page.locator('article, main');
    await expect(content).toBeVisible({ timeout: 15000 });

    // Should contain token-related content
    const pageText = await page.textContent('body');
    expect(pageText?.toLowerCase()).toContain('token');
  });
});

test.describe('Category Page Routing', () => {
  test('should load network category page', async ({ page }) => {
    await page.goto('/docs/category/network');
    await page.waitForLoadState('domcontentloaded');

    const hasContent = await page.locator('h1, h2, article, a[href*="/docs/lp-"]').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('should load lrc category page', async ({ page }) => {
    await page.goto('/docs/category/lrc');
    await page.waitForLoadState('domcontentloaded');

    const hasContent = await page.locator('h1, h2, article, a[href*="/docs/lp-"]').count();
    expect(hasContent).toBeGreaterThan(0);
  });
});

test.describe('Navigation', () => {
  test('should have working internal links from docs index', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('domcontentloaded');

    // Find LP links
    const lpLinks = page.locator('a[href*="/docs/lp-"]');
    const count = await lpLinks.count();
    expect(count).toBeGreaterThan(10);
  });

  test('should have sidebar navigation', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('domcontentloaded');

    const sidebar = page.locator('aside, nav').first();
    await expect(sidebar).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Build Validation', () => {
  test('docs index should list many LPs', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('domcontentloaded');

    const lpReferences = page.locator('text=/LP-\\d{4}/');
    const count = await lpReferences.count();
    expect(count).toBeGreaterThan(20);
  });

  test('should have valid page title', async ({ page }) => {
    await page.goto('/docs/lp-0000');
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('LP pages should render markdown content', async ({ page }) => {
    await page.goto('/docs/lp-0000');
    await page.waitForLoadState('domcontentloaded');

    // Should have headings
    const h2 = page.locator('h2');
    const h2Count = await h2.count();
    expect(h2Count).toBeGreaterThan(0);
  });
});
