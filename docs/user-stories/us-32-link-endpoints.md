---
title: "User Story 32: Linking Source and Destination Node Interfaces"
type: "user-story"
issue: 91
spec_source: "RFC 8345 Section 3.1"
labels: ["user-story", "ietf-network-topology"]
epic: "Epic 9: Network Topology Model (Issue #80)"
---

# User Story: User Story 32: Linking Source and Destination Node Interfaces

**Epic:** [Epic 9: Network Topology Model (Issue #80)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-09-network-topology.md)

## Domain Object Mapping
- **Primary Domain Objects:** `link`, `link-id`, `source`, `source-node`, `source-tp`, `destination`, `dest-node`, `dest-tp`
- **Actor/Role:** NOC Operations Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** node "node-A" with termination point "tp-1" and node "node-B" with termination point "tp-2" exist in network "net-1"
**When** a NOC engineer configures a unidirectional link "link-1" in network "net-1" with source node "node-A", source TP "tp-1", destination node "node-B", and destination TP "tp-2"
**Then** the system validates that both endpoints exist, checks that the parent nodes belong to the same network, and successfully persists the connection.

## Operational Context
> A network link connects a local (source) node and a remote (destination) node via a set of the respective node's termination points. The link is point-to-point and unidirectional.

## Required Features Matrix
- [ ] #74 - [Feature 29: Network Topology Model](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-29-network-topology-model.md)

## Source References
YANG Schema: [ietf-network-topology.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-network-topology%402018-02-26.yang)
Normative Specification: [RFC 8345](https://datatracker.ietf.org/doc/rfc8345/)
