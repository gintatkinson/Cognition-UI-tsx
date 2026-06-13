---
title: "Epic 21: WDM Path Computation (Issue #183)"
type: "epic"
issue: 183
labels: ["epic", "ietf-wdm-path-computation"]
---

# Epic: Epic 21: WDM Path Computation (Issue #183)

## 1. Context
This Epic covers the reverse-engineering of `ietf-wdm-path-computation@2026-02-27.yang`. It defines the YANG data model for requesting path computation in Wavelength-Division Multiplexing (WDM) optical networks, supporting both Wavelength Switched Optical Networks (WSON) and Flexi-Grid Dense Wavelength Division Multiplexing (DWDM) switching technologies.

## 2. Requirements & Checklist
- [ ] #180 - [Feature 60: WDM Path Computation Objects](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-60-wdm-path-computation-objects.md)

## Associated Use Cases & User Stories

### Associated Use Cases
- [ ] #182 - [Use Case 31: Request WDM Path Computation (Issue #182)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/use-cases/uc-31-request-wdm-path-computation.md)

### Associated User Stories
- [ ] #181 - [User Story 57: WDM Optical Route Computation Request (Issue #181)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-57-wdm-path-computation-request.md)
## 3. Architecture and System Interaction Diagrams

```mermaid
classDiagram
    class path-compute-info {
        <<grouping>>
    }
    class route-object-exclude-object {
        <<list>>
    }
    class route-object-include-object {
        <<list>>
    }
    class type {
        <<choice>>
    }
    class oms-element {
        <<case>>
        oms-element-uid string
    }
    class label-restriction {
        <<list>>
    }
    class technology {
        <<choice>>
    }
    class wdm {
        <<case>>
        wdm-label-hop grouping
        wdm-label-start-end grouping
        wdm-label-step grouping
    }

    path-compute-info --> route-object-exclude-object
    path-compute-info --> route-object-include-object
    route-object-exclude-object --> type
    route-object-include-object --> type
    type --> oms-element
    path-compute-info --> label-restriction
    label-restriction --> technology
    technology --> wdm
```

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> PathComputationRequested : RPC Request Initiated (tunnels-path-compute)
    PathComputationRequested --> ValidateConstraints : Parse Explicit Exclusions / Inclusions
    ValidateConstraints --> ResolveWdmLabels : Apply WDM Label & OMS Constraints
    ResolveWdmLabels --> PathComputed : Path Successfully Resolved
    ResolveWdmLabels --> PathFailed : Constraint Violation / Routing Failure
    PathComputed --> Idle : Return Computed Path Properties (L0 attributes)
    PathFailed --> Idle : Return Path Computation Error
```

## 4. Verification and Validation Plan
- Run the model coverage check tool (`verify_model_coverage.py`) to verify 100% schema model coverage.
- Run the backlog reconciliation script (`reconcile_backlog.py`) to verify database integrity and link synchronization.

## 5. Specification Context
> This document provides a mechanism to request path computation in Wavelength-Division Multiplexing (WDM) optical networks. These networks are composed of Wavelength Switched Optical Networks (WSON) and Flexi-Grid Dense Wavelength Division Multiplexing (DWDM) switched technologies. The YANG data model defined in the document is designed to augment Remote Procedure Calls (RPCs) to facilitate these path computation requests.

## 6. Source References
YANG Schema: [ietf-wdm-path-computation.yang](https://github.com/YangModels/yang/blob/954277fad0534e9b0b495774255b0c4ce854f8b2/experimental/ietf-extracted-YANG-modules/ietf-wdm-path-computation%402026-02-27.yang)
Normative Specification: [draft-ietf-ccamp-optical-path-computation-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-optical-path-computation-yang/)
