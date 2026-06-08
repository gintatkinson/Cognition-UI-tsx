
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
      
      this.topology.nodes = nodesSnap.docs.map(d => d.data() as NetworkElement);
      this.topology.links = linksSnap.docs.map(d => d.data() as NetworkLink);
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
}

