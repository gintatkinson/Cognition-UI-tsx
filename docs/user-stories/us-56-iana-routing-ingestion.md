---
title: "User Story 56: IANA Routing Family and SAFI Ingestion (Issue #177)"
epic: "Epic 20: IANA Routing Common Data Types (Issue #179)"
type: "user-story"
issue: 177
status: proposed
labels: ["user-story", "iana-routing-types"]
---

# User Story: User Story 56: IANA Routing Family and SAFI Ingestion (Issue #177)

## Description
As a BGP Routing Protocol Engineer,
I want to ingest standard IANA Address Family Numbers and BGP Subsequent Address Family Identifiers (SAFI) into the routing engine,
So that I can establish multiprotocol BGP peers and configure corresponding routing topologies correctly.

## BDD Acceptance Criteria

- **Scenario: Successfully ingest standard Address Family and SAFI**
  - **Given** a routing peer setup that requires multiprotocol capabilities
  - **When** the engineer configures the peer with address family `"ipv4"` and SAFI `"labeled-unicast-safi"`
  - **Then** the controller validates the inputs and successfully registers the capability for the session.

## Required Features Matrix
- [ ] #176 - [Feature 59: IANA Routing Address Family and BGP SAFI Data Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-59-iana-routing-types.md)

## Normative Specification
- [RFC 8294](https://datatracker.ietf.org/doc/rfc8294/)
