---
title: "User Story 3: Moving Object Velocity Telemetry (Issue #9)"
type: "user-story"
issue: 9
spec_source: "RFC 9179 Section 2.3"
---

# User Story: User Story 3: Moving Object Velocity Telemetry (Issue #9)

## Domain Object Mapping
- **Primary Domain Objects:** `geo-location`, `velocity`, `v-north`, `v-east`, `v-up`, `timestamp`
- **Actor/Role:** Vehicle Tracking Receiver

## BDD Scenario (OOA/OOD Realization)
**Given** a moving object changing position
**When** the 3D velocity vector (v-north, v-east, v-up) and timestamp are recorded
**Then** the tracking receiver computes current speed and heading to predict the next position coordinates.

## Operational Context
> If the object is in motion, the velocity vector describes this motion at the time given by the timestamp. For a formula to convert these values to speed and heading, see RFC 9179.

## Required Features Matrix
- [x] #4 - [Feature 4: Motion Velocity Vector](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-04-velocity-vector.md)
- [x] #5 - [Feature 5: Temporal Validity & Expiry](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-05-temporal-validity.md)

## Source References
YANG Schema: [ietf-geo-location.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-geo-location%402022-02-11.yang)
Normative Specification: [RFC 9179 Geographic Location](https://datatracker.ietf.org/doc/rfc9179/)
