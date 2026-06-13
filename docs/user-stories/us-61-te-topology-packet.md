---
title: "User Story 61: Manage Packet Traffic Engineering Topologies (Issue #202)"
type: "user-story"
issue: 202
spec_source: "draft-ietf-teas-yang-l3-te-topo-18"
---

# User Story 61: Manage Packet Traffic Engineering Topologies (Issue #202)

## Domain Object Mapping
- **Primary Domain Objects**: `packet`, `packet-switch-capable`, `minimum-lsp-bandwidth`, `interface-mtu`
- **Actor/Role**: Network Operator

## BDD Scenario (OOA/OOD Realization)

**As a** Network Operator  
**I need to** manage and configure Packet Switching Capable (PSC) topology attributes  
**So that** I can ensure proper path computation and MTU negotiation constraints on packet TE links.

### BDD Acceptance Criteria
- **Given** the TE topology is set to `packet` topology type
- **When** the operator provisions an interface switching capability with an interface MTU of 9000 bytes (Jumbo frames) and a minimum LSP bandwidth of 1000000 bytes/sec
- **Then** the configuration is validated, successfully stored, and propagates the correct packet switching metrics.

## Operational Context
> Configuring packet topology attributes allows the SDN controller to route traffic only over links that meet the required MTU and bandwidth capacity.

## Required Features Matrix
- [ ] #201 - [Feature 69: Packet Traffic Engineering Topologies Core](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-69-te-topology-packet-core.md)

## Source References
YANG Schema: [ietf-te-topology-packet.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-te-topology-packet.yang)
Normative Specification: [draft-ietf-teas-yang-l3-te-topo-18](https://www.ietf.org/archive/id/draft-ietf-teas-yang-l3-te-topo-18.txt)
