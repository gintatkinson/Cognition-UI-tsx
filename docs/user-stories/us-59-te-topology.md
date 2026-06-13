---
title: "User Story 59: Query Traffic Engineering Topologies (Issue #193)"
type: "user-story"
issue: 193
spec_source: "RFC 8795"
---

# User Story 59: Query Traffic Engineering Topologies (Issue #193)

## Domain Object Mapping
- **Primary Domain Objects**: `te-topology`, `te-node-attributes`, `te-link-attributes`, `connectivity-matrix`, `tunnel-termination-point`
- **Actor/Role**: Network Operator

## BDD Scenario (OOA/OOD Realization)

**As a** Network Operator  
**I need to** query and inspect Traffic Engineering topologies, node/link attributes, and connectivity constraints  
**So that** I can monitor the active state, capabilities, and health of the TE network.

### BDD Acceptance Criteria
- **Given** the TE topology is active and populated with node and link data
- **When** the operator requests the operational status and internal connectivity matrix of a specific TE node
- **Then** the system returns `oper-status` and lists the source-destination termination point pairs allowed for switching.

## Operational Context
> Monitoring and querying the TE topology allows the operator to dynamically adjust paths and respond to link failures or capacity bottlenecks.

## Required Features Matrix
- [ ] #190 - [Feature 64: Traffic Engineering Topologies Core](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-64-te-topology-core.md)
- [ ] #191 - [Feature 65: Traffic Engineering Topologies Connectivity and Capabilities](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-65-te-topology-connectivity.md)
- [ ] #192 - [Feature 66: Traffic Engineering Topologies Operational State and Statistics](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-66-te-topology-state.md)

## Source References
YANG Schema: [ietf-te-topology.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-te-topology.yang)
Normative Specification: [RFC 8795](https://datatracker.ietf.org/doc/rfc8795/)
