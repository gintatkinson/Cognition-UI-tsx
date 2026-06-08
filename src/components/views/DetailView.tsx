
import React from 'react';
import { 
  ArrowLeft, 
  Router, 
  Share2, 
  Activity, 
  Layers, 
  ExternalLink,
  Info,
  Settings as SettingsIcon,
  Cpu,
  Network,
  Database,
  MapPin,
  ShieldCheck,
  Zap,
  Target,
  Edit2,
  Save,
  X,
  Clock,
  Compass,
  Gauge,
  AlertCircle,
  RefreshCw,
  GitCommit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MOCK_DEVICES, MOCK_SERVICES, MOCK_SLICES, MOCK_LINKS } from '@/lib/mock-data';
import { NetworkService } from '../../services/networkService';
import { NetworkLayer, HardwareComponent, IETFGeoLocation } from '../../types';

interface DetailViewProps {
  item: { id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl' };
  onNavigate: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
  onBack: () => void;
}

import { AIInsightsCard } from '../AIInsightsCard';
import { SatellitePayloadSchematic } from './SatellitePayloadSchematic';

interface HardwareTreeNode {
  component: HardwareComponent;
  children: HardwareTreeNode[];
}

function HardwareTreeComponent({ 
  node, 
  components, 
  onNavigate 
}: { 
  node: any; 
  components: HardwareComponent[]; 
  onNavigate: any;
}) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const tree = React.useMemo(() => {
    const componentMap = new Map<string, HardwareTreeNode>();
    components.forEach(comp => {
      componentMap.set(comp.uuid, { component: comp, children: [] });
    });

    const roots: HardwareTreeNode[] = [];
    components.forEach(comp => {
      const treeNode = componentMap.get(comp.uuid);
      if (treeNode) {
        if (comp.parentUuid && componentMap.has(comp.parentUuid)) {
          componentMap.get(comp.parentUuid)!.children.push(treeNode);
        } else {
          roots.push(treeNode);
        }
      }
    });
    return roots;
  }, [components]);

  React.useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    components.forEach(comp => {
      initialExpanded[comp.uuid] = true;
    });
    setExpanded(initialExpanded);
  }, [components]);

  const toggleExpand = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [uuid]: !prev[uuid] }));
  };

  const renderNode = (treeNode: HardwareTreeNode, depth: number): React.ReactNode => {
    const comp = treeNode.component;
    const isExpanded = expanded[comp.uuid] !== false;
    const hasChildren = treeNode.children.length > 0;

    let icon = <Info size={16} className="text-muted-foreground" />;
    if (comp.class === 'chassis') {
      icon = <Database size={16} className="text-amber-500" />;
    } else if (comp.class === 'container' || comp.class === 'slot') {
      icon = <SettingsIcon size={16} className="text-blue-400" />;
    } else if (comp.class === 'module') {
      icon = <Cpu size={16} className="text-purple-400" />;
    } else if (comp.class === 'port') {
      icon = <Network size={16} className="text-emerald-400" />;
    } else if (comp.class === 'transceiver') {
      icon = <Zap size={16} className="text-rose-400" />;
    }

    let matchedIface: any = undefined;
    if (comp.class === 'port' && node.ietfInterfaces) {
      matchedIface = node.ietfInterfaces.find((iface: any) => {
        const normalizedName = iface.name.replace('/', '-');
        return comp.uuid.endsWith(`-${normalizedName}`) || comp.uuid.endsWith(`/${iface.name}`) || comp.uuid === normalizedName;
      });
    }

    return (
      <React.Fragment key={comp.uuid}>
        <div 
          className="group flex flex-col md:flex-row md:items-center justify-between p-3.5 border-b border-border/40 hover:bg-muted/15 transition-all text-left"
          style={{ paddingLeft: `${Math.max(16, depth * 24 + 16)}px` }}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            {depth > 0 && (
              <span className="text-zinc-650 font-mono select-none text-sm leading-none pt-0.5 shrink-0">
                └──
              </span>
            )}
            
            <div className="flex items-start gap-2">
              <button 
                onClick={(e) => hasChildren && toggleExpand(comp.uuid, e)} 
                className={`p-0.5 rounded hover:bg-muted/30 transition-colors ${hasChildren ? 'cursor-pointer' : 'cursor-default opacity-0'}`}
              >
                <span className="block text-[10px] font-bold w-4 h-4 text-center leading-4 font-mono select-none">
                  {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
                </span>
              </button>
              
              <div className="shrink-0 mt-0.5">
                {icon}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span 
                    onClick={() => onNavigate(comp.uuid, 'hardware')}
                    className="font-bold text-zinc-150 hover:text-blue-400 hover:underline cursor-pointer select-all text-xs truncate"
                  >
                    {comp.name}
                  </span>
                  
                  <Badge variant="outline" className={`text-[9px] font-semibold font-mono uppercase tracking-wider h-4 px-1 ${
                    comp.class === 'chassis' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    comp.class === 'port' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    comp.class === 'container' || comp.class === 'slot' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-zinc-800 text-zinc-400 border-border'
                  }`}>
                    {comp.class} {comp.isMain && '(MAIN)'}
                  </Badge>

                  {comp.status && (
                    <Badge variant="outline" className={`text-[9px] font-mono h-4 px-1 ${
                      comp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {comp.status}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 mt-1 font-mono text-[10px] text-muted-foreground/85">
                  <span>ID: <span className="cursor-pointer hover:underline text-indigo-400 font-mono select-all text-left" onClick={() => onNavigate(comp.uuid, 'hardware')}>{comp.uuid}</span></span>
                  {comp.partNumber && <span>Part: {comp.partNumber}</span>}
                  {comp.serialNumber && <span>S/N: {comp.serialNumber}</span>}
                  
                  {matchedIface && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-sans text-emerald-400">
                      <span>➔ Logical TP:</span>
                      <span 
                        onClick={(e) => { e.stopPropagation(); onNavigate(`${node.uuid}/${matchedIface.name}`, 'port'); }}
                        className="hover:text-blue-400 hover:underline cursor-pointer font-bold select-all font-mono"
                      >
                        {matchedIface.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 md:mt-0 justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 px-2.5 text-[10px] border-border bg-background/50 hover:text-blue-400 hover:border-blue-500/35 hover:bg-blue-500/5 font-bold transition-all"
              onClick={() => onNavigate(comp.uuid, 'hardware')}
            >
              Inspect
            </Button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {treeNode.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col divide-y divide-border/30">
      {tree.length > 0 ? (
        tree.map(root => renderNode(root, 0))
      ) : (
        <div className="p-6 text-center text-xs text-muted-foreground font-mono">
          No hardware components configured on this device.
        </div>
      )}
    </div>
  );
}

export function DetailView({ item, onNavigate, onBack }: DetailViewProps) {
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [activeLinkTab, setActiveLinkTab] = React.useState<'core' | 'te_sla' | 'verticals' | 'otn' | 'qkd'>('core');
  const networkTopology = NetworkService.getInstance().getTopology();
  
  const getDevice = (id: string) => {
    const activeDev = MOCK_DEVICES.find(d => d.id === id);
    if (activeDev) return activeDev;
    
    // Look up passive devices
    const passiveDev = NetworkService.getInstance().getPassiveDevices().find(d => d.id === id);
    if (passiveDev) {
      return {
        id: passiveDev.id,
        name: passiveDev.name,
        type: `Passive Hardware Cabinet (${passiveDev.deviceType})`,
        status: 'OPERATIONAL',
        drivers: passiveDev.customTags || [],
        endpoints: (passiveDev.passivePorts || []).map(p => `${passiveDev.id}/${p.id}`),
        _isPassive: true,
        passivePorts: passiveDev.passivePorts,
        locationRef: passiveDev.locationRef
      } as any;
    }
    return undefined;
  };
  const getFacilityLocationAndChassis = (nodeUuid: string) => {
    // 1. Try to find physical node
    let node = networkTopology.nodes.find(n => n.uuid === nodeUuid);
    let isLogical = false;
    let isPassive = false;
    let passiveDev: any = null;

    if (!node) {
      // 2. Search logical node
      const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
      for (const net of rfcNetworks) {
        const logical = net.nodes.find(n => n.nodeId === nodeUuid || n.name === nodeUuid);
        if (logical) {
          isLogical = true;
          if (logical.activeNeRef) {
            node = networkTopology.nodes.find(n => n.uuid === logical.activeNeRef);
          }
          break;
        }
      }
    }

    if (!node) {
      // 3. Search passive device
      passiveDev = NetworkService.getInstance().getPassiveDevices().find(d => d.id === nodeUuid);
      if (passiveDev) {
        isPassive = true;
      }
    }

    if (isPassive && passiveDev) {
      const locRef = passiveDev.locationRef || 'N/A';
      let room = 'N/A';
      let rack = 'N/A';
      if (locRef.includes('room-') && locRef.includes('-rack-')) {
        const parts = locRef.split('-rack-');
        room = parts[0].replace('room-', 'Room ');
        rack = parts[1];
      } else if (locRef.startsWith('outdoor-enclosure-')) {
        room = 'Outdoor Enclosure';
        rack = locRef.replace('outdoor-enclosure-', '');
      } else {
        room = locRef;
      }

      return {
        facility: {
          siteName: passiveDev.id.includes('tokyo') ? 'Tokyo Otemachi Site' : 
                    passiveDev.id.includes('osaka') ? 'Osaka Chuo-ku Site' : 
                    passiveDev.id.includes('kozu') ? 'Kozu Beach Site' : 'Remote Facility',
          buildingOrHut: 'Distribution Enclosure',
          roomOrHall: room,
          rackIdentifier: rack,
          rackPosition: 'N/A',
          notes: 'Passive Infrastructure Element'
        },
        chassis: {
          uuid: passiveDev.id,
          name: passiveDev.name,
          manufacturer: 'Passive Infrastructure',
          partNumber: passiveDev.deviceType,
          serialNumber: 'N/A',
          class: 'chassis'
        },
        isPassive: true,
        nodeName: passiveDev.name,
        nodeUuid: passiveDev.id
      };
    }

    if (node) {
      const facility = node.facilityLocation || {
        siteName: node.location || 'Remote Site',
        buildingOrHut: 'Standard Telecom Hut',
        roomOrHall: 'Equipment Room',
        rackIdentifier: `Rack-${node.name || node.uuid}`,
        rackPosition: '1',
        notes: 'Default Location coordinates'
      };

      const chassis = node.hardware?.find(h => h.class === 'chassis') || {
        uuid: `hw-ch-${node.uuid}`,
        name: `${node.name || node.uuid} Chassis`,
        manufacturer: 'Generic Network Equipment',
        partNumber: 'GEN-CHASSIS',
        serialNumber: 'N/A',
        class: 'chassis'
      };

      return {
        facility,
        chassis,
        isPassive: false,
        nodeName: node.name || node.uuid,
        nodeUuid: node.uuid
      };
    }

    // Default fallback
    return {
      facility: {
        siteName: 'Unknown Site',
        buildingOrHut: 'Unknown Hut',
        roomOrHall: 'N/A',
        rackIdentifier: 'N/A',
        rackPosition: 'N/A',
        notes: 'Location unresolved'
      },
      chassis: {
        uuid: `hw-ch-${nodeUuid}`,
        name: `Integrated Chassis ${nodeUuid}`,
        manufacturer: 'Unknown',
        partNumber: 'N/A',
        serialNumber: 'N/A',
        class: 'chassis'
      },
      isPassive: false,
      nodeName: nodeUuid,
      nodeUuid: nodeUuid
    };
  };
  const renderCabinetLocationAndChassisCard = (nodeUuid: string) => {
    const data = getFacilityLocationAndChassis(nodeUuid);
    if (!data) return null;

    return (
      <Card className="bg-background border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-400" />
            Cabinet Location & Chassis Details
          </CardTitle>
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] uppercase font-mono">
            Physical Placement
          </Badge>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Facility Placement</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><span className="font-semibold text-foreground/80">Site:</span> {data.facility.siteName}</p>
                <p><span className="font-semibold text-foreground/80">Building/Hut:</span> {data.facility.buildingOrHut}</p>
                <p><span className="font-semibold text-foreground/80">Room/Hall:</span> {data.facility.roomOrHall}</p>
                <p><span className="font-semibold text-foreground/80">Rack ID:</span> <span className="font-mono text-indigo-400 select-all">{data.facility.rackIdentifier}</span></p>
                <p><span className="font-semibold text-foreground/80">Position (RU):</span> RU {data.facility.rackPosition}</p>
              </div>
              {data.facility.notes && (
                <p className="text-[11px] text-amber-500/80 italic flex items-center gap-1 mt-1">
                  <Info className="w-3 h-3" /> {data.facility.notes}
                </p>
              )}
            </div>
            <div className="space-y-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Chassis Component Details</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><span className="font-semibold text-foreground/80">Chassis Name:</span> {data.chassis.name}</p>
                <p>
                  <span className="font-semibold text-foreground/80">Chassis UUID:</span>{' '}
                  <span 
                    className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer select-all"
                    onClick={() => onNavigate(data.chassis.uuid, 'hardware')}
                  >
                    {data.chassis.uuid}
                  </span>
                </p>
                <p><span className="font-semibold text-foreground/80">Manufacturer:</span> {data.chassis.manufacturer}</p>
                <p><span className="font-semibold text-foreground/80">Part Number:</span> {data.chassis.partNumber}</p>
                <p><span className="font-semibold text-foreground/80">Serial Number:</span> {data.chassis.serialNumber}</p>
              </div>
            </div>
          </div>
          <Separator className="bg-muted" />
          <div className="flex justify-end pt-1">
            <Button 
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-700 text-xs flex items-center gap-1.5"
              onClick={() => onNavigate(data.chassis.uuid, 'hardware')}
            >
              <Cpu className="w-3.5 h-3.5" />
              Inspect Full Chassis View
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  const renderLinkEndpointsCabinetCard = (nodeAId: string, nodeZId: string) => {
    const aData = getFacilityLocationAndChassis(nodeAId);
    const zData = getFacilityLocationAndChassis(nodeZId);

    return (
      <Card className="bg-background border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border bg-muted/5">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            Link Endpoints Physical Placement & Chassis details
          </CardTitle>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] uppercase font-mono">
            Facility placements
          </Badge>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 text-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* A-End placement */}
            {aData && (
              <div className="p-4 bg-muted/15 border border-border rounded-lg space-y-3">
                <p className="text-xs font-bold text-[#10b981] flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  A-End Endpoint placement
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Device</p>
                    <p 
                      className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer select-all truncate"
                      onClick={() => onNavigate(aData.nodeUuid, 'device')}
                    >
                      {aData.nodeName} ({aData.nodeUuid})
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Cabinet / Rack</p>
                    <p className="text-foreground/80 font-mono">{aData.facility.rackIdentifier} (RU {aData.facility.rackPosition})</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs pt-1.5 border-t border-border/40">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Site & Room</p>
                    <p className="text-foreground/80">{aData.facility.siteName}, {aData.facility.roomOrHall}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Chassis Component</p>
                    <p 
                      className="text-indigo-400 hover:underline cursor-pointer font-mono truncate"
                      onClick={() => onNavigate(aData.chassis.uuid, 'hardware')}
                    >
                      {aData.chassis.name}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-border text-xs flex items-center gap-1"
                    onClick={() => onNavigate(aData.chassis.uuid, 'hardware')}
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#10b981]" />
                    Inspect A-End Chassis
                  </Button>
                </div>
              </div>
            )}

            {/* Z-End placement */}
            {zData && (
              <div className="p-4 bg-muted/15 border border-border rounded-lg space-y-3">
                <p className="text-xs font-bold text-[#6366f1] flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-pulse" />
                  Z-End Endpoint placement
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Device</p>
                    <p 
                      className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer select-all truncate"
                      onClick={() => onNavigate(zData.nodeUuid, 'device')}
                    >
                      {zData.nodeName} ({zData.nodeUuid})
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Cabinet / Rack</p>
                    <p className="text-foreground/80 font-mono">{zData.facility.rackIdentifier} (RU {zData.facility.rackPosition})</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs pt-1.5 border-t border-border/40">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Site & Room</p>
                    <p className="text-foreground/80">{zData.facility.siteName}, {zData.facility.roomOrHall}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Chassis Component</p>
                    <p 
                      className="text-indigo-400 hover:underline cursor-pointer font-mono truncate"
                      onClick={() => onNavigate(zData.chassis.uuid, 'hardware')}
                    >
                      {zData.chassis.name}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-border text-xs flex items-center gap-1"
                    onClick={() => onNavigate(zData.chassis.uuid, 'hardware')}
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#6366f1]" />
                    Inspect Z-End Chassis
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  const getIETFNode = (id: string) => {
    // 1. Search physical nodes
    const physical = networkTopology.nodes.find(n => n.uuid === id);
    if (physical) return { ...physical, _isLogical: false };

    // 2. Search logical nodes in RFC 8345 networks
    const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
    for (const net of rfcNetworks) {
      const logical = net.nodes.find(n => n.nodeId === id || n.name === id);
      if (logical) {
        const physicalRef = logical.activeNeRef ? networkTopology.nodes.find(n => n.uuid === logical.activeNeRef) : null;
        
        return {
          uuid: logical.nodeId,
          name: logical.name || logical.nodeId,
          type: 'Logical Router / Virtual Node (RFC 8345)',
          layer: `L3 IP Overlay: ${net.networkId}`,
          location: physicalRef?.location || 'Logical Cloud Domain',
          ietfSystem: physicalRef?.ietfSystem || {
            hostname: logical.nodeId,
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
          ietfInterfaces: (logical.terminationPoints || []).map(tp => ({
            name: tp.tpId,
            type: 'iana-if-type:logicalInterface',
            enabled: true,
            adminStatus: 'up',
            operStatus: 'up',
            speed: 100000000000,
            description: `Logical TP Interface ${tp.tpId} mapped to standard underlay`,
            ipAddress: tp.ipAddress,
            opticalChannelFreqGhz: tp.opticalChannelFreqGhz,
            opticalChannelWavelengthNm: tp.opticalChannelWavelengthNm || (tp.opticalChannelFreqGhz ? 299792.458 / tp.opticalChannelFreqGhz : undefined),
            otnLinkTp: tp.otnLinkTp,
            activePortRef: tp.activePortRef,
            supportingTerminationPoints: tp.supportingTerminationPoints,
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
          activeNeRef: logical.activeNeRef,
          _isLogical: true,
          _networkId: net.networkId
        } as any;
      }
    }
    return undefined;
  };
  
  const getLink = (id: string) => {
    const activeLink = MOCK_LINKS.find(l => l.id === id);
    if (activeLink) return activeLink;

    // Look up passive composite cables
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
  const getService = (id: string) => MOCK_SERVICES.find(s => s.id === id);
  const getSlice = (id: string) => MOCK_SLICES.find(s => s.id === id);
  const getIETFLink = (id: string) => {
    // 1. Search in physical topology links
    const physLink = networkTopology.links.find(l => l.uuid === id);
    if (physLink) {
      // Enrich with logical config if found in RFC8345 Networks
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

    // 2. Search in logical networks
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
          } as any;
        }
      }
    }
    return undefined;
  };

  const renderIETFDeviceDetail = (id: string) => {
    const node = getIETFNode(id);
    if (!node) return <div>Node not found</div>;

    const rootChassis = node.hardware.filter(h => h.class === 'chassis');
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="bg-background border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                ietf-system 
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                RFC 7317
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Hostname</p>
                  <p className="text-sm font-mono text-foreground/80">{node.ietfSystem?.hostname || node.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Contact</p>
                  <p className="text-sm text-foreground/80">{node.ietfSystem?.contact || 'N/A'}</p>
                </div>
              </div>
              <Separator className="bg-muted" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">Platform Engine</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                     <p><span className="text-muted-foreground/80">OS:</span> {node.ietfSystem?.platform.osName} {node.ietfSystem?.platform.osRelease}</p>
                     <p><span className="text-muted-foreground/80">Arch:</span> {node.ietfSystem?.platform.machine}</p>
                  </div>
                </div>
                <div>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">System Clock</p>
                   <div className="space-y-1 text-xs text-muted-foreground">
                     <p><span className="text-muted-foreground/80">Current:</span> {node.ietfSystem?.clock.currentDatetime ? new Date(node.ietfSystem.clock.currentDatetime).toLocaleTimeString() : 'N/A'}</p>
                     <p><span className="text-muted-foreground/80">Boot:</span> {node.ietfSystem?.clock.bootDatetime ? new Date(node.ietfSystem.clock.bootDatetime).toLocaleDateString() : 'N/A'}</p>
                     <p><span className="text-muted-foreground/80">TZ:</span> {node.ietfSystem?.clock.timezoneName || 'Unknown'}</p>
                   </div>
                </div>
              </div>
              {node.facilityLocation && (
                <>
                  <Separator className="bg-muted" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">Facility Location</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p><span className="text-muted-foreground/80">Site:</span> {node.facilityLocation.siteName}</p>
                        <p><span className="text-muted-foreground/80">Building:</span> {node.facilityLocation.buildingOrHut}</p>
                        {node.facilityLocation.roomOrHall && <p><span className="text-muted-foreground/80">Room:</span> {node.facilityLocation.roomOrHall}</p>}
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p><span className="text-muted-foreground/80">Rack:</span> {node.facilityLocation.rackIdentifier}</p>
                        <p><span className="text-muted-foreground/80">Position:</span> RU {node.facilityLocation.rackPosition}</p>
                      </div>
                    </div>
                    {node.facilityLocation.notes && (
                      <p className="text-xs text-amber-500/80 mt-2 italic flex items-center gap-1">
                        <Info className="w-3 h-3" /> {node.facilityLocation.notes}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <GeoLocationCard 
            title="ietf-geo-location (Network Element)"
            geoLocation={node.ietfGeoLocation}
            onSave={(locationObj) => {
              NetworkService.getInstance().updateNodeGeoLocation(node.uuid, locationObj);
              setRefreshKey(prev => prev + 1);
            }}
          />

          {/* Redundant old card replaced by GeoLocationCard above */}
        </div>

        {renderCabinetLocationAndChassisCard(node.uuid)}

        {(node.type === 'SATELLITE' || node.uuid?.toUpperCase().includes('SAT')) && (
          <SatellitePayloadSchematic 
            node={node}
            onNavigate={onNavigate}
            networkLinks={networkTopology.links}
            allNodes={networkTopology.nodes}
          />
        )}

        {node.ietfInterfaces && node.ietfInterfaces.length > 0 && (
          <Card className="bg-background border-border shadow-none overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                 <Network className="w-4 h-4 text-emerald-500" />
                 ietf-interfaces
              </CardTitle>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px]">
                RFC 8343
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-b border-border/50 bg-background/50">
                       <th className="px-6 py-4">Interface Name</th>
                       <th className="px-6 py-4">Type</th>
                       <th className="px-6 py-4">Phys Address</th>
                       <th className="px-6 py-4">Speed</th>
                       <th className="px-6 py-4">Status (Admin/Oper)</th>
                       <th className="px-6 py-4 text-right">Traffic In/Out</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-800/50">
                      {node.ietfInterfaces.map(iface => (
                        <tr key={iface.name} className="group hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => onNavigate(`${node.uuid}/${iface.name}`, 'port')}>
                           <td className="px-6 py-4 font-bold text-xs text-foreground/90 font-mono group-hover:text-blue-400 group-hover:underline">{iface.name}</td>
                           <td className="px-6 py-4">
                              <Badge variant="outline" className="text-[10px] font-mono bg-muted text-muted-foreground border-border">
                                 {iface.type.replace('iana-if-type:', '')}
                              </Badge>
                           </td>
                           <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                             {iface.physAddress || (() => {
                               const neRef = (node as any).activeNeRef;
                               if (neRef && iface.activePortRef) {
                                 const physNode = networkTopology.nodes.find(n => n.uuid === neRef);
                                 const physIface = physNode?.ietfInterfaces?.find(i => i.name === iface.activePortRef);
                                 return physIface?.physAddress;
                               }
                               return null;
                             })() || '---'}
                           </td>
                           <td className="px-6 py-4 text-xs font-mono text-foreground/80">
                             <div className="flex flex-col gap-0.5">
                               <div>{iface.speed ? `${(iface.speed / 1000000000).toFixed(1)} Gbps` : 'Unknown'}</div>
                               {iface.opticalChannelFreqGhz && (
                                 <div className="text-[9px] text-amber-500 font-normal">
                                   {iface.opticalChannelFreqGhz} GHz ({iface.opticalChannelWavelengthNm ? `${iface.opticalChannelWavelengthNm.toFixed(1)} nm` : ''})
                                 </div>
                               )}
                               {iface.otnLinkTp && (
                                 <div className="text-[9px] text-indigo-400 font-normal">
                                   TSG: {typeof iface.otnLinkTp === 'object' ? iface.otnLinkTp.tsg : iface.otnLinkTp}
                                 </div>
                               )}
                             </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${iface.adminStatus === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className={`w-2 h-2 rounded-full ${iface.operStatus === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right text-xs font-mono text-muted-foreground">
                              {iface.statistics ? `${(iface.statistics.inOctets / 1024 / 1024).toFixed(1)}M / ${(iface.statistics.outOctets / 1024 / 1024).toFixed(1)}M` : '---'}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-background border-border shadow-none overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
               <Database className="w-4 h-4 text-amber-500" />
               ietf-hardware
            </CardTitle>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
              RFC 8348
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <HardwareTreeComponent 
              node={node}
              components={node.hardware || []}
              onNavigate={onNavigate}
            />
          </CardContent>
        </Card>
        
        {node.ietfAccessControlList && node.ietfAccessControlList.length > 0 && (
           <Card className="bg-background border-border shadow-none">
             <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  ietf-access-control-list
                </CardTitle>
                <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]">
                  RFC 8519
                </Badge>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {node.ietfAccessControlList.map(acl => (
                   <div key={acl.name} className="p-4 bg-muted/50 border border-border rounded-lg group cursor-pointer hover:border-blue-500/30 transition-colors" onClick={() => onNavigate(`${node.uuid}/${acl.name}`, 'acl')}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-sm text-foreground/90 font-mono group-hover:text-blue-400 group-hover:underline">{acl.name}</span>
                        <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">{acl.actions.forwarding.toUpperCase()}</Badge>
                      </div>
                      <div className="space-y-2 text-xs font-mono">
                         <div className="flex justify-between border-b border-border/50 pb-1 text-muted-foreground">
                           <span>Matches</span><span className="text-foreground/80">{acl.matches}</span>
                         </div>
                         <div className="flex justify-between text-muted-foreground">
                           <span>Logging</span><span className="text-foreground/80">{acl.actions.logging}</span>
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
        )}

        {node.services && node.services.length > 0 && (
          <Card className="bg-background border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                ietf-te-topology / ietf-l2vpn-svc
              </CardTitle>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px]">
                RFC 8795 / RFC 8466
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {node.services.map(svc => (
                  <div key={svc.uuid} className="p-4 bg-muted/50 border border-border rounded-lg group hover:border-orange-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                       <div>
                          <p className="font-bold text-sm text-foreground/90">{svc.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{svc.type}</p>
                       </div>
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                         {svc.status.toUpperCase()}
                       </Badge>
                    </div>
                    <div className="space-y-1.5">
                       <div className="flex justify-between text-xs font-mono">
                          <span className="text-muted-foreground">Layer</span>
                          <span className="text-foreground/80">{svc.layer.split(' ')[0]}</span>
                       </div>
                       <div className="flex justify-between text-xs font-mono">
                          <span className="text-muted-foreground">Bandwidth</span>
                          <span className="text-foreground/80">{svc.bandwidthValue} {svc.bandwidthUnits}</span>
                       </div>
                       <div className="flex justify-between text-xs font-mono">
                          <span className="text-muted-foreground">End-Points</span>
                          <span className="text-foreground/80 relative inline-flex items-center group-hover:text-orange-400 transition-colors">{svc.endpoints.join(', ')} <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" /></span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderDeviceDetail = (id: string) => {
    // If we have an IETF Node for this ID, use the rich display
    if (getIETFNode(id)) {
      return renderIETFDeviceDetail(id);
    }

    const device = getDevice(id);
    if (!device) return <div>Device not found</div>;

    if (device._isPassive) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-background border-border shadow-none col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  Passive Device Information
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                  PASSIVE HARDWARE
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Device ID</p>
                    <p className="text-sm font-mono text-zinc-300 font-bold">{device.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Device Name</p>
                    <p className="text-sm text-zinc-300 font-semibold">{device.name}</p>
                  </div>
                </div>
                <Separator className="bg-muted" />
                <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Device Type Classifier</p>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs">{device.type}</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Geographic Location Ref</p>
                    <p className="text-sm text-zinc-400 font-mono">{device.locationRef || 'N/A'}</p>
                  </div>
                </div>
                {device.drivers && device.drivers.length > 0 && (
                  <>
                    <Separator className="bg-muted" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">Tracking QR / RFID Tags (custom-tags)</p>
                      <div className="flex flex-wrap gap-2">
                        {device.drivers.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="bg-muted border border-border text-zinc-300 font-mono">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-background border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Passive Ports</span>
                  <span className="font-mono text-zinc-200 font-bold">{device.passivePorts?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Physical Class</span>
                  <Badge variant="outline" className="font-mono text-[10px]">YANG: passive-device</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-background border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">Passive Ports Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-b border-border bg-muted/20">
                      <th className="px-6 py-4">Port ID</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Fiber Core No.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-xs text-zinc-300">
                    {device.passivePorts?.map((port: any) => (
                      <tr key={port.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-3 font-semibold font-mono text-foreground">{port.id}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-sans ${
                            port.portType === 'input-port' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            port.portType === 'output-port' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            port.portType === 'service-port' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                          }`}>
                            {port.portType}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-zinc-400">{port.fiberCoreNum}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {renderCabinetLocationAndChassisCard(device.id)}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-background border-border shadow-none col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                Device Information
              </CardTitle>
              <Badge variant="outline" className={device.status === 'OPERATIONAL' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-500/10 text-muted-foreground border-zinc-500/20"}>
                {device.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Device ID</p>
                  <p className="text-sm font-mono text-foreground/80">{device.id}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Device Type</p>
                  <p className="text-sm text-foreground/80">{device.type}</p>
                </div>
              </div>
              <Separator className="bg-muted" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-2">Drivers</p>
                <div className="flex gap-2">
                  {device.drivers.map(d => <Badge key={d} variant="secondary" className="bg-muted border-border">{d}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-500" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Endpoints</span>
                  <span className="text-xs font-mono text-foreground/80">{device.endpoints.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Active Services</span>
                  <span className="text-xs font-mono text-foreground/80">
                    {MOCK_SERVICES.filter(s => s.endpoints.some(e => e.startsWith(device.id))).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-background border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {device.endpoints.map(ep => (
                <div key={ep} className="p-3 bg-muted/50 border border-border rounded-md flex items-center justify-between group cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => onNavigate(ep, 'port')}>
                  <span className="text-xs font-mono text-muted-foreground group-hover:text-blue-400 group-hover:underline">{ep}</span>
                  <Badge variant="outline" className="text-[8px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">UP</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {renderCabinetLocationAndChassisCard(device.id)}
      </div>
    );
  };

  const renderServiceDetail = (id: string) => {
    const service = getService(id);
    if (!service) return <div>Service not found</div>;

    return (
      <div className="space-y-6">
        <Card className="bg-background border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground">Service Configuration</CardTitle>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{service.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Type</p>
                <p className="text-sm text-foreground/80">{service.type}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Context</p>
                <p className="text-sm text-foreground/80">{service.context_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Service Endpoints & Physical Cabinet Placements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {service.endpoints.map(ep => {
                const deviceId = ep.split('/')[0];
                const data = getFacilityLocationAndChassis(deviceId);
                return (
                  <div key={ep} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Router className="w-5 h-5 text-indigo-400" />
                        <div>
                          <p 
                            className="text-sm font-extrabold text-indigo-400 hover:underline cursor-pointer select-all"
                            onClick={() => onNavigate(deviceId, 'device')}
                          >
                            {ep}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">Device ID: <span className="hover:underline cursor-pointer text-indigo-400" onClick={() => onNavigate(deviceId, 'device')}>{deviceId}</span></p>
                        </div>
                      </div>
                      {data && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-border text-xs flex items-center gap-1 bg-background"
                          onClick={() => onNavigate(data.chassis.uuid, 'hardware')}
                        >
                          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                          Inspect Chassis View
                        </Button>
                      )}
                    </div>

                    {data && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/40 text-xs">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-mono">Cabinet / Facility Location</p>
                          <p className="text-foreground/80"><span className="font-semibold text-muted-foreground">Site:</span> {data.facility.siteName}</p>
                          <p className="text-foreground/80"><span className="font-semibold text-muted-foreground">Rack:</span> {data.facility.rackIdentifier} (RU {data.facility.rackPosition})</p>
                          <p className="text-foreground/80"><span className="font-semibold text-muted-foreground">Room:</span> {data.facility.roomOrHall}</p>
                        </div>
                        <div className="space-y-1 md:border-l border-border md:pl-4">
                          <p className="text-[10px] text-muted-foreground uppercase font-mono">Chassis Hardware Details</p>
                          <p className="text-foreground/80"><span className="font-semibold text-muted-foreground">Chassis Name:</span> {data.chassis.name}</p>
                          <p className="text-foreground/80">
                            <span className="font-semibold text-muted-foreground">Chassis UUID:</span>{' '}
                            <span 
                              className="font-mono text-indigo-400 hover:underline cursor-pointer"
                              onClick={() => onNavigate(data.chassis.uuid, 'hardware')}
                            >
                              {data.chassis.uuid}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSliceDetail = (id: string) => {
    const slice = getSlice(id);
    if (!slice) return <div>Slice not found</div>;

    const uniqueDeviceIds = new Set<string>();
    slice.service_ids.forEach(svcId => {
      const service = getService(svcId);
      if (service) {
        service.endpoints.forEach(ep => {
          const deviceId = ep.split('/')[0];
          uniqueDeviceIds.add(deviceId);
        });
      }
    });

    return (
      <div className="space-y-6">
        <Card className="bg-background border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Slice Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">This slice isolates resources for specific network performance requirements.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted border border-border rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Status</p>
                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">{slice.status}</Badge>
              </div>
              <div className="p-4 bg-muted border border-border rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Context</p>
                <p className="text-sm font-medium">{slice.context_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Associated Services (Drill-down)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {slice.service_ids.map(svcId => {
                const service = getService(svcId);
                return (
                  <div key={svcId} className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-md hover:border-blue-500/50 transition-colors group cursor-pointer" onClick={() => onNavigate(svcId, 'service')}>
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-muted-foreground group-hover:text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground/90">{service?.name || svcId}</p>
                        <p className="text-[10px] text-muted-foreground">ID: {svcId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px]">{service?.type}</Badge>
                      <ExternalLink className="w-3 h-3 text-muted-foreground/80 group-hover:text-blue-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {uniqueDeviceIds.size > 0 && (
          <Card className="bg-background border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border bg-muted/5">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Slice Infrastructure Placement & Chassis Map
              </CardTitle>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] uppercase font-mono">
                Resource Mapping
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from(uniqueDeviceIds).map(devId => {
                  const data = getFacilityLocationAndChassis(devId);
                  if (!data) return null;
                  return (
                    <div key={devId} className="p-4 bg-muted/15 border border-border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p 
                            className="text-sm font-extrabold text-indigo-400 hover:underline cursor-pointer select-all"
                            onClick={() => onNavigate(data.nodeUuid, 'device')}
                          >
                            {data.nodeName}
                          </p>
                          <p className="text-[9px] text-muted-foreground font-mono">Device: {data.nodeUuid}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-border text-xs flex items-center gap-1 bg-background"
                          onClick={() => onNavigate(data.chassis.uuid, 'hardware')}
                        >
                          <Cpu className="w-3 h-3 text-indigo-400" />
                          Inspect Chassis
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-2 border-t border-border/30">
                        <div>
                          <p><span className="font-semibold text-foreground/80">Site:</span> {data.facility.siteName}</p>
                          <p><span className="font-semibold text-foreground/80">Rack:</span> {data.facility.rackIdentifier} (RU {data.facility.rackPosition})</p>
                        </div>
                        <div>
                          <p><span className="font-semibold text-foreground/80">Chassis:</span> {data.chassis.name}</p>
                          <p 
                            className="font-mono text-indigo-400 hover:underline cursor-pointer truncate"
                            onClick={() => onNavigate(data.chassis.uuid, 'hardware')}
                          >
                            {data.chassis.uuid}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderLinkDetail = (id: string) => {
    const ietfLink = getIETFLink(id);
    const link = getLink(id);

    // If it's a passive composite physical cable
    if (link && link._isPassiveCable) {
      const cable = link.passiveCable;
      return (
        <div className="space-y-6">
          <Card className="bg-background border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                 <GitCommit className="w-5 h-5 text-emerald-500" />
                 Passive Physical Cable: {cable.name || cable.id}
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-mono">
                 {cable.cableRole}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                 <div className="p-4 bg-muted/30 border border-border rounded-lg">
                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-1">Cable ID</p>
                   <p className="text-xs font-mono font-bold text-zinc-300">{cable.id}</p>
                 </div>
                 <div className="p-4 bg-muted/30 border border-border rounded-lg">
                   <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono mb-1">Cable Type</p>
                   <p className="text-xs font-bold text-zinc-300">{cable.cableType}</p>
                 </div>
                 <div className="p-4 bg-muted/30 border border-border rounded-lg">
                   <p className="text-[10px] text-zinc-405 uppercase tracking-widest font-mono mb-1">Total physical length</p>
                   <p className="text-xs font-mono text-zinc-300">{cable.length} m</p>
                 </div>
                 <div className="p-4 bg-muted/30 border border-border rounded-lg">
                   <p className="text-[10px] text-zinc-410 uppercase tracking-widest font-mono mb-1">Optical Attributes</p>
                   <div className="flex flex-wrap gap-1 mt-1">
                     <Badge variant="outline" className="text-[9px] bg-blue-500/10 text-blue-400 border-blue-500/20">{cable.opticalCable?.fiberType || 'G652D'}</Badge>
                     <Badge variant="outline" className="text-[9px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{cable.opticalCable?.fiberCoreNum || 2} Cores</Badge>
                   </div>
                 </div>
               </div>

               <Separator className="bg-muted" />

               <div>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-3 px-1">Topological Adjacency Endpoints</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                   {/* A-End Adjacency */}
                   <Card className="bg-muted/10 border-border shadow-none">
                     <CardHeader className="pb-2">
                       <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-[#10b981] flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse" />
                         Connection A-End ({cable.aEnd.deviceType})
                       </CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-2">
                       {cable.aEnd.deviceType === 'active-device' ? (
                         <>
                           <div className="flex justify-between border-b border-border/40 pb-1.5 text-xs font-mono">
                             <span className="text-muted-foreground">active ne-ref:</span>
                             <span 
                               className="text-emerald-400 font-bold hover:underline cursor-pointer font-sans"
                               onClick={() => cable.aEnd.neRef && onNavigate(cable.aEnd.neRef, 'device')}
                             >
                               {cable.aEnd.neRef}
                             </span>
                           </div>
                           <div className="flex justify-between text-xs font-mono">
                             <span className="text-muted-foreground">component-ref:</span>
                             <span 
                               className="text-blue-400 hover:underline cursor-pointer font-semibold"
                               onClick={() => cable.aEnd.neRef && onNavigate(`${cable.aEnd.neRef}/${cable.aEnd.componentRef || 'chassis-root'}`, 'port')}
                             >
                               {cable.aEnd.componentRef || 'chassis-root'}
                             </span>
                           </div>
                         </>
                       ) : (
                         <div className="flex justify-between text-xs font-mono">
                           <span className="text-muted-foreground">passive device-id:</span>
                           <span 
                             className="text-amber-400 font-bold hover:underline cursor-pointer"
                             onClick={() => cable.aEnd.deviceId && onNavigate(cable.aEnd.deviceId, 'device')}
                           >
                             {cable.aEnd.deviceId}
                           </span>
                         </div>
                       )}
                     </CardContent>
                   </Card>

                   {/* Z-End Adjacency */}
                   <Card className="bg-muted/10 border-border shadow-none">
                     <CardHeader className="pb-2">
                       <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-[#6366f1] flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 bg-[#6366f1] rounded-full animate-pulse" />
                         Connection Z-End ({cable.zEnd.deviceType})
                       </CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-2">
                       {cable.zEnd.deviceType === 'active-device' ? (
                         <>
                           <div className="flex justify-between border-b border-border/40 pb-1.5 text-xs font-mono">
                             <span className="text-muted-foreground">active ne-ref:</span>
                             <span 
                               className="text-indigo-400 font-bold hover:underline cursor-pointer font-sans"
                               onClick={() => cable.zEnd.neRef && onNavigate(cable.zEnd.neRef, 'device')}
                             >
                               {cable.zEnd.neRef}
                             </span>
                           </div>
                           <div className="flex justify-between text-xs font-mono">
                             <span className="text-muted-foreground">component-ref:</span>
                             <span 
                               className="text-blue-400 hover:underline cursor-pointer font-semibold"
                               onClick={() => cable.zEnd.neRef && onNavigate(`${cable.zEnd.neRef}/${cable.zEnd.componentRef || 'chassis-root'}`, 'port')}
                             >
                               {cable.zEnd.componentRef || 'chassis-root'}
                             </span>
                           </div>
                         </>
                       ) : (
                         <div className="flex justify-between text-xs font-mono">
                           <span className="text-muted-foreground">passive device-id:</span>
                           <span 
                             className="text-amber-400 font-bold hover:underline cursor-pointer"
                             onClick={() => cable.zEnd.deviceId && onNavigate(cable.zEnd.deviceId, 'device')}
                           >
                             {cable.zEnd.deviceId}
                           </span>
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 </div>
               </div>

               {/* Splice Concatenation Chain inside Details if present */}
               {cable.childCables && cable.childCables.length > 0 && (
                 <>
                   <Separator className="bg-muted" />
                   <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-3">Concatenated Spliced Segments Chain ({cable.childCables.length} cables)</p>
                     <div className="space-y-2">
                       {cable.childCables.map((child: any) => (
                         <div key={child.id} className="flex justify-between items-center p-3 rounded bg-muted/20 border border-border/40">
                           <div className="flex items-center gap-3">
                             <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                               {child.index}
                             </span>
                             <span 
                               className="text-xs font-mono hover:underline cursor-pointer font-semibold text-zinc-300"
                               onClick={() => onNavigate(child.id, 'link')}
                             >
                               {child.id}
                             </span>
                           </div>
                           <span className="text-xs text-zinc-400 font-mono">{child.length} m</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 </>
               )}
            </CardContent>
          </Card>

          {renderLinkEndpointsCabinetCard(
            cable.aEnd.neRef || cable.aEnd.deviceId || '',
            cable.zEnd.neRef || cable.zEnd.deviceId || ''
          )}
        </div>
      );
    }

    // If we have an IETF Link for this ID, use the rich display
    if (ietfLink) {
      const sourceNode = getIETFNode(ietfLink.sourceNodeUuid);
      const targetNode = getIETFNode(ietfLink.targetNodeUuid);

      // Determine QKD status based on naming conventions / data structure
      const isQKD = ietfLink.layer?.toLowerCase().includes('qkd') || 
                    ietfLink.uuid?.toLowerCase().includes('qkd') ||
                    ietfLink.uuid?.startsWith('ql') ||
                    ietfLink.sourceNodeUuid?.toLowerCase().startsWith('q') ||
                    ietfLink.targetNodeUuid?.toLowerCase().startsWith('q');

      // Determine if link utilizes Free-Space Optics (Laser / Satellite ISL or Backhaul)
      // Determine physical medium based on explicit database attributes
      const dbLinkType = ietfLink.inventoryMappingAttributes?.linkType;
      const isFSOLink = dbLinkType ? dbLinkType === 'free-space-optics' : (
                        ietfLink.uuid?.toLowerCase().includes('sat') ||
                        ietfLink.sourceNodeUuid?.toLowerCase().includes('sat') ||
                        ietfLink.targetNodeUuid?.toLowerCase().includes('sat')
                      );
      const isMicrowaveLink = dbLinkType ? dbLinkType === 'microwave' : (
                              ietfLink.uuid?.toLowerCase().includes('microwave') ||
                              ietfLink.sourceNodeUuid?.toLowerCase().includes('microwave') ||
                              ietfLink.targetNodeUuid?.toLowerCase().includes('microwave')
                            );
      const isLocalCable = sourceNode?.type === 'O_CU' || targetNode?.type === 'O_CU';

      // Trace upper overlay links supported by this optical/underlay link (US-26 Vertical relationship)
      const tracedOverlays = (() => {
        const overlays: { networkId: string, linkId: string, layerName: string }[] = [];
        const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
        for (const net of rfcNetworks) {
          if (net.links) {
            for (const l of net.links) {
              if (l.supportingLinks?.some(sl => sl.linkRef === ietfLink.uuid)) {
                overlays.push({ 
                  networkId: net.networkId, 
                  linkId: l.linkId,
                  layerName: net.networkTypes?.type || 'L3 IP Overlay'
                });
              }
            }
          }
        }
        return overlays;
      })();

      return (
        <div className="space-y-6">
          {/* Main Structural Link Card */}
          <Card className="bg-background border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Network className="w-5 h-5 text-purple-500" />
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Link: {ietfLink.uuid}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    ietf-network-topology / ietf-te-topology
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] font-mono tracking-wider uppercase">
                {ietfLink.layer} Layer
              </Badge>
            </CardHeader>

            {/* Inner Interactive Specification Custom Tabs */}
            <div className="flex border-b border-border px-6 bg-muted/15 flex-wrap gap-1">
              {[
                { id: 'core', label: 'Core Topology', icon: Info },
                { id: 'te_sla', label: 'TE & Metrics', icon: Activity },
                { id: 'verticals', label: 'Multilayer Mapping', icon: Layers },
                { id: 'otn', label: isLocalCable ? 'Direct Ethernet PHY' : isFSOLink ? 'FSO Laser PHY' : isMicrowaveLink ? 'Microwave PHY' : 'G.709 Transport', icon: Zap },
                ...(isQKD ? [{ id: 'qkd', label: 'QKD Cryptography', icon: ShieldCheck }] : [])
              ].map((tab) => {
                const IconComp = tab.icon;
                const isSelected = activeLinkTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveLinkTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3.5 px-4 text-xs font-mono font-medium border-b-2 transition-all -mb-px hover:text-foreground ${
                      isSelected 
                        ? 'border-purple-500 text-purple-400 bg-background/50' 
                        : 'border-transparent text-muted-foreground hover:border-border'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-400' : 'text-muted-foreground'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <CardContent className="pt-6">
              {/* TAB 1: CORE TOPOLOGY PROPERTIES */}
              {activeLinkTab === 'core' && (() => {
                const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
                
                const traceUnderlayLinks = (currentLink: any): any[] => {
                  const items: any[] = [];
                  if (currentLink.supportingLinks) {
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
                        const phys = networkTopology.links.find(l => l.uuid === sl.linkRef);
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

                const underlays = traceUnderlayLinks(ietfLink);
                const overlays = traceOverlayLinks(ietfLink.uuid);

                const allLinks = [
                  ...underlays.map(u => ({ ...u, isCurrent: false })),
                  { 
                    linkId: ietfLink.uuid, 
                    networkId: ietfLink._networkId || 'underlay-L0', 
                    layer: ietfLink.layer || 'L0-optical',
                    sourceNode: ietfLink.sourceNodeUuid,
                    sourceTp: ietfLink.sourcePortUuid,
                    destNode: ietfLink.targetNodeUuid,
                    destTp: ietfLink.targetPortUuid,
                    isCurrent: true
                  },
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
                sortedLinks.forEach(l => {
                  if (!seenLinks.has(l.linkId)) {
                    seenLinks.add(l.linkId);
                    uniqueLinks.push(l);
                  }
                });

                const matchedCable = NetworkService.getInstance().getPassiveCables().find(c => 
                  c.id === ietfLink.uuid || 
                  c.name === ietfLink.uuid ||
                  (c.aEnd.neRef === ietfLink.sourceNodeUuid && c.zEnd.neRef === ietfLink.targetNodeUuid) ||
                  (c.aEnd.neRef === ietfLink.targetNodeUuid && c.zEnd.neRef === ietfLink.sourceNodeUuid)
                );

                const connectedNodes = new Set<string>();
                connectedNodes.add(ietfLink.sourceNodeUuid);
                connectedNodes.add(ietfLink.targetNodeUuid);
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

                return (
                  <div className="space-y-6">
                    {/* Performance Indicators Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted/40 border border-border/85 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Link Identifier</p>
                        <p className="text-sm font-mono font-bold text-foreground/90 hover:underline cursor-pointer text-indigo-400" onClick={() => onNavigate(ietfLink.uuid, 'link')}>{ietfLink.uuid}</p>
                      </div>
                      <div className="p-4 bg-muted/40 border border-border/85 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Network Layer (TE)</p>
                        <p className="text-sm font-semibold text-purple-400">{ietfLink.layer}</p>
                      </div>
                      <div className="p-4 bg-muted/40 border border-border/85 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Max Capacity</p>
                        <p className="text-sm font-mono text-emerald-400 font-bold">{ietfLink.capacity}</p>
                      </div>
                      <div className="p-4 bg-muted/40 border border-border/85 rounded-lg">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono mb-1">Dynamic Utilization</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-zinc-805 rounded-full overflow-hidden bg-zinc-800">
                             <div className={`h-full ${ietfLink.usage > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${ietfLink.usage}%` }} />
                          </div>
                          <span className="text-xs font-mono font-bold text-foreground/90">{ietfLink.usage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Physical/Logical Media Type Mapping Detail */}
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-left">
                        <div className="p-2 bg-indigo-500/10 rounded border border-indigo-500/20">
                          <Database className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground font-sans">Underlying Physical Media Correlation</p>
                          <p className="text-muted-foreground font-mono mt-0.5">YANG Attribute: `inventory-mapping-attributes/link-type`</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono bg-indigo-500/10 text-indigo-400 border-indigo-500/20 uppercase text-[10px]">
                        {ietfLink.inventoryMappingAttributes?.linkType || 'optical-fiber'}
                      </Badge>
                    </div>

                    {/* Topological Adjacency Endpoints */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Share2 className="w-4 h-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Topological Adjacency Endpoints (Click to navigate)</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        {/* Connection End A */}
                        <Card className="bg-muted/10 border-border shadow-none hover:border-purple-500/35 transition-colors cursor-pointer group text-left" onClick={() => onNavigate(ietfLink.sourceNodeUuid, 'device')}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                              <span>Connection A-End</span>
                              <span className="text-purple-400 group-hover:underline font-mono">View Node</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-lg font-bold text-foreground group-hover:text-purple-400 transition-colors">{sourceNode?.name || ietfLink.sourceNodeUuid}</p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-1">UUID: {ietfLink.sourceNodeUuid}</p>
                            <div className="mt-4 p-3.5 bg-background rounded border border-border/80 group-hover:border-purple-500/20 transition-all">
                               <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 text-left">Termination Point (TP)</p>
                               <div className="text-sm font-mono text-[#60a5fa] hover:text-blue-300 font-bold hover:underline cursor-pointer flex items-center justify-between" onClick={(e) => { e.stopPropagation(); onNavigate(`${ietfLink.sourceNodeUuid}/${ietfLink.sourcePortUuid}`, 'port'); }}>
                                 {ietfLink.sourcePortUuid}
                                 <ExternalLink className="w-3.5 h-3.5" />
                               </div>

                               {/* Logicals Contained by Port */}
                               {(() => {
                                 const logicalPorts: { networkId: string; tpId: string; nodeId: string }[] = [];
                                 rfcNetworks.forEach(net => {
                                   net.nodes.forEach(rn => {
                                     if (rn.activeNeRef === ietfLink.sourceNodeUuid) {
                                       rn.terminationPoints?.forEach(tp => {
                                         if (tp.activePortRef === ietfLink.sourcePortUuid) {
                                           logicalPorts.push({ networkId: net.networkId, tpId: tp.tpId, nodeId: rn.nodeId });
                                         }
                                       });
                                     }
                                   });
                                 });
                                 if (logicalPorts.length === 0) return null;
                                 return (
                                   <div className="mt-3 pt-2.5 border-t border-border/40 space-y-1.5 text-left">
                                     <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Logicals Contained by Port:</p>
                                     {logicalPorts.map(lp => (
                                       <div key={lp.tpId} className="flex items-center justify-between text-[10px] font-mono text-indigo-400 group/link">
                                         <span 
                                           className="hover:underline cursor-pointer font-bold truncate pr-1"
                                           onClick={(e) => { e.stopPropagation(); onNavigate(`${lp.nodeId}/${lp.tpId}`, 'port'); }}
                                         >
                                           {lp.tpId}
                                         </span>
                                         <span className="text-[9px] text-zinc-500 shrink-0">({lp.networkId})</span>
                                       </div>
                                     ))}
                                   </div>
                                 );
                               })()}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Connection End Z */}
                        <Card className="bg-muted/10 border-border shadow-none hover:border-purple-500/35 transition-colors cursor-pointer group text-left" onClick={() => onNavigate(ietfLink.targetNodeUuid, 'device')}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                              <span>Connection Z-End</span>
                              <span className="text-purple-400 group-hover:underline font-mono">View Node</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-lg font-bold text-foreground group-hover:text-purple-400 transition-colors">{targetNode?.name || ietfLink.targetNodeUuid}</p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-1">UUID: {ietfLink.targetNodeUuid}</p>
                            <div className="mt-4 p-3.5 bg-background rounded border border-border/80 group-hover:border-purple-500/20 transition-all">
                               <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 text-left">Termination Point (TP)</p>
                               <div className="text-sm font-mono text-[#60a5fa] hover:text-blue-300 font-bold hover:underline cursor-pointer flex items-center justify-between" onClick={(e) => { e.stopPropagation(); onNavigate(`${ietfLink.targetNodeUuid}/${ietfLink.targetPortUuid}`, 'port'); }}>
                                 {ietfLink.targetPortUuid}
                                 <ExternalLink className="w-3.5 h-3.5" />
                               </div>

                               {/* Logicals Contained by Port */}
                               {(() => {
                                 const logicalPorts: { networkId: string; tpId: string; nodeId: string }[] = [];
                                 rfcNetworks.forEach(net => {
                                   net.nodes.forEach(rn => {
                                     if (rn.activeNeRef === ietfLink.targetNodeUuid) {
                                       rn.terminationPoints?.forEach(tp => {
                                         if (tp.activePortRef === ietfLink.targetPortUuid) {
                                           logicalPorts.push({ networkId: net.networkId, tpId: tp.tpId, nodeId: rn.nodeId });
                                         }
                                       });
                                     }
                                   });
                                 });
                                 if (logicalPorts.length === 0) return null;
                                 return (
                                   <div className="mt-3 pt-2.5 border-t border-border/40 space-y-1.5 text-left">
                                     <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Logicals Contained by Port:</p>
                                     {logicalPorts.map(lp => (
                                       <div key={lp.tpId} className="flex items-center justify-between text-[10px] font-mono text-indigo-400 group/link">
                                         <span 
                                           className="hover:underline cursor-pointer font-bold truncate pr-1"
                                           onClick={(e) => { e.stopPropagation(); onNavigate(`${lp.nodeId}/${lp.tpId}`, 'port'); }}
                                         >
                                           {lp.tpId}
                                         </span>
                                         <span className="text-[9px] text-zinc-500 shrink-0">({lp.networkId})</span>
                                       </div>
                                     ))}
                                   </div>
                                 );
                               })()}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Multilayer Transport Link Stack Hierarchy (directly shown on Core tab!) */}
                    <Card className="bg-background border-border shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                          <Layers className="w-5 h-5 text-indigo-400" />
                          Layered Transport Link Stack
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Vertical multilayer mapping tracing underlays and logical overlays for this link
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="relative border-l border-zinc-700 pl-6 ml-3 space-y-6">
                          
                          {/* Physical Cable (underlay floor) */}
                          {matchedCable && (
                            <div className="relative group text-left">
                              <span className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 border-emerald-500 bg-background flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              </span>
                              <div className="p-3 bg-muted/20 border border-border rounded-lg hover:border-emerald-500/35 transition-all">
                                <div className="flex items-center justify-between mb-1">
                                  <span 
                                    className="font-mono text-xs font-bold hover:underline cursor-pointer text-emerald-400"
                                    onClick={() => onNavigate(matchedCable.id, 'link')}
                                  >
                                    Cable: {matchedCable.id}
                                  </span>
                                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                                    Physical Fiber
                                  </Badge>
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono space-y-0.5">
                                  <p>Role: {matchedCable.cableRole || 'trunk-backhaul'}</p>
                                  <p>Cores: {matchedCable.opticalCable?.fiberCoreNum || 2} Cores ({matchedCable.opticalCable?.fiberType || 'OS2'})</p>
                                  <p>Length: {matchedCable.length} m</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Logical & Physical Links Stack */}
                          {uniqueLinks.map((link) => (
                            <div key={link.linkId} className="relative group text-left">
                              <span className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center ${
                                link.isCurrent ? 'border-purple-500 animate-pulse' : 'border-indigo-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  link.isCurrent ? 'bg-purple-500' : 'bg-indigo-400'
                                }`} />
                              </span>

                              <div className={`p-4 border rounded-lg transition-all ${
                                link.isCurrent 
                                  ? 'bg-purple-500/5 border-purple-500/35 hover:bg-purple-500/10' 
                                  : 'bg-muted/30 border-border hover:bg-muted/40 hover:border-indigo-500/20'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span 
                                    className={`font-mono text-xs font-bold hover:underline cursor-pointer ${
                                      link.isCurrent ? 'text-purple-400 font-extrabold' : 'text-indigo-400'
                                    }`}
                                    onClick={() => onNavigate(link.linkId, 'link')}
                                  >
                                    Link: {link.linkId}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {link.isCurrent && (
                                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[9px] uppercase font-bold tracking-wider animate-pulse">
                                        Active
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border-indigo-500/20 uppercase">
                                      {link.layer}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="space-y-1.5 text-[10.5px] text-muted-foreground font-mono">
                                  <p>Topology Domain: <span className="text-zinc-350">{link.networkId}</span></p>
                                  
                                  <div className="pt-1.5 border-t border-border/40 grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-[9px] text-zinc-500 uppercase">A-End Interface</p>
                                      <p>
                                        Node: <span className="text-zinc-300 hover:text-blue-400 hover:underline cursor-pointer" onClick={() => onNavigate(link.sourceNode, 'device')}>{link.sourceNode}</span>
                                      </p>
                                      <p>
                                        Port: <span className="text-[#60a5fa] hover:text-blue-300 hover:underline cursor-pointer font-bold" onClick={() => onNavigate(`${link.sourceNode}/${link.sourceTp}`, 'port')}>{link.sourceTp}</span>
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[9px] text-zinc-500 uppercase">Z-End Interface</p>
                                      <p>
                                        Node: <span className="text-zinc-300 hover:text-blue-400 hover:underline cursor-pointer" onClick={() => onNavigate(link.destNode, 'device')}>{link.destNode}</span>
                                      </p>
                                      <p>
                                        Port: <span className="text-[#60a5fa] hover:text-blue-300 hover:underline cursor-pointer font-bold" onClick={() => onNavigate(`${link.destNode}/${link.destTp}`, 'port')}>{link.destTp}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {supportedServices.length > 0 && (
                            <div className="relative group text-left">
                              <span className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 border-emerald-400 bg-background flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              </span>
                              
                              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-3">
                                <div>
                                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                    Supported Customer Services
                                  </p>
                                  <p className="text-[9px] text-muted-foreground">Logical client layer VPN overlays multiplexed over transport tunnels</p>
                                </div>

                                <div className="space-y-2">
                                  {supportedServices.map(svc => (
                                    <div 
                                      key={svc.id} 
                                      className="p-2.5 bg-background border border-border/80 rounded hover:border-emerald-500/30 hover:bg-muted/15 transition-all flex items-center justify-between cursor-pointer group"
                                      onClick={() => onNavigate(svc.id, 'service')}
                                    >
                                      <div>
                                        <p className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 group-hover:underline">{svc.name}</p>
                                        <p className="text-[9px] text-muted-foreground font-mono uppercase">ID: {svc.id} ({svc.type})</p>
                                      </div>
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">
                                        {svc.status}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              {/* TAB 2: TE TOPOLOGY & SLA METRICS */}
              {activeLinkTab === 'te_sla' && (
                <div className="space-y-6">
                  {/* Traffic Engineering Specs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    {/* Metrics Section */}
                    <Card className="bg-muted/15 border-border shadow-none">
                      <CardHeader className="pb-2 border-b border-border/80">
                        <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-purple-400" />
                          TE Metric Routing Costs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-mono">te-default-metric</span>
                          <span className="font-mono bg-muted py-1 px-2 border border-border rounded font-bold text-zinc-200">
                            {ietfLink.teMetrics?.defaultMetric ?? 'Not Configured'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-mono">te-administrative-group</span>
                          <span className="font-mono bg-muted py-1 px-2 border border-border rounded text-blue-400 font-bold">
                            {ietfLink.teMetrics?.administrativeGroup ?? 'Not Configured'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400 font-mono">routing-priority-level</span>
                          <span className="font-bold text-foreground">
                            {ietfLink.teMetrics?.priorityLevel ?? 'Not Configured'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Delay & Jitter Performance */}
                    <Card className="bg-muted/15 border-border shadow-none">
                      <CardHeader className="pb-2 border-b border-border/80">
                        <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          Dynamic SLA Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4 text-xs">
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground font-mono">one-way-delay (latency)</span>
                            <span className="font-bold font-mono text-indigo-400">
                              {ietfLink.teMetrics?.oneWayDelay ?? 'Not Configured'}
                            </span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full" 
                              style={{ 
                                width: (ietfLink.teMetrics && ietfLink.teMetrics.oneWayDelay)
                                  ? `${Math.min(100, parseFloat(ietfLink.teMetrics.oneWayDelay) * 8)}%` 
                                  : '0%' 
                              }} 
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground font-mono">delay-variation (jitter)</span>
                            <span className="font-bold font-mono text-emerald-400">
                              {ietfLink.teMetrics?.delayVariation ?? 'Not Configured'}
                            </span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full" 
                              style={{ 
                                width: (ietfLink.teMetrics && ietfLink.teMetrics.delayVariation)
                                  ? `${Math.min(100, parseFloat(ietfLink.teMetrics.delayVariation) * 100)}%` 
                                  : '0%' 
                              }} 
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">one-way-packet-loss</span>
                          <span className="font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-0.5 px-1.5 rounded text-[10px]">
                            {ietfLink.teMetrics?.packetLoss ?? 'Not Configured'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Protection Config */}
                    <Card className="bg-muted/15 border-border shadow-none">
                      <CardHeader className="pb-2 border-b border-border/80">
                        <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                          <ShieldCheck className={`w-4 h-4 ${isFSOLink ? 'text-fuchsia-400' : 'text-emerald-400'}`} />
                          protection & resiliency
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">protection-type</span>
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
                            {ietfLink.protection?.protectionType ?? 'Not Configured'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">dynamic-restoration</span>
                          <span className="font-semibold text-purple-400">
                            {ietfLink.protection?.dynamicRestoration ?? 'Not Configured'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">switchover-time</span>
                          <span className="font-mono text-zinc-300">
                            {ietfLink.protection?.switchoverTime ?? 'Not Configured'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* SRLGs Shared Risk Link Groups */}
                  <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-3 text-left">
                    <div>
                      <p className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        Shared Risk Link Groups (SRLGs)
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">YANG Attribute: `te-link-attributes/srlg/srlg-values` (RFC 8795)</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ietfLink.protection?.srlgs && ietfLink.protection.srlgs.length > 0 ? (
                        ietfLink.protection.srlgs.map(srlg => (
                          <div key={srlg} className="px-3 py-1.5 bg-background border border-border rounded text-xs font-mono text-indigo-400 font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            Group ID: {srlg}
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">Not Configured</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">SRLG identifiers specify physical routing conduits. High availability paths are strictly separated to verify disjoint risk profiles.</p>
                  </div>
                </div>
              )}

              {/* TAB 3: MULTILAYER AND VERTICAL MAPPING */}
              {activeLinkTab === 'verticals' && (() => {
                const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
                
                const traceUnderlayLinks = (currentLink: any): any[] => {
                  const items: any[] = [];
                  if (currentLink.supportingLinks) {
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
                        const phys = networkTopology.links.find(l => l.uuid === sl.linkRef);
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

                const underlays = traceUnderlayLinks(ietfLink);
                const overlays = traceOverlayLinks(ietfLink.uuid);

                const allLinks = [
                  ...underlays.map(u => ({ ...u, isCurrent: false })),
                  { 
                    linkId: ietfLink.uuid, 
                    networkId: ietfLink._networkId || 'underlay-L0', 
                    layer: ietfLink.layer || 'L0-optical',
                    sourceNode: ietfLink.sourceNodeUuid,
                    sourceTp: ietfLink.sourcePortUuid,
                    destNode: ietfLink.targetNodeUuid,
                    destTp: ietfLink.targetPortUuid,
                    isCurrent: true
                  },
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
                sortedLinks.forEach(l => {
                  if (!seenLinks.has(l.linkId)) {
                    seenLinks.add(l.linkId);
                    uniqueLinks.push(l);
                  }
                });

                const matchedCable = NetworkService.getInstance().getPassiveCables().find(c => 
                  c.id === ietfLink.uuid || 
                  c.name === ietfLink.uuid ||
                  (c.aEnd.neRef === ietfLink.sourceNodeUuid && c.zEnd.neRef === ietfLink.targetNodeUuid) ||
                  (c.aEnd.neRef === ietfLink.targetNodeUuid && c.zEnd.neRef === ietfLink.sourceNodeUuid)
                );

                const connectedNodes = new Set<string>();
                connectedNodes.add(ietfLink.sourceNodeUuid);
                connectedNodes.add(ietfLink.targetNodeUuid);
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

                return (
                  <div className="space-y-6 text-left">
                    <Card className="bg-background border-border shadow-none">
                      <CardHeader>
                        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                          <Layers className="w-5 h-5 text-indigo-400" />
                          Layered Transport Link Stack
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Vertical multilayer mapping tracing underlays and logical overlays for this link
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="relative border-l border-zinc-700 pl-6 ml-3 space-y-6">
                          
                          {matchedCable && (
                            <div className="relative group text-left">
                              <span className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 border-emerald-500 bg-background flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              </span>
                              <div className="p-3 bg-muted/20 border border-border rounded-lg hover:border-emerald-500/35 transition-all">
                                <div className="flex items-center justify-between mb-1">
                                  <span 
                                    className="font-mono text-xs font-bold hover:underline cursor-pointer text-emerald-400"
                                    onClick={() => onNavigate(matchedCable.id, 'link')}
                                  >
                                    Cable: {matchedCable.id}
                                  </span>
                                  <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                                    Physical Fiber
                                  </Badge>
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono space-y-0.5">
                                  <p>Role: {matchedCable.cableRole || 'trunk-backhaul'}</p>
                                  <p>Cores: {matchedCable.opticalCable?.fiberCoreNum || 2} Cores ({matchedCable.opticalCable?.fiberType || 'OS2'})</p>
                                  <p>Length: {matchedCable.length} m</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {uniqueLinks.map((link) => (
                            <div key={link.linkId} className="relative group text-left">
                              <span className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center ${
                                link.isCurrent ? 'border-purple-500 animate-pulse' : 'border-indigo-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  link.isCurrent ? 'bg-purple-500' : 'bg-indigo-400'
                                }`} />
                              </span>

                              <div className={`p-4 border rounded-lg transition-all ${
                                link.isCurrent 
                                  ? 'bg-purple-500/5 border-purple-500/35 hover:bg-purple-500/10' 
                                  : 'bg-muted/30 border-border hover:bg-muted/40 hover:border-indigo-500/20'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span 
                                    className={`font-mono text-xs font-bold hover:underline cursor-pointer ${
                                      link.isCurrent ? 'text-purple-400 font-extrabold' : 'text-indigo-400'
                                    }`}
                                    onClick={() => onNavigate(link.linkId, 'link')}
                                  >
                                    Link: {link.linkId}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {link.isCurrent && (
                                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[9px] uppercase font-bold tracking-wider animate-pulse">
                                        Active
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border-indigo-500/20 uppercase">
                                      {link.layer}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="space-y-1.5 text-[10.5px] text-muted-foreground font-mono">
                                  <p>Topology Domain: <span className="text-zinc-350">{link.networkId}</span></p>
                                  
                                  <div className="pt-1.5 border-t border-border/40 grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-[9px] text-zinc-500 uppercase">A-End Interface</p>
                                      <p>
                                        Node: <span className="text-zinc-300 hover:text-blue-400 hover:underline cursor-pointer" onClick={() => onNavigate(link.sourceNode, 'device')}>{link.sourceNode}</span>
                                      </p>
                                      <p>
                                        Port: <span className="text-[#60a5fa] hover:text-blue-300 hover:underline cursor-pointer font-bold" onClick={() => onNavigate(`${link.sourceNode}/${link.sourceTp}`, 'port')}>{link.sourceTp}</span>
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[9px] text-zinc-500 uppercase">Z-End Interface</p>
                                      <p>
                                        Node: <span className="text-zinc-300 hover:text-blue-400 hover:underline cursor-pointer" onClick={() => onNavigate(link.destNode, 'device')}>{link.destNode}</span>
                                      </p>
                                      <p>
                                        Port: <span className="text-[#60a5fa] hover:text-blue-300 hover:underline cursor-pointer font-bold" onClick={() => onNavigate(`${link.destNode}/${link.destTp}`, 'port')}>{link.destTp}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {supportedServices.length > 0 && (
                            <div className="relative group text-left">
                              <span className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 border-emerald-400 bg-background flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              </span>
                              
                              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-3">
                                <div>
                                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                    Supported Customer Services
                                  </p>
                                  <p className="text-[9px] text-muted-foreground">Logical client layer VPN overlays multiplexed over transport tunnels</p>
                                </div>

                                <div className="space-y-2">
                                  {supportedServices.map(svc => (
                                    <div 
                                      key={svc.id} 
                                      className="p-2.5 bg-background border border-border/80 rounded hover:border-emerald-500/30 hover:bg-muted/15 transition-all flex items-center justify-between cursor-pointer group"
                                      onClick={() => onNavigate(svc.id, 'service')}
                                    >
                                      <div>
                                        <p className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 group-hover:underline">{svc.name}</p>
                                        <p className="text-[9px] text-muted-foreground font-mono uppercase">ID: {svc.id} ({svc.type})</p>
                                      </div>
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">
                                        {svc.status}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              {/* TAB 4: OPTICAL PARAMETERS & FINE-GRAIN OTN OR FREE-SPACE OPTICS */}
              {activeLinkTab === 'otn' && (
                isFSOLink ? (
                  <div className="space-y-6">
                    {/* General FSO physical attributes cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                      <Card className="bg-muted/15 border-border shadow-none">
                        <CardHeader className="pb-2 border-b border-border/80">
                          <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                            Laser PHY Link Budget
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">optical-wavelength</span>
                            <span className="font-bold font-mono text-zinc-300">1550 nm (C-Band Optical)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">transmitter-power-tx</span>
                            <span className="font-mono text-fuchsia-400">+30.0 dBm (1.0 W)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">receiver-sensitivity-rx</span>
                            <span className="font-mono text-zinc-400">-38.5 dBm</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">free-space-path-loss</span>
                            <span className="font-mono text-rose-400 font-bold">-245.2 dB</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/15 border-border shadow-none">
                        <CardHeader className="pb-2 border-b border-border/80">
                          <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                            <Target className="w-4 h-4 text-cyan-400" />
                            PAT Tracking & Alignment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">pointing-error-offset</span>
                            <span className="font-mono text-[#10b981] font-bold">1.2 μrad (Goal &lt; 1.5)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">alignment-servo-status</span>
                            <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              LOCKED (Coarse & Fine)
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">doppler-shift-comp</span>
                            <span className="font-mono text-zinc-300">±24.6 GHz (LEO Orbit Dynamic)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">steering-mechanism</span>
                            <span className="font-semibold text-zinc-300">Fine Fast Steering Mirror (FSM)</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/15 border-border shadow-none">
                        <CardHeader className="pb-2 border-b border-border/80">
                          <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-400" />
                            Atmosphere & Framing
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">weather-scintillation-loss</span>
                            <span className="font-semibold text-zinc-300">
                              {ietfLink.uuid?.includes('SAT1-SAT2') || ietfLink.sourceNodeUuid?.includes('SAT') && ietfLink.targetNodeUuid?.includes('SAT') 
                                ? '0.00 dB (Vacuum/ISL)' 
                                : '3.85 dB (Sky Zenith)'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <span className="text-muted-foreground font-mono">standard-protocol</span>
                            <Badge variant="outline" className="text-[10px] font-mono bg-zinc-800 text-zinc-300 border-border">
                              CCSDS 141.0-B-1 (Optical)
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">forward-error-correction</span>
                            <span className="font-mono font-bold text-emerald-400">LDPC (15360, 8192)</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Interactive Alignment Phase Tracker Timeline */}
                    <div className="p-4 bg-muted/10 border border-border rounded-lg space-y-4 text-left">
                      <div>
                        <p className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Compass className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                          Pointing, Acquisition, & Tracking (PAT) System Live Sequence Tracker
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">YANG representation: `ietf-ntn-topology:laser-acquisition-sequence-parameters` (PAT state machine tracking)</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 max-w-5xl mx-auto pt-2">
                        {[
                          { step: 1, name: "Ephemeris Upload", status: "completed", desc: "Orbital coordinates injected to terminal" },
                          { step: 2, name: "Coarse Scanning", status: "completed", desc: "Wide spiral scanner searching wide FOV" },
                          { step: 3, name: "Beacon Detection", status: "completed", desc: "Focal Quad-Detector captures quadrant light" },
                          { step: 4, name: "Fine Alignment", status: "completed", desc: "FSM control active to center focal point" },
                          { step: 5, name: "Tracking Locked", status: "active", desc: "Continuously compensating LEO vibrations" }
                        ].map((p) => (
                          <div key={p.step} className={`p-3 rounded border text-left flex flex-col justify-between ${
                            p.status === 'active' 
                              ? 'bg-fuchsia-500/10 border-fuchsia-500 text-foreground text-zinc-200' 
                              : 'bg-zinc-900/40 border-emerald-500/20 text-zinc-300'
                          }`}>
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Phase #0{p.step}</span>
                                {p.status === 'completed' ? (
                                  <span className="text-[9px] text-[#10b981] font-mono font-bold">● COMPLETED</span>
                                ) : (
                                  <span className="text-[9px] text-fuchsia-400 font-mono font-bold animate-pulse">● TRACKING</span>
                                )}
                              </div>
                              <p className="text-xs font-bold mt-1 text-zinc-100">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{p.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator className="bg-muted" />

                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest mb-2 px-1">Laser Propagation telemetry</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                          <div className="p-3 bg-background rounded border border-border/60">
                            <p className="text-[10px] text-fuchsia-400 mb-1 font-bold">`laser-physical-telemetry` Details</p>
                            <p className="text-zinc-200">Terminal Laser Type: <span className="text-zinc-300 font-bold">fso-interfaces:coherent-erbium-carrier</span></p>
                            <p className="text-zinc-200 mt-1">Beam Divergence Angle: <span className="text-fuchsia-400 font-bold">20 μrad (narrow-divergence)</span></p>
                            <p className="text-zinc-200 mt-1">Bit Rate (Raw PRBS): <span className="text-emerald-400 font-bold">10.0 Gbps (Symbol-locked)</span></p>
                          </div>

                          <div className="p-3 bg-background rounded border border-border/60">
                            <p className="text-[10px] text-cyan-400 mb-1 font-bold">`tracking-servo-loop` Space Details</p>
                            <p className="text-zinc-200">Servo Sampling Rate: <span className="text-cyan-400 font-bold">5.0 kHz</span></p>
                            <p className="text-zinc-200 mt-1">Dynamic Jitter Variance: <span className="text-emerald-400 font-bold">0.14 μrad RMS</span></p>
                            <p className="text-zinc-355 mt-1 italic">Total Link Margin: +13.5 dB (Excellent propagation quality)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isLocalCable ? (
                  <div className="space-y-6 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Card 1: Physical Specifications */}
                      <Card className="bg-muted/15 border-border shadow-none">
                        <CardHeader className="pb-2 border-b border-border/80">
                          <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                            Physical Specifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">media-type</span>
                            <span className="font-bold font-mono text-zinc-300">Duplex OM4 Multi-mode Fiber</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">interface-type</span>
                            <span className="font-bold font-mono text-zinc-300">100GBASE-SR4 Ethernet PHY</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">connector-type</span>
                            <span className="font-mono text-zinc-300">LC-Duplex</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">center-wavelength</span>
                            <span className="font-mono text-zinc-400">850 nm</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">cable-jacket</span>
                            <span className="font-mono text-zinc-300">LSZH 2.0mm</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Card 2: Transceiver Diagnostics */}
                      <Card className="bg-muted/15 border-border shadow-none">
                        <CardHeader className="pb-2 border-b border-border/80">
                          <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            Transceiver Diagnostics (DOM)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">signal-lock-state</span>
                            <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              LOCKED (CDR / PLL)
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">laser-temperature</span>
                            <span className="font-mono text-emerald-400">41.5 °C (Normal)</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">tx-optical-power</span>
                            <span className="font-mono text-zinc-300">-1.2 dBm</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">rx-optical-power</span>
                            <span className="font-mono text-zinc-300">-2.4 dBm</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">supply-voltage</span>
                            <span className="font-mono text-zinc-400">3.32 V</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">bias-current</span>
                            <span className="font-mono text-zinc-300">6.8 mA</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Card 3: Rack Containment Details */}
                      <Card className="bg-muted/15 border-border shadow-none">
                        <CardHeader className="pb-2 border-b border-border/80">
                          <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-400" />
                            Facility Rack Containment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4 text-xs">
                          {sourceNode && (
                            <div className="space-y-1">
                              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">A-End Device (Source)</p>
                              <div className="pl-2 border-l border-purple-500/30">
                                <p className="font-bold text-zinc-200">
                                  Node: <span className="cursor-pointer hover:underline text-indigo-400 font-mono" onClick={() => onNavigate(sourceNode.uuid, 'device')}>{sourceNode.name}</span>
                                </p>
                                <p className="text-zinc-400">
                                  Site: <span className="text-zinc-300">{sourceNode.facilityLocation?.siteName || sourceNode.location}</span>
                                </p>
                                <p className="text-zinc-400">
                                  Facility: <span className="text-zinc-300">{sourceNode.facilityLocation?.buildingOrHut || 'Telco Hut'}</span>
                                </p>
                                <p className="text-zinc-400">
                                  Rack ID: <span className="text-zinc-300 font-mono">{sourceNode.facilityLocation?.rackIdentifier || 'N/A'}</span> (Position: {sourceNode.facilityLocation?.rackPosition || 1} U)
                                </p>
                              </div>
                            </div>
                          )}
                          {targetNode && (
                            <div className="space-y-1">
                              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Z-End Device (Target)</p>
                              <div className="pl-2 border-l border-blue-500/30">
                                <p className="font-bold text-zinc-200">
                                  Node: <span className="cursor-pointer hover:underline text-indigo-400 font-mono" onClick={() => onNavigate(targetNode.uuid, 'device')}>{targetNode.name}</span>
                                </p>
                                <p className="text-zinc-400">
                                  Site: <span className="text-zinc-350">{targetNode.facilityLocation?.siteName || targetNode.location}</span>
                                </p>
                                <p className="text-zinc-400">
                                  Facility: <span className="text-zinc-350">{targetNode.facilityLocation?.buildingOrHut || 'Telco Hut'}</span>
                                </p>
                                <p className="text-zinc-400">
                                  Rack ID: <span className="text-zinc-350 font-mono">{targetNode.facilityLocation?.rackIdentifier || 'N/A'}</span> (Position: {targetNode.facilityLocation?.rackPosition || 1} U)
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* General G.709 Transport attributes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                      <Card className="bg-muted/15 border-border shadow-none">
                        <CardHeader className="pb-2 border-b border-border/80">
                          <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                            Fiber Reach & Span
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">physical-span-distance</span>
                            <span className="font-bold font-mono text-zinc-300">{ietfLink.otnLink?.distance ? `${ietfLink.otnLink.distance} km` : '158.4 km'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">chromatic-dispersion</span>
                            <span className="font-mono text-zinc-400">1.82 ps / nm * km</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">total-optical-attenuation</span>
                            <span className="font-mono text-[#f59e0b] font-bold">18.52 dB</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/15 border-border shadow-none">
                        <CardHeader className="pb-2 border-b border-border/80">
                          <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-400" />
                            Tributary Slot Config
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-2 text-xs">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <span className="text-muted-foreground font-mono">tributary-slot-granularity</span>
                            <Badge variant="outline" className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border-blue-500/20">
                              tsg-1.25G
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">total-available-ts</span>
                            <span className="font-mono font-bold text-emerald-400">80 Slots</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-mono">allocated-payload-types</span>
                            <span className="font-semibold text-zinc-300">ODUflex / ODU2e</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/15 border-border shadow-none">
                        <CardHeader className="pb-2 border-b border-border/80">
                          <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-emerald-400" />
                            Client Signal Types
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-1.5 text-xs">
                          <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider mb-1">supported-client-signals</p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {['iana-if-type:ethernetCsmacd', 'client-signal:OTU2', 'client-signal:OTU4', 'client-signal:STM-64'].map(sig => (
                              <Badge key={sig} variant="outline" className="text-[9px] font-mono bg-zinc-800 text-zinc-300 border-border">
                                {sig}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Feature 43 fine-grain OTN tributary Timeslots Interactive Map Grid */}
                    <div className="p-4 bg-muted/10 border border-border rounded-lg space-y-4 text-left">
                      <div>
                        <p className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-emerald-400 animate-pulse" />
                          ITU-T G.709.1 / Feature 43 Interactive Timeslot Matrix View
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">YANG representation: `fgotn-list`/`fgts-range` (Unreserved vs Reserved Channels Map)</p>
                      </div>

                      {/* Interactive 80-Timeslots Grid */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-10 gap-1.5 max-w-4xl mx-auto">
                          {Array.from({ length: 80 }).map((_, index) => {
                            const slotNum = index + 1;
                            let colorClass = 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500';
                            let titleStr = `TS #${slotNum}: Unallocated`;
                            
                            if (slotNum <= 4) {
                              colorClass = 'bg-[#3b82f6] hover:bg-[#2563eb] text-white font-extrabold';
                              titleStr = `TS #${slotNum}: Reserved (fgODUflex - High-security Tunnel Link #1)`;
                            } else if (slotNum >= 5 && slotNum <= 12) {
                              colorClass = 'bg-[#10b981] hover:bg-[#059669] text-white';
                              titleStr = `TS #${slotNum}: Allocated / Unreserved (ODUflex Shared Trunk-Capacity)`;
                            } else if (slotNum >= 13 && slotNum <= 16) {
                              colorClass = 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white';
                              titleStr = `TS #${slotNum}: Reserved (Optical OTU2 Control-Plane transport)`;
                            } else if (slotNum >= 45 && slotNum <= 54) {
                              colorClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/35 hover:bg-rose-500/20';
                              titleStr = `TS #${slotNum}: Impaired / Fiber Strain Attenuation Testing`;
                            }

                            return (
                              <div 
                                key={slotNum} 
                                className={`aspect-square rounded border border-border/40 text-[9px] font-mono flex items-center justify-center cursor-pointer transition-all ${colorClass}`}
                                title={titleStr}
                              >
                                {slotNum}
                              </div>
                            );
                          })}
                        </div>

                        {/* Legend explanation */}
                        <div className="flex flex-wrap gap-4 text-[10px] font-mono pt-3 px-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 bg-[#3b82f6] rounded border border-border/20" />
                            <span className="text-muted-foreground">Reserved fgODUflex (Timeslots 1-4)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 bg-[#10b981] rounded border border-border/20" />
                            <span className="text-muted-foreground">Allocated / Unreserved (Timeslots 5-12)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 bg-[#8b5cf6] rounded border border-border/20" />
                            <span className="text-muted-foreground">Control-Plane Reserved (Timeslots 13-16)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 bg-zinc-800 rounded border border-border/25" />
                            <span className="text-muted-foreground font-mono">Unassigned Slots</span>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-muted" />

                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest mb-2 px-1">Fine-grain Bandwidth & Ts-Ranges</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                          <div className="p-3 bg-background rounded border border-border/60">
                            <p className="text-[10px] text-[#2563eb] mb-1 font-bold">`fgotn-list` Allocation Details</p>
                            <p className="text-zinc-200">ODU Type: <span className="text-zinc-300 font-bold">fgotn-types:fgODUflex</span></p>
                            <p className="text-zinc-200 mt-1">Allocated TS List: <span className="text-[#3b82f6] font-bold">1-4</span></p>
                            <p className="text-zinc-200 mt-1">Bandwidth allocation: <span className="text-emerald-400 font-bold">400 Mbps</span></p>
                          </div>

                          <div className="p-3 bg-background rounded border border-border/60">
                            <p className="text-[10px] text-purple-400 mb-1 font-bold">`fgts-range` Space details</p>
                            <p className="text-zinc-200">Reserved TS Space: <span className="text-[#8b5cf6] font-bold">1-4, 13-16</span></p>
                            <p className="text-zinc-200 mt-1">Unreserved TS Space: <span className="text-emerald-400 font-bold">5-12, 17-80</span></p>
                            <p className="text-zinc-350 mt-1 italic">Total Reserved: 8T / Unreserved: 72T</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* TAB 5: QKD SECURITY CRYPTOGRAPHY (ETSI GS QKD 018) */}
              {activeLinkTab === 'qkd' && isQKD && (
                <div className="space-y-6 text-left">
                  {/* QKD Performance Parameter cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-muted/15 border-border shadow-none">
                      <CardHeader className="pb-2 border-b border-border/80">
                        <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          Secure Key Output Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-1 text-xs">
                        <p className="text-2xl font-bold font-mono text-emerald-400">1.82 Mbps</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">YANG Attribute: `secret-key-rate`</p>
                        <p className="text-muted-foreground mt-2 font-mono">Dynamic secure key generation rate of BB84 phase encoder.</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/15 border-border shadow-none">
                      <CardHeader className="pb-2 border-b border-border/80">
                        <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-400" />
                          Quantum Bit Error Rate (QBER)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-1 text-xs">
                        <p className="text-2xl font-bold font-mono text-blue-400">1.45 %</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">YANG Attribute: `qber` (Threshold is 11%)</p>
                        <p className="text-emerald-400 font-bold mt-2 font-mono">● SECURE (Low phase shift drift)</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/15 border-border shadow-none">
                      <CardHeader className="pb-2 border-b border-border/80">
                        <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-400" />
                          Key Lifespan / Expiry
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-1 text-xs">
                        <p className="text-lg font-bold font-mono text-zinc-300">86,400 seconds</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">YANG Attribute: `key-lifetime`</p>
                        <p className="text-muted-foreground mt-2 font-mono">Crypto keys expire and re-generate on daily intervals.</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Cryptographic Algorithm details */}
                  <div className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                    <div>
                      <p className="text-xs font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        Quantum Cryptographic & Mechanical details (ETSI GS QKD 018)
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-1.5">
                        <p className="text-muted-foreground">Quantum Cipher: <span className="text-zinc-200 font-bold">One-Time-Pad (Vernam) / AES-155-GCM</span></p>
                        <p className="text-muted-foreground">Quantum Channel: <span className="text-zinc-200">1550nm Co-propagation Spliced Fiber Cores</span></p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-muted-foreground">Transceiver Model: <span className="text-zinc-200 font-bold">Tosh-QEnc Phase Encoder v4.13</span></p>
                        <p className="text-muted-foreground">Frequency Shift Drift: <span className="text-zinc-200">0.02 rad / hour (Stabilized)</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        {renderLinkEndpointsCabinetCard(
            ietfLink.sourceNodeUuid,
            ietfLink.targetNodeUuid
          )}
        </div>
      );
    }

    // Fallback to basic link view if IETF data is not available
    if (!link) return <div className="text-sm text-muted-foreground">Link not found</div>;

    return (
      <div className="space-y-6">
        <Card className="bg-background border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Link Properties</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Capacity</p>
                <p className="text-lg font-bold text-foreground/90">{link.capacity}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Latency</p>
                <p className="text-lg font-bold text-foreground/90">{link.latency}</p>
              </div>
            </div>
            <div className="p-4 bg-muted/30 border border-border rounded-lg flex items-center justify-center">
              <Network className="w-12 h-12 text-zinc-800" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-background border-border shadow-none cursor-pointer hover:border-blue-500/30 transition-colors" onClick={() => onNavigate(link.source, 'device')}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Router className="w-3 h-3" />
                Source Device
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{link.source}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">Endpoint: {link.source_endpoint}</p>
            </CardContent>
          </Card>

          <Card className="bg-background border-border shadow-none cursor-pointer hover:border-blue-500/30 transition-colors" onClick={() => onNavigate(link.target, 'device')}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Router className="w-3 h-3" />
                Target Device
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{link.target}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">Endpoint: {link.target_endpoint}</p>
            </CardContent>
          </Card>
        </div>

        {renderLinkEndpointsCabinetCard(link.source, link.target)}
      </div>
    );
  };

  const renderSubComponentDetail = (id: string, type: string) => {
    let parentNode: ReturnType<typeof getIETFNode> = undefined;
    let leafData: any = null;

    if (type === 'port' || type === 'channel') {
      const firstSlashIdx = id.indexOf('/');
      const parts = firstSlashIdx !== -1 ? [id.substring(0, firstSlashIdx), id.substring(firstSlashIdx + 1)] : [id];
      if (parts.length === 2) {
        parentNode = getIETFNode(parts[0]);
        leafData = parentNode?.ietfInterfaces?.find(i => i.name === parts[1]);
      }
      if (!leafData) {
        for (const n of networkTopology.nodes) {
          const found = n.ietfInterfaces?.find(i => i.name === id);
          if (found) {
            parentNode = n;
            leafData = found;
            break;
          }
        }
      }
    } else if (type === 'hardware') {
      for (const n of networkTopology.nodes) {
        const found = n.hardware?.find(h => h.uuid === id);
        if (found) {
          parentNode = n;
          leafData = found;
          break;
        }
      }
    } else if (type === 'acl') {
      const firstSlashIdx = id.indexOf('/');
      const parts = firstSlashIdx !== -1 ? [id.substring(0, firstSlashIdx), id.substring(firstSlashIdx + 1)] : [id];
      if (parts.length === 2) {
        parentNode = getIETFNode(parts[0]);
        leafData = parentNode?.ietfAccessControlList?.find(a => a.name === parts[1]);
      }
      if (!leafData) {
        for (const n of networkTopology.nodes) {
          const found = n.ietfAccessControlList?.find(a => a.name === id);
          if (found) {
            parentNode = n;
            leafData = found;
            break;
          }
        }
      }
    }

    if ((type === 'port' || type === 'channel') && !leafData) {
      const firstSlashIdx = id.indexOf('/');
      const parts = firstSlashIdx !== -1 ? [id.substring(0, firstSlashIdx), id.substring(firstSlashIdx + 1)] : [id];
      const targetNodeId = parts[0];
      const targetTpId = parts.length === 2 ? parts[1] : id;

      const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
      for (const net of rfcNetworks) {
        for (const rn of net.nodes) {
          if (rn.nodeId === targetNodeId || rn.name === targetNodeId) {
            const foundTp = rn.terminationPoints?.find(tp => tp.tpId === targetTpId || tp.tpId.endsWith(targetTpId));
            if (foundTp) {
              parentNode = {
                uuid: rn.nodeId,
                name: rn.name || rn.nodeId,
                type: 'LOGICAL_ROUTER',
                layer: net.networkTypes?.type as any || NetworkLayer.L3_IP_MPLS,
                location: 'Logical Topology',
                activeNeRef: rn.activeNeRef,
                hardware: [],
                services: []
              } as any;
              leafData = {
                name: foundTp.tpId,
                type: 'ietf-l3-unicast-topology:l3-termination-point',
                enabled: true,
                adminStatus: 'up',
                operStatus: 'up',
                ipAddress: foundTp.ipAddress,
                opticalChannelFreqGhz: foundTp.opticalChannelFreqGhz,
                opticalChannelWavelengthNm: foundTp.opticalChannelWavelengthNm || (foundTp.opticalChannelFreqGhz ? 299792.458 / foundTp.opticalChannelFreqGhz : undefined),
                otnLinkTp: foundTp.otnLinkTp,
                activePortRef: foundTp.activePortRef,
                supportingTerminationPoints: foundTp.supportingTerminationPoints,
                networkId: net.networkId
              };
              break;
            }
          }
        }
        if (leafData) break;
      }
      
      if (!leafData) {
        for (const net of rfcNetworks) {
          for (const rn of net.nodes) {
            const foundTp = rn.terminationPoints?.find(tp => tp.tpId === targetTpId || tp.tpId.endsWith(targetTpId));
            if (foundTp) {
              parentNode = {
                uuid: rn.nodeId,
                name: rn.name || rn.nodeId,
                type: 'LOGICAL_ROUTER',
                layer: net.networkTypes?.type as any || NetworkLayer.L3_IP_MPLS,
                location: 'Logical Topology',
                activeNeRef: rn.activeNeRef,
                hardware: [],
                services: []
              } as any;
              leafData = {
                name: foundTp.tpId,
                type: 'ietf-l3-unicast-topology:l3-termination-point',
                enabled: true,
                adminStatus: 'up',
                operStatus: 'up',
                ipAddress: foundTp.ipAddress,
                opticalChannelFreqGhz: foundTp.opticalChannelFreqGhz,
                opticalChannelWavelengthNm: foundTp.opticalChannelWavelengthNm || (foundTp.opticalChannelFreqGhz ? 299792.458 / foundTp.opticalChannelFreqGhz : undefined),
                otnLinkTp: foundTp.otnLinkTp,
                activePortRef: foundTp.activePortRef,
                supportingTerminationPoints: foundTp.supportingTerminationPoints,
                networkId: net.networkId
              };
              break;
            }
          }
          if (leafData) break;
        }
      }
    }

    if (!leafData) {
      return (
        <Card className="bg-background border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground capitalize">{type} Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80">Information for {type} <strong className="font-mono">{id}</strong> not found in topology.</p>
          </CardContent>
        </Card>
      );
    }

    if (type === 'port' || type === 'channel') {
      return (
        <div className="space-y-6">
          <Card className="bg-background border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                 <Network className="w-5 h-5 text-emerald-500" />
                 Interface: {leafData.name}
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase tracking-widest">{leafData.operStatus}</Badge>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/40 rounded border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Parent Node</p>
                  <p className="text-sm font-bold text-foreground/90 hover:text-blue-400 cursor-pointer hover:underline" onClick={() => parentNode && onNavigate(parentNode.uuid, 'device')}>{parentNode?.name || 'Unknown'}</p>
                </div>
                <div className="p-4 bg-muted/40 rounded border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Type</p>
                  <p className="text-sm font-mono text-foreground/80">{leafData.type.replace('iana-if-type:', '')}</p>
                </div>
                <div className="p-4 bg-muted/40 rounded border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Speed</p>
                  <p className="text-sm font-mono text-foreground/80">{leafData.speed ? `${(leafData.speed / 1000000000).toFixed(1)} Gbps` : 'Unknown'}</p>
                </div>
                {leafData.ipAddress ? (
                  <div className="p-4 bg-emerald-500/5 rounded border border-emerald-500/20">
                    <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono mb-1">IP Address</p>
                    <p className="text-sm font-mono font-bold text-emerald-400">{leafData.ipAddress}</p>
                  </div>
                ) : leafData.opticalChannelFreqGhz ? (
                  <div className="p-4 bg-blue-500/5 rounded border border-blue-500/20">
                    <p className="text-[10px] text-blue-400 uppercase tracking-widest font-mono mb-1">Optical Coordinates</p>
                    <p className="text-sm font-mono font-bold text-blue-400">
                      {leafData.opticalChannelFreqGhz} GHz
                      {leafData.opticalChannelWavelengthNm && ` (${Number(leafData.opticalChannelWavelengthNm).toFixed(2)} nm)`}
                    </p>
                  </div>
                ) : leafData.otnLinkTp ? (
                  <div className="p-4 bg-indigo-500/5 rounded border border-indigo-500/20">
                    <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono mb-1">OTN Transport Configuration</p>
                    <p className="text-xs font-mono font-bold text-indigo-300">
                      TSG: {leafData.otnLinkTp.tsg || 'N/A'}
                      {leafData.otnLinkTp.supportedClientSignal && leafData.otnLinkTp.supportedClientSignal.length > 0 && (
                        <span className="block text-[10px] text-zinc-400 mt-1">
                          Client Signals: {leafData.otnLinkTp.supportedClientSignal.map((cs: any) => cs.clientSignal.replace('iana-if-type:', '')).join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/40 rounded border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Physical Address</p>
                    <p className="text-sm font-mono text-foreground/80">
                      {leafData.physAddress || (() => {
                        if (parentNode && (parentNode as any).activeNeRef && leafData.activePortRef) {
                          const physNode = networkTopology.nodes.find(n => n.uuid === (parentNode as any).activeNeRef);
                          const physIface = physNode?.ietfInterfaces?.find(i => i.name === leafData.activePortRef);
                          return physIface?.physAddress;
                        }
                        return null;
                      })() || 'N/A'}
                    </p>
                  </div>
                )}
              </div>

              {parentNode && (parentNode as any).activeNeRef && leafData.activePortRef && (
                <div className="p-4 border border-border rounded-lg bg-muted/20 text-left space-y-3">
                  <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-blue-400" />
                    Underlay Physical Port Association
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-background rounded border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Physical Node Ref</p>
                      <p 
                        className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer select-all animate-fadeIn"
                        onClick={() => onNavigate((parentNode as any).activeNeRef, 'device')}
                      >
                        {(parentNode as any).activeNeRef}
                      </p>
                    </div>
                    <div className="p-3 bg-background rounded border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Physical Port Ref</p>
                      <p 
                        className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer select-all animate-fadeIn"
                        onClick={() => onNavigate(`${(parentNode as any).activeNeRef}/${leafData.activePortRef}`, 'port')}
                      >
                        {leafData.activePortRef}
                      </p>
                    </div>
                    <div className="p-3 bg-background rounded border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Physical MAC Address</p>
                      <p className="text-xs font-mono font-bold text-foreground/80">
                        {(() => {
                          const physNode = networkTopology.nodes.find(n => n.uuid === (parentNode as any).activeNeRef);
                          const physIface = physNode?.ietfInterfaces?.find(i => i.name === leafData.activePortRef);
                          return physIface?.physAddress || 'N/A';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg bg-background">
                  <p className="font-bold text-sm mb-4 flex items-center gap-2"><SettingsIcon className="w-4 h-4 text-muted-foreground" /> State</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Admin Status</span>
                      <Badge variant="outline" className={leafData.adminStatus === 'up' ? 'text-emerald-500 border-emerald-500/20' : 'text-red-500 border-red-500/20'}>{leafData.adminStatus}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Oper Status</span>
                      <Badge variant="outline" className={leafData.operStatus === 'up' ? 'text-emerald-500 border-emerald-500/20' : 'text-amber-500 border-amber-500/20'}>{leafData.operStatus}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Enabled</span>
                      <span className="text-xs font-mono">{leafData.enabled ? 'True' : 'False'}</span>
                    </div>
                  </div>
                </div>

                {leafData.statistics && (
                  <div className="p-4 border border-border rounded-lg bg-background">
                    <p className="font-bold text-sm mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Statistics</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Traffic (In/Out)</span>
                        <span className="text-xs font-mono">{(leafData.statistics.inOctets / 1024 / 1024).toFixed(1)}M / {(leafData.statistics.outOctets / 1024 / 1024).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Unicast Pkts (In/Out)</span>
                        <span className="text-xs font-mono">{leafData.statistics.inUnicastPkts} / {leafData.statistics.outUnicastPkts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Errors (In/Out)</span>
                        <span className="text-xs font-mono text-red-400">{leafData.statistics.inErrors} / {leafData.statistics.outErrors}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logical TP Stack Card */}
          {(() => {
            const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
            const parentNodeUuid = parentNode?.uuid || '';
            const portName = leafData.name;

            const logicalStack: {
              networkId: string;
              networkType: string;
              nodeId: string;
              tpId: string;
              supportingTPs?: any[];
              ipAddress?: string;
            }[] = [];

            rfcNetworks.forEach(net => {
              net.nodes.forEach(rn => {
                if (rn.activeNeRef === parentNodeUuid) {
                  rn.terminationPoints?.forEach(tp => {
                    if (tp.activePortRef === portName) {
                      logicalStack.push({
                        networkId: net.networkId,
                        networkType: net.networkTypes?.type || 'logical',
                        nodeId: rn.nodeId,
                        tpId: tp.tpId,
                        supportingTPs: tp.supportingTerminationPoints,
                        ipAddress: tp.ipAddress
                      });
                    }
                  });
                }
              });
            });

            const findOverlays = (networkId: string, nodeId: string, tpId: string) => {
              const overlays: typeof logicalStack = [];
              rfcNetworks.forEach(net => {
                net.nodes.forEach(rn => {
                  rn.terminationPoints?.forEach(tp => {
                    const matches = tp.supportingTerminationPoints?.some(s => 
                      s.networkRef === networkId &&
                      s.nodeRef === nodeId &&
                      s.tpRef === tpId
                    );
                    if (matches) {
                      overlays.push({
                        networkId: net.networkId,
                        networkType: net.networkTypes?.type || 'logical',
                        nodeId: rn.nodeId,
                        tpId: tp.tpId,
                        supportingTPs: tp.supportingTerminationPoints,
                        ipAddress: tp.ipAddress
                      });
                      overlays.push(...findOverlays(net.networkId, rn.nodeId, tp.tpId));
                    }
                  });
                });
              });
              return overlays;
            };

            const allStackItems = [...logicalStack];
            logicalStack.forEach(item => {
              allStackItems.push(...findOverlays(item.networkId, item.nodeId, item.tpId));
            });

            const uniqueStackItems: typeof logicalStack = [];
            const seenTps = new Set<string>();
            allStackItems.forEach(item => {
              if (!seenTps.has(item.tpId)) {
                seenTps.add(item.tpId);
                uniqueStackItems.push(item);
              }
            });

            if (uniqueStackItems.length === 0) return null;

            return (
              <Card className="bg-background border-border shadow-none">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Logical Termination Point (TP) Stack
                  </CardTitle>
                  <p className="text-xs text-muted-foreground text-left">
                    Encapsulation layers riding on physical port {portName} across RFC 8345 topologies
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative border-l border-zinc-700 pl-6 ml-3 space-y-6">
                    {uniqueStackItems.map((item) => (
                      <div key={item.tpId} className="relative group text-left">
                        <span className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 border-indigo-400 bg-background flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        </span>

                        <div className="p-4 bg-muted/30 border border-border rounded-lg hover:border-indigo-500/35 hover:bg-muted/50 transition-all text-left">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <span 
                              className="font-mono text-xs font-extrabold hover:text-blue-400 hover:underline cursor-pointer text-[#60a5fa]"
                              onClick={() => onNavigate(`${item.nodeId}/${item.tpId}`, 'port')}
                            >
                              {item.tpId}
                            </span>
                            <Badge variant="outline" className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border-indigo-500/20 uppercase">
                              {item.networkType} Layer
                            </Badge>
                          </div>

                          <div className="space-y-1 text-[10.5px] text-muted-foreground font-mono">
                            {item.ipAddress && (
                              <p>
                                <span className="text-zinc-500 font-bold">IP Address:</span>{' '}
                                <span className="text-emerald-400 font-extrabold">{item.ipAddress}</span>
                              </p>
                            )}
                            <p>
                              <span>Network ID:</span>{' '}
                              <span className="text-zinc-350">{item.networkId}</span>
                            </p>
                            <p>
                              <span>Logical Node:</span>{' '}
                              <span 
                                className="text-zinc-350 hover:text-blue-400 hover:underline cursor-pointer"
                                onClick={() => onNavigate(item.nodeId, 'device')}
                              >
                                {item.nodeId}
                              </span>
                            </p>
                            {item.supportingTPs && item.supportingTPs.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
                                <p className="text-[9px] uppercase tracking-wider text-zinc-500">Rides on Underlay TPs:</p>
                                {item.supportingTPs.map((s: any) => (
                                  <div key={s.tpRef} className="flex items-center gap-1.5 text-[10px] text-indigo-400">
                                    <span 
                                      className="hover:underline cursor-pointer"
                                      onClick={() => onNavigate(`${s.nodeRef}/${s.tpRef}`, 'port')}
                                    >
                                      {s.tpRef}
                                    </span>
                                    <span className="text-zinc-500">({s.networkRef})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {parentNode && renderCabinetLocationAndChassisCard(parentNode.uuid)}
        </div>
      );
    }

    if (type === 'hardware') {
      const generateFallbackMac = (nodeId: string, portName: string): string => {
        let hash = 0;
        const combined = `${nodeId}-${portName}`;
        for (let i = 0; i < combined.length; i++) {
          hash = combined.charCodeAt(i) + ((hash << 5) - hash);
        }
        const octets = ['00', '1A', '2B'];
        for (let i = 0; i < 3; i++) {
          const val = (hash >> (i * 8)) & 255;
          octets.push(val.toString(16).padStart(2, '0').toUpperCase());
        }
        return octets.join(':');
      };

      const matchedIface = leafData.class === 'port' && parentNode?.ietfInterfaces
        ? parentNode.ietfInterfaces.find((iface: any) => {
            const normalizedName = iface.name.replace('/', '-');
            return leafData.uuid.endsWith(`-${normalizedName}`) || leafData.uuid.endsWith(`/${iface.name}`) || leafData.uuid === normalizedName;
          })
        : undefined;

      const childTransceiver = parentNode?.hardware?.find(
        (h: any) => h.class === 'transceiver' && h.parentUuid === leafData.uuid
      );

      const isFixedPort = leafData.name.includes('Local Backhaul') || 
                          leafData.name.includes('Fixed') || 
                          leafData.name.includes('Microwave') || 
                          leafData.name.includes('FSO');

      const isSfpPresent = matchedIface
        ? (matchedIface.adminStatus === 'up')
        : !!childTransceiver;

      let resolvedMac = 'N/A';
      let macSource = '';

      if (isFixedPort) {
        resolvedMac = matchedIface?.physAddress || (parentNode ? generateFallbackMac(parentNode.uuid, leafData.name) : 'N/A');
        macSource = 'Burnt-in ASIC MAC Address';
      } else {
        if (isSfpPresent) {
          resolvedMac = matchedIface?.physAddress || (parentNode ? generateFallbackMac(parentNode.uuid, leafData.name) : 'N/A');
          macSource = `SFP Transceiver Sourced MAC Address (${childTransceiver?.name || 'Active SFP Transceiver'})`;
        } else {
          resolvedMac = 'No Link - No SFP Plugged In';
          macSource = 'Empty SFP Cage / Port Administratively Down';
        }
      }

      return (
        <div className="space-y-6">
          <Card className="bg-background border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                 <Cpu className="w-5 h-5 text-amber-500" />
                 Hardware: {leafData.name}
              </CardTitle>
              <Badge variant="outline" className={leafData.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase tracking-widest' : 'bg-red-500/10 text-red-400 border-red-500/20 uppercase tracking-widest'}>{leafData.status}</Badge>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/40 rounded border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Parent Node</p>
                  <p className="text-sm font-bold text-foreground/90 hover:text-blue-400 cursor-pointer hover:underline" onClick={() => parentNode && onNavigate(parentNode.uuid, 'device')}>{parentNode?.name || 'Unknown'}</p>
                </div>
                <div className="p-4 bg-muted/40 rounded border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Class</p>
                  <p className="text-sm font-mono uppercase text-foreground/80">{leafData.class}</p>
                </div>
                <div className="p-4 bg-muted/40 rounded border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">UUID</p>
                  <p className="text-xs font-mono text-foreground/80 hover:underline cursor-pointer text-indigo-400" onClick={() => onNavigate(leafData.uuid, 'hardware')}>{leafData.uuid}</p>
                </div>
                {leafData.parentUuid && (
                  <div className="p-4 bg-muted/40 rounded border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Parent Hardware UUID</p>
                    <p className="text-xs font-mono text-foreground/80 hover:text-blue-400 cursor-pointer hover:underline" onClick={() => onNavigate(leafData.parentUuid, 'hardware')}>{leafData.parentUuid}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 flex flex-col gap-2 border border-border rounded-lg bg-background">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Manufacturer</p>
                  <p className="text-lg font-bold text-foreground/90">{leafData.manufacturer || 'N/A'}</p>
                </div>
                <div className="p-4 flex flex-col gap-2 border border-border rounded-lg bg-background">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Part Number</p>
                  <p className="text-lg font-mono text-foreground/90">{leafData.partNumber || 'N/A'}</p>
                </div>
                {leafData.serialNumber && (
                  <div className="p-4 flex flex-col gap-2 border border-border rounded-lg bg-background col-span-1 md:col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Serial Number</p>
                    <p className="text-md font-mono text-foreground/90">{leafData.serialNumber}</p>
                  </div>
                )}
              </div>

              {leafData.class === 'port' && matchedIface && (
                <div className="p-4 border border-border rounded-lg bg-muted/20 text-left space-y-3">
                  <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-blue-400" />
                    IETF Interface & SFP Transceiver Status
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    <div className="p-3 bg-background rounded border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Associated Interface</p>
                      <p 
                        className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer select-all"
                        onClick={() => parentNode && onNavigate(`${parentNode.uuid}/${matchedIface.name}`, 'port')}
                      >
                        {matchedIface.name}
                      </p>
                    </div>
                    <div className="p-3 bg-background rounded border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">SFP Transceiver Status</p>
                      <p className={`text-xs font-mono font-bold ${isSfpPresent ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {isFixedPort ? 'Fixed ASIC Port (No SFP Cage)' : (isSfpPresent ? 'Plugged In / Active SFP' : 'Empty Slot (No SFP Plugged In)')}
                      </p>
                      {childTransceiver && (
                        <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{childTransceiver.name} (S/N: {childTransceiver.serialNumber})</p>
                      )}
                    </div>
                    <div className="p-3 bg-background rounded border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Physical MAC Address</p>
                      <p className={`text-xs font-mono font-bold ${resolvedMac.startsWith('00:') ? 'text-foreground/90' : 'text-zinc-500'}`}>
                        {resolvedMac}
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{macSource}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <GeoLocationCard 
            title="ietf-geo-location (Hardware Component)"
            geoLocation={leafData.ietfGeoLocation}
            inheritedFrom={leafData.ietfGeoLocation ? undefined : (parentNode ? `${parentNode.name} (Parent Element)` : undefined)}
            onSave={(locationObj) => {
              if (parentNode) {
                NetworkService.getInstance().updateComponentGeoLocation(parentNode.uuid, leafData.uuid, locationObj);
                setRefreshKey(prev => prev + 1);
              }
            }}
          />

          {parentNode && renderCabinetLocationAndChassisCard(parentNode.uuid)}
        </div>
      );
    }

    if (type === 'acl') {
      return (
        <div className="space-y-6">
          <Card className="bg-background border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-rose-500" />
                 ACL: {leafData.name}
              </CardTitle>
              <Badge variant="outline" className={leafData.actions.forwarding === 'accept' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase tracking-widest' : 'bg-red-500/10 text-red-500 border-red-500/20 uppercase tracking-widest'}>
                {leafData.actions.forwarding}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-muted/20 border border-border rounded-lg">
                  <p className="font-bold text-sm mb-4 text-foreground/80 flex items-center gap-2"><Target className="w-4 h-4" /> Match Conditions</p>
                  <div className="p-4 bg-muted/40 font-mono text-sm text-foreground/90 border border-border/50 rounded">
                    {leafData.matches}
                  </div>
                </div>
                <div className="p-6 bg-muted/20 border border-border rounded-lg flex flex-col gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Parent Node</p>
                    <p className="text-sm font-bold text-foreground/90 hover:text-blue-400 cursor-pointer hover:underline" onClick={() => parentNode && onNavigate(parentNode.uuid, 'device')}>{parentNode?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Logging Rule</p>
                    <p className="text-sm font-mono text-foreground/80">{leafData.actions.logging || 'none'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {parentNode && renderCabinetLocationAndChassisCard(parentNode.uuid)}
        </div>
      );
    }

    // Default fallback
    return (
      <Card className="bg-background border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground capitalize">{type} Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80">Information for {type} <strong className="font-mono">{id}</strong>.</p>
          <p className="text-xs text-muted-foreground mt-4">This specific resource component is being inspected.</p>
        </CardContent>
      </Card>
    );
  };

  const getTitle = () => {
    switch (item.type) {
      case 'device': return getIETFNode(item.id)?.name || getDevice(item.id)?.name || item.id;
      case 'link': return `Link: ${item.id}`;
      case 'service': return getService(item.id)?.name || item.id;
      case 'slice': return getSlice(item.id)?.name || item.id;
      case 'port': return `Port: ${item.id}`;
      case 'hardware': return `Hardware: ${item.id}`;
      case 'channel': return `Channel: ${item.id}`;
      case 'acl': return `ACL: ${item.id}`;

    }
  };

  const getIcon = () => {
    switch (item.type) {
      case 'device': return <Router className="w-6 h-6 text-blue-500" />;
      case 'link': return <Share2 className="w-6 h-6 text-purple-500" />;
      case 'service': return <Activity className="w-6 h-6 text-emerald-500" />;
      case 'slice': return <Layers className="w-6 h-6 text-orange-500" />;
      case 'port': return <Network className="w-6 h-6 text-emerald-500" />;
      case 'hardware': return <Cpu className="w-6 h-6 text-amber-500" />;
      case 'channel': return <Zap className="w-6 h-6 text-yellow-500" />;
      case 'acl': return <ShieldCheck className="w-6 h-6 text-rose-500" />;

    }
  };

  const getCurrentItemData = () => {
    switch (item.type) {
      case 'device': return getIETFNode(item.id) || getDevice(item.id);
      case 'link': return getIETFLink(item.id) || getLink(item.id);
      case 'service': return getService(item.id);
      case 'slice': return getSlice(item.id);
      case 'port': 
      case 'hardware':
      case 'channel':
      case 'acl':
        let resData = null;
        if (item.type === 'port' || item.type === 'channel') {
          const firstSlashIdx = item.id.indexOf('/');
          const parts = firstSlashIdx !== -1 ? [item.id.substring(0, firstSlashIdx), item.id.substring(firstSlashIdx + 1)] : [item.id];
          if (parts.length === 2) {
            resData = getIETFNode(parts[0])?.ietfInterfaces?.find(i => i.name === parts[1]);
          }
          if (!resData) {
            for (const n of networkTopology.nodes) {
              const found = n.ietfInterfaces?.find(i => i.name === item.id);
              if (found) { resData = found; break; }
            }
          }
        } else if (item.type === 'hardware') {
          for (const n of networkTopology.nodes) {
            const found = n.hardware?.find(h => h.uuid === item.id);
            if (found) { resData = found; break; }
          }
        } else if (item.type === 'acl') {
          const firstSlashIdx = item.id.indexOf('/');
          const parts = firstSlashIdx !== -1 ? [item.id.substring(0, firstSlashIdx), item.id.substring(firstSlashIdx + 1)] : [item.id];
          if (parts.length === 2) {
            resData = getIETFNode(parts[0])?.ietfAccessControlList?.find(a => a.name === parts[1]);
          }
          if (!resData) {
            for (const n of networkTopology.nodes) {
              const found = n.ietfAccessControlList?.find(a => a.name === item.id);
              if (found) { resData = found; break; }
            }
          }
        }
        return resData || { id: item.id };
      default: return { id: item.id };
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground hover:text-foreground/90">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center">
              {getIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">{getTitle()}</h2>
              <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest">{item.type} ID: <span className="cursor-pointer hover:underline text-indigo-400" onClick={() => onNavigate(item.id, item.type)}>{item.id}</span></p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-muted border-border text-muted-foreground">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Configure
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Edit Metadata
          </Button>
        </div>
      </div>

      <Separator className="bg-muted" />

      {item.type === 'device' && renderDeviceDetail(item.id)}
      {item.type === 'service' && renderServiceDetail(item.id)}
      {item.type === 'slice' && renderSliceDetail(item.id)}
      {item.type === 'link' && renderLinkDetail(item.id)}
      {['port', 'hardware', 'channel', 'acl'].includes(item.type) && renderSubComponentDetail(item.id, item.type)}

      <AIInsightsCard itemData={getCurrentItemData()} itemType={item.type} />
    </div>
  );
}

interface GeoLocationCardProps {
  title: string;
  geoLocation?: IETFGeoLocation;
  inheritedFrom?: string;
  onSave: (locationObj: IETFGeoLocation) => void;
}

export function GeoLocationCard({ title, geoLocation, inheritedFrom, onSave }: GeoLocationCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  // Reference Frame
  const [astronomicalBody, setAstronomicalBody] = React.useState('earth');
  const [geodeticDatum, setGeodeticDatum] = React.useState('wgs-84');
  const [alternateSystemEnabled, setAlternateSystemEnabled] = React.useState(false);
  const [alternateSystem, setAlternateSystem] = React.useState('');
  const [coordAccuracy, setCoordAccuracy] = React.useState('0.1');
  const [heightAccuracy, setHeightAccuracy] = React.useState('1.0');

  // Location Tab choice
  const [locationMode, setLocationMode] = React.useState<'ellipsoid' | 'cartesian'>('ellipsoid');

  // Ellipsoidal fields
  const [latStr, setLatStr] = React.useState('35.6895');
  const [lngStr, setLngStr] = React.useState('139.6917');
  const [heightStr, setHeightStr] = React.useState('15');

  // Cartesian fields
  const [cartesianX, setCartesianX] = React.useState('0');
  const [cartesianY, setCartesianY] = React.useState('0');
  const [cartesianZ, setCartesianZ] = React.useState('0');

  // Velocity
  const [velocityEnabled, setVelocityEnabled] = React.useState(false);
  const [vNorth, setVNorth] = React.useState('0');
  const [vEast, setVEast] = React.useState('0');
  const [vUp, setVUp] = React.useState('0');

  // Temporal Validity
  const [temporalEnabled, setTemporalEnabled] = React.useState(false);
  const [timestamp, setTimestamp] = React.useState('');
  const [validUntil, setValidUntil] = React.useState('');

  // Error logging
  const [error, setError] = React.useState<string | null>(null);

  // Expiry State Live evaluation
  const [isExpired, setIsExpired] = React.useState(false);

  // Parse ISO date back to datetime-local friendly format YYYY-MM-DDTHH:mm
  const formatIsoToDatetimeLocal = (isoStr: string): string => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  React.useEffect(() => {
    if (geoLocation) {
      setAstronomicalBody(geoLocation.referenceFrame.astronomicalBody || 'earth');
      setGeodeticDatum(geoLocation.referenceFrame.geodeticSystem.geodeticDatum || 'wgs-84');
      setAlternateSystemEnabled(!!geoLocation.referenceFrame.alternateSystem);
      setAlternateSystem(geoLocation.referenceFrame.alternateSystem || '');
      setCoordAccuracy(geoLocation.referenceFrame.geodeticSystem.coordAccuracy !== undefined ? geoLocation.referenceFrame.geodeticSystem.coordAccuracy.toString() : '0.1');
      setHeightAccuracy(geoLocation.referenceFrame.geodeticSystem.heightAccuracy !== undefined ? geoLocation.referenceFrame.geodeticSystem.heightAccuracy.toString() : '1.0');

      if (geoLocation.location.ellipsoid) {
        setLocationMode('ellipsoid');
        setLatStr(geoLocation.location.ellipsoid.latitude.toString());
        setLngStr(geoLocation.location.ellipsoid.longitude.toString());
        setHeightStr(geoLocation.location.ellipsoid.height !== undefined ? geoLocation.location.ellipsoid.height.toString() : '0');
        setCartesianX('0');
        setCartesianY('0');
        setCartesianZ('0');
      } else if (geoLocation.location.cartesian) {
        setLocationMode('cartesian');
        setCartesianX(geoLocation.location.cartesian.x.toString());
        setCartesianY(geoLocation.location.cartesian.y.toString());
        setCartesianZ(geoLocation.location.cartesian.z.toString());
        setLatStr('35.6895');
        setLngStr('139.6917');
        setHeightStr('15');
      }

      if (geoLocation.velocity) {
        setVelocityEnabled(true);
        setVNorth(geoLocation.velocity.vNorth.toString());
        setVEast(geoLocation.velocity.vEast.toString());
        setVUp(geoLocation.velocity.vUp.toString());
      } else {
        setVelocityEnabled(false);
        setVNorth('0');
        setVEast('0');
        setVUp('0');
      }

      if (geoLocation.timestamp || geoLocation.validUntil) {
        setTemporalEnabled(true);
        setTimestamp(geoLocation.timestamp ? formatIsoToDatetimeLocal(geoLocation.timestamp) : '');
        setValidUntil(geoLocation.validUntil ? formatIsoToDatetimeLocal(geoLocation.validUntil) : '');
      } else {
        setTemporalEnabled(false);
        setTimestamp('');
        setValidUntil('');
      }
    } else {
      setAstronomicalBody('earth');
      setGeodeticDatum('wgs-84');
      setAlternateSystemEnabled(false);
      setAlternateSystem('');
      setCoordAccuracy('0.1');
      setHeightAccuracy('1.0');
      setLocationMode('ellipsoid');
      setLatStr('35.6895');
      setLngStr('139.6917');
      setHeightStr('15');
      setCartesianX('0');
      setCartesianY('0');
      setCartesianZ('0');
      setVelocityEnabled(false);
      setVNorth('0');
      setVEast('0');
      setVUp('0');
      setTemporalEnabled(false);
      setTimestamp('');
      setValidUntil('');
    }
  }, [geoLocation, isEditing, inheritedFrom]);

  // Live checker for validity expiration
  React.useEffect(() => {
    if (geoLocation && geoLocation.validUntil) {
      const checkExpiry = () => {
        const expiryDate = new Date(geoLocation.validUntil!);
        const now = new Date();
        setIsExpired(now > expiryDate);
      };
      checkExpiry();
      const interval = setInterval(checkExpiry, 5000);
      return () => clearInterval(interval);
    } else {
      setIsExpired(false);
    }
  }, [geoLocation]);

  const handleRenewValidity = () => {
    if (!geoLocation) return;
    const now = new Date();
    // extend valid period safely in the future by 24 hours
    const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const renewed: IETFGeoLocation = {
      ...geoLocation,
      timestamp: now.toISOString(),
      validUntil: future.toISOString()
    };
    onSave(renewed);
  };

  const handleSave = () => {
    // 1. Reference Frame Normalization & Validation (Feature 1, US 1, US 2, US 4)
    let cleanBody = astronomicalBody.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanBody) {
      setError('Astronomical body is required.');
      return;
    }
    const bodyPattern = /^[ -@\[-\^_-~]+$/; // RFC character constraints
    if (!bodyPattern.test(cleanBody)) {
      setError('Astronomical body contains invalid characters (printable ASCII only).');
      return;
    }

    let cleanDatum = geodeticDatum.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanDatum) {
      cleanDatum = cleanBody === 'earth' ? 'wgs-84' : 'mean-earth-me';
    }
    if (!bodyPattern.test(cleanDatum)) {
      setError('Geodetic datum contains invalid characters (printable ASCII only).');
      return;
    }

    const parsedCoordAcc = coordAccuracy ? parseFloat(coordAccuracy) : undefined;
    if (parsedCoordAcc !== undefined && (isNaN(parsedCoordAcc) || parsedCoordAcc < 0)) {
      setError('Coordinate accuracy must be a non-negative decimal.');
      return;
    }

    const parsedHeightAcc = heightAccuracy ? parseFloat(heightAccuracy) : undefined;
    if (parsedHeightAcc !== undefined && (isNaN(parsedHeightAcc) || parsedHeightAcc < 0)) {
      setError('Height accuracy must be a non-negative decimal.');
      return;
    }

    // 2. Choice of Coords bounds validation (Feature 2 & 3, Use Case 1)
    let locationVal: IETFGeoLocation['location'] = {};

    if (locationMode === 'ellipsoid') {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const height = heightStr ? parseFloat(heightStr) : undefined;

      if (isNaN(lat) || lat < -90 || lat > 90) {
        setError('Latitude degrees must be within ellipsoidal limits [-90.0, +90.0]');
        return;
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setError('Longitude degrees must be within ellipsoidal limits [-180.0, +180.0]');
        return;
      }
      if (height !== undefined && isNaN(height)) {
        setError('Height must be a valid number (meters)');
        return;
      }

      locationVal = {
        ellipsoid: {
          latitude: Number(lat.toFixed(16)), // Fraction digits up to 16
          longitude: Number(lng.toFixed(16)),
          height: height !== undefined ? Number(height.toFixed(6)) : undefined
        }
      };
    } else {
      // Cartesian logic
      const x = parseFloat(cartesianX);
      const y = parseFloat(cartesianY);
      const z = parseFloat(cartesianZ);

      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        setError('Cartesian representation co-dependency check: X, Y, and Z coordinates are all required together.');
        return;
      }

      locationVal = {
        cartesian: {
          x: Number(x.toFixed(6)),
          y: Number(y.toFixed(6)),
          z: Number(z.toFixed(6))
        }
      };
    }

    // 3. Optional Motion velocity vectors (Feature 4, US 3, Use Case 2)
    let velocityVal: IETFGeoLocation['velocity'] = undefined;
    if (velocityEnabled) {
      const vn = parseFloat(vNorth || '0');
      const ve = parseFloat(vEast || '0');
      const vu = parseFloat(vUp || '0');

      if (isNaN(vn) || isNaN(ve) || isNaN(vu)) {
        setError('Velocity vector components must be valid decimal values (m/s).');
        return;
      }

      velocityVal = {
        vNorth: Number(vn.toFixed(12)), // fraction digits 12
        vEast: Number(ve.toFixed(12)),
        vUp: Number(vu.toFixed(12))
      };
    }

    // 4. Expiry / Temporal Bounds Check (Feature 5, US 5, Use Case 3)
    let finalTimestamp: string | undefined = undefined;
    let finalValidUntil: string | undefined = undefined;

    if (temporalEnabled) {
      if (!timestamp) {
        setError('Recording reference timestamp is required when temporal validation is enabled.');
        return;
      }
      const t1 = new Date(timestamp);
      if (isNaN(t1.getTime())) {
        setError('Recording timestamp is invalid.');
        return;
      }
      finalTimestamp = t1.toISOString();

      if (validUntil) {
        const t2 = new Date(validUntil);
        if (isNaN(t2.getTime())) {
          setError('Expiration epoch date is invalid.');
          return;
        }
        if (t2.getTime() <= t1.getTime()) {
          setError('Chronological check failed: valid-until timestamp must be strictly after the recorded timestamp.');
          return;
        }
        finalValidUntil = t2.toISOString();
      }
    }

    setError(null);
    onSave({
      referenceFrame: {
        astronomicalBody: cleanBody,
        geodeticSystem: {
          geodeticDatum: cleanDatum,
          coordAccuracy: parsedCoordAcc !== undefined ? Number(parsedCoordAcc.toFixed(6)) : undefined,
          heightAccuracy: parsedHeightAcc !== undefined ? Number(parsedHeightAcc.toFixed(6)) : undefined,
        },
        alternateSystem: alternateSystemEnabled && alternateSystem.trim() ? alternateSystem.trim() : undefined
      },
      location: locationVal,
      velocity: velocityVal,
      timestamp: finalTimestamp,
      validUntil: finalValidUntil
    });
    setIsEditing(false);
  };

  // Trajectory/speed calculations (US 3, Use Case 2)
  const calcMotionTrajectory = () => {
    if (!geoLocation || !geoLocation.velocity) return null;
    const { vNorth: vn, vEast: ve, vUp: vu } = geoLocation.velocity;
    const horizSpeed = Math.sqrt(vn * vn + ve * ve);
    const speedKmh = horizSpeed * 3.6;
    const headingDegrees = (Math.atan2(ve, vn) * 180 / Math.PI + 360) % 360;

    // Cardinal sector parsing
    const compassDirections = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(((headingDegrees % 360) / 22.5)) % 16;
    const cardinalStr = compassDirections[idx];

    return {
      speedMps: horizSpeed.toFixed(4),
      speedKmh: speedKmh.toFixed(2),
      headingDeg: headingDegrees.toFixed(1),
      cardinal: cardinalStr,
      isMoving: horizSpeed > 0.001 || Math.abs(vu) > 0.001
    };
  };

  const trajectory = calcMotionTrajectory();
  const hasPhysicalCoordinates = geoLocation || inheritedFrom;

  return (
    <Card className="bg-background border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-500" />
            {title}
          </CardTitle>
          {inheritedFrom && !geoLocation && (
            <p className="text-[10px] text-amber-500/90 font-mono tracking-wide uppercase flex items-center gap-1">
              <span>💡 Inductive Inheritance Active (Acquiring physical location from parent {inheritedFrom})</span>
            </p>
          )}
          {geoLocation && geoLocation.validUntil && (
            <div className="flex items-center gap-2 mt-1">
              {isExpired ? (
                <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold font-mono">
                  🚨 Expired (Epoch Breached)
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold font-mono">
                  🟢 Coordinate Valid & Active
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <div className="flex gap-2">
              {geoLocation && geoLocation.validUntil && isExpired && (
                <button
                  onClick={handleRenewValidity}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-bold transition-all"
                  title="Update timestamp & advance validity range for Use Case 3 & US 5 compliance verification"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restore Validity
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 text-[11px] font-bold transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {geoLocation ? 'Edit Configuration' : 'Override/Edit Coordinates'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-[11px] font-bold transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Save Coordinate Parameters
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:text-foreground text-[11px] font-bold transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          )}
          <Badge variant="outline" className="bg-purple-500/15 text-purple-450 border-purple-500/20 text-[10px] font-mono">
            RFC 9179 Specs
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <div className="mb-4 text-xs font-semibold text-rose-500 bg-rose-500/15 border border-rose-500/25 px-3 py-2 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-6">
            {/* Geodetic Reference Frame */}
            <div className="space-y-4 p-4 border border-border/60 bg-muted/20 rounded-xl">
              <h4 className="text-xs font-bold text-purple-400 font-mono uppercase tracking-wider">
                1. Geographic Reference Frame (RFC 9179 Sec. 2.1)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                    Astronomical Body Context
                  </label>
                  <input
                    type="text"
                    value={astronomicalBody}
                    onChange={(e) => setAstronomicalBody(e.target.value)}
                    placeholder="e.g. earth, moon, mars"
                    className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                  />
                  <p className="text-[9px] text-muted-foreground/80 font-mono">Defaults to "earth". Normalized to lowercase.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                    Geodetic Datum
                  </label>
                  <input
                    type="text"
                    value={geodeticDatum}
                    onChange={(e) => setGeodeticDatum(e.target.value)}
                    placeholder="e.g. wgs-84, mean-earth-me"
                    className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                  />
                  <p className="text-[9px] text-muted-foreground/80 font-mono">Earth fallback is "wgs-84". Moon standard is "mean-earth-me".</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                    Horiz Accuracy (coord-accuracy)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={coordAccuracy}
                    onChange={(e) => setCoordAccuracy(e.target.value)}
                    className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                  />
                  <p className="text-[9px] text-muted-foreground/80 font-mono">Horizontal error margin (decimal64 degree bounds)</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                    Vert elevation Accuracy (height-accuracy)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={heightAccuracy}
                    onChange={(e) => setHeightAccuracy(e.target.value)}
                    className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                  />
                  <p className="text-[9px] text-muted-foreground/80 font-mono">Vertical error margin (meters / decimal64)</p>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="altSystemCheck"
                      checked={alternateSystemEnabled}
                      onChange={(e) => setAlternateSystemEnabled(e.target.checked)}
                      className="rounded border-border text-purple-600 focus:ring-purple-500 bg-background/80 h-3.5 w-3.5"
                    />
                    <label htmlFor="altSystemCheck" className="text-xs font-semibold text-foreground/90 select-none cursor-pointer">
                      Activate Alternate Reference System (Vandian simulation / VR - RFC 9179 alternate-system)
                    </label>
                  </div>
                  {alternateSystemEnabled && (
                    <div className="space-y-1.5 transition-all">
                      <input
                        type="text"
                        value={alternateSystem}
                        onChange={(e) => setAlternateSystem(e.target.value)}
                        placeholder="e.g. mars-sim-v1"
                        className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                      />
                      <p className="text-[9px] text-muted-foreground/80 font-mono">Coordinates maps relative to virtual/simulated environment grids rather than astronomical reality.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location Choice Switcher */}
            <div className="space-y-4 p-4 border border-border/60 bg-muted/20 rounded-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-400 font-mono uppercase tracking-wider">
                  2. Location Coordinates Model (RFC 9179 Sec. 2.2 / 2.3)
                </h4>
                <div className="flex gap-1 bg-background/50 p-1 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setLocationMode('ellipsoid')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${locationMode === 'ellipsoid' ? 'bg-purple-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Ellipsoidal Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode('cartesian')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${locationMode === 'cartesian' ? 'bg-purple-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Cartesian Space Choice
                  </button>
                </div>
              </div>

              {locationMode === 'ellipsoid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Latitude (Degrees)
                    </label>
                    <input
                      type="text"
                      value={latStr}
                      onChange={(e) => setLatStr(e.target.value)}
                      placeholder="e.g. 35.6895"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground/80 font-mono">Degrees latitude, valid interval [-90.0, 90.0] limit.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Longitude (Degrees)
                    </label>
                    <input
                      type="text"
                      value={lngStr}
                      onChange={(e) => setLngStr(e.target.value)}
                      placeholder="e.g. 139.6917"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground/80 font-mono">Degrees longitude, valid interval [-180.0, 180.0] limit.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Elevation/Height (meters)
                    </label>
                    <input
                      type="text"
                      value={heightStr}
                      onChange={(e) => setHeightStr(e.target.value)}
                      placeholder="e.g. 12"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground/80 font-mono">Distance above coordinate reference zero ellipsoid.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Cartesian Coordinates X Offset
                    </label>
                    <input
                      type="text"
                      value={cartesianX}
                      onChange={(e) => setCartesianX(e.target.value)}
                      placeholder="e.g. 6378137"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground/80 font-mono">Spatial offset on X-axis from body center of mass in meters.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Cartesian Coordinates Y Offset
                    </label>
                    <input
                      type="text"
                      value={cartesianY}
                      onChange={(e) => setCartesianY(e.target.value)}
                      placeholder="e.g. 0"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground/80 font-mono">Spatial offset on Y-axis in meters.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Cartesian Coordinates Z Offset
                    </label>
                    <input
                      type="text"
                      value={cartesianZ}
                      onChange={(e) => setCartesianZ(e.target.value)}
                      placeholder="e.g. 0"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground/80 font-mono">Spatial offset on Z-axis in meters.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Velocity Vectors */}
            <div className="space-y-4 p-4 border border-border/60 bg-muted/20 rounded-xl">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="velocityToggleInput"
                  checked={velocityEnabled}
                  onChange={(e) => setVelocityEnabled(e.target.checked)}
                  className="rounded border-border text-purple-600 focus:ring-purple-500 bg-background/80 h-3.5 w-3.5 cursor-pointer"
                />
                <label htmlFor="velocityToggleInput" className="text-xs font-bold text-foreground/90 select-none cursor-pointer flex items-center gap-2">
                  <span>3. Motion Velocity Vector Trajectory Telemetry (RFC 9179 Sec. 2.4)</span>
                </label>
              </div>

              {velocityEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Velocity toward true north (v-north)
                    </label>
                    <input
                      type="text"
                      value={vNorth}
                      onChange={(e) => setVNorth(e.target.value)}
                      placeholder="meters per second"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground/80 font-mono">Speed factor aligned strictly true north (m/s)</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Velocity aligned true east (v-east)
                    </label>
                    <input
                      type="text"
                      value={vEast}
                      onChange={(e) => setVEast(e.target.value)}
                      placeholder="meters per second"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground/80 font-mono">Speed factor horizontal eastward (m/s)</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Velocity away from center (v-up)
                    </label>
                    <input
                      type="text"
                      value={vUp}
                      onChange={(e) => setVUp(e.target.value)}
                      placeholder="meters per second"
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground/80 font-mono">Vertical velocity away from center center (m/s)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Temporal validity timestamps */}
            <div className="space-y-4 p-4 border border-border/60 bg-muted/20 rounded-xl">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="temporalCheckToggle"
                  checked={temporalEnabled}
                  onChange={(e) => setTemporalEnabled(e.target.checked)}
                  className="rounded border-border text-purple-600 focus:ring-purple-500 bg-background/80 h-3.5 w-3.5 cursor-pointer"
                />
                <label htmlFor="temporalCheckToggle" className="text-xs font-bold text-foreground/90 select-none cursor-pointer">
                  4. Temporal Validity Timeline Limit (RFC 9179 Sec. 2.5)
                </label>
              </div>

              {temporalEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Reference Recording Timestamp (UTC/Local)
                    </label>
                    <input
                      type="datetime-local"
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground/80 font-mono">Timestamp when physical position was sampled.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block">
                      Expiration Threshold epoch (valid-until)
                    </label>
                    <input
                      type="datetime-local"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="bg-background/80 border border-border rounded-lg text-sm text-foreground px-3 py-2 w-full focus:outline-none focus:border-purple-500 font-mono transition-all"
                    />
                    <p className="text-[9px] text-muted-foreground/80 font-mono">Date in future after which this registry position decays.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {hasPhysicalCoordinates ? (
              <div className="space-y-6">
                {/* 1. Coordinate display block */}
                {geoLocation && geoLocation.location.cartesian ? (
                  // Cartesian View (Feature 3)
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/25 font-mono text-[9px] tracking-widest uppercase">
                        Cartesian Grid offset Choice Activated
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-muted/20 p-4 border border-border/45 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">X Coordinate</p>
                        <p className="text-xl font-mono font-semibold text-foreground/90">
                          {geoLocation.location.cartesian.x.toFixed(6)}m
                        </p>
                      </div>
                      <div className="bg-muted/20 p-4 border border-border/45 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">Y Coordinate</p>
                        <p className="text-xl font-mono font-semibold text-foreground/90">
                          {geoLocation.location.cartesian.y.toFixed(6)}m
                        </p>
                      </div>
                      <div className="bg-muted/20 p-4 border border-border/45 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">Z Coordinate</p>
                        <p className="text-xl font-mono font-semibold text-foreground/90">
                          {geoLocation.location.cartesian.z.toFixed(6)}m
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Ellipsoid View (Feature 2 / US 1 / US 2)
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-muted/20 p-4 border border-border/45 rounded-xl">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">Latitude</p>
                      <p className="text-xl font-mono font-semibold text-foreground/90">
                        {geoLocation?.location?.ellipsoid ? `${geoLocation.location.ellipsoid.latitude.toFixed(10)}°` : 'Inherited'}
                      </p>
                    </div>
                    <div className="bg-muted/20 p-4 border border-border/45 rounded-xl">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">Longitude</p>
                      <p className="text-xl font-mono font-semibold text-foreground/90">
                        {geoLocation?.location?.ellipsoid ? `${geoLocation.location.ellipsoid.longitude.toFixed(10)}°` : 'Inherited'}
                      </p>
                    </div>
                    <div className="bg-muted/20 p-4 border border-border/45 rounded-xl col-span-2 lg:col-span-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1 font-bold">Elevation/Height</p>
                      <p className="text-xl font-mono font-semibold text-foreground/90">
                        {geoLocation?.location?.ellipsoid ? `${geoLocation.location.ellipsoid.height || 0}m` : 'Inherited'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Reference Frame details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-border/40">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-muted/10 px-4 py-2.5 rounded-lg border border-border/20">
                      <span className="text-muted-foreground/85 font-medium">Coordinate system / Datum</span>
                      <Badge variant="secondary" className="bg-muted border border-border/60 text-foreground/80 font-mono text-[11px]">
                        {geoLocation ? geoLocation.referenceFrame.geodeticSystem.geodeticDatum : geodeticDatum}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center bg-muted/10 px-4 py-2.5 rounded-lg border border-border/20">
                      <span className="text-muted-foreground/85 font-medium">Target Astronomical Body</span>
                      <Badge variant="secondary" className="bg-muted border border-border/60 text-foreground text-[11px] capitalize">
                        🌍 {geoLocation ? geoLocation.referenceFrame.astronomicalBody : 'earth'}
                      </Badge>
                    </div>

                    {geoLocation?.referenceFrame?.alternateSystem && (
                      <div className="flex justify-between items-center bg-purple-500/5 px-4 py-2.5 rounded-lg border border-purple-500/20">
                        <span className="text-purple-400 font-bold uppercase tracking-wide text-[10px]">Alternate Grid (Simulation)</span>
                        <Badge className="bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono text-[10px]">
                          {geoLocation.referenceFrame.alternateSystem}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-muted/10 px-4 py-2.5 rounded-lg border border-border/20">
                      <span className="text-muted-foreground/85 font-medium">Horizontal accuracy margin</span>
                      <Badge variant="secondary" className="bg-muted border border-border/60 text-foreground/85 font-mono text-[11px]">
                        ± {geoLocation?.referenceFrame?.geodeticSystem?.coordAccuracy !== undefined ? `${geoLocation.referenceFrame.geodeticSystem.coordAccuracy}m` : '0.1m'}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center bg-muted/10 px-4 py-2.5 rounded-lg border border-border/20">
                      <span className="text-muted-foreground/85 font-medium">Vertical altitude accuracy</span>
                      <Badge variant="secondary" className="bg-muted border border-border/60 text-foreground/85 font-mono text-[11px]">
                        ± {geoLocation?.referenceFrame?.geodeticSystem?.heightAccuracy !== undefined ? `${geoLocation.referenceFrame.geodeticSystem.heightAccuracy}m` : '1.0m'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 3. Motion trajectories telemetry Section (Feature 4, US 3, Use Case 2) */}
                {geoLocation?.velocity && (
                  <div className="pt-4 border-t border-border/40">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <div className="flex items-center gap-2 font-semibold text-blue-400">
                          <Compass className="w-4 h-4 animate-spin-slow" />
                          <span>Motion Trajectory Telemetry (RFC 9179 Sec. 2.4)</span>
                        </div>
                        <Badge className={`font-mono text-[9px] uppercase font-bold tracking-widest ${trajectory?.isMoving ? 'bg-blue-500/25 text-blue-400' : 'bg-muted text-muted-foreground'}`}>
                          {trajectory?.isMoving ? '● Moving' : '● Idle / Stationary'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Horizontal Speed</p>
                          <p className="text-base font-bold font-mono text-foreground">{trajectory?.speedMps} m/s</p>
                          <p className="text-[10px] text-muted-foreground/80 font-mono">(~ {trajectory?.speedKmh} km/h)</p>
                        </div>

                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Compass Heading</p>
                          <p className="text-base font-bold font-mono text-foreground">{trajectory?.headingDeg}°</p>
                          <p className="text-[10px] text-blue-400 font-bold font-mono">Quadrant: {trajectory?.cardinal}</p>
                        </div>

                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Velocity North (v-north)</p>
                          <p className="text-sm font-semibold font-mono text-foreground/80">{geoLocation.velocity.vNorth} m/s</p>
                        </div>

                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Velocity Up (v-up)</p>
                          <p className="text-sm font-semibold font-mono text-foreground/80">{geoLocation.velocity.vUp} m/s</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Temporal timeline window (Feature 5, US 5, Use Case 3) */}
                {geoLocation && (geoLocation.timestamp || geoLocation.validUntil) && (
                  <div className="pt-4 border-t border-border/40">
                    <div className="bg-muted/10 border border-border/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1.5 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-foreground/90 font-semibold font-sans">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          <span>Temporal Validity Details (RFC 9179 Sec. 2.5)</span>
                        </div>
                        {geoLocation.timestamp && (
                          <p className="text-[11px]"><span className="text-muted-foreground/70 justify-between">Recorded Epoch:</span> {new Date(geoLocation.timestamp).toLocaleString()}</p>
                        )}
                        {geoLocation.validUntil && (
                          <p className="text-[11px]"><span className="text-muted-foreground/70 justify-between">Decay Deadline:</span> {new Date(geoLocation.validUntil).toLocaleString()}</p>
                        )}
                      </div>

                      {geoLocation.validUntil && (
                        <div className="shrink-0 flex items-center md:flex-col gap-2 align-middle">
                          {isExpired ? (
                            <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg font-bold text-center">
                              Coordinate Deprecated / Expired
                            </div>
                          ) : (
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-bold text-center">
                              Registry State Active
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-border rounded-xl">
                <MapPin className="mx-auto w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground mb-4">No explicit geographical coordinates are currently provisioned for this system.</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-1.5 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-400 font-bold text-xs rounded-lg transition-all"
                >
                  Configure Geographical Location (RFC 9179 Specifications)
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
