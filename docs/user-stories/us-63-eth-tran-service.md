---
title: "User Story 63: Manage Ethernet Transport Client Services (Issue #216)"
type: "user-story"
issue: 216
spec_source: "draft-ietf-ccamp-client-signal-yang"
---

# User Story 63: Manage Ethernet Transport Client Services (Issue #216)

## Domain Object Mapping
- **Primary Domain Objects**: `etht-svc`, `etht-svc-instances`, `etht-svc-access-points`, `etht-svc-end-points`, `underlay`
- **Actor/Role**: Network Operations Engineer

## BDD Scenario (OOA/OOD Realization)

**As a** Network Operations Engineer  
**I need to** manage and configure Ethernet client services  
**So that** I can establish packet connections between remote customer access points over WAN transport tunnels.

### BDD Acceptance Criteria
- **Given** an Ethernet transport service instance is defined
- **When** the engineer registers two `etht-svc-access-points` mapped to physical interfaces and binds the connection to a `pw` underlay tunnel
- **Then** the service configuration is successfully validated, stored, and marked as operationally active.

## Operational Context
> Provisioning end-to-end client services allows the SDN orchestrator to bind customer traffic to pre-established core tunnels.

## Required Features Matrix
- [ ] #211 - [Feature 73: Ethernet Transport Service Instances and Endpoints Core](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-73-eth-tran-service-core.md)
- [ ] #212 - [Feature 74: Ethernet Transport Service Access Points and Classification](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-74-eth-tran-service-sap.md)
- [ ] #213 - [Feature 75: Ethernet Transport Service Endpoints and Tag Operations](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-75-eth-tran-service-tag.md)
- [ ] #214 - [Feature 76: Ethernet Transport Service Bandwidth Profiles and Underlays](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-76-eth-tran-service-bwp-underlay.md)
- [ ] #215 - [Feature 77: Ethernet Transport Service Performance Monitoring and Alerts](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-77-eth-tran-service-pm.md)

## Source References
YANG Schema: [ietf-eth-tran-service.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-eth-tran-service.yang)
Normative Specification: [draft-ietf-ccamp-client-signal-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-client-signal-yang/)
