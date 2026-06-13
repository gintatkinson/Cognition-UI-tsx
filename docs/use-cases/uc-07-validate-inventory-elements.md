---
title: "Use Case 7: Validate Network Element and Component Inventory (Issue #55)"
type: "use-case"
issue: 55
spec_source: "draft-ietf-ivy-network-inventory-yang Section 3"
---

# Use Case: Use Case 7: Validate Network Element and Component Inventory (Issue #55)

## OOA/OOD Realization
- **Primary Actor:** Inventory Collection Engine / Controller Daemon
- **Preconditions:** Network elements and their sub-components have been discovered or configured.
- **Success Guarantee (Postconditions):** Network elements and components have unique IDs, mandatory class definitions are validated, and software revisions with patches are recorded.

## Main Success Scenario
1. The Actor initiates the ingestion of a network element's physical/virtual inventory.
2. The System validates the unique `ne-id` in the datastore.
3. The System verifies each nested component has a unique `component-id` and a mandatory `class` value.
4. The System parses the software revisions (`software-rev`) and verifies active patches against vendor manifests.
5. The System commits the element and component records.

## Extensions
- **2a. Duplicate ne-id detected:**
  - The System rejects the configuration change and raises a duplicate element constraint exception.
- **3a. Missing component class:**
  - The System rejects the component configuration and flags a missing mandatory attribute validation failure.
- **4a. Software patch revision syntax violation:**
  - The System registers the software module but flags a patch level syntax warning.

## Required User Stories
- [x] #50 - [User Story 17: Inventory Type Definitions & References](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-17-types-references.md)
- [x] #51 - [User Story 18: Common Entity Software & Manufacturer Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-18-software-manufacturer.md)
- [x] #52 - [User Story 19: Network Element Management](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-19-ne-management.md)
- [x] #53 - [User Story 20: Component Identification & Hardware Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-20-component-hardware.md)

## Source References
YANG Schema: [ietf-network-inventory.yang](https://github.com/ietf-ivy-wg/network-inventory-yang/blob/main/yang/ietf-network-inventory.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-yang](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-yang)
