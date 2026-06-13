---
title: "User Story 52: IETF Routing VPN Parameter Mapping (Issue #164)"
epic: "Epic 18: IETF Routing Common YANG Data Types (Issue #168)"
type: "user-story"
issue: 164
status: proposed
labels: ["user-story", "ietf-routing-types"]
---

# User Story: User Story 52: IETF Routing VPN Parameter Mapping (Issue #164)

## Description
As a Network Administrator,
I want to configure Route Distinguishers and Route Target import/export filtering rules on VPN instances,
So that routing information is correctly segregated and exchanged across different Virtual Routing and Forwarding (VRF) tables.

## BDD Acceptance Criteria

- **Scenario: Successfully assign Route Targets and Route Distinguishers to a VRF**
  - **Given** a new VPN VRF instance `VRF-A`
  - **When** the administrator configures Route Distinguisher `65000:10` and Route Target import/export rule both as `65000:100`
  - **Then** the VRF instance is successfully updated and routes are filtered matching the configured communities.

## Required Features Matrix
- [ ] #161 - [Feature 55: IETF Routing VPN Route Targets and Distinguishers](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-55-routing-types-vpn.md)

## Normative Specification
- [RFC 8294](https://datatracker.ietf.org/doc/rfc8294/)
