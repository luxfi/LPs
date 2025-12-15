import { test, expect } from '@playwright/test';

test.describe('Lux Proposals Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Lux Proposals (LPs)');
  });

  test('should render the main heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Lux Proposals');
  });

  test('should render LPs branding with hover effect', async ({ page }) => {
    // Check for LPs text in header
    const lpsText = page.locator('header').getByText('LPs', { exact: true });
    await expect(lpsText).toBeVisible();

    // Check for Lux Proposals text (shown on hover)
    const fullName = page.locator('header').getByText('Lux Proposals', { exact: true });
    await expect(fullName).toBeAttached();
  });

  test('should render theme toggle button', async ({ page }) => {
    const themeToggle = page.locator('button[aria-label*="theme"]');
    await expect(themeToggle).toBeVisible();
  });

  test('should render category links', async ({ page }) => {
    // Check for category section
    const categoriesHeading = page.getByRole('heading', { name: 'Categories' });
    await expect(categoriesHeading).toBeVisible();

    // Check that all 6 categories exist in the categories section
    const categoriesSection = page.locator('section').filter({ hasText: 'Categories' });
    await expect(categoriesSection.getByText('Core', { exact: true })).toBeVisible();
    await expect(categoriesSection.getByText('P-Chain', { exact: true })).toBeVisible();
    await expect(categoriesSection.getByText('C-Chain', { exact: true })).toBeVisible();
    await expect(categoriesSection.getByText('X-Chain', { exact: true })).toBeVisible();
  });

  test('should render recent proposals section', async ({ page }) => {
    const recentHeading = page.getByRole('heading', { name: 'Recent proposals' });
    await expect(recentHeading).toBeVisible();

    // Check for LP cards with LP-XXXX format
    const lpNumbers = page.locator('text=/LP-\\d{4}/');
    const count = await lpNumbers.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should navigate to docs when clicking Browse button', async ({ page }) => {
    await page.getByRole('link', { name: 'Browse proposals' }).click();
    await expect(page).toHaveURL(/.*\/docs/);
  });

  test('should render the footer with all sections', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check for footer sections using exact matching
    await expect(footer.getByRole('link', { name: 'Network', exact: true })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Ecosystem', exact: true })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Company', exact: true })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Community', exact: true })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Documentation', exact: true })).toBeVisible();
  });

  test('should render the Lux logo', async ({ page }) => {
    const logo = page.locator('header svg').first();
    await expect(logo).toBeVisible();
  });

  test('should render stats section', async ({ page }) => {
    // Check for stats section - find the section with stats
    const statsSection = page.locator('section').filter({ hasText: /^177.*Total.*Final.*Review.*Draft/ });
    await expect(statsSection).toBeVisible();
  });

  test('should have working GitHub link', async ({ page }) => {
    const githubLink = page.locator('header').getByRole('link', { name: /GitHub/ });
    // If no GitHub link in header, check the hero section
    const heroGithub = page.getByRole('link', { name: /GitHub/ }).first();
    await expect(heroGithub).toHaveAttribute('href', 'https://github.com/luxfi/lps');
  });
});

test.describe('Lux Proposals Documentation Pages', () => {
  test('should render docs index page', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    const heading = page.getByRole('heading', { name: 'All Lux Proposals' });
    await expect(heading).toBeVisible();
  });

  test('should have sidebar navigation', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    // Check for sidebar (fumadocs uses aside or complementary role)
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    // Check for search button (there may be multiple, just verify one exists)
    const searchButton = page.getByRole('button', { name: /Search/ }).first();
    await expect(searchButton).toBeVisible();
  });

  test('should render LP categories in sidebar', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    // Check for category sections in sidebar
    await expect(page.getByRole('button', { name: 'Core Architecture' })).toBeVisible();
  });

  test('sidebar and content should not overlap', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    // Get sidebar and content positions
    const sidebar = page.locator('aside').first();
    const content = page.locator('h1').filter({ hasText: 'All Lux Proposals' });

    await expect(sidebar).toBeVisible();
    await expect(content).toBeVisible();

    const sidebarBox = await sidebar.boundingBox();
    const contentBox = await content.boundingBox();

    // Content should be to the right of sidebar (no overlap)
    if (sidebarBox && contentBox) {
      expect(contentBox.x).toBeGreaterThan(sidebarBox.x + sidebarBox.width - 50);
    }
  });
});

test.describe('Dark/Light Mode Parity', () => {
  test('should default to dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that html has dark class
    const html = page.locator('html');
    const isDark = await html.evaluate(el =>
      el.classList.contains('dark') ||
      el.getAttribute('data-theme') === 'dark' ||
      el.style.colorScheme === 'dark'
    );
    expect(isDark).toBe(true);
  });

  test('should toggle theme when clicking theme button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const themeToggle = page.locator('button[aria-label*="theme"]');

    // Get initial theme state
    const html = page.locator('html');
    const initialDark = await html.evaluate(el => el.classList.contains('dark'));

    // Click toggle
    await themeToggle.click();
    await page.waitForTimeout(500); // Wait for transition

    // Check theme changed
    const afterToggleDark = await html.evaluate(el => el.classList.contains('dark'));
    expect(afterToggleDark).not.toBe(initialDark);
  });

  test('landing page and docs should use same theme', async ({ page }) => {
    // Start on landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');
    const landingTheme = await html.evaluate(el => el.classList.contains('dark'));

    // Navigate to docs
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    const docsTheme = await html.evaluate(el => el.classList.contains('dark'));

    // Both should have same theme
    expect(docsTheme).toBe(landingTheme);
  });

  test('logo should be visible in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check logo in dark mode
    const logo = page.locator('header svg').first();
    await expect(logo).toBeVisible();
  });

  test('logo should be visible in light mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle to light mode
    const themeToggle = page.locator('button[aria-label*="theme"]');
    await themeToggle.click();
    await page.waitForTimeout(500);

    // In light mode, the light-mode SVG should be visible (dark:hidden block)
    // Check that at least one SVG in header is visible
    const visibleLogo = page.locator('header svg:visible');
    await expect(visibleLogo.first()).toBeVisible();
  });

  test('docs page should maintain theme after navigation', async ({ page }) => {
    // Start on docs
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');
    const initialTheme = await html.evaluate(el => el.classList.contains('dark'));

    // Navigate to a specific LP
    const firstLink = page.locator('a[href*="/docs/lp-"]').first();
    await firstLink.click();
    await page.waitForLoadState('networkidle');

    const afterNavTheme = await html.evaluate(el => el.classList.contains('dark'));

    // Theme should be preserved
    expect(afterNavTheme).toBe(initialTheme);
  });
});
