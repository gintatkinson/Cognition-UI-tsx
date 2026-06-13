---
title: "Use Case 22: Provision VLAN Interface Classifier (Issue #148)"
epic: "Epic 16: IEEE 802.1Q Common Types (Issue #148)"
type: "use-case"
issue: 148
status: proposed
labels: ["use-case", "ieee802-dot1q-types"]
---

# Use Case: Use Case 22: Provision VLAN Interface Classifier (Issue #148)

## 1. Description
This use case describes how a Network Provisioning Controller configures VLAN tag classifiers and priority map policies on a specific Bridge Port interface.

## 2. Actors
- **Primary Actor**: Network Provisioning Controller
- **Secondary Actor**: Bridge Configuration Service

## 3. Flow of Events

### Basic Flow
1. **Request Provisioning**: The Network Provisioning Controller requests to map a VLAN tag to a specific Bridge Port interface.
2. **Specify Parameters**: The Controller provides the `tag-type` (e.g. `c-vlan` or `s-vlan`), the `vlan-id` (or list of ranges `vlan-ids`), and priority parameters.
3. **Validate Configuration**: The Bridge Configuration Service validates that:
   - The VLAN IDs are within the valid range `1..4094`.
   - The ranges are in ascending order and non-overlapping.
4. **Apply Classifier**: The Bridge Configuration Service writes the configuration to the port's hardware registers.
5. **Acknowledge Success**: The service confirms that the classifier is active.

### Alternative Flows
- **Invalid Ranges**:
  - 3a. If the ranges are not in ascending order or overlap, the service rejects the command and returns a validation error.

## 4. Realisations
- **Features**: Feature 47, Feature 48
- **User Stories**: User Story 43, User Story 44

## 5. Normative Specification
- [IEEE Std 802.1Q-2014](../std/802.1Q-2014.pdf)
