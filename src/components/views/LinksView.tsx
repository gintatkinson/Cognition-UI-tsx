
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MoreHorizontal, 
  Share2, 
  Maximize2, 
  Minimize2, 
  Network, 
  GripHorizontal,
  Search,
  ChevronDown,
  ChevronRight,
  Activity,
  Layers,
  Cpu,
  ExternalLink,
  GitCommit,
  Database,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { NetworkService } from '../../services/networkService';
import { cn } from '@/lib/utils';
import { TopologyGraph } from '../topology/TopologyGraph';
import { MOCK_SERVICES } from '@/lib/mock-data';

import { NetworkLayer } from '../../types';

interface LinksViewProps {
  onNavigate: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
  selectedTypes?: string[];
}

export function LinksView({ onNavigate, selectedTypes = ['L3_IP_MPLS', 'L2_ETHERNET', 'L0_OPTICAL'] }: LinksViewProps) {
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);
  const [expandedLinkIds, setExpandedLinkIds] = useState<string[]>([]);
  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);
  const [graphHeight, setGraphHeight] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [inspectHeight, setInspectHeight] = useState(180);
  const [isInspectResizing, setIsInspectResizing] = useState(false);

  const ietfTopology = NetworkService.getInstance().getTopology();

  // Helper mapping
  const layerMap: Record<string, string> = {
    'L3_IP_MPLS': NetworkLayer.L3_IP_MPLS,
    'L2_ETHERNET': NetworkLayer.L2_ETHERNET,
    'L0_OPTICAL': NetworkLayer.L0_OPTICAL
  };

  const filteredLinks = useMemo(() => {
    let links = ietfTopology.links.filter(link => {
      if (selectedTypes.length === 0) return true;
      const layerString = link.layer.toString();
      return selectedTypes.some(type => {
        const mapped = layerMap[type];
        return mapped ? layerString === mapped : layerString.includes(type);
      });
    });

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      links = links.filter(link => {
        const sourceNode = ietfTopology.nodes.find(n => n.uuid === link.sourceNodeUuid);
        const targetNode = ietfTopology.nodes.find(n => n.uuid === link.targetNodeUuid);
        const sourceName = sourceNode?.ietfSystem?.hostname || sourceNode?.name || '';
        const targetName = targetNode?.ietfSystem?.hostname || targetNode?.name || '';
        return (
          (link.uuid || '').toLowerCase().includes(q) ||
          (link.layer || '').toLowerCase().includes(q) ||
          (link.capacity || '').toLowerCase().includes(q) ||
          (link.sourceNodeUuid || '').toLowerCase().includes(q) ||
          (link.sourcePortUuid || '').toLowerCase().includes(q) ||
          (link.targetNodeUuid || '').toLowerCase().includes(q) ||
          (link.targetPortUuid || '').toLowerCase().includes(q) ||
          sourceName.toLowerCase().includes(q) ||
          targetName.toLowerCase().includes(q)
        );
      });
    }

    return links;
  }, [ietfTopology.links, ietfTopology.nodes, selectedTypes, searchQuery]);

  // Highlight first link inside list initially
  useEffect(() => {
    if (filteredLinks.length > 0 && !highlightedLinkId) {
      setHighlightedLinkId(filteredLinks[0].uuid);
    }
  }, [filteredLinks, highlightedLinkId]);

  const highlightedLink = useMemo(() => 
    filteredLinks.find(l => l.uuid === highlightedLinkId),
    [filteredLinks, highlightedLinkId]
  );

  const graphLinks = useMemo(() => 
    ietfTopology.links.filter(l => selectedLinkIds.includes(l.uuid)),
    [selectedLinkIds, ietfTopology.links]
  );

  const graphDevices = useMemo(() => {
    const deviceIds = new Set<string>();
    graphLinks.forEach(l => {
      deviceIds.add(l.sourceNodeUuid);
      deviceIds.add(l.targetNodeUuid);
    });
    return ietfTopology.nodes.filter(d => deviceIds.has(d.uuid));
  }, [graphLinks, ietfTopology.nodes]);

  const toggleExpand = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedLinkIds(prev => 
      prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
    );
  };

  const getLink = (id: string) => {
    const passiveCable = NetworkService.getInstance().getPassiveCables().find(c => c.id === id);
    if (passiveCable) {
      return {
        id: passiveCable.id,
        source: passiveCable.aEnd.deviceType === 'active-device' ? passiveCable.aEnd.neRef : passiveCable.aEnd.deviceId,
        source_endpoint: passiveCable.aEnd.deviceType === 'active-device' ? passiveCable.aEnd.componentRef : passiveCable.aEnd.deviceId,
        target: passiveCable.zEnd.deviceType === 'active-device' ? passiveCable.zEnd.neRef : passiveCable.zEnd.deviceId,
        target_endpoint: passiveCable.zEnd.deviceType === 'active-device' ? passiveCable.zEnd.componentRef : passiveCable.zEnd.deviceId,
        capacity: passiveCable.cableType === 'optical-fiber' ? `${passiveCable.opticalCable?.fiberCoreNum || 2} Cores (OS2 Single-Mode Fiber)` : 'Standard Cu Link',
        latency: passiveCable.opticalCable ? `${(passiveCable.length * 0.005).toFixed(2)} ms propagation` : 'N/A',
        usage: 0,
        _isPassiveCable: true,
        passiveCable: passiveCable
      } as any;
    }
    return undefined;
  };

  const getIETFLink = (id: string) => {
    const physLink = ietfTopology.links.find(l => l.uuid === id);
    if (physLink) {
      const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
      for (const net of rfcNetworks) {
        if (net.links) {
          const matchedLogical = net.links.find(lx => lx.linkId === id);
          if (matchedLogical) {
            return {
              ...physLink,
              _isRFC8345: true,
              _networkId: net.networkId,
              supportingLinks: matchedLogical.supportingLinks,
              otnLink: matchedLogical.otnLink,
              fgotnList: matchedLogical.fgotnList,
              fgtsRange: matchedLogical.fgtsRange,
              teMetrics: (matchedLogical as any).teMetrics || physLink.teMetrics,
              protection: (matchedLogical as any).protection || physLink.protection
            };
          }
        }
      }
      return { ...physLink, _isRFC8345: false };
    }

    const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
    for (const net of rfcNetworks) {
      if (net.links) {
        const logicalLink = net.links.find(lx => lx.linkId === id);
        if (logicalLink) {
          return {
            uuid: logicalLink.linkId,
            sourceNodeUuid: logicalLink.source.sourceNode,
            sourcePortUuid: logicalLink.source.sourceTp,
            targetNodeUuid: logicalLink.destination.destNode,
            targetPortUuid: logicalLink.destination.destTp,
            layer: net.networkTypes?.type || 'L3 IP Overlay',
            capacity: net.networkId.includes('L0') ? '800 Gbps' : '400 Gbps',
            usage: 55,
            supportingLinks: logicalLink.supportingLinks,
            otnLink: logicalLink.otnLink,
            fgotnList: logicalLink.fgotnList,
            fgtsRange: logicalLink.fgtsRange,
            teMetrics: (logicalLink as any).teMetrics,
            protection: (logicalLink as any).protection,
            _isRFC8345: true,
            _networkId: net.networkId
          };
        }
      }
    }
    return undefined;
  };

  const toggleLinkSelection = (id: string) => {
    setSelectedLinkIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedLinkIds.length === filteredLinks.length) {
      setSelectedLinkIds([]);
    } else {
      setSelectedLinkIds(filteredLinks.map(l => l.uuid));
    }
  };

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      setGraphHeight(prevHeight => {
        const newHeight = prevHeight + e.movementY;
        return Math.max(150, Math.min(800, newHeight));
      });
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const startInspectResizing = useCallback((e: React.MouseEvent) => {
    setIsInspectResizing(true);
    e.preventDefault();
  }, []);

  const stopInspectResizing = useCallback(() => {
    setIsInspectResizing(false);
  }, []);

  const resizeInspect = useCallback((e: MouseEvent) => {
    if (isInspectResizing) {
      setInspectHeight(prevHeight => {
        const newHeight = prevHeight - e.movementY;
        return Math.max(120, Math.min(500, newHeight));
      });
    }
  }, [isInspectResizing]);

  useEffect(() => {
    if (isInspectResizing) {
      window.addEventListener('mousemove', resizeInspect);
      window.addEventListener('mouseup', stopInspectResizing);
    } else {
      window.removeEventListener('mousemove', resizeInspect);
      window.removeEventListener('mouseup', stopInspectResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resizeInspect);
      window.removeEventListener('mouseup', stopInspectResizing);
    };
  }, [isInspectResizing, resizeInspect, stopInspectResizing]);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">IETF Network Links</h2>
          <p className="text-muted-foreground text-sm">Physical and logical connections (ietf-network-topology)</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search links..." 
            className="bg-zinc-950/45 border border-border rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-blue-500 transition-all w-60 text-white placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Contextual Topology View */}
      <div 
        className={cn(
          "relative transition-[width,left,top,right,bottom] duration-500 ease-in-out group shrink-0",
          isGraphMaximized ? "fixed inset-8 z-50 bg-background" : "w-full"
        )}
        style={!isGraphMaximized ? { height: `${graphHeight}px` } : {}}
      >
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-muted/80 backdrop-blur border border-border px-3 py-1.5 rounded-full">
          <Network className="w-3 h-3 text-blue-500" />
          <span className="text-[10px] font-mono font-bold text-foreground/80 uppercase tracking-widest">
            Link Topology ({selectedLinkIds.length} links)
          </span>
        </div>
        
        <Button 
          size="icon" 
          variant="secondary" 
          onClick={() => setIsGraphMaximized(!isGraphMaximized)}
          className="absolute top-4 right-4 z-10 bg-muted/80 border border-border text-muted-foreground hover:text-foreground/90"
        >
          {isGraphMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>

        <div className="w-full h-full rounded-xl border border-border overflow-hidden bg-background/50">
          {selectedLinkIds.length > 0 ? (
            <TopologyGraph 
              devices={graphDevices.map(d => ({ id: d.uuid, name: d.name, type: d.layer, status: 'OPERATIONAL' as const, endpoints: d.ietfInterfaces?.map(i => i.name) || [], location: { latitude: d.ietfGeoLocation?.location?.ellipsoid?.latitude || 0, longitude: d.ietfGeoLocation?.location?.ellipsoid?.longitude || 0 }, component_count: d.hardware.length, drivers: [] }))} 
              links={graphLinks.map(l => ({ id: l.uuid, source: l.sourceNodeUuid, target: l.targetNodeUuid, capacity: l.capacity, type: 'OPTICAL' as const, latency: '1ms', source_endpoint: l.sourcePortUuid, target_endpoint: l.targetPortUuid }))} 
              onNavigate={onNavigate} 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/80 space-y-2">
              <Network className="w-8 h-8 opacity-20" />
              <p className="text-xs font-mono uppercase tracking-tighter">Select links below to build topology</p>
            </div>
          )}
        </div>

        {!isGraphMaximized && (
          <div 
            onMouseDown={startResizing}
            className={cn(
              "absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-6 flex items-center justify-center cursor-ns-resize z-20 transition-opacity",
              isResizing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            <div className="bg-muted border border-zinc-700 rounded-full px-2 py-0.5 shadow-xl hover:bg-zinc-700 transition-colors">
              <GripHorizontal className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-background border border-border rounded-lg flex-1 min-h-[120px] overflow-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10 border-b border-border">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedLinkIds.length === filteredLinks.length && filteredLinks.length > 0}
                  onCheckedChange={toggleAllSelection}
                  className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-3.5 w-3.5"
                />
              </TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Link UUID</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Layer Type</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Source Node/Port</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Target Node/Port</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Capacity</TableHead>
              <TableHead className="text-right text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Drill-down</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLinks.map((link) => {
              const isExpanded = expandedLinkIds.includes(link.uuid);
              const isHighlighted = highlightedLinkId === link.uuid;

              // Tracing layered stack
              const ietfLink = getIETFLink(link.uuid);
              const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];

              const traceUnderlayLinks = (currentLink: any): any[] => {
                const items: any[] = [];
                if (currentLink?.supportingLinks) {
                  currentLink.supportingLinks.forEach((sl: any) => {
                    let foundLink: any = undefined;
                    for (const net of rfcNetworks) {
                      foundLink = net.links?.find(l => l.linkId === sl.linkRef);
                      if (foundLink) {
                        items.push({
                          linkId: foundLink.linkId,
                          networkId: net.networkId,
                          layer: net.networkTypes?.type || 'logical',
                          sourceNode: foundLink.source.sourceNode,
                          sourceTp: foundLink.source.sourceTp,
                          destNode: foundLink.destination.destNode,
                          destTp: foundLink.destination.destTp,
                          supportingLinks: foundLink.supportingLinks
                        });
                        items.push(...traceUnderlayLinks(foundLink));
                        break;
                      }
                    }
                    if (!foundLink) {
                      const phys = ietfTopology.links.find(l => l.uuid === sl.linkRef);
                      if (phys) {
                        items.push({
                          linkId: phys.uuid,
                          networkId: 'physical-topology',
                          layer: 'physical',
                          sourceNode: phys.sourceNodeUuid,
                          sourceTp: phys.sourcePortUuid,
                          destNode: phys.targetNodeUuid,
                          destTp: phys.targetPortUuid
                        });
                      }
                    }
                  });
                }
                return items;
              };

              const traceOverlayLinks = (linkId: string): any[] => {
                const items: any[] = [];
                rfcNetworks.forEach(net => {
                  net.links?.forEach(l => {
                    const isSupported = l.supportingLinks?.some(sl => sl.linkRef === linkId);
                    if (isSupported) {
                      items.push({
                        linkId: l.linkId,
                        networkId: net.networkId,
                        layer: net.networkTypes?.type || 'logical',
                        sourceNode: l.source.sourceNode,
                        sourceTp: l.source.sourceTp,
                        destNode: l.destination.destNode,
                        destTp: l.destination.destTp,
                        supportingLinks: l.supportingLinks
                      });
                      items.push(...traceOverlayLinks(l.linkId));
                    }
                  });
                });
                return items;
              };

              const underlays = ietfLink ? traceUnderlayLinks(ietfLink) : [];
              const overlays = ietfLink ? traceOverlayLinks(ietfLink.uuid) : [];

              const allLinks = [
                ...underlays.map(u => ({ ...u, isCurrent: false })),
                ...(ietfLink ? [{ 
                  linkId: ietfLink.uuid, 
                  networkId: ietfLink._networkId || 'underlay-L0', 
                  layer: ietfLink.layer || 'L0-optical',
                  sourceNode: ietfLink.sourceNodeUuid,
                  sourceTp: ietfLink.sourcePortUuid,
                  destNode: ietfLink.targetNodeUuid,
                  destTp: ietfLink.targetPortUuid,
                  isCurrent: true
                }] : []),
                ...overlays.map(o => ({ ...o, isCurrent: false }))
              ];

              const layerOrder: Record<string, number> = {
                'physical': 0,
                'L0-optical': 1,
                'L0 Optical': 1,
                'L1-transport': 2,
                'L1 Transport': 2,
                'L2-ethernet': 3,
                'L3-ip-overlay': 4,
                'L3 IP Overlay': 4
              };

              const sortedLinks = [...allLinks].sort((a, b) => {
                const orderA = layerOrder[a.layer] ?? 5;
                const orderB = layerOrder[b.layer] ?? 5;
                return orderA - orderB;
              });

              const uniqueLinks: any[] = [];
              const seenLinks = new Set<string>();
              sortedLinks.forEach(ul => {
                if (!seenLinks.has(ul.linkId)) {
                  seenLinks.add(ul.linkId);
                  uniqueLinks.push(ul);
                }
              });

              const matchedCable = NetworkService.getInstance().getPassiveCables().find(c => 
                c.id === link.uuid || 
                c.name === link.uuid ||
                (c.aEnd.neRef === link.sourceNodeUuid && c.zEnd.neRef === link.targetNodeUuid) ||
                (c.aEnd.neRef === link.targetNodeUuid && c.zEnd.neRef === link.sourceNodeUuid)
              );

              const connectedNodes = new Set<string>();
              connectedNodes.add(link.sourceNodeUuid);
              connectedNodes.add(link.targetNodeUuid);
              uniqueLinks.forEach(ul => {
                connectedNodes.add(ul.sourceNode);
                connectedNodes.add(ul.destNode);
              });

              const supportedServices = MOCK_SERVICES.filter(svc => 
                svc.endpoints.some(ep => {
                  const epNode = ep.split('/')[0];
                  return connectedNodes.has(epNode);
                })
              );

              const getLogicalPortsForEndpoint = (nodeUuid: string, portUuid: string) => {
                const logicalPorts: { networkId: string; tpId: string; nodeId: string }[] = [];
                rfcNetworks.forEach(net => {
                  net.nodes.forEach(rn => {
                    if (rn.activeNeRef === nodeUuid) {
                      rn.terminationPoints?.forEach(tp => {
                        if (tp.activePortRef === portUuid) {
                          logicalPorts.push({ networkId: net.networkId, tpId: tp.tpId, nodeId: rn.nodeId });
                        }
                      });
                    }
                  });
                });
                return logicalPorts;
              };

              const aEndLogicals = getLogicalPortsForEndpoint(link.sourceNodeUuid, link.sourcePortUuid);
              const zEndLogicals = getLogicalPortsForEndpoint(link.targetNodeUuid, link.targetPortUuid);

              return (
                <React.Fragment key={link.uuid}>
                  <TableRow 
                    className={cn(
                      "border-border hover:bg-muted/20 transition-colors group cursor-pointer",
                      isHighlighted && "bg-blue-950/20 shadow-inner border-l-2 border-l-blue-500/80"
                    )}
                    onClick={() => setHighlightedLinkId(link.uuid)}
                    onDoubleClick={() => onNavigate(link.uuid, 'link')}
                    data-nav-id={link.uuid}
                    data-nav-type="link"
                    title="Single-click to select attributes | Double-click to inspect detailed model"
                  >
                    <TableCell onClick={(e) => toggleExpand(link.uuid, e)} className="w-10 py-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-zinc-805 hover:bg-zinc-800">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell onClick={(e) => { e.stopPropagation(); toggleLinkSelection(link.uuid); }}>
                      <Checkbox 
                        checked={selectedLinkIds.includes(link.uuid)}
                        onCheckedChange={() => toggleLinkSelection(link.uuid)}
                        className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-3.5 w-3.5"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <span 
                        className="hover:underline hover:text-blue-400 cursor-pointer" 
                        onClick={(e) => { e.stopPropagation(); onNavigate(link.uuid, 'link'); }}
                      >
                        {link.uuid}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="text-[9px] px-1.5 py-0 border-blue-500/20 text-blue-500 bg-blue-500/10 font-mono"
                      >
                        {link.layer}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground/90">
                      <div className="flex flex-col">
                        <span 
                          className="font-medium text-xs font-mono hover:underline hover:text-blue-400 cursor-pointer" 
                          onClick={(e) => { e.stopPropagation(); onNavigate(link.sourceNodeUuid, 'device'); }}
                          data-nav-id={link.sourceNodeUuid}
                          data-nav-type="device"
                        >
                          {ietfTopology.nodes.find(n => n.uuid === link.sourceNodeUuid)?.name || link.sourceNodeUuid}
                        </span>
                        <span 
                          className="text-[9.5px] text-muted-foreground font-mono hover:underline hover:text-blue-400 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); onNavigate(`${link.sourceNodeUuid}/${link.sourcePortUuid}`, 'port'); }}
                          data-nav-id={`${link.sourceNodeUuid}/${link.sourcePortUuid}`}
                          data-nav-type="port"
                        >
                          {link.sourcePortUuid}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground/90">
                      <div className="flex flex-col">
                        <span 
                          className="font-medium text-xs font-mono hover:underline hover:text-blue-400 cursor-pointer" 
                          onClick={(e) => { e.stopPropagation(); onNavigate(link.targetNodeUuid, 'device'); }}
                          data-nav-id={link.targetNodeUuid}
                          data-nav-type="device"
                        >
                          {ietfTopology.nodes.find(n => n.uuid === link.targetNodeUuid)?.name || link.targetNodeUuid}
                        </span>
                        <span 
                          className="text-[9.5px] text-muted-foreground font-mono hover:underline hover:text-blue-400 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); onNavigate(`${link.targetNodeUuid}/${link.targetPortUuid}`, 'port'); }}
                          data-nav-id={`${link.targetNodeUuid}/${link.targetPortUuid}`}
                          data-nav-type="port"
                        >
                          {link.targetPortUuid}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-muted text-muted-foreground border-border text-[9.5px] font-mono">
                        {link.capacity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-6 text-[10px] py-0 px-2 font-mono bg-zinc-900 border border-border text-zinc-300 hover:text-white"
                        onClick={(e) => { e.stopPropagation(); onNavigate(link.uuid, 'link'); }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-zinc-900/40 border-b border-border/40 hover:bg-zinc-900/40" onClick={(e) => e.stopPropagation()}>
                       <TableCell colSpan={8} className="p-0">
                        <div className="pl-12 pr-6 py-4 space-y-4 border-l-2 border-purple-500/40 font-mono text-xs text-muted-foreground">
                          <div className="flex flex-col space-y-6">
                            
                            {/* 1. Multilayer Link Stack */}
                            <div>
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                                <Layers className="w-3.5 h-3.5 text-purple-400" />
                                <span>Layered Transport Link Stack</span>
                              </div>
                              <div className="relative border-l border-zinc-700 pl-4 ml-2 space-y-3">
                                {matchedCable && (
                                  <div className="relative p-2 bg-zinc-950/45 rounded border border-emerald-500/20 hover:border-emerald-500/35 transition-colors">
                                    <span className="absolute -left-[21px] top-2.5 w-2.5 h-2.5 rounded-full border border-emerald-500 bg-background flex items-center justify-center">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                    </span>
                                    <div className="flex items-center justify-between">
                                      <span 
                                        className="text-emerald-400 font-bold hover:underline cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); onNavigate(matchedCable.id, 'link'); }}
                                      >
                                        Cable: {matchedCable.id}
                                      </span>
                                      <Badge variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 h-4">
                                        Physical Fiber
                                      </Badge>
                                    </div>
                                    <p className="text-[9px] text-zinc-500 mt-0.5">Length: {matchedCable.length}m | {matchedCable.opticalCable?.fiberCoreNum || 2} Cores</p>
                                  </div>
                                )}
                                {uniqueLinks.map((ul) => (
                                  <div 
                                    key={ul.linkId} 
                                    className={cn(
                                      "relative p-2 rounded border transition-colors",
                                      ul.isCurrent 
                                        ? "bg-purple-500/5 border-purple-500/35 hover:border-purple-500/50" 
                                        : "bg-zinc-950/45 border-border/50 hover:border-indigo-500/20"
                                    )}
                                  >
                                    <span className={cn(
                                      "absolute -left-[21px] top-2.5 w-2.5 h-2.5 rounded-full border bg-background flex items-center justify-center",
                                      ul.isCurrent ? "border-purple-500" : "border-indigo-400"
                                    )}>
                                      <span className={cn("w-1 h-1 rounded-full", ul.isCurrent ? "bg-purple-500" : "bg-indigo-400")} />
                                    </span>
                                    <div className="flex items-center justify-between">
                                      <span 
                                        className={cn(
                                          "font-bold hover:underline cursor-pointer",
                                          ul.isCurrent ? "text-purple-400 font-extrabold" : "text-indigo-400"
                                        )}
                                        onClick={(e) => { e.stopPropagation(); onNavigate(ul.linkId, 'link'); }}
                                      >
                                        Link: {ul.linkId}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {ul.isCurrent && (
                                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[8px] h-4">
                                            Active
                                          </Badge>
                                        )}
                                        <Badge variant="outline" className="text-[8px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20 h-4">
                                          {ul.layer}
                                        </Badge>
                                      </div>
                                    </div>
                                    <p className="text-[9px] text-zinc-500 mt-0.5">Domain: {ul.networkId}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 2. Endpoints & Logical Overlays */}
                            <div>
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                                <Share2 className="w-3.5 h-3.5 text-blue-500" />
                                <span>Endpoints & Logical Overlays</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* A-End */}
                                <div className="p-3 bg-zinc-950/45 border border-border/50 rounded-lg hover:border-purple-500/25 transition-colors">
                                  <div className="flex justify-between items-start border-b border-border/40 pb-1.5 mb-2">
                                    <span className="text-[9px] uppercase tracking-widest text-[#10b981] font-bold">A-End Connection</span>
                                    <Badge variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 h-4">
                                      Source
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 font-mono text-[10.5px]">
                                    <p>
                                      <span className="text-zinc-500">Node:</span>{' '}
                                      <span 
                                        className="text-zinc-300 font-bold hover:underline cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); onNavigate(link.sourceNodeUuid, 'device'); }}
                                      >
                                        {ietfTopology.nodes.find(n => n.uuid === link.sourceNodeUuid)?.name || link.sourceNodeUuid}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="text-zinc-500">Port:</span>{' '}
                                      <span 
                                        className="text-[#60a5fa] font-bold hover:underline cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); onNavigate(`${link.sourceNodeUuid}/${link.sourcePortUuid}`, 'port'); }}
                                      >
                                        {link.sourcePortUuid}
                                      </span>
                                    </p>
                                  </div>
                                  {aEndLogicals.length > 0 && (
                                    <div className="mt-2.5 pt-2 border-t border-border/30 space-y-1">
                                      <p className="text-[8.5px] uppercase tracking-wider text-zinc-500 font-semibold">Logicals Contained:</p>
                                      {aEndLogicals.map(lp => (
                                        <div key={lp.tpId} className="flex items-center justify-between text-[9.5px] font-mono text-indigo-400">
                                          <span 
                                            className="hover:underline cursor-pointer font-bold truncate pr-1"
                                            onClick={(e) => { e.stopPropagation(); onNavigate(`${lp.nodeId}/${lp.tpId}`, 'port'); }}
                                          >
                                            {lp.tpId}
                                          </span>
                                          <span className="text-[8px] text-zinc-500 shrink-0">({lp.networkId})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Z-End */}
                                <div className="p-3 bg-zinc-950/45 border border-border/50 rounded-lg hover:border-purple-500/25 transition-colors">
                                  <div className="flex justify-between items-start border-b border-border/40 pb-1.5 mb-2">
                                    <span className="text-[9px] uppercase tracking-widest text-[#6366f1] font-bold">Z-End Connection</span>
                                    <Badge variant="outline" className="text-[8px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20 h-4">
                                      Target
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 font-mono text-[10.5px]">
                                    <p>
                                      <span className="text-zinc-550">Node:</span>{' '}
                                      <span 
                                        className="text-zinc-300 font-bold hover:underline cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); onNavigate(link.targetNodeUuid, 'device'); }}
                                      >
                                        {ietfTopology.nodes.find(n => n.uuid === link.targetNodeUuid)?.name || link.targetNodeUuid}
                                      </span>
                                    </p>
                                    <p>
                                      <span className="text-zinc-555">Port:</span>{' '}
                                      <span 
                                        className="text-[#60a5fa] font-bold hover:underline cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); onNavigate(`${link.targetNodeUuid}/${link.targetPortUuid}`, 'port'); }}
                                      >
                                        {link.targetPortUuid}
                                      </span>
                                    </p>
                                  </div>
                                  {zEndLogicals.length > 0 && (
                                    <div className="mt-2.5 pt-2 border-t border-border/30 space-y-1">
                                      <p className="text-[8.5px] uppercase tracking-wider text-zinc-500 font-semibold">Logicals Contained:</p>
                                      {zEndLogicals.map(lp => (
                                        <div key={lp.tpId} className="flex items-center justify-between text-[9.5px] font-mono text-indigo-400">
                                          <span 
                                            className="hover:underline cursor-pointer font-bold truncate pr-1"
                                            onClick={(e) => { e.stopPropagation(); onNavigate(`${lp.nodeId}/${lp.tpId}`, 'port'); }}
                                          >
                                            {lp.tpId}
                                          </span>
                                          <span className="text-[8px] text-zinc-500 shrink-0">({lp.networkId})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 3. Supported Customer Services */}
                            <div>
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-355 uppercase tracking-wider mb-3">
                                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Supported VPN Services ({supportedServices.length})</span>
                              </div>
                              {supportedServices.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
                                  {supportedServices.map(svc => (
                                    <div 
                                      key={svc.id} 
                                      className="flex items-center justify-between p-2.5 bg-zinc-950/45 border border-border/50 rounded hover:border-emerald-500/25 transition-colors cursor-pointer group"
                                      onClick={(e) => { e.stopPropagation(); onNavigate(svc.id, 'service'); }}
                                    >
                                      <div>
                                        <p className="text-zinc-200 font-bold text-xs group-hover:text-blue-400 hover:underline">{svc.name}</p>
                                        <p className="text-[8.5px] text-zinc-500 font-mono mt-0.5">ID: {svc.id} | TYPE: {svc.type}</p>
                                      </div>
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] h-4 shrink-0">
                                        {svc.status}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[9.5px] text-zinc-500 italic py-2">No active customer service overlays mapped.</p>
                              )}
                            </div>

                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Split Attribute Inspect Panel */}
      <div 
        style={{ height: `${inspectHeight}px` }}
        className="relative border border-border rounded-lg bg-zinc-950/40 shrink-0 overflow-y-auto group/inspect flex flex-col font-sans"
      >
        {/* Resize Handle */}
        <div 
          onMouseDown={startInspectResizing}
          className={cn(
            "absolute top-0.5 left-1/2 -translate-x-1/2 w-12 h-3 flex items-center justify-center cursor-ns-resize z-20 transition-opacity",
            isInspectResizing ? "opacity-100" : "opacity-0 group-hover/inspect:opacity-100"
          )}
        >
          <div className="bg-muted border border-zinc-700 rounded-full px-1.5 py-0.5 shadow-md hover:bg-zinc-700 transition-colors">
            <GripHorizontal className="w-3.5 h-3.5 text-muted-foreground/80" />
          </div>
        </div>

        {highlightedLink ? (
          <div className="p-4 space-y-3 flex-1 overflow-y-auto min-h-0">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <h4 className="text-xs font-bold font-mono text-zinc-200">
                  Quick-Inspect Panel: Link {highlightedLink.uuid}
                </h4>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Double-click row to view full telemetry
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-normal text-muted-foreground/90 font-mono">
              {/* Column 1: Capacity */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">
                  <Network className="w-3.5 h-3.5 text-blue-500" />
                  <span>Topology Information</span>
                </div>
                <div className="space-y-1">
                  <p><strong className="text-zinc-400">Layer Range:</strong> {highlightedLink.layer}</p>
                  <p><strong className="text-zinc-400">Max Capacity:</strong> {highlightedLink.capacity}</p>
                  <p><strong className="text-zinc-400">Compliance:</strong> IETF RFC 8345</p>
                </div>
              </div>

              {/* Column 2: Source Node */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span>Source Adjacency</span>
                </div>
                <div className="space-y-1">
                  <p>
                    <strong className="text-zinc-400">Node:</strong>{' '}
                    <span 
                      className="cursor-pointer hover:underline text-indigo-400 font-bold"
                      onClick={() => onNavigate(highlightedLink.sourceNodeUuid, 'device')}
                      data-nav-id={highlightedLink.sourceNodeUuid}
                      data-nav-type="device"
                    >
                      {ietfTopology.nodes.find(n => n.uuid === highlightedLink.sourceNodeUuid)?.name || highlightedLink.sourceNodeUuid}
                    </span>
                  </p>
                  <p>
                    <strong className="text-zinc-400">TP Port:</strong>{' '}
                    <span 
                      className="cursor-pointer hover:underline text-blue-400 font-semibold"
                      onClick={() => onNavigate(`${highlightedLink.sourceNodeUuid}/${highlightedLink.sourcePortUuid}`, 'port')}
                      data-nav-id={`${highlightedLink.sourceNodeUuid}/${highlightedLink.sourcePortUuid}`}
                      data-nav-type="port"
                    >
                      {highlightedLink.sourcePortUuid}
                    </span>
                  </p>
                </div>
              </div>

              {/* Column 3: Target Node */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <span>Target Adjacency</span>
                </div>
                <div className="space-y-1">
                  <p>
                    <strong className="text-zinc-400">Node:</strong>{' '}
                    <span 
                      className="cursor-pointer hover:underline text-indigo-400 font-bold"
                      onClick={() => onNavigate(highlightedLink.targetNodeUuid, 'device')}
                      data-nav-id={highlightedLink.targetNodeUuid}
                      data-nav-type="device"
                    >
                      {ietfTopology.nodes.find(n => n.uuid === highlightedLink.targetNodeUuid)?.name || highlightedLink.targetNodeUuid}
                    </span>
                  </p>
                  <p>
                    <strong className="text-zinc-400">TP Port:</strong>{' '}
                    <span 
                      className="cursor-pointer hover:underline text-blue-400 font-semibold"
                      onClick={() => onNavigate(`${highlightedLink.targetNodeUuid}/${highlightedLink.targetPortUuid}`, 'port')}
                      data-nav-id={`${highlightedLink.targetNodeUuid}/${highlightedLink.targetPortUuid}`}
                      data-nav-type="port"
                    >
                      {highlightedLink.targetPortUuid}
                    </span>
                  </p>
                </div>
              </div>

              {/* Column 4: SLA */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  <span>Operational State</span>
                </div>
                <div className="space-y-1">
                  <p><strong className="text-zinc-400">SLA Latency:</strong> 0.24 ms</p>
                  <p><strong className="text-zinc-400">Admin Status:</strong> <span className="text-emerald-400">UP</span></p>
                  <p><strong className="text-zinc-400">Oper Status:</strong> <span className="text-emerald-400">UP</span></p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground/70 text-xs text-mono bg-zinc-950/20">
            Click a link row above to dynamically load object attributes
          </div>
        )}
      </div>
    </div>
  );
}
