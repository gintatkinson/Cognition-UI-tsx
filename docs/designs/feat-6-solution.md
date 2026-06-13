# Solution Walkthrough - Feature 6: Numeric Counters and Gauges (Issue #17)

This document details the vertical slice implementation of Feature 6 (Numeric Counters and Gauges) targeting the Flutter platform.

## Implemented Changes

1. **Logic & Model Layer (`lib/models/counter_gauge.dart`)**
   - Created the `YangCounterGauge` data class with fields: `id`, `name`, `type` (`YangDataType` enum covering counters and gauges), `description`, `value`, `maxLimit`, and `history` (to track trends).
   - Implemented validation rules in `YangCounterGaugeValidator`:
     - Restricts values to valid unsigned range limits (e.g., 32-bit: `4294967295`, 64-bit: `18446744073709551615`).
     - Gauge value checks: ensures value does not exceed the optional `maxLimit`.
     - Counter value checks: enforces monotonicity (i.e. value cannot decrease unless the `discontinuity` flag is signaled).

2. **Mock Data Layer (`lib/services/mock_counter_gauge_service.dart`)**
   - Implemented a singleton `MockCounterGaugeService` managing a mock database of YANG counter/gauge nodes (e.g. `Interface RX Packets`, `Interface TX Errors`, `CPU Core 1 Utilization`, `Line Card Memory Used`).
   - Provided methods to query (`getNodes`), update value (`updateNodeValue`), and reset a node to zero (`resetNode`).

3. **UI & Presentation Layer (`lib/main.dart`)**
   - Integrated a multi-screen view toggling between "Reference Frames" and "Counters & Gauges" using a collapsible left sidebar drawer/navigation pane.
   - Built a comprehensive Counters & Gauges dashboard containing:
     - **Dashboard Header:** Standard label and system status badges showing total nodes registered, counters, and gauges.
     - **Value Update Form Panel:** Dropdown selection of nodes, numeric value input field with active error feedback, and a "Discontinuity Signaled" checkbox for counter decreases.
     - **YANG Node Registries List Pane:** Lists all nodes with clean styling:
       - Displays specific icons and badges (e.g. `Zero-Based`, data type tags).
       - Gauges: color-coded linear progress bars showing current utilization percentage (Green <= 70%, Orange 70-90%, Red > 90%).
       - Counters: real-time inline sparkline trend graphs drawn via a custom painter (`SparklineWidget`) illustrating historical data points.
       - Quick action buttons: edit value and quick-reset to zero.

4. **Testing Layer (`test/counter_gauge_test.dart`)**
   - Created comprehensive logic unit tests for bounds, monotonicity validation, and discontinuity.
   - Implemented widget integration UI tests covering sidebar navigation, node update, validation errors, and zero-resets.

---

## Verification Results

All logic unit tests and widget UI tests pass successfully:
```bash
flutter test test/counter_gauge_test.dart
```

---

## Step-by-Step Human Manual Testing Instructions

To verify the Counters & Gauges dashboard flow, run the application:
```bash
flutter run -d linux
```

Then perform the following tests:

1. **Verify Screen Navigation:**
   - Tap the **Counters & Gauges** item in the sidebar navigation.
   - **Verification:** The dashboard header updates to `RFC 9911 Counters & Gauges` and displays the summary counts (e.g. 7 Total Nodes, 4 Counters, 3 Gauges).

2. **Verify Gauge Utilization Dials/Progress Bars:**
   - Locate the **CPU Core 1 Utilization** node in the list. It starts at `42%` (Green).
   - In the update form, select **CPU Core 1 Utilization**.
   - Input a new value of `80` and click **UPDATE VALUE**.
   - **Verification:** The node updates to `80/100` and its progress bar turns Orange (`80%`).
   - Input a new value of `95` and click **UPDATE VALUE**.
   - **Verification:** The progress bar turns Red (`95%`).
   - Input a value of `105` and click **UPDATE VALUE**.
   - **Verification:** Form validation displays: `"Value exceeds max limit of 100 for Cpu Core 1 Utilization"`.

3. **Verify Counter Monotonicity & Discontinuity Checkbox:**
   - Select **Interface RX Packets** (starts at `0`).
   - Input `100` and click **UPDATE VALUE**.
   - **Verification:** The node value in the list updates to `100`.
   - Now input `50` and click **UPDATE VALUE** (without checking the discontinuity box).
   - **Verification:** The update is rejected and form validation displays: `"Counter value cannot decrease unless a discontinuity is signaled"`.
   - Now check the **Discontinuity Signaled** checkbox, and click **UPDATE VALUE** again.
   - **Verification:** The update succeeds, the node value drops to `50`, and a sparkline trend line begins drawing.

4. **Verify Quick Reset to 0 Action:**
   - Click the **Reset to 0** icon button (refresh icon) next to any non-zero node in the registry list.
   - **Verification:** A snackbar notification appears confirming the reset, and the node's value immediately drops to `0`.
