import React, { useState, useEffect } from 'react';
import { Router, Cpu, Info, Activity, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle, Settings, Clock, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Button } from '../../ui/button';
import { NetworkService } from '../../../services/networkService';
import { getFacilityLocationAndChassisHelper } from './DetailPlacementCard';
import { MOCK_SERVICES } from '../../../lib/mock-data';

export interface ServiceDetailProps {
  id: string;
  allNodes: any[];
  onNavigate: (id: string, type: any) => void;
}

export function ServiceDetail({ id, allNodes, onNavigate }: ServiceDetailProps) {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic real-time telemetry asynchronously
  useEffect(() => {
    let active = true;
    setLoading(true);
    NetworkService.getInstance().fetchRealtimeTelemetry(id, 'service')
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

  const service = MOCK_SERVICES.find(s => s.id === id);
  if (!service) {
    return <div className="text-left p-6 font-mono text-xs">Service not found in database.</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <Card className="bg-background border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground">Service Configuration</CardTitle>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs px-2.5 py-1">{service.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono font-bold">Type</p>
              <p className="text-base text-foreground/80 font-semibold mt-0.5">{service.type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono font-bold">Context</p>
              <p className="text-base text-foreground/80 font-mono mt-0.5">{service.context_id}</p>
            </div>
          </div>

          {/* Live Dynamic Telemetry */}
          <Separator className="bg-muted" />
          <div className="space-y-2.5">
            <p className="text-xs text-purple-400 uppercase tracking-widest font-mono font-extrabold">Live HIL Telemetry Status</p>
            {loading ? (
              <p className="text-sm text-muted-foreground italic font-mono animate-pulse">Streaming service quality metrics...</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono text-muted-foreground">
                <p><span className="font-semibold text-foreground/80">Jitter:</span> {telemetry?.activeJitterMs}</p>
                <p><span className="font-semibold text-foreground/80">Latency:</span> {telemetry?.averageLatencyMs}</p>
                <p><span className="font-semibold text-foreground/80">Packet Loss:</span> {telemetry?.packetLossPercent}</p>
                <p><span className="font-semibold text-foreground/80">Demand:</span> {telemetry?.currentThroughputGbps}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {service.clientSvc?.['client-svc-instances']?.[0] && (
        <TransClientSvcPanel 
          instance={service.clientSvc['client-svc-instances'][0]} 
          serviceId={id} 
          onNavigate={onNavigate}
        />
      )}

      <Card className="bg-background border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Service Endpoints & Physical Cabinet Placements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {service.endpoints.map(ep => {
              const deviceId = ep.split('/')[0];
              const data = getFacilityLocationAndChassisHelper(deviceId, allNodes);
              return (
                <div key={ep} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Router className="w-5 h-5 text-indigo-400" />
                      <div>
                        <p 
                          className="text-base font-extrabold text-indigo-400 hover:underline cursor-pointer select-all font-mono"
                          onClick={() => onNavigate(deviceId, 'device')}
                        >
                          {ep}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          Device ID:{' '}
                          <span 
                            className="hover:underline cursor-pointer text-indigo-400 font-bold font-mono" 
                            onClick={() => onNavigate(deviceId, 'device')}
                          >
                            {deviceId}
                          </span>
                        </p>
                      </div>
                    </div>
                    {data && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-border text-sm flex items-center gap-1.5 bg-background px-3 py-1.5"
                        onClick={() => onNavigate(data.chassis.uuid, 'hardware')}
                      >
                        <Cpu className="w-4 h-4 text-indigo-400" />
                        Inspect Chassis View
                      </Button>
                    )}
                  </div>

                  {data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/40 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase font-mono font-bold mb-1">Cabinet / Facility Location</p>
                        <p className="text-foreground/80"><span className="font-semibold text-muted-foreground">Site:</span> {data.facility.siteName}</p>
                        <p className="text-foreground/80"><span className="font-semibold text-muted-foreground">Rack:</span> {data.facility.rackIdentifier} (RU {data.facility.rackPosition})</p>
                        <p className="text-foreground/80"><span className="font-semibold text-muted-foreground">Room:</span> {data.facility.roomOrHall}</p>
                      </div>
                      <div className="space-y-1 md:border-l border-border md:pl-4">
                        <p className="text-xs text-muted-foreground uppercase font-mono font-bold mb-1">Chassis Hardware Details</p>
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
}

function TransClientSvcPanel({ 
  instance, 
  serviceId, 
  onNavigate 
}: { 
  instance: any; 
  serviceId: string; 
  onNavigate: (id: string, type: any) => void; 
}) {
  const [adminStatus, setAdminStatus] = useState<'up' | 'down'>(instance['admin-status'] || 'up');
  const [latencyThreshold, setLatencyThreshold] = useState<number>(instance['alarm-threshold']?.['latency-threshold'] || 5000);
  const [currentLatency, setCurrentLatency] = useState<number>(instance.latency || 4200);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [errorInfo, setErrorInfo] = useState<any>(instance['error-info'] || null);
  const [assignedTunnels, setAssignedTunnels] = useState<{ 'tunnel-name': string }[]>(instance['svc-tunnels'] || []);
  const [selectedTunnelToAdd, setSelectedTunnelToAdd] = useState<string>('');

  // Source access port fields
  const [srcNodeId, setSrcNodeId] = useState<string>(instance['src-access-ports']?.['access-node-id'] || '');
  const [srcNodeUri, setSrcNodeUri] = useState<string>(instance['src-access-ports']?.['access-node-uri'] || '');
  const [srcLtpId, setSrcLtpId] = useState<string>(instance['src-access-ports']?.['access-ltp-id'] || '');
  const [srcLtpUri, setSrcLtpUri] = useState<string>(instance['src-access-ports']?.['access-ltp-uri'] || '');

  // Destination access port fields
  const [dstNodeId, setDstNodeId] = useState<string>(instance['dst-access-ports']?.['access-node-id'] || '');
  const [dstNodeUri, setDstNodeUri] = useState<string>(instance['dst-access-ports']?.['access-node-uri'] || '');
  const [dstLtpId, setDstLtpId] = useState<string>(instance['dst-access-ports']?.['access-ltp-id'] || '');
  const [dstLtpUri, setDstLtpUri] = useState<string>(instance['dst-access-ports']?.['access-ltp-uri'] || '');

  const [clientSignal, setClientSignal] = useState<string>(instance['src-access-ports']?.['client-signal'] || 'l1-types:ETH-100Gb-LAN');

  const isDegraded = adminStatus === 'up' && currentLatency > latencyThreshold;
  
  const operationalState = adminStatus === 'down' ? 'down' : (isDegraded ? 'testing' : 'up');
  const provisioningState = adminStatus === 'down' ? 'pending' : (isDegraded ? 'degraded' : 'active');

  const triggerNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleToggleAdmin = () => {
    const newStatus = adminStatus === 'up' ? 'down' : 'up';
    setAdminStatus(newStatus);
    triggerNotification(`Administrative state set to ${newStatus.toUpperCase()} successfully.`);
  };

  const handleSaveMappings = () => {
    const isSrcEthernet = /ge/i.test(srcLtpUri) || /eth/i.test(srcLtpUri);
    const isDstEthernet = /ge/i.test(dstLtpUri) || /eth/i.test(dstLtpUri);
    const isOtuSignal = clientSignal === 'l1-types:OTU4' || clientSignal === 'l1-types:OTU2';

    if (isOtuSignal && (isSrcEthernet || isDstEthernet)) {
      const signalName = clientSignal.split(':')[1] || clientSignal;
      const errInfo = {
        'error-code': '400',
        'error-description': `Configuration rejected: Client signal ${signalName} is incompatible with physical Ethernet transceivers.`,
        'error-timestamp': new Date().toISOString()
      };
      setErrorInfo(errInfo);
      instance['error-info'] = errInfo;
      triggerNotification('Validation block: Incompatible client signal assigned to Ethernet port.');
    } else {
      setErrorInfo(null);
      delete instance['error-info'];

      const updatedSrc = {
        'access-node-id': srcNodeId,
        'access-node-uri': srcNodeUri,
        'access-ltp-id': srcLtpId,
        'access-ltp-uri': srcLtpUri,
        'client-signal': clientSignal
      };
      const updatedDst = {
        'access-node-id': dstNodeId,
        'access-node-uri': dstNodeUri,
        'access-ltp-id': dstLtpId,
        'access-ltp-uri': dstLtpUri,
        'client-signal': clientSignal
      };

      instance['src-access-ports'] = updatedSrc;
      instance['dst-access-ports'] = updatedDst;
      triggerNotification('Access port mappings successfully updated.');
    }
  };

  const handleAddTunnel = () => {
    if (!selectedTunnelToAdd) return;
    if (assignedTunnels.some(t => t['tunnel-name'] === selectedTunnelToAdd)) {
      triggerNotification(`Tunnel ${selectedTunnelToAdd} is already assigned.`);
      return;
    }
    const updated = [...assignedTunnels, { 'tunnel-name': selectedTunnelToAdd }];
    setAssignedTunnels(updated);
    instance['svc-tunnels'] = updated;
    triggerNotification(`Underlay tunnel ${selectedTunnelToAdd} assigned successfully.`);
  };

  const handleRemoveTunnel = (tunnelName: string) => {
    const updated = assignedTunnels.filter(t => t['tunnel-name'] !== tunnelName);
    setAssignedTunnels(updated);
    instance['svc-tunnels'] = updated;
    triggerNotification(`Underlay tunnel ${tunnelName} removed successfully.`);
  };

  return (
    <Card className="bg-background border-border shadow-none" id="trans-client-svc-panel">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <CardTitle className="text-lg font-bold text-foreground">
            Transport Client Service Core Attributes & Port Mappings
          </CardTitle>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 uppercase font-mono text-xs px-2.5 py-1">
            ietf-trans-client-service
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm font-mono flex items-center gap-2 animate-slide-in">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dynamic Alarm Alert Banner */}
        {isDegraded && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-lg text-sm font-mono flex items-start gap-2.5 animate-pulse" id="latency-threshold-alarm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold uppercase block text-red-500 text-sm">Threshold Crossing Alert (TCA)</span>
              <span>Monitored latency of <strong>{currentLatency} µs</strong> exceeds latency-threshold limit of <strong>{latencyThreshold} µs</strong>. Service performance is DEGRADED.</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-mono">
          {/* Left Column: Admin and Config */}
          <div className="space-y-4">
            <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-850 space-y-3.5">
              <span className="text-xs text-zinc-400 font-extrabold uppercase tracking-wide block border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                Administrative Controls
              </span>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-zinc-400 block font-bold">Administrative Status</span>
                  <span className="text-xs text-zinc-500 font-sans">Toggle admin-status parameter</span>
                </div>
                <button
                  id="admin-status-btn"
                  onClick={handleToggleAdmin}
                  className="focus:outline-none transition-all"
                  title={`Toggle administrative state. Currently ${adminStatus.toUpperCase()}`}
                >
                  {adminStatus === 'up' ? (
                    <ToggleRight className="w-10 h-10 text-emerald-500 hover:text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-zinc-600 hover:text-zinc-500" />
                  )}
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-bold">Latency Alert Threshold (µs)</span>
                  <span className="text-xs text-zinc-500">alarm-threshold</span>
                </div>
                <input
                  id="latency-threshold-input"
                  type="number"
                  value={latencyThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLatencyThreshold(val);
                    triggerNotification(`Latency alarm threshold updated to ${val} µs.`);
                  }}
                  className="bg-background border border-border rounded px-2.5 py-1.5 w-full text-white font-mono text-sm focus:border-indigo-500 outline-none"
                  placeholder="e.g. 5000"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-900">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-bold">Simulate Monitored Latency:</span>
                  <span className="text-indigo-400 font-bold">{currentLatency} µs</span>
                </div>
                <input
                  id="latency-slider"
                  type="range"
                  min={1000}
                  max={8000}
                  step={100}
                  value={currentLatency}
                  onChange={(e) => {
                    setCurrentLatency(Number(e.target.value));
                  }}
                  className="w-full accent-indigo-500 h-1 bg-zinc-950 rounded cursor-pointer"
                />
                <span className="text-xs text-zinc-500 block text-right font-sans">Slide to trigger / clear TCA alerts dynamically.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Status Badges and Metadata */}
          <div className="space-y-4">
            <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-850 space-y-3.5">
              <span className="text-xs text-zinc-400 font-extrabold uppercase tracking-wide block border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                State Metrics & Metadata
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                <div className="p-2.5 bg-background border border-border/60 rounded">
                  <span className="text-zinc-500 uppercase block font-mono text-[10px] font-bold">admin-status</span>
                  <span id="admin-status-value" className={`font-mono text-sm font-bold uppercase mt-1 block ${adminStatus === 'up' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {adminStatus}
                  </span>
                </div>
                <div className="p-2.5 bg-background border border-border/60 rounded">
                  <span className="text-zinc-550 uppercase block font-mono text-[10px] font-bold">operational-state</span>
                  <span id="operational-state-value" className={`font-mono text-sm font-bold uppercase mt-1 block ${operationalState === 'up' ? 'text-emerald-400' : (operationalState === 'down' ? 'text-zinc-500' : 'text-amber-400')}`}>
                    {operationalState}
                  </span>
                </div>
                <div className="p-2.5 bg-background border border-border/60 rounded col-span-2">
                  <span className="text-zinc-500 uppercase block font-mono text-[10px] font-bold">provisioning-state</span>
                  <span id="provisioning-state-value" className={`font-mono text-sm font-bold uppercase mt-1 block ${provisioningState === 'active' ? 'text-emerald-400' : (provisioningState === 'pending' ? 'text-zinc-500' : 'text-red-400 animate-pulse')}`}>
                    {provisioningState}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-400 pt-2 border-t border-zinc-900 leading-relaxed">
                <p><span className="text-zinc-550 font-bold">Client Service Name:</span> <span className="font-semibold text-zinc-200">{instance['client-svc-name']}</span></p>
                <p><span className="text-zinc-500 font-bold">Alias/Label:</span> <span className="font-semibold text-zinc-200">{instance['user-label'] || 'None'}</span></p>
                <p><span className="text-zinc-550 font-bold">Customer ID:</span> <span className="font-semibold text-zinc-200">{instance['client-svc-customer'] || 'None'}</span></p>
                <p><span className="text-zinc-550 font-bold">Directionality:</span> <span className="font-semibold text-zinc-200 uppercase">{instance.direction || 'bi-directional'}</span></p>
                <p className="pt-1.5"><span className="text-zinc-550 font-bold">Description:</span> <span className="text-zinc-300 font-sans block mt-0.5 leading-normal">{instance['client-svc-descr'] || 'No description.'}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Access LTP Mapping Selector & Underlay Tunnel Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-mono pt-6 border-t border-border/40">
          
          {/* Access LTP Mapping Selector Card */}
          <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-850 space-y-4">
            <span className="text-xs text-zinc-400 font-extrabold uppercase tracking-wide block border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Logical Access Port Mappings
            </span>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-zinc-300 mb-1">Source Access Port</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-zinc-550 block mb-0.5 font-bold uppercase">Node ID</label>
                    <input
                      id="src-node-id-input"
                      type="text"
                      value={srcNodeId}
                      onChange={(e) => setSrcNodeId(e.target.value)}
                      className="bg-background border border-border rounded px-2 py-1 w-full text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-550 block mb-0.5 font-bold uppercase">Node URI</label>
                    <input
                      id="src-node-uri-input"
                      type="text"
                      value={srcNodeUri}
                      onChange={(e) => setSrcNodeUri(e.target.value)}
                      className="bg-background border border-border rounded px-2 py-1 w-full text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-550 block mb-0.5 font-bold uppercase">LTP ID</label>
                    <input
                      id="src-ltp-id-input"
                      type="text"
                      value={srcLtpId}
                      onChange={(e) => setSrcLtpId(e.target.value)}
                      className="bg-background border border-border rounded px-2 py-1 w-full text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-550 block mb-0.5 font-bold uppercase">LTP URI</label>
                    <input
                      id="src-ltp-uri-input"
                      type="text"
                      value={srcLtpUri}
                      onChange={(e) => setSrcLtpUri(e.target.value)}
                      className="bg-background border border-border rounded px-2 py-1 w-full text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-300 mb-1">Destination Access Port</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-zinc-550 block mb-0.5 font-bold uppercase">Node ID</label>
                    <input
                      id="dst-node-id-input"
                      type="text"
                      value={dstNodeId}
                      onChange={(e) => setDstNodeId(e.target.value)}
                      className="bg-background border border-border rounded px-2 py-1 w-full text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-550 block mb-0.5 font-bold uppercase">Node URI</label>
                    <input
                      id="dst-node-uri-input"
                      type="text"
                      value={dstNodeUri}
                      onChange={(e) => setDstNodeUri(e.target.value)}
                      className="bg-background border border-border rounded px-2 py-1 w-full text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-550 block mb-0.5 font-bold uppercase">LTP ID</label>
                    <input
                      id="dst-ltp-id-input"
                      type="text"
                      value={dstLtpId}
                      onChange={(e) => setDstLtpId(e.target.value)}
                      className="bg-background border border-border rounded px-2 py-1 w-full text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-550 block mb-0.5 font-bold uppercase">LTP URI</label>
                    <input
                      id="dst-ltp-uri-input"
                      type="text"
                      value={dstLtpUri}
                      onChange={(e) => setDstLtpUri(e.target.value)}
                      className="bg-background border border-border rounded px-2 py-1 w-full text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Client Signal Type (ietf-trans-client-service)</label>
                <select
                  id="client-signal-select"
                  value={clientSignal}
                  onChange={(e) => setClientSignal(e.target.value)}
                  className="bg-background border border-border rounded px-2.5 py-1.5 w-full text-white font-mono text-xs focus:border-indigo-500 outline-none"
                >
                  <option value="l1-types:ETH-100Gb-LAN">l1-types:ETH-100Gb-LAN</option>
                  <option value="l1-types:ETH-10Gb-LAN">l1-types:ETH-10Gb-LAN</option>
                  <option value="l1-types:OTU4">l1-types:OTU4 (Optical Transport Unit 4)</option>
                  <option value="l1-types:OTU2">l1-types:OTU2 (Optical Transport Unit 2)</option>
                </select>
              </div>

              <Button
                id="save-mappings-btn"
                onClick={handleSaveMappings}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded text-xs mt-2"
              >
                Save Mappings & Validate Compatibility
              </Button>

              {/* Active Mapping Paths Summary with Clickable Drill-down Spans */}
              <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] space-y-1 text-zinc-400">
                <span className="text-zinc-550 font-bold block mb-1 uppercase text-[9px] tracking-wider">Active Mapping Paths (Click to Drill-Down):</span>
                <p>
                  Source Node ID:{' '}
                  <span 
                    className="cursor-pointer hover:underline text-indigo-400 font-bold"
                    onClick={() => onNavigate(srcNodeUri || srcNodeId, 'device')}
                  >
                    {srcNodeId || 'None'}
                  </span>
                  , URI:{' '}
                  <span 
                    className="cursor-pointer hover:underline text-indigo-400 font-bold"
                    onClick={() => onNavigate(srcNodeUri, 'device')}
                  >
                    {srcNodeUri || 'None'}
                  </span>
                </p>
                <p>
                  Source LTP ID:{' '}
                  <span 
                    className="cursor-pointer hover:underline text-indigo-400 font-bold"
                    onClick={() => onNavigate(`${srcNodeUri || srcNodeId}/${srcLtpUri || srcLtpId}`, 'port')}
                  >
                    {srcLtpId || 'None'}
                  </span>
                  , URI:{' '}
                  <span 
                    className="cursor-pointer hover:underline text-indigo-400 font-bold"
                    onClick={() => onNavigate(`${srcNodeUri || srcNodeId}/${srcLtpUri}`, 'port')}
                  >
                    {srcLtpUri || 'None'}
                  </span>
                </p>
                <p>
                  Dest Node ID:{' '}
                  <span 
                    className="cursor-pointer hover:underline text-indigo-400 font-bold"
                    onClick={() => onNavigate(dstNodeUri || dstNodeId, 'device')}
                  >
                    {dstNodeId || 'None'}
                  </span>
                  , URI:{' '}
                  <span 
                    className="cursor-pointer hover:underline text-indigo-400 font-bold"
                    onClick={() => onNavigate(dstNodeUri, 'device')}
                  >
                    {dstNodeUri || 'None'}
                  </span>
                </p>
                <p>
                  Dest LTP ID:{' '}
                  <span 
                    className="cursor-pointer hover:underline text-indigo-400 font-bold"
                    onClick={() => onNavigate(`${dstNodeUri || dstNodeId}/${dstLtpUri || dstLtpId}`, 'port')}
                  >
                    {dstLtpId || 'None'}
                  </span>
                  , URI:{' '}
                  <span 
                    className="cursor-pointer hover:underline text-indigo-400 font-bold"
                    onClick={() => onNavigate(`${dstNodeUri || dstNodeId}/${dstLtpUri}`, 'port')}
                  >
                    {dstLtpUri || 'None'}
                  </span>
                </p>
              </div>

            </div>
          </div>

          {/* Underlay Tunnel Assignment Card */}
          <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-850 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs text-zinc-400 font-extrabold uppercase tracking-wide block border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Underlay Traffic Engineering Tunnels
              </span>

              {/* Tunnels List */}
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1" id="assigned-tunnels-list">
                {assignedTunnels.length > 0 ? (
                  assignedTunnels.map((tunnel, i) => (
                    <div key={i} className="flex justify-between items-center bg-zinc-950 p-2.5 rounded border border-zinc-900">
                      <span 
                        className="cursor-pointer hover:underline text-indigo-400 font-bold font-mono text-xs"
                        onClick={() => onNavigate(tunnel['tunnel-name'], 'link')}
                      >
                        {tunnel['tunnel-name']}
                      </span>
                      <button
                        onClick={() => handleRemoveTunnel(tunnel['tunnel-name'])}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold font-mono bg-red-950/20 px-2 py-0.5 rounded border border-red-900/30 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 italic py-2">No underlay tunnels assigned to this client service.</p>
                )}
              </div>
            </div>

            {/* Add Tunnel Controls */}
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <label className="text-[10px] text-zinc-450 block font-bold uppercase">Assign Supporting Tunnel</label>
              <div className="flex gap-2">
                <select
                  id="tunnel-select"
                  value={selectedTunnelToAdd}
                  onChange={(e) => setSelectedTunnelToAdd(e.target.value)}
                  className="bg-background border border-border rounded px-2.5 py-1 w-full text-white font-mono text-xs focus:border-indigo-500 outline-none"
                >
                  <option value="">-- Choose TE Tunnel --</option>
                  <option value="tunnel-OTN-TK-to-OS-100G">tunnel-OTN-TK-to-OS-100G (Active Primary)</option>
                  <option value="tunnel-OTN-TK-to-OS-Backup">tunnel-OTN-TK-to-OS-Backup (Standby Protection)</option>
                </select>
                <Button
                  id="add-tunnel-btn"
                  onClick={handleAddTunnel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded text-xs shrink-0"
                >
                  Assign
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Diagnostics & Performance Console */}
        <div className="bg-zinc-900/20 p-4 rounded-xl border border-zinc-850 space-y-4">
          <span className="text-xs text-zinc-400 font-extrabold uppercase tracking-wide block border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Diagnostics & Performance Console
          </span>

          {errorInfo && (
            <div 
              id="diagnostics-error-alert" 
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-lg text-xs font-mono space-y-1 animate-pulse"
            >
              <div className="flex items-center gap-1.5 font-extrabold uppercase text-red-500 text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>YANG Access Compatibility Error (Code {errorInfo['error-code']})</span>
              </div>
              <p className="text-zinc-300 font-sans mt-1">{errorInfo['error-description']}</p>
              <div className="text-[10px] text-zinc-550 pt-1 font-mono">
                Timestamp: {errorInfo['error-timestamp']}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-zinc-950/40 rounded border border-zinc-900/80">
              <span className="text-zinc-550 block font-mono text-[9px] uppercase font-bold">laser-bias-current</span>
              <span className="text-zinc-300 font-bold font-mono text-sm mt-1 block">
                {instance['pm-state']?.['laser-bias-current'] !== undefined ? `${instance['pm-state']['laser-bias-current']} mA` : 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-zinc-950/40 rounded border border-zinc-900/80">
              <span className="text-zinc-550 block font-mono text-[9px] uppercase font-bold">optical-power-rx</span>
              <span className="text-zinc-300 font-bold font-mono text-sm mt-1 block">
                {instance['pm-state']?.['optical-power-rx'] !== undefined ? `${instance['pm-state']['optical-power-rx']} dBm` : 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-zinc-950/40 rounded border border-zinc-900/80">
              <span className="text-zinc-550 block font-mono text-[9px] uppercase font-bold">optical-power-tx</span>
              <span className="text-zinc-300 font-bold font-mono text-sm mt-1 block">
                {instance['pm-state']?.['optical-power-tx'] !== undefined ? `${instance['pm-state']['optical-power-tx']} dBm` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Ownership & Metadata footer */}
        <div className="bg-zinc-900/10 p-4 rounded-xl border border-zinc-850/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-zinc-500">
          <div>
            <span className="block text-zinc-650 uppercase font-mono text-[10px] font-bold">Created By</span>
            <span className="text-zinc-400 font-semibold mt-0.5 block">{instance.metadata?.['created-by'] || 'N/A'}</span>
          </div>
          <div>
            <span className="block text-zinc-650 uppercase font-mono text-[10px] font-bold">Creation Time</span>
            <span className="text-zinc-400 font-semibold mt-0.5 block">{instance.metadata?.['creation-time'] || 'N/A'}</span>
          </div>
          <div>
            <span className="block text-zinc-650 uppercase font-mono text-[10px] font-bold">Last Updated By</span>
            <span className="text-zinc-400 font-semibold mt-0.5 block">{instance.metadata?.['last-updated-by'] || 'N/A'}</span>
          </div>
          <div>
            <span className="block text-zinc-650 uppercase font-mono text-[10px] font-bold">Owned By</span>
            <span className="text-zinc-400 font-semibold mt-0.5 block">{instance.metadata?.['owned-by'] || 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
