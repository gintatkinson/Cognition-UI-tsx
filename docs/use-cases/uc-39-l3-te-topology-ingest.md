---
title: "Use Case 39: Ingest and Validate Layer 3 TE Topologies (Issue #229)"
type: "use-case"
issue: 229
spec_source: "draft-ietf-teas-yang-l3-te-topo-18"
---

# Use Case 39: Ingest and Validate Layer 3 TE Topologies (Issue #229)

## 1. Actors
- **Primary Actor**: Network Topology Engine
- **Secondary Actors**: SDN Controller, Topology DB

## 2. Preconditions
- The network management agent is operational and configured with the `ietf-l3-te-topology` schema.
- The base Layer 3 network topology database has been initialized.

## 3. Trigger
- The system discovers a new Layer 3 TE node or link.

## 4. Main Success Scenario (Basic Flow)
1. The Network Topology Engine receives topology attributes including node/link correlation mappings to base TE topologies.
2. The engine validates that the referenced TE topology exists.
3. The engine verifies the L3 node mapping to TE node reference.
4. The engine records termination point and link mappings.
5. The engine updates the integrated L3 TE network model.

## 5. Alternate and Exception Flows
- **5a. Referenced TE Topology Not Found**:
  - 1. The engine detects that the base TE topology referenced via `network-ref` is not found in the DB.
  - 2. The topology update is rejected, and an alert is logged.
  - 3. The flow terminates.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The discovered Layer 3 TE link/node attributes are successfully integrated into the active network topology map.
- **Failure Guarantee**: Invalid updates are discarded, preserving the previous stable topology representation.

## 7. Operational Context
> Processing Layer 3 TE topology updates ensures accurate IP-layer and traffic engineered correlations are maintained.

## 8. Realization Matrix

### Required User Stories
- [ ] #228 - [User Story 65: Discover and Manage Layer 3 TE Topologies](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-65-l3-te-topology.md)

### Required Features
- [ ] #226 - [Feature 82: Layer 3 TE Topology and Node Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-82-l3-te-topology-nodes.md)
- [ ] #227 - [Feature 83: Layer 3 TE Topology Links and Termination Points](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-83-l3-te-topology-links.md)

## Source References
YANG Schema: [ietf-l3-te-topology.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-l3-te-topology.yang)
Normative Specification: [draft-ietf-teas-yang-l3-te-topo-18](https://www.ietf.org/archive/id/draft-ietf-teas-yang-l3-te-topo-18.txt)
