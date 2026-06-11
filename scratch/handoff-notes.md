# Handoff Notes for the Incoming Agent

You are taking over the Cognition-UI codebase to resolve remaining Scenario B seeding issues, test leaks, and the Vendor OUI display feature.

## CRITICAL MANDATES & CONSTRAINTS

### Rule #1: Absolutely No Action Without Prior Approved Plan
You MUST NOT execute any commands (e.g., `git status`, `npm run lint`, `npx playwright test`) or modify any code file without first creating an implementation plan (e.g., `implementation_plan_16.md` at Plan Index 16) and waiting for explicit user approval.
* **Format of the Plan Link**: The link to the plan MUST be absolute and clickable using the `file://` scheme, formatted exactly as:
  `[implementation_plan_16.md](file:///Users/perkunas/.gemini/antigravity/brain/5b9ca517-c848-4e29-8de0-fd0f683b8581/implementation_plan_16.md)`

### Rule #2: Drill-Down Navigation
Every displayed managed object identifier (port name, component UUID, chassis name, etc.) must be selectable/clickable to navigate to the detailed inspector view (`onNavigate(id, type)`).

---

## CURRENT WORKSPACE STATUS

* **Working Tree**: Clean (all changes in the last commit `0b8c0b9` are committed on `main`).
* **Database State**: Firestore emulator database contains seeded nodes/links from the last seed execution.
* **Playwright Tests**: Installed and runnable (but remember, **do not run them** without plan approval!).

---

## DETAILED DEFECTS & TASKS TO RESOLVE

### 1. Stale Conversation ID Leak in Playwright Tests
* **Target File**: [tests/search_test.spec.ts](file:///Users/perkunas/antigravity/Cognition-UI/tests/search_test.spec.ts)
* **The Bug**: Screenshot paths at lines 31, 44, and 87 are hardcoded to a prior conversation ID directory:
  `/Users/perkunas/.gemini/antigravity/brain/e235f3dc-e0c8-45a3-9c11-8d52553eb662/...`
* **The Fix**: Resolve the output directory dynamically (or construct the path using the current environment context or environment variables/relative directories) to target the current brain directory:
  `/Users/perkunas/.gemini/antigravity/brain/5b9ca517-c848-4e29-8de0-fd0f683b8581/`

### 2. Missing SFP Vendor OUI Card in GUI
* **Target File**: [SubComponentDetail.tsx](file:///Users/perkunas/antigravity/Cognition-UI/src/components/views/detail/SubComponentDetail.tsx)
* **The Feature**: When inspecting a pluggable SFP component in the GUI (`leafData.class === 'transceiver'`), it must display the transceiver's **Vendor OUI** (Organizationally Unique Identifier).
* **Implementation Standard**:
  * Define a lookup mapping of known manufacturers (e.g. `Ciena Corporation`, `Ericsson`, `Aalyria`, `NEC Corporation`, `Fujitsu Limited`, `Rakuten Symphony`, `Toshiba Corporation`, `Juniper Networks`) to their standard OUI prefixes.
  * Define a stable hashing fallback for custom/unknown manufacturer names.
  * Render a "Vendor OUI" details grid item/card inside the transceiver details container.

---

## PROPOSED ACTION STEPS FOR YOUR NEW PLAN (Index 16)

1. **Plan & Permission**: Create `implementation_plan_16.md` in the brain folder listing the changes to `tests/search_test.spec.ts` and `src/components/views/detail/SubComponentDetail.tsx`. Present it to the user.
2. **Execute changes after approval**:
   * Update the test screenshot paths dynamically or statically to the active brain directory.
   * Add the OUI mapping and render the Vendor OUI field on the transceiver detail block.
3. **Verify**:
   * Request permission to re-seed and execute the structural audits (`npx tsx scripts/validate_seeding.ts` and `npx tsx scratch/inspect-all-trees.ts`).
   * Request permission to run Playwright tests (`npx playwright test`) to confirm that both GUI functionality and screenshot saves are working perfectly.
