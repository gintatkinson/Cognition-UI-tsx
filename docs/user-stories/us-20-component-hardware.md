---
title: "User Story 20: Component Identification & Hardware Attributes (Issue #53)"
type: "user-story"
issue: 53
spec_source: "draft-ietf-ivy-network-inventory-yang Section 3"
---

# User Story: User Story 20: Component Identification & Hardware Attributes (Issue #53)

## Domain Object Mapping
- **Primary Domain Objects:** `components`, `component`, `component-id`, `class`, `hardware-rev`, `mfg-date`, `part-number`, `serial-number`, `asset-id`, `is-fru`, `uri`
- **Actor/Role:** Asset Manager / Hardware Procurement Agent

## BDD Scenario (OOA/OOD Realization)
**Given** the asset manager receives a field-replaceable chassis component shipment
**When** logging the component's serial number, part number, manufacturing date, and asset ID
**Then** the system registers the component with mandatory hardware class validation and marks its field-replaceable unit flag as true.

## Operational Context
> Hardware components must be tracked for procurement lifecycle, warranty, and field replacements, requiring serials, dates, and URIs.

## Required Features Matrix
- [x] #47 - [Feature 20: Component Identification & Hardware Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-20-component-hardware.md)

## Source References
YANG Schema: [ietf-network-inventory.yang](https://github.com/ietf-ivy-wg/network-inventory-yang/blob/main/yang/ietf-network-inventory.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-yang](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-yang)
