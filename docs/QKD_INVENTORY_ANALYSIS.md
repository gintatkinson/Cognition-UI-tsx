# ETSI QKD SDN Inventory Analysis

This document summarizes the key elements of the `etsi-qkd-sdn-inventory` YANG model (ETSI GS QKD 018 V1.1.1). This module augments the topology with detailed hardware and performance metadata.

---

## 1. Node & Interface Inventory

### A. SD-QKD Node Details (`qkdn_details`)
- **KME Endpoint**: Defines the IP and Port of the Key Management Entity (KME) that provides keys to external apps.
- **Location**: Secure area identifier where the node is physically located.
- **Capabilities**: Versioning and functional capabilities of the node.

### B. QKD Interface Details (`qkdi_details`)
- **Role Support**: Defines if the module supports specific key relay modes.
- **Hardware Metadata**: Model, type, and attachment point information.

---

## 2. Link Inventory & Performance

### A. Physical Link Details
- **Wavelength**: The specific wavelength (nm) used for the quantum channel.
- **Operational Control**: An `enable` toggle to start/stop the key generation process.
- **Performance**: Real-time SKR (Secret Key Rate) and ESKR (Effective Secret Key Rate).

### B. Service Link Details
- **Bandwidth Reservation**: The specific bandwidth (bps) reserved from the underlying physical links.
- **Path Restoration**:
  - **Type**: `AUTOMATIC` or `MANUAL`.
  - **Hold-off Time**: Delay (ms) before attempting restoration after a failure.

---

## 3. Real-Time Monitoring (Notifications)

The inventory model is highly dynamic, providing notifications for:
- **New Resources**: Discovery of new nodes, interfaces, or links.
- **Performance Updates**: Periodic updates of key generation rates.
- **Overload Alerts**: Triggered when consumption exceeds generation capacity.
- **Alarms**: Severity-based alerts for hardware or link failures.

---

## 4. Design Implications for TFS Dashboard

1. **Hardware Inventory View**:
   - A dedicated "Inventory" tab in the Device Detail view showing KME endpoints and physical module models.
   - A "Location" field to help operators find the physical secure area during maintenance.

2. **Link Control Center**:
   - A toggle switch in the Link Detail view to "Enable/Disable Key Generation" (mapping to the `enable` leaf).
   - Configuration forms for **Path Restoration** settings (Hold-off time, Auto/Manual toggle).

3. **Performance Gauges**:
   - Visual indicators for **Wavelength** usage across the topology.
   - "Overload" status badges that appear on links when the `sdqkdn_phys_link_overloaded` notification is received.

4. **Advanced Telemetry**:
   - Time-series charts for SKR vs. ESKR to identify trends in key generation efficiency.
