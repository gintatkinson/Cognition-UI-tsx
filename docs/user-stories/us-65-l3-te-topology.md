---
title: "User Story 65: Discover and Manage Layer 3 TE Topologies (Issue #228)"
type: "user-story"
issue: 228
spec_source: "draft-ietf-teas-yang-l3-te-topo-18"
---

# User Story 65: Discover and Manage Layer 3 TE Topologies (Issue #228)

## Domain Object Mapping
- **Primary Domain Objects**: `l3-te`, `l3-te-topology-attributes`, `l3-te-node-attributes`, `l3-te-tp-attributes`, `l3-te-link-attributes`
- **Actor/Role**: Network Topology Administrator / SDN Controller

## BDD Scenario (OOA/OOD Realization)

**As an** SDN Controller  
**I need to** discover and map Layer 3 TE topology attributes and correlate L3 nodes/links with base TE topologies  
**So that** I can calculate network paths using unified routing and TE attributes.

### BDD Acceptance Criteria
- **Given** a network elements list in the Layer 3 TE topology database
- **When** the controller fetches node/link parameters and maps them to corresponding base TE references
- **Then** the network graph is successfully updated with the L3 TE topology correlation mappings.

## Operational Context
> Correlating Layer 3 routing nodes/links with the underlying Traffic Engineering topology allows unified multi-layer path computation.

## Required Features Matrix
- [ ] #226 - [Feature 82: Layer 3 TE Topology and Node Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-82-l3-te-topology-nodes.md)
- [ ] #227 - [Feature 83: Layer 3 TE Topology Links and Termination Points](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-83-l3-te-topology-links.md)

## Source References
YANG Schema: [ietf-l3-te-topology.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-l3-te-topology.yang)
Normative Specification: [draft-ietf-teas-yang-l3-te-topo-18](https://www.ietf.org/archive/id/draft-ietf-teas-yang-l3-te-topo-18.txt)
