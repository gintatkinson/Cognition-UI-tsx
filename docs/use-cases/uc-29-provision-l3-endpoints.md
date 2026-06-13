---
title: "Use Case 29: Provision Layer 3 Unicast Topology Parameters (Issue #174)"
epic: "Epic 19: IETF Layer 3 Unicast Network Topologies (Issue #175)"
type: "use-case"
issue: 174
status: proposed
labels: ["use-case", "ietf-l3-topology"]
---

# Use Case: Use Case 29: Provision Layer 3 Unicast Topology Parameters (Issue #174)

## 1. Description
This use case describes how a Network Provisioning Controller provisions Layer 3 link attributes (such as link metrics) and interface-level addressing (IP address lists or unnumbered identifiers) on Layer 3 nodes.

## 2. Actors
- **Primary Actor**: Network Provisioning Controller
- **Secondary Actor**: Interface Configuration Manager

## 3. Flow of Events

### Basic Flow
1. **Initiate Link Provisioning**: The Network Provisioning Controller receives a request to establish or update routing attributes between two logical nodes.
2. **Assign Link Metrics**: The Controller specifies the primary (`metric1`) and secondary (`metric2`) metrics to guide dynamic route path calculations.
3. **Configure Adjacency Endpoints**: The Controller configures the termination point parameters:
   - For IP-addressed links: Pushes the IP addresses to the termination point.
   - For unnumbered links: Pushes the local `unnumbered-id` to identify the interface index.
4. **Push Interface Changes**: The Controller submits the config to the Interface Configuration Manager.
5. **Verify Interface Adjacency**: The Interface Manager validates metrics and interface configurations, then establishes Layer 3 adjacency.

## 4. Realisations
- [ ] #170 - [Feature 58: IETF Layer 3 Unicast Links and Termination Points](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-58-l3-topology-links.md)
- [ ] #172 - [User Story 55: Layer 3 Route Prefix and Endpoint Configuration](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-55-l3-endpoint-configuration.md)

## 5. Normative Specification
- [RFC 8346](https://datatracker.ietf.org/doc/rfc8346/)
