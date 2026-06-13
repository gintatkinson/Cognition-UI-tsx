---
title: "User Story 39: Transport Client Service Provisioning (Issue #115)"
type: "user-story"
issue: 115
spec_source: "draft-ietf-ccamp-otn-topo-yang"
---

# User Story 39: Transport Client Service Provisioning (Issue #115)

## Domain Object Mapping
- **Primary Domain Objects**: `client-svc`, `client-svc-instances`
- **Actor/Role**: Network Provisioning Engineer

## BDD Scenario (OOA/OOD Realization)

**As a** Network Provisioning Engineer  
**I need to** provision a transport client service instance between source and destination access ports  
**So that** high-bandwidth customer traffic is routed across the network over TE service tunnels.

### BDD Acceptance Criteria
- **Given** source and destination access ports are configured with compatible client signal types
- **When** the engineer provisions a client service instance mapped to active service tunnels
- **Then** the service provisioning state transitions to active and operational state transitions to up.

## Operational Context
> Transport client services are configured by mapping client signal access parameters to physical or logical Link Termination Points (LTPs) and associating them with traffic engineering tunnels.

## Required Features Matrix
- [x] #108 - [Feature 41: Transport Client Service Core Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-41-trans-client-service-core.md)
- [x] #109 - [Feature 42: Transport Client Service Port Mapping and Tunnels](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-42-trans-client-service-ports.md)

## Source References
- YANG Schema: [ietf-trans-client-service.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-trans-client-service.yang)
- Normative Specification: [draft-ietf-ccamp-otn-topo-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-otn-topo-yang/)
