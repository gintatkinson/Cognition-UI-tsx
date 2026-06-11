import { test, expect } from '@playwright/test';

test.describe('IEEE 802.1Q Port Maps and Forwarding Filtering Policies E2E', () => {
  test('should verify policies, FDB static entries, validation rules, persistence, and BDD Scenario 11', async ({ page }) => {
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

    // 6. Verify we are on the port detail subview and the Forwarding Policies Card is visible
    const policiesCardHeader = page.locator('div', { hasText: 'IEEE 802.1Q Port Maps & Forwarding Policies' }).first();
    await expect(policiesCardHeader).toBeVisible();

    // Verify default seeded values: click Policies subtab
    await page.click('#filtering-tab-policies');
    await page.waitForTimeout(200);

    const ingressCheck = page.locator('#filtering-policy-ingress');
    const enableCheck = page.locator('#filtering-policy-enable');
    const frameTypesSelect = page.locator('#filtering-policy-frame-types');

    await expect(ingressCheck).toBeChecked();
    await expect(enableCheck).toBeChecked();
    await expect(frameTypesSelect).toHaveValue('admit-all');

    // Click Static FDB subtab and verify seeded entry
    await page.click('#filtering-tab-fdb');
    await page.waitForTimeout(200);

    const fdbTable = page.locator('table');
    await expect(fdbTable).toBeVisible();
    await expect(fdbTable).toContainText('00:1A:2B:3C:4D:5E');
    await expect(fdbTable).toContainText('10');
    await expect(fdbTable).toContainText('eth0: forward');
    await expect(fdbTable).toContainText('eth1: filter');

    // 7. Edit Policies: set acceptable-frame-types to admit-only-vlan-tagged
    await page.click('#filtering-tab-policies');
    await page.waitForTimeout(200);
    await frameTypesSelect.selectOption('admit-only-vlan-tagged');

    // Save configuration
    await page.click('#filtering-save-btn');
    await page.waitForTimeout(500);

    // Verify success banner appears
    const successAlert = page.locator('#filtering-validation-success');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Forwarding/Filtering policies committed successfully.');

    // 8. Test validation rules: add new entry with invalid MAC address
    await page.click('#filtering-tab-fdb');
    await page.waitForTimeout(200);

    const macInput = page.locator('#fdb-mac-input');
    const vlanInput = page.locator('#fdb-vlan-input');
    const addEntryBtn = page.locator('#fdb-add-entry-btn');

    await macInput.fill('00:11:22');
    await vlanInput.fill('20');
    await addEntryBtn.click();
    await page.waitForTimeout(200);

    const errorAlert = page.locator('#filtering-validation-error');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Invalid Destination MAC Address format.');

    // Test validation rules: add entry with out-of-bounds VLAN ID
    await macInput.fill('00:AA:BB:CC:DD:EE');
    await vlanInput.fill('5000');
    await addEntryBtn.click();
    await page.waitForTimeout(200);
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('VLAN ID must be an integer between 1 and 4094.');

    // Add entry successfully with valid values and customize port maps
    await macInput.fill('00:AA:BB:CC:DD:EE');
    await vlanInput.fill('20');

    const eth0Control = page.locator('#fdb-port-control-eth0');
    const eth1Control = page.locator('#fdb-port-control-eth1');
    await eth0Control.selectOption('forward');
    await eth1Control.selectOption('discard');

    await addEntryBtn.click();
    await page.waitForTimeout(500);

    // Verify table has new entry and error is cleared
    await expect(errorAlert).not.toBeVisible();
    await expect(fdbTable).toContainText('00:AA:BB:CC:DD:EE');
    await expect(fdbTable).toContainText('20');
    await expect(fdbTable).toContainText('eth1: discard');

    // Save configuration and verify persistence
    await page.click('#filtering-save-btn');
    await page.waitForTimeout(500);
    await expect(successAlert).toBeVisible();

    // 9. Test Clear configuration
    await page.click('#filtering-clear-btn');
    await page.waitForTimeout(500);
    await expect(successAlert).not.toBeVisible();

    // Switch to Policies tab to verify cleared values
    await page.click('#filtering-tab-policies');
    await page.waitForTimeout(200);
    await expect(ingressCheck).not.toBeChecked();
    await expect(frameTypesSelect).toHaveValue('admit-all');

    // Switch to FDB tab to verify empty entries
    await page.click('#filtering-tab-fdb');
    await page.waitForTimeout(200);
    await expect(page.locator('text=No static FDB entries configured')).toBeVisible();

    // --- Scenario 11: BDD Sandbox Simulation Verification ---
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

    // Select Scenario 11
    const scenario11Button = page.locator('#bdd-scenario-11-btn');
    await expect(scenario11Button).toBeVisible();
    await scenario11Button.click();
    await page.waitForTimeout(500);

    // Execute simulation
    const executeButton = page.locator('button:has-text("Execute Simulation")');
    await expect(executeButton).toBeVisible();
    await executeButton.click();
    await page.waitForTimeout(1500);

    // Verify diagnostic logs output contains the correct pass status
    const logConsole = page.locator('.bg-zinc-950').first();
    await expect(logConsole).toContainText('STATUS: PASS (IEEE 802.1Q forwarding filtering engine compliant)');

    // Verify Drill-down navigation requirements inside scenario logs
    const drilldownNode = logConsole.locator('[data-nav-id="node-d1"]').first();
    const drilldownPort = logConsole.locator('[data-nav-id="tp-d1-eth0"]').first();
    await expect(drilldownNode).toBeVisible();
    await expect(drilldownPort).toBeVisible();

    // Verify YANG payload JSON is visible and contains expected keys
    const jsonPre = page.locator('pre.text-indigo-300');
    await expect(jsonPre).toBeVisible();
    const jsonText = await jsonPre.innerText();
    expect(jsonText).toContain('dot1q-forwarding-filtering');
    expect(jsonText).toContain('ingress-filtering');
    expect(jsonText).toContain('acceptable-frame-types');
    expect(jsonText).toContain('static-filtering-entries');
    expect(jsonText).toContain('port-map');
  });
});
