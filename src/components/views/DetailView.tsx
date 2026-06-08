import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Router, 
  Share2, 
  Activity, 
  Layers, 
  Settings as SettingsIcon,
  Cpu,
  Network,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MOCK_SERVICES, MOCK_SLICES } from '@/lib/mock-data';
import { NetworkService } from '../../services/networkService';
import { AIInsightsCard } from '../AIInsightsCard';
import { DeviceDetail } from './detail/DeviceDetail';
import { LinkDetail } from './detail/LinkDetail';
import { ServiceDetail } from './detail/ServiceDetail';
import { SliceDetail } from './detail/SliceDetail';
import { SubComponentDetail } from './detail/SubComponentDetail';

interface DetailViewProps {
  item: { id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl' };
  onNavigate: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
  onBack: () => void;
}

export function DetailView({ item, onNavigate, onBack }: DetailViewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const networkTopology = NetworkService.getInstance().getTopology();

  const getIETFNode = (id: string) => {
    const physical = networkTopology.nodes.find(n => n.uuid === id);
    if (physical) return physical;
    const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
    for (const net of rfcNetworks) {
      const rn = net.nodes.find(n => n.nodeId === id || n.name === id);
      if (rn) return { uuid: rn.nodeId, name: rn.name || rn.nodeId } as any;
    }
    return null;
  };

  const getDevice = (deviceId: string) => {
    const passiveDevices = NetworkService.getInstance().getPassiveDevices() || [];
    const pd = passiveDevices.find(d => d.id === deviceId);
    if (pd) return pd;
    const activeMockDevices = [
      { id: 'd1', name: 'R1-Core' },
      { id: 'd2', name: 'R2-Core' },
      { id: 'd3', name: 'SW1-Edge' },
      { id: 'd4', name: 'SW2-Edge' },
      { id: 'q1', name: 'QKD-Node-Alpha' },
      { id: 'q2', name: 'QKD-Node-Beta' },
      { id: 'q3', name: 'QKD-Node-Gamma' }
    ];
    return activeMockDevices.find(d => d.id === deviceId);
  };

  const getTitle = () => {
    switch (item.type) {
      case 'device': return getIETFNode(item.id)?.name || getDevice(item.id)?.name || item.id;
      case 'link': return `Link: ${item.id}`;
      case 'service': return MOCK_SERVICES.find(s => s.id === item.id)?.name || item.id;
      case 'slice': return MOCK_SLICES.find(s => s.id === item.id)?.name || item.id;
      case 'port': return `Port: ${item.id}`;
      case 'hardware': return `Hardware: ${item.id}`;
      case 'channel': return `Channel: ${item.id}`;
      case 'acl': return `ACL: ${item.id}`;
      default: return item.id;
    }
  };

  const getIcon = () => {
    switch (item.type) {
      case 'device': return <Router className="w-6 h-6 text-blue-500" />;
      case 'link': return <Share2 className="w-6 h-6 text-purple-500" />;
      case 'service': return <Activity className="w-6 h-6 text-emerald-500" />;
      case 'slice': return <Layers className="w-6 h-6 text-orange-500" />;
      case 'port': return <Network className="w-6 h-6 text-emerald-500" />;
      case 'hardware': return <Cpu className="w-6 h-6 text-amber-500" />;
      case 'channel': return <Zap className="w-6 h-6 text-yellow-500" />;
      case 'acl': return <ShieldCheck className="w-6 h-6 text-rose-500" />;
      default: return <Cpu className="w-6 h-6 text-zinc-500" />;
    }
  };

  const getCurrentItemData = () => {
    switch (item.type) {
      case 'device': return getIETFNode(item.id) || getDevice(item.id);
      case 'link': {
        const physicalLink = networkTopology.links.find(l => l.uuid === item.id);
        if (physicalLink) return physicalLink;
        const passiveCables = NetworkService.getInstance().getPassiveCables() || [];
        const pc = passiveCables.find(c => c.id === item.id);
        if (pc) return pc;
        const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
        for (const net of rfcNetworks) {
          const found = net.links?.find(l => l.linkId === item.id);
          if (found) return found;
        }
        return { id: item.id };
      }
      case 'service': return MOCK_SERVICES.find(s => s.id === item.id);
      case 'slice': return MOCK_SLICES.find(s => s.id === item.id);
      case 'port': 
      case 'channel': {
        const firstSlashIdx = item.id.indexOf('/');
        const parts = firstSlashIdx !== -1 ? [item.id.substring(0, firstSlashIdx), item.id.substring(firstSlashIdx + 1)] : [item.id];
        let resData = null;
        if (parts.length === 2) {
          resData = getIETFNode(parts[0])?.ietfInterfaces?.find(i => i.name === parts[1]);
        }
        if (!resData) {
          for (const n of networkTopology.nodes) {
            const found = n.ietfInterfaces?.find(i => i.name === item.id);
            if (found) { resData = found; break; }
          }
        }
        return resData || { id: item.id };
      }
      case 'hardware': {
        for (const n of networkTopology.nodes) {
          const found = n.hardware?.find(h => h.uuid === item.id);
          if (found) return found;
        }
        return { id: item.id };
      }
      case 'acl': {
        const firstSlashIdx = item.id.indexOf('/');
        const parts = firstSlashIdx !== -1 ? [item.id.substring(0, firstSlashIdx), item.id.substring(firstSlashIdx + 1)] : [item.id];
        let resData = null;
        if (parts.length === 2) {
          resData = getIETFNode(parts[0])?.ietfAccessControlList?.find(a => a.name === parts[1]);
        }
        if (!resData) {
          for (const n of networkTopology.nodes) {
            const found = n.ietfAccessControlList?.find(a => a.name === item.id);
            if (found) { resData = found; break; }
          }
        }
        return resData || { id: item.id };
      }
      default: return { id: item.id };
    }
  };

  return (
    <div className="space-y-8" key={refreshKey}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground hover:text-foreground/90">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center">
              {getIcon()}
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">{getTitle()}</h2>
              <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest">
                {item.type} ID:{' '}
                <span 
                  className="cursor-pointer hover:underline text-indigo-400 font-bold" 
                  onClick={() => onNavigate(item.id, item.type)}
                >
                  {item.id}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-muted border-border text-muted-foreground">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Configure
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Edit Metadata
          </Button>
        </div>
      </div>

      <Separator className="bg-muted" />

      {item.type === 'device' && (
        <DeviceDetail 
          id={item.id} 
          allNodes={networkTopology.nodes} 
          networkTopology={networkTopology} 
          onNavigate={onNavigate} 
          setRefreshKey={setRefreshKey} 
        />
      )}
      {item.type === 'service' && (
        <ServiceDetail 
          id={item.id} 
          allNodes={networkTopology.nodes} 
          onNavigate={onNavigate} 
        />
      )}
      {item.type === 'slice' && (
        <SliceDetail 
          id={item.id} 
          allNodes={networkTopology.nodes} 
          onNavigate={onNavigate} 
        />
      )}
      {item.type === 'link' && (
        <LinkDetail 
          id={item.id} 
          allNodes={networkTopology.nodes} 
          onNavigate={onNavigate} 
        />
      )}
      {['port', 'hardware', 'channel', 'acl'].includes(item.type) && (
        <SubComponentDetail 
          id={item.id} 
          type={item.type as any} 
          allNodes={networkTopology.nodes} 
          networkTopology={networkTopology} 
          onNavigate={onNavigate} 
          setRefreshKey={setRefreshKey} 
        />
      )}

      <AIInsightsCard itemData={getCurrentItemData()} itemType={item.type} />
    </div>
  );
}
