
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

export interface Service {
  id: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'PLANNED' | 'PENDING' | 'ERROR';
  context_id: string;
  endpoints: string[];
}

export interface Slice {
  id: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'PLANNED' | 'PENDING' | 'ERROR';
  context_id: string;
  service_ids: string[];
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
