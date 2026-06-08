import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Cpu, 
  ShieldCheck, 
  Activity, 
  Settings as SettingsIcon, 
  Layers, 
  Target, 
  MapPin, 
  Info 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { NetworkLayer } from '../../../types';
import { NetworkService } from '../../../services/networkService';
import { getFacilityLocationAndChassisHelper, DetailPlacementCard } from './DetailPlacementCard';
import { GeoLocationCard } from './GeoLocationCard';

export interface SubComponentDetailProps {
  id: string;
  type: 'port' | 'hardware' | 'channel' | 'acl';
  allNodes: any[];
  networkTopology: any;
  onNavigate: (id: string, type: any) => void;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
}

export function SubComponentDetail({ 
  id, 
  type, 
  allNodes, 
  networkTopology, 
  onNavigate, 
  setRefreshKey 
}: SubComponentDetailProps) {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic real-time telemetry asynchronously
  useEffect(() => {
    let active = true;
    setLoading(true);
    const apiType = (type === 'port' || type === 'channel') ? 'port' : (type === 'hardware' ? 'hardware' : 'port');
    NetworkService.getInstance().fetchRealtimeTelemetry(id, apiType as any)
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
  }, [id, type]);

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
          ietfAccessControlList: (rn as any).ietfAccessControlList,
          services: [],
          _isLogical: true
        };
      }
    }
    return null;
  };

  let parentNode: any = undefined;
  let leafData: any = null;

  if (type === 'port' || type === 'channel') {
    const firstSlashIdx = id.indexOf('/');
    const parts = firstSlashIdx !== -1 ? [id.substring(0, firstSlashIdx), id.substring(firstSlashIdx + 1)] : [id];
    if (parts.length === 2) {
      parentNode = getIETFNode(parts[0]);
      leafData = parentNode?.ietfInterfaces?.find((i: any) => i.name === parts[1]);
    }
    if (!leafData) {
      for (const n of allNodes) {
        const found = n.ietfInterfaces?.find((i: any) => i.name === id);
        if (found) {
          parentNode = n;
          leafData = found;
          break;
        }
      }
    }
  } else if (type === 'hardware') {
    for (const n of allNodes) {
      const found = n.hardware?.find((h: any) => h.uuid === id);
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
      leafData = parentNode?.ietfAccessControlList?.find((a: any) => a.name === parts[1]);
    }
    if (!leafData) {
      for (const n of allNodes) {
        const found = n.ietfAccessControlList?.find((a: any) => a.name === id);
        if (found) {
          parentNode = n;
          leafData = found;
          break;
        }
      }
    }
  }

  // Fallback if not found in active topology
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
              layer: net.networkTypes?.type as any,
              location: 'Logical Topology',
              activeNeRef: rn.activeNeRef,
              hardware: [],
              services: []
            } as any;
            let resolvedMac = foundTp.ipAddress;
            if (rn.activeNeRef && foundTp.activePortRef) {
              const physNode = allNodes.find(n => n.uuid === rn.activeNeRef);
              const physIface = physNode?.ietfInterfaces?.find((i: any) => i.name === foundTp.activePortRef);
              if (physIface?.physAddress) {
                resolvedMac = physIface.physAddress;
              }
            }
            leafData = {
              name: foundTp.tpId,
              type: foundTp.transceiver ? 'iana-if-type:opticalChannel' : 'iana-if-type:ethernetCsmacd',
              enabled: true,
              adminStatus: 'up',
              operStatus: 'up',
              physAddress: resolvedMac,
              ipAddress: foundTp.ipAddress,
              opticalChannelFreqGhz: foundTp.opticalChannelFreqGhz,
              opticalChannelWavelengthNm: foundTp.opticalChannelWavelengthNm || (foundTp.opticalChannelFreqGhz ? (foundTp.opticalChannelFreqGhz > 1000 ? 299792458 / foundTp.opticalChannelFreqGhz : 299792.458 / foundTp.opticalChannelFreqGhz) : undefined),
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
  }

  if ((type === 'port' || type === 'channel') && !leafData) {
    const activeMockDevices = [
      { id: 'd1', name: 'R1-Core', type: 'ROUTER', status: 'OPERATIONAL', endpoints: ['eth0', 'eth1'], drivers: ['p4', 'openflow'] },
      { id: 'd2', name: 'R2-Core', type: 'ROUTER', status: 'OPERATIONAL', endpoints: ['eth0', 'eth1', 'eth2'], drivers: ['p4'] },
      { id: 'd3', name: 'SW1-Edge', type: 'SWITCH', status: 'OPERATIONAL', endpoints: ['p1', 'p2', 'p3'], drivers: ['openflow'] },
      { id: 'd4', name: 'SW2-Edge', type: 'SWITCH', status: 'DISABLED', endpoints: ['p1', 'p2'], drivers: ['openflow'] },
      { id: 'q1', name: 'QKD-Node-Alpha', type: 'QKD_NODE', status: 'OPERATIONAL', endpoints: ['q0', 'q1'], drivers: ['etsi_gs_qkd_015'] },
      { id: 'q2', name: 'QKD-Node-Beta', type: 'QKD_NODE', status: 'OPERATIONAL', endpoints: ['q0', 'q1'], drivers: ['etsi_gs_qkd_015'] },
      { id: 'q3', name: 'QKD-Node-Gamma', type: 'QKD_NODE', status: 'ERROR', endpoints: ['q0'], drivers: ['etsi_gs_qkd_015'] }
    ];

    const firstSlashIdx = id.indexOf('/');
    const parts = firstSlashIdx !== -1 ? [id.substring(0, firstSlashIdx), id.substring(firstSlashIdx + 1)] : [id];
    let matchedMockDev: any = undefined;
    let matchedPort: string = '';

    if (parts.length === 2) {
      matchedMockDev = activeMockDevices.find(d => d.id === parts[0]);
      if (matchedMockDev && matchedMockDev.endpoints.includes(parts[1])) {
        matchedPort = parts[1];
      }
    } else {
      matchedMockDev = activeMockDevices.find(d => d.endpoints.includes(id));
      if (matchedMockDev) {
        matchedPort = id;
      }
    }

    if (matchedMockDev) {
      parentNode = {
        uuid: matchedMockDev.id,
        name: matchedMockDev.name,
        type: matchedMockDev.type,
        status: matchedMockDev.status,
        layer: NetworkLayer.L2_ETHERNET,
        hardware: [],
        services: []
      };

      leafData = {
        name: matchedPort,
        type: matchedPort.startsWith('q') ? 'iana-if-type:opticalChannel' : 'iana-if-type:ethernetCsmacd',
        enabled: matchedMockDev.status === 'OPERATIONAL',
        adminStatus: matchedMockDev.status === 'OPERATIONAL' ? 'up' : 'down',
        operStatus: matchedMockDev.status === 'OPERATIONAL' ? 'up' : 'down',
        physAddress: matchedPort.startsWith('q') ? 'N/A' : `00:1A:2B:3C:${matchedMockDev.id === 'd1' ? '11' : '22'}:${matchedPort === 'eth0' ? '00' : '01'}`,
        speed: matchedPort.startsWith('q') ? 1200000 : 100000000000,
        description: `Active Core ${matchedPort.startsWith('q') ? 'Quantum' : 'Ethernet'} Interface`
      };
    }
  }

  if (!leafData) {
    return (
      <Card className="bg-background border-border shadow-none text-left">
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
      <div className="space-y-6 text-left">
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
                <p 
                  className="text-sm font-bold text-[#60a5fa] hover:text-[#3b82f6] cursor-pointer hover:underline" 
                  onClick={() => parentNode && onNavigate(parentNode.uuid, 'device')}
                >
                  {parentNode?.name || 'Unknown'}
                </p>
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
                      if (parentNode && parentNode.activeNeRef && leafData.activePortRef) {
                        const physNode = allNodes.find(n => n.uuid === parentNode.activeNeRef);
                        const physIface = physNode?.ietfInterfaces?.find((i: any) => i.name === leafData.activePortRef);
                        return physIface?.physAddress;
                      }
                      return null;
                    })() || 'N/A'}
                  </p>
                </div>
              )}
            </div>

            {/* Live HIL Telemetry */}
            <Separator className="bg-muted" />
            <div className="space-y-2">
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-mono font-bold">Live HIL Port Telemetry</p>
              {loading ? (
                <p className="text-xs text-muted-foreground italic font-mono animate-pulse">Streaming interface optical diagnostics...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-mono text-muted-foreground">
                  <p><span className="font-semibold text-foreground/80">Rx Power:</span> {telemetry?.rxOpticalPower}</p>
                  <p><span className="font-semibold text-foreground/80">Tx Power:</span> {telemetry?.txOpticalPower}</p>
                  <p><span className="font-semibold text-foreground/80">Laser Temp:</span> {telemetry?.laserTemperature}</p>
                  <p><span className="font-semibold text-foreground/80">Bias Current:</span> {telemetry?.biasCurrent}</p>
                  <p><span className="font-semibold text-foreground/80">Voltage:</span> {telemetry?.supplyVoltage}</p>
                </div>
              )}
            </div>

            {parentNode && parentNode.activeNeRef && leafData.activePortRef && (
              <div className="p-4 border border-border rounded-lg bg-muted/20 text-left space-y-3">
                <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-blue-400" />
                  Underlay Physical Port Association
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-background rounded border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Physical Node Ref</p>
                    <p 
                      className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer select-all"
                      onClick={() => onNavigate(parentNode.activeNeRef, 'device')}
                    >
                      {parentNode.activeNeRef}
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Physical Port Ref</p>
                    <p 
                      className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer select-all"
                      onClick={() => onNavigate(`${parentNode.activeNeRef}/${leafData.activePortRef}`, 'port')}
                    >
                      {leafData.activePortRef}
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Physical MAC Address</p>
                    <p className="text-xs font-mono font-bold text-foreground/80">
                      {(() => {
                        const physNode = allNodes.find(n => n.uuid === parentNode.activeNeRef);
                        const physIface = physNode?.ietfInterfaces?.find((i: any) => i.name === leafData.activePortRef);
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
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Admin Status</span>
                    <Badge variant="outline" className={leafData.adminStatus === 'up' ? 'text-emerald-500 border-emerald-500/20' : 'text-red-500 border-red-500/20'}>{leafData.adminStatus}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Oper Status</span>
                    <Badge variant="outline" className={leafData.operStatus === 'up' ? 'text-emerald-500 border-emerald-500/20' : 'text-amber-500 border-amber-500/20'}>{leafData.operStatus}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Enabled</span>
                    <span className="text-xs font-mono">{leafData.enabled ? 'True' : 'False'}</span>
                  </div>
                </div>
              </div>

              {leafData.statistics && (
                <div className="p-4 border border-border rounded-lg bg-background">
                  <p className="font-bold text-sm mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Statistics</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Traffic (In/Out)</span>
                      <span className="text-xs font-mono">{(leafData.statistics.inOctets / 1024 / 1024).toFixed(1)}M / {(leafData.statistics.outOctets / 1024 / 1024).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Unicast Pkts (In/Out)</span>
                      <span className="text-xs font-mono">{leafData.statistics.inUnicastPkts} / {leafData.statistics.outUnicastPkts}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Errors (In/Out)</span>
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
                                    className="hover:underline cursor-pointer font-bold"
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

        {parentNode && <DetailPlacementCard nodeUuid={parentNode.uuid} allNodes={allNodes} onNavigate={onNavigate} />}
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

    const isFixedPort = leafData.name.includes('Fixed') || 
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
      <div className="space-y-6 text-left">
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
                <p 
                  className="text-sm font-bold text-[#60a5fa] hover:text-[#3b82f6] cursor-pointer hover:underline" 
                  onClick={() => parentNode && onNavigate(parentNode.uuid, 'device')}
                >
                  {parentNode?.name || 'Unknown'}
                </p>
              </div>
              <div className="p-4 bg-muted/40 rounded border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Class</p>
                <p className="text-sm font-mono uppercase text-foreground/80">{leafData.class}</p>
              </div>
              <div className="p-4 bg-muted/40 rounded border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">UUID</p>
                <p 
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer" 
                  onClick={() => onNavigate(leafData.uuid, 'hardware')}
                >
                  {leafData.uuid}
                </p>
              </div>
              {leafData.parentUuid && (
                <div className="p-4 bg-muted/40 rounded border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Parent Hardware UUID</p>
                  <p 
                    className="text-xs font-mono text-[#60a5fa] hover:text-[#3b82f6] cursor-pointer hover:underline" 
                    onClick={() => onNavigate(leafData.parentUuid, 'hardware')}
                  >
                    {leafData.parentUuid}
                  </p>
                </div>
              )}
            </div>

            {/* Live HIL Telemetry */}
            <Separator className="bg-muted" />
            <div className="space-y-2">
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-mono font-bold">Live HIL Component Telemetry</p>
              {loading ? (
                <p className="text-xs text-muted-foreground italic font-mono animate-pulse">Streaming hardware diagnostics...</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-muted-foreground">
                  <p><span className="font-semibold text-foreground/80">Power Draw:</span> {telemetry?.powerDrawWatts}</p>
                  <p><span className="font-semibold text-foreground/80">Temperature:</span> {telemetry?.temperatureCelsius}°C</p>
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

        {parentNode && <DetailPlacementCard nodeUuid={parentNode.uuid} allNodes={allNodes} onNavigate={onNavigate} />}
      </div>
    );
  }

  if (type === 'acl') {
    return (
      <div className="space-y-6 text-left">
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
                  <p 
                    className="text-sm font-bold text-[#60a5fa] hover:text-[#3b82f6] cursor-pointer hover:underline" 
                    onClick={() => parentNode && onNavigate(parentNode.uuid, 'device')}
                  >
                    {parentNode?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Logging Rule</p>
                  <p className="text-sm font-mono text-foreground/80">{leafData.actions.logging || 'none'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {parentNode && <DetailPlacementCard nodeUuid={parentNode.uuid} allNodes={allNodes} onNavigate={onNavigate} />}
      </div>
    );
  }

  return (
    <Card className="bg-background border-border shadow-none text-left">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground capitalize">{type} Details</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80">Information for {type} <strong className="font-mono">{id}</strong>.</p>
        <p className="text-xs text-muted-foreground mt-4">This specific resource component is being inspected.</p>
      </CardContent>
    </Card>
  );
}
