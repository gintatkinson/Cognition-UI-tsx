---
title: "User Story 36: Flexi-Grid Frequency Slots (Issue #98)"
type: "user-story"
issue: 98
spec_source: "RFC 9093 Section 4"
---

# User Story: User Story 36: Flexi-Grid Frequency Slots (Issue #98)

## Domain Object Mapping
- **Primary Domain Objects:** `flexi-n`, `flexi-m`, `flexi-grid-frequency-slot`, `flexi-grid-label-hop`
- **Actor/Role:** Optical Network Engineer

## BDD Scenario (OOA/OOD Realization)
**Given** the grid type is set to "flexi-grid-dwdm" and slot width granularity is 12.5 GHz
**When** the slot width factor `flexi-m` is set to 4
**Then** the calculated slot width is exactly 50 GHz ($4 \times 12.5$) and the system reports successful allocation.

## Operational Context
> The given value 'M' is used to determine the slot width: slot width = M x SWG (measured in GHz), where SWG is defined by the flexi-slot-width-granularity.

## Required Features Matrix
- [ ] #94 - [Feature 33: Layer 0 Grid Type and Label Range Information](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-33-layer0-grid-type-label.md)
- [ ] #96 - [Feature 35: Flexi-Grid Channel and Slot Configuration](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-35-flexi-grid-channel-slot.md)

## Source References
YANG Schema: [ietf-layer0-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-layer0-types.yang)
Normative Specification: [RFC 9093](https://datatracker.ietf.org/doc/rfc9093/)
