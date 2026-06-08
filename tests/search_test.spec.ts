import { test, expect } from '@playwright/test';

test('verify R1-Core search and details page in GUI', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // 1. Navigate to dashboard
  await page.goto('/');
  await page.waitForTimeout(1500);

  // Authenticate if Continue with Google is present
  const googleLoginButton = page.locator('button', { hasText: 'Continue with Google' });
  if (await googleLoginButton.count() > 0) {
    await googleLoginButton.click();
    await page.waitForTimeout(1000);
  }

  // 2. Go to Devices tab
  const devicesNavButton = page.locator('nav button', { hasText: 'Devices' });
  await expect(devicesNavButton).toBeVisible();
  await devicesNavButton.click();
  await page.waitForTimeout(1000);

  // 3. Search for "R1-Core"
  const searchInput = page.locator('input[placeholder="Search devices..."]');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('R1-Core');
  await page.waitForTimeout(1500);

  // Take a screenshot of the search results
  const screenshotPath = '/Users/perkunas/.gemini/antigravity/brain/e235f3dc-e0c8-45a3-9c11-8d52553eb662/r1_core_search_results.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot of search results to: ${screenshotPath}`);

  // 4. Assert R1-Core is visible in the table
  const r1Row = page.locator('table tbody tr', { hasText: 'R1-Core' }).first();
  await expect(r1Row).toBeVisible();

  // 5. Double click the row to inspect details
  await r1Row.dblclick();
  await page.waitForTimeout(1500);

  // Take a screenshot of the details page
  const detailsScreenshotPath = '/Users/perkunas/.gemini/antigravity/brain/e235f3dc-e0c8-45a3-9c11-8d52553eb662/r1_core_details.png';
  await page.screenshot({ path: detailsScreenshotPath });
  console.log(`Saved screenshot of details page to: ${detailsScreenshotPath}`);
});

test('verify R1-Core hardware containment tree in IETF Explorer view', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // 1. Navigate to dashboard
  await page.goto('/');
  await page.waitForTimeout(1500);

  // Authenticate if Continue with Google is present
  const googleLoginButton = page.locator('button', { hasText: 'Continue with Google' });
  if (await googleLoginButton.count() > 0) {
    await googleLoginButton.click();
    await page.waitForTimeout(1000);
  }

  // 2. Go to IETF Domains tab
  const explorerNavButton = page.locator('nav button', { hasText: 'IETF Domains' });
  await expect(explorerNavButton).toBeVisible();
  await explorerNavButton.click();
  await page.waitForTimeout(1500);

  // 3. Search for "R1-Core" in inventory elements
  const filterInput = page.locator('input[placeholder="Filter inventory list..."]');
  await expect(filterInput).toBeVisible();
  await filterInput.fill('R1-Core');
  await page.waitForTimeout(1500);

  // 4. Find the row for R1-Core
  const r1Row = page.locator('table tbody tr', { hasText: 'R1-Core' }).first();
  await expect(r1Row).toBeVisible();

  // 5. Expand the containment tree by clicking the FolderTree button
  const folderTreeBtn = r1Row.locator('button[title="Expand Containment Tree (YANG BOM)"]').first();
  await expect(folderTreeBtn).toBeVisible();
  await folderTreeBtn.click();
  await page.waitForTimeout(1500);

  // Take a screenshot of the expanded tree
  const treeScreenshotPath = '/Users/perkunas/.gemini/antigravity/brain/e235f3dc-e0c8-45a3-9c11-8d52553eb662/r1_core_tree_expansion.png';
  await page.screenshot({ path: treeScreenshotPath });
  console.log(`Saved screenshot of expanded tree to: ${treeScreenshotPath}`);

  // 6. Assert that Chassis, Port eth0, Port eth1, and SFPs are visible in the tree rows
  const chassisRow = page.locator('table tbody tr', { hasText: 'R1-Core Chassis' }).first();
  const port0Row = page.locator('table tbody tr', { hasText: 'Physical Port eth0' }).first();
  const port1Row = page.locator('table tbody tr', { hasText: 'Physical Port eth1' }).first();
  const sfp0Row = page.locator('table tbody tr', { hasText: 'SFP Transceiver - eth0' }).first();
  const sfp1Row = page.locator('table tbody tr', { hasText: 'SFP Transceiver - eth1' }).first();

  await expect(chassisRow).toBeVisible();
  await expect(port0Row).toBeVisible();
  await expect(port1Row).toBeVisible();
  await expect(sfp0Row).toBeVisible();
  await expect(sfp1Row).toBeVisible();
});

test('verify no "Part: ---" placeholder exists in any device hardware containment tree in IETF Explorer view', async ({ page }) => {
  test.setTimeout(90000);
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  // 1. Navigate to dashboard and authenticate
  await page.goto('/');
  await page.waitForTimeout(1500);
  const googleLoginButton = page.locator('button', { hasText: 'Continue with Google' });
  if (await googleLoginButton.count() > 0) {
    await googleLoginButton.click();
    await page.waitForTimeout(1000);
  }
  // 2. Go to IETF Domains tab
  const explorerNavButton = page.locator('nav button', { hasText: 'IETF Domains' });
  await expect(explorerNavButton).toBeVisible();
  await explorerNavButton.click();
  await page.waitForTimeout(1500);
  // 3. Scan all device rows and check containment tree texts
  const buttons = page.locator('button[title="Expand Containment Tree (YANG BOM)"]');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const btn = page.locator('button[title="Expand Containment Tree (YANG BOM)"]').nth(i);
    await btn.click();
    await page.waitForTimeout(150);
    const pageText = await page.innerText('body');
    expect(pageText).not.toContain('Part: ---');
    
    // Collapse the expanded tree
    const collapseBtn = page.locator('button[title="Collapse Containment Hierarchy"]').first();
    if (await collapseBtn.count() > 0) {
      await collapseBtn.click();
    } else {
      const collapseBtn2 = page.locator('button[title="Collapse Containment Tree"]').first();
      if (await collapseBtn2.count() > 0) {
        await collapseBtn2.click();
      }
    }
    await page.waitForTimeout(100);
  }
});
