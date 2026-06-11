import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('IETF Layer 2 Network Topology and Node Attributes E2E', () => {
  test.beforeEach(async () => {
    // Ensure database starts in a clean default state
    execSync('npx tsx migrate-to-firestore.ts');
  });

  test('should verify L2 node attributes, validate edit inputs, and run BDD Scenario 13', async ({ page }) => {
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

    // 5. Select node "node-L2-TK-switch" from constituent nodes
    const tkSwitchRow = page.locator('text=Node Ref: node-L2-TK-switch');
    await expect(tkSwitchRow).toBeVisible();
    await tkSwitchRow.click();
    await page.waitForTimeout(1000);

    // 6. Verify seeded L2 attributes are displayed
    const l2CardHeader = page.locator('h4', { hasText: 'IETF Layer 2 Node Attributes' }).first();
    await expect(l2CardHeader).toBeVisible();

    const displayMac = page.locator('#display-l2-mgmt-mac');
    const displayVlan = page.locator('#display-l2-mgmt-vlan');

    await expect(displayMac).toHaveText('00:11:22:33:44:55');
    await expect(displayVlan).toHaveText('100');

    // 7. Click Edit Attributes
    const editBtn = page.locator('button', { hasText: 'Edit Attributes' }).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await page.waitForTimeout(500);

    // 8. Update inputs and save
    const inputMac = page.locator('#input-l2-mgmt-mac');
    const inputVlan = page.locator('#input-l2-mgmt-vlan');
    const saveBtn = page.locator('#btn-l2-save');

    await expect(inputMac).toBeVisible();
    await expect(inputVlan).toBeVisible();

    await inputMac.fill('00:AA:BB:CC:DD:EE');
    await inputVlan.fill('200');
    await saveBtn.click();
    await page.waitForTimeout(1000);

    // Verify updated display values
    await expect(displayMac).toHaveText('00:AA:BB:CC:DD:EE');
    await expect(displayVlan).toHaveText('200');

    // 9. Verify invalid management VLAN validation
    await editBtn.click();
    await page.waitForTimeout(500);
    await inputVlan.fill('5000');
    await saveBtn.click();
    await page.waitForTimeout(500);

    // Expect alert/error message
    const alertMessage = page.locator('.animate-slide-in');
    await expect(alertMessage).toContainText("YANG Constraint Error: Management VLAN ID '5000' must be an integer between 1 and 4094.");

    // 10. Verify invalid MAC format validation
    await inputVlan.fill('200');
    await inputMac.fill('00:AA:BB');
    await saveBtn.click();
    await page.waitForTimeout(500);
    await expect(alertMessage).toContainText("YANG Constraint Error: Management MAC address '00:AA:BB' must match standard IEEE 802 MAC-48 format.");

    // Click Cancel to exit editing
    const cancelBtn = page.locator('button', { hasText: 'Cancel' }).first();
    await cancelBtn.click();
    await page.waitForTimeout(500);

    // --- Scenario 13 BDD Sandbox Simulation Verification ---
    // Select tab BDD Test Suite
    const bddTabButton = page.locator('button', { hasText: 'BDD Test Suite' });
    await expect(bddTabButton).toBeVisible();
    await bddTabButton.click();
    await page.waitForTimeout(1000);

    // Select Scenario 13
    const scenario13Button = page.locator('#bdd-scenario-13-btn');
    await expect(scenario13Button).toBeVisible();
    await scenario13Button.click();
    await page.waitForTimeout(500);

    // Execute simulation
    const executeButton = page.locator('button:has-text("Execute Simulation")');
    await expect(executeButton).toBeVisible();
    await executeButton.click();
    await page.waitForTimeout(1500);

    // Verify diagnostic logs output contains the correct pass status
    const logConsole = page.locator('.bg-zinc-950').first();
    await expect(logConsole).toContainText('STATUS: PASS (IETF Layer 2 Topology and Node Attributes validation compliant)');

    // Verify Drill-down navigation requirements inside scenario logs
    const drilldownNode = logConsole.locator('[data-nav-id="node-L2-TK-switch"]').first();
    const drilldownPort = logConsole.locator('[data-nav-id="tp-L2-TK-eth0"]').first();
    await expect(drilldownNode).toBeVisible();
    await expect(drilldownPort).toBeVisible();

    // Verify YANG payload JSON is visible and contains expected keys
    const jsonPre = page.locator('pre.text-indigo-300');
    await expect(jsonPre).toBeVisible();
    const jsonText = await jsonPre.innerText();
    expect(jsonText).toContain('ietf-l2-topology:l2-node-attributes');
    expect(jsonText).toContain('bridge-id');
    expect(jsonText).toContain('management-mac');
    expect(jsonText).toContain('management-vlan');
  });
});
