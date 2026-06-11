import { test, expect } from '@playwright/test';

test.describe('Transport Client Service Port Mapping and Tunnels E2E', () => {
  test('should verify access port mapping, compatibility validation blocks, tunnels editing, and BDD Scenario 8', async ({ page }) => {
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

    // 3. Navigate to Services page
    const servicesNavButton = page.locator('nav button', { hasText: 'Services' });
    await expect(servicesNavButton).toBeVisible();
    await servicesNavButton.click();
    await page.waitForTimeout(1500);

    // 4. Double click "Ethernet-Over-OTN-Core" to navigate to its details view
    const serviceRow = page.locator('table tbody tr', { hasText: 'Ethernet-Over-OTN-Core' }).first();
    await expect(serviceRow).toBeVisible();
    await serviceRow.dblclick();
    await page.waitForTimeout(1500);

    // 5. Verify the Transport Client Service attributes & port mapping panel is visible
    const transClientPanel = page.locator('#trans-client-svc-panel');
    await expect(transClientPanel).toBeVisible();

    // Verify initial access ports form fields are seeded correctly
    await expect(page.locator('#src-node-uri-input')).toHaveValue('node-L3-TK-router');
    await expect(page.locator('#src-ltp-uri-input')).toHaveValue('tp-L3-TK-ge1');
    await expect(page.locator('#dst-node-uri-input')).toHaveValue('node-L3-OS-router');
    await expect(page.locator('#dst-ltp-uri-input')).toHaveValue('tp-L3-OS-ge1');
    await expect(page.locator('#client-signal-select')).toHaveValue('l1-types:ETH-100Gb-LAN');

    // Verify transceiver metrics (PM State) are displayed
    await expect(transClientPanel).toContainText('laser-bias-current');
    await expect(transClientPanel).toContainText('35.2 mA');
    await expect(transClientPanel).toContainText('optical-power-rx');
    await expect(transClientPanel).toContainText('-4.8 dBm');

    // 6. Test compatibility validation rule block: select incompatible signal type (OTU4) on Ethernet ports
    await page.selectOption('#client-signal-select', 'l1-types:OTU4');
    await page.click('#save-mappings-btn');
    await page.waitForTimeout(1000);

    // Verify diagnostics error banner appears with code 400 and message
    const errorAlert = page.locator('#diagnostics-error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('YANG Access Compatibility Error (Code 400)');
    await expect(errorAlert).toContainText('Client signal OTU4 is incompatible with physical Ethernet transceivers.');

    // 7. Correct the mismatch by selecting ETH-10Gb-LAN and saving
    await page.selectOption('#client-signal-select', 'l1-types:ETH-10Gb-LAN');
    await page.click('#save-mappings-btn');
    await page.waitForTimeout(1000);

    // Verify diagnostics error alert is cleared
    await expect(errorAlert).not.toBeVisible();

    // 8. Test Underlay TE Tunnels assignment editing
    // Check initial tunnel in the tunnels list container specifically
    const tunnelsList = page.locator('#assigned-tunnels-list');
    await expect(tunnelsList).toContainText('tunnel-OTN-TK-to-OS-100G');

    // Assign a new tunnel: choose tunnel-OTN-TK-to-OS-Backup from dropdown
    await page.selectOption('#tunnel-select', 'tunnel-OTN-TK-to-OS-Backup');
    await page.click('#add-tunnel-btn');
    await page.waitForTimeout(500);

    // Verify both tunnels are now listed in the container
    await expect(tunnelsList).toContainText('tunnel-OTN-TK-to-OS-100G');
    await expect(tunnelsList).toContainText('tunnel-OTN-TK-to-OS-Backup');

    // Remove the original primary tunnel using a precise locator
    const removeBtn = page.locator('div.flex', { has: page.locator('span', { hasText: 'tunnel-OTN-TK-to-OS-100G' }) })
      .locator('button:has-text("Remove")')
      .first();
    await removeBtn.click();
    await page.waitForTimeout(500);

    // Verify only the backup tunnel is left in the list container
    await expect(tunnelsList).not.toContainText('tunnel-OTN-TK-to-OS-100G');
    await expect(tunnelsList).toContainText('tunnel-OTN-TK-to-OS-Backup');

    // --- Scenario 8: BDD Sandbox Simulation Verification ---
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

    // Select Scenario 8
    const scenario8Button = page.locator('#bdd-scenario-8-btn');
    await expect(scenario8Button).toBeVisible();
    await scenario8Button.click();
    await page.waitForTimeout(500);

    // Execute simulation
    const executeButton = page.locator('button:has-text("Execute Simulation")');
    await expect(executeButton).toBeVisible();
    await executeButton.click();
    await page.waitForTimeout(1500);

    // Verify diagnostic logs output contains the correct status
    await expect(page.locator('.bg-zinc-950').first()).toContainText('STATUS: PASS (YANG ietf-trans-client-service port-mapping compliant)');

    // Verify YANG payload JSON is visible and contains expected keys
    const jsonPre = page.locator('pre.text-indigo-300');
    await expect(jsonPre).toBeVisible();
    const jsonText = await jsonPre.innerText();
    expect(jsonText).toContain('src-access-ports');
    expect(jsonText).toContain('dst-access-ports');
    expect(jsonText).toContain('svc-tunnels');
    expect(jsonText).toContain('pm-state');
    expect(jsonText).toContain('error-info');
  });
});
