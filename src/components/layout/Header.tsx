
import React, { useState } from 'react';
import { Search, Bell, User, Database, LogOut, Code, Copy, Check, Terminal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_CONTEXTS } from '@/lib/mock-data';
import { useAuth } from '../../lib/AuthContext';
import { ModeToggle } from '../theme-toggle';

interface HeaderProps {
  currentContext: string;
  setContext: (context: string) => void;
  activeTab?: string;
  currentItem?: { id: string, type: string } | null;
}

const VIEW_SOURCE_MAP: Record<string, { title: string; component: string; file: string }> = {
  'dashboard': { title: 'SDN Controller Dashboard', component: 'DashboardView', file: 'src/components/views/DashboardView.tsx' },
  'ietf-explorer': { title: 'IETF Explorer View', component: 'IETFExplorerView', file: 'src/components/views/IETFExplorerView.tsx' },
  'topology': { title: 'Network Topology Map', component: 'TopologyView', file: 'src/components/views/TopologyView.tsx' },
  'devices': { title: 'Network Devices Inventory', component: 'DevicesView', file: 'src/components/views/DevicesView.tsx' },
  'links': { title: 'Network Links Directory', component: 'LinksView', file: 'src/components/views/LinksView.tsx' },
  'services': { title: 'Active Network Services', component: 'ServicesView', file: 'src/components/views/ServicesView.tsx' },
  'slices': { title: 'Network Slices Directory', component: 'SlicesView', file: 'src/components/views/SlicesView.tsx' },
  'yang-validator': { title: 'YANG Schema & Data Validator', component: 'YANGValidatorView', file: 'src/components/views/YANGValidatorView.tsx' },
  'ni-locations': { title: 'Network Locations Manager', component: 'NetworkLocationsView', file: 'src/components/views/NetworkLocationsView.tsx' },
  'network-inventory': { title: 'Core Network Inventory', component: 'NetworkInventoryView', file: 'src/components/views/NetworkInventoryView.tsx' },
  'passive-inventory': { title: 'Passive Network Infrastructure', component: 'PassiveNetworkInventoryView', file: 'src/components/views/PassiveNetworkInventoryView.tsx' },
  'base-topology': { title: 'Base Network Topology View', component: 'BaseNetworkTopologyView', file: 'src/components/views/BaseNetworkTopologyView.tsx' },
  'internet-types': { title: 'YANG Internet Types Directory', component: 'InternetTypesView', file: 'src/components/views/InternetTypesView.tsx' },
  'optical-l0': { title: 'Optical Layer 0 Topology', component: 'OpticalLayer0View', file: 'src/components/views/OpticalLayer0View.tsx' },
  'optical-l1': { title: 'Optical Layer 1 (OTN) Topology', component: 'OpticalLayer1View', file: 'src/components/views/OpticalLayer1View.tsx' },
  'network-inventory-topology': { title: 'Network Inventory & RFC Topology', component: 'NetworkInventoryTopologyView', file: 'src/components/views/NetworkInventoryTopologyView.tsx' },
  'detail': { title: 'Resource Detail Inspector', component: 'DetailView', file: 'src/components/views/DetailView.tsx' }
};

export function Header({ currentContext, setContext, activeTab, currentItem }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copied, setCopied] = useState(false);

  const info = VIEW_SOURCE_MAP[activeTab || 'dashboard'] || { title: 'Active View', component: 'Unknown', file: '' };
  
  let displayTitle = info.title;
  if (activeTab === 'detail' && currentItem) {
    displayTitle = `Detail View: ${currentItem.id} (${currentItem.type})`;
  }

  const handleCopyDiagnostics = () => {
    const diagnosticText = `[Cognitive Controller Page Diagnostics]
Screen Title: ${displayTitle}
React Component: ${info.component}
Source File: /${info.file}
Context: ${currentContext}`;
    
    navigator.clipboard.writeText(diagnosticText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-6 flex-1">
        <div className="flex items-center gap-2 min-w-[200px]">
          <Database className="w-4 h-4 text-muted-foreground" />
          <Select value={currentContext} onValueChange={setContext}>
            <SelectTrigger className="w-[180px] bg-transparent border-border text-foreground/80 h-9">
              <SelectValue placeholder="Select Context" />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border text-foreground/80">
              {MOCK_CONTEXTS.map(ctx => (
                <SelectItem key={ctx.id} value={ctx.id}>{ctx.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Screen Helper & Coordinates Panel */}
        <div className="hidden md:flex items-center gap-3 border-l border-zinc-800 pl-6 shrink-0 relative">
          <div className="flex flex-col min-w-[150px] max-w-[240px]">
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/80">Active Screen</span>
            <span className="text-xs font-semibold text-foreground/90 truncate" title={displayTitle}>
              {displayTitle}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono rounded bg-muted hover:bg-zinc-900 border border-border text-muted-foreground hover:text-blue-400 hover:border-blue-500/50 transition-all cursor-pointer"
              title="Inspect view component & source file coordinate"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{info.component}.tsx</span>
            </button>

            {showDiagnostics && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowDiagnostics(false)} />
                <div className="absolute left-0 mt-2 w-80 bg-zinc-950 border border-zinc-805/90 rounded-xl shadow-2xl p-4 z-30 transition-all animate-all duration-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-blue-500" />
                      View Diagnostics
                    </span>
                    <button 
                      onClick={handleCopyDiagnostics}
                      className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/30 text-zinc-400 hover:text-blue-400 transition-all cursor-pointer"
                      title="Copy diagnostics to clipboard"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 text-[10px] font-mono">
                    <div className="flex flex-col gap-0.5 bg-zinc-900/40 p-2 rounded border border-zinc-900">
                      <span className="text-[9px] text-zinc-500">USER VIEW IDENTITY</span>
                      <span className="text-zinc-200 font-bold break-all">{displayTitle}</span>
                    </div>

                    <div className="flex flex-col gap-0.5 bg-zinc-900/40 p-2 rounded border border-zinc-900">
                      <span className="text-[9px] text-zinc-400">REACT COMPONENT</span>
                      <span className="text-zinc-200 font-bold">{info.component}</span>
                    </div>

                    <div className="flex flex-col gap-0.5 bg-zinc-900/40 p-2 rounded border border-zinc-900">
                      <span className="text-[9px] text-zinc-400">SOURCE CODE FILE</span>
                      <span className="text-zinc-200 font-bold hover:underline select-all text-blue-405 truncate">
                        /{info.file}
                      </span>
                    </div>
                  </div>

                  <div className="text-[9px] text-zinc-500 leading-normal border-t border-zinc-900 pt-2 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse shrink-0" />
                    <span>Provide page coordinates or click the copy icon above.</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search resources..." 
            className="pl-10 bg-muted/50 border-border text-foreground/80 h-9 focus-visible:ring-blue-600"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ModeToggle />
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground/90">
          <Bell className="w-4 h-4" />
        </Button>
        <div className="h-8 w-[1px] bg-muted mx-2" />
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground/90">{user?.email || 'User'}</p>
            <p 
              className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider cursor-pointer hover:text-foreground/80 transition-colors"
              onClick={logout}
            >
              Sign out
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
