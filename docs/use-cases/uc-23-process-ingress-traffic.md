---
title: "Use Case 23: Process Bridge Port Ingress Traffic (Issue #149)"
epic: "Epic 16: IEEE 802.1Q Common Types (Issue #149)"
type: "use-case"
issue: 149
status: proposed
labels: ["use-case", "ieee802-dot1q-types"]
---

# Use Case: Use Case 23: Process Bridge Port Ingress Traffic (Issue #149)

## 1. Description
This use case describes how a Bridge Port Ingress Interface processes received Ethernet frames, classifying them, mapping priorities, looking up the Forwarding Database (FDB), forwarding or filtering, and updating performance statistics.

## 2. Actors
- **Primary Actor**: Bridge Port Ingress Interface
- **Secondary Actor**: Forwarding Engine, Statistics Manager

## 3. Flow of Events

### Basic Flow
1. **Receive Frame**: The Ingress Interface receives a physical frame.
2. **Classify Tag**: The Ingress Interface parses the frame header, checks the EtherType (e.g. `81-00` or `88-A8`), and extracts the VLAN ID (C-VID or S-VID).
3. **Map Priority**: The Ingress Interface decodes the PCP/DEI values using the PCP decoding map, maps priority through the Priority Regeneration Table, and assigns the regenerated priority to determine the outbound traffic class queue.
4. **Lookup Forwarding**: The Forwarding Engine looks up the destination MAC address and VLAN ID in the FDB.
5. **Forward Frame**: The frame is forwarded to the mapped egress port(s).
6. **Update Statistics**: The Statistics Manager increments `frame-rx` and `octets-rx` counters.

### Alternative Flows
- **MTU Violation**:
  - 2a. If the frame size exceeds the configured MTU, the frame is discarded. The Statistics Manager increments `mtu-exceeded-discards` and `discard-inbound`.
- **FDB Filtering Policy**:
  - 4a. If a static filtering entry indicates a discard/filter policy for the destination MAC/VLAN, the frame is dropped. The Statistics Manager increments `discard-inbound`.

## 4. Realisations
- **Features**: Feature 47, Feature 48, Feature 49, Feature 50
- **User Stories**: User Story 44, User Story 46, User Story 47

## 5. Normative Specification
- [IEEE Std 802.1Q-2014](../std/802.1Q-2014.pdf)
