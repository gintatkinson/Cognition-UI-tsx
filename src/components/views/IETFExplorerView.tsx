import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Cpu, 
  Radio, 
  Search,
  Database,
  BarChart3,
  Network,
  ChevronRight,
  MapPin,
  Info,
  ShieldCheck,
  Zap,
  ExternalLink,
  FolderTree,
  Terminal,
  FileCode,
  Copy,
  Check,
  ArrowRight,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { NetworkService } from '../../services/networkService';
import { NetworkLayer, NetworkElement, HardwareComponent, RFC8345Node } from '../../types';

interface IETFExplorerViewProps {
  onNavigate: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
}

export const IETFExplorerView: React.FC<IETFExplorerViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'standard' | 'decomposition'>('standard');
  const [activeLayer, setActiveLayer] = useState<NetworkLayer | 'all'>('all');
  const [selectedNode, setSelectedNode] = useState<NetworkElement | null>(null);
  
  // Collapse/Expand state for row containment trees
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNodeExpansion = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Decomposition States
  const [decompQuery, setDecompQuery] = useState<string>('node-L0-TK-terminal');
  const [activeExportTab, setActiveExportTab] = useState<'ascii' | 'json' | 'yaml'>('ascii');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const networkService = NetworkService.getInstance();
  const topology = networkService.getTopology();

  // Recursively build tree nodes as table rows matching the parent row look-and-feel
  const renderHardwareTreeRows = (
    currentItemId: string | undefined, 
    prefix: string, 
    allHardware: HardwareComponent[],
    itemUuid: string,
    depth = 1
  ): React.ReactNode[] => {
    const levelComps = allHardware.filter(comp => {
      if (!currentItemId) {
        return !comp.parentUuid || !allHardware.some(p => p.uuid === comp.parentUuid);
      }
      return comp.parentUuid === currentItemId;
    });

    return levelComps.reduce<React.ReactNode[]>((acc, comp, idx) => {
      const isLast = idx === levelComps.length - 1;
      const branch = isLast ? '└── ' : '├── ';
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');

      // Detect search query match to highlight it
      const isMatch = searchQuery.trim() !== '' && (
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.uuid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (comp.serialNumber && comp.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (comp.partNumber && comp.partNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (comp.assetId && comp.assetId.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      // Check for Software Revision
      const hasSoftware = comp.softwareRev && comp.softwareRev.length > 0;
      const swInfo = hasSoftware ? comp.softwareRev![0] : null;

      // Check for links (connected edge router links)
      let linkTargetName = '';
      let linkTargetUuid = '';
      if (comp.class === 'port') {
        const matchingLink = networkService.getTopology().links.find(lnk => 
          (lnk.sourceNodeUuid === itemUuid && lnk.sourcePortUuid === comp.uuid) ||
          (lnk.targetNodeUuid === itemUuid && lnk.targetPortUuid === comp.uuid)
        );
        if (matchingLink) {
          const remoteNodeUuid = matchingLink.sourceNodeUuid === itemUuid 
            ? matchingLink.targetNodeUuid 
            : matchingLink.sourceNodeUuid;
          const remoteNode = unifiedNodes.find(n => n.uuid === remoteNodeUuid);
          linkTargetName = remoteNode ? remoteNode.name : remoteNodeUuid;
          linkTargetUuid = remoteNodeUuid;
        }
      }

      // Check if this component matches any search filter highlight
      const rowBgClass = isMatch 
        ? 'bg-amber-500/10 border-amber-500/20' 
        : 'bg-zinc-950/25 hover:bg-zinc-900/10';

      const componentRow = (
        <tr 
          key={comp.uuid}
          className={`transition-colors font-sans text-xs border-b border-zinc-900/40 ${rowBgClass}`}
          title="Click to view hardware component details"
        >
          {/* Column 1: Tree diagram prefix and component identity with sub-text */}
          <td className="px-6 py-3 pl-8 md:pl-10">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="font-mono text-zinc-650 select-none whitespace-pre pr-1 text-[11px] shrink-0">
                {prefix}{branch}
              </span>
              <div className="flex flex-col truncate">
                <span 
                  onClick={(e) => { e.stopPropagation(); onNavigate(comp.uuid, 'hardware'); }}
                  className="font-bold text-zinc-200 hover:text-blue-400 hover:underline cursor-pointer select-all truncate text-xs"
                >
                  {comp.name}
                </span>
                <span 
                  onClick={(e) => { e.stopPropagation(); onNavigate(comp.uuid, 'hardware'); }}
                  className="text-[10px] font-mono text-zinc-500 hover:text-blue-400 hover:underline cursor-pointer select-all truncate mt-0.5"
                >
                  ID: {comp.uuid}
                </span>
              </div>
            </div>
          </td>

          {/* Column 2: Hardware Class */}
          <td className="px-6 py-3">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              comp.class === 'chassis' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 
              comp.class === 'port' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 
              comp.class === 'container' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
              'bg-zinc-805 text-zinc-400 border border-zinc-800/45'
            }`}>
              {comp.class}
              {comp.isMain && <span className="ml-1 text-[8px] font-extrabold text-amber-400/90">(MAIN)</span>}
            </span>
          </td>

          {/* Column 3: Location / Sub-attributes */}
          <td className="px-6 py-3 text-xs text-muted-foreground/90">
            <div className="flex flex-col gap-0.5 font-mono text-[10.5px]">
              {comp.assetId && comp.assetId.startsWith('AST-') ? (
                <span className="text-zinc-400 font-sans">
                  RFID: <span className="text-zinc-500 hover:text-blue-400 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onNavigate(comp.uuid, 'hardware'); }}>{comp.assetId}</span>
                </span>
              ) : (
                <span className="text-zinc-500 select-all">
                  Part: {comp.partNumber || '---'}
                </span>
              )}
              {comp.serialNumber && (
                <span className="text-zinc-500 select-all">
                  S/N: {comp.serialNumber}
                </span>
              )}
            </div>
          </td>

          {/* Column 4: Software / Connections */}
          <td className="px-6 py-3">
            <div className="flex flex-col gap-1">
              {comp.isFru && (
                <span className="text-[10px] font-sans italic text-zinc-550">
                  Field Replaceable Unit
                </span>
              )}
              {swInfo && (
                <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-400">
                  <span>[Firmware: {swInfo.name} {swInfo.revision}]</span>
                </div>
              )}
              {linkTargetName && (
                <div className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                  <span className="text-zinc-500 text-[9px] font-sans">➔ to</span>
                  <span 
                    onClick={(e) => { e.stopPropagation(); onNavigate(linkTargetUuid, 'device'); }}
                    className="hover:text-blue-400 hover:underline cursor-pointer select-all font-semibold font-sans"
                  >
                    [{linkTargetName}]
                  </span>
                </div>
              )}
            </div>
          </td>

          {/* Column 5: Action */}
          <td className="px-6 py-3 text-right">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(comp.uuid, 'hardware');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-muted-foreground hover:text-blue-400 hover:border-blue-500/35 hover:bg-blue-500/5 text-xs font-bold transition-all"
            >
              <span>Inspect</span>
              <ChevronRight size={12} />
            </button>
          </td>
        </tr>
      );

      acc.push(componentRow);

      // Recurse for nested child hardware components
      const childRows = renderHardwareTreeRows(comp.uuid, nextPrefix, allHardware, itemUuid, depth + 1);
      acc.push(...childRows);

      return acc;
    }, []);
  };

  // Unified list of physical and logical nodes from standard RFC models
  const unifiedNodes = useMemo(() => {
    const list: NetworkElement[] = [];

    // Add physical nodes
    (topology.nodes || []).forEach(n => {
      list.push({ ...n, _isLogical: false } as any);
    });

    // Add logical nodes from RFC 8345 Network Topologies
    const rfcNetworks = networkService.getRFC8345Networks() || [];
    rfcNetworks.forEach(net => {
      (net.nodes || []).forEach(ln => {
        // Prevent duplicate IDs if any overlapping node exists
        if (list.some(item => item.uuid === ln.nodeId)) return;

        const physicalRef = ln.activeNeRef ? topology.nodes.find(n => n.uuid === ln.activeNeRef) : null;
        list.push({
          uuid: ln.nodeId,
          name: ln.name || ln.nodeId,
          type: 'Logical Router / Virtual Node (RFC 8345)',
          layer: `L3 IP Overlay: ${net.networkId}`,
          location: physicalRef?.location || 'Logical Cloud Domain',
          ietfSystem: physicalRef?.ietfSystem || {
            hostname: ln.nodeId,
            contact: 'ietf-noc@telecom.jp',
            location: 'Logical Router Instance',
            platform: {
              osName: 'IETF-YANG Router Engine',
              osRelease: 'RFC 8345 Compliant',
              osVersion: '1.0',
              machine: 'virtual_container'
            },
            clock: {
              timezoneName: 'Asia/Tokyo',
              currentDatetime: new Date().toISOString()
            }
          },
          ietfGeoLocation: physicalRef?.ietfGeoLocation || {
            referenceFrame: {
              astronomicalBody: 'earth',
              geodeticSystem: { coordAccuracy: 1 }
            },
            location: {
              ellipsoid: { latitude: 35.6895, longitude: 139.6917, height: 0 }
            }
          },
          ietfInterfaces: (ln.terminationPoints || []).map(tp => ({
            name: tp.tpId,
            type: 'iana-if-type:logicalInterface',
            enabled: true,
            adminStatus: 'up',
            operStatus: 'up',
            speed: 100000000000,
            description: `Logical TP Interface ${tp.tpId} mapped to standard underlay`,
            statistics: {
              inOctets: 15423523,
              inUnicastPkts: 12411,
              inErrors: 0,
              inDiscards: 0,
              outOctets: 14214221,
              outUnicastPkts: 11214,
              outErrors: 0,
              outDiscards: 0
            }
          })),
          hardware: physicalRef?.hardware || [],
          services: physicalRef?.services || [],
          _isLogical: true,
          _networkId: net.networkId
        } as any);
      });
    });

    return list;
  }, [topology.nodes, networkService]);

  const filteredNodes = useMemo(() => {
    let nodes = unifiedNodes;
    if (activeLayer !== 'all') {
      nodes = nodes.filter(n => {
        const nodeLayer = n.layer.toLowerCase();
        const filterLayer = activeLayer.toLowerCase();
        
        if (filterLayer.startsWith('l0')) return nodeLayer.includes('l0') || nodeLayer.includes('underlay-l0');
        if (filterLayer.startsWith('l1')) return nodeLayer.includes('l1') || nodeLayer.includes('transport');
        if (filterLayer.startsWith('l2')) return nodeLayer.includes('l2') || nodeLayer.includes('ethernet');
        if (filterLayer.startsWith('l3')) return nodeLayer.includes('l3') || nodeLayer.includes('ip') || nodeLayer.includes('overlay') || nodeLayer.includes('carrier');
        if (filterLayer.startsWith('mobile')) return nodeLayer.includes('mobile') || nodeLayer.includes('ran') || nodeLayer.includes('core');
        return nodeLayer.includes(filterLayer);
      });
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      nodes = nodes.filter(n => 
        n.name.toLowerCase().includes(q) || 
        n.type.toLowerCase().includes(q) || 
        n.location.toLowerCase().includes(q) ||
        n.uuid.toLowerCase().includes(q) ||
        n.layer.toLowerCase().includes(q)
      );
    }
    return nodes;
  }, [activeLayer, searchQuery, unifiedNodes]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(NetworkLayer).forEach(l => counts[l] = 0);
    counts['Overlay (IP)'] = 0;

    unifiedNodes.forEach(n => {
      let matched = false;
      Object.values(NetworkLayer).forEach(l => {
        if (n.layer === l) {
          counts[l]++;
          matched = true;
        }
      });
      if (!matched) {
        counts['Overlay (IP)']++;
      }
    });

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name: name.split(' ')[0], value }));
  }, [unifiedNodes]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Advanced first-order relationship and containment resolver
  const resolvedDecomp = useMemo(() => {
    const q = decompQuery.trim().toLowerCase();
    if (!q) return null;

    const rfcNetworks = networkService.getRFC8345Networks() || [];
    const topologyNodes = topology.nodes || [];

    let matchedLogical: any = null;
    let matchedLogicalNetId: string = '';
    let matchedPhysical: any = null;
    let matchedComponent: any = null;
    let componentOwnerNode: any = null;

    // 1. Search Logical Nodes (IETF rfc8345)
    for (const net of rfcNetworks) {
      const foundNode = (net.nodes || []).find(n => 
        n.nodeId.toLowerCase().includes(q) || 
        (n.name && n.name.toLowerCase().includes(q))
      );
      if (foundNode) {
        matchedLogical = foundNode;
        matchedLogicalNetId = net.networkId;
        break;
      }
    }

    // 2. Search Physical Nodes (Network Elements)
    const foundPhysical = topologyNodes.find(n => 
      n.uuid.toLowerCase().includes(q) || 
      n.name.toLowerCase().includes(q) || 
      (n.location && n.location.toLowerCase().includes(q))
    );
    if (foundPhysical) {
      matchedPhysical = foundPhysical;
    }

    // 3. Search Hardware components
    for (const pNode of topologyNodes) {
      const foundComp = (pNode.hardware || []).find(h => 
        h.uuid.toLowerCase().includes(q) || 
        h.name.toLowerCase().includes(q) ||
        (h.partNumber && h.partNumber.toLowerCase().includes(q)) ||
        (h.serialNumber && h.serialNumber.toLowerCase().includes(q))
      );
      if (foundComp) {
        matchedComponent = foundComp;
        componentOwnerNode = pNode;
        break;
      }
    }

    let targetType: 'logical' | 'physical' | 'component' | 'none' = 'none';
    let label = '';
    let description = '';
    let uuid = '';
    let secondaryLabel = '';

    let resolvedLogicalNode = matchedLogical;
    let resolvedLogicalNetId = matchedLogicalNetId;
    let resolvedPhysicalNode = matchedPhysical;
    let resolvedComponent = matchedComponent;

    if (matchedLogical) {
      targetType = 'logical';
      uuid = matchedLogical.nodeId;
      label = matchedLogical.name || matchedLogical.nodeId;
      description = matchedLogical.description || 'Logical IETF RFC 8345 topology underlay model terminal node';
      secondaryLabel = `Logical Node (${matchedLogicalNetId})`;

      if (matchedLogical.activeNeRef) {
        resolvedPhysicalNode = topologyNodes.find(n => n.uuid === matchedLogical.activeNeRef);
      }
    } else if (matchedPhysical) {
      targetType = 'physical';
      uuid = matchedPhysical.uuid;
      label = matchedPhysical.name;
      description = matchedPhysical.description || 'Active physical network terminal shelf geolocated in Japan';
      secondaryLabel = `Physical Network Element (${matchedPhysical.layer})`;

      for (const net of rfcNetworks) {
        const ln = (net.nodes || []).find(n => n.activeNeRef === matchedPhysical.uuid);
        if (ln) {
          resolvedLogicalNode = ln;
          resolvedLogicalNetId = net.networkId;
          break;
        }
      }
    } else if (matchedComponent) {
      targetType = 'component';
      uuid = matchedComponent.uuid;
      label = matchedComponent.name;
      description = matchedComponent.description || `Inner shelf chassis containment asset unit [class: ${matchedComponent.class}]`;
      secondaryLabel = `Hardware Asset Component (Class: ${matchedComponent.class})`;

      resolvedPhysicalNode = componentOwnerNode;
      for (const net of rfcNetworks) {
        const ln = (net.nodes || []).find(n => n.activeNeRef === resolvedPhysicalNode.uuid);
        if (ln) {
          resolvedLogicalNode = ln;
          resolvedLogicalNetId = net.networkId;
          break;
        }
      }
    } else {
      return null;
    }

    const supportingOverlays: any[] = [];
    if (resolvedLogicalNode) {
      for (const net of rfcNetworks) {
        if (net.networkId !== resolvedLogicalNetId) {
          const overlays = (net.nodes || []).filter(n => 
            (n.supportingNodes || []).some(sn => sn.nodeRef === resolvedLogicalNode.nodeId)
          );
          overlays.forEach(ov => {
            supportingOverlays.push({
              networkId: net.networkId,
              nodeId: ov.nodeId,
              name: ov.name,
              description: ov.description
            });
          });
        }
      }
    }

    const connectedLinks: any[] = [];
    if (resolvedLogicalNode && resolvedLogicalNetId) {
      const activeNet = rfcNetworks.find(n => n.networkId === resolvedLogicalNetId);
      if (activeNet && activeNet.links) {
        const linksTouch = activeNet.links.filter(li => 
          li.source.sourceNode === resolvedLogicalNode.nodeId || 
          li.destination.destNode === resolvedLogicalNode.nodeId
        );
        linksTouch.forEach(li => {
          connectedLinks.push({
            linkId: li.linkId,
            sourceNode: li.source.sourceNode,
            sourceTp: li.source.sourceTp,
            destNode: li.destination.destNode,
            destTp: li.destination.destTp
          });
        });
      }
    }

    const hardwareList = resolvedPhysicalNode?.hardware || [];
    const chassisInfo = resolvedLogicalNode?.chassis || resolvedPhysicalNode?.hardware?.find((h: any) => h.class === 'chassis');

    return {
      matchedType: targetType,
      matchedId: uuid,
      matchedName: label,
      matchedDescription: description,
      secondaryLabel,
      logicalNetworkId: resolvedLogicalNetId,
      logicalNode: resolvedLogicalNode,
      physicalNode: resolvedPhysicalNode,
      chassisComponent: chassisInfo,
      supportingOverlays,
      connectedLinks,
      hardwareList
    };
  }, [decompQuery, topology.nodes, networkService]);

  const unicodeTreeString = useMemo(() => {
    if (!resolvedDecomp) return 'No matched entity structure to compile.';
    
    const lines: string[] = [];
    lines.push(`▼ SYSTEM TOPOLOGICAL DECOMPOSITION :: ${resolvedDecomp.matchedName} [${resolvedDecomp.matchedId}]`);
    lines.push(`  ID Reference: ${resolvedDecomp.matchedId}`);
    lines.push(`  Class Type  : ${resolvedDecomp.matchedType.toUpperCase()}`);
    lines.push(`  Description : ${resolvedDecomp.matchedDescription}`);
    lines.push(`═`.repeat(72));
    lines.push(``);

    lines.push(`▲ [1. LOGICAL SERVICES / IP OVERLAYS] (L3 Host Bindings)`);
    if (resolvedDecomp.supportingOverlays && resolvedDecomp.supportingOverlays.length > 0) {
      resolvedDecomp.supportingOverlays.forEach((ov: any, idx: number) => {
        const isLast = idx === resolvedDecomp.supportingOverlays.length - 1;
        const branch = isLast ? '└──' : '├──';
        lines.push(`  ${branch} [${ov.networkId}] Node ID: "${ov.nodeId}" (${ov.name || 'Core Router Terminal'})`);
      });
    } else {
      lines.push(`  └── (No active upper-layer L3 logical customer tunnels supported directly)`);
    }
    lines.push(``);

    lines.push(`🔶 [2. LOGICAL NET-MODEL LAYER] IETF RFC 8345 System Topology`);
    if (resolvedDecomp.logicalNode) {
      lines.push(`  ├── RFC Model Domain : ${resolvedDecomp.logicalNetworkId}`);
      lines.push(`  ├── Node Reference   : ${resolvedDecomp.logicalNode.nodeId}`);
      lines.push(`  ├── Logical Space Status : ACTIVE`);
      
      if (resolvedDecomp.logicalNode.gridConfig) {
        const gc = resolvedDecomp.logicalNode.gridConfig;
        lines.push(`  ├── Flexi-Grid Config  : priority ${gc.priority} DWDM spacing (Width: ${gc.slotWidthGhz || 50}Ghz)`);
      }
      
      const tps = resolvedDecomp.logicalNode.terminationPoints || [];
      if (tps.length > 0) {
        lines.push(`  ├── Termination Points (Logical Interfaces):`);
        tps.forEach((tp: any, idx: number) => {
          const isL = idx === tps.length - 1;
          const pre = isL ? '  │   └──' : '  │   ├──';
          lines.push(`${pre} tp-id: "${tp.tpId}" ${tp.activePortRef ? `[active physical port bind: ${tp.activePortRef}]` : ''}`);
        });
      }
    } else {
      lines.push(`  └── (No dry-run IETF RFC 8345 logical net-model parameters bound)`);
    }
    lines.push(``);

    lines.push(`⚙️ [3. PHYSICAL HARDWARE SHELF LAYER] Asset Containment Hierarchy`);
    if (resolvedDecomp.physicalNode) {
      const p = resolvedDecomp.physicalNode;
      lines.push(`  ├── Physical NE ID   : ${p.uuid}`);
      lines.push(`  ├── Core Platform OS : ${p.ietfSystem?.platform?.osName || 'SAOS Software'} Version ${p.ietfSystem?.platform?.osRelease || '10.7'}`);
      lines.push(`  ├── Geolocated Site  : ${p.location}`);
      lines.push(`  ├── Geodetic Coords  : Lat ${p.ietfGeoLocation?.location?.ellipsoid?.latitude || 35.6881}° / Lon ${p.ietfGeoLocation?.location?.ellipsoid?.longitude || 139.7635}°`);
      
      if (resolvedDecomp.chassisComponent) {
        const ch = resolvedDecomp.chassisComponent;
        lines.push(`  └── [CHASSIS DEVICE CONTAINER] :: Name: "${ch.name}" (ID: ${ch.uuid || ch.chassisId})`);
        
        const nested = resolvedDecomp.hardwareList.filter((h: any) => h.parentUuid === ch.uuid || h.parentUuid === ch.chassisId || h.class !== 'chassis');
        if (nested.length > 0) {
          nested.forEach((h: any, idx: number) => {
            const isL = idx === nested.length - 1;
            const branch = isL ? '      └──' : '      ├──';
            lines.push(`${branch} [${h.class.toUpperCase()}] ${h.name} (${h.partNumber || 'NTK-SFP+'}) [Serial: ${h.serialNumber?.substring(0,8) || '---'}] State: ${h.status.toUpperCase()}`);
          });
        } else {
          lines.push(`      └── (Containment Tree contains standard line sub-modules and high-speed transceivers)`);
        }
      } else {
        lines.push(`  └── (No top-level asset chassis shell bound)`);
      }
    } else {
      lines.push(`  └── (No geolocated cabinet or physical hardware asset mapping found)`);
    }
    lines.push(``);

    lines.push(`🌐 [4. FIBER OPTICAL LINE LINKAGES] Adjacency Fiber Interfaces`);
    if (resolvedDecomp.connectedLinks && resolvedDecomp.connectedLinks.length > 0) {
      resolvedDecomp.connectedLinks.forEach((li: any, idx: number) => {
        const isL = idx === resolvedDecomp.connectedLinks.length - 1;
        const branch = isL ? '└──' : '├──';
        lines.push(`  ${branch} ${li.linkId} :: ${li.sourceNode}/${li.sourceTp} ➔ ${li.destNode}/${li.destTp}`);
      });
    } else {
      lines.push(`  └── (Not directly bound to adjacent optical fiber trans-island fiber frames)`);
    }

    return lines.join('\n');
  }, [resolvedDecomp]);

  const jsonRepresentation = useMemo(() => {
    if (!resolvedDecomp) return '{}';
    return JSON.stringify({
      "@context": "https://ietf.org/schemas/rfc8345-decomposition",
      "matchedEntity": {
        "id": resolvedDecomp.matchedId,
        "type": resolvedDecomp.matchedType,
        "name": resolvedDecomp.matchedName,
        "classLabel": resolvedDecomp.secondaryLabel
      },
      "logicalUnderlay": resolvedDecomp.logicalNode ? {
        "domainId": resolvedDecomp.logicalNetworkId,
        "nodeId": resolvedDecomp.logicalNode.nodeId,
        "terminationPoints": resolvedDecomp.logicalNode.terminationPoints,
        "grid": resolvedDecomp.logicalNode.gridConfig
      } : null,
      "physicalAsset": resolvedDecomp.physicalNode ? {
        "uuid": resolvedDecomp.physicalNode.uuid,
        "name": resolvedDecomp.physicalNode.name,
        "location": resolvedDecomp.physicalNode.location,
        "osName": resolvedDecomp.physicalNode.ietfSystem?.platform?.osName,
        "chassis": resolvedDecomp.chassisComponent ? {
          "id": resolvedDecomp.chassisComponent.uuid || resolvedDecomp.chassisComponent.chassisId,
          "name": resolvedDecomp.chassisComponent.name,
          "manufacturer": resolvedDecomp.chassisComponent.manufacturer
        } : null,
        "hardwareModules": resolvedDecomp.hardwareList.map((h: any) => ({
          "uuid": h.uuid,
          "name": h.name,
          "class": h.class,
          "status": h.status
        }))
      } : null,
      "overlays": resolvedDecomp.supportingOverlays,
      "adjacentLinks": resolvedDecomp.connectedLinks
    }, null, 2);
  }, [resolvedDecomp]);

  const yamlRepresentation = useMemo(() => {
    if (!resolvedDecomp) return '';
    return `ietf-rfc8345-decomposition:
  metadata:
    query_target: "${resolvedDecomp.matchedId}"
    match_category: "${resolvedDecomp.matchedType}"
    timestamp: "2026-06-02T15:40:00Z"
  entity_identity:
    uuid: "${resolvedDecomp.matchedId}"
    human_name: "${resolvedDecomp.matchedName}"
    description: "${resolvedDecomp.matchedDescription}"
    category_label: "${resolvedDecomp.secondaryLabel}"
  logical_profile:
    network_ref: "${resolvedDecomp.logicalNetworkId || 'None'}"
    node_ref: "${resolvedDecomp.logicalNode?.nodeId || 'None'}"
    grid_configuration:
      priority: ${resolvedDecomp.logicalNode?.gridConfig?.priority || 0}
      type: "${resolvedDecomp.logicalNode?.gridConfig?.gridType || 'None'}"
  physical_profile:
    device_uuid: "${resolvedDecomp.physicalNode?.uuid || 'None'}"
    site_location: "${resolvedDecomp.physicalNode?.location || 'None'}"
    operating_system: "${resolvedDecomp.physicalNode?.ietfSystem?.platform?.osName || 'SAOS'}"
    chassis_enclosure:
      id: "${resolvedDecomp.chassisComponent?.uuid || resolvedDecomp.chassisComponent?.chassisId || 'None'}"
      part_number: "${resolvedDecomp.chassisComponent?.partNumber || 'None'}"
      status: "${resolvedDecomp.chassisComponent?.status || 'None'}"
  first_order_bndgs:
    customer_overlays_count: ${resolvedDecomp.supportingOverlays?.length || 0}
    adjacent_connections_count: ${resolvedDecomp.connectedLinks?.length || 0}
`;
  }, [resolvedDecomp]);

  const handleCopy = () => {
    const textToCopy = activeExportTab === 'ascii' ? unicodeTreeString : activeExportTab === 'json' ? jsonRepresentation : yamlRepresentation;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans">IETF Domain Explorer</h2>
          <p className="text-muted-foreground mt-1 text-sm font-sans">Cross-layer inventory management and component containment decomposition according to IETF RFC 8345 & 8348.</p>
        </div>
        
        {/* Toggle Mode button */}
        <div className="flex bg-muted/65 p-1 rounded-xl border border-border/80">
          <button 
            onClick={() => setActiveTab('standard')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'standard' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-muted-foreground hover:text-foreground/80'}`}
          >
            Standard Inventory
          </button>
          <button 
            onClick={() => setActiveTab('decomposition')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'decomposition' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-muted-foreground hover:text-foreground/80'}`}
          >
            Container & Decomposition (AI Prototype)
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'standard' ? (
          <motion.div 
            key="standard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-8"
          >
            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 font-sans">
              <StatCard icon={<Database className="text-blue-500"/>} label="Optical ROADMs" value="12" subtext="L0/L1 Domain" />
              <StatCard icon={<Activity className="text-emerald-500"/>} label="Eth Switches" value="48" subtext="Carrier Grade L2" />
              <StatCard icon={<BarChart3 className="text-amber-500"/>} label="L3 PE Routers" value="18" subtext="IP/MPLS Domain" />
              <StatCard icon={<Radio className="text-purple-500"/>} label="Mobile Nodes" value="1.2k" subtext="RU/DU/CU" />
            </div>

            <div className="flex bg-muted/20 p-1.5 rounded-xl border border-border/50 max-w-max">
              <button 
                onClick={() => setActiveLayer('all')}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${activeLayer === 'all' ? 'bg-muted border border-zinc-700 text-blue-400' : 'text-muted-foreground hover:text-foreground/80'}`}
              >
                All Domains
              </button>
              {Object.values(NetworkLayer).map(layer => (
                <button 
                  key={layer}
                  onClick={() => setActiveLayer(layer)}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${activeLayer === layer ? 'bg-muted border border-zinc-700 text-blue-400' : 'text-muted-foreground/80'}`}
                >
                  {layer.split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans">
              {/* Nodes List */}
              <div className="xl:col-span-2 bg-muted/30 border border-border rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                    <Network size={18} className="text-blue-500" />
                    Network Inventory Elements
                  </h3>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter inventory list..." 
                      className="bg-background/50 border border-border rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-blue-500 transition-all w-48 text-white"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-b border-border/50 bg-background/20">
                        <th className="px-6 py-4">Element / Layer</th>
                        <th className="px-6 py-4">Hardware Class</th>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {filteredNodes.map(node => {
                        const isExpanded = !!expandedNodes[node.uuid];
                        return (
                          <React.Fragment key={node.uuid}>
                            <tr 
                              onClick={() => setSelectedNode(node)}
                              onDoubleClick={() => onNavigate(node.uuid, 'device')}
                              className={`group hover:bg-muted/30 transition-colors cursor-pointer ${selectedNode?.uuid === node.uuid ? 'bg-blue-600/5' : ''}`}
                              title="Single-click to open hardware layout, double-click for full detail screen"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all shrink-0">
                                    {getIconForLayer(node.layer)}
                                  </div>
                                  <div className="flex flex-col truncate">
                                    <span 
                                      onClick={(e) => { e.stopPropagation(); onNavigate(node.uuid, 'device'); }}
                                      className="font-bold text-sm text-white hover:text-blue-400 hover:underline cursor-pointer select-all truncate"
                                      title="Click to view details"
                                    >
                                      {node.name}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/80 mt-0.5">
                                      <span className="truncate max-w-[120px] select-all">{node.layer}</span>
                                      <span className="text-zinc-700 select-none">|</span>
                                      <span 
                                        onClick={(e) => { e.stopPropagation(); onNavigate(node.uuid, 'device'); }}
                                        className="hover:text-blue-400 hover:underline cursor-pointer select-all font-mono"
                                        title="Click to inspect device"
                                      >
                                        ID: {node.uuid}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-muted-foreground select-all">
                                {node.type}
                              </td>
                              <td className="px-6 py-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2 select-all">
                                  <MapPin size={12} className="text-muted-foreground/80" />
                                  {node.location}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-wider select-none">
                                  <ShieldCheck size={12} />
                                  Provisioned
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* BOM Hierarchy Row Expansion Toggle */}
                                  <button
                                    onClick={(e) => toggleNodeExpansion(node.uuid, e)}
                                    className={`p-1.5 rounded-lg border transition-colors flex items-center ${
                                      isExpanded 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                                        : 'bg-background/50 border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                    title={isExpanded ? "Collapse Containment Hierarchy" : "Expand Containment Tree (YANG BOM)"}
                                  >
                                    <FolderTree size={14} />
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNavigate(node.uuid, 'device');
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background/50 text-muted-foreground hover:text-blue-400 hover:border-blue-500/35 hover:bg-blue-500/5 text-xs font-bold transition-all group/btn"
                                  >
                                    <span>Inspect</span>
                                    <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform text-muted-foreground/85" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <>
                                {node.hardware && node.hardware.length > 0 ? (
                                  renderHardwareTreeRows(undefined, '', node.hardware, node.uuid)
                                ) : (
                                  <tr className="bg-zinc-950/20 font-mono text-xs border-b border-zinc-800/15">
                                    <td colSpan={5} className="px-6 py-4 pl-12 text-zinc-600 italic animate-pulse">
                                      └── No hardware components mapped. Use components tab in Network Inventory to configure cabinet elements.
                                    </td>
                                  </tr>
                                )}
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Charts & Distributions */}
              <div className="space-y-6">
                <div className="bg-muted/30 border border-border rounded-3xl p-6 backdrop-blur-sm">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                    <BarChart3 size={14} className="text-blue-500" />
                    Distribution by Layer
                  </h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height={192}>
                      <BarChart data={stats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={9} axisLine={false} tickLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} axisLine={false} tickLine={false} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20">
                  <Zap className="mb-4" size={32} />
                  <h4 className="font-bold text-lg mb-2">Automated Discovery</h4>
                  <p className="text-blue-100 text-xs leading-relaxed mb-6 opacity-80">
                    Found 14 new hardware components in the Tokyo Otemachi building. IETF-NHI models correctly identified these as ROADM transponder line cards.
                  </p>
                  <button className="w-full py-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold transition-colors">
                    Ingest Discovered Assets
                  </button>
                </div>
              </div>
            </div>

            {/* Hardware Inspector */}
            <AnimatePresence>
              {selectedNode && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-muted/30 border border-border rounded-3xl overflow-hidden backdrop-blur-sm"
                >
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                        <Database size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">{selectedNode.name} Cabinet Hardware</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Physical Containment</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onNavigate(selectedNode.uuid, 'device')}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition-colors text-white flex items-center gap-2"
                      >
                        View Full Details
                        <ExternalLink size={14} />
                      </button>
                      <button 
                        onClick={() => setSelectedNode(null)}
                        className="px-4 py-1.5 bg-muted hover:bg-zinc-700 border border-zinc-800 rounded-lg text-xs font-bold transition-colors text-muted-foreground"
                      >
                        Close Cabinet
                      </button>
                    </div>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {selectedNode.hardware.map(hw => (
                      <HardwareCard key={hw.uuid} component={hw} onNavigate={onNavigate} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            key="decomposition"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6 text-left"
          >
            {/* Explainer Notice Banner */}
            <div className="bg-blue-950/20 border border-blue-900/40 rounded-2xl p-5.5 flex gap-4 font-sans text-xs max-w-full">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
                <Info size={18} />
              </span>
              <div className="space-y-1 text-zinc-300">
                <h4 className="font-bold text-white text-sm">Mapping IETF RFC 8345 Topological Underlays to Chassis Containment</h4>
                <p className="leading-relaxed text-zinc-400">
                  Logical Network Entities defined under standards like IETF RFC 8345 (e.g., <code className="text-blue-400 font-mono text-[11px] bg-blue-950/40 px-1 py-0.5 rounded">node-L0-TK-terminal</code>) exist inside logical/optical network schemas.
                  These entities bind via <code className="text-emerald-400 font-mono text-[11px]">activeNeRef</code> and <code className="text-emerald-400 font-mono text-[11px]">chassis</code> mapping fields to physical shelf containers (like <code className="text-blue-400 font-mono text-[11px]">ch-TK1</code> chassis within the physical geolocated equipment <code className="text-blue-400 font-mono text-[11px]">node-TK1</code> in Tokyo).
                  Use this prototype to decompose any logical ID, chassis ID, or hardware asset into its exact first-order supporting dependencies.
                </p>
              </div>
            </div>

            {/* Interactivity Search Area */}
            <div className="bg-muted/30 border border-border rounded-3xl p-6 space-y-4 font-sans">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={decompQuery}
                    onChange={(e) => setDecompQuery(e.target.value)}
                    placeholder="Enter Identifier (Logical ID, Device UUID, Chassis, eg: node-L0-TK-terminal)..." 
                    className="w-full bg-background/60 border border-border rounded-xl py-3 pl-11 pr-4 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all"
                  />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                  <button 
                    onClick={() => setDecompQuery('node-L0-TK-terminal')}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono border border-zinc-800 hover:border-zinc-700 text-blue-400 transition-all font-semibold"
                  >
                    Use Terminal Logical
                  </button>
                  <button 
                    onClick={() => setDecompQuery('node-TK1')}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono border border-zinc-800 hover:border-zinc-700 text-emerald-400 transition-all font-semibold"
                  >
                    Use Tokyo Physical
                  </button>
                  <button 
                    onClick={() => setDecompQuery('ch-TK1')}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono border border-zinc-800 hover:border-zinc-700 text-amber-400 transition-all font-semibold"
                  >
                    Use Chassis UUID
                  </button>
                </div>
              </div>
            </div>

            {/* Split Screen Output */}
            {resolvedDecomp ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start font-sans">
                
                {/* LEFT COLUMN: Visual Flow Representation */}
                <div className="xl:col-span-6 space-y-4">
                  <div className="bg-muted/30 border border-border rounded-3xl p-6.5 space-y-6">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                          <FolderTree className="w-4 h-4 text-emerald-500 animate-pulse" />
                          Containment Layout View
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Physical equipment containment and logical layer binding relationships.</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded font-bold uppercase">
                        Active Maps
                      </span>
                    </div>

                    {/* Step Flow List */}
                    <div className="space-y-4">

                      {/* Step 1: Customer Logical Routing Overlay */}
                      <div className="p-4 rounded-2xl bg-zinc-950/20 border border-zinc-800/60 flex items-start gap-3.5 relative">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                           <Network size={16} />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase select-all">Layer 3 Customer Tunnel Overlay</span>
                          <h5 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (resolvedDecomp.physicalNode) {
                                onNavigate(resolvedDecomp.physicalNode.uuid, 'device');
                              }
                            }}
                            className="font-bold text-white text-xs mt-1 hover:text-blue-400 hover:underline cursor-pointer select-all"
                            title="Click to inspect underlying physical device"
                          >
                            {resolvedDecomp.supportingOverlays && resolvedDecomp.supportingOverlays[0] ? (
                              resolvedDecomp.supportingOverlays[0].name
                            ) : (
                              'Tokyo / Osaka PE IP Services'
                            )}
                          </h5>
                          <p className="text-[10px] text-zinc-400 leading-relaxed font-sans select-all">
                            {resolvedDecomp.supportingOverlays && resolvedDecomp.supportingOverlays[0] ? (
                              `Logical Node Reference ID: ${resolvedDecomp.supportingOverlays[0].nodeId}`
                            ) : (
                              'No dynamic virtual private networks active. Maps to logical routers supported by physical wavelengths.'
                            )}
                          </p>
                        </div>
                        <div className="absolute -bottom-4.5 left-10 text-zinc-600">
                          ↓
                        </div>
                      </div>

                      {/* Step 2: Logical Transport Network (IETF RFC 8345) */}
                      <div className="p-4 rounded-2xl bg-zinc-950/20 border border-zinc-800/60 flex items-start gap-3.5 relative">
                        <div className={`w-8 h-8 rounded-lg ${resolvedDecomp.matchedType === 'logical' ? 'bg-blue-600 text-white animate-pulse' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'} flex items-center justify-center shrink-0`}>
                          <Layers size={16} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-blue-500/10 border border-blue-500/25 text-blue-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase select-all">Layer 0 Transport model (underlay-L0)</span>
                            {resolvedDecomp.matchedType === 'logical' && <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[8px] px-1.5 py-0.1 rounded font-bold uppercase animate-pulse">Search Target Match</span>}
                          </div>
                          <h5 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (resolvedDecomp.physicalNode) {
                                onNavigate(resolvedDecomp.physicalNode.uuid, 'device');
                              }
                            }}
                            className="font-bold text-white text-xs mt-1 hover:text-blue-400 hover:underline cursor-pointer select-all"
                            title="Click to view underlying physical device details"
                          >
                            {resolvedDecomp.logicalNode ? resolvedDecomp.logicalNode.name : 'Physical Optical Underlay Model'}
                          </h5>
                          <p className="text-[10px] text-zinc-400 leading-relaxed select-all">
                            Logical Node ID: <code 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (resolvedDecomp.physicalNode) {
                                  onNavigate(resolvedDecomp.physicalNode.uuid, 'device');
                                }
                              }}
                              className="text-blue-400 font-mono text-[11px] bg-blue-950/40 px-1.5 py-0.5 rounded hover:text-blue-300 hover:underline cursor-pointer select-all"
                              title="Click to inspect underlying physical device"
                            >{resolvedDecomp.logicalNode ? resolvedDecomp.logicalNode.nodeId : 'None'}</code>
                          </p>
                          {resolvedDecomp.logicalNode?.gridConfig && (
                            <div className="text-[10px] font-mono text-zinc-500 mt-1 select-all">
                              Spectral Type: Grid Mode {resolvedDecomp.logicalNode.gridConfig.gridType} (Priority: {resolvedDecomp.logicalNode.gridConfig.priority})
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-4.5 left-10 text-zinc-600">
                          ↓
                        </div>
                      </div>

                      {/* Step 3: Active Device Facility (Rack Location) */}
                      <div className="p-4 rounded-2xl bg-zinc-950/20 border border-zinc-800/60 flex items-start gap-3.5 relative">
                        <div className={`w-8 h-8 rounded-lg ${resolvedDecomp.matchedType === 'physical' ? 'bg-emerald-600 text-white animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'} flex items-center justify-center shrink-0`}>
                          <MapPin size={16} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase select-all">Geolocated Physical NE Reference</span>
                            {resolvedDecomp.matchedType === 'physical' && <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[8px] px-1.5 py-0.1 rounded font-bold uppercase animate-pulse">Search Target Match</span>}
                          </div>
                          <h5 
                            onClick={(e) => { e.stopPropagation(); resolvedDecomp.physicalNode && onNavigate(resolvedDecomp.physicalNode.uuid, 'device'); }}
                            className="font-bold text-white text-xs mt-1 hover:text-emerald-400 hover:underline cursor-pointer select-all"
                            title="Click to view physical device inspector"
                          >
                            {resolvedDecomp.physicalNode ? resolvedDecomp.physicalNode.name : '---'}
                          </h5>
                          <p className="text-[10px] text-zinc-400 leading-relaxed select-all">
                            Hardware UUID: <code 
                              onClick={(e) => { e.stopPropagation(); resolvedDecomp.physicalNode && onNavigate(resolvedDecomp.physicalNode.uuid, 'device'); }}
                              className="text-emerald-400 font-mono text-[11px] bg-zinc-900 px-1.5 py-0.5 rounded hover:text-emerald-300 hover:underline cursor-pointer select-all"
                              title="Click to view physical device inspector"
                            >{resolvedDecomp.physicalNode ? resolvedDecomp.physicalNode.uuid : 'None'}</code>
                          </p>
                          {resolvedDecomp.physicalNode && (
                            <div className="text-[10px] text-zinc-500 mt-1 select-all">
                              Telecom Rack Room: {resolvedDecomp.physicalNode.location}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-4.5 left-10 text-zinc-600">
                          ↓
                        </div>
                      </div>

                      {/* Step 4: Asset Chassis Container Shell */}
                      <div className="p-4 rounded-2xl bg-zinc-950/20 border border-zinc-800/40 flex items-start gap-3.5">
                        <div className={`w-8 h-8 rounded-lg ${resolvedDecomp.matchedType === 'component' ? 'bg-amber-600 text-white animate-pulse' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'} flex items-center justify-center shrink-0`}>
                          <Database size={16} />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] bg-amber-500/10 border border-amber-500/25 text-amber-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase select-all">Chassis Container Unit (RFC 8348)</span>
                            {resolvedDecomp.matchedType === 'component' && <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[8px] px-1.5 py-0.1 rounded font-bold uppercase animate-pulse">Search Target Match</span>}
                          </div>
                          <h5 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (resolvedDecomp.chassisComponent && resolvedDecomp.chassisComponent.uuid) {
                                onNavigate(resolvedDecomp.chassisComponent.uuid, 'hardware');
                              } else if (resolvedDecomp.physicalNode) {
                                onNavigate(resolvedDecomp.physicalNode.uuid, 'device');
                              }
                            }}
                            className="font-bold text-white text-xs mt-1 hover:text-amber-400 hover:underline cursor-pointer select-all"
                            title="Inspect hardware component"
                          >
                            {resolvedDecomp.chassisComponent ? resolvedDecomp.chassisComponent.name : '---'}
                          </h5>
                          <p className="text-[10px] text-zinc-400 leading-relaxed mb-3 select-all">
                            Chassis Part: <code 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (resolvedDecomp.chassisComponent && resolvedDecomp.chassisComponent.uuid) {
                                  onNavigate(resolvedDecomp.chassisComponent.uuid, 'hardware');
                                } else if (resolvedDecomp.physicalNode) {
                                  onNavigate(resolvedDecomp.physicalNode.uuid, 'device');
                                }
                              }}
                              className="text-amber-400 font-mono text-[11px] bg-zinc-900 px-1.5 py-0.5 rounded hover:text-amber-300 hover:underline cursor-pointer select-all"
                              title="Inspect hardware component"
                            >{resolvedDecomp.chassisComponent ? (resolvedDecomp.chassisComponent.uuid || resolvedDecomp.chassisComponent.chassisId) : 'None'}</code>
                          </p>
                          
                          {/* Inner container hierarchy elements list */}
                          <div className="bg-background/40 border border-zinc-900 rounded-xl p-3.5 space-y-2 text-[11px] font-mono select-all">
                            <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Sub-components & Shelf Cards</div>
                            <div className="divide-y divide-zinc-900 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {resolvedDecomp.hardwareList.filter((h: any) => h.class !== 'chassis').length === 0 ? (
                                <div className="text-zinc-600 italic text-[10px]">No auxiliary transceivers or line boards listed model.</div>
                              ) : (
                                resolvedDecomp.hardwareList.filter((h: any) => h.class !== 'chassis').map((h: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-[10px] pt-1.5 text-zinc-300">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                      <span 
                                        onClick={(e) => { e.stopPropagation(); onNavigate(h.uuid, 'hardware'); }}
                                        className="font-bold text-zinc-300 hover:text-blue-400 hover:underline cursor-pointer select-all"
                                        title="Inspect sub-component"
                                      >{h.name}</span>
                                      <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1 rounded uppercase font-bold select-none">{h.class}</span>
                                    </div>
                                    <span className="text-zinc-500 uppercase select-all">{h.status}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: AI Prompt Structured Tree & Export Manifest */}
                <div className="xl:col-span-6 space-y-4">
                  <div className="bg-zinc-950/25 border border-border rounded-3xl p-6 relative font-mono text-xs overflow-hidden backdrop-blur-md">
                    
                    {/* Header bar tabs */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-blue-500 animate-pulse" />
                        <span className="font-bold text-white text-xs uppercase tracking-wider font-sans">AI & Orchestrator Context Export</span>
                      </div>
                      
                      <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 shrink-0">
                        <button 
                          onClick={() => setActiveExportTab('ascii')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${activeExportTab === 'ascii' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          ASCII Tree
                        </button>
                        <button 
                          onClick={() => setActiveExportTab('json')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${activeExportTab === 'json' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          JSON-LD
                        </button>
                        <button 
                          onClick={() => setActiveExportTab('yaml')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${activeExportTab === 'yaml' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          YAML Map
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-500 font-sans mt-3 leading-relaxed mb-4">
                      This representation lists raw topological bounds and containment dependencies in standard formats. Highly suited for embedding as context within LLM system prompts or SDN diagnostic loops.
                    </p>

                    {/* Pre-formatted output container */}
                    <div className="relative">
                      <button 
                        onClick={handleCopy}
                        className="absolute right-3 top-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5"
                      >
                        {copied ? (
                          <>
                            <Check size={12} className="text-emerald-400 animate-pulse" />
                            <span className="text-emerald-400 lowercase">copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Structure</span>
                          </>
                        )}
                      </button>

                      <pre className="p-4 bg-black/60 border border-zinc-900/80 rounded-2xl text-[11px] leading-relaxed overflow-x-auto text-zinc-300 font-mono max-h-[460px] overflow-y-auto block pr-1">
                        {activeExportTab === 'ascii' && unicodeTreeString}
                        {activeExportTab === 'json' && jsonRepresentation}
                        {activeExportTab === 'yaml' && yamlRepresentation}
                      </pre>
                    </div>

                    {/* Quick explanatory footer */}
                    <div className="mt-4 p-4 rounded-xl bg-orange-950/10 border border-orange-900/30 flex items-center gap-2.5 font-sans text-[11px] text-zinc-400">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 shrink-0">★</span>
                      <p>
                        <strong>AI Assistant Hint:</strong> Feed this structured topology mapping directly to the network copilot to resolve why log entities don't appear in the main hardware catalogs.
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-zinc-950/20 border border-dashed border-border p-12 rounded-3xl text-center space-y-3 font-sans">
                <p className="text-zinc-500 font-mono text-xs italic">No matching physical cabinet element or logical netnode found matching query &apos;{decompQuery}&apos;.</p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => setDecompQuery('node-L0-TK-terminal')}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-colors"
                  >
                    Load Default Demo
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ icon, label, value, subtext }: { icon: any, label: string, value: string, subtext: string }) => (
  <div className="bg-muted/30 border border-border rounded-3xl p-6 backdrop-blur-sm group hover:border-border/80 transition-all text-left">
     <div className="flex items-center gap-4 mb-4">
        <div className="p-2.5 rounded-xl bg-background border border-border group-hover:scale-110 transition-transform">
           {icon}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">{label}</p>
     </div>
     <div className="flex items-end gap-2">
        <h4 className="text-3xl font-bold text-white">{value}</h4>
        <p className="text-xs text-muted-foreground/80 mb-1">{subtext}</p>
     </div>
  </div>
);

const HardwareCard: React.FC<{ component: HardwareComponent, onNavigate: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void }> = ({ component, onNavigate }) => (
  <div 
    className={`p-5 rounded-2xl border transition-all cursor-pointer group hover:shadow-md text-left ${component.class === 'chassis' ? 'bg-muted/40 border-blue-500/30' : 'bg-background/50 border-border/50'}`}
    onClick={() => onNavigate(component.uuid, 'hardware')}
  >
     <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
           <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${component.class === 'chassis' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
              {component.class === 'chassis' ? <Database size={16}/> : <Cpu size={16}/>}
           </div>
           <p className="text-xs font-bold text-white truncate max-w-[120px] group-hover:text-blue-400 transition-colors">{component.name}</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
     </div>
     <div className="space-y-3 font-sans">
        <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-muted-foreground/85">
           <span>Class</span>
           <span className="text-muted-foreground">{component.class}</span>
        </div>
        <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-muted-foreground/85">
           <span>Model</span>
           <span className="text-muted-foreground font-mono">{component.partNumber || '---'}</span>
        </div>
        <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-muted-foreground/85">
           <span>Serial</span>
           <span className="text-muted-foreground font-mono">{component.serialNumber?.substring(0,8) || '---'}</span>
        </div>
     </div>
  </div>
);

const getIconForLayer = (layer: string) => {
  const l = layer.toLowerCase();
  if (l.includes('optical') || l.includes('l0')) return <Zap size={20} />;
  if (l.includes('transport') || l.includes('l1')) return <Activity size={20} />;
  if (l.includes('ethernet') || l.includes('l2')) return <Cpu size={20} />;
  if (l.includes('ip') || l.includes('l3') || l.includes('overlay') || l.includes('router')) return <BarChart3 size={20} />;
  if (l.includes('mobile')) return <Radio size={20} />;
  return <Info size={20} />;
};
