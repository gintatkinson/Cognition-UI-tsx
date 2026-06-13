---
title: "User Story 8: Date and Time Types (Issue #25)"
type: "user-story"
issue: 25
spec_source: "RFC 9911 Section 5"
---

# User Story: User Story 8: Date and Time Types (Issue #25)

## Domain Object Mapping
- **Primary Domain Objects:** `date-and-time`, `date`, `date-no-zone`, `time`, `time-no-zone`
- **Actor/Role:** Location Registry Manager

## BDD Scenario (OOA/OOD Realization)
**Given** a timestamp, date, or time string is entered into the system
**When** the input is parsed for registration
**Then** the registry manager validates it against RFC 3339 profiles, checks for valid offsets (-14:00 to +14:00), accepts leap seconds, and stores the canonical representation.

## Operational Context
> Date and time types support Gregoring calendar representations. Timezones must align with RFC 9557 offsets, and timezone-free variants allow localized datestamps without zone constraints.

## Required Features Matrix
- [x] #19 - [Feature 8: Date and Time Types](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/epic-2-common-types/docs/features/feat-08-date-time.md)

## Source References
YANG Schema: [ietf-yang-types.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-yang-types%402025-12-22.yang)
Normative Specification: [RFC 9911 Common YANG Data Types](https://datatracker.ietf.org/doc/rfc9911/)
