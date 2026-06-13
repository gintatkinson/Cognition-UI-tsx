---
title: "User Story 33: Mapping Layered Network Links to Underlays"
type: "user-story"
issue: 92
spec_source: "RFC 8345 Section 3.1"
labels: ["user-story", "ietf-network-topology"]
epic: "Epic 9: Network Topology Model (Issue #80)"
---

# User Story: User Story 33: Mapping Layered Network Links to Underlays

**Epic:** [Epic 9: Network Topology Model (Issue #80)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-09-network-topology.md)

## Domain Object Mapping
- **Primary Domain Objects:** `supporting-link`, `network-ref`, `link-ref`
- **Actor/Role:** Network Architect

## BDD Scenario (OOA/OOD Realization)
**Given** an overlay link "logical-link-1" in network "overlay-net" and an underlay link "physical-link-1" in network "underlay-net"
**When** the network architect configures a supporting-link mapping on "logical-link-1" pointing to "physical-link-1" in "underlay-net"
**Then** the system validates that "underlay-net" is listed as a supporting network of "overlay-net", verifies the target link existence, and creates the dependency mapping.

## Operational Context
> Identifies the link or links on which this link depends. Supporting links establish multi-layer network mappings by binding logical paths to their physical underlay structures.

## Required Features Matrix
- [ ] #74 - [Feature 29: Network Topology Model](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-29-network-topology-model.md)

## Source References
YANG Schema: [ietf-network-topology.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-network-topology%402018-02-26.yang)
Normative Specification: [RFC 8345](https://datatracker.ietf.org/doc/rfc8345/)
