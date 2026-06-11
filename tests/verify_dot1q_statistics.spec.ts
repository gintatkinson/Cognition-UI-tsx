import { test, expect } from '@playwright/test';

test.describe('IEEE 802.1Q Bridge Port Performance and Error Statistics E2E', () => {
  test('should verify seeded stats, simulate discards, reset stats, and run BDD Scenario 12', async ({ page }) => {
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

    // 6. Verify stats card headers
    const statsCardHeader = page.locator('div', { hasText: 'IEEE 802.1Q Bridge Port Statistics & Discard Counters' }).first();
    await expect(statsCardHeader).toBeVisible();

    // Verify seeded default statistics
    const delayVal = page.locator('#stat-delay-discards');
    const mtuVal = page.locator('#stat-mtu-discards');
    const ingressVal = page.locator('#stat-ingress-discards');
    const egressVal = page.locator('#stat-egress-discards');
    const frameTypeVal = page.locator('#stat-frametype-discards');

    await expect(delayVal).toHaveText('12');
    await expect(mtuVal).toHaveText('5');
    await expect(ingressVal).toHaveText('42');
    await expect(egressVal).toHaveText('18');
    await expect(frameTypeVal).toHaveText('7');

    // 7. Click "Simulate Discards" and check that they increase
    const simulateBtn = page.locator('#stats-simulate-btn');
    await expect(simulateBtn).toBeVisible();
    await simulateBtn.click();
    await page.waitForTimeout(500);

    // Verify counters increased
    const delayNum = parseInt(await delayVal.innerText(), 10);
    const mtuNum = parseInt(await mtuVal.innerText(), 10);
    const ingressNum = parseInt(await ingressVal.innerText(), 10);
    const egressNum = parseInt(await egressVal.innerText(), 10);
    const frameTypeNum = parseInt(await frameTypeVal.innerText(), 10);

    expect(delayNum).toBeGreaterThan(12);
    expect(mtuNum).toBeGreaterThan(5);
    expect(ingressNum).toBeGreaterThan(42);
    expect(egressNum).toBeGreaterThan(18);
    expect(frameTypeNum).toBeGreaterThan(7);

    // 8. Click "Reset Statistics" and check that they return to 0
    const resetBtn = page.locator('#stats-reset-btn');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await page.waitForTimeout(500);

    await expect(delayVal).toHaveText('0');
    await expect(mtuVal).toHaveText('0');
    await expect(ingressVal).toHaveText('0');
    await expect(egressVal).toHaveText('0');
    await expect(frameTypeVal).toHaveText('0');

    // --- Scenario 12: BDD Sandbox Simulation Verification ---
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

    // Select Scenario 12
    const scenario12Button = page.locator('#bdd-scenario-12-btn');
    await expect(scenario12Button).toBeVisible();
    await scenario12Button.click();
    await page.waitForTimeout(500);

    // Execute simulation
    const executeButton = page.locator('button:has-text("Execute Simulation")');
    await expect(executeButton).toBeVisible();
    await executeButton.click();
    await page.waitForTimeout(1500);

    // Verify diagnostic logs output contains the correct pass status
    const logConsole = page.locator('.bg-zinc-950').first();
    await expect(logConsole).toContainText('STATUS: PASS (IEEE 802.1Q statistics and reset engine compliant)');

    // Verify Drill-down navigation requirements inside scenario logs
    const drilldownNode = logConsole.locator('[data-nav-id="node-d1"]').first();
    const drilldownPort = logConsole.locator('[data-nav-id="tp-d1-eth0"]').first();
    await expect(drilldownNode).toBeVisible();
    await expect(drilldownPort).toBeVisible();

    // Verify YANG payload JSON is visible and contains expected keys
    const jsonPre = page.locator('pre.text-indigo-300');
    await expect(jsonPre).toBeVisible();
    const jsonText = await jsonPre.innerText();
    expect(jsonText).toContain('dot1q-statistics');
    expect(jsonText).toContain('delay-exceeded-discards');
    expect(jsonText).toContain('mtu-exceeded-discards');
    expect(jsonText).toContain('discard-on-ingress-filtering');
    expect(jsonText).toContain('discard-on-egress-filtering');
    expect(jsonText).toContain('discard-inbound-acceptable-frame-type');
  });
});
