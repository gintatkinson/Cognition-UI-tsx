import { test, expect } from '@playwright/test';

test.describe('IP & MAC Telemetry Details E2E', () => {
  test('should display MAC address on physical port and IP address on logical TP', async ({ page }) => {
    // 1. Navigate to dashboard and authenticate if needed
    await page.goto('/');
    await page.waitForTimeout(1500);

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

    // 3. Find Chiba OPT Core (node-CC1) and click it
    const chibaRow = page.locator('table tbody tr', { hasText: 'node-CC1' }).first();
    await expect(chibaRow).toBeVisible();
    
    // Double click the row to inspect details
    await chibaRow.dblclick();
    await page.waitForTimeout(1000);

    // 4. Assert we are in Device Details and verify "Phys Address" column has seeded MACs
    const interfacesTitle = page.locator('text=ietf-interfaces');
    await expect(interfacesTitle).toBeVisible();

    // Verify first row eth-1 has a MAC address
    const ethRow = page.locator('table tbody tr', { hasText: 'eth-1' }).first();
    const macCell = ethRow.locator('td').nth(2);
    await expect(macCell).toBeVisible();
    const macValue = await macCell.innerText();
    expect(macValue).toMatch(/^00:1A:2B:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}$/i);

    // 5. Click on eth-1 to view its physical MAC details
    const ethNameLink = ethRow.locator('td').first();
    await ethNameLink.click();
    await page.waitForTimeout(1000);

    // Verify Port details shows Physical Address (MAC)
    const physAddressLabel = page.locator('text=Physical Address');
    await expect(physAddressLabel).toBeVisible();

    const physAddressValue = page.locator('.grid-cols-2 p').nth(7);
    const physAddressText = await physAddressValue.innerText();
    expect(physAddressText).toMatch(/^00:1A:2B:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}$/i);

    // 6. Go back to node-CC1 details
    const backButton = page.locator('button:has(svg.lucide-arrow-left)').first();
    await backButton.click();
    await page.waitForTimeout(1000);

    // 7. Click on opt-1/1 port which has Logical TP mapping
    const optRow = page.locator('table tbody tr', { hasText: 'opt-1/1' }).first();
    const optNameLink = optRow.locator('td').first();
    await optNameLink.click();
    await page.waitForTimeout(1000);

    // 8. Verify the logical TP stack card shows logical TPs riding on this port with IP addresses
    const tpStackTitle = page.locator('text=Logical Termination Point (TP) Stack');
    await expect(tpStackTitle).toBeVisible();

    const ipAddressLabel = page.locator('text=IP Address:');
    await expect(ipAddressLabel.first()).toBeVisible();

    // 9. Click on a logical L3 TP link to drill down to the logical port detail view
    const logicalTpLink = page.locator('span:has-text("tp-L3-CC1-ge")').first();
    await expect(logicalTpLink).toBeVisible();
    await logicalTpLink.click();
    await page.waitForTimeout(1000);

    // 10. Verify the logical port detail view shows "IP Address" next to Type, instead of "Physical Address"
    const logicalIpLabel = page.locator('p:has-text("IP Address")').first();
    await expect(logicalIpLabel).toBeVisible();
    
    const logicalIpValue = page.locator('p:has-text("10.30.1.")').first();
    await expect(logicalIpValue).toBeVisible();

    // Verify Underlay Physical Port Association section is displayed
    const underlaySectionLabel = page.locator('text=Underlay Physical Port Association');
    await expect(underlaySectionLabel).toBeVisible();

    const physicalNodeLabel = page.locator('text=CU-node-CC1').first();
    await expect(physicalNodeLabel).toBeVisible();

    const physicalPortLabel = page.locator('text=eth-1').first();
    await expect(physicalPortLabel).toBeVisible();

    const physicalMacLabel = page.locator('p:has-text("00:1A:2B:")').first();
    await expect(physicalMacLabel).toBeVisible();

    // 11. Go back to opt-1/1 details
    const backBtnL3 = page.locator('button:has(svg.lucide-arrow-left)').first();
    await backBtnL3.click();
    await page.waitForTimeout(1000);

    // 12. Drill down to Layer 0 logical TP
    const logicalL0TpLink = page.locator('span:has-text("tp-L0-CC1-opt")').first();
    await expect(logicalL0TpLink).toBeVisible();
    await logicalL0TpLink.click();
    await page.waitForTimeout(1000);

    // Verify it displays Optical Coordinates (Frequency/Wavelength)
    const opticalCoordsLabel = page.locator('p:has-text("Optical Coordinates")').first();
    await expect(opticalCoordsLabel).toBeVisible();
    const opticalCoordsValue = page.locator('p:has-text("GHz")').first();
    await expect(opticalCoordsValue).toBeVisible();

    // 13. Go back to opt-1/1 details
    const backBtnL0 = page.locator('button:has(svg.lucide-arrow-left)').first();
    await backBtnL0.click();
    await page.waitForTimeout(1000);

    // 14. Drill down to Layer 1 logical TP
    const logicalL1TpLink = page.locator('span:has-text("tp-OTN-CC1-opt")').first();
    await expect(logicalL1TpLink).toBeVisible();
    await logicalL1TpLink.click();
    await page.waitForTimeout(1000);

    // Verify it displays OTN Transport Configuration (TSG/Client Signals)
    const otnConfigLabel = page.locator('p:has-text("OTN Transport Configuration")').first();
    await expect(otnConfigLabel).toBeVisible();
    const otnTsgValue = page.locator('p:has-text("TSG:")').first();
    await expect(otnTsgValue).toBeVisible();
  });

  test('should resolve and display physical MAC address on logical router interfaces table', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const googleLoginButton = page.locator('button', { hasText: 'Continue with Google' });
    if (await googleLoginButton.count() > 0) {
      await googleLoginButton.click();
      await page.waitForTimeout(1000);
    }

    // 1. Navigate to Base Topology View
    const baseNavButton = page.locator('nav button', { hasText: 'Base Network Topology' });
    await expect(baseNavButton).toBeVisible();
    await baseNavButton.click();
    await page.waitForTimeout(1000);

    // 2. Click on layering-visualizer sub-tab
    const layeringSubTab = page.locator('button', { hasText: 'Vertical Layer Mapping' }).first();
    await expect(layeringSubTab).toBeVisible();
    await layeringSubTab.click();
    await page.waitForTimeout(1500);

    // 3. Double click on node-L3-OS-router to inspect its details
    const osRouterSpan = page.locator('[data-nav-id="node-L3-OS-router"]').first();
    await expect(osRouterSpan).toBeVisible();
    await osRouterSpan.dblclick();
    await page.waitForTimeout(1500);

    // 4. Assert we are in Device Details and verify "ietf-interfaces" table is visible
    const interfacesTitle = page.locator('text=ietf-interfaces');
    await expect(interfacesTitle).toBeVisible();

    // 5. Verify tp-L3-OS-ge1 has the physical MAC address resolved from CU-node-OS1's eth-1 port
    const tpRow = page.locator('table tbody tr', { hasText: 'tp-L3-OS-ge1' }).first();
    await expect(tpRow).toBeVisible();

    const macCell = tpRow.locator('td').nth(2);
    await expect(macCell).toBeVisible();
    const macValue = await macCell.innerText();
    // Verify it resolved to a valid MAC address (e.g. 00:1A:2B:...) instead of '---'
    expect(macValue).toMatch(/^00:1A:2B:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}$/i);

    // 6. Go back to Base Topology layering-visualizer
    const backButton = page.locator('button:has(svg.lucide-arrow-left)').first();
    await backButton.click();
    await page.waitForTimeout(1000);

    // Re-click layering-visualizer sub-tab as it resets to default
    await layeringSubTab.click();
    await page.waitForTimeout(1000);

    // 7. Double click on node-L0-OS-terminal (Layer 0 Optical Terminal)
    const l0TerminalSpan = page.locator('[data-nav-id="node-L0-OS-terminal"]').first();
    await expect(l0TerminalSpan).toBeVisible();
    await l0TerminalSpan.dblclick();
    await page.waitForTimeout(1500);

    // 8. Verify speed column displays GHz optical coordinates subtext
    const l0Row = page.locator('table tbody tr', { hasText: 'tp-L0-OS-opt-1-1' }).first();
    await expect(l0Row).toBeVisible();

    const l0SpeedCell = l0Row.locator('td').nth(3);
    await expect(l0SpeedCell).toBeVisible();
    const l0SpeedText = await l0SpeedCell.innerText();
    expect(l0SpeedText).toContain('GHz');
    expect(l0SpeedText).toContain('nm');
  });

  test('should display SFP transceiver status and MAC address based on link state on hardware details page', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const googleLoginButton = page.locator('button', { hasText: 'Continue with Google' });
    if (await googleLoginButton.count() > 0) {
      await googleLoginButton.click();
      await page.waitForTimeout(1000);
    }

    // 1. Go to Devices tab
    const devicesNavButton = page.locator('nav button', { hasText: 'Devices' });
    await expect(devicesNavButton).toBeVisible();
    await devicesNavButton.click();
    await page.waitForTimeout(1000);

    // 2. Find Chiba OPT Core (node-CC1) and inspect details
    const chibaRow = page.locator('table tbody tr', { hasText: 'node-CC1' }).first();
    await expect(chibaRow).toBeVisible();
    await chibaRow.dblclick();
    await page.waitForTimeout(1000);

    // 3. Locate physical port opt-1/1 in the hardware list and click Inspect
    const opt1Row = page.locator('div.group').filter({ hasText: 'Physical Port opt-1/1' }).first();
    await expect(opt1Row).toBeVisible();
    const inspectBtn1 = opt1Row.locator('button', { hasText: 'Inspect' });
    await expect(inspectBtn1).toBeVisible();
    await inspectBtn1.click();
    await page.waitForTimeout(1000);

    // 4. Assert it shows SFP Transceiver Status as Plugged In and its resolved MAC address
    const sfpStatusLabel = page.getByText('SFP Transceiver Status', { exact: true });
    await expect(sfpStatusLabel).toBeVisible();

    const sfpStatusValue = page.locator('p:has-text("Plugged In")').first();
    await expect(sfpStatusValue).toBeVisible();

    // Verify it resolved to a valid MAC address (e.g. 00:1A:2B:...)
    const macValue = page.locator('p:has-text("00:1A:2B:")').first();
    await expect(macValue).toBeVisible();

    // 5. Go back to ROADM details
    const backButton = page.locator('button:has(svg.lucide-arrow-left)').first();
    await backButton.click();
    await page.waitForTimeout(1000);

    // 6. Locate opt-1/16 (which is unprovisioned / has no link) and inspect it
    const opt16Row = page.locator('div.group').filter({ hasText: 'Physical Port opt-1/16' }).first();
    await expect(opt16Row).toBeVisible();
    const inspectBtn16 = opt16Row.locator('button', { hasText: 'Inspect' });
    await expect(inspectBtn16).toBeVisible();
    await inspectBtn16.click();
    await page.waitForTimeout(1000);

    // 7. Verify SFP Status displays Empty Slot
    const sfpEmptyValue = page.locator('p:has-text("Empty Slot")').first();
    await expect(sfpEmptyValue).toBeVisible();

    // Verify MAC address displays No Link - No SFP Plugged In
    const macEmptyValue = page.locator('p:has-text("No Link - No SFP Plugged In")').first();
    await expect(macEmptyValue).toBeVisible();
  });

  test('should display cabinet placement and navigate to chassis detail page across all views', async ({ page }) => {
    // 1. Authenticate and navigate to devices page
    await page.goto('/');
    await page.waitForTimeout(1500);

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

    // 3. Find Chiba OPT Core (node-CC1) and double click to view details
    const chibaRow = page.locator('table tbody tr', { hasText: 'node-CC1' }).first();
    await chibaRow.dblclick();
    await page.waitForTimeout(1000);

    // 4. Verify Cabinet Location & Chassis Details card is displayed
    const cardTitle = page.locator('text=Cabinet Location & Chassis Details');
    await expect(cardTitle).toBeVisible();

    // Verify Site and Chassis Name are visible
    const siteLabel = page.locator('text=Site:').first();
    await expect(siteLabel).toBeVisible();

    // Verify Chassis UUID is selectable/clickable and click it
    const chassisIdLink = page.locator('span:has-text("hw-ch-node-CC1")').first();
    await expect(chassisIdLink).toBeVisible();
    await chassisIdLink.click();
    await page.waitForTimeout(1000);

    // 5. Verify we have navigated to the Chassis hardware component details page
    const hardwareTitle = page.locator('h2:has-text("Hardware:")').first();
    await expect(hardwareTitle).toBeVisible();
    const classValue = page.locator('p:has-text("CHASSIS")').first();
    await expect(classValue).toBeVisible();
  });
});

