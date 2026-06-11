import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('IETF Layer 2 TP Encapsulation and Virtualization E2E', () => {
  test.beforeEach(async () => {
    // Ensure database starts in a clean default state
    execSync('npx tsx migrate-to-firestore.ts');
  });

  test('should verify L2 port attributes, validate edit inputs, check co-dependencies, and run BDD Scenario 15', async ({ page }) => {
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

    // 5. Select constituent node "Tokyo L2 Aggregation Switch"
    const tokyoNodeRow = page.locator('text=Tokyo L2 Aggregation Switch').first();
    await expect(tokyoNodeRow).toBeVisible();
    await tokyoNodeRow.click();
    await page.waitForTimeout(1000);

    // Temporary Debug Logs
    console.log("SELECTED NETWORK ID:", await page.evaluate(() => {
      return document.body.innerText;
    }));

    // 6. Select port "tp-L2-TK-eth0" in the TP list
    const eth0TpRow = page.locator('#tp-item-tp-L2-TK-eth0').first();
    await expect(eth0TpRow).toBeVisible();
    await eth0TpRow.click();
    await page.waitForTimeout(1000);

    // 7. Verify seeded L2 attributes are displayed in the port attributes panel
    const l2TpCardHeader = page.locator('h4', { hasText: 'IETF Layer 2 Port Attributes:' }).first();
    await expect(l2TpCardHeader).toBeVisible();

    const displayInterfaceName = page.locator('#display-l2-tp-interface-name');
    const displayMacAddress = page.locator('#display-l2-tp-mac-address');
    const displayEncapsulation = page.locator('#display-l2-tp-encapsulation');
    const displayOuterTag = page.locator('#display-l2-tp-outer-tag');

    await expect(displayInterfaceName).toHaveText('eth0');
    await expect(displayMacAddress).toHaveText('00:11:22:33:44:55');
    await expect(displayEncapsulation).toHaveText('vlan');
    await expect(displayOuterTag).toHaveText('100');

    // 8. Click Edit Attributes
    const editBtn = page.locator('#btn-l2-tp-edit').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await page.waitForTimeout(500);

    // 9. Update inputs to invalid VNI ID for VXLAN encapsulation
    const inputEncapsulation = page.locator('#input-l2-tp-encapsulation-type');
    const inputVniId = page.locator('#input-l2-tp-vni-id');
    const saveBtn = page.locator('#btn-l2-tp-save');

    // VXLAN selection
    await inputEncapsulation.selectOption('vxlan');
    await expect(inputVniId).toBeEnabled();
    
    // Set invalid VNI ID
    await inputVniId.fill('20000000');
    await saveBtn.click();

    // Expect validation alert message
    const alertMessage = page.locator('#l2-tp-error').first();
    await expect(alertMessage).toBeVisible();
    await expect(alertMessage).toContainText("YANG Constraint Error: VXLAN VNI ID must be an integer between 1 and 16777215.");

    // 10. Update inputs to invalid inner tag for QinQ encapsulation
    const inputOuterTag = page.locator('#input-l2-tp-outer-tag');
    const inputInnerTag = page.locator('#input-l2-tp-inner-tag');

    await inputEncapsulation.selectOption('qinq');
    await expect(inputOuterTag).toBeEnabled();
    await expect(inputInnerTag).toBeEnabled();

    await inputOuterTag.fill('100');
    await inputInnerTag.fill('5000');
    await saveBtn.click();
    await expect(alertMessage).toContainText("YANG Constraint Error: Inner VLAN Tag must be an integer between 1 and 4094.");

    // 11. Correct the inputs to valid VLAN tagging and save
    await inputEncapsulation.selectOption('vlan');
    await expect(inputInnerTag).toBeDisabled(); // disabled since not QinQ
    await inputOuterTag.fill('200');
    await saveBtn.click();

    // Check if error is visible and log it
    const isErrVisible = await alertMessage.isVisible();
    if (isErrVisible) {
      const errText = await alertMessage.innerText();
      console.log(`[TEST DEBUG]: Save failed with validation error: "${errText}"`);
    }

    // Verify updated display values (Playwright auto-waits until visible)
    await expect(displayEncapsulation).toBeVisible();
    await expect(displayEncapsulation).toHaveText('vlan');
    await expect(displayOuterTag).toHaveText('200');

    // 12. --- Scenario 15 BDD Sandbox Simulation Verification ---
    // Select tab BDD Test Suite
    const bddTabButton = page.locator('button', { hasText: 'BDD Test Suite' });
    await expect(bddTabButton).toBeVisible();
    await bddTabButton.click();
    await page.waitForTimeout(1000);

    // Select Scenario 15
    const scenario15Button = page.locator('#bdd-scenario-15-btn');
    await expect(scenario15Button).toBeVisible();
    await scenario15Button.click();
    await page.waitForTimeout(500);

    // Execute simulation
    const executeButton = page.locator('button:has-text("Execute Simulation")');
    await expect(executeButton).toBeVisible();
    await executeButton.click();
    await page.waitForTimeout(1500);

    // Verify diagnostic logs output contains the correct pass status
    const logConsole = page.locator('.bg-zinc-950').first();
    await expect(logConsole).toContainText('STATUS: PASS (IETF Layer 2 TP Encapsulation and Virtualization compliant)');

    // Verify clickable links in log output
    const drilldownNode = logConsole.locator('[data-nav-id="node-L2-TK-switch"]').first();
    const drilldownTp = logConsole.locator('[data-nav-id="tp-L2-TK-eth0"]').first();
    await expect(drilldownNode).toBeVisible();
    await expect(drilldownTp).toBeVisible();

    // Verify YANG payload JSON is visible and contains expected keys
    const jsonPre = page.locator('pre.text-indigo-300');
    await expect(jsonPre).toBeVisible();
    const jsonText = await jsonPre.innerText();
    expect(jsonText).toContain('ietf-l2-topology:l2-termination-point-attributes');
    expect(jsonText).toContain('interface-name');
    expect(jsonText).toContain('mac-address');
    expect(jsonText).toContain('encapsulation-type');
    expect(jsonText).toContain('outer-tag');
  });
});
