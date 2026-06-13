---
title: "User Story 54: Layer 3 Unicast Topology Discovery (Issue #171)"
epic: "Epic 19: IETF Layer 3 Unicast Network Topologies (Issue #175)"
type: "user-story"
issue: 171
status: proposed
labels: ["user-story", "ietf-l3-topology"]
---

# User Story: User Story 54: Layer 3 Unicast Topology Discovery (Issue #171)

## Description
As a Network Operator,
I want to automatically discover Layer 3 network topologies including logical router identifiers and advertised prefixes,
So that I can verify that routing domains and routing policies match design architectures.

## BDD Acceptance Criteria

- **Scenario: Successfully discover router IDs and advertised prefixes**
  - **Given** a network topology of type `l3-unicast-topology` is discovered by the controller
  - **When** the controller queries the node attributes for routing parameters
  - **Then** the controller receives a list of Router IDs (e.g. `192.0.2.1`), Node Names, and advertised IP prefixes, and saves them to the topological database.

## Required Features Matrix
- [ ] #169 - [Feature 57: IETF Layer 3 Unicast Network and Node Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-57-l3-topology-nodes.md)

## Normative Specification
- [RFC 8346](https://datatracker.ietf.org/doc/rfc8346/)
