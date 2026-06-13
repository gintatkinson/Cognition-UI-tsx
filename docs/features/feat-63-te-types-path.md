---
title: "Feature 63: Traffic Engineering Path Computation and Metrics (Issue #186)"
epic: "Epic 22: Traffic Engineering Common Data Types (Issue #189)"
type: "feature"
issue: 186
status: proposed
labels: ["feature", "ietf-te-types"]
covered-nodes:
  - accumulative-value
  - action-lockout-of-normal
  - action-lockout-of-protection
  - advertisement-interval
  - as-number-hop
  - association-type-resource-sharing
  - bandwidth-protection-desired
  - clear-lockout-of-normal
  - cost
  - delay
  - disjointness
  - explicit-route-exclude-objects
  - explicit-route-include-objects
  - explicit-route-objects
  - explicit-route-usage
  - failure-of-protocol
  - hop-type
  - label-hop
  - label-restriction
  - label-restrictions
  - link-metric-delay-average
  - link-metric-delay-maximum
  - link-metric-delay-minimum
  - link-metric-igp
  - link-metric-residual-bandwidth
  - link-metric-te
  - link-metric-type
  - link-path-metric-type
  - lockout-of-protection
  - lsp-metric-absolute
  - lsp-metric-inherited
  - lsp-metric-relative
  - lsp-metric-type
  - lsp-path-computation-failed
  - lsp-path-computation-ok
  - lsp-path-computing
  - lsp-protection-reroute
  - lsp-protection-reroute-extra
  - lsp-provisioning-error-reason
  - measure-interval
  - metric
  - metric-type
  - numbered-link-hop
  - numbered-node-hop
  - objective-function
  - objective-function-type
  - of-maximize-residual-bandwidth
  - of-minimize-agg-bandwidth-consumption
  - of-minimize-cost-path
  - of-minimize-cost-path-set
  - of-minimize-load-most-loaded-link
  - of-minimize-load-path
  - one-way-available-bandwidth
  - one-way-available-bandwidth-normality
  - one-way-delay
  - one-way-delay-normality
  - one-way-delay-offset
  - one-way-residual-bandwidth
  - one-way-residual-bandwidth-normality
  - one-way-utilized-bandwidth
  - one-way-utilized-bandwidth-normality
  - optimization-metric
  - optimizations
  - path-affinities-value
  - path-affinities-values
  - path-affinity-name
  - path-affinity-names
  - path-attribute-flags
  - path-computation-error-brpc-chain-unavailable
  - path-computation-error-child-pce-unresponsive
  - path-computation-error-destination-domain-unknown
  - path-computation-error-destination-unknown
  - path-computation-error-destination-unknown-in-domain
  - path-computation-error-no-dependent-server
  - path-computation-error-no-gco-migration
  - path-computation-error-no-gco-solution
  - path-computation-error-no-inclusion-hop
  - path-computation-error-no-resource
  - path-computation-error-no-topology
  - path-computation-error-p2mp
  - path-computation-error-path-not-found
  - path-computation-error-pce-unavailable
  - path-computation-error-pks-expansion
  - path-computation-error-reason
  - path-computation-error-source-unknown
  - path-computation-method
  - path-computation-srlg-type
  - path-constraints
  - path-explicitly-defined
  - path-externally-queried
  - path-invalidation-action-drop
  - path-invalidation-action-teardown
  - path-invalidation-action-type
  - path-locally-computed
  - path-metric
  - path-metric-bound
  - path-metric-bounds
  - path-metric-delay-average
  - path-metric-delay-minimum
  - path-metric-hop
  - path-metric-igp
  - path-metric-optimization-type
  - path-metric-optimize-excludes
  - path-metric-optimize-includes
  - path-metric-residual-bandwidth
  - path-metric-te
  - path-metric-type
  - path-properties
  - path-reevaluation-request
  - path-route-object
  - path-route-objects
  - path-scope-end-to-end
  - path-scope-segment
  - path-scope-type
  - path-setup-rsvp
  - path-setup-sr
  - path-setup-static
  - path-signaling-type
  - path-srlgs-list
  - path-srlgs-lists
  - path-srlgs-name
  - path-srlgs-names
  - path-tiebreaker-maxfill
  - path-tiebreaker-minfill
  - path-tiebreaker-random
  - path-tiebreaker-type
  - path-type
  - performance-metrics-normality
  - performance-metrics-one-way
  - performance-metrics-two-way
  - protocol-origin-pcep
  - resource-aff-exclude-any
  - resource-aff-include-all
  - resource-aff-include-any
  - resource-affinities-type
  - restriction
  - route-exclude-object
  - route-exclude-srlg
  - route-include-object
  - route-object-exclude-always
  - route-object-exclude-object
  - route-object-include-exclude
  - route-object-include-object
  - route-usage-type
  - signal-fail-of-protection
  - srlg
  - srlg-collection-desired
  - srlg-ignore
  - srlg-preferred
  - srlg-strict
  - srlg-weighted
  - suppression-interval
  - svec-metric-aggregate-bandwidth-consumption
  - svec-metric-cumulative-hop
  - svec-metric-cumulative-igp
  - svec-metric-cumulative-te
  - svec-metric-load-of-the-most-loaded-link
  - svec-metric-type
  - svec-objective-function-type
  - svec-of-minimize-agg-bandwidth-consumption
  - svec-of-minimize-common-transit-domain
  - svec-of-minimize-cost-path-set
  - svec-of-minimize-load-most-loaded-link
  - svec-of-minimize-shared-link
  - svec-of-minimize-shared-nodes
  - svec-of-minimize-shared-srlg
  - te-bandwidth
  - te-hop-type
  - te-metric
  - te-optimization-criterion
  - te-path-disjointness
  - te-topology-event-type
  - te-topology-id
  - te-topology-identifier
  - threshold-accelerated-advertisement
  - threshold-in
  - threshold-out
  - throttle
  - tiebreaker
  - tiebreaker-type
  - tiebreakers
  - topology-id
  - tunnel-action-switchpath
  - two-way-delay
  - two-way-delay-normality
  - unnumbered-link-hop
  - upper-bound
---

# Feature: Feature 63: Traffic Engineering Path Computation and Metrics (Issue #186)

**Parent Epic:** [Epic 22: Traffic Engineering Common Data Types (Issue #189)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-22-te-types.md)

This feature introduces path computation constraints, synchronization vector (SVEC) properties, path optimization metrics, and explicit path calculation errors.

## 1. Schema Definitions & Constraints
- Path Constraints: `path-constraints`, `path-metric-bound`, `path-metric-bounds`, `path-route-objects`.
- Optimization Metrics: `path-metric-type`, `link-metric-type`, `objective-function-type`, `of-minimize-cost-path`.
- SVEC Metrics: `svec-metric-type`, `svec-objective-function-type`.
- Computation Errors: `path-computation-error-reason`, `path-computation-error-no-resource`, `path-computation-error-path-not-found`.

### Typedefs
- **path-attribute-flags**: Flags detailing path setup capabilities and constraints.
- **path-type**: Type of computed path (dynamic, explicit, etc.).
- **performance-metrics-normality**: Indication of performance metrics normality index.
- **srlg**: Shared Risk Link Group identifier.
- **te-bandwidth**: Traffic engineering bandwidth capability definition.
- **te-hop-type**: Hop inclusion type (loose, strict).
- **te-metric**: TE path computation metric.
- **te-path-disjointness**: Level of disjointness for path computation.
- **te-topology-event-type**: Event notification type for topology updates.
- **te-topology-id**: Topology instance identifier.

## 2. Logical System Integration & UI Capabilities
- Designers can specify metric bounds (e.g. max delay or hop limit) during explicit route object configuration.
- The path request validator returns clear error reasons when PCE path computation fails.

## 3. State Machine and Validation Flow
```mermaid
stateDiagram-v2
    [*] --> Ready
    Ready --> Computing : Send Path Request
    Computing --> Success : Route Found
    Computing --> Error : Route Unavailable
    Error --> ParseReason : Identify Error Reason (e.g. path-computation-error-no-resource)
```

## 4. BDD Given-When-Then Acceptance Criteria
- **Scenario 1: Detect path computation failure reason**
  - **Given** a PCE receives a path computation request
  - **When** there is no topology match for the destination
  - **Then** the PCE returns `path-computation-error-destination-unknown`.

## 5. Specification Context
> This feature defines synchronization vector options and metric parameters for path computation.

## 6. Source References
YANG Schema: [ietf-te-types.yang](https://github.com/YangModels/yang/blob/954277fad0534e9b0b495774255b0c4ce854f8b2/experimental/ietf-extracted-YANG-modules/ietf-te-types%402026-05-08.yang)
Normative Specification: [draft-ietf-teas-rfc8776-update](https://datatracker.ietf.org/doc/draft-ietf-teas-rfc8776-update/)
