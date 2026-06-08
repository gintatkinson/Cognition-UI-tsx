
import React, { useMemo, useState } from 'react';
import { TopologyGraph } from '../topology/TopologyGraph';
import { MapErrorBoundary } from '../topology/MapErrorBoundary';

const MapTopology = React.lazy(() => import('../topology/MapTopology').then(m => ({ default: m.MapTopology })));
import { NetworkService } from '../../services/networkService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, RefreshCw, ZoomIn, ZoomOut, Map as MapIcon, Network } from 'lucide-react';
import { AIInsightsCard } from '../AIInsightsCard';
import { cn } from '@/lib/utils';

interface TopologyViewProps {
  onNavigate: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
}

export function TopologyView({ onNavigate }: TopologyViewProps) {
  const [layoutMode, setLayoutMode] = useState<'logical' | 'map'>('logical');
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);
  const ietfTopology = NetworkService.getInstance().getTopology();
  const isUnderlayActive = NetworkService.getInstance().isInventoryTopologyActive();
  
  React.useEffect(() => {
    // Trigger resize event after CSS transition completes so maps/charts redraw correctly
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 550);
    return () => clearTimeout(timer);
  }, [isGraphMaximized, layoutMode]);

  const formattedDevices = useMemo(() => {
    return ietfTopology.nodes.map(n => ({
      id: n.uuid,
      name: n.ietfSystem?.hostname || n.name,
      type: n.type || n.layer,
      layer: n.layer,
      status: 'OPERATIONAL' as const,
      endpoints: n.ietfInterfaces?.map(i => i.name) || [],
      location: {
        latitude: n.ietfGeoLocation?.location?.ellipsoid?.latitude || 0,
        longitude: n.ietfGeoLocation?.location?.ellipsoid?.longitude || 0,
        altitude: n.ietfGeoLocation?.location?.ellipsoid?.height || 0
      },
      component_count: n.hardware.length,
      drivers: ['IETF-YANG']
    }));
  }, [ietfTopology.nodes]);

  const formattedLinks = useMemo(() => {
    return ietfTopology.links.map(l => ({
      id: l.uuid,
      source: l.sourceNodeUuid,
      target: l.targetNodeUuid,
      capacity: l.capacity,
      type: l.layer.includes('Quantum') ? 'QUANTUM' : 'OPTICAL',
      latency: 'Unknown',
      source_endpoint: l.sourcePortUuid,
      target_endpoint: l.targetPortUuid,
      layer: l.layer
    }));
  }, [ietfTopology.links]);

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0 h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">IETF Network Topology</h2>
            {isUnderlayActive && (
              <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded shadow-[0_0_8px_rgba(59,130,246,0.15)] mt-1">
                Physical Inventory Underlay
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Visual representation of IETF modelled devices (ietf-network, ietf-te-topology)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted/50 p-1 rounded-md border border-border mr-2">
            <Button 
              variant={layoutMode === 'logical' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setLayoutMode('logical')}
              className="h-8 px-3 text-xs"
            >
              <Network className="w-3.5 h-3.5 mr-2" />
              Logical
            </Button>
            <Button 
              variant={layoutMode === 'map' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setLayoutMode('map')}
              className="h-8 px-3 text-xs"
            >
              <MapIcon className="w-3.5 h-3.5 mr-2" />
              Map
            </Button>
          </div>
          <Button variant="outline" size="sm" className="bg-muted border-border text-muted-foreground">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-muted border-border text-muted-foreground"
            onClick={() => setIsGraphMaximized(!isGraphMaximized)}
          >
            {isGraphMaximized ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
            {isGraphMaximized ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </div>

      <div className={cn(
        "relative border border-border rounded-xl overflow-hidden bg-background/50 transition-[width,left,top,right,bottom] duration-500 ease-in-out",
        isGraphMaximized ? "fixed inset-8 z-50 shadow-2xl bg-background" : "flex-1 min-h-[500px]"
      )}>
        {isGraphMaximized && (
          <div className="absolute top-4 left-4 z-[60]">
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-background/80 backdrop-blur-sm border border-border shadow-sm"
              onClick={() => setIsGraphMaximized(false)}
            >
              <Minimize2 className="w-4 h-4 mr-2" />
              Exit Fullscreen
            </Button>
          </div>
        )}

        {layoutMode === 'logical' ? (
          <TopologyGraph devices={formattedDevices} links={formattedLinks} onNavigate={onNavigate} onNodeClick={(d) => onNavigate && onNavigate(d.id, 'device')} />
        ) : (
          <MapErrorBoundary>
            <React.Suspense fallback={
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                <p className="text-xs font-mono text-slate-400">Loading dynamic geographic globe resources...</p>
              </div>
            }>
              <MapTopology devices={formattedDevices} links={formattedLinks} onNavigate={onNavigate} />
            </React.Suspense>
          </MapErrorBoundary>
        )}
        
        {layoutMode === 'logical' && (
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button size="icon" variant="secondary" className="bg-muted/80 border border-border text-muted-foreground hover:text-foreground/90">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="secondary" className="bg-muted/80 border border-border text-muted-foreground hover:text-foreground/90">
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      <div>
         <AIInsightsCard itemData={{ devices: formattedDevices, links: formattedLinks }} itemType="Network Topology" />
      </div>
    </div>
  );
}
