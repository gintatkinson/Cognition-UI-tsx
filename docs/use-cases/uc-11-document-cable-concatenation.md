---
title: "Use Case 11: Document Cable Concatenation Splicing (Issue #71)"
type: "use-case"
issue: 71
spec_source: "draft-ygb-ivy-passive-network-inventory Section 3"
---

# Use Case: Use Case 11: Document Cable Concatenation Splicing (Issue #71)

## OOA/OOD Realization
- **Primary Actor:** Fiber Splicer / Provisioning Engine
- **Preconditions:** Multiple physical cable segments are deployed and registered in the inventory database.
- **Success Guarantee (Postconditions):** The system documents the order and splicing index of each segment, creating a single logical cable path representation.

## Main Success Scenario
1. The Actor selects a physical cable run that is built by concatenating multiple segments.
2. The System queries the cable database.
3. The Actor adds child cable entries, assigning each an ordering index (1, 2, 3...) and splicing length details.
4. The System verifies that at least two child cables are configured (min-elements 2).
5. The System saves the composite cable run structure.

## Extensions
- **3a. Spliced child-cable is not registered in the database:**
  - The System displays an error and requires registering the child cable first.
- **4a. Fewer than 2 child cables are provided:**
  - The System rejects the configuration, enforcing the `min-elements 2` constraint.

## Required User Stories
- [ ] #69 - [User Story 24: Optical Fiber Cable Asset Ingestion](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-24-fiber-optic-cables.md)

## Source References
YANG Schema: [ietf-nwi-passive-inventory.yang](https://github.com/aguoietf/draft-ygb-ivy-passive-network-inventory/blob/main/yang/ietf-nwi-passive-inventory.yang)
Normative Specification: [draft-ygb-ivy-passive-network-inventory](https://datatracker.ietf.org/doc/draft-ygb-ivy-passive-network-inventory/)
