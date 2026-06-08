import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Network, 
  Cpu, 
  Layers, 
  Check, 
  AlertCircle, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Sliders, 
  ArrowRightLeft, 
  Infinity as LoopIcon, 
  Activity, 
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
  ListRestart
} from 'lucide-react';
import { NetworkService } from '../../services/networkService';
import { NetworkLayer, NetworkElement, NetworkLink, IETFInterface } from '../../types';

export function NetworkInventoryTopologyView({ onNavigate }: { onNavigate?: (id: string, type: any) => void }) {
  const networkService = NetworkService.getInstance();
  const [topology, setTopology] = useState(() => networkService.getTopology());
  const [isActiveUnderlay, setIsActiveUnderlay] = useState(() => networkService.isInventoryTopologyActive());

  // Alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);

  const triggerAlert = (type: 'success' | 'error' | 'warning', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Selected Nodes / Links for Mapping Controls
  const [selectedNodeId, setSelectedNodeId] = useState<string>(topology.nodes[0]?.uuid || '');
  const [selectedLinkId, setSelectedLinkId] = useState<string>(topology.links[0]?.uuid || '');
  const [selectedInterfaceName, setSelectedInterfaceName] = useState<string>('');

  const currentNode = useMemo(() => {
    return topology.nodes.find(n => n.uuid === selectedNodeId);
  }, [topology.nodes, selectedNodeId]);

  const currentLink = useMemo(() => {
    return topology.links.find(l => l.uuid === selectedLinkId);
  }, [topology.links, selectedLinkId]);

  const currentInterface = useMemo(() => {
    if (!currentNode || !selectedInterfaceName) return null;
    return currentNode.ietfInterfaces?.find(i => i.name === selectedInterfaceName) || null;
  }, [currentNode, selectedInterfaceName]);

  // Handle active underlay toggle (Feature 22)
  const handleToggleUnderlay = (active: boolean) => {
    setIsActiveUnderlay(active);
    networkService.setInventoryTopologyActive(active);

    if (active) {
      triggerAlert('success', 'Presence container "/nw:networks/nw:network/nw:network-types/nwit:inventory-topology" successfully enabled. Bottom-most physical topology layer is active.');
    } else {
      triggerAlert('warning', 'Presence container "/nw:networks/nw:network/nw:network-types/nwit:inventory-topology" removed. Physical inventory mapping and breakout features have been deactivated.');
    }
  };

  // Node NE Ref Modification (Feature 23 - Scenario 1 & 2 validation constraints)
  const [neRefValue, setNeRefValue] = useState('');
  
  const handleUpdateNeRef = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Core Constraint Check (Feature 22 Underlay Mapping Constraint / BDD Scenario 2)
    if (!isActiveUnderlay) {
      triggerAlert('error', 'Rejected: Logical-Only Network Protection Constraint Triggered! The network types structure does not contain the "inventory-topology" presence container. Mapping "ne-ref" is blocked.');
      return;
    }

    if (!selectedNodeId) {
      triggerAlert('error', 'Please select a node.');
      return;
    }

    networkService.updateNodeNeRef(selectedNodeId, neRefValue.trim() || undefined);
    setTopology({ ...networkService.getTopology() });
    triggerAlert('success', `Successfully mapped logical node "${currentNode?.name}" to physical element identifier "${neRefValue.trim() || 'Unassigned'}".`);
  };

  // Link Media Type Classification Modifier (Feature 23)
  const handleUpdateLinkType = (mediaType: 'copper' | 'fiber' | 'coax' | 'microwave' | 'wlan' | 'unknown' | 'leased-fiber' | 'free-space-optics') => {
    // Core Constraint Check (Feature 22 Underlay Mapping Constraint / BDD Scenario 2)
    if (!isActiveUnderlay) {
      triggerAlert('error', 'Rejected: Logical-Only Network Protection Constraint Triggered! The network types structure does not contain the "inventory-topology" presence container. Mapping "link-type" is blocked.');
      return;
    }

    networkService.updateLinkType(selectedLinkId, mediaType);
    setTopology({ ...networkService.getTopology() });
    triggerAlert('success', `Successfully set physical media type to "${mediaType}" for link "${selectedLinkId}".`);
  };

  // Port Breakout Management Forms (Feature 24)
  const [channelIdInput, setChannelIdInput] = useState<number | ''>('');
  const [channelSpeed, setChannelSpeed] = useState<number>(100000000000); // Default 100G
  const [channelStatus, setChannelStatus] = useState<'up' | 'down'>('up');

  // Toggle breakout capability for the selected interface
  const handleToggleBreakout = (enabled: boolean) => {
    if (!currentNode || !selectedInterfaceName) return;

    // Standard pre-populates
    const channels = enabled ? [
      { channelId: 1, speed: 100000000000, status: 'up' as const },
      { channelId: 2, speed: 100000000000, status: 'up' as const },
      { channelId: 3, speed: 100000000000, status: 'down' as const },
      { channelId: 4, speed: 100000000000, status: 'up' as const }
    ] : [];

    networkService.updateInterfaceBreakout(currentNode.uuid, selectedInterfaceName, enabled, channels);
    setTopology({ ...networkService.getTopology() });
    
    if (enabled) {
      triggerAlert('success', `Activated breakout capability on interface "${selectedInterfaceName}". Port partitioned into 4x100G lanes.`);
    } else {
      triggerAlert('warning', `Removed breakout configuration from interface "${selectedInterfaceName}". All channelized lanes purged.`);
    }
  };

  // Add a breakout channel
  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNode || !selectedInterfaceName || !currentInterface) return;
    if (channelIdInput === '' || channelIdInput < 1) {
      triggerAlert('error', 'Invalid channel ID. Channel ID must be an integer >= 1.');
      return;
    }

    const channels = currentInterface.portBreakout?.breakoutChannels || [];
    
    // Feature 24 BDD Scenario 2: Validate unique channel IDs constraint check
    const duplicate = channels.find(c => c.channelId === Number(channelIdInput));
    if (duplicate) {
      triggerAlert('error', `YANG Key Constraint Error: Channel ID "${channelIdInput}" already exists within port scope of "${selectedInterfaceName}". IDs must be unique.`);
      return;
    }

    const updatedChannels = [
      ...channels,
      { channelId: Number(channelIdInput), speed: channelSpeed, status: channelStatus }
    ].sort((a, b) => a.channelId - b.channelId);

    networkService.updateInterfaceBreakout(currentNode.uuid, selectedInterfaceName, true, updatedChannels);
    setTopology({ ...networkService.getTopology() });
    setChannelIdInput('');
    triggerAlert('success', `Added breakout channel index "${channelIdInput}" at ${channelSpeed / 1e9} Gbps.`);
  };

  // Delete a breakout channel
  const handleDeleteChannel = (channelId: number) => {
    if (!currentNode || !selectedInterfaceName || !currentInterface) return;
    
    const channels = currentInterface.portBreakout?.breakoutChannels || [];
    const updatedChannels = channels.filter(c => c.channelId !== channelId);
    
    networkService.updateInterfaceBreakout(currentNode.uuid, selectedInterfaceName, updatedChannels.length > 0, updatedChannels);
    setTopology({ ...networkService.getTopology() });
    triggerAlert('success', `Removed breakout channel index "${channelId}".`);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalNodes = topology.nodes.length;
    const mappedNodes = topology.nodes.filter(n => n.inventoryMappingAttributes?.neRef).length;
    
    const totalLinks = topology.links.length;
    const linkClassificationCount = topology.links.reduce((acc, l) => {
      const type = l.inventoryMappingAttributes?.linkType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalNodes,
      mappedNodes,
      totalLinks,
      linkClassificationCount
    };
  }, [topology]);

  // Integrated Interactive BDD Scenario Simulator Playground
  const [activeBddScenario, setActiveBddScenario] = useState<'node-mapping' | 'mapping-reject' | 'query-channels' | 'duplicate-channels'>('node-mapping');
  const [bddOutput, setBddOutput] = useState<{ status: 'idle' | 'running' | 'success' | 'failed', log: string[], json?: string }>({
    status: 'idle',
    log: []
  });

  const runBddSimulation = () => {
    setBddOutput({ status: 'running', log: ['Initializing ietf-network-inventory-topology test suite...', 'Compiling draft-ietf-ivy-network-inventory-topology v3 YANG models...'] });
    
    setTimeout(() => {
      switch (activeBddScenario) {
        case 'node-mapping':
          // Scenario 1: Map node to physical network element
          const targetNode = topology.nodes[0];
          const hasUnderlay = isActiveUnderlay;
          
          if (!hasUnderlay) {
            setBddOutput({
              status: 'failed',
              log: [
                'GIVEN: the topology planner has a logical node',
                `AND: the active network types structure is standard-logical (inventory-topology active = ${hasUnderlay})`,
                `WHEN: attempting to assign physical underlay mapping (ne-ref) to node "${targetNode?.name}"`,
                'THEN: validation error! Mappings can only be instantiated when the underlay presence container is configured.'
              ],
              json: JSON.stringify({ error: "YANG_VALIDATION_ERROR", reason: "inventory-topology-presence-missing", path: `/ietf-network:networks/network[network-id="japan-net"]/node[node-id="${targetNode?.uuid}"]/ietf-network-inventory-topology:inventory-mapping-attributes` }, null, 2)
            });
          } else {
            setBddOutput({
              status: 'success',
              log: [
                `GIVEN: a network element "${targetNode?.uuid}" exists in physical registry`,
                `AND: the active network types has the "inventory-topology" presence flag set to true`,
                `WHEN: we set the "ne-ref" attribute of logical topology node "${targetNode?.uuid}" to "node-TK1"`,
                'THEN: the datastore stores the logical-to-physical correlation successfully in the NMDA running store!',
                'STATUS: 1:1 Reference correlation resolved successfully.'
              ],
              json: JSON.stringify({
                "ietf-network:node": {
                  "node-id": targetNode?.uuid,
                  "ietf-network-inventory-topology:inventory-mapping-attributes": {
                    "ne-ref": "node-TK1"
                  }
                },
                "resolved-physical-hardware": {
                  "chassis": "TK1-Chassis",
                  "serial-number": "CN-CH-TK1-001",
                  "manufacturer": "Ciena Corporation",
                  "status": "OPERATIONAL_ACTIVE"
                }
              }, null, 2)
            });
          }
          break;

        case 'mapping-reject':
          // Scenario 2: Reject physical mapping attributes on logical-only networks
          if (isActiveUnderlay) {
            setBddOutput({
              status: 'failed',
              log: [
                'GIVEN: a network entry is currently mapped as a physical underlay topology (inventory-topology active = true)',
                'AND: we try to validate logical-only constraints',
                'WHEN: the parser analyzes the database schemas',
                'THEN: validation test failed! To verify logical protection rejection, please disable the "Network Inventory Underlay Topology" toggle in the top control panel first.'
              ]
            });
          } else {
            setBddOutput({
              status: 'success',
              log: [
                'GIVEN: a network entry DOES NOT have the "inventory-topology" presence container (Active = false)',
                'WHEN: attempting to write physical mapping attributes (e.g., ne-ref: "node-TK1") to logical node',
                'THEN: the YANG validation rule strictly REJECTS the edit!',
                'STATUS: Transaction rollback triggered. Referential integrity is protected on high-level logical channels.'
              ],
              json: JSON.stringify({
                "transaction": "TX-9943",
                "status": "ROLLED_BACK",
                "error": {
                  "error-type": "protocol",
                  "error-tag": "bad-element",
                  "error-path": "/ietf-network:networks/network/node/inventory-mapping-attributes",
                  "error-message": "YANG constraint violation: inventory-mapping-attributes must satisfy 'when /networks/network/network-types/inventory-topology'"
                }
              }, null, 2)
            });
          }
          break;

        case 'query-channels':
          // Scenario 1: Query port breakout channels from channelized physical port
          const breakoutNode = topology.nodes.find(n => n.ietfInterfaces?.some(i => i.portBreakout?.enabled));
          const boIface = breakoutNode?.ietfInterfaces?.find(i => i.portBreakout?.enabled);

          if (!breakoutNode || !boIface) {
            setBddOutput({
              status: 'failed',
              log: [
                'GIVEN: topological interfaces are loaded',
                'WHEN: querying breakout capabilities on ports',
                'THEN: found no interface with breakout enabled! To run this scenario, select a node and click "Enable breakout" under Interface break-out lanes first.'
              ]
            });
          } else {
            setBddOutput({
              status: 'success',
              log: [
                `GIVEN: a termination point "${boIface.name}" on node "${breakoutNode.name}" maps to a high-speed physical port`,
                `WHEN: querying breakout capabilities on "${boIface.name}"`,
                `THEN: the system returns standard presence state "/port-breakout" = active`,
                `AND: retrieves standard-conforming independent lane subinterfaces list: channel IDs: ${boIface.portBreakout?.breakoutChannels.map(c => c.channelId).join(', ')}`,
                'STATUS: Sub-interface partition verification succeeded.'
              ],
              json: JSON.stringify({
                "ietf-network:node": {
                  "node-id": breakoutNode.uuid,
                  "termination-point": {
                    "tp-id": boIface.name,
                    "ietf-network-inventory-topology:port-breakout": {
                      "breakout-channel": boIface.portBreakout?.breakoutChannels.map(c => ({
                        "channel-id": c.channelId,
                        "description": `Lane Channel ${c.channelId} of ${boIface.name}`,
                        "speed": `${c.speed ? c.speed / 1e9 : 100} Gbps`,
                        "oper-status": c.status
                      }))
                    }
                  }
                }
              }, null, 2)
            });
          }
          break;

        case 'duplicate-channels':
          // Scenario 2: Validate unique channel IDs
          setBddOutput({
            status: 'success',
            log: [
              'GIVEN: a channelized port breakout list on an interface termination point',
              'WHEN: registering a new channel sub-interface lane with a non-unique, duplicate channel-id',
              'THEN: the system throws an instant write conflict exception and rolls back the registration',
              'STATUS: Schema constraint "key channel-id" verified. Uniqueness enforced within regional port scopes.'
            ],
            json: JSON.stringify({
              "ietf-network:node": {
                "node-id": "node-TK1",
                "termination-point": {
                  "tp-id": "opt-1/1",
                  "ietf-network-inventory-topology:port-breakout": {
                    "breakout-channel": [
                      { "channel-id": 1, "status": "REGISTERED" },
                      { "channel-id": 1, "status": "REJECTED_KEY_CONFLICT", "reason": "channel-id must be unique key among siblings" }
                    ]
                  }
                }
              }
            }, null, 2)
          });
          break;
      }
    }, 700);
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto w-full text-left">
      
      {/* Title Header with zero-slop specifications */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/80 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest bg-blue-600/15 text-blue-400 font-mono px-2 py-0.5 rounded font-extrabold">
            ietf-network-inventory-topology
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-2">
            <Layers className="w-6 h-6 text-blue-500" />
            Network Inventory Topology Mapping
          </h2>
          <p className="text-muted-foreground mt-1 text-sm font-sans">
            Digital Engineering panel correlating logical networks (RFC 8345) to the physical network components, media types and sub-ports (ietf-network-inventory-topology).
          </p>
        </div>

        {/* FEATURE 22: Toggle Active Underlay Presence Container */}
        <div className="bg-zinc-950/60 border border-zinc-850 p-3 rounded-xl flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500">
              Underlay Presence Container
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              /network-types/inventory-topology
            </div>
          </div>
          
          <button
            onClick={() => handleToggleUnderlay(!isActiveUnderlay)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isActiveUnderlay ? 'bg-blue-600' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isActiveUnderlay ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alert && (
        <div className={`p-4 border rounded-xl flex items-start gap-3 animate-slide-in font-mono text-xs ${
          alert.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {alert.type === 'error' ? (
            <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          ) : alert.type === 'warning' ? (
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          )}
          <div>
            <span className="font-extrabold uppercase">{alert.type}: </span>
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      {/* Physical Underlay Badge & Statistical Mappings Overview (Feature 22 & 23) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Physical Underlay Live Presence State Card */}
        <div className="bg-zinc-950/40 border border-zinc-850 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Presence Node Type</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isActiveUnderlay ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
              <span className="text-sm font-bold font-mono text-white">
                {isActiveUnderlay ? 'Physical Asset Type' : 'Lax Logical Only'}
              </span>
            </div>
            {isActiveUnderlay && (
              <span className="inline-block mt-2 px-1.5 py-0.5 text-[9px] font-mono bg-blue-600/15 border border-blue-500/30 text-blue-400 rounded-sm">
                Physical Inventory Underlay
              </span>
            )}
          </div>
          <Activity className={`w-8 h-8 ${isActiveUnderlay ? 'text-blue-500/30' : 'text-zinc-700/30'}`} />
        </div>

        {/* Mapping completeness */}
        <div className="bg-zinc-950/40 border border-zinc-850 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Node Correlation Mapping</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {stats.mappedNodes} <span className="text-xs text-zinc-500">/ {stats.totalNodes} standard nodes</span>
            </div>
            <div className="w-32 bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all" 
                style={{ width: `${(stats.mappedNodes / stats.totalNodes) * 100}%` }} 
              />
            </div>
          </div>
          <Database className="w-8 h-8 text-indigo-500/30" />
        </div>

        {/* Fiber classified paths count */}
        <div className="bg-zinc-950/40 border border-zinc-850 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Active Fiber Media Channels</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {(stats.linkClassificationCount['fiber'] || 0) + (stats.linkClassificationCount['leased-fiber'] || 0)}
              <span className="text-xs text-zinc-500"> links</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 font-mono">
              Leased fiber path: {stats.linkClassificationCount['leased-fiber'] || 0}
            </div>
          </div>
          <Sliders className="w-8 h-8 text-emerald-500/30" />
        </div>

        {/* Wireless paths classification count */}
        <div className="bg-zinc-950/40 border border-zinc-850 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Wireless Link classification</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {(stats.linkClassificationCount['microwave'] || 0) + (stats.linkClassificationCount['wlan'] || 0)}
              <span className="text-xs text-zinc-500"> channels</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 font-mono">
              Microwave: {stats.linkClassificationCount['microwave'] || 0} | WLAN: {stats.linkClassificationCount['wlan'] || 0}
            </div>
          </div>
          <Network className="w-8 h-8 text-amber-500/30" />
        </div>
      </div>

      {/* Main Core Layout: Node & Link Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Interactive Panel: Node select and ne-ref mapping */}
        <div className="lg:col-span-6 bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              1:1 Node Hardware Mapping
            </h3>
            <span className="font-mono text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
              YANG: ne-ref (leafref)
            </span>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] text-zinc-500 uppercase font-mono block">Selected Logical Node</label>
            <select
              value={selectedNodeId}
              onChange={(e) => {
                setSelectedNodeId(e.target.value);
                setSelectedInterfaceName('');
              }}
              className="bg-background border border-border rounded-lg p-2.5 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
            >
              {topology.nodes.map(n => (
                <option key={n.uuid} value={n.uuid}>
                  {n.name} ({n.uuid}) — {n.layer}
                </option>
              ))}
            </select>
          </div>

          {currentNode && (
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850/60 text-xs font-mono space-y-3">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Logical Hostname:</span>
                <span className="text-white font-semibold">{currentNode.ietfSystem?.hostname || currentNode.name}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Network Layer:</span>
                <span className="text-emerald-400 font-bold">{currentNode.layer}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400 border-t border-zinc-950 pt-2.5">
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  Mapped Hardware ID (ne-ref):
                </span>
                {currentNode.inventoryMappingAttributes?.neRef ? (
                  <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded">
                    {currentNode.inventoryMappingAttributes.neRef}
                  </span>
                ) : (
                  <span className="text-rose-400 font-medium bg-red-500/10 px-2 py-0.5 rounded animate-pulse">
                    UNASSIGNED (Lax)
                  </span>
                )}
              </div>

              {currentNode.inventoryMappingAttributes?.neRef && (
                <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-800 text-[11px] mt-2 text-zinc-400 leading-relaxed font-sans">
                  <p className="font-semibold text-white/95 font-mono mb-1">Asset Trace Information:</p>
                  Node is correlated to registered physically contained hardware rack components. Host facility is located at <span className="text-white font-bold">{currentNode.location}</span>.
                </div>
              )}
            </div>
          )}

          {/* Form to edit mapping */}
          <form onSubmit={handleUpdateNeRef} className="bg-background/40 p-4 rounded-xl border border-zinc-900 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 uppercase font-mono block">Assign Physical Hardware Ref ID (ne-ref)</label>
              <input
                type="text"
                placeholder="e.g. node-TK1-Physical-ASIC"
                value={neRefValue}
                onChange={(e) => setNeRefValue(e.target.value)}
                className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-xs font-semibold tracking-wider transition-all"
            >
              Bind to Logical Node ({currentNode?.name})
            </button>
          </form>
        </div>

        {/* Right Interactive Panel: Link Selection and Media Classification */}
        <div className="lg:col-span-6 bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
              Link Media Classification
            </h3>
            <span className="font-mono text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
              YANG: link-type
            </span>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] text-zinc-500 uppercase font-mono block">Selected Logical Link Channel</label>
            <select
              value={selectedLinkId}
              onChange={(e) => setSelectedLinkId(e.target.value)}
              className="bg-background border border-border rounded-lg p-2.5 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
            >
              {topology.links.map(l => {
                const source = topology.nodes.find(n => n.uuid === l.sourceNodeUuid)?.name || l.sourceNodeUuid;
                const target = topology.nodes.find(n => n.uuid === l.targetNodeUuid)?.name || l.targetNodeUuid;
                return (
                  <option key={l.uuid} value={l.uuid}>
                    {l.uuid} ({source} → {target}) — {l.layer}
                  </option>
                );
              })}
            </select>
          </div>

          {currentLink && (
            <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-850/60 text-xs font-mono space-y-3">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Tunnel Capacity:</span>
                <span className="text-white font-semibold">{currentLink.capacity}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Bandwidth Utilized:</span>
                <span className="text-white font-semibold">{currentLink.usage}%</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400 border-t border-zinc-950 pt-2.5">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  Assigned Media Type (link-type):
                </span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                  currentLink.inventoryMappingAttributes?.linkType === 'free-space-optics' ? 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 font-semibold' :
                  currentLink.inventoryMappingAttributes?.linkType === 'fiber' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                  currentLink.inventoryMappingAttributes?.linkType === 'leased-fiber' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                  currentLink.inventoryMappingAttributes?.linkType === 'microwave' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  currentLink.inventoryMappingAttributes?.linkType === 'wlan' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {currentLink.inventoryMappingAttributes?.linkType || 'unknown'}
                </span>
              </div>
            </div>
          )}

          {/* Quick Select Media Types Buttons Grid */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 uppercase font-mono block">Assign Physical Media Type Classifier</label>
            <div className="grid grid-cols-2 gap-2">
              {(['copper', 'fiber', 'leased-fiber', 'coax', 'microwave', 'wlan', 'free-space-optics', 'unknown'] as const).map((media) => (
                <button
                  key={media}
                  type="button"
                  onClick={() => handleUpdateLinkType(media)}
                  className={`p-2 rounded-lg border text-[11px] font-mono uppercase tracking-wider font-semibold transition-all ${
                    currentLink?.inventoryMappingAttributes?.linkType === media
                      ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                  }`}
                >
                  {media.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE 24: Port Breakout & Channelization Capabilities */}
      <div className="bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-3 gap-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" />
              Interface Breakout & Channelization Engine
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Partition high-speed physical optics into multiple independent channelized sub-interfaces.
            </p>
          </div>
          <span className="font-mono text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded tracking-wide self-start md:self-center">
            YANG: port-breakout / breakout-channel
          </span>
        </div>

        {currentNode && currentNode.ietfInterfaces && currentNode.ietfInterfaces.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left selector */}
            <div className="lg:col-span-4 space-y-3">
              <label className="text-[10px] text-zinc-500 uppercase font-mono block">Select Interface (Termination Point)</label>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {currentNode.ietfInterfaces.map(iface => {
                  const isSelected = selectedInterfaceName === iface.name;
                  const isBreakout = iface.portBreakout?.enabled;
                  return (
                    <div
                      key={iface.name}
                      onClick={() => setSelectedInterfaceName(iface.name)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs font-mono font-medium ${
                        isSelected 
                          ? 'bg-indigo-600/10 border-indigo-500 text-white' 
                          : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:bg-zinc-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${iface.enabled ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                        <span>{iface.name}</span>
                      </div>
                      
                      {isBreakout && (
                        <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 px-1 py-0.2 rounded uppercase">
                          Channelized
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right interface details */}
            <div className="lg:col-span-8 bg-zinc-950/40 p-4 border border-zinc-850/60 rounded-xl space-y-4">
              {currentInterface ? (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-3 gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm font-mono flex items-center gap-2">
                        {currentInterface.name}
                        <span className="text-xs font-normal text-zinc-500">({currentInterface.type})</span>
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Operating Speed: {currentInterface.speed ? `${currentInterface.speed / 1e9} Gbps` : 'Unknown'}
                      </p>
                    </div>

                    {/* Breakout toggler button */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 font-mono font-medium">Breakout Capability:</span>
                      <button
                        type="button"
                        onClick={() => handleToggleBreakout(!currentInterface.portBreakout?.enabled)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          currentInterface.portBreakout?.enabled 
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {currentInterface.portBreakout?.enabled ? 'Disable breakout' : 'Enable breakout'}
                      </button>
                    </div>
                  </div>

                  {/* Sub port channelization visualization */}
                  {currentInterface.portBreakout?.enabled ? (
                    <div className="space-y-4">
                      
                      {/* Sub-channel visual mockup container */}
                      <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-3 font-mono">
                          Lanes Layout (Split 400G Optical Fiber)
                        </div>

                        {/* Split line diagram */}
                        <div className="grid grid-cols-4 gap-3">
                          {currentInterface.portBreakout.breakoutChannels.map((chan) => (
                            <div 
                              key={chan.channelId}
                              className={`p-3 rounded-lg border text-center font-mono ${
                                chan.status === 'up'
                                  ? 'bg-emerald-500/5 border-emerald-500/30'
                                  : 'bg-zinc-950/40 border-zinc-900 text-zinc-500'
                              }`}
                            >
                              <div className="text-[10px] font-bold text-zinc-400">Lane Ch-{chan.channelId}</div>
                              <div className="text-[13px] font-extrabold text-white mt-1">
                                {chan.speed ? `${chan.speed / 125000000} MB/s` : '100G'}
                              </div>
                              <div className="flex justify-center items-center gap-1.5 mt-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${chan.status === 'up' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                <span className="text-[9px] uppercase font-bold text-zinc-400">{chan.status || 'up'}</span>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => handleDeleteChannel(chan.channelId)}
                                className="mt-2.5 inline-flex items-center gap-1 p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 text-[10px]"
                                title="Delete channel"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add breakout channel form */}
                      <form onSubmit={handleAddChannel} className="bg-background/20 p-4 border border-zinc-900 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs font-mono">
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block mb-1">channel-id *</label>
                          <input
                            type="number"
                            min="1"
                            max="65535"
                            placeholder="e.g. 5"
                            value={channelIdInput}
                            onChange={(e) => setChannelIdInput(e.target.value === '' ? '' : Number(e.target.value))}
                            className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block mb-1">Bitrate Speed</label>
                          <select
                            value={channelSpeed}
                            onChange={(e) => setChannelSpeed(Number(e.target.value))}
                            className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500"
                          >
                            <option value={100000000000}>100G Class (100 Gbps)</option>
                            <option value={200000000000}>200G Class (200 Gbps)</option>
                            <option value={400000000000}>400G Native (400 Gbps)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block mb-1">Admin Status</label>
                          <select
                            value={channelStatus}
                            onChange={(e) => setChannelStatus(e.target.value as 'up' | 'down')}
                            className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500"
                          >
                            <option value="up">Active (UP)</option>
                            <option value="down">Inactive (DOWN)</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg text-xs tracking-wider transition-all"
                        >
                          Add sub-channel
                        </button>
                      </form>

                    </div>
                  ) : (
                    <div className="text-center py-8 font-mono border border-dashed border-zinc-850 rounded-xl text-zinc-500">
                      <Sliders className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      Breakout capability is disabled on this interface.
                      <p className="text-[11px] text-zinc-650 mt-1">Enable breakout above to partition fiber optics into multiple independent sub-lanes.</p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-12 font-mono text-zinc-500">
                  <Info className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  Please select an active interface port on the left.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 font-mono border border-zinc-900 rounded-xl text-zinc-500">
            Node has no interfaces logged in the datastore model.
          </div>
        )}
      </div>

      {/* COMPLIANCE VERIFICATION LABS & MERMAID GRAPH SPEC COCKPIT */}
      <div className="bg-zinc-950/30 border border-zinc-850 p-5 rounded-xl space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              BDD Given-When-Then Compliance Laboratory
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Run automated testing scenarios mirroring user stories #61 & #62.
            </p>
          </div>
          <span className="font-mono text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded uppercase">
            Validation Sandbox
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-900 text-xs font-mono">
          <button
            onClick={() => setActiveBddScenario('node-mapping')}
            className={`pb-2.5 px-4 font-semibold uppercase transition-all border-b-2 ${
              activeBddScenario === 'node-mapping' ? 'border-amber-500 text-amber-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            US-22 Scenario 1 (Node Mapping)
          </button>
          <button
            onClick={() => setActiveBddScenario('mapping-reject')}
            className={`pb-2.5 px-4 font-semibold uppercase transition-all border-b-2 ${
              activeBddScenario === 'mapping-reject' ? 'border-amber-500 text-amber-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            US-22 Scenario 2 (Logical Guard Reject)
          </button>
          <button
            onClick={() => setActiveBddScenario('query-channels')}
            className={`pb-2.5 px-4 font-semibold uppercase transition-all border-b-2 ${
              activeBddScenario === 'query-channels' ? 'border-amber-500 text-amber-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            US-23 Scenario 1 (Query breakout)
          </button>
          <button
            onClick={() => setActiveBddScenario('duplicate-channels')}
            className={`pb-2.5 px-4 font-semibold uppercase transition-all border-b-2 ${
              activeBddScenario === 'duplicate-channels' ? 'border-amber-500 text-amber-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            US-23 Scenario 2 (Unique ID Validation)
          </button>
        </div>

        {/* Scenario description */}
        <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-850/60 flex flex-col md:flex-row gap-6 md:items-center justify-between text-xs leading-relaxed">
          <div className="font-sans text-zinc-300 space-y-1">
            <p className="font-semibold text-white">
              {activeBddScenario === 'node-mapping' && 'Scenario 1: Map node to physical network element (US-22)'}
              {activeBddScenario === 'mapping-reject' && 'Scenario 2: Reject physical mapping attributes on logical-only networks (US-22)'}
              {activeBddScenario === 'query-channels' && 'Scenario 1: Read breakout channels from channelized physical port (US-23)'}
              {activeBddScenario === 'duplicate-channels' && 'Scenario 2: Validate unique breakout channel-id constraint (US-23)'}
            </p>
            <p className="text-zinc-500 text-[11px]">
              {activeBddScenario === 'node-mapping' && 'Verifies the 1:1 mapping mapping-attributes of nodes of ietf-network-inventory-topology when underlay is declared.'}
              {activeBddScenario === 'mapping-reject' && 'Verifies transaction rollback on logical environments when attempting to apply hardware configurations without underlay enabled.'}
              {activeBddScenario === 'query-channels' && 'Simulates NETCONF query retrieving channelized port properties partitioned from 400G physical fiber interfaces.'}
              {activeBddScenario === 'duplicate-channels' && 'Tests uniqueness constraint on key channel-id. Duplicate inserts must trigger local validation rejection.'}
            </p>
          </div>

          <button
            type="button"
            onClick={runBddSimulation}
            className="shrink-0 inline-flex items-center gap-2 bg-amber-500 text-zinc-950 font-semibold px-4 py-2 rounded-lg hover:bg-amber-400 transition-all font-mono tracking-wider text-xs uppercase"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Evaluate Test
          </button>
        </div>

        {/* Console and output JSON mockup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Virtual CLI Logs */}
          <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-900 flex flex-col h-60">
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-extrabold pb-2.5 border-b border-zinc-900 mb-2.5 flex justify-between">
              <span>Dynamic Test Harness Logs</span>
              <span className="text-amber-500">NETCONF RPC</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 text-[11px] text-zinc-300 scrollbar-thin">
              {bddOutput.log.length > 0 ? (
                bddOutput.log.map((line, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-amber-500 shrink-0 select-none">&gt;&gt;</span>
                    <span className={line.startsWith('THEN:') || line.startsWith('STATUS:') ? 'text-emerald-400 font-bold' : ''}>
                      {line}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-600 text-center pt-16 uppercase tracking-widest text-[10px]">
                  Sandbox idle. Click "Evaluate Test" to run validation engine.
                </div>
              )}
            </div>
          </div>

          {/* YANG XML/JSON representation */}
          <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-900 flex flex-col h-60">
            <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-extrabold pb-2.5 border-b border-zinc-900 mb-2.5 flex justify-between">
              <span>YANG Data Structure Representation</span>
              <span className="text-blue-400">JSON/YANG</span>
            </div>
            
            <div className="flex-1 overflow-auto text-[11px] scrollbar-thin text-indigo-300 whitespace-pre">
              {bddOutput.json ? (
                <code>{bddOutput.json}</code>
              ) : (
                <div className="text-zinc-600 text-center pt-16 uppercase tracking-widest text-[10px]">
                  Output datastore empty.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
