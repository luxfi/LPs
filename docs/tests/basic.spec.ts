import { test, expect } from '@playwright/test';

test.describe('Lux Proposals Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Lux Proposals (LPs)');
  });

  test('should render the main heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Lux Proposals');
  });

  test('should render the search bar', async ({ page }) => {
    const searchBar = page.locator('input[placeholder="Search LPs..."]');
    await expect(searchBar).toBeVisible();
  });

  test('should render category cards', async ({ page }) => {
    const cards = page.locator('.category-card');
    await expect(cards).toHaveCount(6); // There are 6 categories
  });

  test('should render recent proposals', async ({ page }) => {
    const proposals = page.locator('.proposal-card');
    await expect(proposals).toHaveCount(6); // Showing 6 recent LPs
  });

  test('should navigate to docs when clicking Browse button', async ({ page }) => {
    await page.locator('text=Browse proposals').click();
    await expect(page).toHaveURL(/.*\/docs/);
  });

  test('should render the footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check for some important footer links
    await expect(page.locator('text=Ecosystem')).toBeVisible();
    await expect(page.locator('text=Network')).toBeVisible();
    await expect(page.locator('text=Company')).toBeVisible();
  });

  test('should render the Lux logo', async ({ page }) => {
    const logo = page.locator('svg').first(); // Lux logo is an SVG
    await expect(logo).toBeVisible();
  });

  test('should render stats correctly', async ({ page }) => {
    const stats = page.locator('.stats-item');
    await expect(stats).toHaveCount(4); // Total, Final, Review, Draft
    
    const totalStat = page.locator('.stats-number').first();
    await expect(totalStat).toContainText(/[0-9]+/); // Should have a number
  });
});

test.describe('Lux Proposals Documentation Pages', () => {
  test('should render a specific LP page', async ({ page }) => {
    // Go to a specific LP page
    await page.goto('/docs/lp-001');
    
    // Check for common elements on an LP page
    const title = page.locator('h1');
    await expect(title).toBeVisible();
  });
});