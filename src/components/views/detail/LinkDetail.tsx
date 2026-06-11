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

  // Feature 46 state
  const [nrpGranularity, setNrpGranularity] = useState<'link' | 'link-resource'>('link');
  const [nrpsList, setNrpsList] = useState<any[]>([]);
  
  // Adding form state
  const [newNrpId, setNewNrpId] = useState<string>('');
  const [newBandwidthChoice, setNewBandwidthChoice] = useState<'containers' | 'time-slots'>('containers');
  const [newContainerType, setNewContainerType] = useState<'ODU2' | 'ODU4' | 'ODUflex'>('ODU2');
  const [newTsNum, setNewTsNum] = useState<string>('');
  
  // Validation messages
  const [nrpError, setNrpError] = useState<string | null>(null);
  const [nrpSuccess, setNrpSuccess] = useState<string | null>(null);

  const getIETFLink = (linkId: string) => {
    const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
    for (const net of rfcNetworks) {
      const found = net.links?.find(l => l.linkId === linkId);
      if (found) {
        return {
          ...found,
          _networkId: net.networkId,
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
        _networkId: 'Physical Topology',
        sourceNodeUuid: physicalLink.sourceNodeUuid,
        targetNodeUuid: physicalLink.targetNodeUuid,
        _isLogical: false,
        otnNrpProfile: undefined
      };
    }
    return null;
  };

  const ietfLink = getIETFLink(id);

  // Sync NRP state from link data on load/change
  useEffect(() => {
    if (ietfLink) {
      const profile = ietfLink.otnNrpProfile;
      setNrpGranularity(profile?.['otn-nrp-granularity'] || 'link');
      setNrpsList(profile?.nrps || []);
      setNrpError(null);
      setNrpSuccess(null);
    }
  }, [id, ietfLink?.linkId]);

  const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
  const targetNetwork = rfcNetworks.find(n => n.networkId === ietfLink?._networkId);
  const isOtnTopology = targetNetwork?.otnTopology === true;

  const handleSaveNrpProfile = async () => {
    setNrpError(null);
    setNrpSuccess(null);

    // Scenario 2: Reject if target network topology is not OTN
    if (!isOtnTopology) {
      setNrpError("Configuration rejected: Link does not belong to an OTN topology network.");
      return;
    }

    // Validation: If link-resource, must contain at least one NRP entry
    if (nrpGranularity === 'link-resource' && nrpsList.length === 0) {
      setNrpError("Configuration rejected: link-resource granularity requires at least one NRP entry.");
      return;
    }

    const profile = {
      'otn-nrp-granularity': nrpGranularity,
      nrps: nrpGranularity === 'link-resource' ? nrpsList : []
    };

    try {
      if (ietfLink?._networkId) {
        await NetworkService.getInstance().updateIETFLinkNrpProfile(ietfLink._networkId, ietfLink.linkId, profile);
        setNrpSuccess("NRP partitioning profile successfully mapped on the MPI.");
      }
    } catch (err: any) {
      setNrpError(err.message || "Failed to save NRP profile.");
    }
  };

  const handleAddNrp = (e: React.FormEvent) => {
    e.preventDefault();
    setNrpError(null);
    setNrpSuccess(null);

    const parsedNrpId = parseInt(newNrpId, 10);
    if (isNaN(parsedNrpId) || parsedNrpId < 0) {
      setNrpError("NRP ID must be a non-negative number.");
      return;
    }

    // Duplicate check
    const duplicate = nrpsList.some(n => n['nrp-id'] === parsedNrpId);
    if (duplicate) {
      setNrpError(`Duplicate NRP ID: Partition ${parsedNrpId} is already defined.`);
      return;
    }

    const newNrp: any = {
      'nrp-id': parsedNrpId,
      'nrp-bandwidth': newBandwidthChoice
    };

    if (newBandwidthChoice === 'containers') {
      newNrp['container-type'] = newContainerType;
    } else {
      const parsedTsNum = parseInt(newTsNum, 10);
      if (isNaN(parsedTsNum) || parsedTsNum <= 0) {
        setNrpError("Tributary slot count (otn-ts-num) must be a positive integer.");
        return;
      }
      newNrp['otn-ts-num'] = parsedTsNum;
    }

    setNrpsList(prev => [...prev, newNrp]);
    setNewNrpId('');
    setNewTsNum('');
  };

  const handleDeleteNrp = (nrpId: number) => {
    setNrpsList(prev => prev.filter(n => n['nrp-id'] !== nrpId));
    setNrpError(null);
    setNrpSuccess(null);
  };

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
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Topology network domain reference: {ietfLink?._networkId}</p>
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

      {ietfLink && (
        <Card className="bg-background border-border shadow-none" id="nrp-partitioning-panel">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              OTN Network Resource Partitioning (NRP) MPI Mapping
            </CardTitle>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Configure MPI resource isolation on logical link:{' '}
              <span 
                className="cursor-pointer hover:underline text-indigo-400" 
                onClick={() => onNavigate(ietfLink.linkId, 'link')}
              >
                {ietfLink.linkId}
              </span>{' '}
              in network:{' '}
              <span 
                className="cursor-pointer hover:underline text-indigo-400" 
                onClick={() => onNavigate(ietfLink._networkId, 'network')}
              >
                {ietfLink._networkId}
              </span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {nrpError && (
              <div 
                id="nrp-validation-error" 
                className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono"
              >
                {nrpError}
              </div>
            )}
            {nrpSuccess && (
              <div 
                id="nrp-validation-success" 
                className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono"
              >
                {nrpSuccess}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="nrp-granularity" className="text-xs font-semibold text-zinc-300 block">
                Slicing Granularity:
              </label>
              <select
                id="nrp-granularity"
                value={nrpGranularity}
                onChange={(e) => setNrpGranularity(e.target.value as 'link' | 'link-resource')}
                className="w-full max-w-xs bg-zinc-900 border border-border rounded p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="link">Link (Whole Link)</option>
                <option value="link-resource">Link-Resource (Subset of resources)</option>
              </select>
            </div>

            {nrpGranularity === 'link-resource' && (
              <div className="space-y-4 border border-border/60 rounded p-4 bg-muted/10">
                <p className="text-xs font-bold text-zinc-300">Active NRP Objectives</p>
                {nrpsList.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No NRPs defined. Add at least one partition configuration.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono text-zinc-300">
                      <thead>
                        <tr className="border-b border-border/85 pb-2">
                          <th className="py-2">NRP ID</th>
                          <th className="py-2">Bandwidth Choice</th>
                          <th className="py-2">Value</th>
                          <th className="py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nrpsList.map((nrp) => (
                          <tr key={nrp['nrp-id']} className="border-b border-border/40 hover:bg-muted/20">
                            <td className="py-2 font-bold">{nrp['nrp-id']}</td>
                            <td className="py-2">{nrp['nrp-bandwidth']}</td>
                            <td className="py-2">
                              {nrp['nrp-bandwidth'] === 'containers'
                                ? nrp['container-type']
                                : `${nrp['otn-ts-num']} slot(s)`}
                            </td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteNrp(nrp['nrp-id'])}
                                className="text-rose-400 hover:text-rose-300 text-xs font-semibold focus:outline-none"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <Separator className="bg-border/60" />

                <form onSubmit={handleAddNrp} className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-200">Add NRP Partition</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="new-nrp-id" className="text-[10px] text-muted-foreground font-mono uppercase">
                        NRP ID:
                      </label>
                      <input
                        id="new-nrp-id"
                        type="number"
                        min="0"
                        placeholder="e.g. 101"
                        value={newNrpId}
                        onChange={(e) => setNewNrpId(e.target.value)}
                        className="w-full bg-zinc-900 border border-border rounded p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="new-nrp-bandwidth" className="text-[10px] text-muted-foreground font-mono uppercase">
                        Bandwidth Mode:
                      </label>
                      <select
                        id="new-nrp-bandwidth"
                        value={newBandwidthChoice}
                        onChange={(e) => setNewBandwidthChoice(e.target.value as 'containers' | 'time-slots')}
                        className="w-full bg-zinc-900 border border-border rounded p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="containers">Containers</option>
                        <option value="time-slots">Time Slots</option>
                      </select>
                    </div>

                    {newBandwidthChoice === 'containers' ? (
                      <div className="space-y-1">
                        <label htmlFor="new-nrp-container" className="text-[10px] text-muted-foreground font-mono uppercase">
                          Container Type:
                        </label>
                        <select
                          id="new-nrp-container"
                          value={newContainerType}
                          onChange={(e) => setNewContainerType(e.target.value as 'ODU2' | 'ODU4' | 'ODUflex')}
                          className="w-full bg-zinc-900 border border-border rounded p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="ODU2">ODU2</option>
                          <option value="ODU4">ODU4</option>
                          <option value="ODUflex">ODUflex</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label htmlFor="new-nrp-ts-num" className="text-[10px] text-muted-foreground font-mono uppercase">
                          Slot Count:
                        </label>
                        <input
                          id="new-nrp-ts-num"
                          type="number"
                          min="1"
                          placeholder="e.g. 8"
                          value={newTsNum}
                          onChange={(e) => setNewTsNum(e.target.value)}
                          className="w-full bg-zinc-900 border border-border rounded p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    <div className="flex items-end">
                      <Button
                        id="add-nrp-btn"
                        type="submit"
                        variant="secondary"
                        className="w-full h-8 text-xs font-semibold"
                      >
                        Add Partition
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                id="save-nrp-profile-btn"
                onClick={handleSaveNrpProfile}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2"
              >
                Save NRP Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <LinkPlacementCard 
        nodeAId={sourceNodeId} 
        nodeZId={targetNodeId} 
        allNodes={allNodes} 
        onNavigate={onNavigate} 
      />
    </div>
  );
}
