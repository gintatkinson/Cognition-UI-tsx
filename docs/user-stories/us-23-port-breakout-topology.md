---
title: "User Story 23: Topology Mapping of Port Breakouts (Issue #62)"
type: "user-story"
issue: 62
spec_source: "draft-ietf-ivy-network-inventory-topology Section 3"
---

# User Story: User Story 23: Topology Mapping of Port Breakouts (Issue #62)

## Domain Object Mapping
- **Primary Domain Objects:** `port-breakout`, `breakout-channel`, `channel-id`
- **Actor/Role:** Transmission Engineer / Network Provisioning Automation

## BDD Scenario (OOA/OOD Realization)
**Given** the transmission engineer is channelizing a high-speed 400G physical interface into independent 100G logical termination points
**When** configuring the port breakout capability list and assigning lane channel IDs
**Then** the system registers the channelized sub-interfaces enabling them to be mapped individually to logical client circuits.

## Operational Context
> Network nodes partition high-speed optical ports into breakout channels (e.g. 4x100G). Tracking breakout channels allows logical topologies to map to sub-port lanes.

## Required Features Matrix
- [x] #59 - [Feature 24: Port Breakout & Channelization Capabilities](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-24-port-breakout-channels.md)

## Source References
YANG Schema: [ietf-network-inventory-topology.yang](https://github.com/ietf-ivy-wg/network-inventory-topology/blob/main/yang/ietf-network-inventory-topology.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-topology](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-topology)
