
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
  Layers, 
  Plus, 
  Maximize2, 
  Minimize2, 
  Network, 
  GripHorizontal 
} from 'lucide-react';
import { MOCK_SERVICES } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { NetworkService } from '../../services/networkService';
import { TopologyGraph } from '../topology/TopologyGraph';

interface SlicesViewProps {
  onNavigate: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
  selectedTypes?: string[];
}

export function SlicesView({ onNavigate, selectedTypes = ['eMBB', 'URLLC', 'mMTC', 'OTN'] }: SlicesViewProps) {
  const [selectedSliceIds, setSelectedSliceIds] = useState<string[]>([]);
  const [highlightedSliceId, setHighlightedSliceId] = useState<string | null>(null);
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);
  const [graphHeight, setGraphHeight] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [inspectHeight, setInspectHeight] = useState(180);
  const [isInspectResizing, setIsInspectResizing] = useState(false);

  const networkTopology = NetworkService.getInstance().getTopology();

  const filteredSlices = useMemo(() => 
    NetworkService.getInstance().getSlices().filter(slice => 
      selectedTypes.length === 0 || selectedTypes.includes(slice.type) ||
      selectedTypes.some(t => slice.type.includes(t) || t.includes(slice.type))
    ),
    [selectedTypes]
  );

  useEffect(() => {
    if (filteredSlices.length > 0 && !highlightedSliceId) {
      setHighlightedSliceId(filteredSlices[0].id);
    }
  }, [filteredSlices, highlightedSliceId]);

  const highlightedSlice = useMemo(() => 
    filteredSlices.find(s => s.id === highlightedSliceId),
    [filteredSlices, highlightedSliceId]
  );

  const graphLinks = useMemo(() => {
    const selectedSlices = NetworkService.getInstance().getSlices().filter(s => selectedSliceIds.includes(s.id));
    const serviceIds = new Set(selectedSlices.flatMap(s => s.service_ids));
    const selectedServices = MOCK_SERVICES.filter(s => serviceIds.has(s.id));
    const endpointPairs = selectedServices.map(s => s.endpoints);
    
    return networkTopology.links.filter(link => 
      endpointPairs.some((pair: string[]) => {
        const linkSourceFull = `${link.sourceNodeUuid}/${link.sourcePortUuid}`;
        const linkTargetFull = `${link.targetNodeUuid}/${link.targetPortUuid}`;
        
        return (pair.includes(linkSourceFull) && pair.includes(linkTargetFull)) ||
               (pair.some(p => p.startsWith(link.sourceNodeUuid)) && pair.some(p => p.startsWith(link.targetNodeUuid)));
      })
    );
  }, [selectedSliceIds, networkTopology.links]);

  const graphDevices = useMemo(() => {
    const deviceIds = new Set<string>();
    graphLinks.forEach(l => {
      deviceIds.add(l.sourceNodeUuid);
      deviceIds.add(l.targetNodeUuid);
    });
    
    const selectedSlices = NetworkService.getInstance().getSlices().filter(s => selectedSliceIds.includes(s.id));
    const serviceIds = new Set(selectedSlices.flatMap(s => s.service_ids));
    const selectedServices = MOCK_SERVICES.filter(s => serviceIds.has(s.id));
    
    selectedServices.forEach(s => {
      s.endpoints.forEach((ep: string) => {
        const deviceId = ep.split('/')[0];
        if (networkTopology.nodes.some(d => d.uuid === deviceId)) {
          deviceIds.add(deviceId);
        }
      });
    });

    return networkTopology.nodes.filter(d => deviceIds.has(d.uuid));
  }, [graphLinks, selectedSliceIds, networkTopology.nodes]);

  const toggleSliceSelection = (id: string) => {
    setSelectedSliceIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedSliceIds.length === filteredSlices.length) {
      setSelectedSliceIds([]);
    } else {
      setSelectedSliceIds(filteredSlices.map(s => s.id));
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
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Network Slices</h2>
          <p className="text-muted-foreground text-sm">Isolated network partitions for specific use cases</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Slice
        </Button>
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
            Slice Topology ({selectedSliceIds.length} slices)
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
          {selectedSliceIds.length > 0 ? (
            <TopologyGraph 
              devices={graphDevices.map(d => ({ id: d.uuid, name: d.name, type: d.layer, status: 'OPERATIONAL' as const, endpoints: d.ietfInterfaces?.map(i => i.name) || [], location: { latitude: d.ietfGeoLocation?.location?.ellipsoid?.latitude || 0, longitude: d.ietfGeoLocation?.location?.ellipsoid?.longitude || 0 }, component_count: d.hardware.length, drivers: [] }))} 
              links={graphLinks.map(l => ({ id: l.uuid, source: l.sourceNodeUuid, target: l.targetNodeUuid, capacity: l.capacity, type: 'OPTICAL' as const, latency: '1ms', source_endpoint: l.sourcePortUuid, target_endpoint: l.targetPortUuid }))} 
              onNavigate={onNavigate} 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/80 space-y-2">
              <Network className="w-8 h-8 opacity-20" />
              <p className="text-xs font-mono uppercase tracking-tighter">Select slices below to build topology</p>
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
                  checked={selectedSliceIds.length === filteredSlices.length && filteredSlices.length > 0}
                  onCheckedChange={toggleAllSelection}
                  className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-3.5 w-3.5"
                />
              </TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">ID</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Name</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Services</TableHead>
              <TableHead className="text-right text-muted-foreground font-mono text-[10px] uppercase tracking-wider font-semibold">Drill-down</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSlices.map((slice) => {
              const isHighlighted = highlightedSliceId === slice.id;
              return (
                <TableRow 
                  key={slice.id} 
                  className={cn(
                    "border-border hover:bg-muted/20 transition-colors group cursor-pointer",
                    isHighlighted && "bg-blue-950/20 shadow-inner border-l-2 border-l-blue-500/80"
                  )}
                  onClick={() => setHighlightedSliceId(slice.id)}
                  onDoubleClick={() => onNavigate(slice.id, 'slice')}
                  data-nav-id={slice.id}
                  data-nav-type="slice"
                  title="Single-click to select attributes | Double-click to inspect detailed model"
                >
                  <TableCell onClick={(e) => { e.stopPropagation(); toggleSliceSelection(slice.id); }}>
                    <Checkbox 
                      checked={selectedSliceIds.includes(slice.id)}
                      onCheckedChange={() => toggleSliceSelection(slice.id)}
                      className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-3.5 w-3.5"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <span 
                      className="hover:underline hover:text-blue-400 cursor-pointer" 
                      onClick={(e) => { e.stopPropagation(); onNavigate(slice.id, 'slice'); }}
                    >
                      {slice.id}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-foreground/90">
                    <div className="flex items-center gap-2">
                      <Layers className={cn("w-3 h-3 text-blue-500")} />
                      <span 
                        className="hover:underline hover:text-blue-400 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onNavigate(slice.id, 'slice'); }}
                      >
                        {slice.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase border-zinc-700 bg-muted/50 font-mono">
                      {slice.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9.5px]",
                        slice.status === 'ACTIVE' 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      )}
                    >
                      {slice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {slice.service_ids.map(svcId => (
                        <Badge 
                          key={svcId} 
                          variant="secondary" 
                          className="bg-muted text-muted-foreground border-border text-[9.5px] hover:bg-muted/85 hover:text-indigo-400 cursor-pointer font-bold font-mono" 
                          onClick={(e) => { e.stopPropagation(); onNavigate(svcId, 'service'); }}
                          data-nav-id={svcId}
                          data-nav-type="service"
                        >
                          {svcId}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="h-6 text-[10px] py-0 px-2 font-mono bg-zinc-900 border border-border text-zinc-300 hover:text-white"
                      onClick={(e) => { e.stopPropagation(); onNavigate(slice.id, 'slice'); }}
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

        {highlightedSlice ? (
          <div className="p-4 space-y-3 flex-1 overflow-y-auto min-h-0">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <h4 className="text-xs font-bold font-mono text-zinc-200">
                  Quick-Inspect Panel: Network Slice {highlightedSlice.id} ({highlightedSlice.name})
                </h4>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Double-click row to view full telemetry logs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-normal text-muted-foreground/90 font-mono">
              {/* Column 1: SLA Parameters */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <Network className="w-3.5 h-3.5 text-blue-500" />
                  <span>SLA Parameters</span>
                </div>
                <div className="space-y-1">
                  <p><strong className="text-zinc-400">Slice Profile:</strong> {highlightedSlice.type}</p>
                  <p><strong className="text-zinc-400 font-semibold">Priority level:</strong> {highlightedSlice.type === 'URLLC' ? 'Ultra high' : 'Standard'}</p>
                  <p><strong className="text-zinc-400">Standard:</strong> GSMA NG.116 compliant</p>
                </div>
              </div>

              {/* Column 2: Bound Services */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Bound Services ({highlightedSlice.service_ids.length})</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1 max-h-[55px] overflow-auto">
                  {highlightedSlice.service_ids.map(svcId => (
                    <span 
                      key={svcId} 
                      className="p-1 px-1.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] hover:text-blue-400 hover:underline cursor-pointer font-bold font-mono block"
                      onClick={() => onNavigate(svcId, 'service')}
                      data-nav-id={svcId}
                      data-nav-type="service"
                    >
                      {svcId}
                    </span>
                  ))}
                </div>
              </div>

              {/* Column 3: Isolation Security */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                  <span>Logical Isolation</span>
                </div>
                <div className="space-y-1">
                  <p><strong className="text-zinc-400">Isolation Layer:</strong> L2/L3 Logical VRF</p>
                  <p><strong className="text-zinc-400">Tunnel Method:</strong> SRv6 Path Segment</p>
                  <p><strong className="text-zinc-400">QoS Scheduler:</strong> Strict Priority SP</p>
                </div>
              </div>

              {/* Column 4: Performance Guarantees */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40 font-mono text-xs">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  <span>Performance SLA</span>
                </div>
                <div className="space-y-1">
                  <p><strong className="text-zinc-400">Guaranteed BW:</strong> {highlightedSlice.type === 'URLLC' ? '15 Gbps' : '5 Gbps'}</p>
                  <p><strong className="text-zinc-400">Latency Budget:</strong> {highlightedSlice.type === 'URLLC' ? '< 5 ms' : '< 12 ms'}</p>
                  <p><strong className="text-zinc-400">Target Availability:</strong> 99.999% uptime</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground/70 text-xs text-mono bg-zinc-950/20">
            Click a slice row above to dynamically load object attributes
          </div>
        )}
      </div>
    </div>
  );
}
