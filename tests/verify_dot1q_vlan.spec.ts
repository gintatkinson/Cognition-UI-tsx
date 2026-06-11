import { test, expect } from '@playwright/test';

test.describe('IEEE 802.1Q Bridge Port VLAN Tag and Type Definitions E2E', () => {
  test('should verify VLAN tag types, validation engine rules, persistence, and BDD Scenario 9', async ({ page }) => {
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

    // 6. Verify we are on the port detail subview and the VLAN Classifier Card is visible
    const vlanCardHeader = page.locator('div', { hasText: 'IEEE 802.1Q Bridge Port VLAN Classifier' }).first();
    await expect(vlanCardHeader).toBeVisible();

    // Verify default seeded values for eth0: Customer VLAN range mode "10,20-30,50-100"
    const rangeRadio = page.locator('input[name="tag-type"][value="c-vlan"]');
    await expect(rangeRadio).toBeChecked();
    const rangeInput = page.locator('#vlan-ids-input');
    await expect(rangeInput).toHaveValue('10,20-30,50-100');

    // 7. Test single VLAN ID mode validation and saving
    await page.click('#vlan-mode-single-btn');
    await page.waitForTimeout(200);
    const singleInput = page.locator('#vlan-id-input');
    await expect(singleInput).toBeVisible();
    await singleInput.fill('100');
    await page.click('#vlan-save-btn');
    await page.waitForTimeout(500);

    // Verify success banner appears
    const successAlert = page.locator('#vlan-validation-success');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Configuration committed successfully.');

    // 8. Test invalid/rejection range configuration (descending range)
    await page.click('#vlan-mode-range-btn');
    await page.waitForTimeout(200);
    const rangeInputFields = page.locator('#vlan-ids-input');
    await expect(rangeInputFields).toBeVisible();
    await rangeInputFields.fill('30-20,10');
    await page.click('#vlan-save-btn');
    await page.waitForTimeout(500);

    // Verify validation error banner appears
    const errorAlert = page.locator('#vlan-validation-error');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Descending range detected: 30-20');

    // 9. Test invalid/rejection range configuration (overlapping range)
    await rangeInputFields.fill('10-20,15-30');
    await page.click('#vlan-save-btn');
    await page.waitForTimeout(500);

    // Verify validation error banner continues to show overlapping error message
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Overlapping or out-of-order ranges detected');

    // 10. Test Clear configuration
    await page.click('#vlan-clear-btn');
    await page.waitForTimeout(500);
    await expect(errorAlert).not.toBeVisible();
    await expect(successAlert).not.toBeVisible();

    // --- Scenario 9: BDD Sandbox Simulation Verification ---
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

    // Select Scenario 9
    const scenario9Button = page.locator('#bdd-scenario-9-btn');
    await expect(scenario9Button).toBeVisible();
    await scenario9Button.click();
    await page.waitForTimeout(500);

    // Execute simulation
    const executeButton = page.locator('button:has-text("Execute Simulation")');
    await expect(executeButton).toBeVisible();
    await executeButton.click();
    await page.waitForTimeout(1500);

    // Verify diagnostic logs output contains the correct pass status
    const logConsole = page.locator('.bg-zinc-950').first();
    await expect(logConsole).toContainText('STATUS: PASS (IEEE 802.1Q tag classifier validation engine compliant)');

    // Verify Drill-down navigation requirements inside scenario logs
    const drilldownNode = logConsole.locator('[data-nav-id="node-d1"]');
    const drilldownPort = logConsole.locator('[data-nav-id="tp-d1-eth0"]');
    await expect(drilldownNode).toBeVisible();
    await expect(drilldownPort).toBeVisible();

    // Verify YANG payload JSON is visible and contains expected keys
    const jsonPre = page.locator('pre.text-indigo-300');
    await expect(jsonPre).toBeVisible();
    const jsonText = await jsonPre.innerText();
    expect(jsonText).toContain('dot1q-bridge-port-vlan');
    expect(jsonText).toContain('tag-type');
    expect(jsonText).toContain('vlan-mode');
    expect(jsonText).toContain('vlan-ids');
  });
});
