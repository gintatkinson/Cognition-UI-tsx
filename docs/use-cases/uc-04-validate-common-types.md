---
title: "Use Case 4: Validate Common YANG Types (Issue #28)"
type: "use-case"
issue: 28
spec_source: "RFC 9911"
---

# Use Case: Use Case 4: Validate Common YANG Types (Issue #28)

## OOA/OOD Realization
- **Primary Actor:** Location Registry Manager
- **Preconditions:** Form data or API requests containing common YANG type definitions are submitted for validation.
- **Success Guarantee (Postconditions):** Invalid formats are rejected with explicit semantic/pattern errors, and valid formats are correctly normalized and stored in the registry.

## Main Success Scenario
1. The Actor enters values for MAC addresses, UUIDs, datestamps, and counters.
2. The System validates the patterns and boundary limits (e.g. OID root arcs, date-and-time timezone ranges).
3. The System converts physical addresses, MAC addresses, hex-strings, UUIDs, and language tags to lowercase canonical forms.
4. The System successfully registers the normalized inputs.

## Extensions
- **2a. Validation failure:**
  - The input does not match the regex pattern or bounds.
  - The System rejects the registration and alerts the Actor with a specific validation error message.

## Required User Stories
- [x] #23 - [User Story 6: Numeric Counters and Gauges](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/epic-2-common-types/docs/user-stories/us-06-counters-gauges.md)
- [x] #24 - [User Story 7: Identifiers and Object References](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/epic-2-common-types/docs/user-stories/us-07-identifiers-references.md)
- [x] #25 - [User Story 8: Date and Time Types](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/epic-2-common-types/docs/user-stories/us-08-date-time.md)
- [x] #26 - [User Story 9: Time Durations](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/epic-2-common-types/docs/user-stories/us-09-time-durations.md)
- [x] #27 - [User Story 10: General Address, Identity, and Language Tags](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/epic-2-common-types/docs/user-stories/us-10-addresses-tags.md)

## Source References
YANG Schema: [ietf-yang-types.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-yang-types%402025-12-22.yang)
Normative Specification: [RFC 9911 Common YANG Data Types](https://datatracker.ietf.org/doc/rfc9911/)
