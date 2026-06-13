---
title: "User Story 55: Layer 3 Route Prefix and Endpoint Configuration (Issue #172)"
epic: "Epic 19: IETF Layer 3 Unicast Network Topologies (Issue #175)"
type: "user-story"
issue: 172
status: proposed
labels: ["user-story", "ietf-l3-topology"]
---

# User Story: User Story 55: Layer 3 Route Prefix and Endpoint Configuration (Issue #172)

## Description
As a Network Provisioning Engineer,
I want to configure Layer 3 link metrics, IP addresses, and unnumbered interfaces on network termination points,
So that I can establish logical connections and control traffic forwarding parameters across routing domains.

## BDD Acceptance Criteria

- **Scenario: Configure unnumbered interface and link metrics**
  - **Given** a network topology link ready for configuration
  - **When** the engineer configures the link with metric `100` and assigns an unnumbered termination point ID `1024`
  - **Then** the configuration is validated, accepted, and applied to the routing interface.

- **Scenario: Configure IP-addressed termination points**
  - **Given** a termination point on a Layer 3 node
  - **When** the engineer configures the termination point with the IP address list containing `192.0.2.10`
  - **Then** the system registers the IP-addressed endpoint for routing adjacency checks.

## Required Features Matrix
- [ ] #170 - [Feature 58: IETF Layer 3 Unicast Links and Termination Points](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-58-l3-topology-links.md)

## Normative Specification
- [RFC 8346](https://datatracker.ietf.org/doc/rfc8346/)
