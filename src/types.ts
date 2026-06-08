import { LucideIcon } from 'lucide-react';
import { L0GridType, DWDMChannelSpacing, CWDMChannelSpacing } from './lib/ietfLayer0Types';

export interface TEMetrics {
  defaultMetric: number;
  administrativeGroup: string; // e.g., "0x00000001"
  priorityLevel: string; // e.g., "Priority 3 (Gold Class)"
  oneWayDelay: string; // e.g., "4.82 ms"
  delayVariation: string; // e.g., "0.08 ms"
  packetLoss: string; // e.g., "0.0001% (Protected)"
}

export interface LinkProtection {
  protectionType: string; // e.g., "1+1 Optical Backup", "1+1 Microwave Hot Standby"
  dynamicRestoration: string; // e.g., "Enabled (WSON Phase)"
  switchoverTime: string; // e.g., "< 45 ms"
  srlgs: number[]; // e.g., [104, 208, 301, 712]
}
export type NetworkLayer = 
  | 'L0 (Optical)'
  | 'L1 (Transport)'
  | 'L2 (Ethernet)'
  | 'L3 (IP/MPLS)'
  | 'Mobile (RAN/Core)';

export const NetworkLayer = {
  L0_OPTICAL: 'L0 (Optical)',
  L1_TRANSPORT: 'L1 (Transport)',
  L2_ETHERNET: 'L2 (Ethernet)',
  L3_IP_MPLS: 'L3 (IP/MPLS)',
  MOBILE: 'Mobile (RAN/Core)'
} as const;

export interface SoftwarePatch {
  revision: string;
}

export interface SoftwareRev {
  name: string;
  revision: string;
  patch?: SoftwarePatch[];
}

export interface HardwareComponent {
  uuid: string; // component-id
  name: string;
  class: 'chassis' | 'module' | 'port' | 'container' | 'transceiver' | string;
  manufacturer?: string; // mfg-name
  partNumber?: string; // part-number
  serialNumber?: string; // serial-number
  parentUuid?: string; // parentUuid link
  status: 'active' | 'inactive' | 'faulty';
  ietfGeoLocation?: IETFGeoLocation;
  facilityLocation?: FacilityLocation;

  // Epic 4 additions
  alias?: string;
  description?: string;
  hardwareRev?: string;
  mfgDate?: string; // yang:date-and-time
  assetId?: string;
  isFru?: boolean;
  uri?: string[]; // leaf-list of inet:uri
  parent?: string[]; // Leaf-list representing parents
  parentRelPos?: string; // relative position respect to parent among siblings
  isMain?: boolean; // is-main (only applicable for chassis class)
  softwareRev?: SoftwareRev[]; // list of software modules running on component
}

export interface IETFSystemState {
  contact?: string;
  hostname: string;
  location?: string;
  platform: {
    osName: string;
    osRelease: string;
    osVersion: string;
    machine: string;
  };
  clock: {
    timezoneName?: string;
    currentDatetime?: string;
    bootDatetime?: string;
  };
}

export interface IETFGeoLocation {
  referenceFrame: {
    alternateSystem?: string;
    astronomicalBody: string;
    geodeticSystem: {
      geodeticDatum: string;
      coordAccuracy?: number;
      heightAccuracy?: number;
    };
  };
  location: {
    ellipsoid?: {
      latitude: number;
      longitude: number;
      height?: number;
    };
    cartesian?: {
      x: number;
      y: number;
      z: number;
    };
  };
  velocity?: {
    vNorth: number;
    vEast: number;
    vUp: number;
  };
  timestamp?: string;
  validUntil?: string;
}

export interface IETFInterface {
  name: string;
  description?: string;
  type: string;
  enabled: boolean;
  adminStatus: 'up' | 'down' | 'testing';
  operStatus: 'up' | 'down' | 'testing' | 'unknown' | 'dormant' | 'not-present' | 'lower-layer-down';
  speed?: number; // bits/second
  physAddress?: string;
  opticalChannelFreqGhz?: number;
  opticalChannelWavelengthNm?: number;
  otnLinkTp?: any;
  activePortRef?: string;
  supportingTerminationPoints?: string[];
  statistics?: {
    inOctets: number;
    inUnicastPkts: number;
    inErrors: number;
    inDiscards: number;
    outOctets: number;
    outUnicastPkts: number;
    outErrors: number;
    outDiscards: number;
  };
  portBreakout?: {
    enabled: boolean;
    breakoutChannels: {
      channelId: number;
      speed?: number;
      status?: 'up' | 'down';
    }[];
  };
}

export interface IETFAclEntry {
  name: string;
  matches: string;
  actions: { forwarding: 'accept' | 'drop' | 'reject', logging: string };
}

export interface NetworkElement {
  uuid: string; // ne-id
  name: string;
  type: string; // ne-type (defaults to 'ne-physical')
  layer: NetworkLayer;
  location: string;
  ietfSystem?: IETFSystemState;
  ietfGeoLocation?: IETFGeoLocation;
  ietfInterfaces?: IETFInterface[];
  ietfAccessControlList?: IETFAclEntry[];
  hardware: HardwareComponent[];
  services: ServiceInstance[];

  // Epic 4 additions
  alias?: string;
  description?: string;
  productRev?: string;
  mfgName?: string;
  productName?: string;
  softwareRev?: SoftwareRev[];

  // Epic 5 additions
  inventoryMappingAttributes?: {
    neRef?: string; // Reference link to physical Network Element id in inventory
  };

  // Extra generic property to support extended mock data
  facilityLocation?: any;
}

export interface ServiceInstance {
  uuid: string;
  name: string;
  type: 'E-Line' | 'E-Tree' | 'E-LAN' | 'OTN-ODU' | 'L3VPN';
  layer: NetworkLayer;
  endpoints: string[]; // UUIDs of ports
  bandwidthUnits: string;
  bandwidthValue: number;
  status: 'up' | 'down' | 'degraded';
}

export interface NetworkTopology {
  nodes: NetworkElement[];
  links: NetworkLink[];
}

export interface NetworkLink {
  uuid: string;
  sourceNodeUuid: string;
  sourcePortUuid: string;
  targetNodeUuid: string;
  targetPortUuid: string;
  layer: NetworkLayer;
  capacity: string;
  usage: number; // percentage

  // Epic 5 additions
  inventoryMappingAttributes?: {
    linkType?: 'copper' | 'fiber' | 'coax' | 'microwave' | 'wlan' | 'unknown' | 'leased-fiber' | 'free-space-optics';
  };
  teMetrics?: TEMetrics;
  protection?: LinkProtection;
}

// Epic 6 Passive Inventory additions

export interface PassivePort {
  id: string; // port identifier
  portType: 'service-port' | 'input-port' | 'output-port' | 'p2mp-port';
  fiberCoreNum?: number; // fiber core number or optical indexing
}

export type PassiveDeviceType = 'ODF' | 'WDM' | 'FAT' | 'FDT' | 'ATB';

export interface PassiveDevice {
  id: string;
  name?: string;
  deviceType: PassiveDeviceType;
  customTags?: string[]; // RFID, barcode, QR codes
  locationRef?: string; // Links to ni-location room/site or postal address
  passivePorts: PassivePort[];
}

export interface ConnectedDeviceEnd {
  deviceType: 'passive-device' | 'active-device';
  deviceId?: string; // used when passive-device
  neRef?: string; // referenced active network element id/uuid
  componentRef?: string; // referenced active container or port component id/uuid
}

export interface ChildCable {
  id: string; // references another cable's id
  index: number; // concatenation spliced ordering index
  length: number; // length of this specific child segment
}

export interface PassiveCable {
  id: string;
  name?: string;
  alias?: string;
  description?: string;
  cableType: 'optical-fiber' | 'electrical-cable' | 'coaxial-cable';
  cableRole: 'backbone' | 'aggregation' | 'access' | 'trunk' | 'distribution' | 'branch';
  length: number; // uint32 in meters
  aEnd: ConnectedDeviceEnd;
  zEnd: ConnectedDeviceEnd;
  childCables?: ChildCable[]; // min-elements 2 when defined for concatenated splice
  opticalCable?: {
    fiberCoreNum: number;
    fiberType: 'G652A' | 'G652B' | 'G652C' | 'G652D' | 'G653' | 'G654' | 'G655' | 'G656' | 'G657A1' | 'G657A2' | 'G657B' | 'other';
    attenuation: number; // attenuation in dB
  };
}

// Epic 7 RFC 8345 Network Base Model additions

export interface SupportingNetwork {
  networkRef: string; // network-ref (network-id)
}

export interface SupportingNode {
  networkRef: string; // From supporting-network
  nodeRef: string; // From supporting-node
}

export interface RFC8345Node {
  nodeId: string; // node-id (URI)
  name?: string;
  supportingNodes?: SupportingNode[]; // supporting-node list
  description?: string;
  terminationPoints?: RFC8345TerminationPoint[]; // Added for Epic 9 RFC 8345 network topology module

  // Live Optical equipment mapping (RFC 8345 + RFC 9093 / Layer 0 Types)
  activeNeRef?: string; // Linked physical active network element id in Japan
  chassis?: {
    chassisId: string;
    name: string;
    manufacturer: string;
    partNumber: string;
    serialNumber: string;
    status: 'active' | 'inactive' | 'faulty';
    isMain?: boolean;
    alias?: string;
    description?: string;
    hardwareRev?: string;
    mfgDate?: string;
    assetId?: string;
  };
  modules?: {
    uuid: string;
    name: string;
    class: string;
    parentUuid?: string;
    manufacturer?: string;
    partNumber?: string;
    serialNumber?: string;
    status: 'active' | 'inactive' | 'faulty';
    alias?: string;
    hardwareRev?: string;
    mfgDate?: string;
  }[];
  gridConfig?: {
    gridType: L0GridType;
    priority: number;
    dwdmSpacing?: DWDMChannelSpacing;
    cwdmSpacing?: CWDMChannelSpacing;
    dwdmN?: number;
    cwdmN?: number;
    flexiN?: number;
    flexiM?: number;
    centralFrequencyGhz?: number;
    centralWavelengthNm?: number;
    slotWidthGhz?: number;
  };

  // Epic 13 otn-node configuration
  otnNode?: {
    presence?: boolean;
  };
}

export interface RFC8345Network {
  networkId: string; // network-id (URI)
  name?: string;
  description?: string;
  networkTypes?: {
    type?: 'L0-optical' | 'L1-transport' | 'L2-ethernet' | 'L3-ip-overlay' | 'virtual' | 'physical' | string;
  };
  otnTopology?: boolean; // presence "Indicates that this is an OTN topology"
  supportingNetworks?: SupportingNetwork[]; // supporting-network list
  nodes: RFC8345Node[]; // node list
  links?: RFC8345Link[]; // Added for Epic 9 RFC 8345 network topology module
}

// Epic 9 RFC 8345 Network Topology Model additions

export interface SupportingTerminationPoint {
  networkRef: string; // network-ref
  nodeRef: string;    // node-ref
  tpRef: string;      // tp-ref
}

export interface RFC8345TerminationPoint {
  tpId: string; // tp-id (URI)
  supportingTerminationPoints?: SupportingTerminationPoint[];
  ipAddress?: string; // L3 logical IP Address (e.g. 10.0.1.1/24)

  // Optical physical mapping details
  activePortRef?: string; // Linked physical active port UUID
  opticalChannelFreqGhz?: number;
  opticalChannelWavelengthNm?: number;
  transceiver?: {
    uuid: string;
    name: string;
    manufacturer?: string;
    partNumber?: string;
    serialNumber?: string;
    status: string;
    alias?: string;
    description?: string;
    hardwareRev?: string;
    mfgDate?: string;
  };

  // Epic 13 otn-link-tp parameters
  otnLinkTp?: {
    tsg?: string; // e.g. "tsg-1.25G" or "tsg-2.5G"
    supportedClientSignal?: { clientSignal: string }[];
  };
}

export interface SupportingLink {
  networkRef: string; // network-ref
  linkRef: string;    // link-ref
}

export interface RFC8345Link {
  linkId: string; // link-id (URI)
  source: {
    sourceNode: string; // source-node
    sourceTp: string;   // source-tp
  };
  destination: {
    destNode: string;   // dest-node
    destTp: string;     // dest-tp
  };
  supportingLinks?: SupportingLink[];

  // Epic 13 otn-link configuration
  otnLink?: {
    distance?: number; // uint32 in kilometers
  };

  // Feature 43: Fine-grain OTN unreserved and mapping
  fgotnList?: {
    oduType: string;        // identityref, e.g. "fgotn-types:fgODUflex"
    oduTsNumber: string;    // type fgotnt:ts-list (ascending / disjoint)
    fgotnBandwidth: number; // uint16 in Mbps
  }[];

  fgtsRange?: {
    oduType: string;        // identityref
    oduTsNumber: string;    // fgotnt:ts-list
    fgtsReserved: string;   // fgotnt:ts-list (reserved slots)
    fgtsUnreserved: string; // fgotnt:ts-list (unreserved slots)
  }[];

  teMetrics?: TEMetrics;
  protection?: LinkProtection;
}



export interface FacilityLocation {
  siteName: string;
  buildingOrHut: string;
  roomOrHall?: string;
  rackIdentifier: string;
  rackPosition?: number;
  notes?: string;
}
