import { test, expect } from '@playwright/test';

// Define a reusable function for taking screenshots
async function takeScreenshot(page, name) {
  const screenshotPath = `screenshots/${name}.png`;
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to ${screenshotPath}`);
}

test('Take screenshot of landing page', async ({ page }) => {
  // Navigate to the landing page
  await page.goto('/');
  
  // Wait for the page to load completely
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot of the entire page
  await takeScreenshot(page, 'landing-page-full');
  
  // Take a screenshot of the hero section
  const heroSection = await page.locator('section').first();
  if (await heroSection.isVisible()) {
    await heroSection.scrollIntoViewIfNeeded();
    await takeScreenshot(page, 'landing-page-hero');
  }
  
  // Take a screenshot of the categories section
  const categoriesSection = await page.getByText('Categories').locator('..');
  if (await categoriesSection.isVisible()) {
    await categoriesSection.scrollIntoViewIfNeeded();
    await takeScreenshot(page, 'landing-page-categories');
  }
  
  // Take a screenshot of the footer
  const footer = await page.locator('footer');
  if (await footer.isVisible()) {
    await footer.scrollIntoViewIfNeeded();
    await takeScreenshot(page, 'landing-page-footer');
  }
});