---
title: "Use Case 10: Query Port Breakout Channels (Issue #64)"
type: "use-case"
issue: 64
spec_source: "draft-ietf-ivy-network-inventory-topology Section 3"
---

# Use Case: Use Case 10: Query Port Breakout Channels (Issue #64)

## OOA/OOD Realization
- **Primary Actor:** Client Interface Provisioning System / Field Engineer
- **Preconditions:** Port breakout capability is supported by the physical interface component.
- **Success Guarantee (Postconditions):** The list of active breakout channels and sub-port lanes is retrieved.

## Main Success Scenario
1. The Actor queries a termination point for physical breakout channels.
2. The System checks if the `port-breakout` presence container is active.
3. The System reads the `breakout-channel` list.
4. The System returns the channel IDs representing independent lane sub-interfaces.

## Extensions
- **2a. Port does not support breakout:**
  - The System returns an empty response (or indicates that the presence container is absent).

## Required User Stories
- [x] #62 - [User Story 23: Topology Mapping of Port Breakouts](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-23-port-breakout-topology.md)

## Source References
YANG Schema: [ietf-network-inventory-topology.yang](https://github.com/ietf-ivy-wg/network-inventory-topology/blob/main/yang/ietf-network-inventory-topology.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-topology](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-topology)
