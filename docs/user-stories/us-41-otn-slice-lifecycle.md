---
title: "User Story 41: OTN Slice Lifecycle (Issue #117)"
type: "user-story"
issue: 117
spec_source: "draft-ietf-ccamp-yang-otn-slicing"
---

# User Story 41: OTN Slice Lifecycle (Issue #117)

## Domain Object Mapping
- **Primary Domain Objects**: `otn-nrp-profile`, `nrps`
- **Actor/Role**: Network Provisioning Engineer

## BDD Scenario (OOA/OOD Realization)

**As a** Network Provisioning Engineer  
**I need to** configure and manage the lifecycle of an OTN slice partition profile on a TE link  
**So that** traffic engineering resources are isolated and customized for tenant-specific SLA objectives.

### BDD Acceptance Criteria
- **Given** a TE link with active OTN slice capability
- **When** the engineer configures the link-resource profile with a specific NRP partition (`nrp-id` = 105, `otn-ts-num` = 16)
- **Then** the system reserves the corresponding 16 tributary slots, isolates the bandwidth, and moves the partition status to Active.

## Operational Context
> Network slicing enables physical network isolation into multiple logically distinct networks. The OTN slice MPI model allows dynamic tuning and allocation of partition properties.

## Required Features Matrix
- [x] #113 - [Feature 46: OTN Network Resource Partition MPI Mapping](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-46-otn-slice-mpi-mapping.md)

## Source References
YANG Schema: [ietf-otn-slice-mpi.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-otn-slice-mpi.yang)
Normative Specification: [draft-ietf-ccamp-yang-otn-slicing](https://datatracker.ietf.org/doc/draft-ietf-ccamp-yang-otn-slicing/)
