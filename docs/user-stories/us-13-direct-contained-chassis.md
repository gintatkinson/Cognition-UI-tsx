---
title: "User Story 13: Direct Location-contained Chassis (Issue #38)"
type: "user-story"
issue: 38
spec_source: "draft-ietf-ivy-network-inventory-location Section 3"
---

# User Story: User Story 13: Direct Location-contained Chassis (Issue #38)

## Domain Object Mapping
- **Primary Domain Objects:** `contained-chassis`, `chassis-id`, `ne-ref`, `component-ref`
- **Actor/Role:** Operations Operator / Field Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** the operations operator is deploying a chassis directly in a room without a rack
**When** assigning the network element and component references
**Then** the component reference must resolve to a valid component within the selected network element.

## Operational Context
> Network elements may consist of distributed physical chassis that are installed directly in rooms, ceiling mounts, or outdoor poles.

## Required Features Matrix
- [x] #31 - [Feature 13: Direct Location-contained Chassis](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-13-direct-contained-chassis.md)

## Source References
YANG Schema: [ietf-ni-location.yang](https://github.com/ietf-ivy-wg/network-inventory-location/blob/main/ietf-ni-location.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-location](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-location)
