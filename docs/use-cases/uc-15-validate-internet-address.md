---
title: "Use Case 15: Validate Internet Address and Protocol Types"
type: "use-case"
issue: 87
spec_source: "RFC 6021"
labels: ["use-case", "ietf-inet-types"]
epic: "Epic 8: Common Internet Address YANG Data Types (Issue #88)"
---

# Use Case: Use Case 15: Validate Internet Address and Protocol Types

**Epic:** [Epic 8: Common Internet Address YANG Data Types (Issue #88)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-08-internet-types.md)

## OOA/OOD Realization
- **Primary Actor:** Network Administrator
- **Preconditions:** Network interface addresses, prefix ranges, port specifications, DSCP flags, or URIs are supplied for configuration.
- **Success Guarantee (Postconditions):** Configured items are validated against the schema constraints of RFC 6021, normalized to canonical representation, and safely committed.

## Main Success Scenario
1. The Actor inputs configuration parameters including IP address, subnet prefix, domain host, and service port.
2. The System validates the IP address format, prefix range (0..32/0..128), and verifies that the service port falls within 0..65535.
3. The System normalizes domain names and URIs to lowercase format, and canonicalizes IPv6 addresses.
4. The System registers the configured parameters and updates the interface topology state.

## Extensions
- **2a. Format validation failure:**
  - The IP prefix length or port is out of range, or a domain label is too long.
  - The System blocks configuration and returns an error explaining the constraint violation.

## Required User Stories
- [ ] #84 - [User Story 28: IP Address and Prefix Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-28-ip-address-prefix.md)
- [ ] #85 - [User Story 29: Internet Domain Names and URIs](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-29-domain-names-uri.md)
- [ ] #86 - [User Story 30: IP Protocol Fields and Autonomous Systems](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-30-protocol-fields-as.md)

## Source References
YANG Schema: [ietf-inet-types.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-inet-types%402013-07-15.yang)
Normative Specification: [RFC 6021 Common YANG Data Types](https://datatracker.ietf.org/doc/rfc6021/)
