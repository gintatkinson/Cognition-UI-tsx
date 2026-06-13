---
title: "Use Case 8: Validate Component Containment Hierarchy and Roles (Issue #56)"
type: "use-case"
issue: 56
spec_source: "draft-ietf-ivy-network-inventory-yang Section 3"
---

# Use Case: Use Case 8: Validate Component Containment Hierarchy and Roles (Issue #56)

## OOA/OOD Realization
- **Primary Actor:** Topology Visualization Service / Device Manager
- **Preconditions:** Chassis and module sub-components exist within a registered network element.
- **Success Guarantee (Postconditions):** Parent-child containment paths are structured without loops, relative positions are set appropriately, and main chassis roles are assigned correctly.

## Main Success Scenario
1. The Actor requests the physical containment layout of a network element.
2. The System traverses the list of components, resolving each `parent` leafref reference.
3. The System validates that relative parent positions (`parent-rel-pos`) do not conflict with sibling components.
4. The System verifies that any chassis component marked with the `is-main` role is indeed of type `ianahw:chassis`.
5. The System renders the resolved containment layout tree.

## Extensions
- **2a. Circular parent reference detected:**
  - The System raises a cyclic containment constraint error and logs the affected component IDs.
- **4a. Invalid is-main assignment for non-chassis component:**
  - The System rejects the configuration and throws a role validation exception.

## Required User Stories
- [x] #53 - [User Story 20: Component Identification & Hardware Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-20-component-hardware.md)
- [x] #54 - [User Story 21: Component Containment & Roles](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-21-component-containment-roles.md)

## Source References
YANG Schema: [ietf-network-inventory.yang](https://github.com/ietf-ivy-wg/network-inventory-yang/blob/main/yang/ietf-network-inventory.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-yang](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-yang)
