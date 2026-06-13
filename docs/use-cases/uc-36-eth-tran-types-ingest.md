---
title: "Use Case 36: Ingest and Validate Ethernet Transport Client Signal Types (Issue #209)"
type: "use-case"
issue: 209
spec_source: "draft-ietf-ccamp-client-signal-yang"
---

# Use Case 36: Ingest and Validate Ethernet Transport Client Signal Types (Issue #209)

## 1. Actors
- **Primary Actor**: NMS / SDN Controller
- **Secondary Actors**: Client Interface Inventory DB

## 2. Preconditions
- The network management agent is operational and configured with the `ietf-eth-tran-types` common types.
- Client ports support dynamic VLAN classification and rate limiting.

## 3. Trigger
- An operator creates or modifies a customer service mapping on a client edge port.

## 4. Main Success Scenario (Basic Flow)
1. The SDN Controller receives a client interface configuration containing VLAN classification and bandwidth profiles.
2. The controller validates that the VLAN IDs and range string match valid patterns.
3. The controller verifies that the bandwidth profile parameters (CIR, CBS) comply with physical hardware capabilities.
4. The controller registers the interface under the specified access role (e.g. `root-primary` or `leaf-access`).
5. The state is updated to `installed`.

## 5. Alternate and Exception Flows
- **5a. Invalid VLAN Range Formats**:
  - 1. The controller detects an invalid format in `vid-range-type` (e.g. non-numeric characters outside of range markers).
  - 2. The configuration update is rejected and logged.
  - 3. The flow terminates.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The client interface parameters are validated and successfully provisioned.
- **Failure Guarantee**: Invalid parameters are rejected, leaving the interface in its previous valid state.

## 7. Operational Context
> Processing common Ethernet client types guarantees consistent attribute representation across all customer access layers.

## 8. Realization Matrix

### Required User Stories
- [ ] #208 - [User Story 62: Manage Ethernet Transport Client Signal Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-62-eth-tran-types.md)

### Required Features
- [ ] #205 - [Feature 70: Ethernet Transport Client VLAN and Service Classification Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-70-eth-tran-types-vlan.md)
- [ ] #206 - [Feature 71: Ethernet Transport Bandwidth Profiles and Service Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-71-eth-tran-types-bwp.md)
- [ ] #207 - [Feature 72: Ethernet Transport Operational and Topology Roles](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-72-eth-tran-types-roles.md)

## Source References
YANG Schema: [ietf-eth-tran-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-eth-tran-types.yang)
Normative Specification: [draft-ietf-ccamp-client-signal-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-client-signal-yang/)
