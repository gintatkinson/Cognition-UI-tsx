---
title: "User Story 12: Location Physical Addresses (Issue #37)"
type: "user-story"
issue: 37
spec_source: "draft-ietf-ivy-network-inventory-location Section 3"
---

# User Story: User Story 12: Location Physical Addresses (Issue #37)

## Domain Object Mapping
- **Primary Domain Objects:** `physical-address`, `address`, `postal-code`, `state`, `city`, `country-code`
- **Actor/Role:** Procurement Manager / Field Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** the procurement manager is registering new equipment sites
**When** physical address details are input
**Then** the country code is checked against the ISO ALPHA-2 format to ensure valid geographic registration.

## Operational Context
> Locations can contain descriptive postal address attributes to locate sites on maps and manage logistics/shipping.

## Required Features Matrix
- [x] #30 - [Feature 12: Location Physical Addresses](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-12-physical-addresses.md)

## Source References
YANG Schema: [ietf-ni-location.yang](https://github.com/ietf-ivy-wg/network-inventory-location/blob/main/ietf-ni-location.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-location](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-location)
