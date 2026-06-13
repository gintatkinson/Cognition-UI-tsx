---
title: "Epic 7: Network Base Model (Issue #79)"
type: "epic"
issue: 79
labels: ["epic", "ietf-network"]
---

# Epic: Epic 7: Network Base Model (Issue #79)

## 1. Context
This Epic covers the digital engineering reverse-engineering of the IETF YANG module "A YANG Data Model for networks" (`ietf-network`). It defines the base schema for describing networks, nodes, and layering relationships (supporting networks and supporting nodes), serving as the foundation for multi-layer topology modeling.

## 2. Requirements & Checklist
- [ ] #73 - [Feature 28: Network and Node Base Models](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-28-network-base-model.md)

## Associated Use Cases & User Stories

### Associated Use Cases
- [ ] #77 - [Use Case 13: Ingest Base Network Topology (Issue #77)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/use-cases/uc-13-ingest-base-network.md)

### Associated User Stories
- [ ] #75 - [User Story 26: Multi-Layer Network Mapping (Issue #75)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-26-multi-layer-network-topology.md)
## 3. Architecture and System Interaction Diagrams
```mermaid
classDiagram
    class Networks {
        +network[] Network
    }
    class Network {
        +networkId network-id
        +supportingNetwork[] SupportingNetwork
        +node[] Node
    }
    class SupportingNetwork {
        +networkRef network-ref
    }
    class Node {
        +nodeId node-id
        +supportingNode[] SupportingNode
    }
    class SupportingNode {
        +networkRef network-ref
        +nodeRef node-ref
    }

    Networks --> Network
    Network --> SupportingNetwork
    Network --> Node
    Node --> SupportingNode
```

## 4. State Machine Definitions
```mermaid
stateDiagram-v2
    [*] --> Unconfigured
    Unconfigured --> NetworkRegistered : Configure network-id
    NetworkRegistered --> NodeRegistered : Configure node-id
    NodeRegistered --> LayeringEstablished : Map supporting-network & supporting-node references
    LayeringEstablished --> ActiveNetwork : Commit to datastore
```

## 5. Specification Context
> This YANG module defines a common base data model for a collection of nodes in a network. Node definitions are further used in network topologies and inventories.

## 6. Source References
YANG Schema: [ietf-network.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-network%402018-02-26.yang)
Normative Specification: [RFC 8345](https://datatracker.ietf.org/doc/rfc8345/)
