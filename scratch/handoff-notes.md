# Handoff Notes for Replacement Agent

The goal of this task is to populate missing port-level part numbers on ROADM core switches (resolving the `Part: ---` placeholders in the GUI YANG BOM tree) and correct the seeding of pluggable Ethernet SFP transceivers strictly to active connected ports (51 active SFPs in 340 pluggable Ethernet ports).

## Current Status of Files on Disk
* **git status**:
  * `modified: src/components/views/DetailView.tsx` (uncommitted)
  * `modified: src/lib/japanese-ntn-generator.ts` (currently has Plan 11 transceivers, ROADM transceivers are removed)
  * `modified: src/services/networkService.ts` (uncommitted)
  * `untracked: src/components/views/detail/SubComponentDetail.tsx` (fully implemented from previous turn, matches baseline and has physical MAC address fixes)
  * `untracked: scratch/inspect-all-trees.ts` (baseline state, needs fixed port removal and validations updated)
  * `untracked: tests/search_test.spec.ts` (baseline state, needs the E2E tree scan test added)
* **Dev Server**: Vite preview server is running on port 3000 (task-3184).

## Exact Action Items to Complete the Task

### 1. Update `japanese-ntn-generator.ts`
* **In `buildCienaROADM`**:
  * Slot 1 container:
    ```typescript
    partNumber: 'ROADM-LC-SLOT'
    ```
  * Optical ports (1 to 16):
    ```typescript
    manufacturer: 'Ciena Corporation',
    partNumber: 'WLE5-TRSP-PORT',
    serialNumber: `WL5-PORT-${site.id}-${idx}`
    ```
  * Ethernet backhaul ports (1 to 4):
    ```typescript
    manufacturer: 'Ciena Corporation',
    partNumber: 'NTK-ETH-PORT',
    serialNumber: `WL5-ETH-${site.id}-${idx}`
    ```
    Do **not** add child transceivers of class `'transceiver'` to these ports.
* **In `buildNECBasebandUnit`, `buildEricssonMicrowave`, and `buildAalyriaFsoTerminal`**:
  * Modify loops to push transceiver child components strictly for connected/active ports:
    * BBU: `idx === 1` and `idx === 2` only.
    * Microwave: `idx === 1` only.
    * FSO: `idx === 1` only.
  * For other ports, push the port component but do **not** push a transceiver component (representing empty SFP cages).

### 2. Update `scratch/inspect-all-trees.ts`
* Keep `'Local Backhaul'` in `isFixed`:
  ```typescript
  const isFixed = matchedPort.name.includes('Local Backhaul') || 
                  matchedPort.name.includes('Fixed') || 
                  matchedPort.name.includes('Microwave') || 
                  matchedPort.name.includes('FSO');
  ```
* Inject structural hardware property validation at the end of the node loop (around line 134):
  ```typescript
  if (node.hardware) {
    node.hardware.forEach(comp => {
      if (comp.assetId) return; // Skip passive assetId components
      if (!comp.partNumber || comp.partNumber === '---' || comp.partNumber.trim() === '') {
        console.log(`  ❌ ERROR: Hardware component '${comp.name}' (${comp.uuid}) is missing a valid partNumber!`);
        errors++;
      }
      const needsFullIdentity = ['chassis', 'module', 'port', 'transceiver'].includes(comp.class);
      if (needsFullIdentity) {
        if (!comp.manufacturer || comp.manufacturer.trim() === '') {
          console.log(`  ❌ ERROR: Hardware component '${comp.name}' (${comp.uuid}) of class '${comp.class}' is missing manufacturer!`);
          errors++;
        }
        if (!comp.serialNumber || comp.serialNumber.trim() === '') {
          console.log(`  ❌ ERROR: Hardware component '${comp.name}' (${comp.uuid}) of class '${comp.class}' is missing serialNumber!`);
          errors++;
        }
      }
    });
  }
  ```

### 3. Update `tests/search_test.spec.ts`
* Append the GUI scanner test case:
  ```typescript
  test('verify no "Part: ---" placeholder exists in any device hardware containment tree in IETF Explorer view', async ({ page }) => {
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
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const folderTreeBtn = row.locator('button[title="Expand Containment Tree (YANG BOM)"]').first();
      if (await folderTreeBtn.count() > 0) {
        await folderTreeBtn.click();
        await page.waitForTimeout(150);
        const pageText = await page.innerText('body');
        expect(pageText).not.toContain('Part: ---');
        await folderTreeBtn.click();
        await page.waitForTimeout(100);
      }
    }
  });
  ```

### 4. Verification Flow
1. Run `npx tsx migrate-to-firestore.ts` to clear and re-seed the Firestore emulator database.
2. Run `npx tsx scratch/inspect-all-trees.ts` to verify 100% database structural compliance.
3. Run `npx playwright test` to run the Playwright E2E suite and verify no `Part: ---` is rendered in the GUI.
