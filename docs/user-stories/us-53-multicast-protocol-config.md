---
title: "User Story 53: IETF Routing Common Multicast and Protocol Configuration (Issue #165)"
epic: "Epic 18: IETF Routing Common YANG Data Types (Issue #168)"
type: "user-story"
issue: 165
status: proposed
labels: ["user-story", "ietf-routing-types"]
---

# User Story: User Story 53: IETF Routing Common Multicast and Protocol Configuration (Issue #165)

## Description
As a Network Protocol Administrator,
I want to define protocol timers, interface bandwidth metrics, and multicast group memberships using standard YANG common types,
So that I can optimize routing convergence and multicast routing distributions.

## BDD Acceptance Criteria

- **Scenario: Configure protocol timers and interface bandwidth**
  - **Given** an OSPF or BGP interface configuration block
  - **When** the administrator configures a `timer-value-seconds16` of `10` seconds, a link access type of `broadcast`, and a `bandwidth-ieee-float32` of `0x1.abcde2p+20`
  - **Then** the interface parameters are successfully parsed, validated, and updated on the node.

## Required Features Matrix
- [ ] #162 - [Feature 56: IETF Routing Multicast and Protocol Common Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-56-routing-types-common.md)

## Normative Specification
- [RFC 8294](https://datatracker.ietf.org/doc/rfc8294/)
