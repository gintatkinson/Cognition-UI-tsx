---
title: "User Story 10: General Address, Identity, and Language Tags (Issue #27)"
type: "user-story"
issue: 27
spec_source: "RFC 9911 Section 6"
---

# User Story: User Story 10: General Address, Identity, and Language Tags (Issue #27)

## Domain Object Mapping
- **Primary Domain Objects:** `phys-address`, `mac-address`, `xpath1.0`, `hex-string`, `uuid`, `dotted-quad`, `language-tag`
- **Actor/Role:** Location Registry Manager

## BDD Scenario (OOA/OOD Realization)
**Given** a network address, identifier, or language tag is provided
**When** the input is validated
**Then** the registry manager converts the characters to lowercase canonical formats (for MAC, physical address, hex-string, UUID, and language tags) and verifies matching schema patterns.

## Operational Context
> Address and identity types represent low-level hardware tags (MAC/physical), network markers (dotted-quad), expressions (XPath), and language tags conforming to BCP 47.

## Required Features Matrix
- [x] #21 - [Feature 10: General Address, Identity, and Language Tags](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/epic-2-common-types/docs/features/feat-10-addresses-tags.md)

## Source References
YANG Schema: [ietf-yang-types.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-yang-types%402025-12-22.yang)
Normative Specification: [RFC 9911 Common YANG Data Types](https://datatracker.ietf.org/doc/rfc9911/)
