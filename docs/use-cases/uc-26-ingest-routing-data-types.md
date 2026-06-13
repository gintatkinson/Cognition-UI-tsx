---
title: "Use Case 26: Ingest Routing Area YANG Common Data Types (Issue #166)"
epic: "Epic 18: IETF Routing Common YANG Data Types (Issue #168)"
type: "use-case"
issue: 166
status: proposed
labels: ["use-case", "ietf-routing-types"]
---

# Use Case: Use Case 26: Ingest Routing Area YANG Common Data Types (Issue #166)

## 1. Description
This use case describes how the Routing Protocol Controller ingests, parses, and validates common routing attributes (including MPLS labels, multicast group addresses, bandwidth values, and timers) received from managed nodes or network operators.

## 2. Actors
- **Primary Actor**: Routing Protocol Controller
- **Secondary Actor**: Network Node Agent

## 3. Flow of Events

### Basic Flow
1. **Receive Configuration/Telemetry**: The Routing Protocol Controller receives interface configuration or state data from a managed node.
2. **Identify Common Routing Attributes**: The Controller identifies OSPF/BGP timers, interface bandwidth float32 parameters, and MPLS label configurations.
3. **Validate Range & Syntax Constraints**: The Controller validates:
   - Bandwidth hex values against the IEEE 754 float32 pattern.
   - Timer values against seconds/milliseconds union definitions.
   - MPLS label values (general-use or special-purpose identities).
4. **Accept and Update State**: If all checks pass, the Controller accepts the data and updates the routing engine database.

## 4. Realisations
- [ ] #160 - [Feature 54: IETF Routing Type Identities and MPLS Labels](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-54-routing-types-mpls.md)
- [ ] #162 - [Feature 56: IETF Routing Multicast and Protocol Common Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-56-routing-types-common.md)
- [ ] #163 - [User Story 51: IETF Routing MPLS Label Provisioning](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-51-mpls-label-provisioning.md)
- [ ] #165 - [User Story 53: IETF Routing Common Multicast and Protocol Configuration](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-53-multicast-protocol-config.md)

## 5. Normative Specification
- [RFC 8294](https://datatracker.ietf.org/doc/rfc8294/)
