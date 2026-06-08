import React, { useState, useEffect } from 'react';
import { Info, Database, Cpu, Network, ShieldCheck, Zap, ExternalLink, Globe, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { NetworkService } from '../../../services/networkService';
import { DetailPlacementCard } from './DetailPlacementCard';
import { GeoLocationCard } from './GeoLocationCard';
import { HardwareTreeComponent } from './HardwareTreeComponent';
import { SatellitePayloadSchematic } from '../SatellitePayloadSchematic';

export interface DeviceDetailProps {
  id: string;
  allNodes: any[];
  networkTopology: any;
  onNavigate: (id: string, type: any) => void;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
}

export function DeviceDetail({ id, allNodes, networkTopology, onNavigate, setRefreshKey }: DeviceDetailProps) {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch dynamic real-time telemetry asynchronously
  useEffect(() => {
    let active = true;
    setLoading(true);
    NetworkService.getInstance().fetchRealtimeTelemetry(id, 'device')
      .then(data => {
        if (active) {
          setTelemetry(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Load static hardware specifications from local DB layer
  const specs = NetworkService.getInstance().getHardwareSpecs();
  const qkdProfile = specs?.qkd_profiles?.[id];
  const rackProfile = specs?.rack_profiles?.default;

  const getIETFNode = (nodeId: string) => {
    const physical = allNodes.find(n => n.uuid === nodeId);
    if (physical) return { ...physical, _isLogical: false };

    const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
    for (const net of rfcNetworks) {
      const rn = net.nodes.find(n => n.nodeId === nodeId || n.name === nodeId);
      if (rn) {
        return {
          uuid: rn.nodeId,
          name: rn.name || rn.nodeId,
          type: 'LOGICAL_ROUTER',
          layer: net.networkTypes?.type as any,
          location: 'Logical Topology',
          activeNeRef: rn.activeNeRef,
          hardware: rn.chassis ? [
            {
              uuid: rn.chassis.chassisId,
              name: rn.chassis.name,
              class: 'chassis',
              manufacturer: rn.chassis.manufacturer,
              partNumber: rn.chassis.partNumber,
              serialNumber: rn.chassis.serialNumber,
              status: rn.chassis.status,
              isMain: rn.chassis.isMain
            },
            ...(rn.modules || [])
          ] : [],
          ietfGeoLocation: physical?.ietfGeoLocation,
          ietfInterfaces: rn.terminationPoints?.map(tp => {
            let resolvedMac = tp.ipAddress;
            if (rn.activeNeRef && tp.activePortRef) {
              const physNode = allNodes.find(n => n.uuid === rn.activeNeRef);
              const physIface = physNode?.ietfInterfaces?.find((i: any) => i.name === tp.activePortRef);
              if (physIface?.physAddress) {
                resolvedMac = physIface.physAddress;
              }
            }
            return {
              name: tp.tpId,
              type: tp.transceiver ? 'iana-if-type:opticalChannel' : 'iana-if-type:ethernetCsmacd',
              enabled: true,
              adminStatus: 'up',
              operStatus: 'up',
              physAddress: resolvedMac,
              ipAddress: tp.ipAddress,
              opticalChannelFreqGhz: tp.opticalChannelFreqGhz,
              opticalChannelWavelengthNm: tp.opticalChannelWavelengthNm || (tp.opticalChannelFreqGhz ? (tp.opticalChannelFreqGhz > 1000 ? 299792458 / tp.opticalChannelFreqGhz : 299792.458 / tp.opticalChannelFreqGhz) : undefined),
              otnLinkTp: tp.otnLinkTp,
              activePortRef: tp.activePortRef,
              supportingTerminationPoints: tp.supportingTerminationPoints
            };
          }),
          services: [],
          _isLogical: true
        };
      }
    }
    return null;
  };

  const getDevice = (deviceId: string) => {
    // Check mock inventory passive devices
    const passiveDevices = NetworkService.getInstance().getPassiveDevices() || [];
    const pd = passiveDevices.find(d => d.id === deviceId);
    if (pd) {
      return {
        id: pd.id,
        name: pd.name || pd.id,
        type: pd.deviceType,
        status: 'OPERATIONAL',
        endpoints: pd.passivePorts?.map(p => p.id) || [],
        drivers: pd.customTags || [],
        locationRef: pd.locationRef,
        passivePorts: pd.passivePorts,
        _isPassive: true
      };
    }

    // fallback to standard active mock devices
    const activeMockDevices = [
      { id: 'd1', name: 'R1-Core', type: 'ROUTER', status: 'OPERATIONAL', endpoints: ['eth0', 'eth1'], drivers: ['p4', 'openflow'] },
      { id: 'd2', name: 'R2-Core', type: 'ROUTER', status: 'OPERATIONAL', endpoints: ['eth0', 'eth1', 'eth2'], drivers: ['p4'] },
      { id: 'd3', name: 'SW1-Edge', type: 'SWITCH', status: 'OPERATIONAL', endpoints: ['p1', 'p2', 'p3'], drivers: ['openflow'] },
      { id: 'd4', name: 'SW2-Edge', type: 'SWITCH', status: 'DISABLED', endpoints: ['p1', 'p2'], drivers: ['openflow'] },
      { 
        id: 'q1', 
        name: 'QKD-Node-Alpha', 
        type: 'QKD_NODE', 
        status: 'OPERATIONAL', 
        endpoints: ['q0', 'q1'], 
        drivers: ['etsi_gs_qkd_015']
      },
      { 
        id: 'q2', 
        name: 'QKD-Node-Beta', 
        type: 'QKD_NODE', 
        status: 'OPERATIONAL', 
        endpoints: ['q0', 'q1'], 
        drivers: ['etsi_gs_qkd_015']
      },
      { 
        id: 'q3', 
        name: 'QKD-Node-Gamma', 
        type: 'QKD_NODE', 
        status: 'ERROR', 
        endpoints: ['q0'], 
        drivers: ['etsi_gs_qkd_015']
      }
    ];

    const found = activeMockDevices.find(d => d.id === deviceId);
    if (found) return { ...found, _isPassive: false };
    return null;
  };

  const node = getIETFNode(id);

  if (node) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="bg-background border-border shadow-none text-left">
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

              {/* Dynamic twin telemetry stats */}
              <Separator className="bg-muted" />
              <div className="space-y-2">
                <p className="text-[10px] text-purple-400 uppercase tracking-widest font-mono font-bold">Live twin Telemetry Status</p>
                {loading ? (
                  <p className="text-xs text-muted-foreground italic font-mono animate-pulse">Streaming device metrics...</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono text-muted-foreground">
                    <p><span className="font-semibold text-foreground/80">CPU:</span> {telemetry?.cpuUsage}</p>
                    <p><span className="font-semibold text-foreground/80">RAM:</span> {telemetry?.memoryUsage}</p>
                    <p><span className="font-semibold text-foreground/80">Temp:</span> {telemetry?.temperatureCelsius}°C</p>
                  </div>
                )}
              </div>
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
        </div>

        <DetailPlacementCard nodeUuid={node.uuid} allNodes={allNodes} onNavigate={onNavigate} />

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
                       <th className="px-6 py-4">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-800/50">
                      {node.ietfInterfaces.map((iface: any) => (
                        <tr key={iface.name} className="group hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => onNavigate(`${node.uuid}/${iface.name}`, 'port')}>
                           <td className="px-6 py-4 font-bold text-xs text-foreground/90 font-mono group-hover:text-blue-400 group-hover:underline">{iface.name}</td>
                           <td className="px-6 py-4">
                              <Badge variant="outline" className="text-[10px] font-mono bg-muted text-muted-foreground border-border">
                                 {iface.type.replace('iana-if-type:', '')}
                              </Badge>
                           </td>
                           <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                             {iface.physAddress || '---'}
                           </td>
                           <td className="px-6 py-4 text-xs font-mono text-foreground/80 font-bold">
                              {iface.opticalChannelFreqGhz ? (
                                <span>
                                  {iface.opticalChannelFreqGhz} GHz
                                  {iface.opticalChannelWavelengthNm && ` (${Number(iface.opticalChannelWavelengthNm).toFixed(2)} nm)`}
                                </span>
                              ) : iface.speed ? (
                                `${(iface.speed / 1000000000).toFixed(1)} Gbps`
                              ) : (
                                'Unknown'
                              )}
                            </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${iface.adminStatus === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className={`w-2 h-2 rounded-full ${iface.operStatus === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              </div>
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
      </div>
    );
  }

  const device = getDevice(id);
  if (!device) return <div className="text-left p-6 font-mono text-xs">Device details not found in database.</div>;

  if (device._isPassive) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
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

        <Card className="bg-background border-border shadow-none text-left">
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

        <DetailPlacementCard nodeUuid={device.id} allNodes={allNodes} onNavigate={onNavigate} />
      </div>
    );
  }

  // Active Standard Mock Device
  return (
    <div className="space-y-6 text-left">
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

            {/* Static specs from hardware-specs.json */}
            {qkdProfile && (
              <>
                <Separator className="bg-muted" />
                <div className="space-y-2">
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono font-bold">Static Hardware Specifications</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p><span className="font-semibold text-foreground/80">Model:</span> {qkdProfile.model}</p>
                    <p><span className="font-semibold text-foreground/80">Laser Class:</span> {qkdProfile.laser_class}</p>
                    <p><span className="font-semibold text-foreground/80">Wavelength:</span> {qkdProfile.operating_wavelength}</p>
                    <p><span className="font-semibold text-foreground/80">Pulse Rate:</span> {qkdProfile.pulse_rate}</p>
                  </div>
                </div>
              </>
            )}

            {/* Live Twin Telemetry (Async) */}
            <Separator className="bg-muted" />
            <div className="space-y-2">
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-mono font-bold">Live Twin Telemetry Status</p>
              {loading ? (
                <p className="text-xs text-muted-foreground italic font-mono animate-pulse">Streaming metrics...</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground">
                  <p><span className="font-semibold text-foreground/80">Power Draw:</span> {telemetry?.powerDrawWatts} W</p>
                  {telemetry?.laserStatus && <p><span className="font-semibold text-foreground/80">Laser Status:</span> {telemetry.laserStatus}</p>}
                  {telemetry?.syncStatus && <p><span className="font-semibold text-foreground/80">Sync State:</span> {telemetry.syncStatus}</p>}
                  {telemetry?.activeSessions && <p><span className="font-semibold text-foreground/80">Active Sessions:</span> {telemetry.activeSessions}</p>}
                  {telemetry?.quantumBitErrorRate && <p><span className="font-semibold text-foreground/80">QBER:</span> {telemetry.quantumBitErrorRate}</p>}
                </div>
              )}
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
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Endpoints</span>
                <span className="font-mono text-foreground/80">{device.endpoints.length}</span>
              </div>
              {rackProfile && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Max RU Spacing</span>
                  <span className="font-mono text-foreground/80">{rackProfile.max_rack_units} RU</span>
                </div>
              )}
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

      <DetailPlacementCard nodeUuid={device.id} allNodes={allNodes} onNavigate={onNavigate} />
    </div>
  );
}
