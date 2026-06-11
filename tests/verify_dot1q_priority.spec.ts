import { test, expect } from '@playwright/test';

test.describe('IEEE 802.1Q Priority and Traffic Class Mapping E2E', () => {
  test('should verify priority mapping tables, validation bounds, persistence, and BDD Scenario 10', async ({ page }) => {
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

    // 3. Navigate to Devices page
    const devicesNavButton = page.locator('nav button', { hasText: 'Devices' });
    await expect(devicesNavButton).toBeVisible();
    await devicesNavButton.click();
    await page.waitForTimeout(1500);

    // 4. Double click "R1-Core" to navigate to its details view
    const deviceRow = page.locator('table tbody tr', { hasText: 'R1-Core' }).first();
    await expect(deviceRow).toBeVisible();
    await deviceRow.dblclick();
    await page.waitForTimeout(1500);

    // 5. Click interface "eth0" in ietf-interfaces table to drill-down
    const interfaceRow = page.locator('table tbody tr', { hasText: 'eth0' }).first();
    await expect(interfaceRow).toBeVisible();
    await interfaceRow.click();
    await page.waitForTimeout(1500);

    // 6. Verify we are on the port detail subview and the Priority Mapping Card is visible
    const priorityCardHeader = page.locator('div', { hasText: 'IEEE 802.1Q Priority and Traffic Class Mapping' }).first();
    await expect(priorityCardHeader).toBeVisible();

    // Verify default seeded values: click Traffic Class subtab
    await page.click('#priority-tab-tc');
    await page.waitForTimeout(200);

    const tc7Dropdown = page.locator('#tc-priority-7');
    await expect(tc7Dropdown).toBeVisible();
    await expect(tc7Dropdown).toHaveValue('7'); // seeded priority 7 -> class 7

    // 7. Edit Traffic Class configuration: map Priority 7 to Traffic Class 5
    await tc7Dropdown.selectOption('5');

    // Click Transmission Selection tab
    await page.click('#priority-tab-ts');
    await page.waitForTimeout(200);

    const ts7Dropdown = page.locator('#ts-class-7');
    await expect(ts7Dropdown).toBeVisible();
    await expect(ts7Dropdown).toHaveValue('strict-priority'); // seeded default algorithm

    // Change Traffic Class 7 algorithm to credit-based-shaper
    await ts7Dropdown.selectOption('credit-based-shaper');

    // 8. Save configuration
    await page.click('#priority-save-btn');
    await page.waitForTimeout(500);

    // Verify success banner appears
    const successAlert = page.locator('#priority-validation-success');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Priority mapping committed successfully.');

    // Verify configuration persisted: re-select tab/subtab and read value
    await page.click('#priority-tab-tc');
    await expect(tc7Dropdown).toHaveValue('5');

    // 9. Test Clear configuration
    await page.click('#priority-clear-btn');
    await page.waitForTimeout(500);
    await expect(successAlert).not.toBeVisible();
    await expect(tc7Dropdown).toHaveValue('7');

    // --- Scenario 10: BDD Sandbox Simulation Verification ---
    // Navigate to Base Network Topology page
    const baseNavButton = page.locator('nav button', { hasText: 'Base Network Topology' });
    await expect(baseNavButton).toBeVisible();
    await baseNavButton.click();
    await page.waitForTimeout(1500);

    // Select tab BDD Test Suite
    const bddTabButton = page.locator('button', { hasText: 'BDD Test Suite' });
    await expect(bddTabButton).toBeVisible();
    await bddTabButton.click();
    await page.waitForTimeout(1000);

    // Select Scenario 10
    const scenario10Button = page.locator('#bdd-scenario-10-btn');
    await expect(scenario10Button).toBeVisible();
    await scenario10Button.click();
    await page.waitForTimeout(500);

    // Execute simulation
    const executeButton = page.locator('button:has-text("Execute Simulation")');
    await expect(executeButton).toBeVisible();
    await executeButton.click();
    await page.waitForTimeout(1500);

    // Verify diagnostic logs output contains the correct pass status
    const logConsole = page.locator('.bg-zinc-950').first();
    await expect(logConsole).toContainText('STATUS: PASS (IEEE 802.1Q priority and traffic class mapping engine compliant)');

    // Verify Drill-down navigation requirements inside scenario logs
    const drilldownNode = logConsole.locator('[data-nav-id="node-d1"]');
    const drilldownPort = logConsole.locator('[data-nav-id="tp-d1-eth0"]');
    await expect(drilldownNode).toBeVisible();
    await expect(drilldownPort).toBeVisible();

    // Verify YANG payload JSON is visible and contains expected keys
    const jsonPre = page.locator('pre.text-indigo-300');
    await expect(jsonPre).toBeVisible();
    const jsonText = await jsonPre.innerText();
    expect(jsonText).toContain('dot1q-priority-mapping');
    expect(jsonText).toContain('priority-regeneration-table');
    expect(jsonText).toContain('traffic-class-table');
    expect(jsonText).toContain('transmission-selection-table');
  });
});
