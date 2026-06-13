---
title: "User Story 2: Lunar Location (Issue #8)"
type: "user-story"
issue: 8
spec_source: "RFC 9179 Section 2.1"
---

# User Story: User Story 2: Lunar Location (Issue #8)

## Domain Object Mapping
- **Primary Domain Objects:** `geo-location`, `reference-frame`, `astronomical-body`, `geodetic-datum`, `latitude`, `longitude`, `height`
- **Actor/Role:** Lunar Lander Telemetry System

## BDD Scenario (OOA/OOD Realization)
**Given** the astronomical body is "moon"
**When** the geodetic datum is set to "mean-earth-me" or other IAU-approved Moon datums
**Then** the system validates coordinates according to lunar ellipsoid bounds and units.

## Operational Context
> Examples of astronomical bodies include 'sun' (our star), 'earth' (our planet), 'moon' (our moon)... Any preceding 'the' in the name SHOULD NOT be included.

## Required Features Matrix
- [x] #1 - [Feature 1: Geographic Reference Frame](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-01-reference-frame.md)
- [x] #2 - [Feature 2: Ellipsoidal Location Coordinates](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-02-ellipsoid-location.md)

## Source References
YANG Schema: [ietf-geo-location.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-geo-location%402022-02-11.yang)
Normative Specification: [RFC 9179 Geographic Location](https://datatracker.ietf.org/doc/rfc9179/)
