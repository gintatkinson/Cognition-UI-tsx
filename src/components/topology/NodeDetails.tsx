
import React from 'react';
import { QKDDevice, Device } from '@/types/tfs';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Cpu, 
  Activity, 
  ShieldCheck, 
  Thermometer, 
  Zap, 
  Network,
  Info,
  ExternalLink
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NodeDetailsProps {
  device: Device | QKDDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
}

export function NodeDetails({ device, isOpen, onClose, onNavigate }: NodeDetailsProps) {
  if (!device) return null;

  const isQKD = device.type === 'QKD_NODE';
  const qkd = isQKD ? (device as QKDDevice).qkd_capabilities : null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-background border-border text-foreground">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant={device.status === 'OPERATIONAL' ? 'default' : 'destructive'} className="uppercase text-[10px] tracking-widest">
              {device.status}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                ID: {device.id}
              </span>
            </div>
          </div>
          <SheetTitle className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            {isQKD ? <ShieldCheck className="w-8 h-8 text-emerald-500" /> : <Cpu className="w-8 h-8 text-blue-500" />}
            {device.name}
          </SheetTitle>
          <div className="flex items-center justify-between">
            <SheetDescription className="text-muted-foreground font-mono text-xs uppercase tracking-wide">
              {device.type} • {device.drivers.join(', ')}
            </SheetDescription>
            {onNavigate && (
              <button
                onClick={() => {
                  onNavigate(device.id, 'device');
                  onClose();
                }}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
              >
                View Full Details <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </SheetHeader>

        <Separator className="my-6 bg-muted" />

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <div className="space-y-8">
            {/* QKD Specific Stats */}
            {isQKD && qkd && (
              <section className="space-y-6">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 space-y-3">
                  <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    ETSI Compliance Overview
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-muted-foreground font-mono">QKD 014</span>
                      <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400 py-0 h-4">KEY MGMT</Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-muted-foreground font-mono">QKD 015</span>
                      <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400 py-0 h-4">CONTROL</Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-muted-foreground font-mono">QKD 018</span>
                      <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400 py-0 h-4">ORCHESTR.</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Quantum Performance (ETSI 015)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 border border-border p-4 rounded-lg space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase">Secret Key Rate</p>
                      <p className="text-xl font-mono font-bold text-emerald-400">{(qkd.max_skr / 1000).toFixed(1)} Kbps</p>
                    </div>
                    <div className="bg-muted/50 border border-border p-4 rounded-lg space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase">QBER</p>
                      <p className={`text-xl font-mono font-bold ${qkd.quantum_bit_error_rate && qkd.quantum_bit_error_rate > 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {qkd.quantum_bit_error_rate?.toFixed(2)}%
                      </p>
                    </div>
                    <div className="bg-muted/50 border border-border p-4 rounded-lg space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase">Sync Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${qkd.sync_status === 'LOCKED' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <p className="text-xl font-mono font-bold text-foreground/90">{qkd.sync_status}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 border border-border p-4 rounded-lg space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase">Laser Status</p>
                      <div className="flex items-center gap-2">
                        <Zap className={`w-4 h-4 ${qkd.laser_status === 'STABLE' ? 'text-emerald-500' : 'text-red-500'}`} />
                        <p className={`text-xl font-mono font-bold ${qkd.laser_status === 'STABLE' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {qkd.laser_status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Pool Visualization */}
                <div className="bg-muted/50 border border-border p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] text-muted-foreground uppercase">Key Pool (ETSI 014)</p>
                    <p className="text-xs font-mono text-foreground/80">
                      {qkd.key_pool_available?.toLocaleString()} / {qkd.key_pool_capacity?.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden border border-border">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${((qkd.key_pool_available || 0) / (qkd.key_pool_capacity || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-muted-foreground/80 uppercase">
                    <span>Available Keys</span>
                    <span>{Math.round(((qkd.key_pool_available || 0) / (qkd.key_pool_capacity || 1)) * 100)}%</span>
                  </div>
                </div>
                
                <div className="bg-muted/50 border border-border p-4 rounded-lg space-y-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Supported Protocols (ETSI 015)</p>
                  <div className="flex flex-wrap gap-2">
                    {qkd.supported_protocols.map(p => (
                      <Badge key={p} variant="outline" className="bg-background border-zinc-700 text-foreground/80 font-mono text-[10px]">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 border border-border p-4 rounded-lg space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase">Active Sessions (ETSI 018)</p>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-mono font-bold text-foreground">{qkd.active_sessions}</div>
                    <div className="flex-1 h-[1px] bg-muted" />
                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500/70">ORCHESTRATED</Badge>
                  </div>
                </div>
              </section>
            )}

            {/* General Network Info */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Network className="w-3 h-3" />
                Connectivity & Endpoints
              </h3>
              <div className="space-y-2">
                {device.endpoints.map(ep => (
                  <div key={ep} className="flex items-center justify-between bg-muted/30 p-3 rounded border border-border/50 group cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => { if(onNavigate) { onNavigate(ep, 'port'); onClose(); } }}>
                    <span className="text-sm font-mono text-foreground/80 group-hover:text-blue-400 group-hover:underline">{ep}</span>
                    <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-500/70">ACTIVE</Badge>
                  </div>
                ))}
              </div>
            </section>

            {/* Metadata */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Info className="w-3 h-3" />
                System Metadata
              </h3>
              <div className="bg-muted/50 border border-border p-4 rounded-lg space-y-4 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">FIRMWARE</span>
                  <span className="text-foreground/90">v2.4.1-etsi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">UPTIME</span>
                  <span className="text-foreground/90">12d 04h 22m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">LOCATION</span>
                  <span className="text-foreground/90">40.7128° N, 74.0060° W</span>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
