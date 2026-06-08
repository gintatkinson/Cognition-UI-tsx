import React, { useState, useEffect } from 'react';
import { Router, Cpu, Info, Activity } from 'lucide-react';
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
              <p className="text-sm text-foreground/80 font-mono">{service.context_id}</p>
            </div>
          </div>

          {/* Live Dynamic Telemetry */}
          <Separator className="bg-muted" />
          <div className="space-y-2">
            <p className="text-[10px] text-purple-400 uppercase tracking-widest font-mono font-bold">Live HIL Telemetry Status</p>
            {loading ? (
              <p className="text-xs text-muted-foreground italic font-mono animate-pulse">Streaming service quality metrics...</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-muted-foreground">
                <p><span className="font-semibold text-foreground/80">Jitter:</span> {telemetry?.activeJitterMs}</p>
                <p><span className="font-semibold text-foreground/80">Latency:</span> {telemetry?.averageLatencyMs}</p>
                <p><span className="font-semibold text-foreground/80">Packet Loss:</span> {telemetry?.packetLossPercent}</p>
                <p><span className="font-semibold text-foreground/80">Demand:</span> {telemetry?.currentThroughputGbps}</p>
              </div>
            )}
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
              const data = getFacilityLocationAndChassisHelper(deviceId, allNodes);
              return (
                <div key={ep} className="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Router className="w-5 h-5 text-indigo-400" />
                      <div>
                        <p 
                          className="text-sm font-extrabold text-indigo-400 hover:underline cursor-pointer select-all font-mono"
                          onClick={() => onNavigate(deviceId, 'device')}
                        >
                          {ep}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Device ID:{' '}
                          <span 
                            className="hover:underline cursor-pointer text-indigo-400 font-bold" 
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
}
