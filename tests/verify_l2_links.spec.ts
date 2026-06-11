import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('IETF Layer 2 Link Attributes E2E', () => {
  test.beforeEach(async () => {
    // Ensure database starts in a clean default state
    execSync('npx tsx migrate-to-firestore.ts');
  });

  test('should verify L2 link attributes, validate edit inputs, detect duplex mismatch, and run BDD Scenario 14', async ({ page }) => {
    // Enable browser console logging
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE]: ${msg.type()}: ${msg.text()}`);
    });

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

    // 4. Select L2 Carrier Ethernet Network
    const l2NetworkItem = page.locator('div', { hasText: 'L2 Carrier Ethernet Network' }).first();
    await expect(l2NetworkItem).toBeVisible();
    await l2NetworkItem.click();
    await page.waitForTimeout(1000);

    // 5. Select link "link-L2-TK-to-OS" from Links Explorer list
    const tkToOsLinkRow = page.locator('text=link-L2-TK-to-OS').first();
    await expect(tkToOsLinkRow).toBeVisible();
    await tkToOsLinkRow.click();
    await page.waitForTimeout(1000);

    // 6. Verify seeded L2 attributes are displayed in the panel
    const l2CardHeader = page.locator('h4', { hasText: 'IETF Layer 2 Link Attributes' }).first();
    await expect(l2CardHeader).toBeVisible();

    const displayRate = page.locator('#display-l2-link-rate');
    const displayDelay = page.locator('#display-l2-link-delay');
    const displayAutoNego = page.locator('#display-l2-link-autonego');
    const displayDuplex = page.locator('#display-l2-link-duplex');

    await expect(displayRate).toHaveText('10 Gbps');
    await expect(displayDelay).toHaveText('50 µs');
    await expect(displayAutoNego).toHaveText('Enabled');
    await expect(displayDuplex).toHaveText('full');

    // 7. Click Edit Attributes
    const editBtn = page.locator('#btn-l2-link-edit').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await page.waitForTimeout(500);

    // 8. Update inputs to invalid values and save (Rate check)
    const inputRate = page.locator('#input-l2-link-rate');
    const inputDelay = page.locator('#input-l2-link-delay');
    const inputDuplex = page.locator('#input-l2-link-duplex');
    const inputAutoNego = page.locator('#input-l2-link-autonego');
    const saveBtn = page.locator('#btn-l2-link-save');

    await expect(inputRate).toBeVisible();
    await inputRate.fill('-5');
    await saveBtn.click();
    await page.waitForTimeout(500);

    // Expect validation alert message
    const alertMessage = page.locator('.animate-slide-in, .bg-red-500\\/10').first();
    await expect(alertMessage).toContainText("YANG Constraint Error: Link transmission rate must be a positive number.");

    // 9. Update delay to invalid value (Delay check)
    await inputRate.fill('10');
    await inputDelay.fill('-10');
    await saveBtn.click();
    await page.waitForTimeout(500);
    await expect(alertMessage).toContainText("YANG Constraint Error: Link propagation delay must be a positive integer.");

    // 10. Correct the inputs, disable auto-negotiation, and save
    await inputDelay.fill('50');
    await inputAutoNego.uncheck();
    await saveBtn.click();
    await page.waitForTimeout(1000);

    // Verify updated display values
    await expect(displayAutoNego).toHaveText('Disabled');
    await expect(displayDuplex).toHaveText('full');

    // 11. Now set the reciprocal link "link-L2-OS-to-TK" to half-duplex and disable auto-negotiation
    const osToTkLinkRow = page.locator('text=link-L2-OS-to-TK').first();
    await expect(osToTkLinkRow).toBeVisible();
    await osToTkLinkRow.click();
    await page.waitForTimeout(1000);

    await editBtn.click();
    await page.waitForTimeout(500);
    await inputAutoNego.uncheck();
    await inputDuplex.selectOption('half');
    await saveBtn.click();
    await page.waitForTimeout(1000);

    // 12. Verify Degraded State warning banner displays
    const warningBanner = page.locator('text=⚠️ DEGRADED STATE: Rate or Duplex configuration mismatch detected');
    await expect(warningBanner).toBeVisible();

    // 13. --- Scenario 14 BDD Sandbox Simulation Verification ---
    // Select tab BDD Test Suite
    const bddTabButton = page.locator('button', { hasText: 'BDD Test Suite' });
    await expect(bddTabButton).toBeVisible();
    await bddTabButton.click();
    await page.waitForTimeout(1000);

    // Select Scenario 14
    const scenario14Button = page.locator('#bdd-scenario-14-btn');
    await expect(scenario14Button).toBeVisible();
    await scenario14Button.click();
    await page.waitForTimeout(500);

    // Execute simulation
    const executeButton = page.locator('button:has-text("Execute Simulation")');
    await expect(executeButton).toBeVisible();
    await executeButton.click();
    await page.waitForTimeout(1500);

    // Verify diagnostic logs output contains the correct pass status
    const logConsole = page.locator('.bg-zinc-950').first();
    await expect(logConsole).toContainText('STATUS: PASS (IETF Layer 2 Link Attributes validation compliant)');

    // Verify clickable links in log output (checking for elements with data-nav-id)
    const drilldownLink1 = logConsole.locator('[data-nav-id="link-L2-TK-SW-to-NG-SW"]').first();
    const drilldownLink2 = logConsole.locator('[data-nav-id="link-L2-NG-SW-to-TK-SW"]').first();
    await expect(drilldownLink1).toBeVisible();
    await expect(drilldownLink2).toBeVisible();

    // Verify YANG payload JSON is visible and contains expected keys
    const jsonPre = page.locator('pre.text-indigo-300');
    await expect(jsonPre).toBeVisible();
    const jsonText = await jsonPre.innerText();
    expect(jsonText).toContain('ietf-l2-topology:l2-link-attributes');
    expect(jsonText).toContain('rate');
    expect(jsonText).toContain('delay');
    expect(jsonText).toContain('auto-nego');
    expect(jsonText).toContain('duplex');
  });
});
