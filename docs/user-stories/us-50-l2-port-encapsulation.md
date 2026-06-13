---
title: "User Story 50: Layer 2 Interface Encapsulation and Logical Partitioning (Issue #156)"
epic: "Epic 17: IETF Layer 2 Network Topologies (Issue #159)"
type: "user-story"
issue: 156
status: proposed
labels: ["user-story", "ietf-l2-topology"]
---

# User Story: User Story 50: Layer 2 Interface Encapsulation and Logical Partitioning (Issue #156)

## Description
As a Network Operator,
I want to configure Ethernet port encapsulation (such as VLAN, QinQ, and VXLAN) and associate interfaces with Link Aggregation Groups (LAGs),
So that I can segment virtual networks and overlay traffic while increasing transmission reliability.

## BDD Acceptance Criteria

- **Scenario: Configure VXLAN overlay encapsulation and VNI**
  - **Given** a termination point has its encapsulation type configured to `vxlan`
  - **When** the operator provisions a VXLAN Network Identifier (VNI) `1000`
  - **Then** the configuration validates successfully, registers the VNI, and provisions the VXLAN encapsulation.

## Required Features Matrix
- [ ] #153 - [Feature 53: IETF Layer 2 Termination Point Encapsulation and Virtualization](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-53-l2-topology-ports.md)

## Normative Specification
- [RFC 8944](https://datatracker.ietf.org/doc/rfc8944/)
