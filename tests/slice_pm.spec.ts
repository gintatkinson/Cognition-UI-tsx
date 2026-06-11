import { test, expect } from '@playwright/test';

test.describe('OTN Network Slice Performance Monitoring E2E', () => {
  test('should configure, validate, and monitor OTN slice performance objectives', async ({ page }) => {
    // 1. Set larger viewport to accommodate sidebar items
    await page.setViewportSize({ width: 1280, height: 1000 });

    // 2. Navigate to dashboard
    await page.goto('/');
    await page.waitForTimeout(1500);

    const googleLoginButton = page.locator('button', { hasText: 'Continue with Google' });
    if (await googleLoginButton.count() > 0) {
      await googleLoginButton.click();
      await page.waitForTimeout(1000);
    }

    // 2. Click Slices nav item in the sidebar
    const slicesNavButton = page.locator('nav button', { hasText: 'Slices' });
    await expect(slicesNavButton).toBeVisible();
    await slicesNavButton.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(500);
    await slicesNavButton.click();
    await page.waitForTimeout(1000);

    // 3. Double-click mock OTN slice-3 to drill down to its details view
    const sliceRow = page.locator('table tbody tr', { hasText: 'slice-3' }).first();
    await expect(sliceRow).toBeVisible();
    await sliceRow.dblclick();
    await page.waitForTimeout(1500);

    // 4. Verify OTN PM SLO configuration card is visible
    const pmCard = page.locator('#otn-pm-slo-card');
    await expect(pmCard).toBeVisible();

    // 5. Verify pre-configured objectives are present
    const rows = page.locator('[data-testid="pm-objective-row"]');
    await expect(rows).toHaveCount(2);

    // 6. Verify Alarm Status:
    // - odu-ses (limit 15 vs live 20) -> Exceeded alarm
    const sesRow = page.locator('[data-testid="pm-objective-row"]', { hasText: 'odu-ses' });
    await expect(sesRow.locator('[data-testid="alarm-badge"]')).toBeVisible();

    // - odu-ber (limit 100 vs live 80) -> Normal
    const berRow = page.locator('[data-testid="pm-objective-row"]', { hasText: 'odu-ber' });
    await expect(berRow.locator('[data-testid="normal-badge"]')).toBeVisible();

    // 7. Add a new valid PM objective (Scenario 1)
    await page.selectOption('#pm-duration-select', 'pm-15m');
    await page.selectOption('#pm-type-select', 'odu-bbe');
    await page.fill('#pm-threshold-input', '10');
    await page.click('#add-pm-objective-btn');
    await page.waitForTimeout(500);

    // Verify success banner is shown and list is updated to 3 rows
    await expect(page.locator('#pm-validation-success')).toBeVisible();
    await expect(rows).toHaveCount(3);
    const bbeRow = page.locator('[data-testid="pm-objective-row"]', { hasText: 'odu-bbe' });
    await expect(bbeRow).toBeVisible();
    await expect(bbeRow.locator('td').nth(2)).toHaveText('10');

    // 8. Reject duplicate PM objective (Scenario 2)
    await page.selectOption('#pm-duration-select', 'pm-15m');
    await page.selectOption('#pm-type-select', 'odu-bbe');
    await page.fill('#pm-threshold-input', '20');
    await page.click('#add-pm-objective-btn');
    await page.waitForTimeout(500);

    // Verify error banner is shown and list remains 3 rows
    await expect(page.locator('#pm-validation-error')).toBeVisible();
    await expect(page.locator('#pm-validation-error')).toContainText('Duplicate objective');
    await expect(rows).toHaveCount(3);

    // 9. Delete the newly added objective
    const deleteBtn = bbeRow.locator('[data-testid="delete-pm-objective-btn"]');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    await page.waitForTimeout(500);

    // Verify success banner is shown and list is reduced to 2 rows
    await expect(page.locator('#pm-validation-success')).toBeVisible();
    await expect(rows).toHaveCount(2);
  });
});
