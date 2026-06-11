import { test, expect } from '@playwright/test';

test.describe('OTN Network Resource Partition MPI Mapping E2E', () => {
  test('should configure and save NRP profile on an OTN topology link, and reject on a non-OTN link', async ({ page }) => {
    // 1. Set viewport size
    await page.setViewportSize({ width: 1280, height: 1000 });

    // 2. Navigate to dashboard and authenticate
    await page.goto('/');
    await page.waitForTimeout(1500);

    const googleLoginButton = page.locator('button', { hasText: 'Continue with Google' });
    if (await googleLoginButton.count() > 0) {
      await googleLoginButton.click();
      await page.waitForTimeout(1000);
    }

    // 3. Navigate to Base Network Topology page
    const baseNavButton = page.locator('nav button', { hasText: 'Base Network Topology' });
    await expect(baseNavButton).toBeVisible();
    await baseNavButton.click();
    await page.waitForTimeout(1500);

    // --- Scenario 1: Configure and save NRP on an OTN link ---
    // Select the OTN network container under Network Inventory by clicking its ID span
    const otnNetworkSpan = page.locator('span', { hasText: 'ID: underlay-OTN-L1' }).first();
    await expect(otnNetworkSpan).toBeVisible();
    await otnNetworkSpan.click();
    await page.waitForTimeout(1000);

    // Locate the logical OTN link drilldown and double-click to navigate to detail view
    const otnLinkDrilldown = page.locator('span[data-nav-id="link-OTN-TK-to-OS"]').first();
    await expect(otnLinkDrilldown).toBeVisible();
    await otnLinkDrilldown.dblclick();
    await page.waitForTimeout(1500);

    // Verify NRP Partitioning panel is visible
    const nrpPanel = page.locator('#nrp-partitioning-panel');
    await expect(nrpPanel).toBeVisible();

    // Select Link-Resource granularity
    await page.selectOption('#nrp-granularity', 'link-resource');
    await page.waitForTimeout(500);

    // Add an NRP partition: ID 101, time-slots, 8 slots
    await page.fill('#new-nrp-id', '101');
    await page.selectOption('#new-nrp-bandwidth', 'time-slots');
    await page.fill('#new-nrp-ts-num', '8');
    await page.click('#add-nrp-btn');
    await page.waitForTimeout(500);

    // Verify active NRP is added to the table
    const tableRow = page.locator('table tbody tr', { hasText: '101' }).first();
    await expect(tableRow).toBeVisible();
    await expect(tableRow).toContainText('time-slots');
    await expect(tableRow).toContainText('8 slot(s)');

    // Save the configuration
    await page.click('#save-nrp-profile-btn');
    await page.waitForTimeout(1000);

    // Verify success banner is shown
    const successBanner = page.locator('#nrp-validation-success');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText('NRP partitioning profile successfully mapped on the MPI.');

    // --- Scenario 2: Save NRP profile on a non-OTN link should fail ---
    // Click back button to return to the Base Network Topology page
    const backButton = page.locator('button:has(svg.lucide-arrow-left)').first();
    await backButton.click();
    await page.waitForTimeout(1500);

    // Select the non-OTN network container under Network Inventory
    const l0NetworkSpan = page.locator('span', { hasText: 'ID: underlay-L0' }).first();
    await expect(l0NetworkSpan).toBeVisible();
    await l0NetworkSpan.click();
    await page.waitForTimeout(1000);

    // Locate the logical L0 link drilldown and double-click to navigate to detail view
    const l0LinkDrilldown = page.locator('span[data-nav-id="link-L0-TK-to-OS"]').first();
    await expect(l0LinkDrilldown).toBeVisible();
    await l0LinkDrilldown.dblclick();
    await page.waitForTimeout(1500);

    // Verify NRP panel is visible on this link detail view too
    await expect(nrpPanel).toBeVisible();

    // Click Save NRP Configuration directly without changing granularity or adding partitions
    // This will hit the non-OTN validation first
    await page.click('#save-nrp-profile-btn');
    await page.waitForTimeout(1000);

    // Verify error banner is shown and contains the expected message
    const errorBanner = page.locator('#nrp-validation-error');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Link does not belong to an OTN topology network.');
  });
});
