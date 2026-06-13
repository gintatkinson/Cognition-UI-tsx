---
title: "User Story 42: Configure OTN Slice PM Thresholds (Issue #136)"
type: "user-story"
issue: 136
spec_source: "draft-ietf-ccamp-yang-otn-slicing"
---

# User Story 42: Configure OTN Slice PM Thresholds (Issue #136)

## Domain Object Mapping
- **Primary Domain Objects:** `odu-pm-objective`, `pm-threshold`, `pm-type`
- **Actor/Role:** Network Planning Engineer

## BDD Scenario (OOA/OOD Realization)
**As a** Network Planning Engineer  
**I need to** configure Performance Monitoring (PM) threshold objectives on an OTN slice SLO/SLE policy template  
**So that** the network management system can raise alarms when physical ODU signal degradation exceeds acceptable parameters.

### BDD Acceptance Criteria
- **Given** an OTN network slice SLO/SLE template configuration is open
- **When** the engineer configures a PM objective with duration `pm-15m`, PM counter type `odu-bbe` (Background Block Error), and a threshold of `1000`
- **Then** the system validates and registers the PM objective for the slice, and applies it to the active topology components.

## Operational Context
> Network slicing enables the partition of physical network resources. ODU signal quality performance requirements (BBE, ES, SES, UAS, BER) define the threshold limits for performance monitoring objectives.

## Required Features Matrix
- [x] #112 - [Feature 45: OTN Network Slice Performance Monitoring](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-45-otn-slice-pm.md)

## Source References
YANG Schema: [ietf-otn-slice.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-otn-slice.yang)
Normative Specification: [draft-ietf-ccamp-yang-otn-slicing](https://datatracker.ietf.org/doc/draft-ietf-ccamp-yang-otn-slicing/)
