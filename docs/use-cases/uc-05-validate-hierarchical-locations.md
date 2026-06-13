---
title: "Use Case 5: Validate Hierarchical Locations (Issue #42)"
type: "use-case"
issue: 42
spec_source: "draft-ietf-ivy-network-inventory-location Section 3"
---

# Use Case: Use Case 5: Validate Hierarchical Locations (Issue #42)

## OOA/OOD Realization
- **Primary Actor:** Location Registry Daemon / Inventory Controller
- **Preconditions:** Location entries exist in the database with parent and physical address attributes.
- **Success Guarantee (Postconditions):** No loops exist in the hierarchy, all country codes match ISO ALPHA-2, and child location valid-until timestamps are verified.

## Main Success Scenario
1. The Actor requests the addition or modification of a location in the hierarchy.
2. The System checks if the configured `parent` reference creates a cyclic loop with any ancestor locations.
3. The System validates the `country-code` leaf inside the `physical-address` grouping against the ISO Alpha-2 pattern `[A-Z]{2}`.
4. The System verifies that the temporal `valid-until` timestamp of the child is not later than that of the parent location (if configured).
5. The System commits the transaction.

## Extensions
- **2a. Circular dependency detected:**
  - The System identifies a cyclic containment reference loop.
  - The System rejects the configuration change and raises a containment constraint exception.
- **3a. Invalid ISO country-code format:**
  - The System identifies that the country code does not match the uppercase two-letter pattern constraint.
  - The System rejects the configuration and flags the invalid input.

## Required User Stories
- [x] #36 - [User Story 11: Hierarchical Inventory Locations](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-11-hierarchical-locations.md)
- [x] #37 - [User Story 12: Location Physical Addresses](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-12-physical-addresses.md)
- [x] #38 - [User Story 13: Direct Location-contained Chassis](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-13-direct-contained-chassis.md)

## Source References
YANG Schema: [ietf-ni-location.yang](https://github.com/ietf-ivy-wg/network-inventory-location/blob/main/ietf-ni-location.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-location](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-location)
