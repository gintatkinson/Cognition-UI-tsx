---
title: "User Story 28: IP Address and Prefix Types"
type: "user-story"
issue: 84
spec_source: "RFC 6021 Section 4"
labels: ["user-story", "ietf-inet-types"]
epic: "Epic 8: Common Internet Address YANG Data Types (Issue #88)"
---

# User Story: User Story 28: IP Address and Prefix Types

**Epic:** [Epic 8: Common Internet Address YANG Data Types (Issue #88)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-08-internet-types.md)

## Domain Object Mapping
- **Primary Domain Objects:** `ip-address`, `ipv4-address`, `ipv6-address`, `ip-address-no-zone`, `ipv4-address-no-zone`, `ipv6-address-no-zone`, `ip-prefix`, `ipv4-prefix`, `ipv6-prefix`
- **Actor/Role:** Network Administrator

## BDD Scenario (OOA/OOD Realization)
**Given** an IP address or prefix string is entered by the administrator
**When** the system parses the input for node configuration
**Then** the validation verifies version alignment, validates IP format patterns, extracts optional zones, and stores normalized canonical forms.

## Operational Context
> Standard IP addresses are parsed as version-neutral unions. Link-local or scoped addresses allow zone identifiers (`%`), and zones are rejected if using the no-zone variants.

## Required Features Matrix
- [ ] #81 - [Feature 30: IP Address and Prefix Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-30-ip-address-prefix.md)

## Source References
YANG Schema: [ietf-inet-types.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-inet-types%402013-07-15.yang)
Normative Specification: [RFC 6021 Common YANG Data Types](https://datatracker.ietf.org/doc/rfc6021/)
