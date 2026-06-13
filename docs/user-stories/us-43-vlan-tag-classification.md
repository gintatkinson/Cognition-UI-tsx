---
title: "User Story 43: IEEE 802.1Q VLAN Tag Classification (Issue #143)"
epic: "Epic 16: IEEE 802.1Q Common Types (Issue #143)"
type: "user-story"
issue: 143
status: proposed
labels: ["user-story", "ieee802-dot1q-types"]
---

# User Story: User Story 43: IEEE 802.1Q VLAN Tag Classification (Issue #143)

## Description
As a Network Operator,
I want to configure VLAN tag classifiers on bridge ports,
So that incoming traffic can be correctly assigned to Customer or Service VLAN tags based on EtherType and VLAN IDs.

## BDD Acceptance Criteria

- **Scenario: Successfully assign C-VLAN tag classifier**
  - **Given** a bridge port has no active tag classifiers
  - **When** the operator provisions a classifier with `tag-type` set to `c-vlan` and `vlan-id` set to `100`
  - **Then** the configuration is validated, saved, and applied to match ingress Customer VLAN frames with tag EtherType `81-00` and ID 100.

## Normative Specification
- [IEEE Std 802.1Q-2014](../std/802.1Q-2014.pdf)
