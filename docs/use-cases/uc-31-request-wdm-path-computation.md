---
title: "Use Case 31: Request WDM Path Computation (Issue #182)"
type: "use-case"
issue: 182
spec_source: "draft-ietf-ccamp-optical-path-computation-yang"
---

# Use Case 31: Request WDM Path Computation (Issue #182)

## 1. Actors
- **Primary Actor**: Path Computation Client (PCC)
- **Secondary Actors**: Path Computation Element (PCE), Network Topology Store

## 2. Preconditions
- The WDM optical network topology is initialized and active.
- The PCE has a complete representation of OMS elements and available spectrum slots.

## 3. Trigger
- The PCC receives an orchestration request to establish an optical wavelength tunnel avoiding certain physical links.

## 4. Main Success Scenario (Basic Flow)
1. The PCC queries the Network Topology Store to locate the active OMS elements.
2. The PCC identifies the OMS segment to exclude and forms a path computation request.
3. The PCC adds the `oms-element` case with `oms-element-uid` set to `OMS-SEC-5`.
4. The PCC specifies label restrictions with technology choice set to `wdm`.
5. The PCE computes the shortest path avoiding the excluded OMS element and satisfying the label constraints.
6. The PCC receives the computed path properties with Layer 0 parameters and stores the route.

## 5. Alternate and Exception Flows
- **5a. Unknown OMS Element**:
  - 1. The PCC specifies an `oms-element-uid` that does not exist in the topology.
  - 2. The PCE rejects the path computation request with an error indicating an unresolved route hop.
  - 3. The flow terminates.

- **5b. Technology Label Mismatch**:
  - 1. The technology choice in label restrictions is mismatched.
  - 2. The PCE rejects the request during validation.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The path is successfully computed, avoiding the specified OMS element and satisfying all technology-specific bounds.
- **Failure Guarantee**: The computation request is aborted with an error, preserving the tunnel state.

## 7. Operational Context
> Restricting route computation using physical OMS segments and explicit technology labels is necessary for optical WDM and flexi-grid networks to ensure signal quality.

## 8. Realization Matrix

### Required User Stories
- [ ] #181 - [User Story 57: WDM Optical Route Computation Request](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-57-wdm-path-computation-request.md)

### Required Features
- [ ] #180 - [Feature 60: WDM Path Computation Objects](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-60-wdm-path-computation-objects.md)

## Source References
YANG Schema: [ietf-wdm-path-computation.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-wdm-path-computation.yang)
Normative Specification: [draft-ietf-ccamp-optical-path-computation-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-optical-path-computation-yang/)
