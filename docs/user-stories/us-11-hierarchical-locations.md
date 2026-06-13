---
title: "User Story 11: Hierarchical Inventory Locations (Issue #36)"
type: "user-story"
issue: 36
spec_source: "draft-ietf-ivy-network-inventory-location Section 3"
---

# User Story: User Story 11: Hierarchical Inventory Locations (Issue #36)

## Domain Object Mapping
- **Primary Domain Objects:** `locations`, `location`, `id`, `type`, `parent`, `timestamp`, `valid-until`, `ni-location-ref`
- **Actor/Role:** Inventory Administrator / Network Planner

## BDD Scenario (OOA/OOD Realization)
**Given** the inventory administrator is configuring location entities
**When** creating a containment relationship between a child location and a parent location
**Then** the system verifies that the reference resolves to an existing location and that no containment loops are introduced.

## Operational Context
> The location model provides hierarchical containment representations. Users can set parent references to model nesting, such as a server room inside a floor, which is in a building.

## Required Features Matrix
- [x] #29 - [Feature 11: Hierarchical Inventory Locations](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-11-hierarchical-locations.md)

## Source References
YANG Schema: [ietf-ni-location.yang](https://github.com/ietf-ivy-wg/network-inventory-location/blob/main/ietf-ni-location.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-location](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-location)
