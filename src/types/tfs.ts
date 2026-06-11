
export type DeviceStatus = 'OPERATIONAL' | 'DISABLED' | 'ERROR';

export interface Device {
  id: string;
  name: string;
  type: string;
  status: DeviceStatus;
  endpoints: string[];
  drivers: string[];
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
}

export interface QKDDevice extends Device {
  qkd_capabilities?: {
    max_skr: number; // Secret Key Rate in bps
    supported_protocols: string[];
    quantum_channel_type: 'FIBER' | 'FREE_SPACE';
    internal_temperature?: number;
    laser_status?: 'STABLE' | 'WARNING' | 'CRITICAL';
    // ETSI GS QKD 014/015/018 specific metrics
    key_pool_capacity?: number; // Total keys capacity
    key_pool_available?: number; // Currently available keys
    active_sessions?: number;
    quantum_bit_error_rate?: number; // QBER %
    sync_status?: 'LOCKED' | 'SEARCHING' | 'LOST';
    firmware_compliance?: string[]; // e.g. ["ETSI GS QKD 014", "ETSI GS QKD 015"]
  };
}

export interface Link {
  id: string;
  source: string;
  target: string;
  source_endpoint: string;
  target_endpoint: string;
  capacity?: string;
  latency?: string;
  layer?: string;
  type?: 'OPTICAL' | 'QUANTUM' | string;
}

export interface QKDApp {
  id: string;
  name: string;
  status: 'ON' | 'OFF' | 'OUT_OF_TIME' | 'ZOMBIE';
  local_device_id: string;
  remote_device_id: string;
  qos: {
    max_bandwidth: number;
    min_bandwidth: number;
    jitter: number;
    ttl: number;
  };
}

export interface TransClientAccessParameters {
  'access-node-id'?: string;
  'access-node-uri'?: string;
  'access-ltp-id'?: string;
  'access-ltp-uri'?: string;
  'client-signal'?: string;
}

export interface TransClientErrorInfo {
  'error-code'?: string;
  'error-description'?: string;
  'error-timestamp'?: string;
}

export interface TransClientPmState {
  'laser-bias-current'?: number;
  'optical-power-rx'?: number;
  'optical-power-tx'?: number;
}

export interface TransClientServiceInstance {
  'client-svc-name': string;
  'client-svc-title'?: string;
  'user-label'?: string;
  'client-svc-descr'?: string;
  'client-svc-customer'?: string;
  'admin-status': 'up' | 'down';
  'operational-state'?: 'up' | 'down' | 'testing';
  'provisioning-state'?: 'active' | 'degraded' | 'pending';
  direction?: 'uni-directional' | 'bi-directional';
  resilience?: {
    'resilience-type'?: string;
  };
  'alarm-threshold'?: {
    'latency-threshold'?: number;
  };
  latency?: number;
  'src-access-ports'?: TransClientAccessParameters;
  'dst-access-ports'?: TransClientAccessParameters;
  'svc-tunnels'?: { 'tunnel-name': string }[];
  'pm-state'?: TransClientPmState;
  'error-info'?: TransClientErrorInfo;
  metadata?: {
    'created-by'?: string;
    'creation-time'?: string;
    'last-updated-by'?: string;
    'last-updated-time'?: string;
    'owned-by'?: string;
  };
}

export interface TransClientService {
  'client-svc-instances'?: TransClientServiceInstance[];
}

export interface Service {
  id: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'PLANNED' | 'PENDING' | 'ERROR';
  context_id: string;
  endpoints: string[];
  clientSvc?: TransClientService;
}

export interface OduPmObjective {
  duration: 'pm-15m' | 'pm-24h';
  'pm-type': 'odu-bbe' | 'odu-es' | 'odu-ses' | 'odu-uas' | 'odu-ber' | 'bit-error-rate';
  'pm-threshold': number;
}

export interface Slice {
  id: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'PLANNED' | 'PENDING' | 'ERROR';
  context_id: string;
  service_ids: string[];
  otn?: {
    'odu-signal-quality'?: {
      'odu-pm-objective'?: OduPmObjective[];
    };
  };
}

export interface Context {
  id: string;
  name: string;
  topology_ids: string[];
  service_ids: string[];
  slice_ids: string[];
}

export interface Topology {
  id: string;
  name: string;
  context_id: string;
  device_ids: string[];
  link_ids: string[];
}

export interface Dot1qTagClassifier {
  'tag-type': 'c-vlan' | 's-vlan';
  'vlan-mode': 'single' | 'range' | 'any';
  'vlan-id'?: number | 'any';
  'vlan-ids'?: string;
}

export interface Dot1qPriorityRegenTable {
  priority0: number;
  priority1: number;
  priority2: number;
  priority3: number;
  priority4: number;
  priority5: number;
  priority6: number;
  priority7: number;
}

export interface Dot1qPcpDecodingEntry {
  pcp: number;
  priority: number;
  'drop-eligible': boolean;
}

export interface Dot1qPcpEncodingEntry {
  'pcp-selection-type': number;
  pcp: number;
  dei: boolean;
}

export interface Dot1qTrafficClassEntry {
  priority: number;
  'traffic-class': number;
}

export interface Dot1qTrafficClassTable {
  'traffic-class-map': Dot1qTrafficClassEntry[];
  'num-traffic-class'?: number;
}

export interface Dot1qTransmissionSelectionEntry {
  'traffic-class': number;
  'transmission-selection-algorithm': 'strict-priority' | 'credit-based-shaper' | 'enhanced-transmission-selection' | 'asynchronous-traffic-shaping' | 'vendor-specific';
}

export interface Dot1qPriorityMapping {
  'priority-regeneration-table'?: Dot1qPriorityRegenTable;
  'pcp-decoding-table'?: Dot1qPcpDecodingEntry[];
  'pcp-encoding-table'?: Dot1qPcpEncodingEntry[];
  'traffic-class-table'?: Dot1qTrafficClassTable;
  'transmission-selection-table'?: Dot1qTransmissionSelectionEntry[];
}

export interface Dot1qPortMapEntry {
  'port-ref': string;
  'control-element': 'forward' | 'filter' | 'discard';
}

export interface Dot1qStaticFilteringEntry {
  'address': string;
  'vlan-id': number;
  'port-map': Dot1qPortMapEntry[];
}

export interface Dot1qForwardingFiltering {
  'ingress-filtering'?: boolean;
  'acceptable-frame-types'?: 'admit-all' | 'admit-only-vlan-tagged' | 'admit-only-untagged-and-priority-tagged';
  'enable-filtering'?: boolean;
  'static-filtering-entries'?: Dot1qStaticFilteringEntry[];
}

export interface Dot1qBridgePortStatistics {
  'delay-exceeded-discards': number;
  'mtu-exceeded-discards': number;
  'discard-on-ingress-filtering': number;
  'discard-on-egress-filtering': number;
  'discard-inbound-acceptable-frame-type': number;
}


