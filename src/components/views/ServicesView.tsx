
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
  Plus, 
  Activity, 
  Maximize2, 
  Minimize2, 
  Network, 
  GripHorizontal,
  Shield
} from 'lucide-react';
import { MOCK_SERVICES } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { NetworkService } from '../../services/networkService';
import { TopologyGraph } from '../topology/TopologyGraph';
import { QKDProvisioningView } from './QKDProvisioningView';

interface ServicesViewProps {
  onNavigate: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
  selectedTypes?: string[];
}

export function ServicesView({ onNavigate, selectedTypes = ['L3VPN', 'L2VPN', 'QKD'] }: ServicesViewProps) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [highlightedServiceId, setHighlightedServiceId] = useState<string | null>(null);
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);
  const [graphHeight, setGraphHeight] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [inspectHeight, setInspectHeight] = useState(180);
  const [isInspectResizing, setIsInspectResizing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'provision-qkd'>('list');

  const networkTopology = NetworkService.getInstance().getTopology();

  const filteredServices = useMemo(() => 
    MOCK_SERVICES.filter(service => 
      selectedTypes.length === 0 || selectedTypes.includes(service.type) ||
      selectedTypes.some(t => service.type.includes(t) || t.includes(service.type))
    ),
    [selectedTypes]
  );

  useEffect(() => {
    if (filteredServices.length > 0 && !highlightedServiceId) {
      setHighlightedServiceId(filteredServices[0].id);
    }
  }, [filteredServices, highlightedServiceId]);

  const highlightedService = useMemo(() => 
    filteredServices.find(s => s.id === highlightedServiceId),
    [filteredServices, highlightedServiceId]
  );

  const graphLinks = useMemo(() => {
    const selectedServices = MOCK_SERVICES.filter(s => selectedServiceIds.includes(s.id));
    const endpointPairs = selectedServices.map(s => s.endpoints);
    
    // Find links that connect these endpoints
    return networkTopology.links.filter(link => 
      endpointPairs.some((pair: string[]) => {
        const linkSourceFull = `${link.sourceNodeUuid}/${link.sourcePortUuid}`;
        const linkTargetFull = `${link.targetNodeUuid}/${link.targetPortUuid}`;
        
        return (pair.includes(linkSourceFull) && pair.includes(linkTargetFull)) ||
               (pair.some(p => p.startsWith(link.sourceNodeUuid)) && pair.some(p => p.startsWith(link.targetNodeUuid)));
      })
    );
  }, [selectedServiceIds, networkTopology.links]);

  const graphDevices = useMemo(() => {
    const deviceIds = new Set<string>();
    graphLinks.forEach(l => {
      deviceIds.add(l.sourceNodeUuid);
      deviceIds.add(l.targetNodeUuid);
    });
    
    // Also add devices that are directly mentioned in service endpoints if not already there
    const selectedServices = MOCK_SERVICES.filter(s => selectedServiceIds.includes(s.id));
    selectedServices.forEach(s => {
      s.endpoints.forEach((ep: string) => {
        const deviceId = ep.split('/')[0];
        if (networkTopology.nodes.some(d => d.uuid === deviceId)) {
          deviceIds.add(deviceId);
        }
      });
    });

    return networkTopology.nodes.filter(d => deviceIds.has(d.uuid));
  }, [graphLinks, selectedServiceIds, networkTopology.nodes]);

  const toggleServiceSelection = (id: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedServiceIds.length === filteredServices.length) {
      setSelectedServiceIds([]);
    } else {
      setSelectedServiceIds(filteredServices.map(s => s.id));
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

  if (viewMode === 'provision-qkd') {
    return (
      <QKDProvisioningView 
        onBack={() => setViewMode('list')}
        onComplete={(id) => {
          setViewMode('list');
          onNavigate(id, 'service');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Services</h2>
          <p className="text-muted-foreground text-sm">Provision and monitor connectivity services</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setViewMode('provision-qkd')}
            className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
          >
            <Shield className="w-4 h-4 mr-2" />
            Provision QKD App
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Service
          </Button>
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
            Service Topology ({selectedServiceIds.length} services)
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
          {selectedServiceIds.length > 0 ? (
            <TopologyGraph 
              devices={graphDevices.map(d => ({ id: d.uuid, name: d.name, type: d.layer, status: 'OPERATIONAL' as const, endpoints: d.ietfInterfaces?.map(i => i.name) || [], location: { latitude: d.ietfGeoLocation?.location?.ellipsoid?.latitude || 0, longitude: d.ietfGeoLocation?.location?.ellipsoid?.longitude || 0 }, component_count: d.hardware.length, drivers: [] }))} 
              links={graphLinks.map(l => ({ id: l.uuid, source: l.sourceNodeUuid, target: l.targetNodeUuid, capacity: l.capacity, type: 'OPTICAL' as const, latency: '1ms', source_endpoint: l.sourcePortUuid, target_endpoint: l.targetPortUuid }))} 
              onNavigate={onNavigate} 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/80 space-y-2">
              <Network className="w-8 h-8 opacity-20" />
              <p className="text-xs font-mono uppercase tracking-tighter">Select services below to build topology</p>
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
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedServiceIds.length === filteredServices.length && filteredServices.length > 0}
                  onCheckedChange={toggleAllSelection}
                  className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-3.5 w-3.5"
                />
              </TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">ID</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Name</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Endpoints</TableHead>
              <TableHead className="text-right text-muted-foreground font-mono text-[10px] uppercase tracking-wider font-semibold">Drill-down</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map((service) => {
              const isHighlighted = highlightedServiceId === service.id;
              return (
                <TableRow 
                  key={service.id} 
                  className={cn(
                    "border-border hover:bg-muted/20 transition-colors group cursor-pointer",
                    isHighlighted && "bg-blue-950/20 shadow-inner border-l-2 border-l-blue-500/80"
                  )}
                  onClick={() => setHighlightedServiceId(service.id)}
                  onDoubleClick={() => onNavigate(service.id, 'service')}
                  data-nav-id={service.id}
                  data-nav-type="service"
                  title="Single-click to select attributes | Double-click to inspect detailed model"
                >
                  <TableCell onClick={(e) => { e.stopPropagation(); toggleServiceSelection(service.id); }}>
                    <Checkbox 
                      checked={selectedServiceIds.includes(service.id)}
                      onCheckedChange={() => toggleServiceSelection(service.id)}
                      className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-3.5 w-3.5"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <span 
                      className="hover:underline hover:text-blue-400 cursor-pointer text-xs" 
                      onClick={(e) => { e.stopPropagation(); onNavigate(service.id, 'service'); }}
                    >
                      {service.id}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-foreground/90">
                    <div className="flex items-center gap-2">
                      <Activity className={cn("w-3 h-3 text-blue-500")} />
                      <span 
                        className="hover:underline hover:text-blue-400 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onNavigate(service.id, 'service'); }}
                      >
                        {service.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase border-zinc-700 bg-muted/50 font-mono">
                      {service.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9.5px]",
                        service.status === 'ACTIVE' 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : service.status === 'PENDING'
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      )}
                    >
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    <div className="flex flex-col gap-0.5">
                      {service.endpoints.map(ep => {
                        const deviceId = ep.split('/')[0];
                        return (
                          <span 
                            key={ep} 
                            className="font-mono text-[10px] hover:underline hover:text-indigo-400 cursor-pointer" 
                            onClick={(e) => { e.stopPropagation(); onNavigate(deviceId, 'device'); }}
                            data-nav-id={deviceId}
                            data-nav-type="device"
                          >
                            {ep}
                          </span>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-6 text-[10px] py-0 px-2 font-mono bg-zinc-900 border border-border text-zinc-300 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); onNavigate(service.id, 'service'); }}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
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

        {highlightedService ? (
          <div className="p-4 space-y-3 flex-1 overflow-y-auto min-h-0">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <h4 className="text-xs font-bold font-mono text-zinc-200">
                  Quick-Inspect Panel: Service {highlightedService.id} ({highlightedService.name})
                </h4>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Double-click row to view full operational schema
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-normal text-muted-foreground/90 font-mono">
              {/* Column 1: Capacity & Compliance */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <Network className="w-3.5 h-3.5 text-blue-500" />
                  <span>Service Parameters</span>
                </div>
                <div className="space-y-1">
                  <p><strong className="text-zinc-400">Class Type:</strong> {highlightedService.type}</p>
                  <p><strong className="text-zinc-400">Compliance:</strong> RFC 8299 L3SM / RFC 8466 L2SM</p>
                  <p><strong className="text-zinc-400">Service Status:</strong> {highlightedService.status}</p>
                </div>
              </div>

              {/* Column 2: Endpoint A */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span>Access End Point #1</span>
                </div>
                <div className="space-y-1">
                  {highlightedService.endpoints[0] ? (
                    <>
                      <p>
                        <strong className="text-zinc-400">Device ID:</strong>{' '}
                        <span 
                          className="cursor-pointer hover:underline text-indigo-400 font-bold"
                          onClick={() => onNavigate(highlightedService.endpoints[0].split('/')[0], 'device')}
                          data-nav-id={highlightedService.endpoints[0].split('/')[0]}
                          data-nav-type="device"
                        >
                          {highlightedService.endpoints[0].split('/')[0]}
                        </span>
                      </p>
                      <p>
                        <strong className="text-zinc-400">Port TP:</strong>{' '}
                        <span 
                          className="cursor-pointer hover:underline text-blue-400 font-semibold"
                          onClick={() => onNavigate(highlightedService.endpoints[0], 'port')}
                          data-nav-id={highlightedService.endpoints[0]}
                          data-nav-type="port"
                        >
                          {highlightedService.endpoints[0].split('/')[1] || 'TP-01'}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="italic text-zinc-500">Not configured</p>
                  )}
                </div>
              </div>

              {/* Column 3: Endpoint B */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  <span>Access End Point #2</span>
                </div>
                <div className="space-y-1">
                  {highlightedService.endpoints[1] ? (
                    <>
                      <p>
                        <strong className="text-zinc-400">Device ID:</strong>{' '}
                        <span 
                          className="cursor-pointer hover:underline text-indigo-400 font-bold"
                          onClick={() => onNavigate(highlightedService.endpoints[1].split('/')[0], 'device')}
                          data-nav-id={highlightedService.endpoints[1].split('/')[0]}
                          data-nav-type="device"
                        >
                          {highlightedService.endpoints[1].split('/')[0]}
                        </span>
                      </p>
                      <p>
                        <strong className="text-zinc-400">Port TP:</strong>{' '}
                        <span 
                          className="cursor-pointer hover:underline text-blue-400 font-semibold"
                          onClick={() => onNavigate(highlightedService.endpoints[1], 'port')}
                          data-nav-id={highlightedService.endpoints[1]}
                          data-nav-type="port"
                        >
                          {highlightedService.endpoints[1].split('/')[1] || 'TP-02'}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="italic text-zinc-500">Hub / Multicast Endpoint</p>
                  )}
                </div>
              </div>

              {/* Column 4: Key Rates / Crypto info for QKD or SLA Tunnel info */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  <span>Quantum & Cryptography State</span>
                </div>
                <div className="space-y-1">
                  {highlightedService.type === 'QKD' ? (
                    <>
                      <p><strong className="text-zinc-400">Secret Key Rate:</strong> 1.4 kbps</p>
                      <p><strong className="text-zinc-400">Quantum BER:</strong> <span className="text-emerald-400">2.1%</span></p>
                      <p><strong className="text-zinc-400 font-semibold">Cipher:</strong> AES-GCM-256</p>
                    </>
                  ) : (
                    <>
                      <p><strong className="text-zinc-400">MTU Cap:</strong> 9100 bytes (Jumbo)</p>
                      <p><strong className="text-zinc-400">Fast Reroute (FRR):</strong> <span className="text-emerald-400">Enabled</span></p>
                      <p><strong className="text-zinc-400">Class of Service:</strong> Premium (CoS-0)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground/70 text-xs text-mono bg-zinc-950/20">
            Click a service row above to dynamically load object attributes
          </div>
        )}
      </div>
    </div>
  );
}
