import React, { useState, useMemo } from 'react';
import { 
  Database, 
  GitBranch, 
  GitPullRequest, 
  Layers, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Info,
  Network,
  Share2,
  FileCode,
  Sparkles,
  Link2,
  GitMerge,
  Globe
} from 'lucide-react';
import { NetworkService } from '../../services/networkService';
import { RFC8345Network, RFC8345Node, SupportingNetwork, SupportingNode, RFC8345Link, RFC8345TerminationPoint } from '../../types';

import { DrilldownLink } from '../ui/DrilldownLink';

interface BaseNetworkTopologyViewProps {
  onNavigate?: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
}

export function BaseNetworkTopologyView({ onNavigate }: BaseNetworkTopologyViewProps) {
  const networkService = NetworkService.getInstance();

  // Local state initialized from singleton service
  const [networks, setNetworks] = useState<RFC8345Network[]>(() => networkService.getRFC8345Networks());
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>(networks[0]?.networkId || '');
  
  // Tab control: 'networks' | 'layering-visualizer' | 'bdd-scenarios' | 'otn-slicing'
  const [activeTab, setActiveTab] = useState<'networks' | 'layering-visualizer' | 'bdd-scenarios' | 'otn-slicing'>('networks');
  
  // Alert banner
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const triggerAlert = (type: 'success' | 'error' | 'warning', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const selectedNetwork = useMemo(() => networks.find(n => n.networkId === selectedNetworkId), [networks, selectedNetworkId]);

  // --- Network Registration (Feature 28) ---
  const [newNetworkId, setNewNetworkId] = useState('');
  const [newNetworkName, setNewNetworkName] = useState('');
  const [newNetworkDesc, setNewNetworkDesc] = useState('');
  const [newNetworkType, setNewNetworkType] = useState<string>('L3-ip-overlay');

  const handleRegisterNetwork = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newNetworkId.trim();
    if (!cleanId) {
      triggerAlert('error', 'Network ID is required.');
      return;
    }
    if (networks.some(n => n.networkId === cleanId)) {
      triggerAlert('error', `YANG Key Constraint Violation: Network with ID "${cleanId}" already exists.`);
      return;
    }

    const networkObj: RFC8345Network = {
      networkId: cleanId,
      name: newNetworkName.trim() || undefined,
      description: newNetworkDesc.trim() || undefined,
      networkTypes: {
        type: newNetworkType
      },
      nodes: []
    };

    try {
      networkService.addRFC8345Network(networkObj);
      const updated = networkService.getRFC8345Networks();
      setNetworks(updated);
      setSelectedNetworkId(networkObj.networkId);
      
      // Reset fields
      setNewNetworkId('');
      setNewNetworkName('');
      setNewNetworkDesc('');
      triggerAlert('success', `Network container "${networkObj.networkId}" successfully registered.`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  // --- Node Registration (Feature 28) ---
  const [newNodeId, setNewNodeId] = useState('');
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeDesc, setNewNodeDesc] = useState('');

  const handleRegisterNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork) return;
    const cleanId = newNodeId.trim();
    if (!cleanId) {
      triggerAlert('error', 'Node ID is required.');
      return;
    }
    if (selectedNetwork.nodes.some(n => n.nodeId === cleanId)) {
      triggerAlert('error', `YANG Key Constraint: Node with ID "${cleanId}" already exists within this network.`);
      return;
    }

    const nodeObj: RFC8345Node = {
      nodeId: cleanId,
      name: newNodeName.trim() || undefined,
      description: newNodeDesc.trim() || undefined,
      supportingNodes: []
    };

    const updatedNetwork = {
      ...selectedNetwork,
      nodes: [...selectedNetwork.nodes, nodeObj]
    };

    try {
      networkService.updateRFC8345Network(updatedNetwork);
      setNetworks(networkService.getRFC8345Networks());
      
      // Reset
      setNewNodeId('');
      setNewNodeName('');
      setNewNodeDesc('');
      triggerAlert('success', `Created supported node entry "${nodeObj.nodeId}" in network "${selectedNetwork.networkId}".`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  // --- Layering: Map Supporting Networks (US 26) ---
  const [supportingNetworkRef, setSupportingNetworkRef] = useState('');

  const handleAddSupportingNetwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork) return;
    if (!supportingNetworkRef) {
      triggerAlert('error', 'Please select an underlay network.');
      return;
    }
    if (supportingNetworkRef === selectedNetwork.networkId) {
      triggerAlert('error', 'Self-reference Exception: A network cannot serve as an underlay for itself.');
      return;
    }

    const currentSupports = selectedNetwork.supportingNetworks || [];
    if (currentSupports.some(sn => sn.networkRef === supportingNetworkRef)) {
      triggerAlert('error', `Underlay network "${supportingNetworkRef}" is already registered for this topology.`);
      return;
    }

    const updatedNetwork = {
      ...selectedNetwork,
      supportingNetworks: [...currentSupports, { networkRef: supportingNetworkRef }]
    };

    try {
      networkService.updateRFC8345Network(updatedNetwork);
      setNetworks(networkService.getRFC8345Networks());
      setSupportingNetworkRef('');
      triggerAlert('success', `Underlay relationship mapped: "${selectedNetwork.networkId}" is now supported by "${supportingNetworkRef}".`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  const handleRemoveSupportingNetwork = (underlayId: string) => {
    if (!selectedNetwork) return;
    const currentSupports = selectedNetwork.supportingNetworks || [];
    const updatedNetwork = {
      ...selectedNetwork,
      supportingNetworks: currentSupports.filter(sn => sn.networkRef !== underlayId)
    };

    // Clean up any supporting node references from this underlay
    updatedNetwork.nodes = updatedNetwork.nodes.map(node => {
      if (node.supportingNodes) {
        return {
          ...node,
          supportingNodes: node.supportingNodes.filter(sn => sn.networkRef !== underlayId)
        };
      }
      return node;
    });

    try {
      networkService.updateRFC8345Network(updatedNetwork);
      setNetworks(networkService.getRFC8345Networks());
      triggerAlert('warning', `Underlay network relationship to "${underlayId}" severed.`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  // --- Layering: Map Supporting Nodes for selected Node (US 26) ---
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [nodeUnderlayNetRef, setNodeUnderlayNetRef] = useState('');
  const [nodeUnderlayNodeRef, setNodeUnderlayNodeRef] = useState('');

  // Underlay networks configured for this selected overlay network
  const availableUnderlayNets = useMemo(() => {
    if (!selectedNetwork) return [];
    return selectedNetwork.supportingNetworks?.map(sn => sn.networkRef) || [];
  }, [selectedNetwork]);

  // Nodes belonging to the selected underlay network
  const availableUnderlayNodes = useMemo(() => {
    if (!nodeUnderlayNetRef) return [];
    const net = networks.find(n => n.networkId === nodeUnderlayNetRef);
    return net?.nodes || [];
  }, [networks, nodeUnderlayNetRef]);

  const targetNode = useMemo(() => {
    if (!selectedNetwork || !selectedNodeId) return null;
    return selectedNetwork.nodes.find(n => n.nodeId === selectedNodeId) || null;
  }, [selectedNetwork, selectedNodeId]);

  const handleAddSupportingNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork || !selectedNodeId || !targetNode) return;
    if (!nodeUnderlayNetRef || !nodeUnderlayNodeRef) {
      triggerAlert('error', 'Select both the underlay network and underlay node reference.');
      return;
    }

    const currentMapping = targetNode.supportingNodes || [];
    if (currentMapping.some(sn => sn.networkRef === nodeUnderlayNetRef && sn.nodeRef === nodeUnderlayNodeRef)) {
      triggerAlert('error', 'This specific underlay node mapping already exists.');
      return;
    }

    const updatedNodeObj: RFC8345Node = {
      ...targetNode,
      supportingNodes: [...currentMapping, { networkRef: nodeUnderlayNetRef, nodeRef: nodeUnderlayNodeRef }]
    };

    const updatedNetwork = {
      ...selectedNetwork,
      nodes: selectedNetwork.nodes.map(n => n.nodeId === selectedNodeId ? updatedNodeObj : n)
    };

    try {
      networkService.updateRFC8345Network(updatedNetwork);
      setNetworks(networkService.getRFC8345Networks());
      setNodeUnderlayNodeRef('');
      triggerAlert('success', `Node mapping complete: "${selectedNodeId}" is now mapped to underlay node "${nodeUnderlayNodeRef}".`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  const handleRemoveSupportingNode = (netRef: string, nodeRef: string) => {
    if (!selectedNetwork || !selectedNodeId || !targetNode) return;
    const currentMapping = targetNode.supportingNodes || [];
    
    const updatedNodeObj: RFC8345Node = {
      ...targetNode,
      supportingNodes: currentMapping.filter(sn => !(sn.networkRef === netRef && sn.nodeRef === nodeRef))
    };

    const updatedNetwork = {
      ...selectedNetwork,
      nodes: selectedNetwork.nodes.map(n => n.nodeId === selectedNodeId ? updatedNodeObj : n)
    };

    try {
      networkService.updateRFC8345Network(updatedNetwork);
      setNetworks(networkService.getRFC8345Networks());
      triggerAlert('warning', `Underlay node mapping severed.`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  const handleDeleteNetwork = (netId: string) => {
    try {
      networkService.deleteRFC8345Network(netId);
      const updated = networkService.getRFC8345Networks();
      setNetworks(updated);
      if (selectedNetworkId === netId) {
        setSelectedNetworkId(updated[0]?.networkId || '');
      }
      triggerAlert('warning', `Network "${netId}" deleted successfully.`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!selectedNetwork) return;
    const updatedNetwork = {
      ...selectedNetwork,
      nodes: selectedNetwork.nodes.filter(n => n.nodeId !== nodeId)
    };
    try {
      networkService.updateRFC8345Network(updatedNetwork);
      setNetworks(networkService.getRFC8345Networks());
      if (selectedNodeId === nodeId) {
        setSelectedNodeId('');
      }
      triggerAlert('warning', `Removed node "${nodeId}" from topological group.`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  // --- Termination Points (US 31, UC 16) ---
  const [newTpId, setNewTpId] = useState('');
  const [tpUnderlayNetRef, setTpUnderlayNetRef] = useState('');
  const [tpUnderlayNodeRef, setTpUnderlayNodeRef] = useState('');
  const [tpUnderlayTpRef, setTpUnderlayTpRef] = useState('');

  const availableTpUnderlayNodes = useMemo(() => {
    if (!tpUnderlayNetRef) return [];
    return networks.find(n => n.networkId === tpUnderlayNetRef)?.nodes || [];
  }, [networks, tpUnderlayNetRef]);

  const availableTpUnderlayTps = useMemo(() => {
    if (!tpUnderlayNetRef || !tpUnderlayNodeRef) return [];
    const nodeObj = networks.find(n => n.networkId === tpUnderlayNetRef)?.nodes.find(n => n.nodeId === tpUnderlayNodeRef);
    return nodeObj?.terminationPoints || [];
  }, [networks, tpUnderlayNetRef, tpUnderlayNodeRef]);

  const handleRegisterTp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork || !selectedNodeId || !targetNode) return;
    const cleanTpId = newTpId.trim();
    if (!cleanTpId) {
      triggerAlert('error', 'Termination Point ID is required.');
      return;
    }

    const currentTps = targetNode.terminationPoints || [];
    if (currentTps.some(tp => tp.tpId === cleanTpId)) {
      triggerAlert('error', `YANG Key Constraint Violation: Duplicate TP ID '${cleanTpId}' under node '${selectedNodeId}'.`);
      return;
    }

    // Set supporting TP if specified
    const suppTPs = [];
    if (tpUnderlayNetRef && tpUnderlayNodeRef && tpUnderlayTpRef) {
      suppTPs.push({
        networkRef: tpUnderlayNetRef,
        nodeRef: tpUnderlayNodeRef,
        tpRef: tpUnderlayTpRef
      });
    }

    const updatedNodeObj: RFC8345Node = {
      ...targetNode,
      terminationPoints: [...currentTps, { tpId: cleanTpId, supportingTerminationPoints: suppTPs }]
    };

    const updatedNetwork = {
      ...selectedNetwork,
      nodes: selectedNetwork.nodes.map(n => n.nodeId === selectedNodeId ? updatedNodeObj : n)
    };

    try {
      networkService.updateRFC8345Network(updatedNetwork);
      setNetworks(networkService.getRFC8345Networks());
      setNewTpId('');
      setTpUnderlayNetRef('');
      setTpUnderlayNodeRef('');
      setTpUnderlayTpRef('');
      triggerAlert('success', `Termination point '${cleanTpId}' added to node '${selectedNodeId}'.`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  const handleDeleteTp = (tpId: string) => {
    if (!selectedNetwork || !selectedNodeId || !targetNode) return;
    const currentTps = targetNode.terminationPoints || [];

    const updatedNodeObj: RFC8345Node = {
      ...targetNode,
      terminationPoints: currentTps.filter(tp => tp.tpId !== tpId)
    };

    const updatedNetwork = {
      ...selectedNetwork,
      nodes: selectedNetwork.nodes.map(n => n.nodeId === selectedNodeId ? updatedNodeObj : n)
    };

    try {
      networkService.updateRFC8345Network(updatedNetwork);
      setNetworks(networkService.getRFC8345Networks());
      triggerAlert('warning', `Removed termination point '${tpId}' from node '${selectedNodeId}'.`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };


  // --- Links and source/dest node interfaces (US 27, 32, 33, 34, UC 14) ---
  const [newLinkId, setNewLinkId] = useState('');
  const [linkSourceNode, setLinkSourceNode] = useState('');
  const [linkSourceTp, setLinkSourceTp] = useState('');
  const [linkDestNode, setLinkDestNode] = useState('');
  const [linkDestTp, setLinkDestTp] = useState('');
  const [linkUnderlayNetRef, setLinkUnderlayNetRef] = useState('');
  const [linkUnderlayLinkRef, setLinkUnderlayLinkRef] = useState('');

  // --- OTN / fg-OTN UI States (Epic 13, Feature 43/44) ---
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  
  // TP OTN attributes
  const [tpOtnTsg, setTpOtnTsg] = useState<string>('tsg-1.25G');
  const [tpOtnClientSignals, setTpOtnClientSignals] = useState<string>('iana-if-type:ethernetCsmacd, client-signal:OTU2');

  // Link OTN attributes
  const [linkOtnDistance, setLinkOtnDistance] = useState<number>(512);

  // fg-OTN bandwidth structures fgotnList state
  const [fgotnOduType, setFgotnOduType] = useState<string>('fgODUflex');
  const [fgotnTsNumber, setFgotnTsNumber] = useState<string>('1-10');
  const [fgotnBandwidth, setFgotnBandwidth] = useState<number>(100);

  // fg-OTN timeslot ranges fgtsRange state
  const [fgtsRangeOduType, setFgtsRangeOduType] = useState<string>('fgODUflex');
  const [fgtsRangeTsNumber, setFgtsRangeTsNumber] = useState<string>('1-80');
  const [fgtsReservedSlots, setFgtsReservedSlots] = useState<string>('1-15');
  const [fgtsUnreservedSlots, setFgtsUnreservedSlots] = useState<string>('16-80');

  // ietf fg-OTN ts-list pattern, ascending and disjoint validator of tributary ranges
  const validateTsList = (tsListStr: string): { isValid: boolean; error?: string; slots: number[] } => {
    const cleanStr = tsListStr.trim();
    if (!cleanStr) {
      return { isValid: true, slots: [] };
    }
    const regex = /^([1-9][0-9]{0,3}(-[1-9][0-9]{0,3})?(,[1-9][0-9]{0,3}(-[1-9][0-9]{0,3})?)*)$/;
    if (!regex.test(cleanStr)) {
      return { isValid: false, error: 'Pattern mismatch: Must contain integers or ranges (e.g., 1-10,12,15-20)', slots: [] };
    }
    const parts = cleanStr.split(',');
    let lastNum = 0;
    const matchedNumbers = new Set<number>();
    const slots: number[] = [];

    for (const pt of parts) {
      if (pt.includes('-')) {
        const range = pt.split('-').map(Number);
        if (range[0] >= range[1]) {
          return { isValid: false, error: `Ascending constraint error: Range ${pt} is not ascending (e.g., 1-10, not 10-1)`, slots: [] };
        }
        for (let i = range[0]; i <= range[1]; i++) {
          if (matchedNumbers.has(i)) {
            return { isValid: false, error: `Overlapping constraint error: Tributary slot ${i} is duplicated or overlapping!`, slots: [] };
          }
          if (i < lastNum) {
            return { isValid: false, error: `Ordering constraint error: Tributary slot ${i} is not in strict ascending order (last element was ${lastNum})`, slots: [] };
          }
          matchedNumbers.add(i);
          slots.push(i);
          lastNum = i;
        }
      } else {
        const num = Number(pt);
        if (matchedNumbers.has(num)) {
          return { isValid: false, error: `Overlapping constraint error: Tributary slot ${num} is duplicated or overlapping!`, slots: [] };
        }
        if (num < lastNum) {
          return { isValid: false, error: `Ordering constraint error: Tributary slot ${num} is not in strict ascending order (last element was ${lastNum})`, slots: [] };
        }
        matchedNumbers.add(num);
        slots.push(num);
        lastNum = num;
      }
    }

    for (const s of slots) {
      if (s < 1 || s > 4095) {
        return { isValid: false, error: `Boundary error: Tributary slot index ${s} must be between 1 and 4095.`, slots: [] };
      }
    }

    return { isValid: true, slots };
  };

  const sourceTps = useMemo(() => {
    if (!selectedNetwork || !linkSourceNode) return [];
    return selectedNetwork.nodes.find(n => n.nodeId === linkSourceNode)?.terminationPoints || [];
  }, [selectedNetwork, linkSourceNode]);

  const destTps = useMemo(() => {
    if (!selectedNetwork || !linkDestNode) return [];
    return selectedNetwork.nodes.find(n => n.nodeId === linkDestNode)?.terminationPoints || [];
  }, [selectedNetwork, linkDestNode]);

  const availableLinkUnderlayLinks = useMemo(() => {
    if (!linkUnderlayNetRef) return [];
    return networks.find(n => n.networkId === linkUnderlayNetRef)?.links || [];
  }, [networks, linkUnderlayNetRef]);

  const handleRegisterLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork) return;
    const cleanLinkId = newLinkId.trim();
    if (!cleanLinkId) {
      triggerAlert('error', 'Link ID is required.');
      return;
    }
    if (!linkSourceNode || !linkSourceTp || !linkDestNode || !linkDestTp) {
      triggerAlert('error', 'Please specify source and destination endpoints completely.');
      return;
    }

    const currentLinks = selectedNetwork.links || [];
    if (currentLinks.some(l => l.linkId === cleanLinkId)) {
      triggerAlert('error', `YANG Key Constraint Violation: Duplicate link ID '${cleanLinkId}' in network '${selectedNetwork.networkId}'.`);
      return;
    }

    const suppLinks = [];
    if (linkUnderlayNetRef && linkUnderlayLinkRef) {
      suppLinks.push({
        networkRef: linkUnderlayNetRef,
        linkRef: linkUnderlayLinkRef
      });
    }

    const linkObj = {
      linkId: cleanLinkId,
      source: {
        sourceNode: linkSourceNode,
        sourceTp: linkSourceTp
      },
      destination: {
        destNode: linkDestNode,
        destTp: linkDestTp
      },
      supportingLinks: suppLinks.length > 0 ? suppLinks : undefined
    };

    const updatedNetwork = {
      ...selectedNetwork,
      links: [...currentLinks, linkObj]
    };

    try {
      networkService.updateRFC8345Network(updatedNetwork);
      setNetworks(networkService.getRFC8345Networks());
      // Reset form fields
      setNewLinkId('');
      setLinkSourceNode('');
      setLinkSourceTp('');
      setLinkDestNode('');
      setLinkDestTp('');
      setLinkUnderlayNetRef('');
      setLinkUnderlayLinkRef('');
      triggerAlert('success', `Link '${cleanLinkId}' successfully registered.`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  const handleDeleteLink = (linkId: string) => {
    if (!selectedNetwork) return;
    const currentLinks = selectedNetwork.links || [];

    const updatedNetwork = {
      ...selectedNetwork,
      links: currentLinks.filter(l => l.linkId !== linkId)
    };

    try {
      networkService.updateRFC8345Network(updatedNetwork);
      setNetworks(networkService.getRFC8345Networks());
      triggerAlert('warning', `Link '${linkId}' removed from topological graph.`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  // --- Sandbox Simulation BDD ---
  const [activeScenario, setActiveScenario] = useState<'overlay-L0-L3' | 'referential-integrity' | 'node-layer-mapping' | 'tp-connection' | 'link-loop-audits' | 'validate-ts-list-success' | 'validate-ts-list-fail'>('overlay-L0-L3');
  const [scenarioLogs, setScenarioLogs] = useState<string[]>([]);
  const [scenarioJson, setScenarioJson] = useState<string>('');
  const [scenarioStatus, setScenarioStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');

  const executeScenarioSimulation = () => {
    setScenarioStatus('running');
    setScenarioLogs(['Starting RFC 8345 Schema evaluation...', 'Parsed ietf-network.yang modules...']);
    
    setTimeout(() => {
      switch (activeScenario) {
        case 'overlay-L0-L3':
          setScenarioLogs([
            'GIVEN: underlay-L0 framework exists representing an L0 Optical Fiber underlay',
            'WHEN: registering network "overlay-L3" with supporting-network "underlay-L0"',
            'THEN: system commits the logical relationship representation.',
            'AND: validates that underlay-L0 exists in the active NMDA state machine.',
            'STATUS: PASS (RFC 8345 clause 5 compliant)'
          ]);
          setScenarioJson(JSON.stringify({
            "ietf-network:networks": {
              "network": [
                {
                  "network-id": "underlay-L0",
                  "network-types": { "type": "physical" }
                },
                {
                  "network-id": "overlay-L3",
                  "supporting-network": [
                    { "network-ref": "underlay-L0" }
                  ],
                  "network-types": { "type": "L3-ip-overlay" }
                }
              ]
            }
          }, null, 2));
          setScenarioStatus('success');
          break;

        case 'referential-integrity':
          setScenarioLogs([
            'GIVEN: network-id constraints representing invalid supporting structures',
            'WHEN: client app attempts to inject supporting-network "non-existent-underlay"',
            'THEN: system aborts state change transaction with standard validation constraints',
            'ERROR: Integrity Violation: Declared Supporting Network "non-existent-underlay" does not exist.',
            'STATUS: ROLLBACK COMPLETED (Protected Datastore)'
          ]);
          setScenarioJson(JSON.stringify({
            "transaction": "TX-11885",
            "operation": "CREATE_SUPPORTING_NETWORK",
            "status": "REJECTED_BY_VALIDATOR",
            "reason": {
              "path": "/networks/network[network-id='overlay-L3']/supporting-network[network-ref='non-existent-underlay']",
              "error-message": "Referenced network coordinate does not resolve in NMDA tree"
            }
          }, null, 2));
          setScenarioStatus('success');
          break;

        case 'node-layer-mapping':
          setScenarioLogs([
            'GIVEN: IP node "node-L3-TK-router" and underlay node "node-L0-TK-terminal"',
            'WHEN: NOC administrator maps the IP overlay node to the physical optical terminal',
            'THEN: the system registers the supporting-node mapping under RFC 8345',
            'AND: multi-layer network mappings are fully established.',
            'STATUS: PASS'
          ]);
          setScenarioJson(JSON.stringify({
            "ietf-network:node": {
              "node-id": "node-L3-TK-router",
              "supporting-node": [
                {
                  "network-ref": "underlay-L0",
                  "node-ref": "node-L0-TK-terminal"
                }
              ]
            }
          }, null, 2));
          setScenarioStatus('success');
          break;

        case 'tp-connection':
          setScenarioLogs([
            'GIVEN: two L3 routing nodes: "node-L3-TK-router" and "node-L3-OS-router"',
            'WHEN: creating termination-points: "tp-L3-TK-ge1" and "tp-L3-OS-ge1"',
            'AND: creating bidirectional overlay link: "link-L3-TK-to-OS"',
            'AND: registering underlay link reference: "underlay-L0" -> "link-L0-TK-to-OS"',
            'THEN: the datastore validates source-destination constraints and commits successfully.',
            'STATUS: PASS (IETF RFC 8345 network-topology model compliant)'
          ]);
          setScenarioJson(JSON.stringify({
            "ietf-network-topology:link": {
              "link-id": "link-L3-TK-to-OS",
              "source": {
                "source-node": "node-L3-TK-router",
                "source-tp": "tp-L3-TK-ge1"
              },
              "destination": {
                "dest-node": "node-L3-OS-router",
                "dest-tp": "tp-L3-OS-ge1"
              },
              "supporting-link": [
                {
                  "network-ref": "underlay-L0",
                  "link-ref": "link-L0-TK-to-OS"
                }
              ]
            }
          }, null, 2));
          setScenarioStatus('success');
          break;

        case 'link-loop-audits':
          setScenarioLogs([
            'GIVEN: active overlay link "link-L3-TK-to-OS" supported by "link-L0-TK-to-OS"',
            'WHEN: a rogue configuration transaction attempts to support "link-L0-TK-to-OS" with overlay "link-L3-TK-to-OS"',
            'THEN: system runs depth-first traversal of the "supporting-link" hierarchy',
            'AND: blocks the transaction due to transitive reference loop recursion detection',
            'ERROR: Integrity Exception: Reference loop detected! Link "link-L3-TK-to-OS" directly or transitively depends on itself.',
            'STATUS: PASS (Loop recursion audit successfully guarded)'
          ]);
          setScenarioJson(JSON.stringify({
            "transaction": "TX-99881",
            "operation": "SET_SUPPORTING_LINK",
            "source-link": "link-L0-TK-to-OS",
            "target-underlay-link": "link-L3-TK-to-OS",
            "status": "REJECTED_BY_LOOP_AUDITOR",
            "reason": {
              "cycle-detected": "overlay-L3:link-L3-TK-to-OS => underlay-L0:link-L0-TK-to-OS => overlay-L3:link-L3-TK-to-OS",
              "action": "ROLLBACK"
            }
          }, null, 2));
          setScenarioStatus('success');
          break;

        case 'validate-ts-list-success':
          setScenarioLogs([
            'GIVEN: configuring fine-grain OTN network tributary timeslots',
            'WHEN: timeslot index lists are configured as "1-10,12,15-20"',
            'THEN: the system evaluates the text as a non-overlapping, strictly ascending, disjoint integer sequence list.',
            'AND: validates that the slots belong to G.709 sub-rate / fine-grained interfaces (1-4095 range allowed).',
            'AND: marks the transaction as conformant underneath ietf-fgotn-topology (ietf-fgotn-topology:fgotn-bandwidth)',
            'STATUS: PASS (Conforming fine-grain slot layout!)'
          ]);
          setScenarioJson(JSON.stringify({
            "fgotnt:ts-list": "1-10,12,15-20",
            "validation-attributes": {
              "status": "VALID",
              "is-disjoint": true,
              "is-ascending": true,
              "parsed-discrete-slots": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 17, 18, 19, 20]
            }
          }, null, 2));
          setScenarioStatus('success');
          break;

        case 'validate-ts-list-fail':
          setScenarioLogs([
            'GIVEN: configuring fine-grain OTN network tributary timeslots with strict disjoint constraint rules',
            'WHEN: user inputs overlapping slot coordinates "1-10,8-15"',
            'THEN: system parses range bounds and detects slot overlap on index value: 8',
            'AND: blocks configuration update back-propagation with standard schema exception.',
            'ERROR: Overlapping constraint error: Tributary slot 8 is duplicated or overlapping!',
            'STATUS: REJECTED (Protected Datastore State preserved)'
          ]);
          setScenarioJson(JSON.stringify({
            "fgotnt:ts-list": "1-10,8-15",
            "validation-attributes": {
              "status": "INVALID",
              "failed-at-slot": 8,
              "violation": "overlapping_or_duplicate_tributary_range",
              "action": "TRANSACTION_ROLLBACK"
            }
          }, null, 2));
          setScenarioStatus('success');
          break;
      }
    }, 600);
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto w-full text-left">
      
      {/* Header */}
      <div className="border-b border-border/80 pb-6">
        <span className="text-[10px] uppercase tracking-widest bg-emerald-600/15 text-emerald-400 font-mono px-2 py-0.5 rounded font-extrabold">
          ietf-network (RFC 8345)
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-2">
          <Layers className="w-6 h-6 text-emerald-500" />
          Network Topology Base Model
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Multi-layer topology builder designed to map overlay relationships (Logical IP, L3 routing) down to physical infrastructure underlays.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-950/40 p-1 rounded-xl border border-zinc-900 w-fit">
        <button
          onClick={() => setActiveTab('networks')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'networks' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Network className="w-4 h-4" />
          Networks & Nodes (Feat 28)
        </button>
        <button
          onClick={() => setActiveTab('layering-visualizer')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'layering-visualizer' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <GitMerge className="w-4 h-4" />
          Vertical Layer Mapping (US 26)
        </button>
        <button
          onClick={() => setActiveTab('otn-slicing')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'otn-slicing' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400 animate-pulse" />
          YANG Slicing
        </button>
        <button
          onClick={() => setActiveTab('bdd-scenarios')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'bdd-scenarios' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          BDD Test Suite (RFC 8345)
        </button>
      </div>

      {/* Alert banner */}
      {alert && (
        <div className={`p-4 border rounded-xl flex items-start gap-3 animate-slide-in font-mono text-xs ${
          alert.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {alert.type === 'error' ? (
            <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
          ) : (
            <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
          )}
          <div>
            <span className="font-extrabold uppercase">{alert.type}: </span>
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      {/* --- TAB 1: NETWORKS & NODES --- */}
      {activeTab === 'networks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column 1: Network Selection, Deletion, and creation */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* List */}
            <div className="bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Globe className="w-4 h-4 text-emerald-500" />
                Network Inventory
              </h3>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {networks.map(n => {
                  const isSelected = n.networkId === selectedNetworkId;
                  const numNodes = n.nodes.length;
                  const numSupports = n.supportingNetworks?.length || 0;
                  return (
                    <div
                      key={n.networkId}
                      onClick={() => {
                        setSelectedNetworkId(n.networkId);
                        setSelectedNodeId('');
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 relative group ${
                        isSelected 
                          ? 'bg-emerald-600/10 border-emerald-500 text-white shadow-md' 
                          : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:bg-zinc-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-white truncate max-w-[170px]">
                          {n.name || n.networkId}
                        </span>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNetwork(n.networkId);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all shrink-0"
                          title="Delete network"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>ID: {n.networkId}</span>
                        <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded text-[9px] uppercase font-bold">
                          {n.networkTypes?.type || 'generic'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono mt-1 border-t border-zinc-900 pt-1.5">
                        <span className="flex items-center gap-1">
                          <Network className="w-3 h-3 text-emerald-500" />
                          {numNodes} nodes
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3 text-indigo-400" />
                          {numSupports} underlays
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Create Network Form (Feature 28 validation sandbox) */}
            <form onSubmit={handleRegisterNetwork} className="bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Plus className="w-4 h-4 text-emerald-500" />
                Add Network Container
              </h3>

              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Network Identifier (URI) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. overlay-L3vpn"
                    value={newNetworkId}
                    onChange={(e) => setNewNetworkId(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Descriptive Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Core Transit Overlay"
                    value={newNetworkName}
                    onChange={(e) => setNewNetworkName(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Network Type Class</label>
                  <select
                    value={newNetworkType}
                    onChange={(e) => setNewNetworkType(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500 font-sans"
                  >
                    <option value="physical">physical / L0 underlay</option>
                    <option value="L1-transport">L1-transport</option>
                    <option value="L2-ethernet">L2-ethernet</option>
                    <option value="L3-ip-overlay">L3-ip-overlay (URI-mapped)</option>
                    <option value="virtual">virtual / slicing overlay</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Description Reference</label>
                  <textarea
                    placeholder="Describe layering context..."
                    value={newNetworkDesc}
                    onChange={(e) => setNewNetworkDesc(e.target.value)}
                    rows={2}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500 font-sans resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-xs"
                >
                  Create Network datastore
                </button>
              </div>
            </form>

          </div>

          {/* Node and Layer Config Block */}
          <div className="lg:col-span-8 bg-zinc-950/10 border border-border/70 rounded-xl p-5 space-y-6">
            {selectedNetwork ? (
              <div className="space-y-6">
                
                {/* Visual Banner */}
                <div className="flex border-b border-zinc-900 pb-4 justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono">{selectedNetwork.name || selectedNetwork.networkId}</h3>
                    <p className="text-zinc-500 text-xs font-mono mt-0.5">ID: {selectedNetwork.networkId} | Class: {selectedNetwork.networkTypes?.type}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded font-extrabold uppercase font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active RFC 8345 Container
                  </span>
                </div>

                <p className="text-zinc-400 text-xs font-sans leading-relaxed">
                  {selectedNetwork.description || "No description set for this logical layer network topology container."}
                </p>

                {/* Grid linking underlay supporting-networks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Supporting Network Mapping List (US 26) */}
                  <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4.5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                        Underlay Networks
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">supporting-network</span>
                    </div>

                    {selectedNetwork.supportingNetworks && selectedNetwork.supportingNetworks.length > 0 ? (
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                        {selectedNetwork.supportingNetworks.map(sn => {
                          const netName = networks.find(n => n.networkId === sn.networkRef)?.name || sn.networkRef;
                          return (
                            <div key={sn.networkRef} className="flex justify-between items-center bg-zinc-900/60 border border-zinc-850 p-2 rounded text-xs font-mono">
                              <div>
                                <div className="text-white font-semibold truncate max-w-[180px]">{netName}</div>
                                <div className="text-[10px] text-zinc-500">Ref: {sn.networkRef}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveSupportingNetwork(sn.networkRef)}
                                className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800"
                                title="Remove underlay map"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-zinc-600 text-xs italic">
                        Not supported by any underlay networks (Root Level).
                      </div>
                    )}

                    {/* Add supporting-network */}
                    <form onSubmit={handleAddSupportingNetwork} className="flex gap-2 text-xs font-mono">
                      <select
                        value={supportingNetworkRef}
                        onChange={(e) => setSupportingNetworkRef(e.target.value)}
                        className="bg-background border border-border rounded-lg p-1.5 flex-1 text-xs text-white outline-none font-sans"
                      >
                        <option value="">-- Choose underlay --</option>
                        {networks.filter(n => n.networkId !== selectedNetwork.networkId).map(n => (
                          <option key={n.networkId} value={n.networkId}>{n.name || n.networkId}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                      >
                        Map underlay
                      </button>
                    </form>
                  </div>

                  {/* Node Inventory in this Network (Feature 28) */}
                  <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4.5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-emerald-400" />
                        Constituent Nodes
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">node [list]</span>
                    </div>

                    {selectedNetwork.nodes.length > 0 ? (
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                        {selectedNetwork.nodes.map(n => {
                          const isSel = n.nodeId === selectedNodeId;
                          const mapsCount = n.supportingNodes?.length || 0;
                          return (
                            <div
                              key={n.nodeId}
                              onClick={() => setSelectedNodeId(n.nodeId)}
                              className={`flex justify-between items-center p-2 rounded cursor-pointer text-xs font-mono border ${
                                isSel 
                                  ? 'bg-emerald-600/10 border-emerald-500/30 text-white' 
                                  : 'bg-zinc-900/60 border-zinc-850 hover:bg-zinc-800'
                              }`}
                            >
                              <div>
                                <div className="text-white font-semibold truncate max-w-[150px]">{n.name || n.nodeId}</div>
                                <div className="text-[10px] text-zinc-500">Node Ref: {n.nodeId}</div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {mapsCount > 0 && (
                                  <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-mono px-1 py-0.2 rounded font-bold">
                                    {mapsCount} mapped
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNode(n.nodeId);
                                  }}
                                  className="text-zinc-500 hover:text-red-400 p-1 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-zinc-600 text-xs italic">
                        No nodes registered yet in this network class.
                      </div>
                    )}

                    {/* Add node quick form */}
                    <form onSubmit={handleRegisterNode} className="space-y-2 font-mono text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Node ID"
                          value={newNodeId}
                          onChange={(e) => setNewNodeId(e.target.value)}
                          className="bg-background border border-border rounded-lg p-1.5 text-xs w-full text-white outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Name tag"
                          value={newNodeName}
                          onChange={(e) => setNewNodeName(e.target.value)}
                          className="bg-background border border-border rounded-lg p-1.5 text-xs w-full text-white outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-indigo-600/25 border border-indigo-500/25 hover:bg-indigo-600/40 text-indigo-300 font-bold py-1.5 rounded-lg text-xs"
                      >
                        Add Constituent Node
                      </button>
                    </form>
                  </div>

                </div>

                {/* Bottom Node Mapping Detailed Panel (US 26, Feature 28) */}
                {targetNode ? (
                  <div className="bg-zinc-950/45 border border-zinc-900 rounded-xl p-5 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                          <GitPullRequest className="w-4 h-4 text-emerald-400" />
                          Node Linkages & Mappings: {targetNode.name || targetNode.nodeId}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">YANG node representation /supporting-node config</p>
                      </div>
                      <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                        node-id: {targetNode.nodeId}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                      {/* Left: Active node overlay-underlay links map */}
                      <div className="space-y-3">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">Active Underlay Mapped Nodes</div>
                        
                        {targetNode.supportingNodes && targetNode.supportingNodes.length > 0 ? (
                          <div className="space-y-2">
                            {targetNode.supportingNodes.map((sn, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-zinc-900 p-2.5 rounded border border-zinc-850">
                                <div className="space-y-0.5">
                                  <div className="text-[10px] text-zinc-500 text-left">unlay-network: {sn.networkRef}</div>
                                  <div className="text-white font-bold text-xs flex items-center gap-1">
                                    <Link2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    {sn.nodeRef}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSupportingNode(sn.networkRef, sn.nodeRef)}
                                  className="text-zinc-650 hover:text-red-400 hover:bg-red-500/10 p-1 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-zinc-900/40 border border-dashed border-zinc-850 rounded text-center text-zinc-500 italic text-[11px] font-sans">
                            None. This node behaves as a root logical element. Add cross-tier dependencies below.
                          </div>
                        )}
                      </div>

                      {/* Right: Add supported mapping */}
                      <form onSubmit={handleAddSupportingNode} className="bg-background/25 border border-zinc-900 p-3.5 rounded-xl space-y-3">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">Establish Underlay Mapping</div>
                        
                        {availableUnderlayNets.length > 0 ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-[9px] text-zinc-500 block mb-1">1. Choose Underlay Network</label>
                              <select
                                value={nodeUnderlayNetRef}
                                onChange={(e) => {
                                  setNodeUnderlayNetRef(e.target.value);
                                  setNodeUnderlayNodeRef('');
                                }}
                                className="bg-background/80 border border-zinc-800 rounded p-1.5 w-full text-white text-xs font-sans"
                              >
                                <option value="">-- Choose underlay --</option>
                                {availableUnderlayNets.map(netId => {
                                  const netName = networks.find(n => n.networkId === netId)?.name || netId;
                                  return (
                                    <option key={netId} value={netId}>{netName}</option>
                                  );
                                })}
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] text-zinc-500 block mb-1">2. Choose Supporting Node Ref</label>
                              <select
                                value={nodeUnderlayNodeRef}
                                onChange={(e) => setNodeUnderlayNodeRef(e.target.value)}
                                disabled={!nodeUnderlayNetRef}
                                className="bg-background/80 border border-zinc-800 rounded p-1.5 w-full text-white text-xs font-sans disabled:opacity-40"
                              >
                                <option value="">-- Choose underlay node --</option>
                                {availableUnderlayNodes.map(unode => (
                                  <option key={unode.nodeId} value={unode.nodeId}>{unode.name || unode.nodeId}</option>
                                ))}
                              </select>
                            </div>

                            <button
                              type="submit"
                              disabled={!nodeUnderlayNodeRef}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-800 text-white font-bold py-1.5 px-3 rounded text-xs mt-1"
                            >
                              Commit Supported Node Map
                            </button>
                          </div>
                        ) : (
                          <div className="text-zinc-600 text-[11px] leading-relaxed italic font-sans p-2">
                            To create a cross-tier node layout, first define at least one "Underlay Network" relationship on the parent layout above.
                          </div>
                        )}
                      </form>
                    </div>

                    {/* Row 2 inside targetNode: Termination Points (US 31 - Config and Layer TPs) */}
                    <div className="border-t border-zinc-900 pt-5 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                      {/* Left: Termination Point List */}
                      <div className="space-y-3">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold flex items-center justify-between">
                          <span>Node Termination Points</span>
                          <span className="text-[9px] text-zinc-600 tracking-normal font-sans">YANG: tp-id</span>
                        </div>
                        
                        {targetNode.terminationPoints && targetNode.terminationPoints.length > 0 ? (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-left">
                            {targetNode.terminationPoints.map((tp, idx) => (
                              <div key={idx} className="bg-zinc-900/65 p-2.5 rounded border border-zinc-850 flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                  <div className="text-white font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    {tp.tpId}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTp(tp.tpId)}
                                    className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors shrink-0"
                                    title="Remove TP"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                
                                {tp.supportingTerminationPoints && tp.supportingTerminationPoints.map((stp, sIdx) => (
                                  <div key={sIdx} className="text-[9px] text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10">
                                    <span className="truncate block text-left">↳ underlay: {stp.networkRef}/{stp.nodeRef}/{stp.tpRef}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-zinc-900/40 border border-dashed border-zinc-850 rounded text-center text-zinc-500 italic text-[11px] font-sans">
                            No interface ports or termination points configured on this node chassis.
                          </div>
                        )}
                      </div>

                      {/* Right: Add TP Form */}
                      <form onSubmit={handleRegisterTp} className="bg-background/25 border border-zinc-900 p-3.5 rounded-xl space-y-3 text-left">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">Configure Termination Point</div>
                        
                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="text-[9px] text-zinc-500 block mb-0.5">Termination Point ID (URI) *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. tp-L3-ge1"
                              value={newTpId}
                              onChange={(e) => setNewTpId(e.target.value)}
                              className="bg-background border border-border rounded p-1.5 w-full text-white text-xs outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>

                          {/* Supporting underlay TP config */}
                          <div className="border-t border-zinc-900/60 pt-2.5 mt-2 space-y-2">
                            <span className="text-[9px] text-zinc-550 block font-bold uppercase tracking-wider">Map to Physical Underlay TP (Optional)</span>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] text-zinc-550 block mb-0.5 font-sans">Underlay Network</label>
                                <select
                                  value={tpUnderlayNetRef}
                                  onChange={(e) => {
                                    setTpUnderlayNetRef(e.target.value);
                                    setTpUnderlayNodeRef('');
                                    setTpUnderlayTpRef('');
                                  }}
                                  className="bg-background/80 border border-zinc-850 rounded p-1 text-zinc-300 text-xs w-full font-sans outline-none"
                                >
                                  <option value="">-- None --</option>
                                  {availableUnderlayNets.map(netId => (
                                    <option key={netId} value={netId}>{networks.find(n => n.networkId === netId)?.name || netId}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[9px] text-zinc-555 block mb-0.5 font-sans">Underlay Node</label>
                                <select
                                  value={tpUnderlayNodeRef}
                                  onChange={(e) => {
                                    setTpUnderlayNodeRef(e.target.value);
                                    setTpUnderlayTpRef('');
                                  }}
                                  disabled={!tpUnderlayNetRef}
                                  className="bg-background/80 border border-zinc-850 rounded p-1 text-zinc-300 text-xs w-full font-sans disabled:opacity-40 outline-none"
                                >
                                  <option value="">-- Select node --</option>
                                  {availableTpUnderlayNodes.map(node => (
                                    <option key={node.nodeId} value={node.nodeId}>{node.name || node.nodeId}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] text-zinc-555 block mb-0.5 font-sans font-sans">Underlay TP Reference</label>
                              <select
                                value={tpUnderlayTpRef}
                                onChange={(e) => setTpUnderlayTpRef(e.target.value)}
                                disabled={!tpUnderlayNodeRef}
                                className="bg-background/80 border border-zinc-850 rounded p-1 text-zinc-300 text-xs w-full font-sans disabled:opacity-40 outline-none"
                              >
                                <option value="">-- Select TP --</option>
                                {availableTpUnderlayTps.map(tp => (
                                  <option key={tp.tpId} value={tp.tpId}>{tp.tpId}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-indigo-600/30 border border-indigo-500/20 hover:bg-indigo-600/40 text-indigo-300 font-bold py-1.5 px-3 rounded text-xs mt-1"
                          >
                            Map & Add Termination Point
                          </button>
                        </div>
                      </form>
                    </div>

                  </div>
                ) : (
                  <div className="bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl text-center text-xs font-sans text-zinc-500 flex flex-col items-center gap-1">
                    <Info className="w-5 h-5 text-zinc-600 mb-1" />
                    <span>Select a constituent node inside {selectedNetwork.name || selectedNetwork.networkId} to configure vertical layering couplings.</span>
                  </div>
                )}

                {/* --- Network Link Builder Panel (US 27, 32, 33, 34, UC 14) --- */}
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 space-y-4 text-left font-mono">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                        <GitBranch className="w-4 h-4 text-emerald-400" />
                        Network Links Explorer (RFC 8345)
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                        Establish topological link elements mapping source elements to destination interfaces.
                      </p>
                    </div>
                    <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono font-extrabold uppercase shrink-0">
                      Topological Links
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs bg-zinc-950/20 p-2.5 rounded-xl border border-zinc-900/60">
                    {/* Left: Active Link Inventory list (7 cols) */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold pb-1">Link Inventory</div>
                      {selectedNetwork.links && selectedNetwork.links.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {selectedNetwork.links.map((link) => (
                            <div key={link.linkId} className="bg-zinc-900/50 hover:bg-zinc-900/85 p-3 rounded-xl border border-zinc-850 flex flex-col gap-2 relative group transition-all">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-bold text-white text-xs"><DrilldownLink id={link.linkId} type="link" onNavigate={onNavigate} /></span>
                                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-2">
                                    <span className="text-white font-semibold truncate bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900"><DrilldownLink id={link.source.sourceNode} type="device" onNavigate={onNavigate} /> (<DrilldownLink id={link.source.sourceTp} type="port" onNavigate={onNavigate} />)</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span className="text-white font-semibold truncate bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900"><DrilldownLink id={link.destination.destNode} type="device" onNavigate={onNavigate} /> (<DrilldownLink id={link.destination.destTp} type="port" onNavigate={onNavigate} />)</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLink(link.linkId)}
                                  className="opacity-0 group-hover:opacity-100 text-zinc-550 hover:text-red-400 p-1.2 rounded hover:bg-zinc-900 transition-all shrink-0"
                                  title="Remove link"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {link.supportingLinks && link.supportingLinks.length > 0 && (
                                <div className="text-[9px] text-indigo-400 bg-indigo-500/5 p-2 rounded border border-indigo-500/10 flex flex-col gap-0.5 mt-1">
                                  <span className="text-[8px] text-zinc-650 uppercase font-bold">Underlay Links References:</span>
                                  {link.supportingLinks.map((sl, idx) => (
                                    <span key={idx}>↳ network: {sl.networkRef} / link: {sl.linkRef}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 bg-zinc-900/40 border border-dashed border-zinc-850 rounded text-center text-zinc-650 italic text-[11px] font-sans">
                          No overlay links registered in this logical group topology yet. Choose nodes and ports below to connect them.
                        </div>
                      )}
                    </div>

                    {/* Right: Build Links editor form (5 cols) */}
                    <form onSubmit={handleRegisterLink} className="lg:col-span-5 bg-background/25 border border-zinc-900 p-3.5 rounded-xl space-y-3 text-left">
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold border-b border-zinc-900 pb-1.5">Conjoin Inter-Node Interfaces</div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[9px] text-zinc-500 block mb-0.5">Topological Link ID (URI) *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. link-L3-TK-to-OS"
                            value={newLinkId}
                            onChange={(e) => setNewLinkId(e.target.value)}
                            className="bg-background border border-border rounded p-1 text-xs w-full text-white outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>

                        {/* Source TP picker */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-zinc-550 block mb-0.5 font-sans">Source Node *</label>
                            <select
                              value={linkSourceNode}
                              onChange={(e) => {
                                setLinkSourceNode(e.target.value);
                                setLinkSourceTp('');
                              }}
                              required
                              className="bg-background/80 border border-zinc-850 rounded p-1 text-zinc-300 text-xs w-full font-sans outline-none"
                            >
                              <option value="">-- Choose --</option>
                              {selectedNetwork.nodes.map(node => (
                                <option key={node.nodeId} value={node.nodeId}>{node.name || node.nodeId}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] text-zinc-555 block mb-0.5 font-sans">Source TP *</label>
                            <select
                              value={linkSourceTp}
                              onChange={(e) => setLinkSourceTp(e.target.value)}
                              required
                              disabled={!linkSourceNode}
                              className="bg-background/80 border border-zinc-850 rounded p-1 text-zinc-300 text-xs w-full font-sans disabled:opacity-40 outline-none"
                            >
                              <option value="">-- Choose --</option>
                              {sourceTps.map(tp => (
                                <option key={tp.tpId} value={tp.tpId}>{tp.tpId}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Dest TP picker */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-zinc-550 block mb-0.5 font-sans">Destination Node *</label>
                            <select
                              value={linkDestNode}
                              onChange={(e) => {
                                setLinkDestNode(e.target.value);
                                setLinkDestTp('');
                              }}
                              required
                              className="bg-background/80 border border-zinc-850 rounded p-1 text-zinc-300 text-xs w-full font-sans outline-none"
                            >
                              <option value="">-- Choose --</option>
                              {selectedNetwork.nodes.map(node => (
                                <option key={node.nodeId} value={node.nodeId}>{node.name || node.nodeId}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] text-zinc-555 block mb-0.5 font-sans">Destination TP *</label>
                            <select
                              value={linkDestTp}
                              onChange={(e) => setLinkDestTp(e.target.value)}
                              required
                              disabled={!linkDestNode}
                              className="bg-background/80 border border-zinc-850 rounded p-1 text-zinc-300 text-xs w-full font-sans disabled:opacity-40 outline-none"
                            >
                              <option value="">-- Choose --</option>
                              {destTps.map(tp => (
                                <option key={tp.tpId} value={tp.tpId}>{tp.tpId}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Underlay links mapping (US 33) */}
                        <div className="border-t border-zinc-900 pt-2 space-y-2 select-none">
                          <span className="text-[9px] text-zinc-500 block font-bold uppercase tracking-wider">Map Overlay Link to Underlay</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] text-zinc-555 block mb-0.5 font-sans">Underlay Network</label>
                              <select
                                value={linkUnderlayNetRef}
                                onChange={(e) => {
                                  setLinkUnderlayNetRef(e.target.value);
                                  setLinkUnderlayLinkRef('');
                                }}
                                className="bg-background/80 border border-zinc-850 rounded p-1 text-zinc-300 text-xs w-full font-sans outline-none"
                              >
                                <option value="">-- None --</option>
                                {availableUnderlayNets.map(netId => (
                                  <option key={netId} value={netId}>{networks.find(n => n.networkId === netId)?.name || netId}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] text-zinc-555 block mb-0.5 font-sans font-sans">Underlay Link</label>
                              <select
                                value={linkUnderlayLinkRef}
                                onChange={(e) => setLinkUnderlayLinkRef(e.target.value)}
                                disabled={!linkUnderlayNetRef}
                                className="bg-background/80 border border-zinc-850 rounded p-1 text-zinc-300 text-xs w-full font-sans disabled:opacity-40 outline-none"
                              >
                                <option value="">-- Choose link --</option>
                                {availableLinkUnderlayLinks.map(lnk => (
                                  <option key={lnk.linkId} value={lnk.linkId}>{lnk.linkId}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded text-xs mt-1"
                        >
                          Establish Interface Link
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 font-mono text-zinc-500 flex flex-col items-center gap-2">
                <Info className="w-8 h-8 text-zinc-600" />
                Select a network base topology from the container explorer.
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 2: VERTICAL LAYER VISUALIZER --- */}
      {activeTab === 'layering-visualizer' && (
        <div className="bg-zinc-950/10 border border-border/70 rounded-xl p-6 space-y-6 text-left">
          <div className="border-b border-zinc-900 pb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-emerald-500" />
              Multi-Layer Path Layering Visualizer
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5 font-sans">
              Diagram tracing vertical mapping links from high-level carrier overlay routers down to underlying passive L0 transport transponders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch font-mono">
            
            {/* Visual stacking view */}
            <div className="bg-zinc-950/45 p-6 rounded-2xl border border-zinc-900 flex flex-col gap-6 relative overflow-hidden min-h-[380px]">
              
              {/* Overlay Network tier */}
              <div className="border border-emerald-500/20 bg-emerald-600/10 rounded-xl p-4 space-y-3 relative z-10">
                <div className="flex justify-between items-center text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide">
                  <span>Overlay Class (IP/L3 Layer)</span>
                  <span>overlay-L3</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-left font-mono">
                  {networks.find(n => n.networkId === 'overlay-L3')?.nodes.map(node => (
                    <div key={node.nodeId} className="bg-zinc-950/80 p-2.5 border border-emerald-500/20 rounded-lg flex flex-col gap-1 shadow">
                      <span className="text-white font-extrabold text-xs truncate">{node.name || node.nodeId}</span>
                      <span className="text-[10px] text-zinc-500">ID: <DrilldownLink id={node.nodeId} type="device" onNavigate={onNavigate} /></span>
                      
                      {node.supportingNodes && node.supportingNodes.length > 0 && (
                        <div className="mt-2 pt-1 border-t border-zinc-900 text-[9px] text-indigo-400 flex flex-col gap-0.5">
                          <span className="text-zinc-655 uppercase font-bold text-[8px]">Supported node coordinates:</span>
                          {node.supportingNodes.map((sn, i) => (
                            <span key={i} className="truncate select-none font-bold text-[10px]">↳ underlay: {sn.nodeRef}</span>
                          ))}
                        </div>
                      )}

                      {node.terminationPoints && node.terminationPoints.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-dashed border-zinc-900">
                          <span className="text-zinc-600 uppercase font-bold text-[8px] block mb-1">Interfaces (TPs):</span>
                          <div className="flex flex-wrap gap-1">
                            {node.terminationPoints.map((tp, tIdx) => (
                              <span key={tIdx} className="text-[9px] px-1 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono rounded inline-block" title={tp.supportingTerminationPoints?.map(stp => `Supported by: ${stp.tpRef}`).join(', ')}>
                                {tp.tpId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )) || (
                    <span className="col-span-2 text-zinc-650 text-center text-xs italic">No default overlay-L3 configured.</span>
                  )}
                </div>
              </div>

              {/* Vertical tracer lines decoration */}
              <div className="h-10 flex justify-around items-center relative select-none">
                <div className="w-[1.5px] h-full bg-gradient-to-b from-emerald-500/40 via-indigo-500/40 to-indigo-500/20 border-dashed border-l border-zinc-800"></div>
                <div className="w-[1.5px] h-full bg-gradient-to-b from-emerald-500/40 via-indigo-500/40 to-indigo-500/20 border-dashed border-l border-zinc-800"></div>
              </div>

              {/* Underlay Network tier */}
              <div className="border border-indigo-500/20 bg-indigo-600/5 rounded-xl p-4 space-y-3 relative z-10">
                <div className="flex justify-between items-center text-[10px] text-indigo-400 font-extrabold uppercase tracking-wide">
                  <span>Underlay Class (Optical L0 Layer)</span>
                  <span>underlay-L0</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-left">
                  {networks.find(n => n.networkId === 'underlay-L0')?.nodes.map(node => (
                    <div key={node.nodeId} className="bg-zinc-950/80 p-2 border border-zinc-850 rounded-lg flex flex-col gap-1">
                      <span className="text-white font-bold text-[11px] truncate">{node.name || node.nodeId}</span>
                      <span className="text-[9px] text-zinc-500 truncate">ID: <DrilldownLink id={node.nodeId} type="device" onNavigate={onNavigate} /></span>

                      {node.terminationPoints && node.terminationPoints.length > 0 && (
                        <div className="mt-1 pt-1 border-t border-dashed border-zinc-900 flex flex-wrap gap-0.5">
                          {node.terminationPoints.map((tp, tIdx) => (
                            <span key={tIdx} className="text-[8px] px-1 bg-zinc-950 text-indigo-400 font-mono rounded" title="Optical Physical Port">
                              {tp.tpId}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )) || (
                    <span className="col-span-3 text-zinc-650 text-center text-xs italic">No underlay-L0 configured.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Structured references table explaining US 26 */}
            <div className="bg-zinc-950/30 p-5 rounded-2xl border border-zinc-900 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                  <Info className="w-4 h-4 text-emerald-400" />
                  Layering Relationship Map Values
                </h4>

                <div className="text-xs font-mono space-y-3.5 leading-relaxed text-zinc-400">
                  <div className="space-y-1">
                    <div className="text-white font-bold">1. Network supporting relationships:</div>
                    <p className="text-[11px]">The L3 network <code className="text-emerald-400 bg-background px-1 rounded">overlay-L3</code> declares `supporting-network` referencing the <code className="text-indigo-400 bg-background px-1 rounded">underlay-L0</code>.</p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-white font-bold">2. Specific node-to-node mappings:</div>
                    <ul className="list-disc leading-loose list-inside text-[11px] space-y-1">
                      <li>
                        <span className="text-white">Tokyo Router</span> is mapped to the <span className="text-indigo-400 font-semibold">Tokyo Optical Terminal</span>
                      </li>
                      <li>
                        <span className="text-white">Osaka Router</span> is mapped to the <span className="text-indigo-400 font-semibold">Osaka Optical Terminal</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <div className="text-white font-bold">3. Network Operations budget validation:</div>
                    <p className="text-[11px]">By defining these vertical dependencies, routing protocol planners can predict overlay link failure propagation if a fiber core experiences attenuation spikes or physical cuts.</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-500/5 text-indigo-400 border border-indigo-500/20 text-[11px] rounded-xl flex items-center gap-2 mt-4.5">
                <Share2 className="w-4 h-4 shrink-0" />
                <span>Supports exporting compiled multi-layer NMDA JSON configurations directly and tracking active circuit pathways.</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 3: BDD SCENARIOS --- */}
      {activeTab === 'bdd-scenarios' && (
        <div className="bg-zinc-950/10 border border-border/70 rounded-xl p-6 space-y-6 text-left">
          <div className="border-b border-zinc-900 pb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              RFC 8345 YANG Conforming BDD Sandbox
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5 font-sans">
              Evaluate real physical and logical constraints of "A YANG Data Model for networks" RFC 8345 validation pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start font-mono">
            {/* Scenario Chooser */}
            <div className="md:col-span-4 bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl space-y-3 text-xs">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold mb-1">Scenario Suite</div>
              
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setActiveScenario('overlay-L0-L3');
                    setScenarioStatus('idle');
                    setScenarioLogs([]);
                    setScenarioJson('');
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeScenario === 'overlay-L0-L3'
                      ? 'bg-emerald-600/10 border-emerald-500 text-white'
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-bold">Scenario 1: Overlay-Underlay</div>
                  <p className="text-[10px] text-zinc-500 mt-1">Configure an overlay network on top of an active underlay.</p>
                </button>

                <button
                  onClick={() => {
                    setActiveScenario('referential-integrity');
                    setScenarioStatus('idle');
                    setScenarioLogs([]);
                    setScenarioJson('');
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeScenario === 'referential-integrity'
                      ? 'bg-emerald-600/10 border-emerald-500 text-white'
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-bold">Scenario 2: Integrity constraint</div>
                  <p className="text-[10px] text-zinc-500 mt-1">Rollback overlay updates referencing invalid underlay parameters.</p>
                </button>

                <button
                  onClick={() => {
                    setActiveScenario('node-layer-mapping');
                    setScenarioStatus('idle');
                    setScenarioLogs([]);
                    setScenarioJson('');
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeScenario === 'node-layer-mapping'
                      ? 'bg-emerald-600/10 border-emerald-500 text-white'
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-bold">Scenario 3: Supported Nodes</div>
                  <p className="text-[10px] text-zinc-500 mt-1">Map supported overlay elements to physical core cards.</p>
                </button>

                <button
                  onClick={() => {
                    setActiveScenario('tp-connection');
                    setScenarioStatus('idle');
                    setScenarioLogs([]);
                    setScenarioJson('');
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeScenario === 'tp-connection'
                      ? 'bg-emerald-600/10 border-emerald-500 text-white'
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-bold">Scenario 4: Connect TP Nodes</div>
                  <p className="text-[10px] text-zinc-500 mt-1">Configure interface termination points and connect nodes with overlay links.</p>
                </button>

                <button
                  onClick={() => {
                    setActiveScenario('link-loop-audits');
                    setScenarioStatus('idle');
                    setScenarioLogs([]);
                    setScenarioJson('');
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeScenario === 'link-loop-audits'
                      ? 'bg-emerald-600/10 border-emerald-500 text-white'
                      : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-bold">Scenario 5: Loop Auditing</div>
                  <p className="text-[10px] text-zinc-500 mt-1">Audit transitive link reference recursion loops and protect datastore integrity.</p>
                </button>
              </div>

              <button
                onClick={executeScenarioSimulation}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs mt-3 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Execute Simulation
              </button>
            </div>

            {/* Scenario Logs & Result Console */}
            <div className="md:col-span-8 space-y-4">
              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-900 font-mono text-xs text-zinc-300 min-h-[170px] space-y-2">
                <div className="text-[10px] uppercase text-zinc-500 tracking-wider font-extrabold border-b border-zinc-900 pb-2 flex items-center justify-between">
                  <span>Simulation Diagnostic Logs</span>
                  <span className={`px-2 py-0.2 rounded font-bold uppercase ${
                    scenarioStatus === 'idle' ? 'bg-zinc-800 text-zinc-400' :
                    scenarioStatus === 'running' ? 'bg-blue-600/15 text-blue-400' :
                    scenarioStatus === 'success' ? 'bg-emerald-600/15 text-emerald-400' :
                    'bg-red-600/15 text-red-400'
                  }`}>
                    {scenarioStatus}
                  </span>
                </div>
                
                {scenarioLogs.length > 0 ? (
                  <div className="space-y-1.5 pt-2 max-h-[180px] overflow-y-auto">
                    {scenarioLogs.map((log, i) => (
                      <div key={i} className={`flex items-start gap-2 ${
                        log.startsWith('ERROR') ? 'text-red-400' :
                        log.startsWith('STATUS: PASS') || log.startsWith('WHEN') || log.startsWith('AND') ? 'text-emerald-400' :
                        'text-zinc-300'
                      }`}>
                        <span className="text-zinc-650 font-bold">[{i+1}]</span>
                        <p>{log}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-zinc-600 italic">
                    Press "Execute Simulation" above to run the BDD scenario validation.
                  </div>
                )}
              </div>

              {scenarioJson && (
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-900 font-mono text-xs text-zinc-300 space-y-2 animate-fade-in text-left">
                  <div className="text-[10px] uppercase text-zinc-500 tracking-wider font-extrabold border-b border-zinc-900 pb-2">
                    YANG Conforming JSON Datastore Payload
                  </div>
                  <pre className="text-indigo-300 overflow-x-auto pt-2 text-[11px] leading-relaxed max-h-[220px]">
                    {scenarioJson}
                  </pre>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 4: OTN & FG-OTN SLICING (EPIC 13) --- */}
      {activeTab === 'otn-slicing' && (() => {
        // Find networks that display L1-transport or have otn-topology flag
        const otnNetworks = networks.filter(n => n.otnTopology || n.networkTypes?.type === 'L1-transport');
        const activeOtnNet = otnNetworks.find(n => n.networkId === selectedNetworkId) || otnNetworks[0] || networks[0];
        
        if (!activeOtnNet) {
          return (
            <div className="bg-zinc-905/40 p-10 rounded-xl text-center text-zinc-550 italic text-xs font-sans border border-dashed border-zinc-800">
              No networks matched for OTN topology layer. Please configure L1 Transport network topology.
            </div>
          );
        }

        // Selected Node inside OTN Network
        const otnNodes = activeOtnNet.nodes || [];
        const activeOtnNode = otnNodes.find(n => n.nodeId === selectedNodeId) || otnNodes[0];

        // Selected Link inside OTN Network
        const otnLinks = activeOtnNet.links || [];
        const activeOtnLink = otnLinks.find(l => l.linkId === selectedLinkId) || otnLinks[0];

        // Compute active timeslots set
        const highlightSlots: number[] = [];
        if (activeOtnLink) {
          if (activeOtnLink.fgotnList) {
            activeOtnLink.fgotnList.forEach(fg => {
              const res = validateTsList(fg.oduTsNumber);
              if (res.isValid) {
                highlightSlots.push(...res.slots);
              }
            });
          }
          if (activeOtnLink.fgtsRange) {
            activeOtnLink.fgtsRange.forEach(range => {
              // try evaluating range reserved slots
              const res = validateTsList(range.fgtsReserved || range.oduTsNumber);
              if (res.isValid) {
                highlightSlots.push(...res.slots);
              }
            });
          }
        }
        const activeTsSet = new Set(highlightSlots);

        // Handle addition/edit of TP OTN metadata parameters
        const handleSaveTpOtwnMetadata = (tpId: string, tsgVal: string, sigsStr: string) => {
          const rawSigs = sigsStr.split(',').map(s => s.trim()).filter(Boolean);
          const otnLinkTp = {
            tsg: tsgVal,
            supportedClientSignal: rawSigs.map(sig => ({ clientSignal: sig }))
          };

          if (!activeOtnNode) return;
          const updatedNode: RFC8345Node = {
            ...activeOtnNode,
            terminationPoints: (activeOtnNode.terminationPoints || []).map(tp => 
              tp.tpId === tpId 
                ? { ...tp, otnLinkTp } 
                : tp
            )
          };

          const updatedNet: RFC8345Network = {
            ...activeOtnNet,
            nodes: activeOtnNet.nodes.map(n => n.nodeId === activeOtnNode.nodeId ? updatedNode : n)
          };

          try {
            networkService.updateRFC8345Network(updatedNet);
            setNetworks(networkService.getRFC8345Networks());
            triggerAlert('success', `OTN Port attributes updated for TP '${tpId}' under card '${activeOtnNode.nodeId}'.`);
          } catch (e: any) {
            triggerAlert('error', e.message);
          }
        };

        // Handle addition of ODUflex allocation (fgotnList)
        const handleAddOduFlexSlice = (e: React.FormEvent) => {
          e.preventDefault();
          if (!activeOtnLink) {
            triggerAlert('error', 'Please select an active OTN physical line link first.');
            return;
          }

          const valRes = validateTsList(fgotnTsNumber);
          if (!valRes.isValid) {
            triggerAlert('error', `YANG Integrity failure: ${valRes.error}`);
            return;
          }

          // Check if any slot is already reserved / overlapping
          for (const s of valRes.slots) {
            if (activeTsSet.has(s)) {
              triggerAlert('error', `Conflict Constraint Violation: Tributary timeslot ${s} is already allocated/reserved! Overlapping slice forbidden.`);
              return;
            }
          }

          const currentFgotn = activeOtnLink.fgotnList || [];
          const newFgotnItem = {
            oduType: fgotnOduType,
            oduTsNumber: fgotnTsNumber,
            fgotnBandwidth: fgotnBandwidth
          };

          const updatedLink: RFC8345Link = {
            ...activeOtnLink,
            fgotnList: [...currentFgotn, newFgotnItem]
          };

          const updatedNet: RFC8345Network = {
            ...activeOtnNet,
            links: activeOtnNet.links.map(l => l.linkId === activeOtnLink.linkId ? updatedLink : l)
          };

          try {
            networkService.updateRFC8345Network(updatedNet);
            setNetworks(networkService.getRFC8345Networks());
            setFgotnTsNumber('');
            triggerAlert('success', `Created fine-grain sub-1G slicing slice on timeslots '${fgotnTsNumber}' for ${fgotnBandwidth} Mbps.`);
          } catch (err: any) {
            triggerAlert('error', err.message);
          }
        };

        // Handle addition of fgtsRange record
        const handleAddFgtsRange = (e: React.FormEvent) => {
          e.preventDefault();
          if (!activeOtnLink) {
            triggerAlert('error', 'Please select an active OTN physical line link first.');
            return;
          }

          const valRange = validateTsList(fgtsRangeTsNumber);
          if (!valRange.isValid) {
            triggerAlert('error', `YANG Range format failure: ${valRange.error}`);
            return;
          }

          const currentRanges = activeOtnLink.fgtsRange || [];
          const newRangeItem = {
            oduType: fgtsRangeOduType,
            oduTsNumber: fgtsRangeTsNumber,
            fgtsReserved: fgtsReservedSlots,
            fgtsUnreserved: fgtsUnreservedSlots
          };

          const updatedLink: RFC8345Link = {
            ...activeOtnLink,
            fgtsRange: [...currentRanges, newRangeItem]
          };

          const updatedNet: RFC8345Network = {
            ...activeOtnNet,
            links: activeOtnNet.links.map(l => l.linkId === activeOtnLink.linkId ? updatedLink : l)
          };

          try {
            networkService.updateRFC8345Network(updatedNet);
            setNetworks(networkService.getRFC8345Networks());
            setFgtsRangeTsNumber('');
            triggerAlert('success', `Enacted slot reservations: Reserved [${fgtsReservedSlots}], Unreserved [${fgtsUnreservedSlots}].`);
          } catch (err: any) {
            triggerAlert('error', err.message);
          }
        };

        // Update physical link distance
        const handleUpdateDistance = (distKm: number) => {
          if (!activeOtnLink) return;
          const updatedLink: RFC8345Link = {
            ...activeOtnLink,
            otnLink: { distance: distKm }
          };

          const updatedNet: RFC8345Network = {
            ...activeOtnNet,
            links: activeOtnNet.links.map(l => l.linkId === activeOtnLink.linkId ? updatedLink : l)
          };

          try {
            networkService.updateRFC8345Network(updatedNet);
            setNetworks(networkService.getRFC8345Networks());
          } catch (err: any) {
            triggerAlert('error', err.message);
          }
        };

        // Clear allocations
        const handleResetAllocations = () => {
          if (!activeOtnLink) return;
          const updatedLink: RFC8345Link = {
            ...activeOtnLink,
            fgotnList: [],
            fgtsRange: []
          };

          const updatedNet: RFC8345Network = {
            ...activeOtnNet,
            links: activeOtnNet.links.map(l => l.linkId === activeOtnLink.linkId ? updatedLink : l)
          };

          try {
            networkService.updateRFC8345Network(updatedNet);
            setNetworks(networkService.getRFC8345Networks());
            triggerAlert('warning', `Reset timeslot allocations & reserved ranges on link '${activeOtnLink.linkId}'.`);
          } catch (err: any) {
            triggerAlert('error', err.message);
          }
        };

        return (
          <div className="space-y-6">
            
            {/* Context Header Area */}
            <div className="bg-zinc-950/25 border border-zinc-900 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-white text-base font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  ietf-otn-topology & ietf-fgotn-topology Controller (Epic 13)
                </h3>
                <p className="text-zinc-500 text-[11px] font-sans mt-0.5 max-w-3xl leading-normal">
                  Configure Tributary Slot Granularity (tsg), Client Signal list, physical distance, and manage fine-grain sub-1G (fgODUflex) timeslot allocations on the interactive timeslots matrix grid.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-extrabold uppercase">
                  G.709 YANG Standards
                </span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-extrabold uppercase">
                  Fine-grain OTN Draft
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono">
              
              {/* Left side: Network, Nodes & Port-Card configurations */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Card 1: Network & Card Selection */}
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 space-y-4 text-left">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold uppercase text-white">Active Transport Datastore</span>
                  </div>
                  
                  <div className="space-y-3 font-sans">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Select Network Container</label>
                      <select
                        value={selectedNetworkId}
                        onChange={(e) => {
                          setSelectedNetworkId(e.target.value);
                          setSelectedNodeId('');
                        }}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-indigo-500 font-mono"
                      >
                        {otnNetworks.map(n => (
                          <option key={n.networkId} value={n.networkId}>{n.name || n.networkId} ({n.networkId})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Select Active Optical Card Node</label>
                      <select
                        value={activeOtnNode?.nodeId || ''}
                        onChange={(e) => setSelectedNodeId(e.target.value)}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-indigo-500 font-mono"
                      >
                        <option value="">-- Choose node --</option>
                        {otnNodes.map(node => (
                          <option key={node.nodeId} value={node.nodeId}>{node.name || node.nodeId}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Card 2: Interactive TP Ports info & configurations */}
                {activeOtnNode ? (
                  <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <span className="font-extrabold uppercase text-white flex items-center gap-1.5 font-mono">
                        <Network className="w-4 h-4 text-emerald-400" />
                        OTN Port interface (YANG tps)
                      </span>
                      <span className="text-[9px] text-zinc-500">Node ID: {activeOtnNode.nodeId}</span>
                    </div>

                    {activeOtnNode.terminationPoints && activeOtnNode.terminationPoints.length > 0 ? (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {activeOtnNode.terminationPoints.map(tp => {
                          const otn = tp.otnLinkTp || {
                            tsg: 'tsg-1.25G',
                            supportedClientSignal: [{ clientSignal: 'iana-if-type:ethernetCsmacd' }]
                          };
                          return (
                            <div key={tp.tpId} className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-850 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs"><DrilldownLink id={tp.tpId} type="port" onNavigate={onNavigate} /></span>
                                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-extrabold uppercase font-mono">
                                  {otn.tsg}
                                </span>
                              </div>

                              <div className="space-y-1 text-[10px] text-zinc-400 text-left border-t border-zinc-900/50 pt-2 font-mono">
                                <div className="flex justify-between">
                                  <span className="text-zinc-550">Tributary Slot Rate:</span>
                                  <span className="text-zinc-300 font-semibold">{otn.tsg === 'tsg-1.25G' ? '1.25 Gbps' : '2.5 Gbps'}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-zinc-550 block">Supported Clients:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {(otn.supportedClientSignal || []).map((cs, i) => (
                                      <span key={i} className="px-1 text-[8px] border border-zinc-800 bg-zinc-950 rounded select-none text-indigo-400 font-mono">
                                        {cs.clientSignal}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Rapid attribute configuration */}
                              <div className="pt-2 border-t border-dashed border-zinc-850/50 flex gap-1.5 text-[10px]">
                                <select
                                  value={otn.tsg}
                                  onChange={(e) => handleSaveTpOtwnMetadata(tp.tpId, e.target.value, otn.supportedClientSignal?.map(s => s.clientSignal).join(', ') || '')}
                                  className="bg-background border border-border text-[9px] rounded px-1.5 py-0.5 text-white"
                                >
                                  <option value="tsg-1.25G">tsg-1.25G</option>
                                  <option value="tsg-2.5G">tsg-2.5G</option>
                                </select>
                                <input
                                  type="text"
                                  defaultValue={otn.supportedClientSignal?.map(s => s.clientSignal).join(', ')}
                                  onBlur={(e) => handleSaveTpOtwnMetadata(tp.tpId, otn.tsg, e.target.value)}
                                  placeholder="Signals list (comma-sep)"
                                  className="bg-background border border-border text-[9px] rounded px-1.5 py-0.5 flex-1 min-w-0 text-white font-mono"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-zinc-900/10 border border-zinc-850 border-dashed rounded text-zinc-500 italic font-sans border-t border-zinc-850">
                        No interface ports or termination points defined for this node.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-zinc-950/20 border border-zinc-905 rounded-xl text-zinc-550 italic font-sans text-xs">
                    Please select a card node or configure one above.
                  </div>
                )}

              </div>

              {/* Right side: Optical Links & Tributary Slicing Workspace */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Card 3: Link & Timeslot allocation detail view */}
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 space-y-4 text-left">
                  
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3 flex-wrap gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Select Physical Fiber Link</label>
                      <select
                        value={activeOtnLink?.linkId || ''}
                        onChange={(e) => setSelectedLinkId(e.target.value)}
                        className="bg-zinc-950 border border-zinc-850 rounded p-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono w-[280px]"
                      >
                        <option value="">-- Choose transport fiber link --</option>
                        {otnLinks.map(l => (
                          <option key={l.linkId} value={l.linkId}>{l.linkId} ({l.source.sourceNode} ➔ {l.destination.destNode})</option>
                        ))}
                      </select>
                    </div>

                    {activeOtnLink && (
                      <button
                        type="button"
                        onClick={handleResetAllocations}
                        className="text-red-400 border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-[10px] uppercase font-bold rounded hover:bg-red-500/15 transition-all text-center shrink-0"
                      >
                        Reset allocations
                      </button>
                    )}
                  </div>

                  {activeOtnLink ? (
                    <div className="space-y-5 flex-1 w-full text-xs font-mono">
                      
                      {/* Fiber configuration attributes details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <div className="bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-850 flex flex-col justify-between gap-1">
                          <div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono font-bold">Physical Link Length</div>
                            <span className="text-base font-bold text-white font-mono mt-1 block font-mono">{(activeOtnLink.otnLink?.distance) || 512} km</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="range"
                              min={1}
                              max={5000}
                              value={(activeOtnLink.otnLink?.distance) || 512}
                              onChange={(e) => handleUpdateDistance(Number(e.target.value))}
                              className="flex-1 accent-emerald-500 h-1.5 bg-zinc-955 rounded"
                            />
                          </div>
                        </div>

                        <div className="bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-850 space-y-1">
                          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono font-bold col-span-2">Timeslot Bandwidth Pools</div>
                          <div className="text-[10px] text-zinc-300 block pt-1 font-mono">
                            Slicing count: <strong className="text-white font-mono">{(activeOtnLink.fgotnList || []).length} active ODU classes</strong>
                          </div>
                          <div className="text-[10px] text-zinc-300 block pt-0.5 font-mono font-mono">
                            Reserved: <strong className="text-emerald-400 font-extrabold font-mono">{activeTsSet.size} / 80 slots</strong>
                          </div>
                          <div className="text-[10px] text-zinc-300 block font-mono font-mono">
                            Virtual capacity sum: <strong className="text-indigo-400 font-extrabold font-mono">{activeOtnLink.fgotnList?.reduce((a,c)=>a+c.fgotnBandwidth, 0) || 0} Mbps</strong>
                          </div>
                        </div>

                      </div>

                      {/* INTERACTIVE TIMESLOT GRID MATRIX VISUALIZER */}
                      <div className="bg-zinc-900/10 p-5 rounded-xl border border-zinc-850/60 space-y-4">
                        <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold">Timeslot Grid Map (G.709 ODU2 - 80 Tributary Channels)</span>
                          <div className="flex gap-3 text-[9px] font-mono font-mono">
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40"></span>Reserved (10M slots)</span>
                            <span className="flex items-center gap-1 text-zinc-500"><span className="w-2.5 h-2.5 rounded bg-zinc-950 border border-zinc-900"></span>Available (idle)</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-10 gap-1 bg-zinc-950/80 p-3 rounded-xl border border-zinc-900 max-w-[540px] mx-auto select-none">
                          {Array.from({ length: 80 }).map((_, i) => {
                            const slotNum = i + 1;
                            const isAllocated = activeTsSet.has(slotNum);
                            return (
                              <div
                                key={slotNum}
                                className={`h-6 rounded flex justify-center items-center font-mono font-bold transition-all text-[10px] ${
                                  isAllocated
                                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 scale-[1.01]'
                                    : 'bg-zinc-900/40 border border-zinc-850/50 text-zinc-600 hover:border-zinc-800'
                                }`}
                                title={`Tributary Slot ${slotNum}: ${isAllocated ? 'RESERVED by fine-grain slice' : 'UNALLOCATED (10 Mbps capacity)'}`}
                              >
                                {slotNum}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Slices listings inside link */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-zinc-900/60">
                        
                        {/* ODU Slices form */}
                        <form onSubmit={handleAddOduFlexSlice} className="bg-background/25 border border-zinc-900/80 p-4 rounded-xl space-y-3.5 text-left font-mono font-mono">
                          <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-indigo-400" />
                            Allocate fgODUflex Container Slices
                          </span>

                          <div className="space-y-2.5">
                            <div>
                              <label className="text-[9px] text-zinc-500 block mb-0.5">fg-OTN Container type *</label>
                              <select
                                value={fgotnOduType}
                                onChange={(e) => setFgotnOduType(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 text-[11px] rounded p-1 w-full text-white font-mono"
                              >
                                <option value="fgODUflex">fgODUflex (Fine-grain virtual rate)</option>
                                <option value="ODUflex">ODUflex (Flexible standard container)</option>
                                <option value="ODU0">ODU0 (Fixed rate G.709)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] text-zinc-500 block mb-0.5">Tributary slot index list *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 16-25,28,30-35"
                                value={fgotnTsNumber}
                                onChange={(e) => setFgotnTsNumber(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 text-[11px] rounded p-1 w-full font-mono text-zinc-100 placeholder:text-zinc-650"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] text-zinc-500 block mb-0.5">Sliced Capacity bandwidth (Mbps) *</label>
                              <input
                                type="number"
                                required
                                min={10}
                                max={10000}
                                value={fgotnBandwidth}
                                onChange={(e) => setFgotnBandwidth(Number(e.target.value))}
                                className="bg-zinc-900 border border-zinc-800 text-[11px] rounded p-1 w-full font-mono text-white"
                              />
                              <p className="text-[9px] text-zinc-650 font-sans mt-1">Allocation constraint: Each slot grants 10 Mbps.</p>
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/20 text-indigo-300 font-extrabold py-1.5 rounded text-[10px] uppercase tracking-wider transition-all mt-1.5"
                            >
                              Add fgODUflex slice
                            </button>
                          </div>
                        </form>

                        {/* Reserve Ranges config form */}
                        <form onSubmit={handleAddFgtsRange} className="bg-background/25 border border-zinc-900/80 p-4 rounded-xl space-y-3.5 text-left font-mono">
                          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                            CCAMP G.709 Trib Allocation pools
                          </span>

                          <div className="space-y-2.5">
                            <div>
                              <label className="text-[9px] text-zinc-500 block mb-0.5">Server Frame Carrier *</label>
                              <select
                                value={fgtsRangeOduType}
                                onChange={(e) => setFgtsRangeOduType(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 text-[11px] rounded p-1 w-full text-white font-mono"
                              >
                                <option value="fgODUflex">fgODUflex server</option>
                                <option value="ODU2">ODU2 frame structure (80 slots)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] text-zinc-500 block mb-0.5">Tributary slots boundaries</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 1-80"
                                value={fgtsRangeTsNumber}
                                onChange={(e) => setFgtsRangeTsNumber(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 text-[11px] rounded p-1 w-full font-mono text-white"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] text-zinc-500 block mb-0.5">Reserved Slots Subset</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 1-15"
                                value={fgtsReservedSlots}
                                onChange={(e) => setFgtsReservedSlots(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 text-[11px] rounded p-1 w-full font-mono text-emerald-400"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] text-zinc-500 block mb-0.5">Unreserved Slots Subset</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 16-80"
                                value={fgtsUnreservedSlots}
                                onChange={(e) => setFgtsUnreservedSlots(e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 text-[11px] rounded p-1 w-full font-mono text-zinc-400"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/20 text-emerald-300 font-extrabold py-1.5 rounded text-[10px] uppercase tracking-wider transition-all mt-1.5 font-mono"
                            >
                              Commit timeslot pools
                            </button>
                          </div>
                        </form>

                      </div>

                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-550 flex flex-col items-center gap-1.5 font-sans border border-zinc-850">
                      <Layers className="w-5 h-5 text-zinc-650 animate-bounce" />
                      Please select an active optical fiber transport link references above.
                    </div>
                  )}

                </div>

                {/* CARD 4: Real-time format expression checker */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-900 space-y-3 text-left font-mono">
                  <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wide flex items-center gap-1 font-mono font-mono">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    ietf ts-list disjointness validation check (draft-ietf-ccamp)
                  </span>
                  <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                    The ietf-fgotn-topology standard models Tributary slot coordinates using disjoint, strictly ascending sequence lists. Validate syntax coordinate compliance instantly:
                  </p>

                  <div className="flex gap-2 font-mono">
                    <input
                      type="text"
                      placeholder="e.g., 1-5,8,12-15"
                      defaultValue="1-10,12,15-20"
                      onChange={(e) => {
                        const res = validateTsList(e.target.value);
                        const sandboxLog = document.getElementById("sandbox-diagnostic-log");
                        if (sandboxLog) {
                          if (res.isValid) {
                            sandboxLog.innerHTML = `<span class="text-emerald-400 font-extrabold font-mono">✓ COMPLIANT EXPRAY</span>: Successfully parsed ${res.slots.length} discrete channels:<br/>${JSON.stringify(res.slots)}`;
                          } else {
                            sandboxLog.innerHTML = `<span class="text-red-400 font-extrabold font-mono">✗ CONSTRAINT EXCEPTION</span>: ${res.error}`;
                          }
                        }
                      }}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div
                    id="sandbox-diagnostic-log"
                    className="bg-background/40 border border-zinc-900 rounded p-2.5 text-[11px] font-mono leading-relaxed text-zinc-400 min-h-[50px] font-mono"
                  >
                    <span className="text-emerald-400 font-extrabold font-mono">✓ COMPLIANT EXPRAY</span>: Successfully parsed 17 discrete channels:<br/>[1,2,3,4,5,6,7,8,9,10,12,15,16,17,18,19,20]
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
