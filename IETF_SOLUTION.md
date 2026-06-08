# IETF Network Data Model Implementation

This document details the recent enhancements made to the platform to support strict IETF standards (YANG models) for network inventory, topology, and element management.

## Overview
The application was transitioned from using generic, structurally flat mock data to a rich, standard-compliant architecture that mirrors how real Carrier-Grade Network Management Systems (NMS) and SDN Controllers model complex, multi-layer (L0/L1/L2/L3/Mobile) networks.

## RFCs and YANG Models Supported

The following core IETF YANG models were adapted into the application's TypeScript data structures and UI bindings:

*   **`ietf-system` (RFC 7317)**: Provides platform details (OS name, version, architecture), system clock (timezone, boot time), and hostname/contact information.
*   **`ietf-hardware` (RFC 8348)**: Represents the physical hierarchy of the device (Chassis -> Modules/Line Cards -> Transceivers/Ports) along with serial numbers and operational statuses. 
*   **`ietf-interfaces` (RFC 8343)**: Details network interfaces, mapping layer capabilities (`iana-if-type:opticalChannel`, `ethernetCsmacd`), administrative/operational states, speeds, MAC addresses, and live traffic statistics.
*   **`ietf-geo-location` (RFC 9179)**: Standardizes physical site representation using astronomical bodies, reference datums (e.g., WGS-84), and ellipsoid coordinates (latitude, longitude, height).
*   **`ietf-access-control-list` (RFC 8519)**: Captures security/forwarding policies provisioned on the nodes.
*   **`ietf-te-topology` / `ietf-l2vpn-svc` (RFC 8795 / 8466)**: Used as the basis for cross-layer Service Instances (e.g., E-Line, OTN-ODU) and Network Links.

## Technical Implementation

### 1. Data Structures (`src/types.ts`)
We created dedicated TypeScript interfaces representing the JSON-encoded equivalents of the YANG models:
*   `IETFSystemState`
*   `IETFGeoLocation`
*   `IETFInterface`
*   `IETFAclEntry`
*   Enhanced `NetworkElement` and `HardwareComponent` to nest these properties.

### 2. Network Service (`src/services/networkService.ts`)
We implemented a Singleton `NetworkService` that serves a rich `ietfTopology`. This replaced the flat `MOCK_DEVICES` array. The service mocks an integrated transport network consisting of:
*   **ROADM Nodes (L0/L1)**: With Optical Channel interfaces and ODU4 services.
*   **Carrier Ethernet Switches (L2)**: With Gigabit Ethernet interfaces, complex hardware hierarchies, and ACLs.
*   **Mobile Radio Units (RAN)**: Representing edge sites with precise geolocation datums.

### 3. User Interface Enhancements
*   **`IETFExplorerView`**: A dedicated high-level dashboard (`/src/components/views/IETFExplorerView.tsx`) added to the sidebar to summarize the inventory by IETF domain (Optical, Ethernet, IP/MPLS, Mobile) and surface a nested hardware inspector.
*   **`DetailView`**: Heavily upgraded the device inspector (`/src/components/views/DetailView.tsx`) to dynamically render specific cards when IETF data is present:
    *   **IETF Network Element Model**: General UUID, Type, and Layer info.
    *   **System Details (`ietf-system`)**: Shows OS, Architecture, Boot/Current time, Timezone.
    *   **Geo-Location (`ietf-geo-location`)**: Renders high-precision lat/long and reference body.
    *   **Interfaces (`ietf-interfaces`)**: A detailed data table showing interface names, IANA types, Admin/Oper status dots, bandwidth speed, and live traffic `inOctets`/`outOctets`.
    *   **Hardware State (`ietf-hardware`)**: Displays the physical components grouped cleanly.
    *   **Access Control (`ietf-access-control-list`)**: Shows provisioned rules and forwarding actions.
*   **Topology, Devices, and Links Views**: Updated to directly consume the `NetworkService` avoiding legacy flat mocks.
*   **Complete Mock Data Transition**: We completely replaced the flat `MOCK_DEVICES` (like R1-Core "d1", "d2", "q1", etc) inside `DashboardView` and `NetworkService.ts` with deep `NetworkElement` records containing precise `ietfSystem`, `ietfInterfaces`, and nested hardware structures. Whenever you click on *any* existing device (like `d1`), you will now see its fully normalized IETF YANG equivalent dataset across all layers without falling back to naked parameters!

### 4. Local Schema Cache
We started a local repository (`/yang/`) to store raw YANG schema files (e.g., `ietf-system.yang`, `ietf-netconf-acm.yang`) for future integration with validation or automatic form-generation libraries.

## Next Steps
This robust data foundation enables several future integrations:
1. Connecting a real NETCONF/RESTCONF client backend to stream live operational data into this UI.
2. Expanding the topological link representations (e.g. visualizing `ietf-network-topology` path vectors).
3. Utilizing a YANG-to-TypeScript code generation library to automate updates to `src/types.ts` as new IETF modules are introduced.
