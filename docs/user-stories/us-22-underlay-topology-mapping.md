---
title: "User Story 22: Underlay Network Topology Mapping (Issue #61)"
type: "user-story"
issue: 61
spec_source: "draft-ietf-ivy-network-inventory-topology Section 3"
---

# User Story: User Story 22: Underlay Network Topology Mapping (Issue #61)

## Domain Object Mapping
- **Primary Domain Objects:** `inventory-topology`, `inventory-mapping-attributes`, `ne-ref`, `link-type`
- **Actor/Role:** Topology Planner / Network Operations Center (NOC) Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** the topology planner has a logical node and link topology
**When** assigning the physical underlay topology network type and referencing physical Network Elements and link media types
**Then** the system establishes a 1:1 inventory mapping allowing the planner to correlate logical nodes and links with physical hardware modules.

## Operational Context
> Logical network devices and links must correlate directly to their physical underlay counterparts to assist with failure root-cause analysis and proactive physical maintenance.

## Required Features Matrix
- [x] #57 - [Feature 22: Network Inventory Topology Network Type](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-22-topology-network-type.md)
- [x] #58 - [Feature 23: Topology Inventory Mapping & Link Classification](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-23-topology-inventory-mapping.md)

## Source References
YANG Schema: [ietf-network-inventory-topology.yang](https://github.com/ietf-ivy-wg/network-inventory-topology/blob/main/yang/ietf-network-inventory-topology.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-topology](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-topology)
