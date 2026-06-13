---
title: "User Story 62: Manage Ethernet Transport Client Signal Types (Issue #208)"
type: "user-story"
issue: 208
spec_source: "draft-ietf-ccamp-client-signal-yang"
---

# User Story 62: Manage Ethernet Transport Client Signal Types (Issue #208)

## Domain Object Mapping
- **Primary Domain Objects**: `c-vlan-tag-type`, `s-vlan-tag-type`, `mef-10-bwp`, `root-primary`, `installed`, `planned`
- **Actor/Role**: Network Provisioning Engineer

## BDD Scenario (OOA/OOD Realization)

**As a** Network Provisioning Engineer  
**I need to** manage and configure Ethernet client signal characteristics  
**So that** I can enforce VLAN encapsulation, bandwidth shaping limits, and active topological roles.

### BDD Acceptance Criteria
- **Given** an Ethernet client signal is configured on a physical interface
- **When** the engineer configures a `c-vlan-tag-type` tag encapsulation and applies a `mef-10-bwp` profile with a CIR of 50 Mbps
- **Then** the configuration is validated, accepted, and the interface operational lifecycle is set to `installed`.

## Operational Context
> Managing Ethernet client parameters ensures that customer traffic is properly encapsulated and policed at ingress points to the WAN core.

## Required Features Matrix
- [ ] #205 - [Feature 70: Ethernet Transport Client VLAN and Service Classification Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-70-eth-tran-types-vlan.md)
- [ ] #206 - [Feature 71: Ethernet Transport Bandwidth Profiles and Service Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-71-eth-tran-types-bwp.md)
- [ ] #207 - [Feature 72: Ethernet Transport Operational and Topology Roles](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-72-eth-tran-types-roles.md)

## Source References
YANG Schema: [ietf-eth-tran-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-eth-tran-types.yang)
Normative Specification: [draft-ietf-ccamp-client-signal-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-client-signal-yang/)
