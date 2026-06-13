---
title: "User Story 48: Layer 2 Network Topology Discovery and Auditing (Issue #154)"
epic: "Epic 17: IETF Layer 2 Network Topologies (Issue #159)"
type: "user-story"
issue: 154
status: proposed
labels: ["user-story", "ietf-l2-topology"]
---

# User Story: User Story 48: Layer 2 Network Topology Discovery and Auditing (Issue #154)

## Description
As a Network Operator,
I want to discover and audit Layer 2 network topologies including bridging entities and management addresses,
So that I can verify that all logical network segments match the physical device layout.

## BDD Acceptance Criteria

- **Scenario: Successfully discover Bridge ID and management parameters**
  - **Given** a network topology of type `l2-topology` is discovered by the controller
  - **When** the controller queries the node attributes for bridge endpoints
  - **Then** the controller receives a list of Bridge IDs (e.g. `00:11:22:33:44:55`), Management MAC addresses, and Management VLAN IDs, and saves them to the topological database.

## Required Features Matrix
- [ ] #151 - [Feature 51: IETF Layer 2 Network Topology and Node Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-51-l2-topology-nodes.md)

## Normative Specification
- [RFC 8944](https://datatracker.ietf.org/doc/rfc8944/)
