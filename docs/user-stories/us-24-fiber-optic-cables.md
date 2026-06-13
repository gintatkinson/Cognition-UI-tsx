---
title: "User Story 24: Optical Fiber Cable Asset Ingestion (Issue #69)"
type: "user-story"
issue: 69
spec_source: "draft-ygb-ivy-passive-network-inventory Section 3"
---

# User Story: User Story 24: Optical Fiber Cable Asset Ingestion (Issue #69)

## Domain Object Mapping
- **Primary Domain Objects:** `cables`, `cable`, `optical-cable`, `fiber-core-num`, `fiber-type`, `attenuation`
- **Actor/Role:** Fiber Network Architect / Field Splicer

## BDD Scenario (OOA/OOD Realization)
**Given** a newly deployed optical backbone cable exists physically in the field
**When** the architect registers the cable in the network inventory system with G.652D fiber types and attenuation characteristics
**Then** the system validates the properties and successfully registers the new cable asset.

## Operational Context
> Accurate database records of physical cable lengths, core counts, and attenuation are required for estimating network optical loss budgets and validating active DWDM transceiver levels.

## Required Features Matrix
- [ ] #65 - [Feature 25: Passive Cable Inventory & Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-25-passive-cables.md)

## Source References
YANG Schema: [ietf-nwi-passive-inventory.yang](https://github.com/aguoietf/draft-ygb-ivy-passive-network-inventory/blob/main/yang/ietf-nwi-passive-inventory.yang)
Normative Specification: [draft-ygb-ivy-passive-network-inventory](https://datatracker.ietf.org/doc/draft-ygb-ivy-passive-network-inventory/)
