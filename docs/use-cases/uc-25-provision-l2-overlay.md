---
title: "Use Case 25: Provision Layer 2 Virtual Overlay (Issue #158)"
epic: "Epic 17: IETF Layer 2 Network Topologies (Issue #159)"
type: "use-case"
issue: 158
status: proposed
labels: ["use-case", "ietf-l2-topology"]
---

# Use Case: Use Case 25: Provision Layer 2 Virtual Overlay (Issue #158)

## 1. Description
This use case describes how a Network Administrator provisions virtual Layer 2 segments (such as VLANs or VXLAN overlay networks) and configures link transmission attributes on specific interfaces.

## 2. Actors
- **Primary Actor**: Network Administrator
- **Secondary Actor**: Bridge Configuration Service

## 3. Flow of Events

### Basic Flow
1. **Request Virtual Segment**: The Network Administrator requests provisioning of a new Layer 2 overlay segment on a bridge port.
2. **Specify Encapsulation**: The Administrator specifies parameters including encapsulation type (e.g., `vxlan`), VNI ID, VLAN tags, and link performance parameters (rate, delay, auto-negotiation, duplex).
3. **Verify Constraints**: The Bridge Configuration Service validates that:
   - Outer/inner VLAN tags are within standard range 1..4094.
   - VXLAN VNI is within the 24-bit range.
   - Delay and rate are valid positive values.
4. **Apply Interface Configuration**: The service commits the configuration parameters to the bridge termination points.
5. **Confirm Overlay Operation**: The service verifies connectivity and returns a success status.

## 4. Realisations
- [ ] #152 - [Feature 52: IETF Layer 2 Link Attributes](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-52-l2-topology-links.md)
- [ ] #153 - [Feature 53: IETF Layer 2 Termination Point Encapsulation and Virtualization](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-53-l2-topology-ports.md)
- [ ] #155 - [User Story 49: Layer 2 Link Connectivity and Performance Tuning](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-49-l2-link-connectivity.md)
- [ ] #156 - [User Story 50: Layer 2 Interface Encapsulation and Logical Partitioning](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-50-l2-port-encapsulation.md)

## 5. Normative Specification
- [RFC 8944](https://datatracker.ietf.org/doc/rfc8944/)
