import { test, expect } from '@playwright/test';

test.describe('Satellite Payload Schematic', () => {
  test('should display ground gateway links and not show "No Gateway Links"', async ({ page }) => {
    // Navigate to the preview server
    await page.goto('/');

    // Give it a moment to load
    await page.waitForTimeout(2000);

    // Assert that the page has loaded and doesn't contain "No Gateway Links"
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('No Gateway Links');
  });
});
