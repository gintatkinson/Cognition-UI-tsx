---
title: "User Story 4: Alternate System Reference Frame (Issue #10)"
type: "user-story"
issue: 10
spec_source: "RFC 9179 Section 2.1"
---

# User Story: User Story 4: Alternate System Reference Frame (Issue #10)

## Domain Object Mapping
- **Primary Domain Objects:** `geo-location`, `reference-frame`, `alternate-system`, `astronomical-body`, `geodetic-datum`
- **Actor/Role:** Simulation Engine

## BDD Scenario (OOA/OOD Realization)
**Given** the alternate-systems feature is enabled on the device
**When** the alternate-system field is populated with a virtual reality or alternate coordinate system name (e.g. "mars-sim-v1")
**Then** the astronomical body and datum are interpreted relative to that system instead of the standard physical IAU definitions.

## Operational Context
> Normally, this value is not present and the system is the natural universe; however, when present, this value allows for specifying alternate systems (e.g., virtual realities).

## Required Features Matrix
- [x] #1 - [Feature 1: Geographic Reference Frame](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-01-reference-frame.md)

## Source References
YANG Schema: [ietf-geo-location.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-geo-location%402022-02-11.yang)
Normative Specification: [RFC 9179 Geographic Location](https://datatracker.ietf.org/doc/rfc9179/)
