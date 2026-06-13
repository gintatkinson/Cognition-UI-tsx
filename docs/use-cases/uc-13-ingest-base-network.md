---
title: "Use Case 13: Ingest Base Network Topology (Issue #77)"
type: "use-case"
issue: 77
spec_source: "RFC 8345 Section 3"
---

# Use Case: Use Case 13: Ingest Base Network Topology (Issue #77)

## OOA/OOD Realization
- **Primary Actor:** Network Operations Center (NOC) Operator / Automated Topology Collector
- **Preconditions:** The underlay networks are already populated in the inventory.
- **Success Guarantee (Postconditions):** The new network container and its constituent nodes are successfully stored and linked to their supporting underlay elements.

## Main Success Scenario
1. The Actor initiates the ingestion of a network topology description.
2. The System validates that the `network-id` is unique and follows the URI schema.
3. The System verifies that all declared `supporting-network` references exist in the database.
4. The System imports the inventory of nodes, validating the uniqueness of each `node-id` within the network.
5. The System verifies that all declared `supporting-node` references are valid nodes inside the respective supporting networks.
6. The System commits the network model to the datastore.

## Extensions
- **3a. Referenced supporting-network does not exist:**
  - The System aborts the transaction and displays a validation error listing the missing network references.
- **5a. Referenced supporting-node does not exist:**
  - The System aborts the transaction and displays a validation error listing the missing node references.

## Required User Stories
- [ ] #75 - [User Story 26: Multi-Layer Network Mapping](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-26-multi-layer-network-topology.md)

## Source References
YANG Schema: [ietf-network.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-network%402018-02-26.yang)
Normative Specification: [RFC 8345](https://datatracker.ietf.org/doc/rfc8345/)
