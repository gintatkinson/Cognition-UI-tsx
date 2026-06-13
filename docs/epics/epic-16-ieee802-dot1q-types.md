---
title: "Epic 16: IEEE 802.1Q Common Types (Issue #150)"
type: "epic"
issue: 150
labels: ["epic", "ieee802-dot1q-types"]
---

# Epic: Epic 16: IEEE 802.1Q Common Types (Issue #150)

## 1. Context
This Epic covers the reverse-engineering of the `ieee802-dot1q-types@2022-10-29.yang` schema and its associated normative specifications from [IEEE Std 802.1Q-2014](../std/802.1Q-2014.pdf). It models the core data types, priority maps, classification policies, and statistics definitions used to build, configure, and monitor standard Bridges and Bridged Networks.

## 2. Requirements & Checklist
- [ ] #139 - [Feature 47: IEEE 802.1Q Bridge Port VLAN Tag and Type Definitions](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-47-dot1q-tag-classifier.md)
- [ ] #140 - [Feature 48: IEEE 802.1Q Priority and Traffic Class Mapping](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-48-dot1q-priority-mapping.md)
- [ ] #141 - [Feature 49: IEEE 802.1Q Port Maps and Forwarding Filtering Policies](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-49-dot1q-port-filtering.md)
- [ ] #142 - [Feature 50: IEEE 802.1Q Bridge Port Performance and Error Statistics](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-50-dot1q-port-statistics.md)

## Associated Use Cases & User Stories
## 3. Architecture and System Interaction Diagrams

```mermaid
classDiagram
    class VLANClassifier {
        +tag-type : IdentityRef
        +vlan-id : UInt16
        +classify(frame) TagType
    }
    class PriorityMapper {
        +regenerateTable : List
        +pcpDecodeTable : List
        +pcpEncodeTable : List
        +trafficClassMap : List
        +mapPcpToTrafficClass(pcp, dei) TrafficClass
    }
    class PortMap {
        +port-ref : PortNumber
        +staticFiltering : List
        +staticVlanRegistration : List
        +macAddressRegistration : List
        +isForwarded(mac, vlan) Boolean
    }
    class PortStatistics {
        +delay-exceeded-discards : Counter64
        +mtu-exceeded-discards : Counter64
        +frame-rx : Counter64
        +octets-rx : Counter64
        +frame-tx : Counter64
        +octets-tx : Counter64
    }
    VLANClassifier --> PriorityMapper : Coordinates Priority Access
    PortMap --> VLANClassifier : Matches Tags
    PortStatistics --> PortMap : Counts Discards/Frames
```

## 4. Verification and Validation Plan
- Run `verify_model_coverage.py` to ensure that 100% of the 69 nodes/typedefs/identities defined in the `ieee802-dot1q-types` YANG schema are covered.
- Run `reconcile_backlog.py` to auto-link all dependency issues and synchronize local checklists with GitHub.
- Validate that VLAN ranges conform to the vid-range-type regex rules and ascending order checks.

## 5. Specification Context
> This YANG module defines common data types, identities, and groupings considered generally useful for dot1Q-bridge modules. It supports representing Customer VLAN (C-VLAN) tags, Service VLAN (S-VLAN) tags, priority regeneration tables, priority decoding/encoding tables, traffic class mappings, and bridge port statistics counters.

## 6. Source References
- **YANG Schema:** [ieee802-dot1q-types.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ieee802-dot1q-types.yang)
- **Normative Specification:** [IEEE Std 802.1Q-2014](../std/802.1Q-2014.pdf), Bridges and Bridged Networks.
