---
title: "User Story 29: Internet Domain Names and URIs"
type: "user-story"
issue: 85
spec_source: "RFC 6021 Section 4"
labels: ["user-story", "ietf-inet-types"]
epic: "Epic 8: Common Internet Address YANG Data Types (Issue #88)"
---

# User Story: User Story 29: Internet Domain Names and URIs

**Epic:** [Epic 8: Common Internet Address YANG Data Types (Issue #88)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-08-internet-types.md)

## Domain Object Mapping
- **Primary Domain Objects:** `domain-name`, `host`, `uri`
- **Actor/Role:** DNS System Operator

## BDD Scenario (OOA/OOD Realization)
**Given** a domain name or URI string is configured
**When** the string is validated by the system
**Then** the operator validates length constraints, verifies character rules, and applies generic normalization to the URI according to STD 66 rules.

## Operational Context
> DNS names are validated up to 253 characters in US-ASCII format. URIs are converted to canonical format with scheme and host in lowercase, and hex-encoded values in uppercase.

## Required Features Matrix
- [ ] #82 - [Feature 31: Internet Domain Names and URIs](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-31-domain-names-uri.md)

## Source References
YANG Schema: [ietf-inet-types.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-inet-types%402013-07-15.yang)
Normative Specification: [RFC 6021 Common YANG Data Types](https://datatracker.ietf.org/doc/rfc6021/)
