---
title: "User Story 58: Ingest Common Traffic Engineering Types (Issue #187)"
type: "user-story"
issue: 187
spec_source: "draft-ietf-teas-rfc8776-update"
---

# User Story 58: Ingest Common Traffic Engineering Types (Issue #187)

## Domain Object Mapping
- **Primary Domain Objects**: `te-node-id`, `lsp-state-type`, `path-metric-type`
- **Actor/Role**: Network Design Engineer

## BDD Scenario (OOA/OOD Realization)

**As a** Network Design Engineer  
**I need to** ingest and validate common Traffic Engineering types and metric properties  
**So that** I can design and compute diverse paths for TE tunnels using standardized parameter types.

### BDD Acceptance Criteria
- **Given** the network configuration editor is loaded
- **When** the engineer configures a path metric restriction using `path-metric-delay-minimum`
- **Then** the system validates the metric parameters against the schema rules defined in Features 61, 62, and 63.

## Operational Context
> Ingesting standardized TE common data types ensures semantic compatibility across multi-vendor path computation clients and servers.

## Required Features Matrix
- [ ] #184 - [Feature 61: Common Traffic Engineering Base Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-61-te-types-common.md)
- [ ] #185 - [Feature 62: Traffic Engineering LSP and Tunnel Properties](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-62-te-types-lsp.md)
- [ ] #186 - [Feature 63: Traffic Engineering Path Computation and Metrics](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-63-te-types-path.md)

## Source References
YANG Schema: [ietf-te-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-te-types.yang)
Normative Specification: [draft-ietf-teas-rfc8776-update](https://datatracker.ietf.org/doc/draft-ietf-teas-rfc8776-update/)
