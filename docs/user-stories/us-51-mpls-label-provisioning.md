---
title: "User Story 51: IETF Routing MPLS Label Provisioning (Issue #163)"
epic: "Epic 18: IETF Routing Common YANG Data Types (Issue #168)"
type: "user-story"
issue: 163
status: proposed
labels: ["user-story", "ietf-routing-types"]
---

# User Story: User Story 51: IETF Routing MPLS Label Provisioning (Issue #163)

## Description
As a Network Provisioning Engineer,
I want to configure MPLS labels and label stacks on router interfaces using standard special-purpose and general-use representations,
So that I can establish label-switched paths (LSPs) across the MPLS network.

## BDD Acceptance Criteria

- **Scenario: Successfully provision general-use and special-purpose label stack entries**
  - **Given** an interface ready for MPLS label stack provisioning
  - **When** the engineer configures a label stack with a general-use label `2000` (TTL `64`, TC `0`) and a special-purpose label `implicit-null-label`
  - **Then** the controller validates the inputs and successfully provisions the MPLS label stack on the router.

## Required Features Matrix
- [ ] #160 - [Feature 54: IETF Routing Type Identities and MPLS Labels](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-54-routing-types-mpls.md)

## Normative Specification
- [RFC 8294](https://datatracker.ietf.org/doc/rfc8294/)
