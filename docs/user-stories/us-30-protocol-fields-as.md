---
title: "User Story 30: IP Protocol Fields and Autonomous Systems"
type: "user-story"
issue: 86
spec_source: "RFC 6021 Section 4"
labels: ["user-story", "ietf-inet-types"]
epic: "Epic 8: Common Internet Address YANG Data Types (Issue #88)"
---

# User Story: User Story 30: IP Protocol Fields and Autonomous Systems

**Epic:** [Epic 8: Common Internet Address YANG Data Types (Issue #88)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-08-internet-types.md)

## Domain Object Mapping
- **Primary Domain Objects:** `ip-version`, `dscp`, `ipv6-flow-label`, `port-number`, `as-number`
- **Actor/Role:** Traffic Control Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** traffic configuration details containing DSCP markings, flow labels, ports, or AS numbers
**When** the system applies the configuration rules
**Then** the engineer verifies all numeric limits, checks IP version mappings, and discards out-of-range inputs.

## Operational Context
> Handles low-level network protocol values like DSCP ranges (0..63), flow labels (0..1048575), port bounds (0..65535), and 32-bit AS numbers.

## Required Features Matrix
- [ ] #83 - [Feature 32: IP Protocol Fields and Autonomous Systems](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-32-protocol-fields-as.md)

## Source References
YANG Schema: [ietf-inet-types.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-inet-types%402013-07-15.yang)
Normative Specification: [RFC 6021 Common YANG Data Types](https://datatracker.ietf.org/doc/rfc6021/)
