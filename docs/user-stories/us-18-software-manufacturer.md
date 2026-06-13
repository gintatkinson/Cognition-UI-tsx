---
title: "User Story 18: Common Entity Software & Manufacturer Attributes (Issue #51)"
type: "user-story"
issue: 51
spec_source: "draft-ietf-ivy-network-inventory-yang Section 3"
---

# User Story: User Story 18: Common Entity Software & Manufacturer Attributes (Issue #51)

## Domain Object Mapping
- **Primary Domain Objects:** `software-rev`, `patch`, `mfg-name`, `product-name`
- **Actor/Role:** System Administrator / Operations Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** the operations engineer is upgrading software components on a router
**When** documenting the active software version modules and patch revisions
**Then** the system stores the manufacturer name, product model, and hierarchical nested patch identifiers under the respective software revision module.

## Operational Context
> Network elements and components can run complex software images that contain localized revision details and multiple active vendor patches.

## Required Features Matrix
- [x] #45 - [Feature 18: Common Entity Software & Manufacturer Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-18-software-manufacturer.md)

## Source References
YANG Schema: [ietf-network-inventory.yang](https://github.com/ietf-ivy-wg/network-inventory-yang/blob/main/yang/ietf-network-inventory.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-yang](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-yang)
