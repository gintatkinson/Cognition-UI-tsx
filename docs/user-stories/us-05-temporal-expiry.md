---
title: "User Story 5: Temporal Validity Expiry Check (Issue #11)"
type: "user-story"
issue: 11
spec_source: "RFC 9179 Section 2.5"
---

# User Story: User Story 5: Temporal Validity Expiry Check (Issue #11)

## Domain Object Mapping
- **Primary Domain Objects:** `geo-location`, `timestamp`, `valid-until`
- **Actor/Role:** Location Registry Manager

## BDD Scenario (OOA/OOD Realization)
**Given** a geo-location record is configured with a valid-until timestamp
**When** the current system time is evaluated
**Then** the registry manager flags the location coordinate as expired if the current time exceeds valid-until.

## Operational Context
> The valid-until leaf is the timestamp for which this geo-location is valid until. If unspecified, the geo-location has no specific expiration time.

## Required Features Matrix
- [x] #5 - [Feature 5: Temporal Validity & Expiry](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-05-temporal-validity.md)

## Source References
YANG Schema: [ietf-geo-location.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-geo-location%402022-02-11.yang)
Normative Specification: [RFC 9179 Geographic Location](https://datatracker.ietf.org/doc/rfc9179/)
