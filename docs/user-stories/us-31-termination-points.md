---
title: "User Story 31: Node Termination Point Configuration"
type: "user-story"
issue: 89
spec_source: "RFC 8345 Section 3.1"
labels: ["user-story", "ietf-network-topology"]
epic: "Epic 9: Network Topology Model (Issue #80)"
---

# User Story: User Story 31: Node Termination Point Configuration

**Epic:** [Epic 9: Network Topology Model (Issue #80)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-09-network-topology.md)

## Domain Object Mapping
- **Primary Domain Objects:** `termination-point`, `tp-id`, `supporting-termination-point`
- **Actor/Role:** NOC Operations Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** a network node has been provisioned
**When** a NOC engineer configures physical or logical ports as termination points on the node, optionally referencing supporting ports in the underlay network
**Then** the system validates that the port IDs are unique within the node, verifies the underlay port references, and successfully persists the termination points.

## Operational Context
> Nodes can contain termination points, which represent interfaces or ports where links terminate. A termination point can be supported by other underlay termination points, establishing layering mapping across networks.

## Required Features Matrix
- [ ] #74 - [Feature 29: Network Topology Model](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-29-network-topology-model.md)

## Source References
YANG Schema: [ietf-network-topology.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-network-topology%402018-02-26.yang)
Normative Specification: [RFC 8345](https://datatracker.ietf.org/doc/rfc8345/)
