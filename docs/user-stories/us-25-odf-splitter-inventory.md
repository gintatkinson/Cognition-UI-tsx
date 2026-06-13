---
title: "User Story 25: Passive ODF and Splitter Inventory Registry (Issue #70)"
type: "user-story"
issue: 70
spec_source: "draft-ygb-ivy-passive-network-inventory Section 3"
---

# User Story: User Story 25: Passive ODF and Splitter Inventory Registry (Issue #70)

## Domain Object Mapping
- **Primary Domain Objects:** `passive-device`, `passive-port`, `port-type`, `custom-tags`, `location-ref`
- **Actor/Role:** Datacenter Field Technician / Operations Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** a new Optical Distribution Frame (ODF) patch panel mounted in cabinet rack 4A
**When** the technician scans its RFID tag and registers its inputs, outputs, and location reference in the database
**Then** the system registers the passive device and maps its ports to the geographic cabinet coordinates.

## Operational Context
> Tracking physical locations and patch panel ports of passive splitters and frames prevents technicians from connecting fibers to the wrong ports and enables quick maintenance of fiber links.

## Required Features Matrix
- [ ] #67 - [Feature 27: Passive Device Management & Ports](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-27-passive-devices-ports.md)

## Source References
YANG Schema: [ietf-nwi-passive-inventory.yang](https://github.com/aguoietf/draft-ygb-ivy-passive-network-inventory/blob/main/yang/ietf-nwi-passive-inventory.yang)
Normative Specification: [draft-ygb-ivy-passive-network-inventory](https://datatracker.ietf.org/doc/draft-ygb-ivy-passive-network-inventory/)
