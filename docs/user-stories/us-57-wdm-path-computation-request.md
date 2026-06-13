---
title: "User Story 57: WDM Optical Route Computation Request (Issue #181)"
type: "user-story"
issue: 181
spec_source: "draft-ietf-ccamp-optical-path-computation-yang"
---

# User Story 57: WDM Optical Route Computation Request (Issue #181)

## Domain Object Mapping
- **Primary Domain Objects**: `oms-element`, `oms-element-uid`, `wdm`
- **Actor/Role**: Network Design Engineer

## BDD Scenario (OOA/OOD Realization)

**As a** Network Design Engineer  
**I need to** request path computation for a WDM optical network tunnel with specific OMS node exclusions and technology label bounds  
**So that** the computed path satisfies physical fiber constraints and spectrum slots without optical interference.

### BDD Acceptance Criteria
- **Given** the path computation input interface is active
- **When** the engineer submits a computation request specifying a route exclusion for `oms-element-uid` `OMS-SEC-5` and sets the technology label technology to `wdm`
- **Then** the system registers the OMS exclusion, applies the Layer 0 label range checks, and sends the request to the path computation engine.

## Operational Context
> In WDM optical networks, path computation must avoid specific Optical Multiplex Section (OMS) segments due to maintenance or degradation. Incorporating explicit route exclusions for OMS elements and specifying technology-specific labels allows fine-grained traffic engineering.

## Required Features Matrix
- [ ] #180 - [Feature 60: WDM Path Computation Objects](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-60-wdm-path-computation-objects.md)

## Source References
YANG Schema: [ietf-wdm-path-computation.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-wdm-path-computation.yang)
Normative Specification: [draft-ietf-ccamp-optical-path-computation-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-optical-path-computation-yang/)
