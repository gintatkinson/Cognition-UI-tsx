
import { 
  NetworkTopology, 
  NetworkElement, 
  NetworkLayer, 
  HardwareComponent, 
  ServiceInstance, 
  NetworkLink, 
  IETFGeoLocation,
  PassiveDevice,
  PassiveCable,
  PassivePort,
  ChildCable,
  RFC8345Network,
  RFC8345Node,
  SupportingNetwork,
  SupportingNode,
  SupportingLink,
  RFC8345Link,
  RFC8345TerminationPoint,
  SupportingTerminationPoint,
  OtnNrpProfile,
  OtnNrpObjective,
  Dot1qTagClassifier,
  Dot1qPriorityMapping,
  Dot1qForwardingFiltering,
  Dot1qBridgePortStatistics
} from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, connectFirestoreEmulator, doc, setDoc } from 'firebase/firestore';
import { Slice, OduPmObjective } from '../types/tfs';
import hardwareSpecs from '../lib/hardware-specs.json';
import { MOCK_DEVICES, MOCK_LINKS } from '../lib/mock-data';


const app = initializeApp({ projectId: 'demo-cognition-topology' });
export const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

export class NetworkService {
  private static instance: NetworkService;
  private topology: NetworkTopology;
  private hasInventoryTopology: boolean = true; // Enabled by default
  private passiveDevices: PassiveDevice[] = [];
  private passiveCables: PassiveCable[] = [];
  private rfc8345Networks: RFC8345Network[] = [];
  private slices: Slice[] = [];

  private constructor() {
    this.topology = { nodes: [], links: [] };
  }

  public async initialize(): Promise<void> {
    try {
      console.log('Fetching topology from Firebase Local Emulator...');
      const nodesSnap = await getDocs(collection(db, 'nodes'));
      const linksSnap = await getDocs(collection(db, 'links'));
      const passiveDevicesSnap = await getDocs(collection(db, 'passive-devices'));
      const passiveCablesSnap = await getDocs(collection(db, 'passive-cables'));
      const rfcNetworksSnap = await getDocs(collection(db, 'rfc8345-networks'));
      const slicesSnap = await getDocs(collection(db, 'slices'));
      
      const dbNodes = nodesSnap.docs.map(d => d.data() as NetworkElement);
      const dbLinks = linksSnap.docs.map(d => d.data() as NetworkLink);
      
      const mappedMockNodes: NetworkElement[] = MOCK_DEVICES.map(dev => {
        const typeStr = dev.type === 'QKD_NODE' ? 'QKD_NODE' : (dev.type === 'SWITCH' ? 'SWITCH' : 'ROUTER');
        return {
          uuid: dev.id,
          name: dev.name,
          type: typeStr as any,
          layer: dev.type === 'QKD_NODE' ? NetworkLayer.MOBILE : (dev.type === 'SWITCH' ? NetworkLayer.L2_ETHERNET : NetworkLayer.L3_IP_MPLS),
          location: 'Kanto Core Region',
          ietfSystem: {
            hostname: dev.name,
            contact: 'noc@legacy.net',
            platform: {
              osName: 'Junos OS',
              osRelease: '22.4R1',
              osVersion: '22.4',
              machine: 'x86_64'
            },
            clock: {
              timezoneName: 'Asia/Tokyo',
              currentDatetime: new Date().toISOString()
            }
          },
          ietfInterfaces: dev.endpoints.map((ep: string) => {
            const baseIface: any = {
              name: ep,
              type: ep.startsWith('q') ? 'iana-if-type:opticalChannel' : 'iana-if-type:ethernetCsmacd',
              enabled: dev.status === 'OPERATIONAL',
              adminStatus: dev.status === 'OPERATIONAL' ? 'up' : 'down',
              operStatus: dev.status === 'OPERATIONAL' ? 'up' : 'down',
              speed: ep.startsWith('q') ? 1200000 : 100000000000,
              physAddress: ep.startsWith('q') ? 'N/A' : `00:1A:2B:3C:${dev.id === 'd1' ? '11' : '22'}:${ep === 'eth0' ? '00' : '01'}`,
              description: `Active Core ${ep.startsWith('q') ? 'Quantum' : 'Ethernet'} Interface`
            };
            if (dev.id === 'd1' && ep === 'eth0') {
              baseIface['dot1q-bridge-port-vlan'] = {
                'tag-type': 'c-vlan',
                'vlan-mode': 'range',
                'vlan-ids': '10,20-30,50-100'
              };
              baseIface['dot1q-priority-mapping'] = {
                'priority-regeneration-table': {
                  priority0: 0,
                  priority1: 1,
                  priority2: 2,
                  priority3: 3,
                  priority4: 4,
                  priority5: 5,
                  priority6: 6,
                  priority7: 7
                },
                'traffic-class-table': {
                  'num-traffic-class': 8,
                  'traffic-class-map': [
                    { priority: 0, 'traffic-class': 0 },
                    { priority: 1, 'traffic-class': 1 },
                    { priority: 2, 'traffic-class': 2 },
                    { priority: 3, 'traffic-class': 3 },
                    { priority: 4, 'traffic-class': 4 },
                    { priority: 5, 'traffic-class': 5 },
                    { priority: 6, 'traffic-class': 6 },
                    { priority: 7, 'traffic-class': 7 }
                  ]
                },
                'transmission-selection-table': [
                  { 'traffic-class': 0, 'transmission-selection-algorithm': 'strict-priority' },
                  { 'traffic-class': 1, 'transmission-selection-algorithm': 'strict-priority' },
                  { 'traffic-class': 2, 'transmission-selection-algorithm': 'strict-priority' },
                  { 'traffic-class': 3, 'transmission-selection-algorithm': 'strict-priority' },
                  { 'traffic-class': 4, 'transmission-selection-algorithm': 'strict-priority' },
                  { 'traffic-class': 5, 'transmission-selection-algorithm': 'strict-priority' },
                ]
              };
              baseIface['dot1q-forwarding-filtering'] = {
                'ingress-filtering': true,
                'acceptable-frame-types': 'admit-all',
                'enable-filtering': true,
                'static-filtering-entries': [
                  {
                    'address': '00:1A:2B:3C:4D:5E',
                    'vlan-id': 10,
                    'port-map': [
                      { 'port-ref': 'eth0', 'control-element': 'forward' },
                      { 'port-ref': 'eth1', 'control-element': 'filter' }
                    ]
                  }
                ]
              };
              baseIface['dot1q-statistics'] = {
                'delay-exceeded-discards': 12,
                'mtu-exceeded-discards': 5,
                'discard-on-ingress-filtering': 42,
                'discard-on-egress-filtering': 18,
                'discard-inbound-acceptable-frame-type': 7
              };
            }
            return baseIface;
          }),
          hardware: [
            {
              uuid: `hw-ch-${dev.id}`,
              name: `${dev.name} Chassis`,
              class: 'chassis',
              manufacturer: 'Juniper Networks',
              partNumber: 'MX960-BASE',
              serialNumber: `SN-${dev.id.toUpperCase()}`,
              status: 'active' as const
            },
            ...dev.endpoints.flatMap((ep: string) => [
              {
                uuid: `hw-port-${dev.id}-${ep.replace('/', '-')}`,
                name: `Physical Port ${ep}`,
                class: 'port',
                parentUuid: `hw-ch-${dev.id}`,
                manufacturer: 'Juniper Networks',
                partNumber: 'EX-UM-4X4SFP',
                serialNumber: `SN-${dev.id.toUpperCase()}-PRT-${ep.toUpperCase().replace('/', '-')}`,
                status: 'active' as const
              },
              {
                uuid: `hw-tcvr-${dev.id}-${ep.replace('/', '-')}`,
                name: `SFP Transceiver - ${ep}`,
                class: 'transceiver',
                parentUuid: `hw-port-${dev.id}-${ep.replace('/', '-')}`,
                manufacturer: 'Juniper Networks',
                partNumber: 'SFP-10G-LR',
                serialNumber: `SN-${dev.id.toUpperCase()}-SFP-${ep.toUpperCase().replace('/', '-')}`,
                status: 'active' as const
              }
            ])
          ],
          services: []
        };
      });

      const mappedMockLinks: NetworkLink[] = MOCK_LINKS.map(link => {
        return {
          uuid: link.id,
          sourceNodeUuid: link.source,
          sourcePortUuid: link.source_endpoint,
          targetNodeUuid: link.target,
          targetPortUuid: link.target_endpoint,
          layer: link.type === 'QUANTUM' ? NetworkLayer.MOBILE : NetworkLayer.L3_IP_MPLS,
          capacity: link.capacity,
          usage: 20,
          inventoryMappingAttributes: {
            linkType: 'fiber'
          },
          teMetrics: {
            defaultMetric: 10,
            administrativeGroup: '0x00000001',
            priorityLevel: 'Priority 3 (Gold Class)',
            oneWayDelay: link.latency,
            delayVariation: '0.01 ms',
            packetLoss: '0.0000% (Protected)'
          },
          protection: {
            protectionType: 'none',
            dynamicRestoration: 'none',
            switchoverTime: 'N/A',
            srlgs: [100, 200]
          }
        };
      });

      console.log(`dbNodes UUIDs: ${dbNodes.map(n => n.uuid).join(', ')}`);
      console.log(`mappedMockNodes UUIDs: ${mappedMockNodes.map(n => n.uuid).join(', ')}`);
      dbNodes.forEach(dbNode => {
        const mockNode = mappedMockNodes.find(mn => mn.uuid === dbNode.uuid);
        if (mockNode) {
          console.log(`Found mockNode for dbNode: ${dbNode.uuid}`);
          dbNode.ietfInterfaces?.forEach(dbIface => {
            const mockIface = mockNode.ietfInterfaces?.find(mi => mi.name === dbIface.name);
            if (mockIface) {
              console.log(`  Found mockIface for dbIface: ${dbIface.name}, mockForwardingFiltering=${JSON.stringify(mockIface['dot1q-forwarding-filtering'])}`);
              if (mockIface['dot1q-bridge-port-vlan'] && !dbIface['dot1q-bridge-port-vlan']) {
                dbIface['dot1q-bridge-port-vlan'] = mockIface['dot1q-bridge-port-vlan'];
              }
              if (mockIface['dot1q-priority-mapping'] && !dbIface['dot1q-priority-mapping']) {
                dbIface['dot1q-priority-mapping'] = mockIface['dot1q-priority-mapping'];
              }
              if (mockIface['dot1q-forwarding-filtering'] && !dbIface['dot1q-forwarding-filtering']) {
                console.log(`    Copying dot1q-forwarding-filtering to dbIface ${dbIface.name}`);
                dbIface['dot1q-forwarding-filtering'] = mockIface['dot1q-forwarding-filtering'];
              }
              if (mockIface['dot1q-statistics'] && !dbIface['dot1q-statistics']) {
                console.log(`    Copying dot1q-statistics to dbIface ${dbIface.name}`);
                dbIface['dot1q-statistics'] = mockIface['dot1q-statistics'];
              }
            }
          });
        }
      });

      this.topology.nodes = [...dbNodes, ...mappedMockNodes];
      this.topology.links = [...dbLinks, ...mappedMockLinks];
      this.passiveDevices = passiveDevicesSnap.docs.map(d => d.data() as PassiveDevice);
      this.passiveCables = passiveCablesSnap.docs.map(d => d.data() as PassiveCable);
      this.rfc8345Networks = rfcNetworksSnap.docs.map(d => d.data() as RFC8345Network);
      this.slices = slicesSnap.docs.map(d => d.data() as Slice);
      
      console.log(`Loaded ${this.topology.nodes.length} nodes, ${this.topology.links.length} links, ${this.passiveDevices.length} passive devices, ${this.passiveCables.length} passive cables, ${this.rfc8345Networks.length} RFC8345 networks, and ${this.slices.length} slices from Firestore.`);
    } catch (e) {
      console.error('Failed to load from Firestore:', e);
    }
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  public getTopology(): NetworkTopology {
    return this.topology;
  }

  public getSlices(): Slice[] {
    return this.slices;
  }

  public async updateSliceObjectives(sliceId: string, objectives: OduPmObjective[]): Promise<void> {
    const slice = this.slices.find(s => s.id === sliceId);
    if (slice) {
      if (!slice.otn) slice.otn = {};
      if (!slice.otn['odu-signal-quality']) slice.otn['odu-signal-quality'] = {};
      slice.otn['odu-signal-quality']['odu-pm-objective'] = objectives;
    }
    const docRef = doc(db, 'slices', sliceId);
    const payload = {
      otn: {
        'odu-signal-quality': {
          'odu-pm-objective': objectives
        }
      }
    };
    await setDoc(docRef, this.cleanUndefined(payload), { merge: true });
  }

  public async updateIETFLinkNrpProfile(networkId: string, linkId: string, profile: OtnNrpProfile | undefined): Promise<void> {
    const network = this.rfc8345Networks.find(n => n.networkId === networkId);
    if (!network) {
      throw new Error(`Network ${networkId} not found.`);
    }
    const link = network.links?.find(l => l.linkId === linkId);
    if (!link) {
      throw new Error(`Link ${linkId} not found in network ${networkId}.`);
    }

    if (profile) {
      // Enforce co-dependency constraint: network must have OTN topology type
      if (!network.otnTopology) {
        throw new Error("Configuration rejected: Link does not belong to an OTN topology network.");
      }
      // Enforce presence of nrps list when granularity is link-resource
      if (profile['otn-nrp-granularity'] === 'link-resource' && (!profile.nrps || profile.nrps.length === 0)) {
        throw new Error("Configuration rejected: link-resource granularity requires at least one NRP entry.");
      }
    }

    link.otnNrpProfile = profile;

    const docRef = doc(db, 'rfc8345-networks', networkId);
    await setDoc(docRef, this.cleanUndefined(network), { merge: true });
  }

  public isInventoryTopologyActive(): boolean {
    return this.hasInventoryTopology;
  }

  public setInventoryTopologyActive(active: boolean) {
    this.hasInventoryTopology = active;
  }

  public updateNodeNeRef(nodeUuid: string, neRef: string | undefined) {
    const node = this.topology.nodes.find(n => n.uuid === nodeUuid);
    if (node) {
      node.inventoryMappingAttributes = {
        neRef: neRef
      };
    }
  }

  public updateLinkType(linkUuid: string, linkType: 'copper' | 'fiber' | 'coax' | 'microwave' | 'wlan' | 'unknown' | 'leased-fiber' | 'free-space-optics' | undefined) {
    const link = this.topology.links.find(l => l.uuid === linkUuid);
    if (link) {
      link.inventoryMappingAttributes = {
        linkType: linkType
      };
    }
  }

  public updateInterfaceBreakout(nodeUuid: string, interfaceName: string, enabled: boolean, channels: { channelId: number; speed?: number; status?: 'up' | 'down' }[]) {
    const node = this.topology.nodes.find(n => n.uuid === nodeUuid);
    if (node && node.ietfInterfaces) {
      const iface = node.ietfInterfaces.find(i => i.name === interfaceName);
      if (iface) {
        iface.portBreakout = {
          enabled: enabled,
          breakoutChannels: channels
        };
      }
    }
  }
  public updatePortDot1qVlan(nodeUuid: string, portName: string, config: Dot1qTagClassifier | undefined) {
    const node = this.topology.nodes.find(n => n.uuid === nodeUuid);
    if (node && node.ietfInterfaces) {
      const iface = node.ietfInterfaces.find(i => i.name === portName);
      if (iface) {
        iface['dot1q-bridge-port-vlan'] = config;
      }
    }
  }

  public updatePortDot1qPriorityMapping(nodeUuid: string, portName: string, config: Dot1qPriorityMapping | undefined) {
    const node = this.topology.nodes.find(n => n.uuid === nodeUuid);
    if (node && node.ietfInterfaces) {
      const iface = node.ietfInterfaces.find(i => i.name === portName);
      if (iface) {
        iface['dot1q-priority-mapping'] = config;
      }
    }
  }

  public updatePortDot1qForwardingFiltering(nodeUuid: string, portName: string, config: Dot1qForwardingFiltering | undefined) {
    const node = this.topology.nodes.find(n => n.uuid === nodeUuid);
    if (node && node.ietfInterfaces) {
      const iface = node.ietfInterfaces.find(i => i.name === portName);
      if (iface) {
        iface['dot1q-forwarding-filtering'] = config;
      }
    }
  }

  public updatePortDot1qStatistics(nodeUuid: string, portName: string, config: Dot1qBridgePortStatistics | undefined) {
    const node = this.topology.nodes.find(n => n.uuid === nodeUuid);
    if (node && node.ietfInterfaces) {
      const iface = node.ietfInterfaces.find(i => i.name === portName);
      if (iface) {
        iface['dot1q-statistics'] = config;
      }
    }
  }

  public resetPortDot1qStatistics(nodeUuid: string, portName: string) {
    const node = this.topology.nodes.find(n => n.uuid === nodeUuid);
    if (node && node.ietfInterfaces) {
      const iface = node.ietfInterfaces.find(i => i.name === portName);
      if (iface) {
        iface['dot1q-statistics'] = {
          'delay-exceeded-discards': 0,
          'mtu-exceeded-discards': 0,
          'discard-on-ingress-filtering': 0,
          'discard-on-egress-filtering': 0,
          'discard-inbound-acceptable-frame-type': 0
        };
      }
    }
  }

  public updateNodeGeoLocation(nodeUuid: string, locationObj: IETFGeoLocation) {
    const node = this.topology.nodes.find(n => n.uuid === nodeUuid);
    if (node) {
      node.ietfGeoLocation = locationObj;
    }
  }

  public updateComponentGeoLocation(nodeUuid: string, componentUuid: string, locationObj: IETFGeoLocation) {
    const node = this.topology.nodes.find(n => n.uuid === nodeUuid);
    if (node) {
      const comp = node.hardware.find(h => h.uuid === componentUuid);
      if (comp) {
        comp.ietfGeoLocation = locationObj;
      }
    }
  }

  // --- PASSIVE INVENTORY MANAGEMENT ---

  public getPassiveDevices(): PassiveDevice[] {
    return this.passiveDevices;
  }

  public addPassiveDevice(device: PassiveDevice): void {
    if (this.passiveDevices.some(d => d.id === device.id)) {
      throw new Error(`YANG Unique Constraint: Passive Device with ID '${device.id}' already exists.`);
    }
    this.passiveDevices.push(device);
  }

  public updatePassiveDevice(device: PassiveDevice): void {
    const idx = this.passiveDevices.findIndex(d => d.id === device.id);
    if (idx !== -1) {
      this.passiveDevices[idx] = device;
    }
  }

  public deletePassiveDevice(id: string): void {
    this.passiveDevices = this.passiveDevices.filter(d => d.id !== id);
  }

  public getPassiveCables(): PassiveCable[] {
    return this.passiveCables;
  }

  public addPassiveCable(cable: PassiveCable): void {
    if (this.passiveCables.some(c => c.id === cable.id)) {
      throw new Error(`YANG Unique Constraint: Cable with ID '${cable.id}' already exists.`);
    }
    this.passiveCables.push(cable);
  }

  public updatePassiveCable(cable: PassiveCable): void {
    const idx = this.passiveCables.findIndex(c => c.id === cable.id);
    if (idx !== -1) {
      this.passiveCables[idx] = cable;
    }
  }

  public deletePassiveCable(id: string): void {
    this.passiveCables = this.passiveCables.filter(c => c.id !== id);
  }

  // --- BASE NETWORK TOPOLOGY (RFC 8345) MANAGEMENT ---

  public getRFC8345Networks(): RFC8345Network[] {
    return this.rfc8345Networks;
  }

  public addRFC8345Network(network: RFC8345Network): void {
    if (this.rfc8345Networks.some(n => n.networkId === network.networkId)) {
      throw new Error(`YANG Key Constraint: Network with ID '${network.networkId}' already exists.`);
    }

    // Run absolute RFC 8345 schema validation
    this.validateNetworkTopology(network);

    this.rfc8345Networks.push(network);
  }

  public async updateRFC8345Network(network: RFC8345Network): Promise<void> {
    const idx = this.rfc8345Networks.findIndex(n => n.networkId === network.networkId);
    if (idx !== -1) {
      // Run validation before committing
      this.validateNetworkTopology(network);
      this.rfc8345Networks[idx] = network;
      const docRef = doc(db, 'rfc8345-networks', network.networkId);
      await setDoc(docRef, this.cleanUndefined(network));
    }
  }

  private cleanUndefined(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanUndefined(item));
    }
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = this.cleanUndefined(val);
      }
    }
    return cleaned;
  }

  private validateNetworkTopology(network: RFC8345Network): void {
    // 1. Verify supporting-network references exist in database
    if (network.supportingNetworks) {
      for (const sn of network.supportingNetworks) {
        if (sn.networkRef === network.networkId) {
          throw new Error(`Self-reference Exception: A network cannot serve as an underlay for itself.`);
        }
        if (!this.rfc8345Networks.some(n => n.networkId === sn.networkRef)) {
          throw new Error(`Integrity Violation: Declared Supporting Network '${sn.networkRef}' does not exist.`);
        }
      }
    }

    // 2. Verify node and termination-point referential integrity
    for (const node of network.nodes) {
      // Uniqueness of tp-id inside node (Feature 29 / Scenario 1)
      if (node.terminationPoints) {
        const tpIds = new Set<string>();
        for (const tp of node.terminationPoints) {
          if (!tp.tpId.trim()) {
            throw new Error(`YANG Constraint Error: termination-point ID (tp-id) cannot be empty.`);
          }
          if (tpIds.has(tp.tpId)) {
            throw new Error(`YANG Key Constraint Violation: Duplicate termination-point ID '${tp.tpId}' configured under node '${node.nodeId}'.`);
          }
          tpIds.add(tp.tpId);

          // Verify supporting termination points (Use Case 16)
          if (tp.supportingTerminationPoints) {
            for (const stp of tp.supportingTerminationPoints) {
              const uNet = this.rfc8345Networks.find(rx => rx.networkId === stp.networkRef) || (stp.networkRef === network.networkId ? network : null);
              if (!uNet) {
                throw new Error(`Integrity Violation: Supporting TP under '${tp.tpId}' references non-existent network '${stp.networkRef}'.`);
              }
              const uNode = uNet.nodes.find(nx => nx.nodeId === stp.nodeRef);
              if (!uNode) {
                throw new Error(`Integrity Violation: Supporting TP under '${tp.tpId}' references non-existent node '${stp.nodeRef}' in network '${stp.networkRef}'.`);
              }
              const uTp = uNode.terminationPoints?.find(tx => tx.tpId === stp.tpRef);
              if (!uTp) {
                throw new Error(`Integrity Violation: Supporting TP under '${tp.tpId}' references non-existent TP '${stp.tpRef}' under node '${stp.nodeRef}' in network '${stp.networkRef}'.`);
              }
            }
          }
        }
      }

      // Supporting nodes
      if (node.supportingNodes) {
        for (const snode of node.supportingNodes) {
          const sn = this.rfc8345Networks.find(n => n.networkId === snode.networkRef) || (snode.networkRef === network.networkId ? network : null);
          if (!sn) {
            throw new Error(`Integrity Violation: Node '${node.nodeId}' references non-existent supporting-network '${snode.networkRef}'.`);
          }
          if (!sn.nodes.some(n => n.nodeId === snode.nodeRef)) {
            throw new Error(`Integrity Violation: Node '${node.nodeId}' references non-existent supporting-node '${snode.nodeRef}' in network '${snode.networkRef}'.`);
          }
        }
      }
    }

    // 3. Verify Links reference integrity (Use Case 14)
    if (network.links) {
      const linkIds = new Set<string>();
      for (const link of network.links) {
        if (!link.linkId.trim()) {
          throw new Error(`YANG Constraint Error: Link ID (link-id) cannot be empty.`);
        }
        if (linkIds.has(link.linkId)) {
          throw new Error(`YANG Key Constraint Violation: Duplicate link ID '${link.linkId}' configured inside network '${network.networkId}'.`);
        }
        linkIds.add(link.linkId);

        // Verify source-node and source-tp
        const srcNode = network.nodes.find(n => n.nodeId === link.source.sourceNode);
        if (!srcNode) {
          throw new Error(`Integrity Violation: Link '${link.linkId}' source-node '${link.source.sourceNode}' does not exist inside network '${network.networkId}'.`);
        }
        const srcTp = srcNode.terminationPoints?.find(tp => tp.tpId === link.source.sourceTp);
        if (!srcTp) {
          throw new Error(`Integrity Violation: Link '${link.linkId}' source-tp '${link.source.sourceTp}' does not exist under node '${link.source.sourceNode}'.`);
        }

        // Verify dest-node and dest-tp
        const destNode = network.nodes.find(n => n.nodeId === link.destination.destNode);
        if (!destNode) {
          throw new Error(`Integrity Violation: Link '${link.linkId}' dest-node '${link.destination.destNode}' does not exist inside network '${network.networkId}'.`);
        }
        const destTp = destNode.terminationPoints?.find(tp => tp.tpId === link.destination.destTp);
        if (!destTp) {
          throw new Error(`Integrity Violation: Link '${link.linkId}' dest-tp '${link.destination.destTp}' does not exist under node '${link.destination.destNode}'.`);
        }

        // Verify supporting links
        if (link.supportingLinks) {
          for (const sl of link.supportingLinks) {
            const uNet = this.rfc8345Networks.find(rx => rx.networkId === sl.networkRef) || (sl.networkRef === network.networkId ? network : null);
            if (!uNet) {
              throw new Error(`Integrity Violation: Supporting link of '${link.linkId}' references non-existent network '${sl.networkRef}'.`);
            }
            const uLink = uNet.links?.find(lx => lx.linkId === sl.linkRef);
            if (!uLink) {
              throw new Error(`Integrity Violation: Supporting link of '${link.linkId}' references non-existent link '${sl.linkRef}' in network '${sl.networkRef}'.`);
            }
          }
        }

        // Cycle analysis to prevent reference loops (US 34)
        this.detectLinkCycle(link.linkId, link.supportingLinks, new Set<string>(), network);
      }
    }

    // 4. Verify L2 Topology and Node Constraints (Feature 51)
    for (const node of network.nodes) {
      if (node['l2-node-attributes']) {
        const l2Attr = node['l2-node-attributes'];
        if (l2Attr['management-vlan'] !== undefined && l2Attr['management-vlan'] !== null) {
          const vlan = l2Attr['management-vlan'];
          if (vlan < 1 || vlan > 4094 || !Number.isInteger(vlan)) {
            throw new Error(`YANG Constraint Error: Management VLAN ID '${vlan}' must be an integer between 1 and 4094.`);
          }
        }
        if (l2Attr['management-mac']) {
          const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
          if (!macRegex.test(l2Attr['management-mac'])) {
            throw new Error(`YANG Constraint Error: Management MAC address '${l2Attr['management-mac']}' must match standard IEEE 802 MAC-48 format.`);
          }
        }
      }
    }

    // 5. Verify L2 Link Constraints (Feature 52)
    if (network.links) {
      for (const link of network.links) {
        if (link['l2-link-attributes']) {
          const l2Attr = link['l2-link-attributes'];
          if (l2Attr.rate !== undefined && l2Attr.rate !== null) {
            if (l2Attr.rate <= 0) {
              throw new Error(`YANG Constraint Error: Link transmission rate '${l2Attr.rate}' must be a positive number.`);
            }
          }
          if (l2Attr.delay !== undefined && l2Attr.delay !== null) {
            if (l2Attr.delay <= 0) {
              throw new Error(`YANG Constraint Error: Link propagation delay '${l2Attr.delay}' must be a positive integer.`);
            }
          }
        }
      }
    }

    // 6. Verify L2 TP Constraints (Feature 53)
    for (const node of network.nodes) {
      if (node.terminationPoints) {
        for (const tp of node.terminationPoints) {
          if (tp['l2-termination-point-attributes']) {
            const l2Attr = tp['l2-termination-point-attributes'];
            if (l2Attr['mac-address']) {
              const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
              if (!macRegex.test(l2Attr['mac-address'])) {
                throw new Error(`YANG Constraint Error: Hardware MAC address '${l2Attr['mac-address']}' on port '${tp.tpId}' must match standard IEEE 802 MAC-48 format.`);
              }
            }
            if (l2Attr['outer-tag'] !== undefined && l2Attr['outer-tag'] !== null) {
              const tag = l2Attr['outer-tag'];
              if (tag < 1 || tag > 4094 || !Number.isInteger(tag)) {
                throw new Error(`YANG Constraint Error: Outer VLAN Tag '${tag}' must be an integer between 1 and 4094.`);
              }
            }
            if (l2Attr['inner-tag'] !== undefined && l2Attr['inner-tag'] !== null) {
              const tag = l2Attr['inner-tag'];
              if (tag < 1 || tag > 4094 || !Number.isInteger(tag)) {
                throw new Error(`YANG Constraint Error: Inner VLAN Tag '${tag}' must be an integer between 1 and 4094.`);
              }
            }
            if (l2Attr.vxlan && l2Attr.vxlan['vni-id'] !== undefined && l2Attr.vxlan['vni-id'] !== null) {
              const vni = l2Attr.vxlan['vni-id'];
              if (vni < 1 || vni > 16777215 || !Number.isInteger(vni)) {
                throw new Error(`YANG Constraint Error: VXLAN VNI ID '${vni}' must be an integer between 1 and 16777215.`);
              }
            }
          }
        }
      }
    }
  }

  private detectLinkCycle(
    targetLinkId: string,
    supportingLinks: SupportingLink[] | undefined,
    visited: Set<string>,
    currentNet: RFC8345Network
  ): void {
    if (!supportingLinks) return;
    for (const sl of supportingLinks) {
      const key = `${sl.networkRef}:${sl.linkRef}`;
      if (sl.linkRef === targetLinkId) {
        throw new Error(`Integrity Exception: Reference loop detected! Link '${targetLinkId}' directly or transitively depends on itself.`);
      }
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);

      // Find inside existing database or current draft network
      const sn = this.rfc8345Networks.find(nx => nx.networkId === sl.networkRef) || (sl.networkRef === currentNet.networkId ? currentNet : null);
      if (sn) {
        const supportingLinkObj = sn.links?.find(l => l.linkId === sl.linkRef);
        if (supportingLinkObj) {
          this.detectLinkCycle(targetLinkId, supportingLinkObj.supportingLinks, visited, currentNet);
        }
      }
    }
  }

  public deleteRFC8345Network(networkId: string): void {
    const referencers = this.rfc8345Networks.filter(n => n.supportingNetworks?.some(sn => sn.networkRef === networkId));
    if (referencers.length > 0) {
      throw new Error(`Dependency Error: Cannot delete network '${networkId}' as it is currently serving as an underlay for: ${referencers.map(r => r.networkId).join(', ')}.`);
    }
    this.rfc8345Networks = this.rfc8345Networks.filter(n => n.networkId !== networkId);
  }

  public getHardwareSpecs(): any {
    return hardwareSpecs;
  }

  public async fetchRealtimeTelemetry(
    id: string, 
    type: 'device' | 'link' | 'port' | 'hardware' | 'service' | 'slice'
  ): Promise<any> {
    // Simulate dynamic twin pipeline latency
    await new Promise(resolve => setTimeout(resolve, 200));

    if (type === 'service') {
      return {
        timestamp: new Date().toISOString(),
        activeJitterMs: (Math.random() * 0.05 + 0.1).toFixed(2) + ' ms',
        averageLatencyMs: (Math.random() * 0.2 + 1.0).toFixed(2) + ' ms',
        packetLossPercent: '0.000%',
        currentThroughputGbps: (Math.random() * 5 + 10).toFixed(1) + ' Gbps',
        slaCompliance: '99.999%',
        activeFlows: Math.floor(Math.random() * 3) + 2
      };
    }

    if (type === 'slice') {
      return {
        timestamp: new Date().toISOString(),
        dedicatedBandwidthGbps: '100 Gbps',
        activeSliceSessions: Math.floor(Math.random() * 50) + 120,
        allocatedCpuCores: 16,
        sliceMemoryUsagePercent: (Math.random() * 5 + 30).toFixed(1) + '%'
      };
    }

    if (type === 'device') {
      const isSatellite = id.includes('SAT');
      const isQkd = id.includes('q') || id.includes('QKD');
      
      return {
        timestamp: new Date().toISOString(),
        cpuUsage: Math.floor(Math.random() * 20) + 15 + '%',
        memoryUsage: Math.floor(Math.random() * 10) + 40 + '%',
        temperatureCelsius: (Math.random() * 5 + 30).toFixed(1),
        powerDrawWatts: Math.floor(Math.random() * 50) + 100,
        status: 'up',
        ...(isSatellite ? {
          orbitalVelocity: '7.56 km/s',
          altitude: '1,200 km',
          operatingMode: 'REGENERATIVE PAYLOAD (L2/L3)',
          solarChargeRate: '100% (4.2 kW Generated)',
          radiationLevel: '6.5 rad/h'
        } : {}),
        ...(isQkd ? {
          laserStatus: 'STABLE',
          syncStatus: 'LOCKED',
          activeSessions: Math.floor(Math.random() * 5) + 8,
          quantumBitErrorRate: (Math.random() * 0.5 + 1.0).toFixed(2) + '%',
          keyPoolAvailable: Math.floor(Math.random() * 100000) + 700000
        } : {})
      };
    }

    if (type === 'link') {
      const isFso = id.toLowerCase().includes('tightbeam') || id.toLowerCase().includes('laser') || id.toLowerCase().includes('sat');
      const isMicrowave = id.toLowerCase().includes('microwave');
      
      if (isFso) {
        return {
          timestamp: new Date().toISOString(),
          pointingErrorOffset: '1.2 μrad',
          alignmentServoStatus: 'LOCKED (Coarse & Fine)',
          dopplerShiftComp: '±24.6 GHz',
          steeringMechanism: 'Fine Fast Steering Mirror (FSM)',
          weatherScintillationLoss: id.includes('SAT1-SAT2') ? '0.00 dB (Vacuum/ISL)' : '3.85 dB (Sky Zenith)',
          standardProtocol: 'CCSDS 141.0-B-1 (Optical)',
          forwardErrorCorrection: 'LDPC (15360, 8192)',
          laserType: 'fso-interfaces:coherent-erbium-carrier',
          beamDivergence: '20 μrad (narrow-divergence)',
          bitRate: '10.0 Gbps',
          servoLoopSpeed: '5.0 kHz',
          jitterVariance: '0.14 μrad RMS',
          linkMargin: '+13.5 dB',
          phases: [
            { step: 1, name: "Ephemeris Upload", status: "completed", desc: "Orbital coordinates injected to terminal" },
            { step: 2, name: "Coarse Scanning", status: "completed", desc: "Wide spiral scanner searching wide FOV" },
            { step: 3, name: "Beacon Detection", status: "completed", desc: "Focal Quad-Detector captures quadrant light" },
            { step: 4, name: "Fine Alignment", status: "completed", desc: "FSM control active to center focal point" },
            { step: 5, name: "Tracking Locked", status: "active", desc: "Continuously compensating LEO vibrations" }
          ]
        };
      }

      if (isMicrowave) {
        return {
          timestamp: new Date().toISOString(),
          rssi: '-42 dBm (Strong Signal)',
          modulation: '4096-QAM Adaptive',
          snr: '38.2 dB (Error-free threshold)',
          carrierFrequency: '18.42 GHz (licensed band)',
          acmState: 'ACTIVE (Hitless state-machine locked)',
          fecCodingRate: 'LDPC rate 11/12',
          berPreFec: '1.2e-8 (Excellent channel quality)'
        };
      }

      // Default to Optical/Local Cable
      const timeslots = Array.from({ length: 80 }).map((_, index) => {
        const slotNum = index + 1;
        let status = 'unallocated';
        if (slotNum <= 4) status = 'reserved-tunnel';
        else if (slotNum >= 5 && slotNum <= 12) status = 'allocated-shared';
        else if (slotNum >= 13 && slotNum <= 16) status = 'reserved-control';
        else if (slotNum >= 45 && slotNum <= 54) status = 'impaired-testing';
        return { slotNum, status };
      });

      return {
        timestamp: new Date().toISOString(),
        distance: '158.4 km',
        attenuation: '18.52 dB',
        dispersion: '1.82 ps / nm * km',
        tributarySlotGranularity: 'tsg-1.25G',
        totalAvailableTs: 80,
        allocatedPayloadTypes: 'ODUflex / ODU2e',
        supportedClientSignals: ['iana-if-type:ethernetCsmacd', 'client-signal:OTU2', 'client-signal:OTU4', 'client-signal:STM-64'],
        timeslots,
        // DOM diagnostics
        signalLockState: 'LOCKED (CDR / PLL)',
        laserTemperature: '41.5 °C',
        txOpticalPower: '-1.2 dBm',
        rxOpticalPower: '-2.4 dBm',
        supplyVoltage: '3.32 V',
        biasCurrent: '6.8 mA'
      };
    }

    if (type === 'port') {
      return {
        timestamp: new Date().toISOString(),
        status: 'up',
        rxOpticalPower: (-2.0 - Math.random() * 2).toFixed(2) + ' dBm',
        txOpticalPower: (-1.0 - Math.random() * 1).toFixed(2) + ' dBm',
        laserTemperature: (40 + Math.random() * 5).toFixed(1) + ' °C',
        biasCurrent: (6.0 + Math.random() * 2).toFixed(1) + ' mA',
        supplyVoltage: (3.3 + Math.random() * 0.05).toFixed(2) + ' V'
      };
    }

    if (type === 'hardware') {
      return {
        timestamp: new Date().toISOString(),
        status: 'active',
        powerDrawWatts: Math.floor(Math.random() * 10) + 15 + ' W',
        temperatureCelsius: (35.0 + Math.random() * 4).toFixed(1) + ' °C'
      };
    }

    // Default fallback
    return {
      timestamp: new Date().toISOString(),
      status: 'normal'
    };
  }
}


