---
title: "User Story 1: WGS-84 Earth Location Compatibility (Issue #7)"
type: "user-story"
issue: 7
spec_source: "RFC 9179 Section 2.1 & 2.2"
---

# User Story: User Story 1: WGS-84 Earth Location Compatibility (Issue #7)

## Domain Object Mapping
- **Primary Domain Objects:** `geo-location`, `reference-frame`, `astronomical-body`, `geodetic-datum`, `latitude`, `longitude`, `height`
- **Actor/Role:** Location Provider

## BDD Scenario (OOA/OOD Realization)
**Given** the astronomical body is "earth"
**When** the geodetic datum is omitted or explicitly set to "wgs-84"
**Then** coordinates are parsed as latitude and longitude in decimal degrees, and height in meters relative to the WGS-84 ellipsoid.

## Operational Context
> The default when the astronomical body is "earth" is "wgs-84", which is used by the Global Positioning System (GPS). The latitude and longitude values are represented in decimal degrees.

## Required Features Matrix
- [x] #1 - [Feature 1: Geographic Reference Frame](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-01-reference-frame.md)
- [x] #2 - [Feature 2: Ellipsoidal Location Coordinates](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-02-ellipsoid-location.md)

## Source References
YANG Schema: [ietf-geo-location.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-geo-location%402022-02-11.yang)
Normative Specification: [RFC 9179 Geographic Location](https://datatracker.ietf.org/doc/rfc9179/)
