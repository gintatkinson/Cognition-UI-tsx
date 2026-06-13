---
title: "Use Case 19: Provision Fine-Grain ODUflex Client Signal (Issue #134)"
type: "use-case"
issue: 134
spec_source: "draft-tan-ccamp-fgotn-yang"
---

# Use Case 19: Provision Fine-Grain ODUflex Client Signal (Issue #134)

## 1. Actors
- **Primary Actor**: Network Provisioning Controller
- **Secondary Actors**: Network Element Agent, Topology Service

## 2. Preconditions
- The optical nodes and port interfaces supporting fgOTN are discovered and active in the topology database.
- The target client signal interface is in an unconfigured state.

## 3. Trigger
The provisioning system receives a request to route and establish a 40 Mbps (4 fine-grain slots) sub-1G client service between two nodes.

## 4. Main Success Scenario (Basic Flow)
1. The Network Provisioning Controller queries the Topology Service to locate supporting fgOTN nodes.
2. The Network Provisioning Controller calculates a route supporting the `fgODUflex` container.
3. The Network Provisioning Controller sends a configure request setting ODU type to `fgODUflex` and allocating 4 slots (40 Mbps) on the ingress port.
4. The Network Element Agent allocates 4 fine-grain tributary slots, establishes the cross-connect, and reports status.
5. The Network Provisioning Controller verifies end-to-end connectivity and registers the new fgODUflex service in the database.

## 5. Alternate and Exception Flows
- **5a. Insufficient tributary slots**:
  1. The Network Element Agent detects that only 2 slots are available on the physical interface.
  2. The Network Element Agent returns a configuration failure: "Insufficient slots for fgODUflex allocation".
  3. The Network Provisioning Controller rolls back the reservation and releases reserved resources.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The client service is mapped to `fgODUflex` with 4 slots and traffic flows successfully.
- **Failure Guarantee**: Configuration is rolled back, the interface state remains unmodified, and the failure is logged.

## 7. Operational Context
> The YANG data models defined in this document are designed to meet the requirements for efficient transmission of sub-1Gbit/s client signals in transport network.

## 8. Realization Matrix

### Required User Stories
- [ ] #133 - [User Story 39: Fine-Grain ODUflex Protocol Integration](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-39-fgotn-oduflex-integration.md)

### Required Features
- [ ] #132 - [Feature 41: Fine-Grain ODUflex Type Definition](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-41-fgotn-oduflex-identity.md)

## Source References
YANG Schema: [ietf-fgotn-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-fgotn-types.yang)  
Normative Specification: [draft-tan-ccamp-fgotn-yang](https://datatracker.ietf.org/doc/draft-tan-ccamp-fgotn-yang/)
