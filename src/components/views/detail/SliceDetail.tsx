import React, { useState, useEffect } from 'react';
import { Activity, ExternalLink, Layers, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Button } from '../../ui/button';
import { NetworkService } from '../../../services/networkService';
import { getFacilityLocationAndChassisHelper } from './DetailPlacementCard';
import { MOCK_SLICES, MOCK_SERVICES } from '../../../lib/mock-data';

export interface SliceDetailProps {
  id: string;
  allNodes: any[];
  onNavigate: (id: string, type: any) => void;
}

export function SliceDetail({ id, allNodes, onNavigate }: SliceDetailProps) {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const slice = MOCK_SLICES.find(s => s.id === id);
  if (!slice) {
    return <div className="text-left p-6 font-mono text-xs">Slice not found in database.</div>;
  }

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
