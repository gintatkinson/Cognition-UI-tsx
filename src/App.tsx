/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { TopologyView } from './components/views/TopologyView';
import { DevicesView } from './components/views/DevicesView';
import { LinksView } from './components/views/LinksView';
import { ServicesView } from './components/views/ServicesView';
import { SlicesView } from './components/views/SlicesView';
import { DetailView } from './components/views/DetailView';
import { IETFExplorerView } from './components/views/IETFExplorerView';
import { YANGValidatorView } from './components/views/YANGValidatorView';
import { NetworkLocationsView } from './components/views/NetworkLocationsView';
import { NetworkInventoryView } from './components/views/NetworkInventoryView';
import { NetworkInventoryTopologyView } from './components/views/NetworkInventoryTopologyView';
import { PassiveNetworkInventoryView } from './components/views/PassiveNetworkInventoryView';
import { BaseNetworkTopologyView } from './components/views/BaseNetworkTopologyView';
import { InternetTypesView } from './components/views/InternetTypesView';
import { OpticalLayer0View } from './components/views/OpticalLayer0View';
import { OpticalLayer1View } from './components/views/OpticalLayer1View';
import { LoginView } from './components/views/LoginView';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';
// No implicit DOM-scraping imports - switching to robust attribute delegation
import { useAuth } from './lib/AuthContext';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentContext, setCurrentContext] = useState('admin');
  const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<string[]>(['ROUTER', 'SWITCH', 'QKD_NODE', 'OPTICAL_SWITCH', 'SATELLITE', 'gNB_NTN']);
  const [selectedLinkTypes, setSelectedLinkTypes] = useState<string[]>(['L3_IP_MPLS', 'L2_ETHERNET', 'L0_OPTICAL']);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>(['L3VPN', 'L2VPN', 'QKD']);
  const [selectedSliceTypes, setSelectedSliceTypes] = useState<string[]>(['eMBB', 'URLLC', 'mMTC']);
  const [navHistory, setNavHistory] = useState<{ id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl' }[]>([]);
  const [previousTab, setPreviousTab] = useState('dashboard');

  const handleNavigate = (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => {
    if (activeTab !== 'detail') {
      setPreviousTab(activeTab);
    }
    setNavHistory(prev => [...prev, { id, type }]);
    setActiveTab('detail');
  };

  const handleNavigateRef = React.useRef(handleNavigate);
  handleNavigateRef.current = handleNavigate;

  const handleBack = () => {
    setNavHistory(prev => {
      const newHistory = [...prev];
      newHistory.pop();
      if (newHistory.length === 0) {
        setActiveTab(previousTab);
      }
      return newHistory;
    });
  };

  useEffect(() => {
    // Robust, light-speed double-click delegation targeting explicit managed objects only.
    const handleGlobalDblClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;

      const tag = el.tagName.toLowerCase();
      // Safeguard: Never hijack inputs, buttons, map canvas/SVGs, or interactive controls.
      if (
        tag === 'input' || tag === 'textarea' || tag === 'select' || 
        tag === 'option' || tag === 'button' || tag === 'a' ||
        tag === 'canvas' || tag === 'svg' || tag === 'path' || 
        tag === 'circle' || tag === 'line' || tag === 'rect' || 
        tag === 'polygon' || tag === 'g' || tag === 'text' || tag === 'tspan'
      ) {
        return;
      }

      // Read directly from the closest element carrying our declarative metadata attributes
      const navTarget = el.closest('[data-nav-id]');
      if (navTarget) {
        const id = navTarget.getAttribute('data-nav-id');
        const type = navTarget.getAttribute('data-nav-type');
        if (id && type) {
          e.preventDefault();
          e.stopPropagation();
          handleNavigateRef.current(id, type as any);
        }
      }
    };

    document.addEventListener('dblclick', handleGlobalDblClick, true);
    return () => {
      document.removeEventListener('dblclick', handleGlobalDblClick, true);
    };
  }, []);

  const currentItem = navHistory[navHistory.length - 1];

  const renderView = () => {
    if (activeTab === 'detail' && currentItem) {
      return <DetailView item={currentItem} onNavigate={handleNavigate} onBack={handleBack} />;
    }

    switch (activeTab) {
      case 'dashboard': return <DashboardView onNavigate={handleNavigate} />;
      case 'ietf-explorer': return <IETFExplorerView onNavigate={handleNavigate} />;
      case 'topology': return <TopologyView onNavigate={handleNavigate} />;
      case 'devices': return <DevicesView onNavigate={handleNavigate} selectedTypes={selectedDeviceTypes} />;
      case 'links': return <LinksView onNavigate={handleNavigate} selectedTypes={selectedLinkTypes} />;
      case 'services': return <ServicesView onNavigate={handleNavigate} selectedTypes={selectedServiceTypes} />;
      case 'slices': return <SlicesView onNavigate={handleNavigate} selectedTypes={selectedSliceTypes} />;
      case 'yang-validator': return <YANGValidatorView onNavigate={handleNavigate} />;
      case 'ni-locations': return <NetworkLocationsView onNavigate={handleNavigate} />;
      case 'network-inventory': return <NetworkInventoryView onNavigate={handleNavigate} />;
      case 'passive-inventory': return <PassiveNetworkInventoryView onNavigate={handleNavigate} />;
      case 'base-topology': return <BaseNetworkTopologyView onNavigate={handleNavigate} />;
      case 'internet-types': return <InternetTypesView onNavigate={handleNavigate} />;
      case 'optical-l0': return <OpticalLayer0View onNavigate={handleNavigate} />;
      case 'optical-l1': return <OpticalLayer1View onNavigate={handleNavigate} />;
      case 'network-inventory-topology': return <NetworkInventoryTopologyView onNavigate={handleNavigate} />;
      default: return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  if (!user) {
    return <LoginView />;
  }

  const isSplitLayoutView = ['devices', 'links', 'services', 'slices'].includes(activeTab);

  return (
    <div className={cn("flex bg-background text-foreground selection:bg-blue-500/30", isSplitLayoutView ? "h-screen overflow-hidden" : "min-h-screen")}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setNavHistory([]); }} 
        selectedDeviceTypes={selectedDeviceTypes}
        setSelectedDeviceTypes={setSelectedDeviceTypes}
        selectedLinkTypes={selectedLinkTypes}
        setSelectedLinkTypes={setSelectedLinkTypes}
        selectedServiceTypes={selectedServiceTypes}
        setSelectedServiceTypes={setSelectedServiceTypes}
        selectedSliceTypes={selectedSliceTypes}
        setSelectedSliceTypes={setSelectedSliceTypes}
      />
      
      <div className={cn("flex-1 flex flex-col min-w-0", isSplitLayoutView && "h-screen overflow-hidden")}>
        <Header 
          currentContext={currentContext} 
          setContext={setCurrentContext} 
          activeTab={activeTab}
          currentItem={currentItem}
        />
        
        <main className={cn("flex-1 p-8 flex flex-col min-h-0", isSplitLayoutView ? "overflow-hidden" : "overflow-x-hidden overflow-y-auto")}>
          <div className="w-full flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (currentItem?.id || '')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1 flex flex-col w-full h-full min-h-0"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="h-10 border-t border-border/50 bg-background px-8 flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span>© 2026 ETSI Cognitive Controller</span>
            <span className="w-1 h-1 rounded-full bg-muted" />
            <span className="text-emerald-500/70">Connected to Controller Node: Cognitive-CORE-01</span>
          </div>
          <div className="flex items-center gap-4">
            <span>API Latency: 14ms</span>
            <span className="w-1 h-1 rounded-full bg-muted" />
            <span>Uptime: 142d 04h 22m</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
