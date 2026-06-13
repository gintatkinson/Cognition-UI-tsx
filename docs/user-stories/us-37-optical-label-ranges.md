---
title: "User Story 37: Optical Label Ranges (Issue #99)"
type: "user-story"
issue: 99
spec_source: "RFC 9093 Section 4.1"
---

# User Story: User Story 37: Optical Label Ranges (Issue #99)

## Domain Object Mapping
- **Primary Domain Objects:** `min-slot-width-factor`, `max-slot-width-factor`, `flexi-grid-label-range-info`
- **Actor/Role:** Network Design Architect

## BDD Scenario (OOA/OOD Realization)
**Given** a Flexi-Grid interface capability descriptor is configured
**When** the user defines `min-slot-width-factor` as 2 and `max-slot-width-factor` as 4
**Then** the validation verifies that the maximum slot width is greater than or equal to the minimum slot width, allowing successful configuration.

## Operational Context
> must '. >= ../min-slot-width-factor' { error-message "Maximum slot width must be greater than or equal to minimum slot width."; }

## Required Features Matrix
- [ ] #94 - [Feature 33: Layer 0 Grid Type and Label Range Information](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-33-layer0-grid-type-label.md)
- [ ] #96 - [Feature 35: Flexi-Grid Channel and Slot Configuration](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-35-flexi-grid-channel-slot.md)

## Source References
YANG Schema: [ietf-layer0-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-layer0-types.yang)
Normative Specification: [RFC 9093](https://datatracker.ietf.org/doc/rfc9093/)
