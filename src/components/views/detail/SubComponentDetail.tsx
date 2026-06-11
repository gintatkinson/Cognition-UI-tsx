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
  Info,
  CheckCircle,
  BarChart3,
  RotateCcw,
  Play
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { NetworkLayer, Dot1qTagClassifier, Dot1qPriorityMapping, Dot1qForwardingFiltering, Dot1qStaticFilteringEntry, Dot1qBridgePortStatistics } from '../../../types';
import { NetworkService } from '../../../services/networkService';
import { getFacilityLocationAndChassisHelper, DetailPlacementCard } from './DetailPlacementCard';
import { GeoLocationCard } from './GeoLocationCard';

const OUI_MAPPING: Record<string, string> = {
  'ciena corporation': '00:03:D2',
  'ericsson': '00:01:EC',
  'aalyria': '00:E0:4B',
  'nec corporation': '00:00:4C',
  'fujitsu limited': '00:00:0E',
  'rakuten symphony': '00:1E:E3',
  'toshiba corporation': '00:00:11',
  'juniper networks': '00:00:FF',
};

const getVendorOUI = (manufacturerName: string | undefined): string => {
  if (!manufacturerName) return 'N/A';
  const cleanName = manufacturerName.trim().toLowerCase();
  for (const [key, value] of Object.entries(OUI_MAPPING)) {
    if (cleanName.includes(key)) {
      return value;
    }
  }
  
  // Stable hashing fallback: hash the name to create a valid OUI prefix (3 octets, e.g. 00:XX:XX)
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const getOctet = (val: number) => Math.abs(val % 256).toString(16).padStart(2, '0').toUpperCase();
  const firstOctet = '00';
  const secondOctet = getOctet(hash);
  const thirdOctet = getOctet(hash >> 8);
  return `${firstOctet}:${secondOctet}:${thirdOctet}`;
};

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

  let lookupId = id;
  if ((type === 'port' || type === 'channel') && lookupId.startsWith('tp-')) {
    const rest = lookupId.substring(3); // e.g. 'd1-eth0'
    const hyphenIdx = rest.indexOf('-');
    if (hyphenIdx !== -1) {
      lookupId = rest.substring(0, hyphenIdx) + '/' + rest.substring(hyphenIdx + 1);
    } else {
      lookupId = rest;
    }
  }

  if (type === 'port' || type === 'channel') {
    const firstSlashIdx = lookupId.indexOf('/');
    const parts = firstSlashIdx !== -1 ? [lookupId.substring(0, firstSlashIdx), lookupId.substring(firstSlashIdx + 1)] : [lookupId];
    if (parts.length === 2) {
      parentNode = getIETFNode(parts[0]);
      leafData = parentNode?.ietfInterfaces?.find((i: any) => i.name === parts[1]);
    }
    if (!leafData) {
      for (const n of allNodes) {
        const found = n.ietfInterfaces?.find((i: any) => i.name === lookupId);
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
    const firstSlashIdx = lookupId.indexOf('/');
    const parts = firstSlashIdx !== -1 ? [lookupId.substring(0, firstSlashIdx), lookupId.substring(firstSlashIdx + 1)] : [lookupId];
    const targetNodeId = parts[0];
    const targetTpId = parts.length === 2 ? parts[1] : lookupId;

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

    const firstSlashIdx = lookupId.indexOf('/');
    const parts = firstSlashIdx !== -1 ? [lookupId.substring(0, firstSlashIdx), lookupId.substring(firstSlashIdx + 1)] : [lookupId];
    let matchedMockDev: any = undefined;
    let matchedPort: string = '';

    if (parts.length === 2) {
      matchedMockDev = activeMockDevices.find(d => d.id === parts[0]);
      if (matchedMockDev && matchedMockDev.endpoints.includes(parts[1])) {
        matchedPort = parts[1];
      }
    } else {
      matchedMockDev = activeMockDevices.find(d => d.endpoints.includes(lookupId));
      if (matchedMockDev) {
        matchedPort = lookupId;
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

        {parentNode && type === 'port' && (
          <Dot1qVlanClassifierCard 
            nodeUuid={parentNode.uuid}
            portName={leafData.name}
            initialConfig={leafData['dot1q-bridge-port-vlan']}
            setRefreshKey={setRefreshKey}
          />
        )}

        {parentNode && type === 'port' && (
          <Dot1qPriorityMappingCard 
            nodeUuid={parentNode.uuid}
            portName={leafData.name}
            initialConfig={leafData['dot1q-priority-mapping']}
            setRefreshKey={setRefreshKey}
          />
        )}

        {parentNode && type === 'port' && (
          <Dot1qForwardingFilteringCard 
            nodeUuid={parentNode.uuid}
            portName={leafData.name}
            initialConfig={leafData['dot1q-forwarding-filtering']}
            setRefreshKey={setRefreshKey}
            allPorts={parentNode.ietfInterfaces?.map((i: any) => i.name) || []}
          />
        )}

        {parentNode && type === 'port' && (
          <Dot1qBridgePortStatisticsCard 
            nodeUuid={parentNode.uuid}
            portName={leafData.name}
            initialConfig={leafData['dot1q-statistics']}
            setRefreshKey={setRefreshKey}
          />
        )}

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

            {leafData.class === 'transceiver' && (
              <div className="p-4 border border-border rounded-lg bg-muted/20 text-left space-y-3">
                <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-500" />
                  Transceiver Hardware Specifications
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded-lg border border-border flex flex-col gap-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Vendor OUI</p>
                    <p className="text-md font-mono font-bold text-amber-500">{getVendorOUI(leafData.manufacturer)}</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border border-border flex flex-col gap-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Hardware Class</p>
                    <p className="text-md font-mono text-foreground/80">Pluggable Transceiver</p>
                  </div>
                </div>
              </div>
            )}

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

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateVlanRangeList(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { isValid: false, error: 'VLAN range list cannot be empty.' };
  }
  
  // Format check using regex
  const formatRegex = /^([1-9][0-9]{0,3}(-[1-9][0-9]{0,3})?(,[1-9][0-9]{0,3}(-[1-9][0-9]{0,3})?)*)$/;
  if (!formatRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid format. Must be comma-separated IDs or ranges (e.g. 10,20-30,50-100).' };
  }
  
  const segments = trimmed.split(',');
  const intervals: [number, number][] = [];
  
  for (const segment of segments) {
    if (segment.includes('-')) {
      const parts = segment.split('-');
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      
      if (start > end) {
        return { isValid: false, error: `Descending range detected: ${segment}. Start of range must be less than or equal to end.` };
      }
      if (start < 1 || start > 4094 || end < 1 || end > 4094) {
        return { isValid: false, error: `VLAN IDs must be in the range 1..4094. Found range ${segment}.` };
      }
      intervals.push([start, end]);
    } else {
      const id = parseInt(segment, 10);
      if (id < 1 || id > 4094) {
        return { isValid: false, error: `VLAN ID must be in the range 1..4094. Found ${id}.` };
      }
      intervals.push([id, id]);
    }
  }
  
  // Enforce strict ascending order and non-overlapping check
  for (let i = 0; i < intervals.length - 1; i++) {
    const current = intervals[i];
    const next = intervals[i + 1];
    if (next[0] <= current[1]) {
      return { 
        isValid: false, 
        error: `Overlapping or out-of-order ranges detected: ${segments[i]} and ${segments[i+1]}. Ranges must be in ascending order and cannot overlap.` 
      };
    }
  }
  
  return { isValid: true };
}

interface Dot1qVlanClassifierCardProps {
  nodeUuid: string;
  portName: string;
  initialConfig?: Dot1qTagClassifier;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
}

export function Dot1qVlanClassifierCard({
  nodeUuid,
  portName,
  initialConfig,
  setRefreshKey
}: Dot1qVlanClassifierCardProps) {
  const [tagType, setTagType] = useState<'c-vlan' | 's-vlan'>(initialConfig?.['tag-type'] || 'c-vlan');
  const [vlanMode, setVlanMode] = useState<'single' | 'range' | 'any'>(initialConfig?.['vlan-mode'] || 'single');
  const [vlanId, setVlanId] = useState<string>(
    initialConfig?.['vlan-id'] !== undefined ? String(initialConfig['vlan-id']) : '1'
  );
  const [vlanIds, setVlanIds] = useState<string>(initialConfig?.['vlan-ids'] || '');
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [lastPortKey, setLastPortKey] = useState<string>(`${nodeUuid}/${portName}`);

  // Sync state when initialConfig changes (e.g., navigating to another port)
  useEffect(() => {
    const portKey = `${nodeUuid}/${portName}`;
    if (portKey !== lastPortKey) {
      setLastPortKey(portKey);
      setSaveSuccess(false);
      setError(null);
    }
    setTagType(initialConfig?.['tag-type'] || 'c-vlan');
    setVlanMode(initialConfig?.['vlan-mode'] || 'single');
    setVlanId(initialConfig?.['vlan-id'] !== undefined ? String(initialConfig['vlan-id']) : '1');
    setVlanIds(initialConfig?.['vlan-ids'] || '');
  }, [initialConfig, nodeUuid, portName, lastPortKey]);

  const handleSave = () => {
    setError(null);
    setSaveSuccess(false);

    let config: Dot1qTagClassifier;

    if (vlanMode === 'single') {
      const parsedId = parseInt(vlanId, 10);
      if (isNaN(parsedId) || parsedId < 1 || parsedId > 4094) {
        setError('VLAN ID must be a number between 1 and 4094.');
        return;
      }
      config = {
        'tag-type': tagType,
        'vlan-mode': 'single',
        'vlan-id': parsedId
      };
    } else if (vlanMode === 'any') {
      config = {
        'tag-type': tagType,
        'vlan-mode': 'any',
        'vlan-id': 'any'
      };
    } else {
      // range mode
      const validation = validateVlanRangeList(vlanIds);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid range list configuration.');
        return;
      }
      config = {
        'tag-type': tagType,
        'vlan-mode': 'range',
        'vlan-ids': vlanIds.trim()
      };
    }

    try {
      NetworkService.getInstance().updatePortDot1qVlan(nodeUuid, portName, config);
      setSaveSuccess(true);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save configuration.');
    }
  };

  const handleClear = () => {
    try {
      NetworkService.getInstance().updatePortDot1qVlan(nodeUuid, portName, undefined);
      setTagType('c-vlan');
      setVlanMode('single');
      setVlanId('1');
      setVlanIds('');
      setError(null);
      setSaveSuccess(false);
      setRefreshKey(prev => prev + 1);
    } catch (e: any) {
      setError(e.message || 'Failed to clear configuration.');
    }
  };

  return (
    <Card className="bg-background border-border shadow-none mt-6">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          IEEE 802.1Q Bridge Port VLAN Classifier
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Configure ingress VLAN tag classifier attributes for interface <span className="font-mono text-zinc-350">{portName}</span>
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* VLAN Tag Type */}
        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold">VLAN Tag Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer">
              <input 
                type="radio" 
                name="tag-type" 
                value="c-vlan" 
                checked={tagType === 'c-vlan'} 
                onChange={() => setTagType('c-vlan')}
                className="accent-indigo-500"
              />
              <span>Customer VLAN (C-VLAN, 0x8100)</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/80 cursor-pointer">
              <input 
                type="radio" 
                name="tag-type" 
                value="s-vlan" 
                checked={tagType === 's-vlan'} 
                onChange={() => setTagType('s-vlan')}
                className="accent-indigo-500"
              />
              <span>Service VLAN (S-VLAN, 0x88A8)</span>
            </label>
          </div>
        </div>

        {/* Classification Mode */}
        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold">Classification Mode</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="vlan-mode-single-btn"
              onClick={() => setVlanMode('single')}
              className={`p-2 text-xs border rounded-md transition-all font-semibold ${
                vlanMode === 'single'
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                  : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              Single VLAN ID
            </button>
            <button
              type="button"
              id="vlan-mode-range-btn"
              onClick={() => setVlanMode('range')}
              className={`p-2 text-xs border rounded-md transition-all font-semibold ${
                vlanMode === 'range'
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                  : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              VLAN Range List
            </button>
            <button
              type="button"
              id="vlan-mode-any-btn"
              onClick={() => setVlanMode('any')}
              className={`p-2 text-xs border rounded-md transition-all font-semibold ${
                vlanMode === 'any'
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                  : 'bg-muted/20 border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              Any (Wildcard)
            </button>
          </div>
        </div>

        {/* VLAN Value Inputs */}
        <div className="space-y-2">
          {vlanMode === 'single' && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block mb-1">VLAN ID (1-4094)</label>
              <input
                type="number"
                min="1"
                max="4094"
                id="vlan-id-input"
                value={vlanId}
                onChange={(e) => setVlanId(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-indigo-500"
                placeholder="e.g. 100"
              />
            </div>
          )}

          {vlanMode === 'range' && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block mb-1">VLAN Range List</label>
              <input
                type="text"
                id="vlan-ids-input"
                value={vlanIds}
                onChange={(e) => setVlanIds(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-indigo-500"
                placeholder="e.g. 10,20-30,50-100"
              />
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                Provide ascending, non-overlapping IDs/intervals separated by commas.
              </p>
            </div>
          )}

          {vlanMode === 'any' && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono font-bold block mb-1">Wildcard Value</label>
              <input
                type="text"
                value="4095 (any)"
                disabled
                className="w-full bg-muted/25 border border-border/60 rounded px-3 py-2 text-sm text-muted-foreground font-mono cursor-not-allowed"
              />
            </div>
          )}
        </div>

        {/* Error panel */}
        {error && (
          <div id="vlan-validation-error" className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Success panel */}
        {saveSuccess && (
          <div id="vlan-validation-success" className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 text-xs font-mono flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Configuration committed successfully.
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            id="vlan-save-btn"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-all"
          >
            Save Configuration
          </button>
          <button
            type="button"
            id="vlan-clear-btn"
            onClick={handleClear}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded text-xs font-semibold transition-all"
          >
            Clear Configuration
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

interface Dot1qPriorityMappingCardProps {
  nodeUuid: string;
  portName: string;
  initialConfig?: Dot1qPriorityMapping;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
}

export function Dot1qPriorityMappingCard({
  nodeUuid,
  portName,
  initialConfig,
  setRefreshKey
}: Dot1qPriorityMappingCardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'regen' | 'tc' | 'ts' | 'pcp'>('regen');

  // Priority Regeneration Table State (priorities 0..7)
  const [regen0, setRegen0] = useState<number>(0);
  const [regen1, setRegen1] = useState<number>(1);
  const [regen2, setRegen2] = useState<number>(2);
  const [regen3, setRegen3] = useState<number>(3);
  const [regen4, setRegen4] = useState<number>(4);
  const [regen5, setRegen5] = useState<number>(5);
  const [regen6, setRegen6] = useState<number>(6);
  const [regen7, setRegen7] = useState<number>(7);

  // Traffic Class Table State (priorities 0..7 mapping to classes 0..7)
  const [tc0, setTc0] = useState<number>(0);
  const [tc1, setTc1] = useState<number>(1);
  const [tc2, setTc2] = useState<number>(2);
  const [tc3, setTc3] = useState<number>(3);
  const [tc4, setTc4] = useState<number>(4);
  const [tc5, setTc5] = useState<number>(5);
  const [tc6, setTc6] = useState<number>(6);
  const [tc7, setTc7] = useState<number>(7);

  // Transmission Selection State (classes 0..7 mapping to algorithm)
  const algOptions = ['strict-priority', 'credit-based-shaper', 'enhanced-transmission-selection', 'asynchronous-traffic-shaping', 'vendor-specific'] as const;
  type AlgType = typeof algOptions[number];
  
  const [ts0, setTs0] = useState<AlgType>('strict-priority');
  const [ts1, setTs1] = useState<AlgType>('strict-priority');
  const [ts2, setTs2] = useState<AlgType>('strict-priority');
  const [ts3, setTs3] = useState<AlgType>('strict-priority');
  const [ts4, setTs4] = useState<AlgType>('strict-priority');
  const [ts5, setTs5] = useState<AlgType>('strict-priority');
  const [ts6, setTs6] = useState<AlgType>('strict-priority');
  const [ts7, setTs7] = useState<AlgType>('strict-priority');

  // PCP Decoding Table (PCP 0..7 mapping to Priority 0..7 and Drop Eligible)
  const [pcpDec, setPcpDec] = useState<{ priority: number; dropEligible: boolean }[]>(
    Array.from({ length: 8 }, (_, i) => ({ priority: i, dropEligible: false }))
  );

  // PCP Encoding Table (Priority 0..7 mapping to PCP 0..7 and DEI)
  const [pcpEnc, setPcpEnc] = useState<{ pcp: number; dei: boolean }[]>(
    Array.from({ length: 8 }, (_, i) => ({ pcp: i, dei: false }))
  );

  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [lastPortKey, setLastPortKey] = useState<string>(`${nodeUuid}/${portName}`);

  // Sync state when initialConfig or port changes
  useEffect(() => {
    const portKey = `${nodeUuid}/${portName}`;
    if (portKey !== lastPortKey) {
      setLastPortKey(portKey);
      setSaveSuccess(false);
      setError(null);
    }

    const prTable = initialConfig?.['priority-regeneration-table'];
    setRegen0(prTable?.priority0 ?? 0);
    setRegen1(prTable?.priority1 ?? 1);
    setRegen2(prTable?.priority2 ?? 2);
    setRegen3(prTable?.priority3 ?? 3);
    setRegen4(prTable?.priority4 ?? 4);
    setRegen5(prTable?.priority5 ?? 5);
    setRegen6(prTable?.priority6 ?? 6);
    setRegen7(prTable?.priority7 ?? 7);

    const tcTable = initialConfig?.['traffic-class-table']?.['traffic-class-map'];
    setTc0(tcTable?.find(m => m.priority === 0)?.[ 'traffic-class' ] ?? 0);
    setTc1(tcTable?.find(m => m.priority === 1)?.[ 'traffic-class' ] ?? 1);
    setTc2(tcTable?.find(m => m.priority === 2)?.[ 'traffic-class' ] ?? 2);
    setTc3(tcTable?.find(m => m.priority === 3)?.[ 'traffic-class' ] ?? 3);
    setTc4(tcTable?.find(m => m.priority === 4)?.[ 'traffic-class' ] ?? 4);
    setTc5(tcTable?.find(m => m.priority === 5)?.[ 'traffic-class' ] ?? 5);
    setTc6(tcTable?.find(m => m.priority === 6)?.[ 'traffic-class' ] ?? 6);
    setTc7(tcTable?.find(m => m.priority === 7)?.[ 'traffic-class' ] ?? 7);

    const tsTable = initialConfig?.['transmission-selection-table'];
    setTs0((tsTable?.find(m => m['traffic-class'] === 0)?.[ 'transmission-selection-algorithm' ] as AlgType) ?? 'strict-priority');
    setTs1((tsTable?.find(m => m['traffic-class'] === 1)?.[ 'transmission-selection-algorithm' ] as AlgType) ?? 'strict-priority');
    setTs2((tsTable?.find(m => m['traffic-class'] === 2)?.[ 'transmission-selection-algorithm' ] as AlgType) ?? 'strict-priority');
    setTs3((tsTable?.find(m => m['traffic-class'] === 3)?.[ 'transmission-selection-algorithm' ] as AlgType) ?? 'strict-priority');
    setTs4((tsTable?.find(m => m['traffic-class'] === 4)?.[ 'transmission-selection-algorithm' ] as AlgType) ?? 'strict-priority');
    setTs5((tsTable?.find(m => m['traffic-class'] === 5)?.[ 'transmission-selection-algorithm' ] as AlgType) ?? 'strict-priority');
    setTs6((tsTable?.find(m => m['traffic-class'] === 6)?.[ 'transmission-selection-algorithm' ] as AlgType) ?? 'strict-priority');
    setTs7((tsTable?.find(m => m['traffic-class'] === 7)?.[ 'transmission-selection-algorithm' ] as AlgType) ?? 'strict-priority');

    const pcpDecTable = initialConfig?.['pcp-decoding-table'];
    if (pcpDecTable && pcpDecTable.length > 0) {
      const parsedDec = Array.from({ length: 8 }, (_, i) => {
        const found = pcpDecTable.find(d => d.pcp === i);
        return {
          priority: found?.priority ?? i,
          dropEligible: found?.['drop-eligible'] ?? false
        };
      });
      setPcpDec(parsedDec);
    } else {
      setPcpDec(Array.from({ length: 8 }, (_, i) => ({ priority: i, dropEligible: false })));
    }

    const pcpEncTable = initialConfig?.['pcp-encoding-table'];
    if (pcpEncTable && pcpEncTable.length > 0) {
      const parsedEnc = Array.from({ length: 8 }, (_, i) => {
        const found = pcpEncTable.find(e => e['pcp-selection-type'] === i);
        return {
          pcp: found?.pcp ?? i,
          dei: found?.dei ?? false
        };
      });
      setPcpEnc(parsedEnc);
    } else {
      setPcpEnc(Array.from({ length: 8 }, (_, i) => ({ pcp: i, dei: false })));
    }

  }, [initialConfig, nodeUuid, portName, lastPortKey]);

  const handleSave = () => {
    setError(null);
    setSaveSuccess(false);

    const config: Dot1qPriorityMapping = {
      'priority-regeneration-table': {
        priority0: regen0,
        priority1: regen1,
        priority2: regen2,
        priority3: regen3,
        priority4: regen4,
        priority5: regen5,
        priority6: regen6,
        priority7: regen7
      },
      'traffic-class-table': {
        'num-traffic-class': 8,
        'traffic-class-map': [
          { priority: 0, 'traffic-class': tc0 },
          { priority: 1, 'traffic-class': tc1 },
          { priority: 2, 'traffic-class': tc2 },
          { priority: 3, 'traffic-class': tc3 },
          { priority: 4, 'traffic-class': tc4 },
          { priority: 5, 'traffic-class': tc5 },
          { priority: 6, 'traffic-class': tc6 },
          { priority: 7, 'traffic-class': tc7 }
        ]
      },
      'transmission-selection-table': [
        { 'traffic-class': 0, 'transmission-selection-algorithm': ts0 },
        { 'traffic-class': 1, 'transmission-selection-algorithm': ts1 },
        { 'traffic-class': 2, 'transmission-selection-algorithm': ts2 },
        { 'traffic-class': 3, 'transmission-selection-algorithm': ts3 },
        { 'traffic-class': 4, 'transmission-selection-algorithm': ts4 },
        { 'traffic-class': 5, 'transmission-selection-algorithm': ts5 },
        { 'traffic-class': 6, 'transmission-selection-algorithm': ts6 },
        { 'traffic-class': 7, 'transmission-selection-algorithm': ts7 }
      ],
      'pcp-decoding-table': pcpDec.map((d, index) => ({
        pcp: index,
        priority: d.priority,
        'drop-eligible': d.dropEligible
      })),
      'pcp-encoding-table': pcpEnc.map((e, index) => ({
        'pcp-selection-type': index,
        pcp: e.pcp,
        dei: e.dei
      }))
    };

    try {
      NetworkService.getInstance().updatePortDot1qPriorityMapping(nodeUuid, portName, config);
      setSaveSuccess(true);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save configuration.');
    }
  };

  const handleClear = () => {
    try {
      NetworkService.getInstance().updatePortDot1qPriorityMapping(nodeUuid, portName, undefined);
      setRegen0(0); setRegen1(1); setRegen2(2); setRegen3(3); setRegen4(4); setRegen5(5); setRegen6(6); setRegen7(7);
      setTc0(0); setTc1(1); setTc2(2); setTc3(3); setTc4(4); setTc5(5); setTc6(6); setTc7(7);
      setTs0('strict-priority'); setTs1('strict-priority'); setTs2('strict-priority'); setTs3('strict-priority');
      setTs4('strict-priority'); setTs5('strict-priority'); setTs6('strict-priority'); setTs7('strict-priority');
      setPcpDec(Array.from({ length: 8 }, (_, i) => ({ priority: i, dropEligible: false })));
      setPcpEnc(Array.from({ length: 8 }, (_, i) => ({ pcp: i, dei: false })));
      setError(null);
      setSaveSuccess(false);
      setRefreshKey(prev => prev + 1);
    } catch (e: any) {
      setError(e.message || 'Failed to clear configuration.');
    }
  };

  // Helper selectors rendering loops
  const renderRegenRows = () => {
    const regens = [regen0, regen1, regen2, regen3, regen4, regen5, regen6, regen7];
    const setters = [setRegen0, setRegen1, setRegen2, setRegen3, setRegen4, setRegen5, setRegen6, setRegen7];
    return Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="flex items-center justify-between border-b border-border/30 pb-2 text-xs">
        <span className="text-muted-foreground font-mono">Received Priority {i}</span>
        <select
          id={`regen-priority-${i}`}
          value={regens[i]}
          onChange={(e) => setters[i](parseInt(e.target.value, 10))}
          className="bg-muted border border-border rounded px-2 py-1 font-mono text-foreground focus:outline-none focus:border-indigo-500"
        >
          {Array.from({ length: 8 }, (_, v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>
    ));
  };

  const renderTcRows = () => {
    const tcs = [tc0, tc1, tc2, tc3, tc4, tc5, tc6, tc7];
    const setters = [setTc0, setTc1, setTc2, setTc3, setTc4, setTc5, setTc6, setTc7];
    return Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="flex items-center justify-between border-b border-border/30 pb-2 text-xs">
        <span className="text-muted-foreground font-mono">Regenerated Priority {i}</span>
        <select
          id={`tc-priority-${i}`}
          value={tcs[i]}
          onChange={(e) => setters[i](parseInt(e.target.value, 10))}
          className="bg-muted border border-border rounded px-2 py-1 font-mono text-foreground focus:outline-none focus:border-indigo-500"
        >
          {Array.from({ length: 8 }, (_, v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>
    ));
  };

  const renderTsRows = () => {
    const tss = [ts0, ts1, ts2, ts3, ts4, ts5, ts6, ts7];
    const setters = [setTs0, setTs1, setTs2, setTs3, setTs4, setTs5, setTs6, setTs7];
    return Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="flex items-center justify-between border-b border-border/30 pb-2 text-xs">
        <span className="text-muted-foreground font-mono">Traffic Class {i}</span>
        <select
          id={`ts-class-${i}`}
          value={tss[i]}
          onChange={(e) => setters[i](e.target.value as AlgType)}
          className="bg-muted border border-border rounded px-2 py-1 font-mono text-foreground text-xs focus:outline-none focus:border-indigo-500"
        >
          {algOptions.map(opt => (
            <option key={opt} value={opt}>{opt.replace('-', ' ')}</option>
          ))}
        </select>
      </div>
    ));
  };

  const handlePcpDecChange = (index: number, field: 'priority' | 'dropEligible', value: any) => {
    const updated = [...pcpDec];
    updated[index] = { ...updated[index], [field]: value };
    setPcpDec(updated);
  };

  const handlePcpEncChange = (index: number, field: 'pcp' | 'dei', value: any) => {
    const updated = [...pcpEnc];
    updated[index] = { ...updated[index], [field]: value };
    setPcpEnc(updated);
  };

  return (
    <Card className="bg-background border-border shadow-none mt-6">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          IEEE 802.1Q Priority and Traffic Class Mapping
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Configure regeneration tables, traffic class mappings, transmission selection algorithms, and PCP codec mappings for interface <span className="font-mono text-zinc-350">{portName}</span>
        </p>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* Mapping Subtabs */}
        <div className="flex border-b border-border/80 gap-1 pb-1">
          <button
            type="button"
            id="priority-tab-regen"
            onClick={() => setActiveSubTab('regen')}
            className={`px-3 py-1.5 text-xs rounded-t-md font-semibold transition-all ${
              activeSubTab === 'regen'
                ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Priority Regen
          </button>
          <button
            type="button"
            id="priority-tab-tc"
            onClick={() => setActiveSubTab('tc')}
            className={`px-3 py-1.5 text-xs rounded-t-md font-semibold transition-all ${
              activeSubTab === 'tc'
                ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Traffic Class Queue
          </button>
          <button
            type="button"
            id="priority-tab-ts"
            onClick={() => setActiveSubTab('ts')}
            className={`px-3 py-1.5 text-xs rounded-t-md font-semibold transition-all ${
              activeSubTab === 'ts'
                ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Transmission Selection
          </button>
          <button
            type="button"
            id="priority-tab-pcp"
            onClick={() => setActiveSubTab('pcp')}
            className={`px-3 py-1.5 text-xs rounded-t-md font-semibold transition-all ${
              activeSubTab === 'pcp'
                ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            PCP Codecs
          </button>
        </div>

        {/* Tab content */}
        <div className="pt-2 min-h-[260px]">
          {activeSubTab === 'regen' && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Priority Regeneration Table</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {renderRegenRows()}
              </div>
            </div>
          )}

          {activeSubTab === 'tc' && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Traffic Class Table</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {renderTcRows()}
              </div>
            </div>
          )}

          {activeSubTab === 'ts' && (
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Transmission Selection Table</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {renderTsRows()}
              </div>
            </div>
          )}

          {activeSubTab === 'pcp' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Decode Table */}
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">PCP Decoding Map (Ingress)</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground/80 border-b border-border/40 pb-1">
                    <span>Frame PCP</span>
                    <span className="flex gap-10">
                      <span>Mapped Priority</span>
                      <span>Drop Eligible</span>
                    </span>
                  </div>
                  {pcpDec.map((dec, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/20">
                      <span className="font-mono text-muted-foreground font-semibold">PCP {i}</span>
                      <div className="flex items-center gap-6">
                        <select
                          id={`pcp-decode-priority-${i}`}
                          value={dec.priority}
                          onChange={(e) => handlePcpDecChange(i, 'priority', parseInt(e.target.value, 10))}
                          className="bg-muted border border-border rounded px-1.5 py-0.5 font-mono text-xs focus:outline-none"
                        >
                          {Array.from({ length: 8 }, (_, v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                        <input
                          type="checkbox"
                          id={`pcp-decode-de-${i}`}
                          checked={dec.dropEligible}
                          onChange={(e) => handlePcpDecChange(i, 'dropEligible', e.target.checked)}
                          className="accent-indigo-500 cursor-pointer w-4 h-4"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Encode Table */}
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">PCP Encoding Map (Egress)</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground/80 border-b border-border/40 pb-1">
                    <span>Priority</span>
                    <span className="flex gap-14">
                      <span>Mapped PCP</span>
                      <span>DEI Tag</span>
                    </span>
                  </div>
                  {pcpEnc.map((enc, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/20">
                      <span className="font-mono text-muted-foreground font-semibold">Priority {i}</span>
                      <div className="flex items-center gap-6">
                        <select
                          id={`pcp-encode-pcp-${i}`}
                          value={enc.pcp}
                          onChange={(e) => handlePcpEncChange(i, 'pcp', parseInt(e.target.value, 10))}
                          className="bg-muted border border-border rounded px-1.5 py-0.5 font-mono text-xs focus:outline-none"
                        >
                          {Array.from({ length: 8 }, (_, v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                        <input
                          type="checkbox"
                          id={`pcp-encode-dei-${i}`}
                          checked={enc.dei}
                          onChange={(e) => handlePcpEncChange(i, 'dei', e.target.checked)}
                          className="accent-indigo-500 cursor-pointer w-4 h-4"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error panel */}
        {error && (
          <div id="priority-validation-error" className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Success panel */}
        {saveSuccess && (
          <div id="priority-validation-success" className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 text-xs font-mono flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Priority mapping committed successfully.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2 border-t border-border/50">
          <button
            type="button"
            id="priority-save-btn"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-all"
          >
            Save Configuration
          </button>
          <button
            type="button"
            id="priority-clear-btn"
            onClick={handleClear}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded text-xs font-semibold transition-all"
          >
            Clear Configuration
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

interface Dot1qForwardingFilteringCardProps {
  nodeUuid: string;
  portName: string;
  initialConfig?: Dot1qForwardingFiltering;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  allPorts: string[];
}

export function Dot1qForwardingFilteringCard({
  nodeUuid,
  portName,
  initialConfig,
  setRefreshKey,
  allPorts
}: Dot1qForwardingFilteringCardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'policies' | 'fdb'>('policies');

  const [ingressFiltering, setIngressFiltering] = useState<boolean>(false);
  const [enableFiltering, setEnableFiltering] = useState<boolean>(false);
  const [acceptableFrameTypes, setAcceptableFrameTypes] = useState<'admit-all' | 'admit-only-vlan-tagged' | 'admit-only-untagged-and-priority-tagged'>('admit-all');
  const [staticEntries, setStaticEntries] = useState<Dot1qStaticFilteringEntry[]>([]);

  // Add FDB Entry form state
  const [newMac, setNewMac] = useState<string>('');
  const [newVlan, setNewVlan] = useState<string>('');
  const [newPortMap, setNewPortMap] = useState<Record<string, 'forward' | 'filter' | 'discard'>>({});

  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [lastPortKey, setLastPortKey] = useState<string>(`${nodeUuid}/${portName}`);

  // Sync state on port change or initialConfig change
  useEffect(() => {
    const portKey = `${nodeUuid}/${portName}`;
    if (portKey !== lastPortKey) {
      setLastPortKey(portKey);
      setSaveSuccess(false);
      setError(null);
    }

    console.log(`Dot1qForwardingFilteringCard sync state: portKey=${portKey}, initialConfig=${JSON.stringify(initialConfig)}`);
    setIngressFiltering(initialConfig?.['ingress-filtering'] ?? false);
    setEnableFiltering(initialConfig?.['enable-filtering'] ?? false);
    setAcceptableFrameTypes(initialConfig?.['acceptable-frame-types'] ?? 'admit-all');
    setStaticEntries(initialConfig?.['static-filtering-entries'] ?? []);

    // Reset Add Entry form
    setNewMac('');
    setNewVlan('');
    const defaultPortMap: Record<string, 'forward' | 'filter' | 'discard'> = {};
    allPorts.forEach(p => {
      defaultPortMap[p] = 'forward';
    });
    setNewPortMap(defaultPortMap);
  }, [initialConfig, nodeUuid, portName, lastPortKey, allPorts]);

  const handleAddEntry = () => {
    setError(null);
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(newMac)) {
      setError('Invalid Destination MAC Address format. Must be like 00:1A:2B:3C:4D:5E.');
      return;
    }

    const vlanNum = parseInt(newVlan, 10);
    if (isNaN(vlanNum) || vlanNum < 1 || vlanNum > 4094) {
      setError('VLAN ID must be an integer between 1 and 4094.');
      return;
    }

    const exists = staticEntries.some(
      entry => entry.address.toLowerCase() === newMac.toLowerCase() && entry['vlan-id'] === vlanNum
    );
    if (exists) {
      setError('Static FDB entry with this MAC Address and VLAN ID already exists.');
      return;
    }

    const newEntry: Dot1qStaticFilteringEntry = {
      address: newMac,
      'vlan-id': vlanNum,
      'port-map': allPorts.map(p => ({
        'port-ref': p,
        'control-element': newPortMap[p] || 'forward'
      }))
    };

    setStaticEntries(prev => [...prev, newEntry]);
    setNewMac('');
    setNewVlan('');
    const resetPortMap: Record<string, 'forward' | 'filter' | 'discard'> = {};
    allPorts.forEach(p => {
      resetPortMap[p] = 'forward';
    });
    setNewPortMap(resetPortMap);
  };

  const handleRemoveEntry = (idx: number) => {
    setStaticEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    setError(null);
    setSaveSuccess(false);

    const config: Dot1qForwardingFiltering = {
      'ingress-filtering': ingressFiltering,
      'acceptable-frame-types': acceptableFrameTypes,
      'enable-filtering': enableFiltering,
      'static-filtering-entries': staticEntries
    };

    try {
      NetworkService.getInstance().updatePortDot1qForwardingFiltering(nodeUuid, portName, config);
      setSaveSuccess(true);
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save configuration.');
    }
  };

  const handleClear = () => {
    try {
      NetworkService.getInstance().updatePortDot1qForwardingFiltering(nodeUuid, portName, undefined);
      setIngressFiltering(false);
      setEnableFiltering(false);
      setAcceptableFrameTypes('admit-all');
      setStaticEntries([]);
      setNewMac('');
      setNewVlan('');
      const resetPortMap: Record<string, 'forward' | 'filter' | 'discard'> = {};
      allPorts.forEach(p => {
        resetPortMap[p] = 'forward';
      });
      setNewPortMap(resetPortMap);
      setError(null);
      setSaveSuccess(false);
      setRefreshKey(prev => prev + 1);
    } catch (e: any) {
      setError(e.message || 'Failed to clear configuration.');
    }
  };

  return (
    <Card className="bg-zinc-950/40 border-zinc-900 shadow-xl backdrop-blur-md mt-6">
      <CardHeader className="border-b border-zinc-900/60 pb-4">
        <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          IEEE 802.1Q Port Maps & Forwarding Policies
        </CardTitle>
        <p className="text-zinc-500 text-xs font-sans">
          Configure egress port maps, ingress filtering policy, acceptable frame admission control, and static FDB filtering entries.
        </p>
      </CardHeader>
      
      <CardContent className="p-5 space-y-6 text-left">
        {/* Tab Selection */}
        <div className="flex border-b border-zinc-900 pb-3 gap-2">
          <button
            type="button"
            id="filtering-tab-policies"
            onClick={() => setActiveSubTab('policies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeSubTab === 'policies'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
            }`}
          >
            Port Policies
          </button>
          <button
            type="button"
            id="filtering-tab-fdb"
            onClick={() => setActiveSubTab('fdb')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeSubTab === 'fdb'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
            }`}
          >
            Static FDB (Port Maps)
          </button>
        </div>

        {/* TAB 1: Port Policies */}
        {activeSubTab === 'policies' && (
          <div className="space-y-4 max-w-md">
            {/* Ingress Filtering */}
            <div className="flex items-center justify-between border-b border-zinc-900/40 pb-3">
              <div>
                <span className="text-white text-xs font-bold block">Ingress Filtering</span>
                <span className="text-zinc-500 text-[10px]">Discard frames if port is not a member of frame's VID</span>
              </div>
              <input
                type="checkbox"
                id="filtering-policy-ingress"
                checked={ingressFiltering}
                onChange={(e) => setIngressFiltering(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-zinc-900 border-zinc-800 focus:ring-indigo-500"
              />
            </div>

            {/* Enable Filtering */}
            <div className="flex items-center justify-between border-b border-zinc-900/40 pb-3">
              <div>
                <span className="text-white text-xs font-bold block">Enable Filtering Database Lookup</span>
                <span className="text-zinc-500 text-[10px]">Enable static and dynamic filtering database lookups</span>
              </div>
              <input
                type="checkbox"
                id="filtering-policy-enable"
                checked={enableFiltering}
                onChange={(e) => setEnableFiltering(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-zinc-900 border-zinc-800 focus:ring-indigo-500"
              />
            </div>

            {/* Acceptable Frame Types */}
            <div className="space-y-1">
              <span className="text-white text-xs font-bold block">Acceptable Frame Types</span>
              <span className="text-zinc-500 text-[10px] block mb-2">Configure frame admission control criteria</span>
              <select
                id="filtering-policy-frame-types"
                value={acceptableFrameTypes}
                onChange={(e) => setAcceptableFrameTypes(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-850 rounded px-2.5 py-1.5 font-sans text-xs text-foreground focus:outline-none focus:border-indigo-500"
              >
                <option value="admit-all">Admit All Frames</option>
                <option value="admit-only-vlan-tagged">Admit Only VLAN Tagged Frames</option>
                <option value="admit-only-untagged-and-priority-tagged">Admit Only Untagged and Priority Tagged Frames</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 2: Static FDB (Port Maps) */}
        {activeSubTab === 'fdb' && (
          <div className="space-y-6">
            {/* Active FDB list */}
            <div className="space-y-3">
              <span className="text-white text-xs font-bold block">Active Static Filtering Entries</span>
              {staticEntries.length === 0 ? (
                <div className="p-3 bg-zinc-950/20 border border-dashed border-zinc-900 rounded-lg text-zinc-500 text-xs font-mono">
                  No static FDB entries configured on this interface.
                </div>
              ) : (
                <div className="overflow-x-auto border border-zinc-900 rounded-lg max-h-[200px]">
                  <table className="w-full text-xs font-mono text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900/50 border-b border-zinc-900 text-zinc-400">
                        <th className="p-2">MAC Address</th>
                        <th className="p-2">VLAN ID</th>
                        <th className="p-2">Port Maps</th>
                        <th className="p-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staticEntries.map((entry, idx) => (
                        <tr key={idx} className="border-b border-zinc-900/40 hover:bg-zinc-900/10 text-zinc-300">
                          <td className="p-2">{entry.address}</td>
                          <td className="p-2">{entry['vlan-id']}</td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1.5">
                              {entry['port-map'].map((pm, pidx) => (
                                <Badge key={pidx} variant="outline" className={`font-mono text-[9px] uppercase border px-1.5 py-0.5 rounded ${
                                  pm['control-element'] === 'forward' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                                  pm['control-element'] === 'filter' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                                  'bg-red-500/15 border-red-500/30 text-red-400'
                                }`}>
                                  {pm['port-ref']}: {pm['control-element']}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveEntry(idx)}
                              className="text-red-400 hover:text-red-300 font-bold px-2 py-1 rounded hover:bg-red-500/10"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <Separator className="bg-zinc-900" />

            {/* Add Entry Form */}
            <div className="space-y-4 bg-zinc-950/20 p-4 border border-zinc-900/60 rounded-xl max-w-xl">
              <span className="text-white text-xs font-bold block">Add Static Forwarding/Filtering Entry</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="fdb-mac-input" className="text-zinc-400 text-[10px] uppercase font-bold block">Destination MAC</label>
                  <input
                    type="text"
                    id="fdb-mac-input"
                    placeholder="e.g. 00:1A:2B:3C:4D:5E"
                    value={newMac}
                    onChange={(e) => setNewMac(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="fdb-vlan-input" className="text-zinc-400 text-[10px] uppercase font-bold block">VLAN ID</label>
                  <input
                    type="number"
                    id="fdb-vlan-input"
                    placeholder="e.g. 10"
                    value={newVlan}
                    onChange={(e) => setNewVlan(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Dynamic Port Map Controls */}
              <div className="space-y-2 pt-2 border-t border-zinc-900/40">
                <span className="text-zinc-400 text-[10px] uppercase font-bold block">Port Map Control Elements</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allPorts.map(p => (
                    <div key={p} className="flex items-center justify-between bg-zinc-900/30 p-2 border border-zinc-900/40 rounded-lg text-xs">
                      <span className="font-mono text-zinc-300">{p}</span>
                      <select
                        id={`fdb-port-control-${p}`}
                        value={newPortMap[p] || 'forward'}
                        onChange={(e) => setNewPortMap(prev => ({ ...prev, [p]: e.target.value as any }))}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 font-sans text-xs text-foreground focus:outline-none focus:border-indigo-500"
                      >
                        <option value="forward">forward</option>
                        <option value="filter">filter</option>
                        <option value="discard">discard</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                id="fdb-add-entry-btn"
                onClick={handleAddEntry}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-all mt-2"
              >
                Add FDB Entry
              </button>
            </div>
          </div>
        )}

        {/* Error panel */}
        {error && (
          <div id="filtering-validation-error" className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Success panel */}
        {saveSuccess && (
          <div id="filtering-validation-success" className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 text-xs font-mono flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Forwarding/Filtering policies committed successfully.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2 border-t border-border/50">
          <button
            type="button"
            id="filtering-save-btn"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-all"
          >
            Save Configuration
          </button>
          <button
            type="button"
            id="filtering-clear-btn"
            onClick={handleClear}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded text-xs font-semibold transition-all"
          >
            Clear Configuration
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

interface Dot1qBridgePortStatisticsCardProps {
  nodeUuid: string;
  portName: string;
  initialConfig?: Dot1qBridgePortStatistics;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
}

export function Dot1qBridgePortStatisticsCard({
  nodeUuid,
  portName,
  initialConfig,
  setRefreshKey
}: Dot1qBridgePortStatisticsCardProps) {
  const [stats, setStats] = useState<Dot1qBridgePortStatistics>({
    'delay-exceeded-discards': 0,
    'mtu-exceeded-discards': 0,
    'discard-on-ingress-filtering': 0,
    'discard-on-egress-filtering': 0,
    'discard-inbound-acceptable-frame-type': 0
  });

  const [lastPortKey, setLastPortKey] = useState<string>(`${nodeUuid}/${portName}`);

  useEffect(() => {
    const portKey = `${nodeUuid}/${portName}`;
    if (portKey !== lastPortKey) {
      setLastPortKey(portKey);
    }
    setStats({
      'delay-exceeded-discards': initialConfig?.['delay-exceeded-discards'] ?? 0,
      'mtu-exceeded-discards': initialConfig?.['mtu-exceeded-discards'] ?? 0,
      'discard-on-ingress-filtering': initialConfig?.['discard-on-ingress-filtering'] ?? 0,
      'discard-on-egress-filtering': initialConfig?.['discard-on-egress-filtering'] ?? 0,
      'discard-inbound-acceptable-frame-type': initialConfig?.['discard-inbound-acceptable-frame-type'] ?? 0
    });
  }, [initialConfig, nodeUuid, portName, lastPortKey]);

  const handleSimulate = () => {
    const incrementedStats: Dot1qBridgePortStatistics = {
      'delay-exceeded-discards': stats['delay-exceeded-discards'] + Math.floor(Math.random() * 5) + 1,
      'mtu-exceeded-discards': stats['mtu-exceeded-discards'] + Math.floor(Math.random() * 3) + 1,
      'discard-on-ingress-filtering': stats['discard-on-ingress-filtering'] + Math.floor(Math.random() * 10) + 1,
      'discard-on-egress-filtering': stats['discard-on-egress-filtering'] + Math.floor(Math.random() * 6) + 1,
      'discard-inbound-acceptable-frame-type': stats['discard-inbound-acceptable-frame-type'] + Math.floor(Math.random() * 4) + 1
    };

    NetworkService.getInstance().updatePortDot1qStatistics(nodeUuid, portName, incrementedStats);
    setStats(incrementedStats);
    setRefreshKey(prev => prev + 1);
  };

  const handleReset = () => {
    NetworkService.getInstance().resetPortDot1qStatistics(nodeUuid, portName);
    setStats({
      'delay-exceeded-discards': 0,
      'mtu-exceeded-discards': 0,
      'discard-on-ingress-filtering': 0,
      'discard-on-egress-filtering': 0,
      'discard-inbound-acceptable-frame-type': 0
    });
    setRefreshKey(prev => prev + 1);
  };

  const totalDiscards = 
    stats['delay-exceeded-discards'] +
    stats['mtu-exceeded-discards'] +
    stats['discard-on-ingress-filtering'] +
    stats['discard-on-egress-filtering'] +
    stats['discard-inbound-acceptable-frame-type'];

  const getPercentage = (val: number) => {
    if (totalDiscards === 0) return 0;
    return Math.round((val / totalDiscards) * 100);
  };

  return (
    <Card className="bg-zinc-950/40 border-zinc-900/60 shadow-xl backdrop-blur-md mt-6">
      <CardHeader className="border-b border-zinc-900/60 pb-4">
        <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          IEEE 802.1Q Bridge Port Statistics & Discard Counters
        </CardTitle>
        <p className="text-zinc-500 text-xs font-sans">
          Operational performance counters and drop statistics. Use simulation controls to inject test drops or clear counters.
        </p>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-left">
          {/* Stat Card 1 */}
          <div className="bg-zinc-900/30 border border-zinc-900/60 p-4 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">Delay Exceeded Drops</span>
            <div className="flex items-baseline justify-between">
              <span id="stat-delay-discards" className="text-lg font-bold text-white font-mono">{stats['delay-exceeded-discards']}</span>
              <span className="text-[10px] text-zinc-400 font-mono">{getPercentage(stats['delay-exceeded-discards'])}%</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${getPercentage(stats['delay-exceeded-discards'])}%` }} 
              />
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-zinc-900/30 border border-zinc-900/60 p-4 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">MTU Exceeded Drops</span>
            <div className="flex items-baseline justify-between">
              <span id="stat-mtu-discards" className="text-lg font-bold text-white font-mono">{stats['mtu-exceeded-discards']}</span>
              <span className="text-[10px] text-zinc-400 font-mono">{getPercentage(stats['mtu-exceeded-discards'])}%</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${getPercentage(stats['mtu-exceeded-discards'])}%` }} 
              />
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-zinc-900/30 border border-zinc-900/60 p-4 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">Ingress Filter Drops</span>
            <div className="flex items-baseline justify-between">
              <span id="stat-ingress-discards" className="text-lg font-bold text-white font-mono">{stats['discard-on-ingress-filtering']}</span>
              <span className="text-[10px] text-zinc-400 font-mono">{getPercentage(stats['discard-on-ingress-filtering'])}%</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-pink-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${getPercentage(stats['discard-on-ingress-filtering'])}%` }} 
              />
            </div>
          </div>

          {/* Stat Card 4 */}
          <div className="bg-zinc-900/30 border border-zinc-900/60 p-4 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">Egress Filter Drops</span>
            <div className="flex items-baseline justify-between">
              <span id="stat-egress-discards" className="text-lg font-bold text-white font-mono">{stats['discard-on-egress-filtering']}</span>
              <span className="text-[10px] text-zinc-400 font-mono">{getPercentage(stats['discard-on-egress-filtering'])}%</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${getPercentage(stats['discard-on-egress-filtering'])}%` }} 
              />
            </div>
          </div>

          {/* Stat Card 5 */}
          <div className="bg-zinc-900/30 border border-zinc-900/60 p-4 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">Frame Type Drops</span>
            <div className="flex items-baseline justify-between">
              <span id="stat-frametype-discards" className="text-lg font-bold text-white font-mono">{stats['discard-inbound-acceptable-frame-type']}</span>
              <span className="text-[10px] text-zinc-400 font-mono">{getPercentage(stats['discard-inbound-acceptable-frame-type'])}%</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${getPercentage(stats['discard-inbound-acceptable-frame-type'])}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-900/60 text-left">
          <button
            type="button"
            id="stats-simulate-btn"
            onClick={handleSimulate}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-all shadow-md"
          >
            <Play className="w-3.5 h-3.5" />
            Simulate Discards
          </button>
          
          <button
            type="button"
            id="stats-reset-btn"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Statistics
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
