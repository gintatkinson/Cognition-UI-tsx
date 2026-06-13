---
title: "Use Case 33: Retrieve Traffic Engineering Topologies (Issue #194)"
type: "use-case"
issue: 194
spec_source: "RFC 8795"
---

# Use Case 33: Retrieve Traffic Engineering Topologies (Issue #194)

## 1. Actors
- **Primary Actor**: Network Management System (NMS)
- **Secondary Actors**: SDN Controller, Topology DB

## 2. Preconditions
- The network supports TE topology extensions (RFC 8795).
- The SDN Controller has populated the TE topology model with current link-state data.

## 3. Trigger
- The NMS requests the TE topology layout to compute or optimize paths.

## 4. Main Success Scenario (Basic Flow)
1. The NMS queries the SDN Controller for the `te-topology` type.
2. The SDN Controller returns the network's TE nodes and their `te-node-attributes`.
3. The SDN Controller returns the TE links, metrics, SRLGs, and `te-link-attributes`.
4. The NMS retrieves internal node capabilities via the `connectivity-matrix` entries.
5. The SDN Controller provides the operational state metrics (`oper-status` and statistics).

## 5. Alternate and Exception Flows
- **5a. Topology Missing TE Augmentations**:
  - 1. The controller responds that the queried network is not a TE topology.
  - 2. The NMS falls back to a standard L3/L2 base topology query.
  - 3. The flow terminates.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The complete TE topology dataset (including nodes, links, templates, and matrix constraints) is retrieved and synchronized.
- **Failure Guarantee**: The system reports appropriate error codes if the network lacks TE capability.

## 7. Operational Context
> Retrieving the operational TE topology allows higher-level path computation engines to perform multi-layer or multi-region routing.

## 8. Realization Matrix

### Required User Stories
- [ ] #193 - [User Story 59: Query Traffic Engineering Topologies](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-59-te-topology.md)

### Required Features
- [ ] #190 - [Feature 64: Traffic Engineering Topologies Core](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-64-te-topology-core.md)
- [ ] #191 - [Feature 65: Traffic Engineering Topologies Connectivity and Capabilities](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-65-te-topology-connectivity.md)
- [ ] #192 - [Feature 66: Traffic Engineering Topologies Operational State and Statistics](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-66-te-topology-state.md)

## Source References
YANG Schema: [ietf-te-topology.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-te-topology.yang)
Normative Specification: [RFC 8795](https://datatracker.ietf.org/doc/rfc8795/)
