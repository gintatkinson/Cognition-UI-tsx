---
title: "Use Case 24: Discover and Audit Layer 2 Topology (Issue #157)"
epic: "Epic 17: IETF Layer 2 Network Topologies (Issue #159)"
type: "use-case"
issue: 157
status: proposed
labels: ["use-case", "ietf-l2-topology"]
---

# Use Case: Use Case 24: Discover and Audit Layer 2 Topology (Issue #157)

## 1. Description
This use case describes how a Network Orchestrator discovers Layer 2 network topologies, identifying logical bridge nodes, management addresses, MAC parameters, and topology status flags.

## 2. Actors
- **Primary Actor**: Network Orchestrator
- **Secondary Actor**: Bridge Configuration Service

## 3. Flow of Events

### Basic Flow
1. **Initiate Discovery**: The Network Orchestrator requests to discover all active Layer 2 network topologies.
2. **Retrieve Schema Elements**: The Bridge Configuration Service returns the topology list and attributes matching the augmented schema.
3. **Extract Bridge Attributes**: The Orchestrator extracts `bridge-id`, `management-mac`, and `management-address` parameters for each discovered node.
4. **Log Topology Events**: The service triggers notifications for any node, link, or termination point changes using `event-type`.
5. **Populate Management Console**: The Orchestrator displays the topology details.

## 4. Realisations
- [ ] #151 - [Feature 51: IETF Layer 2 Network Topology and Node Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-51-l2-topology-nodes.md)
- [ ] #154 - [User Story 48: Layer 2 Network Topology Discovery and Auditing](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-48-l2-topology-discovery.md)

## 5. Normative Specification
- [RFC 8944](https://datatracker.ietf.org/doc/rfc8944/)
