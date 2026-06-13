---
title: "Epic 27: Ethernet Transport Network Client Services Model (Issue #218)"
type: "epic"
issue: 218
labels: ["epic", "ietf-eth-tran-service"]
---

# Epic: Epic 27: Ethernet Transport Network Client Services Model (Issue #218)

## 1. Context
This Epic covers the reverse-engineering of `ietf-eth-tran-service@2024-01-11.yang` as specified in `draft-ietf-ccamp-client-signal-yang`. The model defines service configurations, topologies, endpoints, performance metrics, and service underlays for provisioning Ethernet customer connections over transport networks.

## 2. Requirements & Checklist
- [ ] #211 - [Feature 73: Ethernet Transport Service Instances and Endpoints Core](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-73-eth-tran-service-core.md)
- [ ] #212 - [Feature 74: Ethernet Transport Service Access Points and Classification](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-74-eth-tran-service-sap.md)
- [ ] #213 - [Feature 75: Ethernet Transport Service Endpoints and Tag Operations](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-75-eth-tran-service-tag.md)
- [ ] #214 - [Feature 76: Ethernet Transport Service Bandwidth Profiles and Underlays](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-76-eth-tran-service-bwp-underlay.md)
- [ ] #215 - [Feature 77: Ethernet Transport Service Performance Monitoring and Alerts](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-77-eth-tran-service-pm.md)

## Associated Use Cases & User Stories

### Associated Use Cases
- [ ] #217 - [Use Case 37: Ingest and Validate Ethernet Transport Client Services (Issue #217)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/use-cases/uc-37-eth-tran-service-ingest.md)

### Associated User Stories
- [ ] #216 - [User Story 63: Manage Ethernet Transport Client Services (Issue #216)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-63-eth-tran-service.md)
## 3. Architecture and System Interaction Diagrams

```mermaid
classDiagram
    class EthSvcCore {
        etht-svc
        etht-svc-instances
        etht-svc-name
        etht-svc-descr
        etht-svc-title
        etht-svc-lifecycle
        admin-status
        oper-status
        provisioning-state
        operational-state
        created-by
        creation-time
        last-updated-by
        last-updated-time
        owned-by
    }
    class EthSvcSap {
        etht-svc-access-points
        access-point-id
        access-node-id
        access-node-uri
        access-ltp-id
        access-ltp-uri
        access-role
        topology-role
        split-horizon-group
        src-split-horizon-group
        dst-split-horizon-group
        service-classification
        service-classification-type
        port-classification
        vlan-classification
        individual-bundling-vlan
        individual-vlan
        vlan-bundling
        vlan-value
        vlan-range
        value
    }
    class EthSvcTag {
        etht-svc-end-points
        etht-svc-end-point-id
        etht-svc-end-point-name
        etht-svc-end-point-descr
        encapsulation-type
        vlan-operations
        pop-tags
        push-tags
        outer-tag
        second-tag
        tag-type
        default-pcp
    }
    class EthSvcBwpUnderlay {
        named-bandwidth-profiles
        bandwidth-profile-name
        ingress-bandwidth-profile
        egress-bandwidth-profile
        ingress-egress-bandwidth-profile
        symmetrical-operation
        asymmetrical-operation
        direction
        symmetrical
        asymmetrical
        style
        named
        ingress
        egress
        underlay
        mpls-tp
        pw
        pw-id
        pw-name
        pw-paths
        path-id
        transmit-label
        receive-label
        switching-type
        encoding
        native-ethernet
        eth-tunnels
        otn-tunnels
        tp-tunnels
        technology
    }
    class EthSvcPm {
        pm-config
        pm-enable
        latency-threshold
        receiving-rate-too-high
        receiving-rate-too-low
        receiving-rate-high
        receiving-rate-low
        sending-rate-too-high
        sending-rate-too-low
        sending-rate-high
        sending-rate-low
        pm-state
        error-info
        error-code
        error-description
        error-timestamp
        state
        latency
        resilience
        performance
        alarm-threshold
        globals
        name
        user-label
        frame-base
    }

    EthSvcCore *-- EthSvcSap
    EthSvcCore *-- EthSvcTag
    EthSvcCore *-- EthSvcBwpUnderlay
    EthSvcCore *-- EthSvcPm
```

```mermaid
stateDiagram-v2
    [*] --> InitService
    InitService --> ConfigureSAPs : Define ports & VLAN classifications
    ConfigureSAPs --> ConfigureTags : Add push/pop tag operations
    ConfigureTags --> ConfigureBandwidth : Configure bandwidth profile limits
    ConfigureBandwidth --> EnablePM : Enable performance monitoring thresholds
    EnablePM --> ServiceActive : Deploy service instance
    ServiceActive --> [*]
```

## 4. Verification and Validation Plan
- Verify that overall project model coverage is at 100% via `./skills/spec-orchestrator/verify_model_coverage.py`.
- Synchronize all specifications to GitHub issues using `./skills/spec-orchestrator/reconcile_backlog.py`.

## 5. Specification Context
> This YANG module defines configurations and operational states for Ethernet client transport services.

## 6. Source References
YANG Schema: [ietf-eth-tran-service.yang](https://github.com/gintatkinson/cogctl-ux-09/blob/main/yang/ietf-eth-tran-service.yang)
Normative Specification: [draft-ietf-ccamp-client-signal-yang](https://datatracker.ietf.org/doc/draft-ietf-ccamp-client-signal-yang/)
