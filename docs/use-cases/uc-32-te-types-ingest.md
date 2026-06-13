---
title: "Use Case 32: Ingest Traffic Engineering Common Area Data Types (Issue #188)"
type: "use-case"
issue: 188
spec_source: "draft-ietf-teas-rfc8776-update"
---

# Use Case 32: Ingest Traffic Engineering Common Area Data Types (Issue #188)

## 1. Actors
- **Primary Actor**: Traffic Engineering Controller
- **Secondary Actors**: Topology Database, PCE Server

## 2. Preconditions
- The TE schema types are loaded into the validation registry.

## 3. Trigger
- The Traffic Engineering Controller receives an active topology report containing path metric bounds and LSP states.

## 4. Main Success Scenario (Basic Flow)
1. The TE Controller validates the node identifiers using `te-node-id`.
2. The TE Controller parses the LSP state variables (e.g. `lsp-state-up`) and updates the local tunnel states.
3. The TE Controller applies the synchronization vector (`svec`) objective functions to group the path calculations.
4. The PCE calculates diverse routes and returns the computed labels to the controller.

## 5. Alternate and Exception Flows
- **5a. Invalid Node ID URI**:
  - 1. The controller encounters an malformed `node-id-uri`.
  - 2. The controller rejects the report and registers an ingestion validation error.
  - 3. The flow terminates.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The TE data types are validated and correctly mapped to the database.
- **Failure Guarantee**: The invalid configurations are discarded with error reasons registered.

## 7. Operational Context
> Processing standardized TE parameters is essential to maintain consistent state machine synchronization.

## 8. Realization Matrix

### Required User Stories
- [ ] #187 - [User Story 58: Ingest Common Traffic Engineering Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-58-te-types-common.md)

### Required Features
- [ ] #184 - [Feature 61: Common Traffic Engineering Base Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-61-te-types-common.md)
- [ ] #185 - [Feature 62: Traffic Engineering LSP and Tunnel Properties](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-62-te-types-lsp.md)
- [ ] #186 - [Feature 63: Traffic Engineering Path Computation and Metrics](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-63-te-types-path.md)

## Source References
YANG Schema: [ietf-te-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-te-types.yang)
Normative Specification: [draft-ietf-teas-rfc8776-update](https://datatracker.ietf.org/doc/draft-ietf-teas-rfc8776-update/)
