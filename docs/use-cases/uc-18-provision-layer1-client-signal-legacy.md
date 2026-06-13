---
title: "Use Case 18: Provision Layer 1 Client Signal (Issue #118)"
type: "use-case"
issue: 118
spec_source: "draft-ietf-ccamp-otn-topo-yang Section 3"
---

# Use Case 18: Provision Layer 1 Client Signal (Issue #118)

## 1. Actors
- **Primary Actor**: Network Provisioning Controller
- **Secondary Actors**: Network Element Agent, Topology Service

## 2. Preconditions
- Source and destination Link Termination Points (LTPs) are defined in the network topology.
- Compatible transceivers are installed on the access nodes.

## 3. Trigger
- The controller receives a provisioning request to establish a point-to-point (P2P) client service (e.g. 100GE client signal) between access nodes.

## 4. Main Success Scenario (Basic Flow)
1. The Network Provisioning Controller queries the Topology Service to locate compatible client signal access ports.
2. The Network Provisioning Controller selects target access ports (`src-access-ports` and `dst-access-ports`) and configures `client-signal` to 100G Ethernet.
3. The Network Provisioning Controller configures the administrative state `admin-status` to UP.
4. The Network Element Agent maps the service to active service tunnels (`svc-tunnels`).
5. The Network Provisioning Controller verifies that `provisioning-state` is active and `operational-state` is UP.

## 5. Alternate and Exception Flows
- **5a. Port Speed Mismatch**:
  - 1. The selected access ports cannot support the requested `client-signal` rate.
  - 2. The configuration is rejected, and `error-info` is populated with `error-code` and `error-description`.
  - 3. The transaction aborts.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The P2P client service is successfully provisioned, mapped to tunnels, and active on the access ports.
- **Failure Guarantee**: The configuration is aborted, the port states remain unmodified, and the error description is returned to the user.

## 7. Operational Context
> Provisioning of transport client services requires selecting matching access ports and mapping the logical service signal rates to the appropriate underlay traffic engineering tunnels.

## 8. Realization Matrix

### Required User Stories
- [x] #115 - [User Story 39: Transport Client Service Provisioning](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-39-transport-client-service-provisioning.md)

### Required Features
- [x] #108 - [Feature 41: Transport Client Service Core Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-41-trans-client-service-core.md)
- [x] #109 - [Feature 42: Transport Client Service Port Mapping and Tunnels](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-42-trans-client-service-ports.md)

## Source References
- YANG Schema: [ietf-trans-client-service.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-trans-client-service.yang)
- Normative Specification: [draft-ietf-ccamp-otn-topo-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-otn-topo-yang/)
