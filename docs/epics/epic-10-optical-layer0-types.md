---
title: "Epic 10: Optical Layer 0 Type Definitions (Issue #101)"
type: "epic"
issue: 101
labels: ["epic", "ietf-layer0-types"]
---

# Epic: Epic 10: Optical Layer 0 Type Definitions (Issue #101)

## 1. Context
This Epic covers the reverse-engineering of RFC 9093 (A YANG Data Model for Layer 0 Types). It defines standard Layer 0 Fixed Grid (CWDM/DWDM) and Flexi-Grid identities, central frequency/wavelength formulas, and slot configurations to model optical link characteristics.

## 2. Requirements & Checklist
- [ ] #94 - [Feature 33: Layer 0 Grid Type and Label Range Information](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-33-layer0-grid-type-label.md)
- [ ] #95 - [Feature 34: WSON Grid Channel and Label Configuration](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-34-wson-grid-channel-label.md)
- [ ] #96 - [Feature 35: Flexi-Grid Channel and Slot Configuration](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-35-flexi-grid-channel-slot.md)

## Associated Use Cases & User Stories

### Associated Use Cases
- [ ] #100 - [Use Case 17: Layer 0 Optical Frequency Slot Validation (Issue #100)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/use-cases/uc-17-layer0-optical-frequency-slot.md)

### Associated User Stories
- [ ] #97 - [User Story 35: WSON Grid Provisioning (Issue #97)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-35-wson-grid-provisioning.md)
- [ ] #98 - [User Story 36: Flexi-Grid Frequency Slots (Issue #98)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-36-flexi-grid-frequency-slots.md)
- [ ] #99 - [User Story 37: Optical Label Ranges (Issue #99)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-37-optical-label-ranges.md)
## 3. Architecture and System Interaction Diagrams
```mermaid
classDiagram
    class Layer0Label {
        +grid-type: l0-grid-type
        +priority: uint8
    }
    class WSONLabel {
        +dwdm-n: int16
        +cwdm-n: int16
        +wson-dwdm-channel-spacing: identityref
        +wson-cwdm-channel-spacing: identityref
    }
    class FlexiGridLabel {
        +flexi-n: int16
        +flexi-m: uint16
        +slot-width-granularity: identityref
        +min-slot-width-factor: uint16
        +max-slot-width-factor: uint16
    }
    Layer0Label <|-- WSONLabel
    Layer0Label <|-- FlexiGridLabel
```

## 4. Verification and Validation Plan
- Execute automated Python test parsing to verify that model coverage check returns 100% parity.
- Execute the reconciliation tool to verify that checklists synchronize seamlessly with GitHub Issue states.

## 5. Specification Context
> This YANG module defines standard Layer 0 Fixed Grid (CWDM/DWDM) and Flexi-Grid identities, central frequency/wavelength formulas, and slot configurations to model optical link characteristics.

## 6. Source References
YANG Schema: [ietf-layer0-types.yang](https://github.com/YangModels/yang/blob/954277fad0534e9b0b495774255b0c4ce854f8b2/experimental/ietf-extracted-YANG-modules/ietf-layer0-types%402021-02-22.yang)
Normative Specification: [RFC 9093 A YANG Data Model for Layer 0 Types](https://datatracker.ietf.org/doc/rfc9093/)
