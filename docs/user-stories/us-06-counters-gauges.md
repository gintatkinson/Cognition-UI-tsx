---
title: "User Story 6: Numeric Counters and Gauges (Issue #23)"
type: "user-story"
issue: 23
spec_source: "RFC 9911 Section 3"
---

# User Story: User Story 6: Numeric Counters and Gauges (Issue #23)

## Domain Object Mapping
- **Primary Domain Objects:** `counter32`, `zero-based-counter32`, `counter64`, `zero-based-counter64`, `gauge32`, `gauge64`
- **Actor/Role:** System Telemetry Monitor

## BDD Scenario (OOA/OOD Realization)
**Given** the telemetry monitor is reading system state counters and gauges
**When** a new data sample is reported
**Then** the monitor verifies that the counter values have not decreased (unless reset) and that gauges lie within their defined bounds.

## Operational Context
> The counter and gauge types represent standard numeric instrumentation points. Counters monotonically increase and wrap around at maximum value, whereas gauges represent fluctuating levels bounded by zero and maximum value.

## Required Features Matrix
- [x] #17 - [Feature 6: Numeric Counters and Gauges](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/epic-2-common-types/docs/features/feat-06-counters-gauges.md)

## Source References
YANG Schema: [ietf-yang-types.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-yang-types%402025-12-22.yang)
Normative Specification: [RFC 9911 Common YANG Data Types](https://datatracker.ietf.org/doc/rfc9911/)
