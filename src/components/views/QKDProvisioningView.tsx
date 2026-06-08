import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Shield, 
  Plus, 
  X, 
  Check, 
  AlertCircle,
  Network,
  Zap,
  Lock
} from 'lucide-react';
import { MOCK_DEVICES, MOCK_LINKS } from '@/lib/mock-data';
import { TopologyGraph } from '../topology/TopologyGraph';
import { Device, QKDDevice } from '@/types/tfs';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface QKDProvisioningViewProps {
  onBack: () => void;
  onComplete: (serviceId: string) => void;
}

interface CandidatePath {
  id: string;
  name: string;
  nodes: string[];
  links: string[];
  skr: string;
  latency: string;
  reliability: string;
}

const MOCK_CANDIDATE_PATHS: CandidatePath[] = [
  {
    id: 'path-1',
    name: 'Optimized Path (Direct)',
    nodes: ['q1', 'q2'],
    links: ['ql1'],
    skr: '1.2 Mbps',
    latency: '0.1 ms',
    reliability: '99.99%'
  },
  {
    id: 'path-2',
    name: 'Resilient Path (Multi-hop)',
    nodes: ['q1', 'q2', 'q3'],
    links: ['ql1', 'ql2'],
    skr: '0.8 Mbps',
    latency: '0.3 ms',
    reliability: '99.999%'
  }
];

export function QKDProvisioningView({ onBack, onComplete }: QKDProvisioningViewProps) {
  const [includedNodes, setIncludedNodes] = useState<string[]>([]);
  const [excludedNodes, setExcludedNodes] = useState<string[]>([]);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>('q1');
  const [targetNodeId, setTargetNodeId] = useState<string | null>('q2');

  const selectedPath = useMemo(() => 
    MOCK_CANDIDATE_PATHS.find(p => p.id === selectedPathId),
    [selectedPathId]
  );

  const nodeStates = useMemo(() => {
    const states: Record<string, any> = {};
    
    MOCK_DEVICES.forEach(d => {
      if (d.id === sourceNodeId) states[d.id] = 'source';
      else if (d.id === targetNodeId) states[d.id] = 'target';
      else if (includedNodes.includes(d.id)) states[d.id] = 'included';
      else if (excludedNodes.includes(d.id)) states[d.id] = 'excluded';
      else if (selectedPath?.nodes.includes(d.id)) states[d.id] = 'candidate';
    });
    
    return states;
  }, [includedNodes, excludedNodes, sourceNodeId, targetNodeId, selectedPath]);

  const handleNodeClick = (device: Device | QKDDevice) => {
    if (device.id === sourceNodeId || device.id === targetNodeId) return;

    if (excludedNodes.includes(device.id)) {
      setExcludedNodes(prev => prev.filter(id => id !== device.id));
      setIncludedNodes(prev => [...prev, device.id]);
    } else if (includedNodes.includes(device.id)) {
      setIncludedNodes(prev => prev.filter(id => id !== device.id));
    } else {
      setExcludedNodes(prev => [...prev, device.id]);
    }
  };

  const handleDeploy = () => {
    if (selectedPathId) {
      onComplete(`svc-qkd-${Date.now()}`);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-500" />
              Provision QKD Application
            </h2>
            <p className="text-muted-foreground text-sm">Define path constraints and select candidate routes</p>
          </div>
        </div>
        <Button 
          disabled={!selectedPathId}
          onClick={handleDeploy}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8"
        >
          <Lock className="w-4 h-4 mr-2" />
          Deploy Secure App
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Panel: Constraints */}
        <div className="col-span-3 flex flex-col space-y-4 min-h-0">
          <Card className="bg-background border-border p-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest mb-4">Path Constraints</h3>
            
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Source/Target */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Source Node</span>
                    <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/5">
                      {MOCK_DEVICES.find(d => d.id === sourceNodeId)?.name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Target Node</span>
                    <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/5">
                      {MOCK_DEVICES.find(d => d.id === targetNodeId)?.name}
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-muted" />

                {/* Included Nodes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Include Nodes</span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 text-[10px]">
                      {includedNodes.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {includedNodes.map(id => (
                      <Badge key={id} variant="secondary" className="bg-muted border-border text-foreground/80 group">
                        {MOCK_DEVICES.find(d => d.id === id)?.name}
                        <X 
                          className="w-3 h-3 ml-1.5 cursor-pointer opacity-50 hover:opacity-100" 
                          onClick={() => setIncludedNodes(prev => prev.filter(i => i !== id))}
                        />
                      </Badge>
                    ))}
                    {includedNodes.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/80 italic">Click nodes on map to include</p>
                    )}
                  </div>
                </div>

                {/* Excluded Nodes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-500 uppercase tracking-tighter">Exclude Nodes</span>
                    <Badge variant="secondary" className="bg-rose-500/10 text-rose-500 text-[10px]">
                      {excludedNodes.length}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {excludedNodes.map(id => (
                      <Badge key={id} variant="secondary" className="bg-muted border-border text-foreground/80 group">
                        {MOCK_DEVICES.find(d => d.id === id)?.name}
                        <X 
                          className="w-3 h-3 ml-1.5 cursor-pointer opacity-50 hover:opacity-100" 
                          onClick={() => setExcludedNodes(prev => prev.filter(i => i !== id))}
                        />
                      </Badge>
                    ))}
                    {excludedNodes.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/80 italic">Click nodes on map to exclude</p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 flex gap-3">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-200/70 leading-relaxed">
                  Nodes selected on the map will be prioritized or avoided during path computation.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Center: Topology Map */}
        <div className="col-span-6 relative">
          <TopologyGraph 
            devices={MOCK_DEVICES}
            links={MOCK_LINKS}
            onNodeClick={handleNodeClick}
            nodeStates={nodeStates}
            highlightedLinks={selectedPath?.links || []}
          />
          
          <div className="absolute top-4 right-4 bg-muted/90 backdrop-blur border border-border p-3 rounded-lg space-y-2">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Map Interaction</p>
            <div className="flex items-center gap-2 text-[10px] text-foreground/80">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Click to Include</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-foreground/80">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Click again to Exclude</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-foreground/80">
              <div className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>Click again to Reset</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Candidate Paths */}
        <div className="col-span-3 flex flex-col space-y-4 min-h-0">
          <Card className="bg-background border-border p-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest mb-4">Candidate Paths</h3>
            
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {MOCK_CANDIDATE_PATHS.map(path => (
                  <div 
                    key={path.id}
                    onClick={() => setSelectedPathId(path.id)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      selectedPathId === path.id 
                        ? "bg-blue-600/10 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.1)]" 
                        : "bg-muted/50 border-border hover:border-border/80"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        "text-xs font-bold",
                        selectedPathId === path.id ? "text-blue-400" : "text-foreground/80"
                      )}>
                        {path.name}
                      </span>
                      {selectedPathId === path.id && <Check className="w-3 h-3 text-blue-500" />}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground uppercase">SKR</p>
                        <div className="flex items-center gap-1 text-[10px] text-foreground/80">
                          <Zap className="w-3 h-3 text-amber-500" />
                          {path.skr}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground uppercase">Latency</p>
                        <div className="text-[10px] text-foreground/80">{path.latency}</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Network className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{path.nodes.length} hops</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-500 px-1 py-0">
                        {path.reliability}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Path Computation</span>
                <span className="text-emerald-500 font-mono">SUCCESS</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
