import React, { useState, useEffect } from 'react';
import { Activity, ExternalLink, Layers, Cpu, AlertTriangle, Trash2, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { NetworkService } from '../../../services/networkService';
import { getFacilityLocationAndChassisHelper } from './DetailPlacementCard';
import { MOCK_SERVICES } from '../../../lib/mock-data';
import { OduPmObjective } from '../../../types/tfs';

export interface SliceDetailProps {
  id: string;
  allNodes: any[];
  onNavigate: (id: string, type: any) => void;
}

export function SliceDetail({ id, allNodes, onNavigate }: SliceDetailProps) {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [slice, setSlice] = useState<any>(null);
  const [objectives, setObjectives] = useState<OduPmObjective[]>([]);

  const [newDuration, setNewDuration] = useState<'pm-15m' | 'pm-24h'>('pm-15m');
  const [newPmType, setNewPmType] = useState<string>('odu-ses');
  const [newThreshold, setNewThreshold] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);

  // Sync state if id changes
  useEffect(() => {
    const foundSlice = NetworkService.getInstance().getSlices().find(s => s.id === id);
    setSlice(foundSlice || null);
    setObjectives(foundSlice?.otn?.['odu-signal-quality']?.['odu-pm-objective'] || []);
    setValidationError(null);
    setValidationSuccess(null);
  }, [id]);

  // Fetch dynamic real-time telemetry asynchronously
  useEffect(() => {
    let active = true;
    setLoading(true);
    NetworkService.getInstance().fetchRealtimeTelemetry(id, 'slice')
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

  if (!slice) {
    return <div className="text-left p-6 font-mono text-xs">Slice not found in database.</div>;
  }

  const updateSliceObjectives = async (newObjectives: OduPmObjective[]) => {
    try {
      await NetworkService.getInstance().updateSliceObjectives(id, newObjectives);
      setObjectives(newObjectives);
      if (slice) {
        if (!slice.otn) slice.otn = {};
        if (!slice.otn['odu-signal-quality']) slice.otn['odu-signal-quality'] = {};
        slice.otn['odu-signal-quality']['odu-pm-objective'] = newObjectives;
      }
    } catch (err: any) {
      console.error("Failed to persist objectives in database:", err);
      throw err;
    }
  };

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setValidationSuccess(null);

    const thresholdVal = parseFloat(newThreshold);
    if (isNaN(thresholdVal) || thresholdVal < 0) {
      setValidationError("Threshold must be a non-negative number.");
      return;
    }

    // Check duplicate
    const exists = objectives.some(
      obj => obj.duration === newDuration && obj['pm-type'] === newPmType
    );
    if (exists) {
      setValidationError(`Duplicate objective: A performance objective for duration "${newDuration}" and metric "${newPmType}" is already configured.`);
      return;
    }

    const newObj: OduPmObjective = {
      duration: newDuration,
      'pm-type': newPmType as any,
      'pm-threshold': thresholdVal
    };

    const updated = [...objectives, newObj];
    try {
      await updateSliceObjectives(updated);
      setNewThreshold('');
      setValidationSuccess(`Objective successfully configured for ${newPmType} (${newDuration}).`);
    } catch (err: any) {
      setValidationError(err.message || "Database sync failed. Changes were not saved.");
    }
  };

  const handleDeleteObjective = async (duration: string, pmType: string) => {
    setValidationError(null);
    setValidationSuccess(null);
    const updated = objectives.filter(
      obj => !(obj.duration === duration && obj['pm-type'] === pmType)
    );
    try {
      await updateSliceObjectives(updated);
      setValidationSuccess("Objective removed successfully.");
    } catch (err: any) {
      setValidationError(err.message || "Database sync failed. Changes were not saved.");
    }
  };

  // Live performance counters mapping
  const liveMetrics: Record<string, number> = {
    'odu-bbe': 5,
    'odu-es': 3,
    'odu-ses': 20,
    'odu-uas': 0,
    'odu-ber': 80,
    'bit-error-rate': 0.000002
  };

  const uniqueDeviceIds = new Set<string>();
  slice.service_ids.forEach(svcId => {
    const service = MOCK_SERVICES.find(s => s.id === svcId);
    if (service) {
      service.endpoints.forEach(ep => {
        const deviceId = ep.split('/')[0];
        uniqueDeviceIds.add(deviceId);
      });
    }
  });

  return (
    <div className="space-y-6 text-left">
      <Card className="bg-background border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Slice Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">This slice isolates resources for specific network performance requirements.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted border border-border rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Status</p>
              <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">{slice.status}</Badge>
            </div>
            <div className="p-4 bg-muted border border-border rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono mb-1">Context</p>
              <p className="text-sm font-medium font-mono">{slice.context_id}</p>
            </div>
          </div>

          {/* Live Dynamic Telemetry */}
          <Separator className="bg-muted" />
          <div className="space-y-2">
            <p className="text-[10px] text-purple-400 uppercase tracking-widest font-mono font-bold">Live HIL Telemetry Status</p>
            {loading ? (
              <p className="text-xs text-muted-foreground italic font-mono animate-pulse">Streaming slice telemetry...</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-muted-foreground">
                <p><span className="font-semibold text-foreground/80">Dedicated BW:</span> {telemetry?.dedicatedBandwidthGbps}</p>
                <p><span className="font-semibold text-foreground/80">Sessions:</span> {telemetry?.activeSliceSessions}</p>
                <p><span className="font-semibold text-foreground/80">CPU Cores:</span> {telemetry?.allocatedCpuCores}</p>
                <p><span className="font-semibold text-foreground/80">Memory Usage:</span> {telemetry?.sliceMemoryUsagePercent}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature 45: OTN Performance Monitoring & SLO */}
      <Card className="bg-background border-border shadow-none" id="otn-pm-slo-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border bg-muted/5">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            OTN Performance Monitoring & SLO Configuration
          </CardTitle>
          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] uppercase font-mono">
            YANG: ietf-otn-slice
          </Badge>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {/* Form to add objective */}
          <form onSubmit={handleAddObjective} className="bg-muted/30 p-4 border border-border/50 rounded-lg space-y-4">
            <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Configure New PM Objective</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-mono font-bold">Duration (pm-duration)</label>
                <select
                  id="pm-duration-select"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value as any)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                >
                  <option value="pm-15m">15 Minutes (pm-15m)</option>
                  <option value="pm-24h">24 Hours (pm-24h)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-mono font-bold">Metric Type (pm-type)</label>
                <select
                  id="pm-type-select"
                  value={newPmType}
                  onChange={(e) => setNewPmType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                >
                  <option value="odu-bbe">Background Block Error (odu-bbe)</option>
                  <option value="odu-es">Errored Seconds (odu-es)</option>
                  <option value="odu-ses">Severely Errored Seconds (odu-ses)</option>
                  <option value="odu-uas">Unavailable Seconds (odu-uas)</option>
                  <option value="odu-ber">Bit Error Rate threshold (odu-ber)</option>
                  <option value="bit-error-rate">Bit Error Rate SLO (bit-error-rate)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase font-mono font-bold">Threshold Value (pm-threshold)</label>
                <div className="flex gap-2">
                  <Input
                    id="pm-threshold-input"
                    type="number"
                    step="any"
                    placeholder="Enter limit value"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    className="flex-1 bg-background"
                  />
                  <Button type="submit" id="add-pm-objective-btn" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 p-2 px-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-xs" id="pm-validation-error">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-mono">{validationError}</span>
              </div>
            )}

            {validationSuccess && (
              <div className="flex items-center gap-2 p-2 px-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-xs" id="pm-validation-success">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-mono">{validationSuccess}</span>
              </div>
            )}
          </form>

          {/* Table of active objectives */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Active Performance Objectives</h5>
            {objectives.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono italic" id="no-pm-objectives-msg">
                No performance objectives configured on this slice yet. Use the form above to add signal quality thresholds.
              </p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left text-muted-foreground font-mono">
                  <thead className="bg-muted text-[10px] uppercase text-zinc-400">
                    <tr>
                      <th className="p-3">Duration</th>
                      <th className="p-3">PM Metric Type</th>
                      <th className="p-3">Threshold Limit</th>
                      <th className="p-3">Live Value</th>
                      <th className="p-3 text-center">Alarm Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {objectives.map((obj) => {
                      const liveVal = liveMetrics[obj['pm-type']] ?? 0;
                      const isAlarm = liveVal > obj['pm-threshold'];
                      
                      return (
                        <tr key={`${obj.duration}-${obj['pm-type']}`} className="hover:bg-muted/20" data-testid="pm-objective-row">
                          <td className="p-3 font-semibold text-foreground">{obj.duration}</td>
                          <td className="p-3 text-zinc-300 font-bold">{obj['pm-type']}</td>
                          <td className="p-3">{obj['pm-threshold']}</td>
                          <td className="p-3">{liveVal}</td>
                          <td className="p-3 text-center">
                            {isAlarm ? (
                              <Badge className="bg-red-500/10 text-red-500 border-red-500/25 animate-pulse flex items-center gap-1 w-fit mx-auto" data-testid="alarm-badge">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                🚨 Exceeded
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/25 flex items-center gap-1 w-fit mx-auto" data-testid="normal-badge">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Normal
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                              onClick={() => handleDeleteObjective(obj.duration, obj['pm-type'])}
                              data-testid="delete-pm-objective-btn"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
              const service = MOCK_SERVICES.find(s => s.id === svcId);
              return (
                <div 
                  key={svcId} 
                  className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-md hover:border-blue-500/50 transition-colors group cursor-pointer" 
                  onClick={() => onNavigate(svcId, 'service')}
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-muted-foreground group-hover:text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground/90">{service?.name || svcId}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">ID: {svcId}</p>
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
                const data = getFacilityLocationAndChassisHelper(devId, allNodes);
                if (!data) return null;
                return (
                  <div key={devId} className="p-4 bg-muted/15 border border-border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p 
                          className="text-sm font-extrabold text-indigo-400 hover:underline cursor-pointer select-all font-mono"
                          onClick={() => onNavigate(data.nodeUuid, 'device')}
                        >
                          {data.nodeName}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-mono">Device: <span className="hover:underline cursor-pointer text-indigo-400 font-bold" onClick={() => onNavigate(data.nodeUuid, 'device')}>{data.nodeUuid}</span></p>
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
}
