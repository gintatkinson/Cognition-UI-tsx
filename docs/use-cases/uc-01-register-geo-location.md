---
title: "Use Case 1: Register Geographic Location (Issue #12)"
type: "use-case"
issue: 12
spec_source: "RFC 9179 Section 2.1, 2.2, 2.3"
---

# Use Case: Use Case 1: Register Geographic Location (Issue #12)

## OOA/OOD Realization
- **Primary Actor:** Location Provider
- **Preconditions:** The device possesses valid reference-frame details and coordinates.
- **Success Guarantee (Postconditions):** The location coordinate is validated and successfully stored in the location registry.

## Main Success Scenario
1. The Actor initiates location registration.
2. The System retrieves the configured reference-frame details (astronomical body, geodetic datum).
3. The Actor inputs location coordinates (latitude and longitude for ellipsoid, or X, Y, and Z for Cartesian).
4. The System validates the input coordinates against schema bounds and checks mutual exclusivity constraints.
5. The System saves the location registry entry.

## Extensions
- **3a. Missing Coordinate Component:**
  - The System identifies a missing required parameter (e.g., latitude or longitude).
  - The System rejects the entry and requests correction.
- **4a. Exceeding Precision Limit:**
  - The System detects coordinate values exceeding allowed decimal64 fraction digits.
  - The System rejects the entry or rounds according to configuration.

## Required User Stories
- [x] #7 - [User Story 1: WGS-84 Earth Location Compatibility](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/user-stories/us-01-earth-wgs84.md)
- [x] #8 - [User Story 2: Lunar Location](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/user-stories/us-02-lunar-location.md)
- [x] #10 - [User Story 4: Alternate System Reference Frame](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/user-stories/us-04-alternate-system.md)

## Source References
YANG Schema: [ietf-geo-location.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-geo-location%402022-02-11.yang)
Normative Specification: [RFC 9179 Geographic Location](https://datatracker.ietf.org/doc/rfc9179/)
