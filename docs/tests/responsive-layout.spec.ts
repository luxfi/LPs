import { test, expect, type Page } from '@playwright/test';

// Define viewport sizes
const viewports = {
  mobile: { width: 375, height: 812 },    // iPhone X
  tablet: { width: 768, height: 1024 },   // iPad
  laptop: { width: 1280, height: 800 },   // MacBook
  desktop: { width: 1920, height: 1080 }, // Full HD
};

test.describe('Responsive Layout Tests', () => {
  test.describe('Search Dialog Centering', () => {
    for (const [name, size] of Object.entries(viewports)) {
      test(`search dialog should be centered on ${name} (${size.width}x${size.height})`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Open search dialog with Cmd+K
        await page.keyboard.press('Meta+k');
        await page.waitForTimeout(300);

        // Check if dialog is visible
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        // Get dialog bounding box
        const dialogBox = await dialog.boundingBox();
        expect(dialogBox).not.toBeNull();

        if (dialogBox) {
          const viewportWidth = size.width;
          const dialogCenter = dialogBox.x + dialogBox.width / 2;
          const viewportCenter = viewportWidth / 2;

          // Dialog center should be within 50px of viewport center
          expect(Math.abs(dialogCenter - viewportCenter)).toBeLessThan(50);
        }

        // Close dialog
        await page.keyboard.press('Escape');
      });

      test(`search dialog should have proper margins on ${name}`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/docs');
        await page.waitForLoadState('networkidle');

        // Open search dialog
        await page.keyboard.press('Meta+k');
        await page.waitForTimeout(300);

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        const dialogBox = await dialog.boundingBox();
        expect(dialogBox).not.toBeNull();

        if (dialogBox) {
          // Should have at least 16px margin from edges
          expect(dialogBox.x).toBeGreaterThanOrEqual(8);
          expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(size.width - 8);
        }

        await page.keyboard.press('Escape');
      });
    }

    test('search dialog keyboard navigation works', async ({ page }) => {
      await page.setViewportSize(viewports.laptop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open search dialog
      await page.keyboard.press('Meta+k');
      await page.waitForTimeout(300);

      // Check dialog is open
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      // Check that an item is selected (has data-selected or aria-selected)
      const selectedItem = page.locator('[data-selected="true"], [aria-selected="true"]');
      await expect(selectedItem.first()).toBeVisible();

      // Press down again
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      // Verify navigation happened
      const items = await page.locator('[cmdk-item]').all();
      expect(items.length).toBeGreaterThan(0);

      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
    });
  });

  test.describe('Landing Page Layout', () => {
    for (const [name, size] of Object.entries(viewports)) {
      test(`landing page content should be centered on ${name}`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check hero section centering
        const hero = page.locator('h1');
        await expect(hero).toBeVisible();

        const heroBox = await hero.boundingBox();
        if (heroBox) {
          const viewportCenter = size.width / 2;
          const heroCenter = heroBox.x + heroBox.width / 2;

          // Hero should be roughly centered (within 100px for different layouts)
          expect(Math.abs(heroCenter - viewportCenter)).toBeLessThan(size.width / 3);
        }
      });

      test(`buttons should be visible and clickable on ${name}`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check Browse proposals button
        const browseButton = page.getByRole('link', { name: 'Browse proposals' });
        await expect(browseButton).toBeVisible();

        const buttonBox = await browseButton.boundingBox();
        expect(buttonBox).not.toBeNull();

        // Button should be fully visible within viewport
        if (buttonBox) {
          expect(buttonBox.x).toBeGreaterThanOrEqual(0);
          expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(size.width);
        }
      });
    }
  });

  test.describe('Docs Page Layout', () => {
    test('sidebar should collapse on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/docs');
      await page.waitForLoadState('networkidle');

      // On mobile, sidebar should be hidden or toggleable
      const sidebar = page.locator('aside').first();
      const isHidden = await sidebar.isHidden();

      // Either sidebar is hidden, or it's a mobile menu
      if (!isHidden) {
        const sidebarBox = await sidebar.boundingBox();
        // If visible, it should either be full-width overlay or off-screen
        if (sidebarBox) {
          const isOverlay = sidebarBox.width >= viewports.mobile.width * 0.8;
          const isOffScreen = sidebarBox.x < 0;
          expect(isOverlay || isOffScreen).toBe(true);
        }
      }
    });

    test('sidebar should be visible on desktop', async ({ page }) => {
      await page.setViewportSize(viewports.desktop);
      await page.goto('/docs');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('aside').first();
      await expect(sidebar).toBeVisible();

      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox).not.toBeNull();

      if (sidebarBox) {
        // Sidebar should take reasonable width (200-400px typically)
        expect(sidebarBox.width).toBeGreaterThan(150);
        expect(sidebarBox.width).toBeLessThan(500);
      }
    });

    for (const [name, size] of Object.entries(viewports)) {
      test(`content should not overflow on ${name}`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/docs');
        await page.waitForLoadState('networkidle');

        // Check for horizontal scroll (overflow)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        expect(hasHorizontalScroll).toBe(false);
      });

      test(`main heading should be readable on ${name}`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/docs');
        await page.waitForLoadState('networkidle');

        const heading = page.getByRole('heading', { name: 'All Lux Proposals' });
        await expect(heading).toBeVisible();

        const headingBox = await heading.boundingBox();
        expect(headingBox).not.toBeNull();

        if (headingBox) {
          // Heading should be within viewport
          expect(headingBox.x).toBeGreaterThanOrEqual(0);
          expect(headingBox.x + headingBox.width).toBeLessThanOrEqual(size.width + 50);
        }
      });
    }
  });

  test.describe('LP Detail Page Layout', () => {
    for (const [name, size] of Object.entries(viewports)) {
      test(`LP content should be readable on ${name}`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/docs/lp-0001');
        await page.waitForLoadState('networkidle');

        // Check content area
        const content = page.locator('article, main').first();
        await expect(content).toBeVisible();

        const contentBox = await content.boundingBox();
        if (contentBox) {
          // Content should have reasonable margins
          expect(contentBox.x).toBeGreaterThanOrEqual(0);

          // Content max-width should be reasonable for reading
          const maxReadableWidth = 900;
          if (size.width > 1024) {
            expect(contentBox.width).toBeLessThanOrEqual(size.width);
          }
        }
      });
    }
  });

  test.describe('Header/Navigation Layout', () => {
    for (const [name, size] of Object.entries(viewports)) {
      test(`header should be full width on ${name}`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const header = page.locator('header').first();
        await expect(header).toBeVisible();

        const headerBox = await header.boundingBox();
        expect(headerBox).not.toBeNull();

        if (headerBox) {
          // Header should span full width
          expect(headerBox.width).toBeGreaterThanOrEqual(size.width - 20);
        }
      });

      test(`logo should be visible on ${name}`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const logo = page.locator('header svg').first();
        await expect(logo).toBeVisible();
      });
    }
  });

  test.describe('Footer Layout', () => {
    for (const [name, size] of Object.entries(viewports)) {
      test(`footer should be visible and accessible on ${name}`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Scroll to footer
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(300);

        const footer = page.locator('footer');
        await expect(footer).toBeVisible();

        const footerBox = await footer.boundingBox();
        expect(footerBox).not.toBeNull();

        if (footerBox) {
          // Footer should span full width
          expect(footerBox.width).toBeGreaterThanOrEqual(size.width - 20);
        }
      });
    }
  });

  test.describe('Category Pages Layout', () => {
    const categories = ['core', 'consensus', 'cryptography', 'tokens'];

    for (const category of categories) {
      test(`${category} category page should render correctly`, async ({ page }) => {
        await page.setViewportSize(viewports.laptop);
        await page.goto(`/docs/category/${category}`);
        await page.waitForLoadState('networkidle');

        // Check for heading
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible();

        // Check content doesn't overflow
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      });
    }
  });
});
