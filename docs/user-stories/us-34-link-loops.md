---
title: "User Story 34: Auditing Link Loop Recursions and Integrity"
type: "user-story"
issue: 93
spec_source: "RFC 8345 Section 3.1"
labels: ["user-story", "ietf-network-topology"]
epic: "Epic 9: Network Topology Model (Issue #80)"
---

# User Story: User Story 34: Auditing Link Loop Recursions and Integrity

**Epic:** [Epic 9: Network Topology Model (Issue #80)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-09-network-topology.md)

## Domain Object Mapping
- **Primary Domain Objects:** `supporting-link`, `link-id`
- **Actor/Role:** Design Auditor / Network Integrity Validation Agent

## BDD Scenario (OOA/OOD Realization)
**Given** a hierarchy of supporting links across overlay and underlay networks
**When** a configuration change or mapping is proposed
**Then** the validation agent audits the dependency chain and rejects any configuration where a link transitively or directly depends on itself (reference loops), throwing an integrity exception.

## Operational Context
> Reference loops in which a link identifies itself as its underlay, either directly or transitively, are not allowed.

## Required Features Matrix
- [ ] #74 - [Feature 29: Network Topology Model](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-29-network-topology-model.md)

## Source References
YANG Schema: [ietf-network-topology.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-network-topology%402018-02-26.yang)
Normative Specification: [RFC 8345](https://datatracker.ietf.org/doc/rfc8345/)
