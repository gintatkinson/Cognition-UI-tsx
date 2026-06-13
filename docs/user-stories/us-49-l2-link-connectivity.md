---
title: "User Story 49: Layer 2 Link Connectivity and Performance Tuning (Issue #155)"
epic: "Epic 17: IETF Layer 2 Network Topologies (Issue #159)"
type: "user-story"
issue: 155
status: proposed
labels: ["user-story", "ietf-l2-topology"]
---

# User Story: User Story 49: Layer 2 Link Connectivity and Performance Tuning (Issue #155)

## Description
As a Network Operator,
I want to configure and monitor Layer 2 link rates, propagation delays, and duplex modes,
So that I can optimize transmission rates and prevent duplex mismatches across bridging segments.

## BDD Acceptance Criteria

- **Scenario: Prevent duplex mismatches on links with manual configuration**
  - **Given** a Layer 2 link has its auto-negotiation parameter set to `false`
  - **When** the local interface duplex is set to `full` and the remote interface duplex is set to `half`
  - **Then** the network management system detects the duplex configuration mismatch and raises a mismatch warning.

## Required Features Matrix
- [ ] #152 - [Feature 52: IETF Layer 2 Link Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-52-l2-topology-links.md)

## Normative Specification
- [RFC 8944](https://datatracker.ietf.org/doc/rfc8944/)
