import React from 'react';
import { 
  Zap, 
  Target, 
  Layers, 
  Cpu, 
  Compass, 
  Radio, 
  ArrowRight, 
  ShieldCheck, 
  Satellite, 
  Network, 
  Globe, 
  Info,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SatellitePayloadSchematicProps {
  node: {
    uuid: string;
    name: string;
    type: string;
    layer: string;
    location: string;
    ietfSystem?: {
      hostname: string;
      contact: string;
      location: string;
      platform: {
        osName: string;
        osRelease: string;
      };
      clock?: {
        timezoneName: string;
        currentDatetime: string;
      };
    };
    ietfInterfaces?: any[];
    hardware?: any[];
  };
  onNavigate: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
  networkLinks: any[];
  allNodes: any[];
}

export function SatellitePayloadSchematic({ node, onNavigate, networkLinks, allNodes }: SatellitePayloadSchematicProps) {
  const [selectedFlow, setSelectedFlow] = React.useState<'isl' | 'front-haul' | 'ground-user'>('isl');

  // Extract satellite number index (e.g. 1, 2, 3, 4) safely from uuid or name
  const satMatch = (node?.uuid || '').match(/\d+/) || (node?.name || '').match(/\d+/);
  const currentSatNum = satMatch ? parseInt(satMatch[0]) : 2;
  const hostname = node?.ietfSystem?.hostname || `sat-${currentSatNum}`;

  // Find linked neighbors from networkLinks
  const currentLinks = networkLinks.filter(
    l => l.sourceNodeUuid === node.uuid || l.targetNodeUuid === node.uuid
  );

  // Parse Neighbors: ISL neighbors (other satellites)
  const leftSatNum = currentSatNum > 1 ? currentSatNum - 1 : null;
  const rightSatNum = currentSatNum < 4 ? currentSatNum + 1 : null;

  const leftSatUuid = leftSatNum ? `node-SAT${leftSatNum}` : null;
  const rightSatUuid = rightSatNum ? `node-SAT${rightSatNum}` : null;

  const leftSatNode = leftSatUuid ? allNodes.find(n => n.uuid === leftSatUuid) : null;
  const rightSatNode = rightSatUuid ? allNodes.find(n => n.uuid === rightSatUuid) : null;

  // Filter linked ground gateways from topology
  const groundLinks = currentLinks.filter(l => {
    const isMobileOrNTNOrBackhaul = l.layer?.toLowerCase().includes('ntn') || 
                                    l.layer?.toLowerCase().includes('backhaul') || 
                                    l.layer?.toLowerCase().includes('mobile');
    const oppNodeUuid = l.sourceNodeUuid === node.uuid ? l.targetNodeUuid : l.sourceNodeUuid;
    const oppNode = allNodes.find(n => n.uuid === oppNodeUuid);
    const isOppSatellite = oppNode?.type === 'SATELLITE';
    return isMobileOrNTNOrBackhaul && !isOppSatellite;
  });
  const groundGateways = groundLinks.map(l => {
    const oppNodeUuid = l.sourceNodeUuid === node.uuid ? l.targetNodeUuid : l.sourceNodeUuid;
    const oppNode = allNodes.find(n => n.uuid === oppNodeUuid);
    return {
      uuid: oppNodeUuid,
      name: oppNode?.name || oppNodeUuid,
      linkUuid: l.uuid,
      capacity: l.capacity,
      usage: l.usage
    };
  });

  const activeIslPortName = node.ietfInterfaces?.find(i => i.name.startsWith('isl-port-') && i.enabled)?.name || 'isl-port-1';
  const activeDownlinkPortName = node.ietfInterfaces?.find(i => i.name.startsWith('sat-downlink-') && i.enabled)?.name || 'sat-downlink-1';

  // Flow pathway parameters
  const flowConfig = {
    isl: {
      title: "Inter-Satellite Link (ISL) Optical Laser Bus",
      desc: "Traces high-rate cross-link traffic entering from adjacent orbital units, directly routed over on-board coherent transceivers.",
      color: "border-fuchsia-500/50 hover:border-fuchsia-500 bg-fuchsia-500/5 text-fuchsia-400",
      pillClass: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
      activePort: `${node.uuid}/${activeIslPortName}`,
      portsList: [activeIslPortName],
      latency: "1.06 ms propagation delay",
      speed: "100 Gbps Coherent Space Optics",
      throughput: "14.2 Gbps current demand",
      fecMode: "High-Gain SD-FEC (15% overhead)",
      telemetry: [
        { label: "laser-optical-wavelength", value: "1550 nm (C-Band Optical)" },
        { label: "pointing-error-offset", value: "1.2 μrad (Servo goal < 1.5)" },
        { label: "doppler-compensation", value: "±24.6 GHz (LEO Orbit Dynamic)" },
        { label: "jitter-variance-rms", value: "0.14 μrad RMS" },
        { label: "tracking-alignment", value: "LOCKED (Coarse & Fine)" }
      ]
    },
    'front-haul': {
      title: "O-RAN Fronthaul (eCPRI Option-7.2x) Loop",
      desc: "Internal bus interfacing the regenerative baseband payload processor to the software-defined radio frontend components.",
      color: "border-cyan-500/50 hover:border-cyan-500 bg-cyan-500/5 text-cyan-400",
      pillClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      activePort: `${node.uuid}/open-front-haul`,
      portsList: ["open-front-haul"],
      latency: "235 ns internal propagation delay",
      speed: "25 Gbps High-Performance Ethernet",
      throughput: "12.8 Gbps active flow",
      fecMode: "Standard Reed-Solomon RS(544, 514)",
      telemetry: [
        { label: "ecpri-packet-loss", value: "0.00% (No bus congestion)" },
        { label: "clock-sync-skew", value: "3.2 ns (Locked Space PTP Profile)" },
        { label: "digital-iq-compression", value: "Block Floating Point 9-bit" },
        { label: "phy-conversion-mode", value: "O-RU Sub-frame processing" },
        { label: "power-draw-bus", value: "124 W (Peak payload mode)" }
      ]
    },
    'ground-user': {
      title: "NTN Feeder & User-Plane Ground-Link Backhaul",
      desc: "Dynamic space-to-ground backhaul mapping packet tunnels down to Earth gateways, bypassing dense atmospheric scintillation.",
      color: "border-emerald-500/50 hover:border-emerald-500 bg-emerald-500/5 text-emerald-400",
      pillClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      activePort: `${node.uuid}/${activeDownlinkPortName}`,
      portsList: [activeDownlinkPortName],
      latency: "4.02 ms (Free space propagation to ground)",
      speed: "10 Gbps Ethernet over Satellite",
      throughput: "3.5 Gbps payload usage",
      fecMode: "DVB-S2X LDPC (rate 3/4)",
      telemetry: [
        { label: "zenith-atmospheric-loss", value: "3.85 dB (Clear Sky Zenith)" },
        { label: "dynamic-doppler-shift", value: "±180 kHz carrier compensate" },
        { label: "feeder-beamformer-state", value: "ACTIVE (Dual polarization)" },
        { label: "active-gateway-switches", value: `${groundGateways.length} Mapped Gateways` },
        { label: "uplink-ber-pre-fec", value: "4.5e-5 BER (Good link budget)" }
      ]
    }
  };

  const activeConfig = flowConfig[selectedFlow];

  return (
    <Card className="bg-background border-border shadow-none overflow-hidden mt-6">
      <CardHeader className="bg-muted/30 border-b border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Satellite className="w-5 h-5 text-fuchsia-400" />
            Orbital Payload Block & Signal Flow Control Room
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">
            Interactive system bus schematic mapping physical nodes, dynamic laser systems, and microwave arrays.
          </p>
        </div>
        <div className="flex bg-muted/65 p-1 rounded-lg border border-border/80 self-start">
          {(['isl', 'front-haul', 'ground-user'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedFlow(key)}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all ${
                selectedFlow === key
                  ? 'bg-zinc-800 text-zinc-100 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {key === 'isl' ? 'ISL Laser Link' : key === 'front-haul' ? 'O-RAN Fronthaul' : 'NTN Ground-Backhaul'}
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        
        {/* TOP ORBITAL TELEMETRY STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-muted/15 border border-border/60 rounded-lg text-left">
          <div>
            <span className="text-[9px] uppercase font-mono text-muted-foreground block">Orbital Class / Altitude</span>
            <span className="text-xs font-bold text-foreground font-mono">LEO / 1,200 km Orbit</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-muted-foreground block">Orbital Velocity</span>
            <span className="text-xs font-bold text-fuchsia-400 font-mono">7.56 km/s (~27,200 km/h)</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-muted-foreground block">Spacecraft Operating Mode</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">REGENERATIVE PAYLOAD (L2/L3)</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-mono text-muted-foreground block">Solar Array Charge Rate</span>
            <span className="text-xs font-bold text-amber-500 font-mono">100% (4.2 kW Generated)</span>
          </div>
        </div>

        {/* METADATA DIAGRAM BLOCK */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
          
          {/* VISUAL DIAGRAM COLUMN (8 COLS) */}
          <div className="lg:col-span-8 p-4 bg-muted/5 border border-border/70 rounded-xl flex flex-col justify-between relative min-h-[420px] overflow-hidden">
            <div className="absolute top-3 right-3 text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dynamic Servo Link Locked
            </div>

            {/* Adjacent Inputs (Satellites & Ground Stations) */}
            <div className="grid grid-cols-12 gap-4 h-full relative z-10 pt-4">
              
              {/* LEFT GATEWAY SIDE (Ground gateway feeds and Satellite neighbors) */}
              <div className="col-span-3 flex flex-col justify-center space-y-8 text-left">
                {/* Left Satellite neighboring element */}
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground">ISL Inbound</p>
                  {leftSatNode ? (
                    <div 
                      onClick={() => onNavigate(leftSatNode.uuid, 'device')}
                      className={`p-2 bg-muted/40 hover:bg-muted/80 rounded border transition-colors cursor-pointer group ${
                        selectedFlow === 'isl' ? 'border-fuchsia-500/60 shadow-[0_0_10px_rgba(217,70,239,0.15)]' : 'border-border'
                      }`}
                    >
                      <p className="text-[10px] font-bold text-fuchsia-300 group-hover:underline">{leftSatNode.name}</p>
                      <p className="text-[8px] font-mono text-muted-foreground truncate">ID: {leftSatNode.uuid}</p>
                    </div>
                  ) : (
                    <div className="p-2 bg-muted/20 rounded border border-border/40 border-dashed text-center">
                      <p className="text-[9px] text-muted-foreground italic font-mono">No L1 ISL</p>
                    </div>
                  )}
                </div>

                {/* Ground Feeder Connections */}
                <div className="space-y-2">
                  <p className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    Ground Gateways
                  </p>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {groundGateways.map((gw) => (
                      <div 
                        key={gw.uuid}
                        onClick={() => onNavigate(gw.uuid, 'device')}
                        className={`p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded border border-border text-[9px] transition-colors cursor-pointer group flex items-center justify-between ${
                          selectedFlow === 'ground-user' ? 'border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.1)]' : ''
                        }`}
                      >
                        <span className="font-bold text-zinc-300 truncate group-hover:underline group-hover:text-emerald-400">{gw.name}</span>
                        <ArrowRight size={10} className="text-muted-foreground" />
                      </div>
                    ))}
                    {groundGateways.length === 0 && (
                      <div className="p-2 bg-muted/10 rounded border border-dashed border-border/30 text-center text-[10px] text-muted-foreground italic">
                        No Gateway Links
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CORE SATELLITE STRUCTURE CARD (6 COLS) */}
              <div className="col-span-6 flex flex-col justify-between p-4 bg-muted/20 border-2 border-zinc-800 rounded-2xl relative shadow-2xl">
                <div className="absolute inset-x-0 -top-2.5 flex justify-center">
                  <Badge variant="outline" className="bg-zinc-950 font-mono text-[9px] border-zinc-800 tracking-wider">
                    🛰️ SATELLITE CHASSIS: {hostname.toUpperCase()}
                  </Badge>
                </div>

                {/* Satellite Module Components inside */}
                <div className="space-y-3.5 pt-2">
                  
                  {/* Telemetry/Bus and Timing */}
                  <div className="grid grid-cols-2 gap-2">
                    <div 
                      onClick={() => onNavigate(`hw-bus-${node.uuid}`, 'hardware')}
                      className="p-1.5 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-1">
                        <Layers size={11} className="text-amber-500" />
                        <span className="text-[9px] font-bold text-zinc-300">Telemetry Bus</span>
                      </div>
                      <p className="text-[8px] text-muted-foreground mt-0.5 mt-0.5 uppercase tracking-wide">JAC-Bus300</p>
                    </div>

                    <div 
                      onClick={() => onNavigate(`hw-clk-${node.uuid}`, 'hardware')}
                      className="p-1.5 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-cyan-400" />
                        <span className="text-[9px] font-bold text-zinc-300">Space Clock</span>
                      </div>
                      <p className="text-[8px] text-muted-foreground mt-0.5 uppercase tracking-wide">IEEE 1588v2</p>
                    </div>
                  </div>

                  {/* High Speed Processing Unit O-DU (Crucial User Endpoints are here!) */}
                  <div 
                    onClick={() => onNavigate(`hw-odu-${node.uuid}`, 'hardware')}
                    className={`p-2.5 bg-zinc-900/90 rounded-lg border-2 text-left relative transition-all cursor-pointer ${
                      selectedFlow === 'front-haul' || selectedFlow === 'ground-user'
                        ? 'border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-100">O-DU Regenerative SoC</span>
                      </div>
                      <Badge className="text-[8px] font-mono h-4 bg-zinc-800 border-zinc-700 text-cyan-400">NEC-DU-LEO</Badge>
                    </div>
                    
                    {/* Explicit user interface maps inside O-DU */}
                    <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-border/45 pt-1.5">
                      <div className={`p-1 rounded text-[8px] font-mono ${
                        selectedFlow === 'ground-user' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-muted/40 text-muted-foreground'
                      }`}>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>eth-if: /f1-u</span>
                        </div>
                        <span className="font-semibold block text-[7.5px]">10G Ground-Downlink</span>
                      </div>
                      
                      <div className={`p-1 rounded text-[8px] font-mono ${
                        selectedFlow === 'front-haul' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' : 'bg-muted/40 text-muted-foreground'
                      }`}>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>ecpri: /open-front-haul</span>
                        </div>
                        <span className="font-semibold block text-[7.5px]">25G Intra-RU Bus</span>
                      </div>
                    </div>
                  </div>

                  {/* Radio transceiver unit, feeder, antenna array */}
                  <div className="grid grid-cols-2 gap-2">
                    <div 
                      onClick={() => onNavigate(`hw-oru-${node.uuid}`, 'hardware')}
                      className={`p-1.5 bg-zinc-900 border rounded cursor-pointer transition-colors text-left ${
                        selectedFlow === 'front-haul' ? 'border-cyan-500/40 bg-cyan-500/[0.02]' : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Radio size={11} className="text-zinc-400" />
                        <span className="text-[9px] font-bold text-zinc-300">O-RU Frontend</span>
                      </div>
                      <p className="text-[8px] text-muted-foreground mt-0.5">Fujitsu Payload</p>
                    </div>

                    <div 
                      onClick={() => onNavigate(`hw-aesa-${node.uuid}`, 'hardware')}
                      className="p-1.5 bg-zinc-900 border border-zinc-800 rounded hover:border-zinc-700 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-1">
                        <Radio size={11} className="text-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-bold text-zinc-300">Ka/Ku Phased</span>
                      </div>
                      <p className="text-[8px] text-muted-foreground mt-0.5">MHS-AESA Array</p>
                    </div>
                  </div>

                  {/* Optical Laser Transmitter Terminal (Where Laser ISL routing occurs!) */}
                  <div 
                    onClick={() => onNavigate(`hw-laser-${node.uuid}`, 'hardware')}
                    className={`p-2.5 bg-zinc-900/90 rounded-lg border-2 text-left transition-all cursor-pointer ${
                      selectedFlow === 'isl'
                        ? 'border-fuchsia-500/60 shadow-[0_0_12px_rgba(217,70,239,0.25)]'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-100">Coherent Laser Engine</span>
                      </div>
                      <Badge className="text-[8px] font-mono h-4 bg-zinc-800 border-zinc-700 text-fuchsia-400">TOSH-ISL</Badge>
                    </div>
                    
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[8px] font-mono text-muted-foreground">laser-if: /isl-port</span>
                      <span className="text-[8.5px] font-mono font-bold text-fuchsia-300">100 Gbps Interface</span>
                    </div>

                    {/* Laser mechanism details */}
                    <div className="mt-1 flex items-center justify-between text-[7px] font-mono text-zinc-500">
                      <span>PAT Tracking Mirror: Locked</span>
                      <span>Loop Speed: 5.0 kHz Servo</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* RIGHT GATEWAY SIDE (ISL outbound satellite neighbors) */}
              <div className="col-span-3 flex flex-col justify-center space-y-8 text-right">
                {/* Right Satellite Outbound Neighbor */}
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground">ISL Outbound</p>
                  {rightSatNode ? (
                    <div 
                      onClick={() => onNavigate(rightSatNode.uuid, 'device')}
                      className={`p-2 bg-muted/40 hover:bg-muted/80 rounded border transition-colors cursor-pointer group text-right ${
                        selectedFlow === 'isl' ? 'border-fuchsia-500/60 shadow-[0_0_10px_rgba(217,70,239,0.15)]' : 'border-border'
                      }`}
                    >
                      <p className="text-[10px] font-bold text-fuchsia-300 group-hover:underline">{rightSatNode.name}</p>
                      <p className="text-[8px] font-mono text-muted-foreground truncate">ID: {rightSatNode.uuid}</p>
                    </div>
                  ) : (
                    <div className="p-2 bg-muted/20 rounded border border-border/40 border-dashed text-center">
                      <p className="text-[9px] text-muted-foreground italic font-mono">No R1 ISL</p>
                    </div>
                  )}
                </div>

                {/* Radiation-hard status metrics */}
                <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-left hidden sm:block">
                  <p className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground">On-board telemetry</p>
                  <div className="space-y-1 mt-1 text-[8.5px] font-mono text-zinc-300">
                    <p>Core Temp: <span className="text-emerald-400">32.4°C</span></p>
                    <p>Bus Volts: <span className="text-zinc-400">28.05 V</span></p>
                    <p>Radiation: <span className="text-emerald-500">Normal (6.5 rad/h)</span></p>
                    <p>Solar Prop: <span className="text-[#3b82f6]">Locked</span></p>
                  </div>
                </div>
              </div>

            </div>

            {/* FLOW SIGNAL VECTOR ANIMATED GRAPHICS */}
            <div className="absolute inset-0 pointer-events-none opacity-60">
              {/* Dynamic decorative background stars / orbits */}
              <svg className="w-full h-full text-zinc-100/5" viewBox="0 0 600 400" preserveAspectRatio="none">
                <circle cx="20" cy="80" r="1.5" className="fill-current text-white animate-pulse" />
                <circle cx="580" cy="120" r="1" className="fill-current text-white" />
                <circle cx="450" cy="350" r="2" className="fill-current text-white animate-pulse" />
                <path d="M 50 150 Q 300 200 550 150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" className="text-zinc-650" />
              </svg>
            </div>
          </div>

          {/* TELEMETRY DATA SHEET COLUMN (4 COLS) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <Card className="bg-muted/10 border-border shadow-none h-full text-left flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-mono ${activeConfig.pillClass}`}>
                      {selectedFlow.toUpperCase()} telemetry
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-zinc-100 pt-2 line-clamp-1">{activeConfig.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="pt-4 space-y-4">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{activeConfig.desc}</p>
                  
                  <Separator className="bg-border/60" />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-mono">active-yang-interface</span>
                      <span className="font-bold font-mono text-zinc-200">{activeConfig.activePort}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-mono">channel-speed</span>
                      <span className="font-bold font-mono text-emerald-400">{activeConfig.speed}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-mono">operating-load</span>
                      <span className="font-bold font-mono text-indigo-400">{activeConfig.throughput}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-mono">propagation-delay</span>
                      <span className="font-bold font-mono text-amber-500">{activeConfig.latency}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-mono">signal-error-coding</span>
                      <span className="font-bold font-mono text-zinc-300">{activeConfig.fecMode}</span>
                    </div>
                  </div>

                  <Separator className="bg-border/60" />

                  {/* SUB-TELEMETRY LIST */}
                  <div className="p-3 bg-zinc-950/45 rounded border border-border/50 space-y-2 text-[10px] font-mono">
                    <p className="text-[8px] uppercase text-zinc-400 tracking-wider">Dynamic RFC State attributes</p>
                    {activeConfig.telemetry.map((el) => (
                      <div key={el.label} className="flex justify-between items-center">
                        <span className="text-muted-foreground truncate max-w-[150px]">{el.label}</span>
                        <span className="text-zinc-200 font-bold truncate max-w-[125px]">{el.value}</span>
                      </div>
                    ))}
                  </div>

                </CardContent>
              </div>

              {/* ACTION LINKS OR TRIGGERS */}
              <div className="p-4 border-t border-border/80 bg-muted/20 flex flex-col gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs font-mono font-bold"
                  onClick={() => onNavigate(activeConfig.activePort, 'port')}
                >
                  <Network className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                  View Mapped Interface Details
                </Button>
                <div className="text-[9px] text-[#60a5fa] hover:underline cursor-pointer flex items-center justify-center font-bold" onClick={() => onNavigate(node.uuid, 'device')}>
                  <span className="font-mono">Reference Element Source: {node.uuid}</span>
                </div>
              </div>
            </Card>
          </div>

        </div>

      </CardContent>
    </Card>
  );
}
