---
title: "User Story 26: Multi-Layer Network Mapping (Issue #75)"
type: "user-story"
issue: 75
spec_source: "RFC 8345 Section 3"
---

# User Story: User Story 26: Multi-Layer Network Mapping (Issue #75)

## Domain Object Mapping
- **Primary Domain Objects:** `network`, `node`, `supporting-network`, `supporting-node`
- **Actor/Role:** Network Architect / NOC Operations Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** a physical fiber network "underlay-1" containing physical node "phy-node-A"
**When** the network architect defines a logical IP network "overlay-1" and maps its logical node "ip-node-A" to "phy-node-A" in "underlay-1"
**Then** the system registers the IP network topology and verifies that the underlay mappings to the physical elements are intact.

## Operational Context
> Network topologies can be layered. To model this, a network can be supported by other underlay networks. Similarly, a node can be supported by underlay nodes.

## Required Features Matrix
- [ ] #73 - [Feature 28: Network and Node Base Models](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-28-network-base-model.md)

## Source References
YANG Schema: [ietf-network.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-network%402018-02-26.yang)
Normative Specification: [RFC 8345](https://datatracker.ietf.org/doc/rfc8345/)
