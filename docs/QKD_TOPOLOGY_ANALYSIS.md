# ETSI QKD SDN Topology Analysis

This document summarizes the key architectural elements of the `etsi-qkd-sdn-topology` YANG model (ETSI GS QKD 018 V1.1.1). This model is critical for future design iterations involving Quantum Key Distribution (QKD) support in the TFS Controller.

---

## 1. Core Entities

### A. SD-QKD Node (`qkdn`)
- **Identifier**: `qkdn_id` (Unique within the network).
- **Components**: Contains a set of QKD Interfaces.
- **Role**: Represents a software-defined node in the QKD network.

### B. QKD Interface (`qkdi`)
- **Identifier**: `qkdi_id`.
- **Role**: Represents the physical QKD modules within a node. Links terminate at these interfaces.

### C. QKD Links
The model distinguishes between physical connectivity and logical service connectivity.

#### 1. Physical Link (`phys_link`)
- **Type**: `PHYS`.
- **Connectivity**: Directly connects two SD-QKD nodes via specific interfaces (`qkdi`).
- **Source/Destination**: Defined by `phys_link_local_qkdn` and `phys_link_remote_qkdn`.

#### 2. Service Link (`svc_link`)
- **Type**: `VIRT`.
- **Connectivity**: Represents end-to-end key association links.
- **Role**: Logical links that may span multiple physical hops for key distribution.

---

## 2. Relationship Mapping

- **Node -> Interface**: 1-to-Many relationship.
- **Link -> Interface**: Each link (physical or service) references a specific `qkdn_id` and `qkdi_id` for both local and remote ends.
- **Topology Structure**:
  - `qkd_network` (Root)
    - `sdqkd_nodes` (List of nodes)
    - `qkd_links`
      - `qkd_phys_links` (Physical topology)
      - `qkd_svc_links` (Service/Virtual topology)

---

## 3. Design Implications for TFS Dashboard

1. **Topology Visualization**:
   - The UI must support toggling between **Physical View** (showing fiber/hardware connections) and **Service View** (showing key association paths).
   - Nodes should visually represent their internal interfaces if a drill-down is requested.

2. **Data Modeling**:
   - Our `Device` type in the dashboard should be extended to support `qkdn` attributes.
   - Our `Link` type should include a `link_type` discriminator (`PHYS` vs `VIRT`).

3. **Navigation**:
   - Users should be able to navigate from a `svc_link` to the underlying `phys_links` that support it (though the mapping logic would reside in the TFS backend).

4. **Schema Validation**:
   - When onboarding QKD devices, the dashboard should validate that interface IDs correctly reference the containing node ID, as per the YANG `leafref` constraints.
