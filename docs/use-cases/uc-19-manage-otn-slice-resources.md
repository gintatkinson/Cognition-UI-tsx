---
title: "Use Case 19: Manage OTN Slice Resources (Issue #119)"
type: "use-case"
issue: 119
spec_source: "draft-ietf-ccamp-yang-otn-slicing Section 3"
---

# Use Case 19: Manage OTN Slice Resources (Issue #119)

## 1. Actors
- **Primary Actor**: Network Provisioning Controller
- **Secondary Actors**: Network Element Agent, Topology Service

## 2. Preconditions
- The physical network topology is scanned and active in the topology database.
- The target links are configured as OTN topology types.

## 3. Trigger
- The controller receives a request from a customer or network orchestration system to allocate a new OTN Network Resource Partition (NRP) on a specific TE link.

## 4. Main Success Scenario (Basic Flow)
1. The Network Provisioning Controller queries the Topology Service to locate links supporting OTN slicing.
2. The Network Provisioning Controller selects a target TE link and specifies the NRP granularity to `link-resource`.
3. The Network Provisioning Controller configures the profile with `nrp-id` = 105 and selects the `time-slots` bandwidth choice with `otn-ts-num` = 16.
4. The Network Element Agent allocates 16 tributary slots on the physical interface and applies the isolation partition.
5. The Network Provisioning Controller verifies that the partition is active on the MPI.

## 5. Alternate and Exception Flows
- **5a. Non-OTN Network Topology**:
  - 1. The Network Provisioning Controller attempts to configure an NRP on a non-OTN link.
  - 2. The configuration is rejected because the target link lacks the `otnt:otn-topology` property.
  - 3. The transaction aborts.

- **5b. Invalid Granularity**:
  - 1. The Network Provisioning Controller attempts to configure the NRP without selecting a valid choice case.
  - 2. The system rejects the request due to mutual exclusivity validation failure.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The partition is successfully mapped on the MPI, and the tributary slots are isolated for the tenant.
- **Failure Guarantee**: The transaction is aborted, the link state remains unmodified, and the error is returned to the initiator.

## 7. Operational Context
> Network slicing enables physical network isolation into multiple logically distinct networks. The OTN slice MPI model allows dynamic tuning and allocation of partition properties.

## 8. Realization Matrix

### Required User Stories
- [x] #117 - [User Story 41: OTN Slice Lifecycle](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-41-otn-slice-lifecycle.md)

### Required Features
- [x] #113 - [Feature 46: OTN Network Resource Partition MPI Mapping](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-46-otn-slice-mpi-mapping.md)

## Source References
YANG Schema: [ietf-otn-slice-mpi.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-otn-slice-mpi.yang)
Normative Specification: [draft-ietf-ccamp-yang-otn-slicing](https://datatracker.ietf.org/doc/draft-ietf-ccamp-yang-otn-slicing/)
