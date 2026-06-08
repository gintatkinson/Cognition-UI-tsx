import { test, expect } from '@playwright/test';

test.describe('Links View Expansion & Layout', () => {
  test('should expand a link and display layered transport, endpoints horizontally, and services', async ({ page }) => {
    // 1. Navigate to main dashboard
    await page.goto('/');

    // Give it a moment to load and handle potential mock login
    await page.waitForTimeout(1500);

    // Click mock login button if visible
    const googleLoginButton = page.locator('button', { hasText: 'Continue with Google' });
    if (await googleLoginButton.count() > 0) {
      await googleLoginButton.click();
      await page.waitForTimeout(1000);
    }

    // 2. Click the 'Links' button in the sidebar to navigate to LinksView
    const linksNavButton = page.locator('nav button', { hasText: 'Links' });
    await expect(linksNavButton).toBeVisible();
    await linksNavButton.click();

    // Give view time to load links table
    await page.waitForTimeout(1000);

    // 3. Find the first row in the table body and click its expand/chevron cell
    // The table body has rows, and the first cell (index 0) in the row contains the expand chevron.
    const firstRowExpandCell = page.locator('table tbody tr').first().locator('td').first();
    await expect(firstRowExpandCell).toBeVisible();
    await firstRowExpandCell.click();

    // 4. Check if the sub-row is expanded and contains our target elements
    // The sub-row has text like "Layered Transport Link Stack" and "Endpoints & Logical Overlays"
    const stackHeader = page.locator('text=Layered Transport Link Stack');
    await expect(stackHeader).toBeVisible();

    const endpointsHeader = page.locator('text=Endpoints & Logical Overlays');
    await expect(endpointsHeader).toBeVisible();

    // 5. Verify endpoints layout structure - A-End and Z-End connections should be present
    const aEndHeader = page.locator('text=A-End Connection');
    await expect(aEndHeader).toBeVisible();

    const zEndHeader = page.locator('text=Z-End Connection');
    await expect(zEndHeader).toBeVisible();

    // 6. Verify they sit inside a responsive grid layout
    // The grid should have the classes: grid grid-cols-1 md:grid-cols-2
    const gridContainer = page.locator('.grid-cols-1.md\\:grid-cols-2');
    await expect(gridContainer).toBeVisible();
  });
});
