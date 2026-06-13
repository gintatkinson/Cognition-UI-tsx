---
title: "Use Case 20: Monitor OTN Network Slice Performance (Issue #137)"
type: "use-case"
issue: 137
spec_source: "draft-ietf-ccamp-yang-otn-slicing"
---

# Use Case 20: Monitor OTN Network Slice Performance (Issue #137)

## 1. Actors
- **Primary Actor:** Network Operations Center (NOC) Operator
- **Secondary Actors:** Performance Monitoring Agent, Topology Controller

## 2. Preconditions
- The target OTN Network Slice is provisioned and active.
- Performance monitoring is enabled with active SLO objectives.

## 3. Trigger
- The Performance Monitoring Agent detects a threshold violation (e.g., bit-error-rate exceeds configured `pm-threshold`).

## 4. Main Success Scenario (Basic Flow)
1. The Performance Monitoring Agent gathers counter telemetry from the network nodes.
2. The Agent detects that the ODU Background Block Error (BBE) count for `pm-15m` duration exceeds the configured threshold.
3. The Agent generates a Threshold Crossing Alarm (TCA).
4. The Topology Controller updates the link status and raises a visual notification to the NOC Operator.
5. The NOC Operator views the active alarms on the slice performance dashboard.

## 5. Alternate and Exception Flows
- **5a. Temporary Telemetry Loss:**
  1. The Performance Monitoring Agent fails to retrieve telemetry from a node.
  2. The system flags the interval data as invalid and schedules a retry.
- **5b. SLO Template Update:**
  1. The NOC Operator increases the threshold limit.
  2. The active alarm is cleared automatically if the current value is below the new threshold.

## 6. Postconditions (Guarantees)
- **Success Guarantee:** Alarms are raised and logged for any threshold crossing, giving operational visibility.
- **Failure Guarantee:** Alarm states are preserved, and telemetry gathering failures are reported.

## 7. Operational Context
> The performance requirements and objectives defined in the SLO template are audited continuously. The network management system tracks interval data (15m/24h) to report performance indicators.

## 8. Realization Matrix

### Required User Stories
- [x] #136 - [User Story 42: Configure OTN Slice PM Thresholds](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-42-configure-otn-slice-pm-thresholds.md)

### Required Features
- [x] #112 - [Feature 45: OTN Network Slice Performance Monitoring](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-45-otn-slice-pm.md)

## Source References
YANG Schema: [ietf-otn-slice.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-otn-slice.yang)
Normative Specification: [draft-ietf-ccamp-yang-otn-slicing](https://datatracker.ietf.org/doc/draft-ietf-ccamp-yang-otn-slicing/)
