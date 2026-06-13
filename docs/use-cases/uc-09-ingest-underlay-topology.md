---
title: "Use Case 9: Ingest Inventory Underlay Topology (Issue #63)"
type: "use-case"
issue: 63
spec_source: "draft-ietf-ivy-network-inventory-topology Section 3"
---

# Use Case: Use Case 9: Ingest Inventory Underlay Topology (Issue #63)

## OOA/OOD Realization
- **Primary Actor:** Network Topology Collector / Controller
- **Preconditions:** A logical RFC 8345 topology is active and physical inventory elements are registered.
- **Success Guarantee (Postconditions):** The network has the `inventory-topology` network type presence flag set, and logical nodes and links successfully correlate to physical elements and media types.

## Main Success Scenario
1. The Actor initiates the synchronization of logical topology mappings.
2. The System instantiates the `inventory-topology` container in the logical network-types structure.
3. The System binds logical nodes to physical `ne-ref` inventory references.
4. The System assigns lightweight `link-type` media classifications to logical links.
5. The System commits the mappings, establishing the physical-layer underlay.

## Extensions
- **2a. Network type already configured:**
  - The System proceeds with binding.
- **3a. Referenced ne-ref does not exist in inventory:**
  - The System logs a correlation warning (non-blocking since `require-instance` is false).

## Required User Stories
- [x] #61 - [User Story 22: Underlay Network Topology Mapping](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-22-underlay-topology-mapping.md)

## Source References
YANG Schema: [ietf-network-inventory-topology.yang](https://github.com/ietf-ivy-wg/network-inventory-topology/blob/main/yang/ietf-network-inventory-topology.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-topology](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-topology)
