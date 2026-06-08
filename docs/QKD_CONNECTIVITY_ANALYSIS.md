# ETSI QKD SDN Connectivity Analysis

This document summarizes the key elements of the `etsi-qkd-sdn-connectivity` YANG model (ETSI GS QKD 018 V1.1.1). This module defines how external applications consume QKD services and how paths are provisioned.

---

## 1. Core Entities

### A. QKD Application (`qkd_app`)
- **Identifier**: `app_id`.
- **Role**: Represents an external consumer of QKD keys.
- **Attributes**: Includes QoS requirements, statistics, and timing information.

### B. Application to Service Link Mapping
- Each application is mapped to a `svc_link` (defined in the Topology model).
- This mapping links the logical application request to the underlying virtual key association link.

---

## 2. Path Management & Provisioning

The connectivity model introduces a sophisticated path calculation and deployment workflow:

### A. Candidate Paths
- **Definition**: A list of potential end-to-end key relay paths.
- **Structure**: Each path is a sequence of `phys_link_id`s.
- **Constraints**: Paths can be calculated by including or excluding specific nodes (`qkdn`) or interfaces (`qkdi`).

### B. Deployed Path
- **Definition**: The specific path selected from the candidates and activated for the service link.

---

## 3. Performance Metrics

The model tracks key generation performance:
- **SKR (Secret Key Rate)**: The raw generation rate of the link.
- **Expected Consumption**: The bandwidth required by the external application.
- **ESKR (Effective Secret Key Rate)**: The remaining rate available after application consumption.

---

## 4. RPCs & Workflow (The "Provisioning Lifecycle")

1. **Registration**: `app-registration` registers the consumer.
2. **Link Assignment**: `create-service-link-id-for-app` assigns a logical service link.
3. **Path Discovery**: `create-candidate-paths-per-service-link-for-app` returns potential physical routes.
4. **Deployment**: `deploy-a-candidate-path-per-service-link-for-app` activates the chosen route.

---

## 5. Design Implications for TFS Dashboard

1. **Application Dashboard**:
   - A new top-level view for "QKD Applications".
   - Status indicators for each app (New, Deployed, Disconnected).
   - Real-time alarm monitoring specifically for application-level issues.

2. **Interactive Path Selection**:
   - When provisioning a service, the UI should display multiple "Candidate Paths" on the topology map (e.g., using different colors or dashed lines).
   - Users should be able to click a path on the map to select it for deployment.

3. **Constraint Management**:
   - A UI tool to "lasso" or select nodes on the topology map to mark them as "Excluded" or "Included" for path calculation.

4. **Performance Visualization**:
   - Gauges or sparklines for SKR vs. ESKR to visualize link "headroom" and congestion.
