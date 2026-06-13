---
title: "Use Case 21: Map OTN and fg-OTN Network Topology (Issue #138)"
type: "use-case"
issue: 138
spec_source: "draft-ietf-ccamp-otn-topo-yang"
---

# Use Case 21: Map OTN and fg-OTN Network Topology (Issue #138)

## 1. Actors
- **Primary Actor:** Network Provisioning Controller
- **Secondary Actors:** Topology Service, Inventory Database

## 2. Preconditions
- The optical nodes and port interfaces supporting base OTN or fg-OTN are discovered and active.
- Links connecting the nodes support Layer 1 Traffic Engineering (TE) configurations.

## 3. Trigger
- The provisioning system needs to map, verify, or route an ODU/fgODUflex connection across the transport network.

## 4. Main Success Scenario (Basic Flow)
1. The Network Provisioning Controller queries the Topology Service to retrieve the active OTN and fg-OTN topological graph.
2. The Topology Service retrieves the nodes and links augmenting standard RFC 8345 topology containers from the Inventory Database.
3. The Topology Service processes the `otn-node`, `otn-link`, and `otn-link-tp` parameters (including physical fiber `distance`, `tsg`, and `supported-client-signal` list).
4. The Topology Service evaluates the fine-grain timeslot resource mappings (`fgts-reserved` and `fgts-unreserved` lists) and unreserved `fgotn-bandwidth` on each link.
5. The Topology Service constructs and returns the multi-layer topological graph to the Network Provisioning Controller.

## 5. Alternate and Exception Flows
- **5a. Missing Fine-Grain Attributes:**
  1. The link does not support `fgODUflex` (e.g. standard OTN links).
  2. The system flags the link as standard OTN and hides the fine-grain bandwidth structures, mapping only base OTN tributary slot granularities.

## 6. Postconditions (Guarantees)
- **Success Guarantee:** The multi-layer topology graph containing verified node, link, and fg-OTN bandwidth parameters is exposed to path computation.
- **Failure Guarantee:** Empty or error states are logged, and the route computation engine is blocked from selecting unverified paths.

## 7. Operational Context
> The data models defined in this document are designed to represent physical and logical network elements in an Optical Transport Network. The model fully conforms to the Network Management Datastore Architecture (NMDA).

## 8. Realization Matrix

### Required User Stories
- [ ] #116 - [User Story 40: OTN Bandwidth Allocation](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-40-otn-bandwidth-allocation.md)

### Required Features
- [ ] #110 - [Feature 43: fg-OTN Network Topology and Bandwidth Allocation](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-43-fgotn-topology-bandwidth.md)
- [ ] #111 - [Feature 44: OTN Topology Node and Link Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-44-otn-topology-node-link.md)

## Source References
YANG Schema: [ietf-otn-topology.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-otn-topology.yang), [ietf-fgotn-topology.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-fgotn-topology.yang)
Normative Specification: [draft-ietf-ccamp-otn-topo-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-otn-topo-yang/)
