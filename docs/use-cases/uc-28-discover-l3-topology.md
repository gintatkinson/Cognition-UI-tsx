---
title: "Use Case 28: Discover and Audit Layer 3 Unicast Topology (Issue #173)"
epic: "Epic 19: IETF Layer 3 Unicast Network Topologies (Issue #175)"
type: "use-case"
issue: 173
status: proposed
labels: ["use-case", "ietf-l3-topology"]
---

# Use Case: Use Case 28: Discover and Audit Layer 3 Unicast Topology (Issue #173)

## 1. Description
This use case describes how a Network Orchestrator discovers logical Layer 3 topologies, identifying active routing nodes, domain names, router identifiers, and advertised IP prefix scopes.

## 2. Actors
- **Primary Actor**: Network Orchestrator
- **Secondary Actor**: Routing Protocol Controller

## 3. Flow of Events

### Basic Flow
1. **Initiate Discovery**: The Network Orchestrator requests to discover all active logical Layer 3 routing topologies.
2. **Retrieve Topology Structure**: The Routing Protocol Controller returns the Layer 3 topology list and schema extensions.
3. **Extract Node Details**: The Orchestrator extracts `router-id` and domain `name` parameter mappings for each discovered routing node.
4. **Extract Advertised Prefixes**: The Orchestrator collects all prefix IP subnets and their metrics.
5. **Update Routing Dashboard**: The Orchestrator displays the logical topology with routing paths and domains.

## 4. Realisations
- [ ] #169 - [Feature 57: IETF Layer 3 Unicast Network and Node Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-57-l3-topology-nodes.md)
- [ ] #171 - [User Story 54: Layer 3 Unicast Topology Discovery](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-54-l3-topology-discovery.md)

## 5. Normative Specification
- [RFC 8346](https://datatracker.ietf.org/doc/rfc8346/)
