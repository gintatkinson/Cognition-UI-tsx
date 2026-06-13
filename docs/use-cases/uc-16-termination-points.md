---
title: "Use Case 16: Configure and Layer Termination Points"
type: "use-case"
issue: 90
spec_source: "RFC 8345"
labels: ["use-case", "ietf-network-topology"]
epic: "Epic 9: Network Topology Model (Issue #80)"
---

# Use Case: Use Case 16: Configure and Layer Termination Points

**Epic:** [Epic 9: Network Topology Model (Issue #80)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-09-network-topology.md)

## OOA/OOD Realization
- **Primary Actor:** NOC Operations Engineer
- **Preconditions:** The nodes are populated in the network description.
- **Success Guarantee (Postconditions):** Termination points are successfully registered under their parent nodes and layered onto underlay supporting termination points.

## Main Success Scenario
1. The Actor specifies a parent node ID and lists its termination points.
2. For each termination point, the Actor specifies the `tp-id` and optional `supporting-termination-point` references (underlay network-ref, node-ref, and tp-ref).
3. The System validates that the `tp-id` is unique within the node.
4. The System verifies that the parent node exists in the network.
5. The System verifies that any supporting termination point reference points to an existing termination point in the specified underlay network.
6. The System registers the configured termination points and commits the state.

## Extensions
- **3a. Format validation failure:**
  - The `tp-id` is invalid or duplicate.
  - The System blocks the configuration and displays a specific validation error.
- **5a. Supporting termination point does not exist:**
  - The referenced underlay TP is not found.
  - The System aborts the transaction and returns a missing reference error.

## Required User Stories
- [ ] #89 - [User Story 31: Node Termination Point Configuration](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-31-termination-points.md)

## Source References
YANG Schema: [ietf-network-topology.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-network-topology%402018-02-26.yang)
Normative Specification: [RFC 8345](https://datatracker.ietf.org/doc/rfc8345/)
