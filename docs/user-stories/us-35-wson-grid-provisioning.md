---
title: "User Story 35: WSON Grid Provisioning (Issue #97)"
type: "user-story"
issue: 97
spec_source: "RFC 9093 Section 3"
---

# User Story: User Story 35: WSON Grid Provisioning (Issue #97)

## Domain Object Mapping
- **Primary Domain Objects:** `dwdm-n`, `cwdm-n`, `wson-grid-dwdm`, `wson-grid-cwdm`, `wson-label-start-end`, `wson-label-hop`
- **Actor/Role:** Optical Network Provisioner

## BDD Scenario (OOA/OOD Realization)
**Given** the grid type is set to "wson-grid-dwdm" and channel spacing is 50 GHz
**When** the nominal central frequency index `dwdm-n` is set to 4
**Then** the central frequency is provisioned at 193300.000 GHz ($193100 + 4 \times 50$) and the system reports successful provisioning.

## Operational Context
> The given value 'N' is used to determine the nominal central frequency f = 193100.000 GHz + N x channel spacing. It defines standard DWDM/CWDM optical grid provisioning indices mapping to nominal central frequency/wavelength metrics.

## Required Features Matrix
- [ ] #94 - [Feature 33: Layer 0 Grid Type and Label Range Information](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-33-layer0-grid-type-label.md)
- [ ] #95 - [Feature 34: WSON Grid Channel and Label Configuration](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-34-wson-grid-channel-label.md)

## Source References
YANG Schema: [ietf-layer0-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-layer0-types.yang)
Normative Specification: [RFC 9093](https://datatracker.ietf.org/doc/rfc9093/)
