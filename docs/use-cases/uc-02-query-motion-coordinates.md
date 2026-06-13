---
title: "Use Case 2: Query Motion Coordinates & Velocity Trajectory (Issue #13)"
type: "use-case"
issue: 13
spec_source: "RFC 9179 Section 2.3 & 2.4"
---

# Use Case: Use Case 2: Query Motion Coordinates & Velocity Trajectory (Issue #13)

## OOA/OOD Realization
- **Primary Actor:** Fleet Management System
- **Preconditions:** Moving vehicles are periodically registering their location and velocity vectors.
- **Success Guarantee (Postconditions):** The system returns the latest coordinate data along with heading and speed calculations.

## Main Success Scenario
1. The Actor requests tracking telemetry for a specific moving target.
2. The System retrieves the latest location, velocity vector (v-north, v-east, v-up), and recording timestamp.
3. The System computes the overall speed and heading from the velocity vector components.
4. The System formats the results and returns them to the Actor.

## Extensions
- **3a. Missing Velocity Components:**
  - The System detects that the velocity vector is incomplete (missing v-north, v-east, or v-up).
  - The System returns only the static location coordinates and flags the velocity as invalid.

## Required User Stories
- [x] #9 - [User Story 3: Moving Object Velocity Telemetry](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/user-stories/us-03-moving-object.md)

## Source References
YANG Schema: [ietf-geo-location.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-geo-location%402022-02-11.yang)
Normative Specification: [RFC 9179 Geographic Location](https://datatracker.ietf.org/doc/rfc9179/)
