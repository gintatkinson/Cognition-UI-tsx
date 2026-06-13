---
title: "User Story 38: Layer 1 Client Protocol Configuration (Issue #129)"
type: "user-story"
issue: 129
spec_source: "draft-ietf-ccamp-layer1-types Section 3.1"
---

# User Story: User Story 38: Layer 1 Client Protocol Configuration (Issue #129)

## Domain Object Mapping
- **Primary Domain Objects:** `protocol`, `client-signal`, `coding-func`, `optical-interface-func`
- **Actor/Role:** Network Provisioning Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** a physical client transceiver port is available
**When** the user configures the interface protocol as "Ethernet", the client signal as "ETH-10Gb-LAN", the coding function as "ETH-10GR", and the PMD function as "LR-PMD-10G"
**Then** the validation verifies that the selected line coding and physical transceiver options are compatible, and provisions the port interface.

## Operational Context
> Verify that the line rate and line coding match the physical capabilities of the transceiver PMD function.

## Required Features Matrix
- [ ] #125 - [Feature 37: Layer 1 Client Protocol and Coding Identities](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-37-layer1-client-protocol.md)
- [ ] #126 - [Feature 38: Layer 1 Optical Interface and PMD Functions](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-38-layer1-optical-pmd.md)

## Source References
YANG Schema: [ietf-layer1-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-layer1-types.yang)
Normative Specification: [draft-ietf-ccamp-layer1-types](https://datatracker.ietf.org/doc/draft-ietf-ccamp-layer1-types/)
