---
title: "Feature 62: Traffic Engineering LSP and Tunnel Properties (Issue #185)"
epic: "Epic 22: Traffic Engineering Common Data Types (Issue #189)"
type: "feature"
issue: 185
status: proposed
labels: ["feature", "ietf-te-types"]
covered-nodes:
  - action-forced-switch
  - action-freeze
  - action-manual-switch
  - admin-group
  - admin-groups
  - association-type-recovery
  - clear
  - clear-freeze
  - contiguous-lsp-desired
  - encoding
  - entropy-label-capability
  - extended-admin-group
  - forced-switch
  - link-protection
  - link-protection-1-for-1
  - link-protection-1-plus-1
  - link-protection-enhanced
  - link-protection-extra-traffic
  - link-protection-shared
  - link-protection-type
  - link-protection-unprotected
  - local-protection-desired
  - loopback-desired
  - lsp-attributes-flags
  - lsp-encoding-digital-wrapper
  - lsp-encoding-ethernet
  - lsp-encoding-fiber
  - lsp-encoding-fiber-channel
  - lsp-encoding-lambda
  - lsp-encoding-line
  - lsp-encoding-oduk
  - lsp-encoding-optical-channel
  - lsp-encoding-packet
  - lsp-encoding-pdh
  - lsp-encoding-sdh
  - lsp-encoding-types
  - lsp-integrity-required
  - lsp-protection-1-for-1
  - lsp-protection-1-for-n
  - lsp-protection-bidir-1-plus-1
  - lsp-protection-extra-traffic
  - lsp-protection-state
  - lsp-protection-type
  - lsp-protection-unidir-1-plus-1
  - lsp-protection-unprotected
  - lsp-restoration-restore-all
  - lsp-restoration-restore-any
  - lsp-restoration-restore-none
  - lsp-restoration-type
  - lsp-state-down
  - lsp-state-setting-up
  - lsp-state-setup-failed
  - lsp-state-setup-ok
  - lsp-state-tearing-down
  - lsp-state-type
  - lsp-state-up
  - lsp-stitching-desired
  - manual-switch
  - node-protection-desired
  - non-php-behavior-flag
  - normal
  - oam-mep-entity-desired
  - oam-mip-entity-desired
  - oob-mapping-flag
  - pre-planned-lsp-flag
  - protection-external-commands
  - restoration-scheme-precomputed
  - restoration-scheme-preconfigured
  - restoration-scheme-presignaled
  - restoration-scheme-rerouting
  - restoration-scheme-type
  - rtm-set-desired
  - se-style-desired
  - session-attributes-flags
  - setup-priority
  - signal-degrade
  - signal-fail
  - signaling-type
  - soft-preemption-desired
  - switching-capabilities
  - switching-dcsc
  - switching-evpl
  - switching-fsc
  - switching-l2sc
  - switching-lsc
  - switching-otn
  - switching-psc1
  - switching-tdm
  - switching-type
  - te-recovery-status
  - te-tunnel-p2mp
  - te-tunnel-p2p
  - te-tunnel-type
  - tunnel-action-inprogress
  - tunnel-action-reoptimize
  - tunnel-action-resetup
  - tunnel-action-type
  - tunnel-admin-state-auto
  - tunnel-admin-state-down
  - tunnel-admin-state-type
  - tunnel-admin-state-up
  - tunnel-state-down
  - tunnel-state-type
  - tunnel-state-up
  - wait-to-restore
---

# Feature: Feature 62: Traffic Engineering LSP and Tunnel Properties (Issue #185)

**Parent Epic:** [Epic 22: Traffic Engineering Common Data Types (Issue #189)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/epics/epic-22-te-types.md)

This feature introduces the properties and state variables for LSP (Label Switched Path) establishment, tunnel types, local protection mechanisms, switching capabilities, and optical encoding schemes.

## 1. Schema Definitions & Constraints
- Tunnel Properties: `te-tunnel-type`, `te-tunnel-p2p`, `te-tunnel-p2mp`, `tunnel-state-type`, `tunnel-admin-state-type`.
- LSP States & Types: `lsp-state-type`, `lsp-protection-type`, `lsp-restoration-type`, `lsp-encoding-types`.
- Local Protection Flags: `session-attributes-flags`, `se-style-desired`, `local-protection-desired`, `bandwidth-protection-desired`, `node-protection-desired`.
- Switching & Encoding: `switching-type`, `switching-capabilities`, `switching-otn`, `switching-lsc`.

### Typedefs
- **admin-group**: Standard 32-bit administrative group / affinity bitmask.
- **admin-groups**: Array/collection of administrative groups.
- **extended-admin-group**: Infinite-length or extended administrative group representation.
- **te-recovery-status**: Local protection recovery state (active, inactive).

## 2. Logical System Integration & UI Capabilities
- The tunnel configuration panel allows selecting protection types (e.g., 1+1, 1:N) and protection/restoration triggers.
- The system handles state changes dynamically when LSPs go through setting-up, setup-ok, setup-failed, or down transitions.

## 3. State Machine and Validation Flow
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> SettingUp : Initiate Session
    SettingUp --> SetupOk : LSP Active
    SettingUp --> SetupFailed : Session Timed Out / Rejected
    SetupOk --> Down : Failure Detected
    Down --> Rerouting : Trigger Restoration
    Rerouting --> SetupOk : Restoration Path Established
```

## 4. BDD Given-When-Then Acceptance Criteria
- **Scenario 1: Set local protection preferences**
  - **Given** an operator configures an RSVP-TE session attributes
  - **When** the operator checks `local-protection-desired` and `node-protection-desired`
  - **Then** the control plane requests fast reroute capability from downstream routers.

## 5. Specification Context
> This feature defines encoding types, switching capabilities, protection schemes, and restoration types.

## 6. Source References
YANG Schema: [ietf-te-types.yang](https://github.com/YangModels/yang/blob/954277fad0534e9b0b495774255b0c4ce854f8b2/experimental/ietf-extracted-YANG-modules/ietf-te-types%402026-05-08.yang)
Normative Specification: [draft-ietf-teas-rfc8776-update](https://datatracker.ietf.org/doc/draft-ietf-teas-rfc8776-update/)
