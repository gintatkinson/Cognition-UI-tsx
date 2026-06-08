
import { Device, Link, Service, Slice, Context, Topology, QKDDevice } from '../types/tfs';

export const MOCK_CONTEXTS: Context[] = [
  { id: 'admin', name: 'Admin Context', topology_ids: ['admin-topo'], service_ids: ['svc-1', 'svc-2'], slice_ids: ['slice-1'] },
  { id: 'tenant-a', name: 'Tenant A', topology_ids: ['tenant-a-topo'], service_ids: [], slice_ids: [] },
];

export const MOCK_TOPOLOGIES: Topology[] = [
  { id: 'admin-topo', name: 'Core Topology', context_id: 'admin', device_ids: ['d1', 'd2', 'd3', 'd4', 'q1', 'q2', 'q3'], link_ids: ['l1', 'l2', 'l3', 'ql1', 'ql2'] },
];

export const MOCK_DEVICES: (Device | QKDDevice)[] = [
  { id: 'd1', name: 'R1-Core', type: 'ROUTER', status: 'OPERATIONAL', endpoints: ['eth0', 'eth1'], drivers: ['p4', 'openflow'] },
  { id: 'd2', name: 'R2-Core', type: 'ROUTER', status: 'OPERATIONAL', endpoints: ['eth0', 'eth1', 'eth2'], drivers: ['p4'] },
  { id: 'd3', name: 'SW1-Edge', type: 'SWITCH', status: 'OPERATIONAL', endpoints: ['p1', 'p2', 'p3'], drivers: ['openflow'] },
  { id: 'd4', name: 'SW2-Edge', type: 'SWITCH', status: 'DISABLED', endpoints: ['p1', 'p2'], drivers: ['openflow'] },
  // QKD Nodes
  { 
    id: 'q1', 
    name: 'QKD-Node-Alpha', 
    type: 'QKD_NODE', 
    status: 'OPERATIONAL', 
    endpoints: ['q0', 'q1'], 
    drivers: ['etsi_gs_qkd_015'],
    qkd_capabilities: {
      max_skr: 1024000,
      supported_protocols: ['BB84', 'COW'],
      quantum_channel_type: 'FIBER',
      internal_temperature: 24.5,
      laser_status: 'STABLE',
      key_pool_capacity: 1000000,
      key_pool_available: 842000,
      active_sessions: 12,
      quantum_bit_error_rate: 1.2,
      sync_status: 'LOCKED',
      firmware_compliance: ['ETSI GS QKD 014', 'ETSI GS QKD 015', 'ETSI GS QKD 018']
    }
  },
  { 
    id: 'q2', 
    name: 'QKD-Node-Beta', 
    type: 'QKD_NODE', 
    status: 'OPERATIONAL', 
    endpoints: ['q0', 'q1'], 
    drivers: ['etsi_gs_qkd_015'],
    qkd_capabilities: {
      max_skr: 512000,
      supported_protocols: ['BB84'],
      quantum_channel_type: 'FIBER',
      internal_temperature: 26.2,
      laser_status: 'WARNING',
      key_pool_capacity: 500000,
      key_pool_available: 120000,
      active_sessions: 4,
      quantum_bit_error_rate: 3.8,
      sync_status: 'SEARCHING',
      firmware_compliance: ['ETSI GS QKD 014', 'ETSI GS QKD 015']
    }
  },
  { 
    id: 'q3', 
    name: 'QKD-Node-Gamma', 
    type: 'QKD_NODE', 
    status: 'ERROR', 
    endpoints: ['q0'], 
    drivers: ['etsi_gs_qkd_015'],
    qkd_capabilities: {
      max_skr: 0,
      supported_protocols: ['BB84'],
      quantum_channel_type: 'FREE_SPACE',
      internal_temperature: 45.0,
      laser_status: 'CRITICAL',
      key_pool_capacity: 250000,
      key_pool_available: 0,
      active_sessions: 0,
      quantum_bit_error_rate: 100,
      sync_status: 'LOST',
      firmware_compliance: ['ETSI GS QKD 014']
    }
  },
];

export const MOCK_LINKS: Link[] = [
  { id: 'l1', source: 'd1', target: 'd2', source_endpoint: 'eth0', target_endpoint: 'eth0', capacity: '100Gbps', latency: '2ms', type: 'OPTICAL' },
  { id: 'l2', source: 'd2', target: 'd3', source_endpoint: 'eth1', target_endpoint: 'p1', capacity: '40Gbps', latency: '5ms', type: 'OPTICAL' },
  { id: 'l3', source: 'd1', target: 'd3', source_endpoint: 'eth1', target_endpoint: 'p2', capacity: '40Gbps', latency: '6ms', type: 'OPTICAL' },
  // Quantum Links
  { id: 'ql1', source: 'q1', target: 'q2', source_endpoint: 'q0', target_endpoint: 'q0', capacity: '1.2Mbps', latency: '0.1ms', type: 'QUANTUM' },
  { id: 'ql2', source: 'q2', target: 'q3', source_endpoint: 'q1', target_endpoint: 'q0', capacity: '0.8Mbps', latency: '0.2ms', type: 'QUANTUM' },
];

export const MOCK_SERVICES: Service[] = [
  { id: 'svc-1', name: 'L3VPN-Enterprise', type: 'L3VPN', status: 'ACTIVE', context_id: 'admin', endpoints: ['d1/eth0', 'd3/p3'] },
  { id: 'svc-2', name: 'L2VPN-Backup', type: 'L2VPN', status: 'PENDING', context_id: 'admin', endpoints: ['d2/eth2', 'd3/p1'] },
];

export const MOCK_SLICES: Slice[] = [
  { id: 'slice-1', name: '5G-Enhanced-Mobile-Broadband', type: 'eMBB', status: 'ACTIVE', context_id: 'admin', service_ids: ['svc-1'] },
  { id: 'slice-2', name: 'Ultra-Reliable-Low-Latency', type: 'URLLC', status: 'ACTIVE', context_id: 'admin', service_ids: [] },
];
