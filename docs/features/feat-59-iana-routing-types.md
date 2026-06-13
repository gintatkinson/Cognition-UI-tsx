---
title: "Feature 59: IANA Routing Address Family and BGP SAFI Data Types (Issue #176)"
type: "feature"
issue: 176
labels: ["feature", "iana-routing-types"]
covered-nodes: ["address-family", "bgp-safi"]
---

# Feature: Feature 59: IANA Routing Address Family and BGP SAFI Data Types (Issue #176)

## 1. Description
This feature implements the reverse-engineered data types from `iana-routing-types.yang` defined in RFC 8294. It covers the two core registries maintained by IANA for standardizing routing protocols: Address Family Numbers (`address-family`) and BGP Subsequent Address Family Identifiers (`bgp-safi`).

### Context & Purpose
These data types allow downstream routing configurations (such as multiprotocol BGP networks, EVPNs, and L2VPNs/L3VPNs) to refer to standardized protocol identifiers. They guarantee interoperability during network session negotiation and telemetry logging.

## 2. Requirements & Verification
- **Model Ingestion**: The system must ingest and parse `address-family` and `bgp-safi` configurations.
- **Value Ranges**: Values for these types must map precisely to IANA-allocated integer registries (e.g., IPv4 = 1, IPv6 = 2, Unicast SAFI = 1, EVPN SAFI = 70).

### Typedefs
- `address-family`: Standard IANA Address Family Numbers (such as `ipv4`, `ipv6`, `nsap`, `ieee802`, `l2vpn`, `bgp-ls`).
- `bgp-safi`: BGP Subsequent Address Family Identifiers (such as `unicast-safi`, `multicast-safi`, `labeled-unicast-safi`, `evpn-safi`, `l3vpn-flow-spec-safi`).

## 3. Logical Data Model & Validation Rules

### Data Types Table
| Node / Typedef | YANG Type | Constraints & Values |
|---|---|---|
| `address-family` | enumeration | Enumerated IANA address family integers (IPv4=1, IPv6=2, IEEE802=6, L2VPN=25, BGP-LS=16388, etc.) |
| `bgp-safi` | enumeration | Enumerated BGP SAFI integers (Unicast=1, Multicast=2, EVPN=70, Labeled VPN=128, etc.) |

### Validation and Processing Rules
1. **Enumeration Range Enforcement**: Only IANA-registered address family enumerations and BGP Subsequent Address Family Identifiers defined in the schema must be accepted.
2. **Numeric Value Mapping**: Each text enumeration maps to a fixed integer representation in the underlying routing message format (e.g., multiprotocol BGP updates).

## 4. User Interface and API Representation
- **API Request Format**:
  ```json
  {
    "address_family": "ipv4",
    "bgp_safi": "unicast-safi"
  }
  ```
- **CLI Commands**:
  ```bash
  cogctl routing-registry validate --family ipv4 --safi unicast-safi
  ```

## 5. Acceptance Criteria (Given-When-Then)

### Scenario 1: Validate Standard Address Family and SAFI Ingestion
* **Given** a routing configuration specifying the address family as `"ipv6"`
* **And** BGP SAFI as `"evpn-safi"`
* **When** the configuration is validated against the IANA routing types module
* **Then** the validation must succeed
* **And** map `"ipv6"` to value `2` and `"evpn-safi"` to value `70`.

### Scenario 2: Reject Invalid Address Family Definition
* **Given** an invalid address family value `"ipv9"`
* **When** validation is run
* **Then** the validation must fail with an enumeration range error.

## 6. Source References
- **YANG Module:** [iana-routing-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/iana-routing-types.yang)
- **Normative Specification:** [RFC 8294 Section 4](https://datatracker.ietf.org/doc/rfc8294/)
