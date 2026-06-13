---
title: "Use Case 17: Layer 0 Optical Frequency Slot Validation (Issue #100)"
type: "use-case"
issue: 100
spec_source: "RFC 9093 Section 3 & 4"
---

# Use Case: Use Case 17: Layer 0 Optical Frequency Slot Validation (Issue #100)

## OOA/OOD Realization
- **Primary Actor:** Optical Provisioner
- **Preconditions:** The optical interface is active, and the network topology layers (e.g. Fixed or Flexi-Grid) are initialized.
- **Success Guarantee (Postconditions):** The configured nominal central frequencies, wavelengths, and slot widths are validated and applied to the physical/logical port.

## Main Success Scenario
1. The Actor selects the interface grid type (e.g. `wson-grid-dwdm` or `flexi-grid-dwdm`).
2. The Actor inputs the frequency slot configuration indices (e.g. `dwdm-n` or `flexi-n`/`flexi-m`).
3. The System validates the input parameters against grid constraints (e.g. step requirements and inequality bounds).
4. The System provisions the calculated frequency slot.

## Extensions
- **3a. Slot Width Bounds Violation:**
  - The System detects that `max-slot-width-factor` is less than `min-slot-width-factor`.
  - The System rejects the configuration and logs a constraint error.
- **3b. Frequency Step Multiplier Mismatch:**
  - The System detects that the nominal frequency index `flexi-n` does not conform to the step multiplier `flexi-n-step`.
  - The System rejects the configuration.

## Required User Stories
- [ ] #97 - [User Story 35: WSON Grid Provisioning](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-35-wson-grid-provisioning.md)
- [ ] #98 - [User Story 36: Flexi-Grid Frequency Slots](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-36-flexi-grid-frequency-slots.md)
- [ ] #99 - [User Story 37: Optical Label Ranges](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-37-optical-label-ranges.md)

## Source References
YANG Schema: [ietf-layer0-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-layer0-types.yang)
Normative Specification: [RFC 9093](https://datatracker.ietf.org/doc/rfc9093/)
