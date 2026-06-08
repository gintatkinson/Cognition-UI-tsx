
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
  SupportingTerminationPoint
} from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';
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
          ietfInterfaces: dev.endpoints.map((ep: string) => ({
            name: ep,
            type: ep.startsWith('q') ? 'iana-if-type:opticalChannel' : 'iana-if-type:ethernetCsmacd',
            enabled: dev.status === 'OPERATIONAL',
            adminStatus: dev.status === 'OPERATIONAL' ? 'up' : 'down',
            operStatus: dev.status === 'OPERATIONAL' ? 'up' : 'down',
            speed: ep.startsWith('q') ? 1200000 : 100000000000,
            physAddress: ep.startsWith('q') ? 'N/A' : `00:1A:2B:3C:${dev.id === 'd1' ? '11' : '22'}:${ep === 'eth0' ? '00' : '01'}`,
            description: `Active Core ${ep.startsWith('q') ? 'Quantum' : 'Ethernet'} Interface`
          })),
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

      this.topology.nodes = [...dbNodes, ...mappedMockNodes];
      this.topology.links = [...dbLinks, ...mappedMockLinks];
      this.passiveDevices = passiveDevicesSnap.docs.map(d => d.data() as PassiveDevice);
      this.passiveCables = passiveCablesSnap.docs.map(d => d.data() as PassiveCable);
      this.rfc8345Networks = rfcNetworksSnap.docs.map(d => d.data() as RFC8345Network);
      
      console.log(`Loaded ${this.topology.nodes.length} nodes, ${this.topology.links.length} links, ${this.passiveDevices.length} passive devices, ${this.passiveCables.length} passive cables, and ${this.rfc8345Networks.length} RFC8345 networks from Firestore.`);
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

  public updateRFC8345Network(network: RFC8345Network): void {
    const idx = this.rfc8345Networks.findIndex(n => n.networkId === network.networkId);
    if (idx !== -1) {
      // Run validation before committing
      this.validateNetworkTopology(network);
      this.rfc8345Networks[idx] = network;
    }
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


