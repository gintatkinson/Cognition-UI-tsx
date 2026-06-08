import React, { useState, useEffect } from 'react';
import { GitCommit, Zap, Layers, Share2, Compass, Clock, Activity, Target, ShieldCheck, Gauge } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Button } from '../../ui/button';
import { NetworkService } from '../../../services/networkService';
import { LinkPlacementCard } from './DetailPlacementCard';

export interface LinkDetailProps {
  id: string;
  allNodes: any[];
  onNavigate: (id: string, type: any) => void;
}

export function LinkDetail({ id, allNodes, onNavigate }: LinkDetailProps) {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real-time telemetry from service layer asynchronously (simulating Twin pipeline stream)
  useEffect(() => {
    let active = true;
    setLoading(true);
    NetworkService.getInstance().fetchRealtimeTelemetry(id, 'link')
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

  const getIETFLink = (linkId: string) => {
    const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
    for (const net of rfcNetworks) {
      const found = net.links?.find(l => l.linkId === linkId);
      if (found) {
        return {
          ...found,
          networkId: net.networkId,
          _isLogical: true
        };
      }
    }

    const topo = NetworkService.getInstance().getTopology();
    const physicalLink = topo.links.find(l => l.uuid === linkId);
    if (physicalLink) {
      return {
        linkId: physicalLink.uuid,
        source: {
          sourceNode: physicalLink.sourceNodeUuid,
          sourceTp: physicalLink.sourcePortUuid
        },
        destination: {
          destNode: physicalLink.targetNodeUuid,
          destTp: physicalLink.targetPortUuid
        },
        teMetrics: physicalLink.teMetrics,
        protection: physicalLink.protection,
        networkId: 'Physical Topology',
        sourceNodeUuid: physicalLink.sourceNodeUuid,
        targetNodeUuid: physicalLink.targetNodeUuid,
        _isLogical: false
      };
    }
    return null;
  };

  const getLink = (linkId: string) => {
    const passiveCables = NetworkService.getInstance().getPassiveCables() || [];
    const pc = passiveCables.find(c => c.id === linkId);
    if (pc) {
      return {
        id: pc.id,
        source: pc.aEnd.deviceId || pc.aEnd.neRef || 'A-End',
        target: pc.zEnd.deviceId || pc.zEnd.neRef || 'Z-End',
        capacity: pc.cableRole,
        usage: pc.length,
        type: pc.cableType,
        passiveCable: pc,
        _isPassiveCable: true
      };
    }

    const topo = NetworkService.getInstance().getTopology();
    const physicalLink = topo.links.find(l => l.uuid === linkId);
    if (physicalLink) return { ...physicalLink, _isPassiveCable: false };
    return null;
  };

  const ietfLink = getIETFLink(id);
  const link = getLink(id);

  if (!ietfLink && !link) {
    return <div className="text-left p-6 font-mono text-xs text-muted-foreground">Link details not found.</div>;
  }

  // Render passive physical cable details
  if (link && link._isPassiveCable) {
    const cable = link.passiveCable;
    return (
      <div className="space-y-6 text-left">
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
                 <p className="text-[10px] text-zinc-550 uppercase tracking-widest font-mono mb-1">Cable ID</p>
                 <p className="text-xs font-mono font-bold text-zinc-300">{cable.id}</p>
               </div>
               <div className="p-4 bg-muted/30 border border-border rounded-lg">
                 <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono mb-1">Cable Type</p>
                 <p className="text-xs font-bold text-zinc-300">{cable.cableType}</p>
               </div>
               <div className="p-4 bg-muted/30 border border-border rounded-lg">
                 <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono mb-1">Total physical length</p>
                 <p className="text-xs font-mono text-zinc-300">{cable.length} m</p>
               </div>
               <div className="p-4 bg-muted/30 border border-border rounded-lg">
                 <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono mb-1">Optical Attributes</p>
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
                           <span className="text-emerald-400 font-bold hover:underline cursor-pointer" onClick={() => cable.aEnd.neRef && onNavigate(cable.aEnd.neRef, 'device')}>{cable.aEnd.neRef}</span>
                         </div>
                       </>
                     ) : (
                       <div className="flex justify-between text-xs font-mono">
                         <span className="text-muted-foreground">passive device-id:</span>
                         <span className="text-amber-400 font-bold hover:underline cursor-pointer" onClick={() => cable.aEnd.deviceId && onNavigate(cable.aEnd.deviceId, 'device')}>{cable.aEnd.deviceId}</span>
                       </div>
                     )}
                   </CardContent>
                 </Card>

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
                           <span className="text-indigo-400 font-bold hover:underline cursor-pointer" onClick={() => cable.zEnd.neRef && onNavigate(cable.zEnd.neRef, 'device')}>{cable.zEnd.neRef}</span>
                         </div>
                       </>
                     ) : (
                       <div className="flex justify-between text-xs font-mono">
                         <span className="text-muted-foreground">passive device-id:</span>
                         <span className="text-amber-400 font-bold hover:underline cursor-pointer" onClick={() => cable.zEnd.deviceId && onNavigate(cable.zEnd.deviceId, 'device')}>{cable.zEnd.deviceId}</span>
                       </div>
                     )}
                   </CardContent>
                 </Card>
               </div>
             </div>
          </CardContent>
        </Card>

        <LinkPlacementCard 
          nodeAId={cable.aEnd.deviceId || cable.aEnd.neRef || ''} 
          nodeZId={cable.zEnd.deviceId || cable.zEnd.neRef || ''} 
          allNodes={allNodes} 
          onNavigate={onNavigate} 
        />
      </div>
    );
  }

  // Active link logic
  const dbLinkType = (link as any)?.inventoryMappingAttributes?.linkType;
  const isFsoLink = dbLinkType === 'free-space-optics' || id.toLowerCase().includes('tightbeam') || id.toLowerCase().includes('laser') || id.toLowerCase().includes('sat');
  const isMicrowave = dbLinkType === 'microwave' || id.toLowerCase().includes('microwave');

  const sourceNodeId = ietfLink?.source?.sourceNode || '';
  const targetNodeId = ietfLink?.destination?.destNode || '';

  return (
    <div className="space-y-6 text-left">
      <Card className="bg-background border-border shadow-none">
        <CardHeader className="flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-border pb-4 gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              RFC 8345 Link Details
            </CardTitle>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Topology network domain reference: {ietfLink?.networkId}</p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest font-mono text-[10px] self-start md:self-auto">
            Operational
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-muted/20 border border-border/80 rounded-lg">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Link ID</span>
              <p className="font-mono font-bold text-foreground/90 truncate mt-1">{id}</p>
            </div>
            <div className="p-3.5 bg-muted/20 border border-border/80 rounded-lg">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Capacity</span>
              <p className="font-mono font-bold text-emerald-400 mt-1">{(link as any)?.capacity || '100 Gbps'}</p>
            </div>
            <div className="p-3.5 bg-muted/20 border border-border/80 rounded-lg">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Latency Spec</span>
              <p className="font-mono font-bold text-[#f59e0b] mt-1">{(link as any)?.latency || '1.06 ms'}</p>
            </div>
            <div className="p-3.5 bg-muted/20 border border-border/80 rounded-lg">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Link Protection</span>
              <p className="font-semibold text-zinc-300 mt-1 truncate">{ietfLink?.protection?.protectionType || 'none'}</p>
            </div>
          </div>

          <Separator className="bg-muted" />

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-muted-foreground italic animate-pulse">
              Connecting dynamic twin pipeline telemetry...
            </div>
          ) : (
            <div className="space-y-6">
              {isFsoLink && telemetry && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          <span className="font-mono text-[#10b981] font-bold">{telemetry.pointingErrorOffset}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">alignment-servo-status</span>
                          <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{telemetry.alignmentServoStatus}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">doppler-shift-comp</span>
                          <span className="font-mono text-zinc-300">{telemetry.dopplerShiftComp}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">steering-mechanism</span>
                          <span className="font-semibold text-zinc-300">{telemetry.steeringMechanism}</span>
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
                          <span className="font-semibold text-zinc-300">{telemetry.weatherScintillationLoss}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">standard-protocol</span>
                          <Badge variant="outline" className="text-[10px] font-mono bg-zinc-800 text-zinc-300 border-border">{telemetry.standardProtocol}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">forward-error-correction</span>
                          <span className="font-mono font-bold text-emerald-400">{telemetry.forwardErrorCorrection}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="p-4 bg-muted/10 border border-border rounded-lg space-y-4">
                    <div>
                      <p className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Compass className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                        Pointing, Acquisition, & Tracking (PAT) System Live Sequence Tracker
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">YANG: `ietf-ntn-topology:laser-acquisition-sequence-parameters`</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                      {telemetry.phases?.map((p: any) => (
                        <div key={p.step} className={`p-3 rounded border text-left flex flex-col justify-between ${
                          p.status === 'active' ? 'bg-fuchsia-500/10 border-fuchsia-500 text-zinc-200' : 'bg-zinc-900/40 border-emerald-500/20 text-zinc-300'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-zinc-500 font-bold">Phase #0{p.step}</span>
                              <span className={`text-[9px] font-mono font-bold ${p.status === 'completed' ? 'text-[#10b981]' : 'text-fuchsia-400 animate-pulse'}`}>
                                {p.status.toUpperCase()}
                              </span>
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
                          <p className="text-zinc-200">Terminal Laser: <span className="text-zinc-300 font-bold">{telemetry.laserType}</span></p>
                          <p className="text-zinc-200 mt-1">Beam Divergence: <span className="text-fuchsia-400 font-bold">{telemetry.beamDivergence}</span></p>
                          <p className="text-zinc-200 mt-1">Bit Rate: <span className="text-emerald-400 font-bold">{telemetry.bitRate}</span></p>
                        </div>
                        <div className="p-3 bg-background rounded border border-border/60">
                          <p className="text-[10px] text-cyan-400 mb-1 font-bold">`tracking-servo-loop` Space Details</p>
                          <p className="text-zinc-200">Servo Speed: <span className="text-cyan-400 font-bold">{telemetry.servoLoopSpeed}</span></p>
                          <p className="text-zinc-200 mt-1">Jitter Variance: <span className="text-emerald-400 font-bold">{telemetry.jitterVariance}</span></p>
                          <p className="text-zinc-300 mt-1 italic">Link Margin: {telemetry.linkMargin}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isMicrowave && telemetry && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-muted/15 border-border shadow-none">
                      <CardHeader className="pb-2 border-b border-border/80">
                        <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                          Radio Frequency (RF) Diagnostics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">rssi-signal-strength</span>
                          <span className="font-mono text-emerald-400 font-bold">{telemetry.rssi}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">operating-snr</span>
                          <span className="font-mono text-zinc-200 font-bold">{telemetry.snr}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">carrier-frequency</span>
                          <span className="font-mono text-zinc-350">{telemetry.carrierFrequency}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/15 border-border shadow-none">
                      <CardHeader className="pb-2 border-b border-border/80">
                        <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          Adaptive Modulation (ACM)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">active-modulation-level</span>
                          <span className="font-mono text-cyan-400 font-bold">{telemetry.modulation}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">acm-loop-status</span>
                          <span className="font-semibold text-zinc-200">{telemetry.acmState}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">error-correction-fec</span>
                          <span className="font-mono text-zinc-400">{telemetry.fecCodingRate}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {!isFsoLink && !isMicrowave && telemetry && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-muted/15 border-border shadow-none">
                      <CardHeader className="pb-2 border-b border-border/80">
                        <CardTitle className="text-xs uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                          Fiber Reach & Span
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">span-distance</span>
                          <span className="font-bold font-mono text-zinc-300">{telemetry.distance}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">attenuation-loss</span>
                          <span className="font-mono text-[#f59e0b] font-bold">{telemetry.attenuation}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">chromatic-dispersion</span>
                          <span className="font-mono text-zinc-400">{telemetry.dispersion}</span>
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
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">granularity</span>
                          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">{telemetry.tributarySlotGranularity}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-mono">available-ts</span>
                          <span className="font-mono font-bold text-emerald-400">{telemetry.totalAvailableTs} Slots</span>
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
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {telemetry.supportedClientSignals?.map((sig: string) => (
                            <Badge key={sig} variant="outline" className="text-[9px] font-mono bg-zinc-800 text-zinc-300 border-border">
                              {sig}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Feature 43 Timeslots Grid */}
                  <div className="p-4 bg-muted/10 border border-border rounded-lg space-y-4">
                    <div>
                      <p className="text-xs font-bold text-foreground flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-emerald-400 animate-pulse" />
                        ITU-T G.709.1 / Feature 43 Interactive Timeslot Matrix View
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">YANG: `fgotn-list`/`fgts-range` timeslots allocation map</p>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-10 gap-1.5 max-w-4xl mx-auto">
                        {telemetry.timeslots?.map((slot: any) => {
                          let colorClass = 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500';
                          let titleStr = `TS #${slot.slotNum}: Unallocated`;
                          
                          if (slot.status === 'reserved-tunnel') {
                            colorClass = 'bg-[#3b82f6] hover:bg-[#2563eb] text-white font-extrabold';
                            titleStr = `TS #${slot.slotNum}: Reserved (fgODUflex - High-security Tunnel Link #1)`;
                          } else if (slot.status === 'allocated-shared') {
                            colorClass = 'bg-[#10b981] hover:bg-[#059669] text-white';
                            titleStr = `TS #${slot.slotNum}: Allocated / Unreserved (ODUflex Shared Trunk-Capacity)`;
                          } else if (slot.status === 'reserved-control') {
                            colorClass = 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white';
                            titleStr = `TS #${slot.slotNum}: Reserved (Optical OTU2 Control-Plane transport)`;
                          } else if (slot.status === 'impaired-testing') {
                            colorClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/35 hover:bg-rose-500/20';
                            titleStr = `TS #${slot.slotNum}: Impaired / Fiber Strain Attenuation Testing`;
                          }

                          return (
                            <div 
                              key={slot.slotNum} 
                              className={`h-8 rounded flex items-center justify-center text-[9px] font-mono font-bold cursor-pointer transition-all border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${colorClass}`}
                              title={titleStr}
                            >
                              {slot.slotNum}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 justify-center text-[10px] font-mono pt-3 border-t border-border/40 max-w-2xl mx-auto">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-[#3b82f6]" />
                          <span className="text-zinc-300">Reserved (fgODUflex)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-[#10b981]" />
                          <span className="text-zinc-300">Allocated (Shared Capacity)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-[#8b5cf6]" />
                          <span className="text-zinc-300">Reserved Control-Plane</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-zinc-800 border border-border/30" />
                          <span className="text-zinc-400">Unallocated Timeslots</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-rose-500/10 border border-rose-500/35" />
                          <span className="text-rose-400">Impaired / Testing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <LinkPlacementCard 
        nodeAId={sourceNodeId} 
        nodeZId={targetNodeId} 
        allNodes={allNodes} 
        onNavigate={onNavigate} 
      />
    </div>
  );
}
