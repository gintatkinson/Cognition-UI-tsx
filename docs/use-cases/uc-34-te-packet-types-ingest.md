---
title: "Use Case 34: Ingest and Validate Packet Traffic Engineering Types (Issue #198)"
type: "use-case"
issue: 198
spec_source: "RFC 8776"
---

# Use Case 34: Ingest and Validate Packet Traffic Engineering Types (Issue #198)

## 1. Actors
- **Primary Actor**: SDN Controller
- **Secondary Actors**: Network Configuration Engine, Telemetry Collector

## 2. Preconditions
- The network supports Packet TE types configuration (RFC 8776).
- The network management agent is operational and configured with the `ietf-te-packet-types` schema.

## 3. Trigger
- The Network Configuration Engine pushes a new path computation request or Diffserv-TE policy involving class types and bandwidth metrics.

## 4. Main Success Scenario (Basic Flow)
1. The SDN Controller receives a configuration request including Class-Types (`te-class-type`) and Bandwidth Constraints (`bc-type`).
2. The SDN Controller parses the requested bandwidths and maps them into kbps/mbps/gbps representation.
3. The SDN Controller validates class bounds, constraints model model rules (`bc-model-rdm`, `bc-model-mam`), and protection types (`backup-protection-link`).
4. The Telemetry Collector queries packet-specific performance metrics (one-way/two-way delays, jitter, packet loss).
5. The SDN Controller verifies that performance metrics values conform to their range boundaries (e.g., delay variation is within 0..16777215 us).
6. The configurations and measurements are stored and marked as operational.

## 5. Alternate and Exception Flows
- **5a. Value Range Validation Violation**:
  - 1. The controller detects that the requested `bc-type` is greater than 7 or delay values exceed 16777215 microseconds.
  - 2. The controller rejects the request and logs a validation error.
  - 3. The flow terminates with a rejection response.

## 6. Postconditions (Guarantees)
- **Success Guarantee**: The configurations are validated, correctly stored, and operational telemetry can be mapped to standard structures.
- **Failure Guarantee**: Invalid class configurations, model models, or performance metrics bounds are rejected without affecting the operational network parameters.

## 7. Operational Context
> Processing packet-specific TE types ensures correctness in path optimization requests and traffic matrix telemetry.

## 8. Realization Matrix

### Required User Stories
- [ ] #197 - [User Story 60: Manage Packet Traffic Engineering Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-60-te-packet-types.md)

### Required Features
- [ ] #196 - [Feature 67: Packet Traffic Engineering Core Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-67-te-packet-types-core.md)
- [ ] #200 - [Feature 68: Packet Performance Metrics Groupings](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-68-te-packet-types-metrics.md)

## Source References
YANG Schema: [ietf-te-packet-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-te-packet-types.yang)
Normative Specification: [draft-ietf-teas-rfc8776-update](https://datatracker.ietf.org/doc/draft-ietf-teas-rfc8776-update/)
