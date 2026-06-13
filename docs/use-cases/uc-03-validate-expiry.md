---
title: "Use Case 3: Validate Expiry & Temporal State (Issue #14)"
type: "use-case"
issue: 14
spec_source: "RFC 9179 Section 2.5"
---

# Use Case: Use Case 3: Validate Expiry & Temporal State (Issue #14)

## OOA/OOD Realization
- **Primary Actor:** Location Registry Daemon
- **Preconditions:** Location records exist with timestamp and valid-until fields configured.
- **Success Guarantee (Postconditions):** Expired entries are flagged or removed, and valid entries remain active.

## Main Success Scenario
1. The Actor scans the database for entries with `valid-until` timestamps.
2. The System compares the current server time to the `valid-until` timestamp of each entry.
3. The System identifies entries where the current time is greater than `valid-until`.
4. The System marks those entries as "Expired" and updates their status.

## Extensions
- **2a. Missing valid-until field:**
  - The entry does not have a `valid-until` time configured.
  - The System treats the entry as permanently valid and skips expiration marking.

## Required User Stories
- [x] #11 - [User Story 5: Temporal Validity Expiry Check](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/user-stories/us-05-temporal-expiry.md)

## Source References
YANG Schema: [ietf-geo-location.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-geo-location%402022-02-11.yang)
Normative Specification: [RFC 9179 Geographic Location](https://datatracker.ietf.org/doc/rfc9179/)
