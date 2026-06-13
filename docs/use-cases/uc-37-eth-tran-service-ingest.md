---
title: "Use Case 37: Ingest and Validate Ethernet Transport Client Services (Issue #217)"
type: "use-case"
issue: 217
spec_source: "draft-ietf-ccamp-client-signal-yang"
---

# Use Case 37: Ingest and Validate Ethernet Transport Client Services (Issue #217)

## 1. Actors
- **Primary Actor**: Service Orchestrator
- **Secondary Actors**: Underlay Network Manager, Device Provisioning DB

## 2. Preconditions
- The network management agent is operational and configured with the `ietf-eth-tran-service` schema.
- High-level transport tunnels (OTN/MPLS-TP) have been pre-provisioned.

## 3. Trigger
- An operator issues a request to deploy a new virtual private line service between two customer sites.

## 4. Main Success Scenario (Basic Flow)
1. The Service Orchestrator receives a service creation request containing instance name, SAP details, tag mapping, and bandwidth limits.
2. The orchestrator validates that the endpoints and VLAN IDs are unique.
3. The orchestrator validates that the specified bandwidth profiles are defined.
4. The orchestrator maps the service endpoints to the target underlay tunnels.
5. The service is marked operational and monitoring is enabled.

## 5. Alternate and Exception Flows
- **5a. Bandwidth Reservation Failure**:
  - 1. The orchestrator detects that the underlay tunnel has insufficient remaining bandwidth to satisfy the service's ingress/egress CIR.
  - 2. The service deployment is rejected and the reason is recorded.
  - 3. The flow terminates.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The client service is successfully mapped and activated over the core transport network.
- **Failure Guarantee**: Deployment errors trigger rollbacks, keeping the existing network configuration stable.

## 7. Operational Context
> Processing client service requests ensures proper traffic mapping and reservation constraints at the access layer.

## 8. Realization Matrix

### Required User Stories
- [ ] #216 - [User Story 63: Manage Ethernet Transport Client Services](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-63-eth-tran-service.md)

### Required Features
- [ ] #211 - [Feature 73: Ethernet Transport Service Instances and Endpoints Core](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-73-eth-tran-service-core.md)
- [ ] #212 - [Feature 74: Ethernet Transport Service Access Points and Classification](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-74-eth-tran-service-sap.md)
- [ ] #213 - [Feature 75: Ethernet Transport Service Endpoints and Tag Operations](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-75-eth-tran-service-tag.md)
- [ ] #214 - [Feature 76: Ethernet Transport Service Bandwidth Profiles and Underlays](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-76-eth-tran-service-bwp-underlay.md)
- [ ] #215 - [Feature 77: Ethernet Transport Service Performance Monitoring and Alerts](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-77-eth-tran-service-pm.md)

## Source References
YANG Schema: [ietf-eth-tran-service.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-eth-tran-service.yang)
Normative Specification: [draft-ietf-ccamp-client-signal-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-client-signal-yang/)
