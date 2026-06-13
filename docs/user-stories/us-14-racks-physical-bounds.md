---
title: "User Story 14: Equipment Racks Classification & Physical Bounds (Issue #39)"
type: "user-story"
issue: 39
spec_source: "draft-ietf-ivy-network-inventory-location Section 3"
---

# User Story: User Story 14: Equipment Racks Classification & Physical Bounds (Issue #39)

## Domain Object Mapping
- **Primary Domain Objects:** `racks`, `rack`, `id`, `rack-class`, `rack-class-type`, `rack-standard`, `rack-secure-baseline`, `rack-secure-medium`, `rack-secure-high`, `height`, `width`, `depth`, `timestamp`, `valid-until`
- **Actor/Role:** Data Center Architect / Site Technician

## BDD Scenario (OOA/OOD Realization)
**Given** the data center architect is planning rack deployments
**When** assigning a classification and physical size limits (height, width, depth)
**Then** the values are checked to ensure they align with valid identities and dimensions in millimeters.

## Operational Context
> Racks require specific security classification levels and physical dimension definitions to fit inside containment aisles.

## Required Features Matrix
- [x] #32 - [Feature 14: Equipment Racks Classification & Physical Bounds](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-14-racks-physical-bounds.md)

## Source References
YANG Schema: [ietf-ni-location.yang](https://github.com/ietf-ivy-wg/network-inventory-location/blob/main/ietf-ni-location.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-location](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-location)
