# Handoff Documentation: IETF Layer 2 Topology Features & E2E Restoration

## 1. Context & Honest Status Report

This handoff is prepared to address incomplete elements of the **IETF Layer 2 Topology (RFC 8944/8345)** implementation. In prior attempts, the previous agent incorrectly reported clean test completions without verifying the regression impact of a repository rollback.

Currently, **18 of 20** E2E tests are passing. However, **2 E2E test files are failing** due to missing UI click handlers (from code reversion) and E2E selector collisions.

---

## 2. Active Test Failures & Root Causes

### Failure A: `tests/verify_l2_links.spec.ts`
* **Symptom**: `locator('h4').filter({ hasText: 'IETF Layer 2 Link Attributes' }).first()` is not visible (timeout after 5000ms).
* **Root Cause**: The clickable `onClick` handler and selection styles for link list items in the **Network Links Explorer** list of `BaseNetworkTopologyView.tsx` (around lines 2380-2415) were not restored after a git rollback. Because clicking the link in the list does not set the active link state, the details card never opens.

### Failure B: `tests/verify_l2_topology.spec.ts`
* **Symptom**: strict mode violation: `locator('.animate-slide-in')` resolved to 2 elements:
  1. The global success banner indicating that node attributes were updated successfully.
  2. The node-specific red validation error block indicating that a VLAN input is out of bounds.
* **Root Cause**: Both elements use the CSS class `.animate-slide-in`. Since the global success alert from the previous step is still visible on the screen during the subsequent invalid check, Playwright's general selector `page.locator('.animate-slide-in')` matches multiple elements.

---

## 3. Required Implementation Plan & Fixes

To resolve these errors, the incoming agent must perform the following actions:

### Action 1: Restore Link Selection & Duplex Mismatch Alerts in `BaseNetworkTopologyView.tsx`

1. **Insert the `checkL2LinkMismatched` helper function** right below `hasL2LinkMismatch` (around line 291):
   ```typescript
   const checkL2LinkMismatched = (link: RFC8345Link, network: RFC8345Network) => {
     const reciprocal = network.links?.find(l => 
       l.source.sourceNode === link.destination.destNode &&
       l.destination.destNode === link.source.sourceNode
     );
     if (!reciprocal) return false;
     const tL2 = link['l2-link-attributes'] || {};
     const rL2 = reciprocal['l2-link-attributes'] || {};
     
     const tRate = tL2.rate;
     const rRate = rL2.rate;
     const tAuto = !!tL2['auto-nego'];
     const rAuto = !!rL2['auto-nego'];
     const tDuplex = tL2.duplex || 'full';
     const rDuplex = rL2.duplex || 'full';
     
     return tRate !== rRate || tAuto !== rAuto || tDuplex !== rDuplex;
   };
   ```

2. **Modify the Link Inventory card mapping in `BaseNetworkTopologyView.tsx`** (around line 2384):
   - Add the `onClick` handler to select/deselect the link.
   - Apply border and text highlights for the selected link.
   - Render the red `"State: Degraded"` warning block if `checkL2LinkMismatched` returns `true`, and `"State: Active"` otherwise.

   *Target Diff for the card mapping block:*
   ```diff
   - <div key={link.linkId} className="bg-zinc-900/50 hover:bg-zinc-900/85 p-3 rounded-xl border border-zinc-850 flex flex-col gap-2 relative group transition-all">
   + <div 
   +   key={link.linkId} 
   +   onClick={() => setSelectedLinkId(selectedLinkId === link.linkId ? '' : link.linkId)}
   +   className={`p-3 rounded-xl border flex flex-col gap-2 relative group transition-all cursor-pointer ${
   +     selectedLinkId === link.linkId 
   +       ? 'bg-zinc-900/90 border-indigo-500/50 shadow-md shadow-indigo-550/10' 
   +       : 'bg-zinc-900/50 hover:bg-zinc-900/80 border-zinc-850'
   +   }`}
   + >
     <div className="flex justify-between items-start">
       <div>
         <span className="font-bold text-white text-xs"><DrilldownLink id={link.linkId} type="link" onNavigate={onNavigate} /></span>
   +     {/* Render State badge */}
   +     <span className={`ml-2 text-[8px] px-1 py-0.5 rounded font-extrabold uppercase inline-block ${
   +       checkL2LinkMismatched(link, selectedNetwork)
   +         ? 'bg-red-500/10 text-red-400 border border-red-500/20'
   +         : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
   +     }`}>
   +       {checkL2LinkMismatched(link, selectedNetwork) ? 'State: Degraded' : 'State: Active'}
   +     </span>
   ```

---

### Action 2: Resolve Playwright Selector Ambiguity in `verify_l2_topology.spec.ts`

To fix the strict-mode selector collision, do **one** of the following:

* **Option A (Preferred - Target Test file)**: Update the locator inside `tests/verify_l2_topology.spec.ts` to explicitly target the red error alert container inside the Node Attributes form, bypassing the global success alert:
  ```typescript
  // Change from:
  const alertMessage = page.locator('.animate-slide-in');
  
  // To:
  const alertMessage = page.locator('#l2-node-attributes-panel .bg-red-500\\/10');
  ```
  
* **Option B (Target UI Component)**: Add a unique ID or distinct CSS class to the local error elements in `BaseNetworkTopologyView.tsx` to differentiate them from the global success notification banner:
  ```tsx
  // In BaseNetworkTopologyView.tsx, update:
  {l2NodeError && (
    <div id="l2-node-error" className="p-3 bg-red-500/10 ...">
  ```

---

### Action 3: Verify Drill-Down Navigation Wrappers

Under User Rule 1 in `AGENTS.md`, 100% of managed object identifiers must support drill-down navigation via `<DrilldownLink>`. The next agent must verify that the following identifiers are wrapped:
- Underlay node references in the node explorer list (`{sn.nodeRef}`).
- Underlay node and port refs in the targetNode termination points list (`{stp.nodeRef}` and `{stp.tpRef}`).
- Supporting node coordinates in the layering visualizer (`{sn.nodeRef}`).

---

## 4. Environment & Execution Steps

### Services & DB setup:
- Emulator: **Firestore Emulator** active on port `8080`.
- Development Server: Run on port `3000` via `npm run dev`.
  - *Note*: Ensure no stale Node processes are lingering on port 3000 to prevent Vite from falling back to port 3001.

### Validation Commands:
- Seed the DB: `npx tsx migrate-to-firestore.ts`
- Run Link attributes E2E tests: `npx playwright test tests/verify_l2_links.spec.ts --workers=1`
- Run Node attributes E2E tests: `npx playwright test tests/verify_l2_topology.spec.ts --workers=1`
- Run Port attributes E2E tests: `npx playwright test tests/verify_l2_ports.spec.ts --workers=1`
