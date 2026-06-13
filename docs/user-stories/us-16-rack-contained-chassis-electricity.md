---
title: "User Story 16: Rack-contained Chassis & Electricity Attributes (Issue #41)"
type: "user-story"
issue: 41
spec_source: "draft-ietf-ivy-network-inventory-location Section 3"
---

# User Story: User Story 16: Rack-contained Chassis & Electricity Attributes (Issue #41)

## Domain Object Mapping
- **Primary Domain Objects:** `max-voltage`, `max-allocated-power`, `contained-chassis`, `relative-position`, `ne-ref`, `component-ref`
- **Actor/Role:** Power and Cooling Engineer / Data Center Administrator

## BDD Scenario (OOA/OOD Realization)
**Given** the power engineer is mounting a chassis in a rack
**When** assigning its U-slot relative position and checking electricity consumption
**Then** the system ensures the slot is not already occupied and that total power does not exceed the maximum allocated limit constraint.

## Operational Context
> Racks have electric voltage limits and max allocated power bounds. Dynamic slot mapping checks prevent physical slot conflicts.

## Required Features Matrix
- [x] #34 - [Feature 16: Rack-contained Chassis & Electricity Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-16-rack-contained-chassis-electricity.md)

## Source References
YANG Schema: [ietf-ni-location.yang](https://github.com/ietf-ivy-wg/network-inventory-location/blob/main/ietf-ni-location.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-location](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-location)
