---
title: "User Story 9: Time Durations (Issue #26)"
type: "user-story"
issue: 26
spec_source: "RFC 9911 Section 5"
---

# User Story: User Story 9: Time Durations (Issue #26)

## Domain Object Mapping
- **Primary Domain Objects:** `hours32`, `minutes32`, `seconds32`, `centiseconds32`, `milliseconds32`, `microseconds32`, `microseconds64`, `nanoseconds32`, `nanoseconds64`, `timeticks`, `timestamp`
- **Actor/Role:** Duration Calculator

## BDD Scenario (OOA/OOD Realization)
**Given** a time interval duration or event timetick is being calculated
**When** the duration value is entered or the timeticks wrap occurs
**Then** the calculator validates the bounds of the specific duration unit type and resets associated timestamp markers to 0 if a timeticks wrap happens.

## Operational Context
> Durations support time period representations ranging from hours down to nanoseconds. Timeticks track intervals modulo 2^32 in centiseconds, and associated timestamps mark specific epochs relative to timeticks.

## Required Features Matrix
- [x] #20 - [Feature 9: Time Durations](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/epic-2-common-types/docs/features/feat-09-time-durations.md)

## Source References
YANG Schema: [ietf-yang-types.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-yang-types%402025-12-22.yang)
Normative Specification: [RFC 9911 Common YANG Data Types](https://datatracker.ietf.org/doc/rfc9911/)
