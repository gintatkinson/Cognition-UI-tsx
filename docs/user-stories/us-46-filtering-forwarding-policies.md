---
title: "User Story 46: Static and Dynamic Filtering Policies (Issue #146)"
epic: "Epic 16: IEEE 802.1Q Common Types (Issue #146)"
type: "user-story"
issue: 146
status: proposed
labels: ["user-story", "ieee802-dot1q-types"]
---

# User Story: User Story 46: Static and Dynamic Filtering Policies (Issue #146)

## Description
As a Network Security Administrator,
I want to configure static filtering entries in the bridge forwarding database (FDB),
So that unauthorized MAC addresses on specific VLANs are filtered/dropped at the port level.

## BDD Acceptance Criteria

- **Scenario: Configure static drop filtering entry**
  - **Given** port 1 has default FDB settings
  - **When** the administrator configures a static filtering entry for MAC address `AA-BB-CC-DD-EE-FF` on VLAN 20 with drop policy
  - **Then** all ingress frames from `AA-BB-CC-DD-EE-FF` on VLAN 20 are dropped at port 1.

## Normative Specification
- [IEEE Std 802.1Q-2014](../std/802.1Q-2014.pdf)
