---
title: "User Story 17: Inventory Type Definitions & References (Issue #50)"
type: "user-story"
issue: 50
spec_source: "draft-ietf-ivy-network-inventory-yang Section 3"
---

# User Story: User Story 17: Inventory Type Definitions & References (Issue #50)

## Domain Object Mapping
- **Primary Domain Objects:** `ne-type`, `ne-physical`, `non-hardware-component-class`, `ne-ref`, `component-ref`, `port-ref`
- **Actor/Role:** Network Architect / Integration Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** the network integration engineer is referencing a component in the topology
**When** validating the component and port reference paths
**Then** the system ensures the referencing paths resolve to valid registered inventory elements and class constraints (e.g. port references must derive from `ianahw:port`).

## Operational Context
> Identifiers and reference paths allow external models to build links, connection topologies, or locations pointing directly to specific inventory elements, components, or ports.

## Required Features Matrix
- [x] #44 - [Feature 17: Inventory Type Definitions & References](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-17-types-references.md)

## Source References
YANG Schema: [ietf-network-inventory.yang](https://github.com/ietf-ivy-wg/network-inventory-yang/blob/main/yang/ietf-network-inventory.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-yang](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-yang)
