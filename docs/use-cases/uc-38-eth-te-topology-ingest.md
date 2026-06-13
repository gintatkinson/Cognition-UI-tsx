---
title: "Use Case 38: Ingest and Validate Ethernet TE Topologies (Issue #224)"
type: "use-case"
issue: 224
spec_source: "draft-ietf-ccamp-eth-client-te-topo-yang"
---

# Use Case 38: Ingest and Validate Ethernet TE Topologies (Issue #224)

## 1. Actors
- **Primary Actor**: Network Topology Engine
- **Secondary Actors**: SDN Controller, Topology DB

## 2. Preconditions
- The network management agent is operational and configured with the `ietf-eth-te-topology` schema.
- The base network TE topology database has been initialized.

## 3. Trigger
- The system discovers a new Ethernet TE node or link.

## 4. Main Success Scenario (Basic Flow)
1. The Network Topology Engine receives topology attributes including node MAC, interface MTU, and VLAN capabilities.
2. The engine validates that the MAC address is structurally correct.
3. The engine verifies the advertised VLAN range constraints.
4. The engine records supported push/pop tagging capabilities.
5. The engine stores bandwidth profiles for path calculation algorithms.

## 5. Alternate and Exception Flows
- **5a. Attribute Range Violation**:
  - 1. The engine detects that the advertised default `port-vlan-id` lies outside the valid range 1..4094.
  - 2. The topology update is rejected, and an alert is logged.
  - 3. The flow terminates.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The discovered Ethernet TE link/node attributes are successfully integrated into the active network topology map.
- **Failure Guarantee**: Invalid updates are discarded, preserving the previous stable topology representation.

## 7. Operational Context
> Processing Ethernet TE topology updates ensures accurate parameters are advertised for traffic engineered path setup.

## 8. Realization Matrix

### Required User Stories
- [ ] #223 - [User Story 64: Discover and Manage Ethernet TE Topologies](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-64-eth-te-topology.md)

### Required Features
- [ ] #219 - [Feature 78: Ethernet TE Topology Core](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-78-eth-te-topology-core.md)
- [ ] #220 - [Feature 79: Ethernet TE Topology VLAN Classification](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-79-eth-te-topology-vlan.md)
- [ ] #221 - [Feature 80: Ethernet TE Topology VLAN Tag Operations](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-80-eth-te-topology-tag.md)
- [ ] #222 - [Feature 81: Ethernet TE Topology Bandwidth Profiles](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-81-eth-te-topology-bwp.md)

## Source References
YANG Schema: [ietf-eth-te-topology.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-eth-te-topology.yang)
Normative Specification: [draft-ietf-ccamp-eth-client-te-topo-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-eth-client-te-topo-yang/)
