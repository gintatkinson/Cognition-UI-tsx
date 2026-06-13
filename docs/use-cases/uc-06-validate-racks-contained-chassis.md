---
title: "Use Case 6: Validate Racks and Contained Chassis (Issue #43)"
type: "use-case"
issue: 43
spec_source: "draft-ietf-ivy-network-inventory-location Section 3"
---

# Use Case: Use Case 6: Validate Racks and Contained Chassis (Issue #43)

## OOA/OOD Realization
- **Primary Actor:** Rack Provisioning Manager
- **Preconditions:** Location and network elements/components exist in the inventory.
- **Success Guarantee (Postconditions):** The rack is assigned coordinates, physical U-slots do not overlap, and total power does not exceed max limits.

## Main Success Scenario
1. The Actor assigns a location reference and row/column coordinates to a rack.
2. The System validates the location-ref against the registered locations.
3. The Actor mounts a chassis component in a U-slot (relative position) inside the rack.
4. The System verifies that the slot (relative-position) is vacant.
5. The System calculates total power consumption and validates it against the `max-allocated-power` constraint limit of the rack.
6. The System confirms the configuration.

## Extensions
- **2a. Location reference not found:**
  - The System rejects the rack allocation.
- **4a. Slot collision detected:**
  - The System rejects the chassis mount and raises an overlapping slot constraint exception.
- **5a. Power limit overflow:**
  - The System raises a power budget warning/error constraint exception and blocks the chassis configuration.

## Required User Stories
- [x] #39 - [User Story 14: Equipment Racks Classification & Physical Bounds](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-14-racks-physical-bounds.md)
- [x] #40 - [User Story 15: Rack Locations & Grid Coordinates](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-15-rack-locations-grid.md)
- [x] #41 - [User Story 16: Rack-contained Chassis & Electricity Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-16-rack-contained-chassis-electricity.md)

## Source References
YANG Schema: [ietf-ni-location.yang](https://github.com/ietf-ivy-wg/network-inventory-location/blob/main/ietf-ni-location.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-location](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-location)
