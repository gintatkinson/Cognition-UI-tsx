---
title: "User Story 45: Spanning Tree Instance Mapping (Issue #145)"
epic: "Epic 16: IEEE 802.1Q Common Types (Issue #145)"
type: "user-story"
issue: 145
status: proposed
labels: ["user-story", "ieee802-dot1q-types"]
---

# User Story: User Story 45: Spanning Tree Instance Mapping (Issue #145)

## Description
As a Network Architect,
I want to map multiple VLANs to a Spanning Tree instance (MSTID),
So that I can optimize loop prevention topology based on VLAN groupings.

## BDD Acceptance Criteria

- **Scenario: Configure VLAN to MSTID mapping**
  - **Given** MSTID 2 is inactive
  - **When** the architect associates VLAN range `10-20,50` with MSTID 2
  - **Then** the association is validated and Spanning Tree protocols apply the topology of MSTID 2 to those VLANs.

## Normative Specification
- [IEEE Std 802.1Q-2014](../std/802.1Q-2014.pdf)
