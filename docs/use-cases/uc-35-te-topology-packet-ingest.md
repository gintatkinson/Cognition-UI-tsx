---
title: "Use Case 35: Ingest and Validate Packet Traffic Engineering Topologies (Issue #203)"
type: "use-case"
issue: 203
spec_source: "draft-ietf-teas-yang-l3-te-topo-18"
---

# Use Case 35: Ingest and Validate Packet Traffic Engineering Topologies (Issue #203)

## 1. Actors
- **Primary Actor**: SDN Controller
- **Secondary Actors**: Network Configuration Engine, Topology DB

## 2. Preconditions
- The network supports Packet TE topologies (draft-ietf-teas-yang-l3-te-topo-18).
- The network management agent is operational and configured with the `ietf-te-topology-packet` schema.

## 3. Trigger
- The Network Configuration Engine pushes a new topology update or interface capability modification.

## 4. Main Success Scenario (Basic Flow)
1. The SDN Controller receives a topology update containing interface switching capabilities.
2. The SDN Controller identifies the topology type as `packet` (PSC).
3. The SDN Controller validates the minimum LSP bandwidth and interface MTU attributes.
4. The configurations are stored in the Topology DB and marked as operational.

## 5. Alternate and Exception Flows
- **5a. Missing Packet Topology Type**:
  - 1. The controller detects that the topology lacks the `packet` presence container augment.
  - 2. The controller rejects the PSC interface capability configuration since it is valid only in packet TE topologies.
  - 3. The flow terminates.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The packet TE topology attributes are verified and successfully stored in the Topology DB.
- **Failure Guarantee**: Invalid topology configurations are rejected, maintaining database integrity.

## 7. Operational Context
> Processing packet-specific topology attributes ensures that the SDN controller computes valid paths based on real switching capabilities.

## 8. Realization Matrix

### Required User Stories
- [ ] #202 - [User Story 61: Manage Packet Traffic Engineering Topologies](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-61-te-topology-packet.md)

### Required Features
- [ ] #201 - [Feature 69: Packet Traffic Engineering Topologies Core](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-69-te-topology-packet-core.md)

## Source References
YANG Schema: [ietf-te-topology-packet.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-te-topology-packet.yang)
Normative Specification: [draft-ietf-teas-yang-l3-te-topo-18](https://www.ietf.org/archive/id/draft-ietf-teas-yang-l3-te-topo-18.txt)
