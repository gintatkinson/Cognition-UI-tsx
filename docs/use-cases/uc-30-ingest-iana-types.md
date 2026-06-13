---
title: "Use Case 30: Ingest IANA Routing Area Data Types (Issue #178)"
epic: "Epic 20: IANA Routing Common Data Types (Issue #179)"
type: "use-case"
issue: 178
status: proposed
labels: ["use-case", "iana-routing-types"]
---

# Use Case: Use Case 30: Ingest IANA Routing Area Data Types (Issue #178)

## 1. Description
This use case describes how the Routing Protocol Controller ingests, parses, and validates standardized routing Address Families and BGP Subsequent Address Family Identifiers (SAFI) parameters.

## 2. Actors
- **Primary Actor**: Routing Protocol Controller
- **Secondary Actor**: BGP Peer Agent

## 3. Flow of Events

### Basic Flow
1. **Receive Connection Request**: The Routing Protocol Controller receives a BGP OPEN message containing Multiprotocol Extension capabilities.
2. **Identify Family and SAFI**: The Controller extracts the Address Family Number and SAFI value from the capabilities parameter.
3. **Validate Registries**: The Controller validates:
   - The address family against the IANA-defined `address-family` registry.
   - The BGP SAFI against the IANA-defined `bgp-safi` registry.
4. **Negotiate Capabilities**: If both values are supported and valid, the Controller completes capability negotiation and establishes the session.

## 4. Realisations
- [ ] #176 - [Feature 59: IANA Routing Address Family and BGP SAFI Data Types](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-59-iana-routing-types.md)
- [ ] #177 - [User Story 56: IANA Routing Family and SAFI Ingestion](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-56-iana-routing-ingestion.md)

## 5. Normative Specification
- [RFC 8294](https://datatracker.ietf.org/doc/rfc8294/)
