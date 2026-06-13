---
title: "User Story 27: Network Link and TP Connectivity (Issue #76)"
type: "user-story"
issue: 76
spec_source: "RFC 8345 Section 3.1"
epic: "Epic 9: Network Topology Model (Issue #80)"
---

# User Story: User Story 27: Network Link and TP Connectivity (Issue #76)

**Epic:** [Epic 9: Network Topology Model (Issue #80)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-09-network-topology.md)


## Domain Object Mapping
- **Primary Domain Objects:** `link`, `termination-point`, `source`, `destination`, `supporting-link`, `supporting-termination-point`
- **Actor/Role:** Network Architect / NOC Operations Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** a physical topology with physical nodes "phy-node-A" and "phy-node-B" connected by physical link "phy-link-1" between ports "eth0" and "eth0"
**When** the network architect establishes a logical link "log-link-1" between nodes "ip-node-A" (port "ge-0/0/0") and "ip-node-B" (port "ge-0/0/1") and maps them to their physical supporting counterparts
**Then** the system validates that the logical endpoints terminate at active termination points and verifies their underlay routing relationships.

## Operational Context
> A link is defined by a source and a destination. A network can contain links. In addition, a node can contain termination points, which are sources or destinations of links. Links can be supported by other underlay links, and termination points can be supported by other underlay termination points.

## Required Features Matrix
- [ ] #74 - [Feature 29: Network Topology Model](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-29-network-topology-model.md)

## Source References
YANG Schema: [ietf-network-topology.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-network-topology%402018-02-26.yang)
Normative Specification: [RFC 8345](https://datatracker.ietf.org/doc/rfc8345/)
