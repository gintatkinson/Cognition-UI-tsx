---
title: "Epic 14: OTN Network Slice (Issue #123)"
type: "epic"
issue: 123
labels: ["epic", "ietf-otn-slice", "ietf-otn-slice-mpi"]
---

# Epic: Epic 14: OTN Network Slice (Issue #123)

## 1. Context
This Epic covers the reverse-engineering of `ietf-otn-slice@2025-07-03.yang` and `ietf-otn-slice-mpi@2025-07-03.yang`. It defines a standard Optical Transport Network (OTN) slicing framework to support modeling, validating, and provisioning of:
1. Technology-specific network slices, templates, and Performance Monitoring (PM) SLO policies (NBI).
2. Network Resource Partitions (NRPs) and their slice realization over OTN TE links (MPI).

## 2. Requirements & Checklist
- [x] #112 - [Feature 45: OTN Network Slice Performance Monitoring](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-45-otn-slice-pm.md)
- [ ] #113 - [Feature 46: OTN Network Resource Partition MPI Mapping](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-46-otn-slice-mpi-mapping.md)

## Associated Use Cases & User Stories

### Associated Use Cases
- [ ] #119 - [U1se Case 19: Manage OTN Slice Resources (Issue #119)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/use-cases/uc-19-manage-otn-slice-resources.md)
- [x] #137 - [Use Case 20: Monitor OTN Network Slice Performance (Issue #137)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/use-cases/uc-20-monitor-otn-slice-performance.md)

### Associated User Stories
- [ ] #117 - [User Story 41: OTN Slice Lifecycle (Issue #117)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-41-otn-slice-lifecycle.md)
- [x] #136 - [User Story 42: Configure OTN Slice PM Thresholds (Issue #136)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-42-configure-otn-slice-pm-thresholds.md)
## 3. Architecture and System Interaction Diagrams
```mermaid
classDiagram
    class otn-slice-slo-policy {
        <<grouping>>
        otn container
    }
    class otn {
        <<container>>
        odu-signal-quality container
    }
    class odu-signal-quality {
        <<container>>
        odu-pm-objective list
    }
    class odu-pm-objective {
        <<list>>
        duration identityref
        pm-type identityref
        pm-threshold uint64
    }
    otn-slice-slo-policy --> otn
    otn --> odu-signal-quality
    odu-signal-quality --> odu-pm-objective
```

```mermaid
classDiagram
    class otn-nrp-profile {
        <<grouping>>
        otn-nrp-granularity choice
    }
    class otn-nrp-granularity {
        <<choice>>
        link
        link-resource
    }
    class link {
        <<case>>
        nrp-id uint32
    }
    class link-resource {
        <<case>>
        nrps list
    }
    otn-nrp-profile --> otn-nrp-granularity
    otn-nrp-granularity --> link
    otn-nrp-granularity --> link-resource
```

```mermaid
stateDiagram-v2
    [*] --> Unconfigured
    Unconfigured --> PMConfigured : Configure PM SLO Objectives (NBI)
    Unconfigured --> NRPConfigured : Map NRP Profile on MPI (link / link-resource)
    PMConfigured --> SliceActive : Activate Slice Services
    NRPConfigured --> SliceActive : Bind physical resources
    SliceActive --> [*]
```

## 4. Verification and Validation Plan
- Execute automated Python test parsing to verify that model coverage check returns 100% parity.
- Execute the reconciliation tool to verify that checklists synchronize seamlessly with GitHub Issue states.

## 5. Specification Context
> This module defines a YANG data model for configuring technology-specific network slices and network slice realization in Optical Transport Networks (OTN). It provides ODU-level performance requirements (NBI) and a mechanism to partition and map link resources into specific Network Resource Partitions (NRPs) at the Multi-Point Interface (MPI).

## 6. Source References
YANG NBI Schema: [ietf-otn-slice.yang](https://github.com/YangModels/yang/blob/954277fad0534e9b0b495774255b0c4ce854f8b2/experimental/ietf-extracted-YANG-modules/ietf-otn-slice%402025-07-03.yang)
YANG MPI Schema: [ietf-otn-slice-mpi.yang](https://github.com/YangModels/yang/blob/954277fad0534e9b0b495774255b0c4ce854f8b2/experimental/ietf-extracted-YANG-modules/ietf-otn-slice-mpi%402025-07-03.yang)
Normative Specification: [draft-ietf-ccamp-yang-otn-slicing](https://datatracker.ietf.org/doc/draft-ietf-ccamp-yang-otn-slicing/)
