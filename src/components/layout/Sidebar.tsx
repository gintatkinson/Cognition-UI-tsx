
import React from 'react';
import { 
  LayoutDashboard, 
  Network, 
  Router, 
  Share2, 
  Layers, 
  Settings, 
  Activity,
  ChevronRight,
  Check,
  FileCode,
  MapPin,
  Database,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDeviceTypes: string[];
  setSelectedDeviceTypes: (types: string[]) => void;
  selectedLinkTypes: string[];
  setSelectedLinkTypes: (types: string[]) => void;
  selectedServiceTypes: string[];
  setSelectedServiceTypes: (types: string[]) => void;
  selectedSliceTypes: string[];
  setSelectedSliceTypes: (types: string[]) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ietf-explorer', label: 'IETF Domains', icon: Layers },
  { id: 'yang-validator', label: 'YANG Validator', icon: FileCode },
  { id: 'ni-locations', label: 'Inventory Location', icon: MapPin },
  { id: 'network-inventory', label: 'Network Inventory', icon: Database },
  { id: 'passive-inventory', label: 'Passive Inventory', icon: Database },
  { id: 'base-topology', label: 'Base Network Topology', icon: Layers },
  { id: 'internet-types', label: 'Internet Types (RFC 6021)', icon: Globe },
  { id: 'optical-l0', label: 'Optical L0 (RFC 9093)', icon: Layers },
  { id: 'optical-l1', label: 'Optical L1 (Draft-IETF)', icon: Layers },
  { id: 'network-inventory-topology', label: 'Inventory Topology', icon: Network },
  { id: 'topology', label: 'Topology', icon: Network },
  { id: 'devices', label: 'Devices', icon: Router, subTypes: ['ROUTER', 'SWITCH', 'QKD_NODE', 'OPTICAL_SWITCH', 'SATELLITE', 'gNB_NTN'] },
  { id: 'links', label: 'Links', icon: Share2, subTypes: ['L3_IP_MPLS', 'L2_ETHERNET', 'L0_OPTICAL'] },
  { id: 'services', label: 'Services', icon: Activity, subTypes: ['L3VPN', 'L2VPN', 'QKD'] },
  { id: 'slices', label: 'Slices', icon: Layers, subTypes: ['eMBB', 'URLLC', 'mMTC'] },
];

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  selectedDeviceTypes, 
  setSelectedDeviceTypes,
  selectedLinkTypes,
  setSelectedLinkTypes,
  selectedServiceTypes,
  setSelectedServiceTypes,
  selectedSliceTypes,
  setSelectedSliceTypes
}: SidebarProps) {
  const toggleType = (type: string, current: string[], setter: (types: string[]) => void) => {
    if (current.includes(type)) {
      setter(current.filter(t => t !== type));
    } else {
      setter([...current, type]);
    }
  };

  const getSubmenuState = (id: string) => {
    switch (id) {
      case 'devices': return { current: selectedDeviceTypes, setter: setSelectedDeviceTypes };
      case 'links': return { current: selectedLinkTypes, setter: setSelectedLinkTypes };
      case 'services': return { current: selectedServiceTypes, setter: setSelectedServiceTypes };
      case 'slices': return { current: selectedSliceTypes, setter: setSelectedSliceTypes };
      default: return null;
    }
  };

  return (
    <div className="w-64 border-r border-border bg-background flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Network className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-foreground tracking-tight">Cognitive Controller</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">v3.0.0-beta</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <React.Fragment key={item.id}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-3 py-2 h-10 text-sm font-medium transition-all",
                  activeTab === item.id 
                    ? "bg-muted text-foreground border-l-2 border-blue-600 rounded-none shadow-[inset_0_0_10px_rgba(37,99,235,0.1)]" 
                    : "text-muted-foreground hover:text-foreground/90 hover:bg-muted/50"
                )}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-blue-500" : "text-muted-foreground")} />
                {item.label}
                {activeTab === item.id && <ChevronRight className="ml-auto w-3 h-3 text-muted-foreground/80" />}
              </Button>
              
              {activeTab === item.id && item.subTypes && (
                <div className="ml-9 mt-1 space-y-1 border-l border-border pl-2">
                  {item.subTypes.map(type => {
                    const state = getSubmenuState(item.id);
                    if (!state) return null;
                    const isSelected = state.current.includes(type);
                    
                    return (
                      <button
                        key={type}
                        onClick={() => toggleType(type, state.current, state.setter)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors rounded",
                          isSelected
                            ? "text-blue-400 bg-blue-500/5"
                            : "text-muted-foreground hover:text-foreground/80 hover:bg-muted"
                        )}
                      >
                        <div className={cn(
                          "w-3 h-3 rounded border flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-blue-600 border-blue-600"
                            : "border-zinc-700 bg-background"
                        )}>
                          {isSelected && <Check className="w-2 h-2 text-white" />}
                        </div>
                        {type.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground/90">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}
