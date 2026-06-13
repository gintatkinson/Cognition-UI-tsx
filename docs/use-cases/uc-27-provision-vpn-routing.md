---
title: "Use Case 27: Provision BGP/MPLS VPN Routing Segment (Issue #167)"
epic: "Epic 18: IETF Routing Common YANG Data Types (Issue #168)"
type: "use-case"
issue: 167
status: proposed
labels: ["use-case", "ietf-routing-types"]
---

# Use Case: Use Case 27: Provision BGP/MPLS VPN Routing Segment (Issue #167)

## 1. Description
This use case describes how a Network Provisioning Controller provisions a logical BGP/MPLS VPN routing segment by establishing Route Distinguisher (RD) parameters and Route Target (RT) import/export filtering criteria for a VRF instance.

## 2. Actors
- **Primary Actor**: Network Provisioning Controller
- **Secondary Actor**: VRF Configuration Manager

## 3. Flow of Events

### Basic Flow
1. **Initiate VRF Provisioning**: The Network Provisioning Controller receives a request to provision a new VRF routing segment for a customer domain.
2. **Assign Route Distinguisher**: The Controller assigns a unique Route Distinguisher format conforming to types 0, 1, 2, or 6.
3. **Assign Route Targets**: The Controller specifies the Route Targets to define route import and export scopes.
4. **Push Configuration**: The Controller pushes the RD and RT configuration to the VRF Configuration Manager.
5. **Verify Routing Isolation**: The VRF Manager validates the regular expressions and applies the routing table isolation.

## 4. Realisations
- [ ] #161 - [Feature 55: IETF Routing VPN Route Targets and Distinguishers](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-55-routing-types-vpn.md)
- [ ] #164 - [User Story 52: IETF Routing VPN Parameter Mapping](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-52-vpn-parameter-mapping.md)

## 5. Normative Specification
- [RFC 8294](https://datatracker.ietf.org/doc/rfc8294/)
