---
title: "User Story 15: Rack Locations & Grid Coordinates (Issue #40)"
type: "user-story"
issue: 40
spec_source: "draft-ietf-ivy-network-inventory-location Section 3"
---

# User Story: User Story 15: Rack Locations & Grid Coordinates (Issue #40)

## Domain Object Mapping
- **Primary Domain Objects:** `rack-location`, `location-ref`, `row-number`, `column-number`
- **Actor/Role:** Data Center Manager / Facility Operator

## BDD Scenario (OOA/OOD Realization)
**Given** the data center manager is locating a rack
**When** assigning the grid location (row and column numbers)
**Then** the rack position is visualised in the room layout floorplan based on location reference boundaries.

## Operational Context
> Racks are laid out in rows and columns inside server rooms to maintain hot/cold aisles and organize cabling structures.

## Required Features Matrix
- [x] #33 - [Feature 15: Rack Locations & Grid Coordinates](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-15-rack-locations-grid.md)

## Source References
YANG Schema: [ietf-ni-location.yang](https://github.com/ietf-ivy-wg/network-inventory-location/blob/main/ietf-ni-location.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-location](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-location)
