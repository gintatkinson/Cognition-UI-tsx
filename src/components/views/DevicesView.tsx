import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  ChevronDown,
  ChevronRight,
  Router, 
  Maximize2, 
  Minimize2,
  Network,
  GripHorizontal,
  Cpu,
  Radio,
  FileCode,
  MapPin,
  Clock,
  Layers,
  Activity,
  Search
} from 'lucide-react';
import { NetworkService } from '../../services/networkService';
import { TopologyGraph } from '../topology/TopologyGraph';
import { cn } from '@/lib/utils';

interface DevicesViewProps {
  onNavigate: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
  selectedTypes?: string[];
}

export function DevicesView({ onNavigate, selectedTypes = ['ROUTER', 'SWITCH', 'QKD_NODE', 'OPTICAL_SWITCH', 'SATELLITE', 'gNB_NTN'] }: DevicesViewProps) {
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<string[]>([]);
  const [highlightedDeviceId, setHighlightedDeviceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);
  const [graphHeight, setGraphHeight] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const [inspectHeight, setInspectHeight] = useState(180);
  const [isInspectResizing, setIsInspectResizing] = useState(false);
  
  const networkTopology = NetworkService.getInstance().getTopology();

  const filteredDevices = useMemo(() => {
    let devices = networkTopology.nodes.filter(device => 
      selectedTypes.length === 0 || selectedTypes.includes(device.type) || 
      selectedTypes.some(t => device.type.includes(t) || t.includes(device.type))
    );
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      devices = devices.filter(device => 
        (device.name || '').toLowerCase().includes(q) ||
        (device.uuid || '').toLowerCase().includes(q) ||
        (device.ietfSystem?.hostname || '').toLowerCase().includes(q) ||
        (device.layer || '').toLowerCase().includes(q) ||
        (device.location || '').toLowerCase().includes(q) ||
        (device.type || '').toLowerCase().includes(q)
      );
    }
    return devices;
  }, [networkTopology.nodes, selectedTypes, searchQuery]);

  // Default block highlighted element
  useEffect(() => {
    if (filteredDevices.length > 0 && !highlightedDeviceId) {
      setHighlightedDeviceId(filteredDevices[0].uuid);
    }
  }, [filteredDevices, highlightedDeviceId]);

  const graphDevices = useMemo(() => 
    networkTopology.nodes.filter(d => selectedDeviceIds.includes(d.uuid)),
    [selectedDeviceIds, networkTopology.nodes]
  );

  const graphLinks = useMemo(() => 
    networkTopology.links.filter(l => 
      selectedDeviceIds.includes(l.sourceNodeUuid) && 
      selectedDeviceIds.includes(l.targetNodeUuid)
    ),
    [selectedDeviceIds, networkTopology.links]
  );

  const toggleDeviceSelection = (id: string) => {
    setSelectedDeviceIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedDeviceIds.length === filteredDevices.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(filteredDevices.map(d => d.uuid));
    }
  };

  const toggleExpand = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDeviceIds(prev => 
      prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
    );
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
        return Math.max(120, Math.min(600, newHeight));
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

  const highlightedDevice = useMemo(() => 
    filteredDevices.find(d => d.uuid === highlightedDeviceId),
    [filteredDevices, highlightedDeviceId]
  );

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Devices (IETF Modelled)</h2>
          <p className="text-muted-foreground text-xs">Standard hierarchical topology, click to inspect properties split panel, double-click row to drill-down.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search devices..." 
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
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-muted/90 backdrop-blur border border-border px-2.5 py-1 rounded-full">
          <Network className="w-3 h-3 text-blue-500" />
          <span className="text-[9px] font-mono font-bold text-foreground/80 uppercase tracking-wider">
            Selection Topology ({selectedDeviceIds.length} nodes)
          </span>
        </div>
        
        <Button 
          size="icon" 
          variant="secondary" 
          onClick={() => setIsGraphMaximized(!isGraphMaximized)}
          className="absolute top-3 right-3 z-10 bg-muted/80 border border-border text-muted-foreground hover:text-foreground/90 h-7 w-7"
        >
          {isGraphMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </Button>

        <div className="w-full h-full rounded-lg border border-border overflow-hidden bg-background/50">
          {selectedDeviceIds.length > 0 ? (
            <TopologyGraph 
              devices={graphDevices.map(d => ({ 
                id: d.uuid, 
                name: d.name, 
                type: d.type, 
                status: 'OPERATIONAL' as const, 
                endpoints: d.ietfInterfaces?.map(i => i.name) || [], 
                location: { 
                  latitude: d.ietfGeoLocation?.location?.ellipsoid?.latitude || 0, 
                  longitude: d.ietfGeoLocation?.location?.ellipsoid?.longitude || 0 
                }, 
                component_count: d.hardware.length, 
                drivers: [] 
              }))} 
              links={graphLinks.map(l => ({ 
                id: l.uuid, 
                source: l.sourceNodeUuid, 
                target: l.targetNodeUuid, 
                capacity: l.capacity, 
                type: 'OPTICAL' as const, 
                latency: '1ms', 
                source_endpoint: l.sourcePortUuid, 
                target_endpoint: l.targetPortUuid 
              }))} 
              onNavigate={onNavigate} 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/80 space-y-1">
              <Network className="w-6 h-6 opacity-30 animate-pulse text-zinc-500" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Check devices below to construct active topology graph</p>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        {!isGraphMaximized && (
          <div 
            onMouseDown={startResizing}
            className={cn(
              "absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-4 flex items-center justify-center cursor-ns-resize z-20 transition-opacity",
              isResizing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            <div className="bg-muted border border-border rounded-full px-1.5 py-0.5 shadow-md">
              <GripHorizontal className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Main Table Segment */}
      <div className="bg-background border border-border rounded-lg overflow-auto flex-1 min-h-[120px] relative">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10 border-b border-border">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-10">
                <Checkbox 
                  checked={selectedDeviceIds.length === filteredDevices.length && filteredDevices.length > 0}
                  onCheckedChange={toggleAllSelection}
                  className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-3.5 w-3.5"
                />
              </TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Device Name / ID</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Platform/OS</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Domain Type</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">IETC Coordinates</TableHead>
              <TableHead className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Subparts Count</TableHead>
              <TableHead className="text-right text-muted-foreground font-mono text-[10px] uppercase tracking-wider">Drill-down</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.map((device) => {
              const isExpanded = expandedDeviceIds.includes(device.uuid);
              const isHighlighted = highlightedDeviceId === device.uuid;

              return (
                <React.Fragment key={device.uuid}>
                  <TableRow 
                    className={cn(
                      "border-border hover:bg-muted/20 transition-colors cursor-pointer",
                      isHighlighted && "bg-blue-950/20 shadow-inner border-l-2 border-l-blue-500/80"
                    )}
                    onClick={() => setHighlightedDeviceId(device.uuid)}
                    onDoubleClick={() => onNavigate(device.uuid, 'device')}
                    data-nav-id={device.uuid}
                    data-nav-type="device"
                    title="Single-click to select attributes | Double-click to inspect detailed model"
                  >
                    <TableCell onClick={(e) => toggleExpand(device.uuid, e)} className="w-10 py-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-zinc-800">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="py-2">
                      <Checkbox 
                        checked={selectedDeviceIds.includes(device.uuid)}
                        onCheckedChange={() => toggleDeviceSelection(device.uuid)}
                        className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-3.5 w-3.5"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Router className={cn("w-3.5 h-3.5 shrink-0", isHighlighted ? "text-blue-400" : "text-muted-foreground")} />
                        <div>
                          <span className="font-semibold text-foreground/90 text-sm hover:underline">
                            {device.ietfSystem?.hostname || device.name}
                          </span>
                          <span className="block text-[9px] font-mono text-muted-foreground">{device.uuid}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-2">
                      {device.ietfSystem?.platform.osName || 'Compliant IETF Stack'}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] py-0 px-1.5 h-4 font-mono">
                        {device.layer.split(' ')[0]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-2 font-mono">
                      {device.ietfGeoLocation?.location?.ellipsoid?.latitude?.toFixed(4) || '0.000'}N, {device.ietfGeoLocation?.location?.ellipsoid?.longitude?.toFixed(4) || '0.000'}E
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-2 font-mono">
                      {device.ietfInterfaces?.length || 0} Interfaces / {device.hardware.length} HW
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-6 text-[10px] py-0 px-2 font-mono bg-zinc-900 border border-border text-zinc-300 hover:text-white"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onNavigate(device.uuid, 'device'); 
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Inline Hierarchical Expandable Rows */}
                  {isExpanded && (
                    <TableRow className="bg-zinc-900/40 border-b border-border/40 hover:bg-zinc-900/40">
                      <TableCell colSpan={8} className="p-0">
                        <div className="pl-12 pr-6 py-4 space-y-4 border-l-2 border-blue-500/40 font-mono text-xs text-muted-foreground">
                          {/* Interfaces Nested Grid */}
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                              <Radio className="w-3 h-3 text-blue-500" />
                              <span>Interfaces & Ports (IETF ietf-interfaces)</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {(device.ietfInterfaces || []).map(intf => (
                                <div 
                                  key={intf.name} 
                                  className="flex items-start justify-between bg-zinc-950/45 p-2 rounded border border-border/50 hover:bg-zinc-900 transition-colors cursor-pointer shadow-sm"
                                  onClick={(e) => { e.stopPropagation(); onNavigate(`${device.uuid}/${intf.name}`, 'port'); }}
                                  onDoubleClick={(e) => { e.stopPropagation(); onNavigate(`${device.uuid}/${intf.name}`, 'port'); }}
                                  data-nav-id={`${device.uuid}/${intf.name}`}
                                  data-nav-type="port"
                                  title="Double-click interface to inspect details"
                                >
                                  <div>
                                    <span className="text-blue-400 font-bold hover:underline">{intf.name}</span>
                                    <p className="text-[10px] font-sans truncate max-w-sm">{intf.description || 'Standard Interface Port'}</p>
                                    <span className="text-[9px] text-zinc-500 block">Speed: {(intf.speed || 0)/1e9} Gbps</span>
                                    {intf.opticalChannelFreqGhz && (
                                      <span className="text-[9px] text-amber-500 block font-normal">
                                        {intf.opticalChannelFreqGhz} GHz ({intf.opticalChannelWavelengthNm ? `${Number(intf.opticalChannelWavelengthNm).toFixed(1)} nm` : ''})
                                      </span>
                                    )}
                                    {intf.otnLinkTp && (
                                      <span className="text-[9px] text-indigo-400 block font-normal">
                                        TSG: {typeof intf.otnLinkTp === 'object' ? intf.otnLinkTp.tsg : intf.otnLinkTp}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-1 font-mono text-[9px]">
                                    <span className={cn(
                                      "px-1.5 py-0.2 rounded border",
                                      intf.operStatus === 'up' 
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                    )}>
                                      {intf.operStatus.toUpperCase()}
                                    </span>
                                    <span className="text-zinc-500">
                                      {intf.physAddress || (() => {
                                        const neRef = (device as any).activeNeRef || device.inventoryMappingAttributes?.neRef;
                                        if (neRef && intf.activePortRef) {
                                          const physNode = networkTopology.nodes.find(n => n.uuid === neRef);
                                          const physIface = physNode?.ietfInterfaces?.find(i => i.name === intf.activePortRef);
                                          return physIface?.physAddress;
                                        }
                                        return null;
                                      })() || 'No Phys MAC'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {(!device.ietfInterfaces || device.ietfInterfaces.length === 0) && (
                                <p className="text-[10px] py-1">No configured interfaces found.</p>
                              )}
                            </div>
                          </div>

                          {/* Hardware Components Nested Grid */}
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                              <Cpu className="w-3 h-3 text-indigo-500" />
                              <span>Hardware Components (IETF ietf-hardware)</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {(device.hardware || []).map(hw => (
                                <div 
                                  key={hw.uuid} 
                                  className="flex flex-col justify-between bg-zinc-950/45 p-2 rounded border border-border/50 hover:bg-zinc-900 transition-colors cursor-pointer shadow-sm"
                                  onClick={(e) => { e.stopPropagation(); onNavigate(hw.uuid, 'hardware'); }}
                                  onDoubleClick={(e) => { e.stopPropagation(); onNavigate(hw.uuid, 'hardware'); }}
                                  data-nav-id={hw.uuid}
                                  data-nav-type="hardware"
                                  title="Double-click hardware unit to inspect details"
                                >
                                  <div className="flex items-start justify-between">
                                    <span className="text-indigo-400 font-bold truncate max-w-[120px] hover:underline" title={hw.name}>
                                      {hw.name}
                                    </span>
                                    <span className="text-[8px] bg-muted px-1.5 rounded text-zinc-400 uppercase tracking-wider shrink-0 font-mono">
                                      {hw.class}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5 mt-1.5 text-[9px] text-zinc-500 font-sans">
                                    <p><span className="font-mono text-[8px] text-zinc-400">MFG:</span> {hw.manufacturer || 'Cognitive Provider'}</p>
                                    <p><span className="font-mono text-[8px] text-zinc-400">P/N:</span> {hw.partNumber || 'N/A'}</p>
                                  </div>
                                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/20 text-[8px] font-mono">
                                    <span className="text-zinc-600 truncate max-w-[100px]" title={hw.uuid}>ID: {hw.uuid}</span>
                                    <span className={cn(
                                      "px-1 rounded-full",
                                      hw.status === 'active' ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-500 bg-zinc-800"
                                    )}>
                                      ● {hw.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {(!device.hardware || device.hardware.length === 0) && (
                                <p className="text-[10px] py-1">No hardware components installed.</p>
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

        {highlightedDevice ? (
          <div className="p-4 space-y-3 flex-1 overflow-y-auto min-h-0">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <h4 className="text-xs font-bold font-mono text-zinc-200">
                  Quick-Inspect Panel: {highlightedDevice.ietfSystem?.hostname || highlightedDevice.name} ({highlightedDevice.uuid})
                </h4>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Double-click row to view full telemetry
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-normal text-muted-foreground/90 font-mono">
              {/* Column 1: System */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5 text-blue-500" />
                  <span>OS & Architecture</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p><strong className="text-zinc-400 font-sans">OS Name:</strong> {highlightedDevice.ietfSystem?.platform.osName || 'Unknown'}</p>
                  <p><strong className="text-zinc-400 font-sans">OS Release:</strong> {highlightedDevice.ietfSystem?.platform.osRelease || 'Unknown'}</p>
                  <p><strong className="text-zinc-400 font-sans">ArchType:</strong> {highlightedDevice.ietfSystem?.platform.machine || 'Unknown'}</p>
                </div>
              </div>

              {/* Column 2: Clock & Time */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Uptime & Clock</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p><strong className="text-zinc-400 font-sans">Timezone:</strong> {highlightedDevice.ietfSystem?.clock.timezoneName || 'UTC'}</p>
                  <p><strong className="text-zinc-400 font-sans">Boot Time:</strong> {highlightedDevice.ietfSystem?.clock.bootDatetime || 'N/A'}</p>
                  <p><strong className="text-zinc-400 font-sans">System Time:</strong> {highlightedDevice.ietfSystem?.clock.currentDatetime || 'N/A'}</p>
                </div>
              </div>

              {/* Column 3: Physical */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Geolocation & Frame</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p><strong className="text-zinc-400 font-sans">Ref Frame:</strong> {highlightedDevice.ietfGeoLocation?.referenceFrame.astronomicalBody || 'Earth'}</p>
                  <p><strong className="text-zinc-400 font-sans">System:</strong> {highlightedDevice.ietfGeoLocation?.referenceFrame.geodeticSystem.geodeticDatum || 'WGS-84'}</p>
                  <p><strong className="text-zinc-400 font-sans">Physical Site:</strong> {highlightedDevice.location || 'Unknown'}</p>
                </div>
              </div>

              {/* Column 4: Routing/Network */}
              <div className="space-y-1.5 p-2 bg-zinc-900/30 rounded border border-border/40">
                <div className="flex items-center gap-1 text-[10px] font-bold font-sans text-zinc-400 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Access Security</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p><strong className="text-zinc-400 font-sans">Layer Range:</strong> {highlightedDevice.layer}</p>
                  <p><strong className="text-zinc-400 font-sans">ACL Rules:</strong> {highlightedDevice.ietfAccessControlList?.length || 0} entries</p>
                  <p>
                    <strong className="text-zinc-400 font-sans">Compliance:</strong> 
                    <span className="text-emerald-400 font-mono ml-1 text-[10px]">IETF RFC 8345</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground/70 text-xs text-mono bg-zinc-950/20">
            <Activity className="w-5 h-5 mx-auto mb-1 animate-pulse opacity-40" />
            Click a node row above to dynamically load object attributes
          </div>
        )}
      </div>
    </div>
  );
}
