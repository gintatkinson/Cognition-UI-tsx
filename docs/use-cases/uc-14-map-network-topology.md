---
title: "Use Case 14: Map Network Topology Connectivity (Issue #78)"
type: "use-case"
issue: 78
spec_source: "RFC 8345 Section 3.1"
epic: "Epic 9: Network Topology Model (Issue #80)"
---

# Use Case: Use Case 14: Map Network Topology Connectivity (Issue #78)

**Epic:** [Epic 9: Network Topology Model (Issue #80)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-09-network-topology.md)


## OOA/OOD Realization
- **Primary Actor:** Network Operations Center (NOC) Operator / Automated Topology Collector
- **Preconditions:** The nodes and termination points are populated in the network description.
- **Success Guarantee (Postconditions):** Links and termination points are successfully validated, stored, and mapped to underlay topological links/TPs.

## Main Success Scenario
1. The Actor initiates the ingestion of links and termination points.
2. The System validates that the `link-id` is unique and follows the URI schema.
3. The System validates that the source node (`source-node`) and source TP (`source-tp`) exist.
4. The System validates that the destination node (`dest-node`) and destination TP (`dest-tp`) exist.
5. The System verifies that all declared `supporting-link` references exist in the respective supporting networks.
6. The System verifies that all declared `supporting-termination-point` references are valid.
7. The System commits the network topology model to the database.

## Extensions
- **3a. Source node or source TP does not exist:**
  - The System aborts the transaction and displays a validation error listing the missing source references.
- **4a. Destination node or destination TP does not exist:**
  - The System aborts the transaction and displays a validation error listing the missing destination references.

## Required User Stories
- [ ] #76 - [User Story 27: Network Link and TP Connectivity](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-27-network-link-tp-connectivity.md)

## Source References
YANG Schema: [ietf-network-topology.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-network-topology%402018-02-26.yang)
Normative Specification: [RFC 8345](https://datatracker.ietf.org/doc/rfc8345/)
