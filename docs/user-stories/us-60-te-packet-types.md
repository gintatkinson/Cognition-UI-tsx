---
title: "User Story 60: Manage Packet Traffic Engineering Types (Issue #197)"
type: "user-story"
issue: 197
spec_source: "RFC 8776"
---

# User Story 60: Manage Packet Traffic Engineering Types (Issue #197)

## Domain Object Mapping
- **Primary Domain Objects**: `te-class-type`, `bc-type`, `bandwidth-kbps`, `bandwidth-mbps`, `bandwidth-gbps`, `backup-protection-type`, `bc-model-type`
- **Actor/Role**: Network Operator

## BDD Scenario (OOA/OOD Realization)

**As a** Network Operator  
**I need to** manage and configure Class-Types and Bandwidth Constraints for Diffserv-TE  
**So that** I can configure bandwidth allocation models (MAM, RDM, MAR) and backup protection preferences across packet TE links.

### BDD Acceptance Criteria
- **Given** the system is configured to use Diffserv-aware Traffic Engineering
- **When** the operator provisions a class type with Bandwidth Constraint Model `bc-model-rdm` (Russian Dolls Model) and sets the `bc-type` to 5
- **Then** the configuration is validated, successfully stored, and propagates the correct bandwidth constraints.

## Operational Context
> Managing Class-Types and Bandwidth Constraint Models allows fine-grained resource partitioning and quality-of-service (QoS) enforcement on packet-switching nodes.

## Required Features Matrix
- [ ] #196 - [Feature 67: Packet Traffic Engineering Core Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-67-te-packet-types-core.md)
- [ ] #200 - [Feature 68: Packet Performance Metrics Groupings](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-68-te-packet-types-metrics.md)

## Source References
YANG Schema: [ietf-te-packet-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-te-packet-types.yang)
Normative Specification: [draft-ietf-teas-rfc8776-update](https://datatracker.ietf.org/doc/draft-ietf-teas-rfc8776-update/)
