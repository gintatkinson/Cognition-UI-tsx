---
title: "Use Case 18: Provision Layer 1 Client Signal (Issue #130)"
type: "use-case"
issue: 130
spec_source: "draft-ietf-ccamp-layer1-types Section 3.1 & 3.2"
---

# Use Case: Use Case 18: Provision Layer 1 Client Signal (Issue #130)

## OOA/OOD Realization
- **Primary Actor:** Optical Provisioner
- **Preconditions:** The optical interface port is active, and the physical transceiver is inserted and powered on.
- **Success Guarantee (Postconditions):** The Layer 1 Client Signal protocol, coding type, and PMD parameters are validated and applied, allowing traffic to flow.

## Main Success Scenario
1. The Actor selects the client port to configure.
2. The Actor selects the client protocol type (e.g. `Ethernet` or `Fibre-Channel`).
3. The Actor selects the target client signal rate (e.g. `ETH-10Gb-LAN`) and coding function (e.g. `ETH-10GR`).
4. The System verifies alignment with the physical PMD function of the transceiver.
5. The System provisions the parameters and enables the port interface.

## Extensions
- **4a. PMD / Transceiver Mismatch:**
  - The System detects that the selected PMD function (e.g., `ER-PMD-10G`) does not match the inserted physical transceiver capabilities.
  - The System raises a configuration mismatch alarm and leaves the port disabled.
- **4b. Inconsistent Protocol and Coding Selection:**
  - The System detects that the chosen coding function does not match the chosen protocol (e.g., SDH protocol selected with Ethernet line coding).
  - The System rejects the configuration and prompts the actor to correct the mismatch.

## Required User Stories
- [ ] #129 - [User Story 38: Layer 1 Client Protocol Configuration](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-38-layer1-client-protocol.md)

## Source References
YANG Schema: [ietf-layer1-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-layer1-types.yang)
Normative Specification: [draft-ietf-ccamp-layer1-types](https://datatracker.ietf.org/doc/draft-ietf-ccamp-layer1-types/)
