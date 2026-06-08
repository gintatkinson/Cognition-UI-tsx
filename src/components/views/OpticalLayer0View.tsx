import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  Info, 
  ArrowRight, 
  RefreshCw, 
  FileCode, 
  Network,
  Binary,
  ChevronRight,
  Sparkles,
  BookOpen,
  Sliders,
  Zap,
  Tag,
  GitCommit
} from 'lucide-react';
import { 
  L0GridType,
  DWDMChannelSpacing,
  CWDMChannelSpacing,
  FlexiSlotWidthGranularity,
  FlexiGridChannelSpacing,
  WSONConfig,
  FlexiGridConfig,
  validateWSONConfig,
  validateFlexiGridConfig,
  L0_BDD_SCENARIOS,
  BDDScenario,
  DWDM_SPACING_VALS,
  CWDM_SPACING_VALS
} from '../../lib/ietfLayer0Types';
import { NetworkService } from '../../services/networkService';

export function OpticalLayer0View({ onNavigate }: { onNavigate?: (id: string, type: any) => void }) {
  const [activeGridType, setActiveGridType] = useState<L0GridType>('wson-grid-dwdm');
  const [activeSubTab, setActiveSubTab] = useState<'sandbox' | 'suite' | 'docs'>('sandbox');
  const [validationLogs, setValidationLogs] = useState<string[]>([]);
  const [validationState, setValidationState] = useState<'idle' | 'parsing' | 'validated' | 'invalid'>('idle');

  // Live Optical Topology Base Model integration states
  const [underlayNetworks, setUnderlayNetworks] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-L0-TK-terminal');
  const [provisionProgress, setProvisionProgress] = useState<string>('');

  // Fetch underlay elements on load
  useEffect(() => {
    try {
      const netService = NetworkService.getInstance();
      setUnderlayNetworks(netService.getRFC8345Networks());
    } catch (e) {
      console.error("Could not fetch optical network base model", e);
    }
  }, []);

  // Priority (F33 / US37)
  const [priority, setPriority] = useState<number>(7);

  // WSON Configuration states (F34 / US35)
  const [dwdmSpacing, setDwdmSpacing] = useState<DWDMChannelSpacing>('dwdm-50ghz');
  const [cwdmSpacing, setCwdmSpacing] = useState<CWDMChannelSpacing>('cwdm-20nm');
  const [dwdmN, setDwdmN] = useState<number>(2);
  const [cwdmN, setCwdmN] = useState<number>(3);
  const [subcarriersDWDM, setSubcarriersDWDM] = useState<string>(''); // comma-separated indices

  // Flexi-Grid Configuration states (F35 / US36 / US37)
  const [slotWidthGranularity, setSlotWidthGranularity] = useState<FlexiSlotWidthGranularity>('flexi-swg-12p5ghz');
  const [flexiGridChannelSpacing, setFlexiGridChannelSpacing] = useState<FlexiGridChannelSpacing>('flexi-ch-spc-6p25ghz');
  const [minSlotWidthFactor, setMinSlotWidthFactor] = useState<number>(2);
  const [maxSlotWidthFactor, setMaxSlotWidthFactor] = useState<number>(8);
  const [flexiN, setFlexiN] = useState<number>(4);
  const [flexiM, setFlexiM] = useState<number>(4);
  const [flexiNStep, setFlexiNStep] = useState<number>(2); // Multiplier
  const [superChannelMode, setSuperChannelMode] = useState<'single' | 'super'>('single');
  const [subcarriersFlexi, setSubcarriersFlexi] = useState<string>(''); // comma-separated indexes

  // Validation output results
  const [result, setResult] = useState<any>(null);

  // BDD State Simulation
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [scenarioLogs, setScenarioLogs] = useState<string[]>([]);
  const [scenarioJson, setScenarioJson] = useState<string>('');
  const [scenarioStatus, setScenarioStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // Multi-terminal L0 equipment config application
  const handleApplyConfigToNode = () => {
    try {
      const netService = NetworkService.getInstance();
      const networks = netService.getRFC8345Networks();
      const l0Network = networks.find(n => n.networkId === 'underlay-L0');
      if (!l0Network) {
        setProvisionProgress("Error: L0 Physical Optical Underlay ('underlay-L0') network was not found in active dataset.");
        return;
      }

      const node = l0Network.nodes.find(n => n.nodeId === selectedNodeId);
      if (!node) {
        setProvisionProgress(`Error: Assigned node '${selectedNodeId}' cannot be located in 'underlay-L0'.`);
        return;
      }

      setProvisionProgress(`Initiating transaction payload: standard NETCONF commit for node ID ${node.nodeId}...`);

      setTimeout(() => {
        // Evaluate central metrics from active states
        let centralFreqGhz = 193100.0;
        let centralWavelengthNm: number | undefined;
        let slotWidthGhz = 50.0;

        if (activeGridType === 'wson-grid-dwdm') {
          const spacingVal = DWDM_SPACING_VALS[dwdmSpacing] || 50;
          centralFreqGhz = 193100.0 + Number(dwdmN) * spacingVal;
        } else if (activeGridType === 'wson-grid-cwdm') {
          const spacingVal = CWDM_SPACING_VALS[cwdmSpacing] || 20;
          centralWavelengthNm = 1471 + Number(cwdmN) * spacingVal;
          // approximate frequency = c / lambda
          centralFreqGhz = 299792.458 / centralWavelengthNm * 1000;
        } else {
          // flexi grid
          const spacingVal = 6.25;
          centralFreqGhz = 193100.0 + Number(flexiN) * spacingVal;
          slotWidthGhz = Number(flexiM) * 12.5;
        }

        // Apply grid parameters to target node model
        node.gridConfig = {
          gridType: activeGridType,
          priority: Number(priority),
          dwdmSpacing: activeGridType === 'wson-grid-dwdm' ? dwdmSpacing : undefined,
          cwdmSpacing: activeGridType === 'wson-grid-cwdm' ? cwdmSpacing : undefined,
          dwdmN: activeGridType === 'wson-grid-dwdm' ? Number(dwdmN) : undefined,
          cwdmN: activeGridType === 'wson-grid-cwdm' ? Number(cwdmN) : undefined,
          flexiN: activeGridType === 'flexi-grid-dwdm' ? Number(flexiN) : undefined,
          flexiM: activeGridType === 'flexi-grid-dwdm' ? Number(flexiM) : undefined,
          centralFrequencyGhz: centralFreqGhz,
          centralWavelengthNm: centralWavelengthNm,
          slotWidthGhz: slotWidthGhz
        };

        // Align termination point channel spectrum assignments
        if (node.terminationPoints && node.terminationPoints.length > 0) {
          node.terminationPoints.forEach((tp: any) => {
            tp.opticalChannelFreqGhz = centralFreqGhz;
            if (centralWavelengthNm) {
              tp.opticalChannelWavelengthNm = centralWavelengthNm;
            }
          });
        }

        // Commit via standard service
        netService.updateRFC8345Network(l0Network);

        // Retrigger state propagation
        setUnderlayNetworks([...netService.getRFC8345Networks()]);
        setProvisionProgress(`Success: Commissioned L0 Grid parameters to OSPF/TE on node '${node.name || node.nodeId}' successfully! Physical transponder port wavelength matching: ${centralFreqGhz.toFixed(2)} GHz.`);
      }, 750);
    } catch (e: any) {
      setProvisionProgress(`Error: Provisioning rejected due to datastore validation: ${e.message}`);
    }
  };

  // Trigger Live calculations and validation on state modifications
  useEffect(() => {
    setValidationState('parsing');
    const logs: string[] = [];
    logs.push(`Initializing parser validation sequence for Layer 0 Standard...`);
    
    setTimeout(() => {
      if (activeGridType === 'wson-grid-dwdm' || activeGridType === 'wson-grid-cwdm') {
        const listSubcarriers = subcarriersDWDM
          .split(',')
          .map(s => parseInt(s.trim(), 10))
          .filter(n => !isNaN(n));

        const wsonConfig: WSONConfig = {
          gridType: activeGridType,
          priority: Number(priority),
          dwdmSpacing,
          cwdmSpacing,
          dwdmN: Number(dwdmN),
          cwdmN: Number(cwdmN),
          subcarriersDWDM: listSubcarriers
        };

        const val = validateWSONConfig(wsonConfig);
        logs.push(`State: SCHEMA_ACCORDANCE | Aligning attributes to RFC 9093 rules`);
        logs.push(`State: MATH_COMPILATION | Evaluating frequency-wavelength grids`);
        
        if (val.isValid) {
          logs.push(`Success: Calculations finalized.`);
          if (activeGridType === 'wson-grid-dwdm') {
            logs.push(`Calculated nominal central frequency: ${val.calculations.centralFrequencyGhz?.toFixed(3)} GHz`);
          } else {
            logs.push(`Calculated nominal central wavelength: ${val.calculations.centralWavelengthNm} nm`);
          }
          setValidationState('validated');
        } else {
          logs.push(`State: FAILURE | Constraint checklist violation flagged.`);
          logs.push(`Error: ${val.message}`);
          setValidationState('invalid');
        }
        setResult(val);
        setValidationLogs(logs);

      } else {
        // Flexi Grid Validation (F35 / US36 / US37)
        const listSubcarriers = subcarriersFlexi
          .split(',')
          .map(s => parseInt(s.trim(), 10))
          .filter(n => !isNaN(n));

        const flexConfig: FlexiGridConfig = {
          gridType: 'flexi-grid-dwdm',
          priority: Number(priority),
          slotWidthGranularity,
          flexiGridChannelSpacing,
          minSlotWidthFactor: Number(minSlotWidthFactor),
          maxSlotWidthFactor: Number(maxSlotWidthFactor),
          flexiN: Number(flexiN),
          flexiM: Number(flexiM),
          flexiNStep: Number(flexiNStep),
          subcarriersFlexi: listSubcarriers,
          superChannelMode
        };

        const val = validateFlexiGridConfig(flexConfig);
        logs.push(`State: SCHEMA_ACCORDANCE | Matching slot ranges and granularity keys`);
        logs.push(`State: BOUNDARY_CHECK | Conducting inequality tests: max-factor >= min-factor`);
        logs.push(`State: PARSE_MULTIPLIER | Auditing central frequency step factor (${flexiNStep})`);

        if (val.isValid) {
          logs.push(`Success: Slot factor ranges verified.`);
          logs.push(`Central Frequency: ${val.calculations.centralFrequencyGhz?.toFixed(3)} GHz`);
          logs.push(`Allocated Slot Width: ${val.calculations.slotWidthGhz?.toFixed(1)} GHz`);
          logs.push(`Feasible Limits: ${val.calculations.acceptableRangeGhz?.min} to ${val.calculations.acceptableRangeGhz?.max} GHz`);
          setValidationState('validated');
        } else {
          logs.push(`State: FAILURE | Operational constraint failed.`);
          logs.push(`Error: ${val.message}`);
          setValidationState('invalid');
        }
        setResult(val);
        setValidationLogs(logs);
      }
    }, 120);

  }, [
    activeGridType,
    priority,
    dwdmSpacing,
    cwdmSpacing,
    dwdmN,
    cwdmN,
    subcarriersDWDM,
    slotWidthGranularity,
    flexiGridChannelSpacing,
    minSlotWidthFactor,
    maxSlotWidthFactor,
    flexiN,
    flexiM,
    flexiNStep,
    superChannelMode,
    subcarriersFlexi
  ]);

  const handleRunScenario = (sc: BDDScenario) => {
    setSelectedScenarioId(sc.id);
    const execution = sc.run();
    setScenarioStatus(execution.success ? 'success' : 'failed');
    setScenarioLogs(execution.logs);
    setScenarioJson(execution.resultJson || '');
  };

  // Render a visual representation of the active optical slot in the frequency grid spectrum (Top-notch craftmanship)
  const renderSpectrumVisualizer = () => {
    if (!result || !result.isValid) return null;

    if (activeGridType === 'wson-grid-dwdm' && result.calculations.centralFrequencyGhz) {
      const freq = result.calculations.centralFrequencyGhz;
      const isSuper = subcarriersDWDM.trim().length > 0;
      return (
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <span className="text-[10px] text-zinc-500 uppercase font-extrabold font-mono">ITU-T G.694.1 DWDM Frequency Analyzer</span>
            <span className="text-[10px] text-blue-400 font-extrabold font-mono uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Anchor: 193.10 THz
            </span>
          </div>

          <div className="relative h-20 bg-black/40 border border-zinc-900 rounded-lg flex items-center justify-center p-4">
            {/* Center frequency line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500 border border-blue-400/40 flex items-center justify-center">
              <span className="absolute -top-3 text-[8px] font-mono font-bold bg-blue-600 text-white px-1 rounded whitespace-nowrap">
                f = {freq.toFixed(3)} GHz
              </span>
            </div>

            {/* Standard channel range slot */}
            <div className="absolute top-4 bottom-4 left-[30%] right-[30%] bg-blue-500/15 border-l-2 border-r-2 border-dashed border-blue-400 rounded flex items-center justify-center">
              <span className="text-[9px] font-mono text-zinc-400 font-extrabold select-none">
                Channel {dwdmN >= 0 ? `+${dwdmN}` : dwdmN}
              </span>
            </div>

            {/* Scale ticks */}
            <div className="absolute bottom-1 left-2 text-[8px] font-mono text-zinc-600">f₀ - 300 GHz</div>
            <div className="absolute bottom-1 right-2 text-[8px] font-mono text-zinc-600">f₀ + 300 GHz</div>
          </div>

          {isSuper && (
            <div className="text-[9px] font-mono bg-zinc-900/60 border border-zinc-850 p-2.5 rounded text-left text-indigo-300">
              ⚡ Multi-Subcarrier Super-Channel mode detected: subcarrier frequencies configured at:
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {subcarriersDWDM.split(',').map((sVal, sIdx) => {
                  const sN = parseInt(sVal.trim(), 10);
                  if (isNaN(sN)) return null;
                  const scFreq = 193100.0 + sN * DWDM_SPACING_VALS[dwdmSpacing];
                  return (
                    <span key={sIdx} className="bg-zinc-950 text-white px-1.5 py-0.5 rounded border border-zinc-800 text-[8px]">
                      {scFreq.toFixed(1)} GHz
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeGridType === 'wson-grid-cwdm' && result.calculations.centralWavelengthNm) {
      const wave = result.calculations.centralWavelengthNm;
      return (
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <span className="text-[10px] text-zinc-500 uppercase font-extrabold font-mono">ITU-T G.694.2 CWDM Wavelength Analyzer</span>
            <span className="text-[10px] text-amber-400 font-extrabold font-mono uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Anchor: 1471 nm
            </span>
          </div>

          <div className="relative h-20 bg-black/40 border border-zinc-900 rounded-lg flex items-center justify-center p-4">
            {/* Center Wavelength */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-500 border border-amber-400/40 flex items-center justify-center">
              <span className="absolute -top-3 text-[8px] font-mono font-bold bg-amber-600 text-white px-1 rounded whitespace-nowrap">
                Wavelength = {wave} nm
              </span>
            </div>

            {/* Standard channel range slot */}
            <div className="absolute top-4 bottom-4 left-[35%] right-[35%] bg-amber-500/15 border-l-2 border-r-2 border-dashed border-amber-400 rounded flex items-center justify-center">
              <span className="text-[9px] font-mono text-zinc-400 font-extrabold select-none">
                N = {cwdmN >= 0 ? `+${cwdmN}` : cwdmN}
              </span>
            </div>

            <div className="absolute bottom-1 left-2 text-[8px] font-mono text-zinc-600">1271 nm</div>
            <div className="absolute bottom-1 right-2 text-[8px] font-mono text-zinc-600">1611 nm</div>
          </div>
        </div>
      );
    }

    if (activeGridType === 'flexi-grid-dwdm' && result.calculations.centralFrequencyGhz && result.calculations.slotWidthGhz) {
      const f = result.calculations.centralFrequencyGhz;
      const width = result.calculations.slotWidthGhz;
      const capabilities = result.calculations.acceptableRangeGhz;

      return (
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <span className="text-[10px] text-zinc-500 uppercase font-extrabold font-mono">RFC 7698 Flexi-Grid Slot Spectrum Allocation Analyzer</span>
            <span className="text-[10px] text-emerald-400 font-extrabold font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Granularity: 12.5 GHz
            </span>
          </div>

          <div className="relative h-24 bg-black/40 border border-zinc-900 rounded-xl flex flex-col justify-end p-2 overflow-hidden">
            
            {/* Feasible Capabilities Band (min to max supported card factor width) */}
            {capabilities && (
              <div className="absolute top-7 bottom-7 left-[10%] right-[10%] bg-zinc-900/50 border border-dashed border-zinc-800 rounded flex items-center justify-between px-3 text-[8px] font-mono text-zinc-500 select-none">
                <span>Min: {capabilities.min} GHz</span>
                <span className="text-[7px] uppercase tracking-widest text-zinc-600">Device Hardware Capability Range</span>
                <span>Max: {capabilities.max} GHz</span>
              </div>
            )}

            {/* Selected Active Slot width band centered around central frequency */}
            <div className="absolute top-10 bottom-10 left-[25%] right-[25%] bg-emerald-500/15 border-l-2 border-r-2 border-emerald-500 rounded flex flex-col items-center justify-center">
              <span className="text-[9px] font-mono text-emerald-400 font-extrabold leading-none">
                Active Slot
              </span>
              <span className="text-[8px] font-mono text-zinc-400 mt-1">
                Width: {width} GHz (M={flexiM})
              </span>
            </div>

            {/* Central frequency label */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-zinc-700/80 pointer-events-none">
              <span className="absolute top-1 text-[8px] font-mono bg-zinc-800 text-zinc-300 px-1 rounded transform -translate-x-1/2 whitespace-nowrap">
                f = {f.toFixed(3)} GHz
              </span>
            </div>

            <div className="absolute bottom-1 left-2 text-[8px] font-mono text-zinc-600">f₀ - 250 GHz</div>
            <div className="absolute bottom-1 right-2 text-[8px] font-mono text-zinc-600">f₀ + 250 GHz</div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto w-full text-left">
      
      {/* View Header Banner */}
      <div className="border-b border-border/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest bg-emerald-600/15 text-emerald-400 font-mono px-2 py-0.5 rounded font-extrabold select-none">
            ietf-layer0-types (RFC 9093)
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-2">
            <Layers className="w-6 h-6 text-emerald-500" />
            Optical Layer 0 Grid Type Definitions & Label Ranges
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Core validation suite for Fixed DWDM/CWDM WSON grids and Flexi-Grid slot calculations mapping standard spectral frequencies, wavelengths, and multiplier constraints.
          </p>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex bg-zinc-950/40 p-1 rounded-xl border border-zinc-900 w-fit shrink-0">
          <button
            onClick={() => setActiveSubTab('sandbox')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeSubTab === 'sandbox' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Grid Provisioning
          </button>
          <button
            onClick={() => setActiveSubTab('suite')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeSubTab === 'suite' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Acceptance Suite
          </button>
          <button
            onClick={() => setActiveSubTab('docs')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeSubTab === 'docs' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            YANG Model Definitions
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: PROVISIONING WORKSPACE */}
      {activeSubTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form and Controls column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-zinc-950/20 border border-border/70 rounded-3xl p-6 space-y-5">
              
              {/* Grid Selector */}
              <div className="space-y-2 border-b border-zinc-900 pb-4">
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono block">Grid Type Identity</label>
                <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1 border border-zinc-900 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveGridType('wson-grid-dwdm');
                      setPriority(7);
                    }}
                    className={`text-[10px] uppercase tracking-wider h-8 font-mono font-bold rounded-lg transition-all ${
                      activeGridType === 'wson-grid-dwdm' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    DWDM Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveGridType('wson-grid-cwdm');
                      setPriority(3);
                    }}
                    className={`text-[10px] uppercase tracking-wider h-8 font-mono font-bold rounded-lg transition-all ${
                      activeGridType === 'wson-grid-cwdm' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    CWDM Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveGridType('flexi-grid-dwdm');
                      setPriority(1);
                    }}
                    className={`text-[10px] uppercase tracking-wider h-8 font-mono font-bold rounded-lg transition-all ${
                      activeGridType === 'flexi-grid-dwdm' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Flex-Grid
                  </button>
                </div>
              </div>

              {/* Priority Descriptor (F33 / US37) */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-zinc-500 uppercase font-extrabold block font-mono">ISCD Priority (0..255) *</label>
                  <span className="text-[9px] text-zinc-600 font-mono uppercase">YANG: uint8</span>
                </div>
                <input
                  type="number"
                  value={priority}
                  min={0}
                  max={255}
                  onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                  placeholder="e.g., 7"
                  className="bg-background border border-border p-3 text-xs w-full text-white font-mono rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              {/* DYNAMIC FORM SEGMENT FOR DWDM GRID (F34 / US35) */}
              {activeGridType === 'wson-grid-dwdm' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* DWDM Spacing Options */}
                  <div className="space-y-1 text-xs">
                    <label className="text-[10px] text-zinc-500 uppercase font-extrabold block font-mono">DWDM Channel Spacing *</label>
                    <select
                      value={dwdmSpacing}
                      onChange={(e) => setDwdmSpacing(e.target.value as DWDMChannelSpacing)}
                      className="bg-background border border-border p-3 text-xs w-full text-zinc-300 font-mono rounded-xl outline-none focus:border-emerald-500"
                    >
                      <option value="dwdm-100ghz">100 GHz Spacing</option>
                      <option value="dwdm-50ghz">50 GHz Spacing</option>
                      <option value="dwdm-25ghz">25 GHz Spacing</option>
                      <option value="dwdm-12p5ghz">12.5 GHz Spacing</option>
                    </select>
                  </div>

                  {/* N Frequency Multiplier */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-zinc-500 uppercase font-extrabold block font-mono">Frequency index N (int16) *</label>
                      <span className="text-[9px] text-zinc-600 font-mono">YANG: dwdm-n</span>
                    </div>
                    <input
                      type="number"
                      value={dwdmN}
                      onChange={(e) => setDwdmN(parseInt(e.target.value, 10))}
                      placeholder="Frequency index e.g., 2"
                      className="bg-background border border-border p-3 text-xs w-full text-white font-mono rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Super Channel Multi-Subcarrier index list */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-zinc-500 uppercase font-extrabold block font-mono">DWDM Super-Channel Subcarriers</label>
                      <span className="text-[8px] text-indigo-400 uppercase font-mono tracking-wider font-extrabold">Optional (F34 Super)</span>
                    </div>
                    <input
                      type="text"
                      value={subcarriersDWDM}
                      onChange={(e) => setSubcarriersDWDM(e.target.value)}
                      placeholder="Comma separated indices, e.g. 1, 3, 5, 7"
                      className="bg-background border border-border p-3 text-xs w-full text-white font-mono rounded-xl outline-none focus:border-emerald-500 placeholder:text-zinc-650"
                    />
                    <span className="text-[8px] text-zinc-500 leading-relaxed font-sans block mt-1">
                      Provide integer indexes corresponding to DWDM subcarrier anchor points.
                    </span>
                  </div>

                </div>
              )}

              {/* DYNAMIC FORM SEGMENT FOR CWDM GRID (F34 / US35) */}
              {activeGridType === 'wson-grid-cwdm' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* CWDM Spacing Options */}
                  <div className="space-y-1 text-xs">
                    <label className="text-[10px] text-zinc-500 uppercase font-extrabold block font-mono">CWDM Channel Wavelength Spacing *</label>
                    <select
                      value={cwdmSpacing}
                      onChange={(e) => setCwdmSpacing(e.target.value as CWDMChannelSpacing)}
                      disabled
                      className="bg-background border border-border p-3 text-xs w-full text-zinc-400 font-mono rounded-xl outline-none opacity-80"
                    >
                      <option value="cwdm-20nm">20nm Wavelength Spacing</option>
                    </select>
                  </div>

                  {/* N Wavelength Multiplier */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <label className="text-[10px] text-zinc-500 uppercase font-extrabold block font-mono">Wavelength Index N (int16) *</label>
                      <span className="text-[9px] text-zinc-600 font-mono">YANG: cwdm-n</span>
                    </div>
                    <input
                      type="number"
                      value={cwdmN}
                      onChange={(e) => setCwdmN(parseInt(e.target.value, 10))}
                      placeholder="Wavelength index e.g., 3"
                      className="bg-background border border-border p-3 text-xs w-full text-white font-mono rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                </div>
              )}

              {/* DYNAMIC FORM SEGMENT FOR FLEXI-GRID (F35 / US36 / US37) */}
              {activeGridType === 'flexi-grid-dwdm' && (
                <div className="space-y-4 animate-fadeIn font-mono text-xs">
                  
                  {/* Granularities and spacing presets */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase block font-bold">Slot Width Granularity</label>
                      <select
                        value={slotWidthGranularity}
                        onChange={(e) => setSlotWidthGranularity(e.target.value as FlexiSlotWidthGranularity)}
                        disabled
                        className="bg-background border border-border p-2.5 text-[10px] w-full text-zinc-400 rounded-xl outline-none opacity-80"
                      >
                        <option value="flexi-swg-12p5ghz">12.5 GHz</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase block font-bold">Grid Channel Spacing</label>
                      <select
                        value={flexiGridChannelSpacing}
                        onChange={(e) => setFlexiGridChannelSpacing(e.target.value as FlexiGridChannelSpacing)}
                        disabled
                        className="bg-background border border-border p-2.5 text-[10px] w-full text-zinc-400 rounded-xl outline-none opacity-80"
                      >
                        <option value="flexi-ch-spc-6p25ghz">6.25 GHz</option>
                      </select>
                    </div>
                  </div>

                  {/* Min Capability and Max Capability Multiplying Range */}
                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase block font-bold">Min Slot Factor</label>
                      <input
                        type="number"
                        min={1}
                        value={minSlotWidthFactor}
                        onChange={(e) => setMinSlotWidthFactor(parseInt(e.target.value, 10))}
                        placeholder="e.g. 1"
                        className="bg-background border border-border p-2.5 text-xs w-full text-white rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase block font-bold">Max Slot Factor</label>
                      <input
                        type="number"
                        min={1}
                        value={maxSlotWidthFactor}
                        onChange={(e) => setMaxSlotWidthFactor(parseInt(e.target.value, 10))}
                        placeholder="e.g. 8"
                        className="bg-background border border-border p-2.5 text-xs w-full text-white rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Multiplier step requirement (F35 central frequency multiplier step) */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase block font-bold">Flexi-N Step Granularity</label>
                      <input
                        type="number"
                        min={1}
                        value={flexiNStep}
                        onChange={(e) => setFlexiNStep(parseInt(e.target.value, 10))}
                        placeholder="e.g. 2 for even indexes"
                        className="bg-background border border-border p-2.5 text-xs w-full text-white rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase block font-bold bg-amber-500/10 text-amber-400 px-1 py-0.2 rounded w-fit">Active Slot Factor M</label>
                      <input
                        type="number"
                        min={1}
                        value={flexiM}
                        onChange={(e) => setFlexiM(parseInt(e.target.value, 10))}
                        placeholder="Slot width factor M"
                        className="bg-background border border-border p-2.5 text-xs w-full text-white rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Nominal Index N */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] text-zinc-500 uppercase block font-bold">Nominal Central Index flexi-n</label>
                      <span className="text-[8px] text-zinc-500">f₀ + N * 6.25 GHz</span>
                    </div>
                    <input
                      type="number"
                      value={flexiN}
                      onChange={(e) => setFlexiN(parseInt(e.target.value, 10))}
                      placeholder="N multiplier"
                      className="bg-background border border-border p-3 text-xs w-full text-white rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Super Channel Selector mode */}
                  <div className="space-y-2 border-t border-zinc-900 pt-3">
                    <label className="text-[9px] text-zinc-500 uppercase block font-bold">Frequency Slot Configuration Case</label>
                    <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 border border-zinc-900 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSuperChannelMode('single')}
                        className={`text-[9px] uppercase h-7 rounded-lg font-bold transition-all ${
                          superChannelMode === 'single' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        Single Channel (Single Mode)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuperChannelMode('super')}
                        className={`text-[9px] uppercase h-7 rounded-lg font-bold transition-all ${
                          superChannelMode === 'super' ? 'bg-zinc-800 text-purple-400 border border-purple-500/20' : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        Super-Channel Mode
                      </button>
                    </div>
                  </div>

                  {superChannelMode === 'super' && (
                    <div className="space-y-1 text-xs animate-fadeIn">
                      <div className="flex justify-between">
                        <label className="text-[9px] text-zinc-500 uppercase block font-bold">Subcarrier Indices (subcarrier-flexi-n)</label>
                        <span className="text-[8px] text-yellow-500">Super Mode Active</span>
                      </div>
                      <input
                        type="text"
                        value={subcarriersFlexi}
                        onChange={(e) => setSubcarriersFlexi(e.target.value)}
                        placeholder="Comma separated flexi-n pointers, e.g. -2, 0, 2, 4"
                        className="bg-background border border-border p-3 text-xs w-full text-white rounded-xl outline-none focus:border-emerald-500 placeholder:text-zinc-650"
                      />
                      <span className="text-[8px] text-zinc-500 leading-relaxed font-sans block mt-1">
                        Defines multiplicity subcarriers centered dynamically inside the super band.
                      </span>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

          {/* Validation & Calculations Output column (7 cols) */}
          <div className="lg:col-span-7 bg-zinc-950/10 border border-border/70 rounded-3xl p-6 space-y-6">
            
            {/* Context details */}
            <div className="border-b border-zinc-900 pb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">IETF YANG Core Schema Validator</span>
              <h3 className="text-lg font-bold text-white font-mono mt-0.5 uppercase tracking-wide">
                {activeGridType === 'wson-grid-dwdm' ? 'Fixed Grid DWDM Grid validation' :
                 activeGridType === 'wson-grid-cwdm' ? 'Fixed Grid CWDM Grid validation' :
                 'Flexi-Grid Spectrum allocation'}
              </h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                {activeGridType === 'wson-grid-dwdm' ? 'Determines the DWDM nominal central frequencies according to ITU-T G.694.1 guidelines.' :
                 activeGridType === 'wson-grid-cwdm' ? 'Calculates conventional CWDM wavelength parameters under ITU-T G.694.2.' :
                 'Manages slot width constraints, inequality checks (max >= min), step granularity modulo matching, and subcarrier grouping lists.'}
              </p>
            </div>

            {/* Calculations math block */}
            {result && result.isValid && (
              <div className="bg-zinc-900/60 border border-zinc-850 rounded-2xl p-4.5 space-y-3.5 font-mono text-xs text-left">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold block border-b border-zinc-900 pb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  Grid Mathematics Result
                </span>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {result.calculations.centralFrequencyGhz && (
                    <div className="bg-background/80 border border-zinc-850 p-3 rounded-xl flex flex-col gap-0.5">
                      <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider leading-none">Central Frequency</span>
                      <span className="text-white font-extrabold text-sm mt-1">{result.calculations.centralFrequencyGhz.toFixed(3)} GHz</span>
                      <span className="text-[8px] text-zinc-550 mt-0.5">{(result.calculations.centralFrequencyGhz / 1000).toFixed(4)} THz</span>
                    </div>
                  )}

                  {result.calculations.centralWavelengthNm && (
                    <div className="bg-background/80 border border-zinc-850 p-3 rounded-xl flex flex-col gap-0.5">
                      <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider leading-none">Central Wavelength</span>
                      <span className="text-white font-extrabold text-sm mt-1">{result.calculations.centralWavelengthNm} nm</span>
                      <span className="text-[8px] text-zinc-550 mt-0.5">Optics Band Wavelength</span>
                    </div>
                  )}

                  {result.calculations.slotWidthGhz && (
                    <div className="bg-background/80 border border-zinc-850 p-3 rounded-xl flex flex-col gap-0.5">
                      <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider leading-none">Allocated Slot Width</span>
                      <span className="text-white font-extrabold text-sm mt-1">{result.calculations.slotWidthGhz} GHz</span>
                      <span className="text-[8px] text-zinc-550 mt-0.5">M factor: {flexiM} * 12.5</span>
                    </div>
                  )}

                  {result.calculations.acceptableRangeGhz && (
                    <div className="bg-background/80 border border-zinc-850 p-3 rounded-xl flex flex-col gap-0.5 col-span-2 md:col-span-1">
                      <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider leading-none">Factor Bounds</span>
                      <span className="text-zinc-300 font-extrabold text-xs mt-1">
                        {result.calculations.acceptableRangeGhz.min} ~ {result.calculations.acceptableRangeGhz.max} GHz
                      </span>
                      <span className="text-[8px] text-zinc-550 mt-1">Factor constraints: {minSlotWidthFactor}..{maxSlotWidthFactor}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interactive graphical visualizer of spectrum */}
            {renderSpectrumVisualizer()}

            {/* Schema Cascade Live Parser Logs */}
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4.5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[10px] text-zinc-500 uppercase font-extrabold font-mono">ITU-T Spectral Grid Cascade Evaluation</span>
                <span className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded font-mono">
                  IETF FSM STATE
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold font-mono">
                {/* Step 1: Input state */}
                <div className="bg-emerald-600/10 border border-emerald-500/40 text-emerald-300 p-2 rounded flex flex-col items-center justify-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                  <span>1. INPUT</span>
                </div>

                {/* Step 2: Pattern validation */}
                <div className={`p-2 rounded border border-zinc-850 flex flex-col items-center justify-center gap-1 ${
                  validationState === 'parsing' || validationState === 'validated' || validationState === 'invalid'
                    ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                }`}>
                  <FileCode className="w-3.5 h-3.5" />
                  <span>2. YANG TYPEDEF</span>
                </div>

                {/* Step 3: Range capacity checker */}
                <div className={`p-2 rounded border border-zinc-850 flex flex-col items-center justify-center gap-1 ${
                  validationState === 'validated' || (validationState === 'invalid' && validationLogs.length > 2)
                    ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                }`}>
                  <Binary className="w-3.5 h-3.5" />
                  <span>3. CAPACITY</span>
                </div>

                {/* Step 4: Normalization output */}
                <div className={`p-2 rounded border border-zinc-850 flex flex-col items-center justify-center gap-1 font-mono ${
                  validationState === 'validated' ? 'bg-emerald-500/20 border-emerald-500 text-white' :
                  validationState === 'invalid' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  'bg-zinc-900 border-zinc-850 text-zinc-500'
                }`}>
                  {validationState === 'validated' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> :
                   validationState === 'invalid' ? <XCircle className="w-3.5 h-3.5 text-red-500" /> :
                   <HelpCircle className="w-3.5 h-3.5" />}
                  <span>4. VALIDATED</span>
                </div>
              </div>

              {/* Console log of the live action */}
              <div className="bg-black/30 border border-zinc-950 p-4 rounded-lg text-[11px] leading-relaxed text-zinc-400 font-mono space-y-1.5 text-left">
                {validationLogs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-zinc-600 shrink-0 select-none">[{index + 1}]</span>
                    <span className={
                      log.startsWith('Error:') ? 'text-red-400 font-bold' :
                      log.startsWith('Success:') ? 'text-emerald-400 font-extrabold' :
                      'text-zinc-400'
                    }>{log}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation outcome box wrapper */}
            {result && (
              <div className={`p-5 rounded-2xl border flex flex-col gap-3.5 text-left ${
                result.isValid 
                  ? 'bg-emerald-600/5 border-emerald-500/30' 
                  : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div className="flex items-center gap-2.5 justify-between font-mono">
                  <div className="flex items-center gap-2">
                    {result.isValid ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-white text-sm">
                        {result.isValid ? 'Validation Constraints Passed' : 'Validation Constraint Alert'}
                      </span>
                      <div className="text-[10px] text-zinc-500 mt-0.5">RFC 9093 grid constraints matching audit</div>
                    </div>
                  </div>
                </div>

                <p className="text-zinc-300 text-xs italic bg-zinc-950/20 p-3.5 rounded-xl border border-zinc-900 leading-relaxed font-sans">
                  {result.message}
                </p>

                {result.isValid && result.jsonOutput && (
                  <div className="pt-2 flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-extrabold font-mono block">Compliant YANG Label Range JSON (NETCONF Transaction XML payload ready)</span>
                    <pre className="bg-background border border-border p-3.5 rounded-xl text-[10px] text-emerald-400 font-mono overflow-x-auto select-all max-h-[220px] overflow-y-auto">
                      <code>{result.jsonOutput}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* SECTION: JAPANESE BASE MODEL EQUIPMENT DIRECTORY & OPTICAL PROVISIONER */}
          <div className="lg:col-span-12 border-t border-zinc-900 pt-8 mt-4 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-900 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Network className="w-4 h-4 text-emerald-400" />
                  Active Layer 0 Optical Equipment Connection Map (IETF RFC 8345 Model)
                </h3>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Trace configured spectral frequencies directly to dedicated physical chassis platforms, active transponder modules, and line fiber ports in Japan.
                </p>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-indigo-400 rounded-sm uppercase tracking-widest font-bold font-mono">
                Japan Overlays Grounded
              </span>
            </div>

            {/* If networks aren't loaded yet */}
            {underlayNetworks.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-zinc-850 rounded-2xl text-zinc-500 text-xs font-mono">
                Loading underlay network nodes...
              </div>
            ) : (
              (() => {
                const currentNetwork = underlayNetworks.find(n => n.networkId === 'underlay-L0');
                const nodesList = currentNetwork?.nodes || [];
                const currentNode = nodesList.find((n: any) => n.nodeId === selectedNodeId);

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Terminal Directory (4 cols) */}
                    <div className="lg:col-span-4 space-y-3.5">
                      <span className="text-[10px] text-zinc-500 uppercase font-extrabold tracking-widest font-mono block">
                        Select Optical Node Element ({nodesList.length})
                      </span>
                      
                      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                        {nodesList.map((node: any) => {
                          const hasActiveGrid = node.gridConfig;
                          return (
                            <button
                              key={node.nodeId}
                              type="button"
                              onClick={() => {
                                setSelectedNodeId(node.nodeId);
                                setProvisionProgress('');
                              }}
                              className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1.5 hover:border-zinc-800 ${
                                selectedNodeId === node.nodeId
                                  ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-md'
                                  : 'bg-zinc-950/40 border-zinc-900 text-zinc-400'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full gap-2">
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold font-mono text-white tracking-tight">{node.name || node.nodeId}</span>
                                  <span className="text-[9px] text-zinc-500 font-mono block">Node: {node.nodeId}</span>
                                </div>
                                <span className={`text-[8px] tracking-wider uppercase font-mono px-1.5 py-0.5 border rounded-sm ${
                                  node.activeNeRef ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                                }`}>
                                  {node.activeNeRef || 'Disconnected'}
                                </span>
                              </div>

                              <p className="text-[11px] text-zinc-500 font-sans leading-normal">
                                {node.description}
                              </p>

                              {hasActiveGrid && (
                                <div className="mt-1 pb-0.5 flex flex-wrap gap-1.5">
                                  <span className="text-[8.5px] px-1.5 py-0.2 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 font-mono rounded">
                                    {node.gridConfig.gridType === 'wson-grid-dwdm' ? 'DWDM' :
                                     node.gridConfig.gridType === 'wson-grid-cwdm' ? 'CWDM' : 'FlexGrid'}
                                  </span>
                                  {node.gridConfig.centralFrequencyGhz && (
                                    <span className="text-[8.5px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono rounded">
                                      {node.gridConfig.centralFrequencyGhz.toFixed(2)} GHz
                                    </span>
                                  )}
                                  {node.gridConfig.centralWavelengthNm && (
                                    <span className="text-[8.5px] px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono rounded">
                                      {node.gridConfig.centralWavelengthNm} nm
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: Hardware Details and Provisioner (8 cols) */}
                    <div className="lg:col-span-8 bg-zinc-950/10 border border-zinc-900 rounded-3xl p-6.5 space-y-6">
                      
                      {currentNode ? (
                        <div className="space-y-6">
                          
                          {/* Active Line Card and Chassis Inspector */}
                          <div className="space-y-4">
                            
                            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                              <div>
                                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">
                                  Connected Japanese Optical Hardware Element
                                </span>
                                <h4 className="text-sm font-extrabold text-white font-mono flex items-center gap-1.5 uppercase">
                                  <Layers className="w-4 h-4 text-emerald-400" />
                                  chassis class: {currentNode.chassis?.name || 'Ciena 6500 High Capacity Shelf'}
                                </h4>
                              </div>
                              <span className="text-[9px] uppercase tracking-wider font-mono font-extrabold px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded">
                                SYSTEM ONLINE
                              </span>
                            </div>

                            {/* Chassis specs metadata table */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 border border-zinc-900 p-3.5 rounded-xl text-[10px] font-mono leading-relaxed text-left">
                              <div>
                                <span className="text-zinc-500 block">Manufacturer:</span>
                                <span className="text-zinc-300 font-semibold">{currentNode.chassis?.manufacturer || 'Ciena Corporation'}</span>
                              </div>
                              <div>
                                <span className="text-zinc-550 block">Model/Part No:</span>
                                <span className="text-zinc-300 font-semibold">{currentNode.chassis?.partNumber || 'NTK503KA'}</span>
                              </div>
                              <div>
                                <span className="text-zinc-550 block">Serial Number:</span>
                                <span className="text-zinc-300 font-semibold">{currentNode.chassis?.serialNumber || 'CN-CH-TK1-001'}</span>
                              </div>
                              <div>
                                <span className="text-zinc-550 block">Asset ID Reference:</span>
                                <span className="text-indigo-400 font-semibold truncate block">{currentNode.chassis?.assetId || 'ASSET-C6500-T12'}</span>
                              </div>
                            </div>

                            {/* Hardware descriptive metadata expanded */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-zinc-950/20 border border-zinc-900 p-3.5 rounded-xl text-[10.5px] leading-relaxed text-zinc-400 text-left font-sans">
                              <div>
                                <span className="text-zinc-500 uppercase tracking-widest font-mono text-[9px] block">Location Detail:</span>
                                <p className="mt-1 font-mono text-[10px] text-zinc-300">
                                  {currentNode.chassis?.description || 'Active packet-optical chassis anchored at KDDI Otemachi DC Rack R10D'}
                                </p>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase tracking-widest font-mono text-[9px] block">Engineering Stats:</span>
                                <ul className="list-disc leading-relaxed list-inside font-mono text-[9.5px] text-zinc-300 mt-1 space-y-0.5">
                                  <li>Revision: <strong className="text-white">{currentNode.chassis?.hardwareRev || '6500-T12-REV3'}</strong></li>
                                  <li>Mfg Timestamp: <strong className="text-white">{currentNode.chassis?.mfgDate ? new Date(currentNode.chassis.mfgDate).toLocaleDateString() : 'N/A'}</strong></li>
                                </ul>
                              </div>
                            </div>

                            {/* Horizontal visual line card strip slot design */}
                            <div className="border border-indigo-500/20 bg-indigo-950/10 rounded-2xl p-5 space-y-4 relative overflow-hidden text-left">
                              <div className="absolute top-0 right-0 p-1 text-[8px] bg-indigo-500/10 border-l border-b border-indigo-500/15 text-indigo-400 uppercase font-mono font-bold">
                                Slot 1: Transponder Card
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                  <span className="text-xs font-extrabold text-white font-mono uppercase">
                                    module class: {currentNode.modules?.[0]?.name || 'WaveLogic-5-Extreme'}
                                  </span>
                                  <span className="text-[9px] text-zinc-500 font-mono block">Card Serial: {currentNode.modules?.[0]?.serialNumber || 'W5E-001'}</span>
                                </div>
                                <div className="text-[9px] text-zinc-400 font-mono text-right shrink-0">
                                  <div>Part: {currentNode.modules?.[0]?.partNumber || 'NTK540EC'}</div>
                                  <div className="text-[8px] text-zinc-550 font-sans mt-0.5">Rev: {currentNode.modules?.[0]?.hardwareRev || '1.2'}</div>
                                </div>
                              </div>

                              {/* Interactive Ports SFP Coherent ports list */}
                              <div className="space-y-2.5">
                                <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider font-bold block mb-1">
                                  Coherent active transponder ports (YANG ietf-interfaces mapping):
                                </span>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                  {currentNode.terminationPoints?.map((tp: any, index: number) => (
                                    <div key={tp.tpId} className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-2.5 flex flex-col justify-between text-left">
                                      <div className="space-y-1">
                                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                                          <span className="text-white font-bold text-xs font-mono">{tp.tpId}</span>
                                          <span className="text-[8px] px-1.5 bg-indigo-500/15 text-indigo-400 font-semibold rounded font-mono">
                                            Port: {tp.activePortRef || `opt-1/${index+1}`}
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1 text-[9.5px] font-mono leading-normal pt-1 text-zinc-400">
                                          <div>
                                            <span className="text-zinc-550">transceiver class:</span>
                                            <span className="text-zinc-300 font-bold block truncate">{tp.transceiver?.name || '800G-ZR-Optic'}</span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-550">Serial:</span>
                                            <span className="text-zinc-300 block truncate">{tp.transceiver?.serialNumber || 'CN-TCV-01'}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Assigned Channel */}
                                      <div className="pt-2 border-t border-dashed border-zinc-900 flex justify-between items-center text-[10px] font-mono">
                                        <span className="text-emerald-400 font-bold">Wavelength Frequency:</span>
                                        <span className="text-white bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-extrabold text-[10px]">
                                          {tp.opticalChannelFreqGhz 
                                            ? `${tp.opticalChannelFreqGhz.toFixed(2)} GHz` 
                                            : 'Default C-Band'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                          </div>

                          {/* Control panel to sync the Sandbox configuration down to this node */}
                          <div className="bg-zinc-950/45 border border-zinc-900 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                            <div className="space-y-1.5 text-xs max-w-md">
                              <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase block tracking-wider">
                                Active Provisioning Controller
                              </span>
                              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                                Push current Sandbox validation grid settings (Grid Type: <strong className="text-white font-mono">{activeGridType}</strong>; Central spacing multiplier) down to <strong className="text-white font-mono">{currentNode.name}</strong>'s physical hardware transceiver.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={handleApplyConfigToNode}
                              disabled={!result?.isValid}
                              className={`px-5 py-3 rounded-xl font-mono text-xs font-extrabold transition-all shadow-md shrink-0 flex items-center justify-center gap-2 ${
                                result?.isValid
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] cursor-pointer'
                                  : 'bg-zinc-900 text-zinc-650 border border-zinc-850 cursor-not-allowed'
                              }`}
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${provisionProgress.includes('transaction') ? 'animate-spin' : ''}`} />
                              Commit Wavelength Grid
                            </button>
                          </div>

                          {/* Provisioning outcomes logs console */}
                          {provisionProgress && (
                            <div className="bg-black/35 border border-zinc-900/80 p-4 rounded-xl text-[10px] font-mono leading-relaxed text-left flex gap-2.5 items-start">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse mt-1 shrink-0"></span>
                              <div className={provisionProgress.startsWith('Error') ? 'text-red-400 font-bold' : 'text-zinc-350'}>
                                {provisionProgress}
                              </div>
                            </div>
                          )}

                        </div>
                      ) : (
                        <div className="p-16 border border-dashed border-zinc-850 rounded-2xl text-center text-zinc-600 flex flex-col items-center justify-center gap-2 font-sans">
                          <Info className="w-8 h-8 text-zinc-700" />
                          <p className="text-xs">
                            Select a node from the left directory to display associated physical chassis and port attributes.
                          </p>
                        </div>
                      )}

                    </div>

                  </div>
                );
              })()
            )}

          </div>

        </div>
      )}

      {/* SUB-VIEW 2: BDD ACCEPTANCE TESTS */}
      {activeSubTab === 'suite' && (
        <div className="bg-zinc-950/10 border border-border/70 rounded-3xl p-6 space-y-6">
          <div className="border-b border-zinc-900 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Optical Grid Given-When-Then BDD Acceptance Suite
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Execute normative acceptance testing scripts based directly on technical feature specifications for DWDM, CWDM and Flexi-Grid modules.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            
            {/* Scenarios lists panel */}
            <div className="space-y-3.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold block font-mono">Available System Scenarios ({L0_BDD_SCENARIOS.length})</span>
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {L0_BDD_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => handleRunScenario(sc)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1 hover:border-zinc-800 ${
                      selectedScenarioId === sc.id 
                        ? 'bg-emerald-600/10 border-emerald-500 text-white shadow-md' 
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-400'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full border-b border-zinc-900 pb-1.5">
                      <span className="text-xs font-bold font-mono text-white tracking-tight">{sc.name}</span>
                      <span className="text-[8px] tracking-widest uppercase font-mono px-1.5 bg-zinc-800 text-indigo-400 rounded-sm shrink-0">
                        {sc.id.startsWith('scenario-f33') ? 'F33' :
                         sc.id.startsWith('scenario-f34') ? 'F34' :
                         sc.id.startsWith('scenario-f35') ? 'F35' :
                         sc.id.startsWith('scenario-us35') ? 'US35' :
                         sc.id.startsWith('scenario-us36') ? 'US36' :
                         sc.id.startsWith('scenario-us37') ? 'US37' :
                         sc.id.startsWith('scenario-uc17') ? 'UC17' : 'EPIC-10'}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-500 font-sans mt-1.5 leading-normal">
                      <strong>Given:</strong> {sc.given}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-sans leading-normal">
                      <strong>When:</strong> {sc.when}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated execution logs console block */}
            <div className="space-y-3.5 font-mono text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold block">Automation Engine Output Console</span>
              
              {selectedScenarioId ? (
                <div className="space-y-4">
                  {/* Console emulator */}
                  <div className="bg-black/40 border border-zinc-900 rounded-2xl p-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Transaction Log Console</span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold border rounded px-2 py-0.5 ${
                        scenarioStatus === 'success' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}>
                        STATUS: {scenarioStatus === 'success' ? 'PASS' : 'FAIL'}
                      </span>
                    </div>

                    <div className="space-y-2 text-[11px] leading-relaxed text-zinc-400 max-h-[220px] overflow-y-auto">
                      {scenarioLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-zinc-600 shrink-0 select-none">&gt;&gt;</span>
                          <span className={
                            log.startsWith('ERROR:') ? 'text-red-400 font-bold' :
                            log.startsWith('Success:') || log.includes('PASS') ? 'text-emerald-400 font-bold' :
                            'text-zinc-300'
                          }>
                            {log}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schema template result block */}
                  {scenarioJson && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase font-extrabold block">Produced YANG Data Block (NMDA Standard compliant)</span>
                      <pre className="bg-background border border-border p-4 rounded-xl text-[10px] text-emerald-400 overflow-x-auto max-h-[260px] overflow-y-auto">
                        <code>{scenarioJson}</code>
                      </pre>
                    </div>
                  )}

                </div>
              ) : (
                <div className="p-16 border border-dashed border-zinc-850 rounded-2xl text-center text-zinc-600 flex flex-col items-center justify-center gap-2 font-sans">
                  <Tag className="w-8 h-8 text-zinc-700" />
                  <p className="text-xs">
                    Assign a testing scenario from the left panel to execute validations and view compliant transaction payloads.
                  </p>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* SUB-VIEW 3: MODEL DOCUMENTATION REFERENCE (RFC 9093) */}
      {activeSubTab === 'docs' && (
        <div className="bg-zinc-950/10 border border-border/70 rounded-3xl p-6 space-y-6">
          <div className="border-b border-zinc-900 pb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              ietf-layer0-types YANG Identity Reference (RFC 9093)
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5">
              Comprehensive identity mappings and constraints extracted directly from the industry standard YANG Data Model for Layer 0 optical types.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-left font-mono">
            {/* DWDM Grid definitions info */}
            <div className="bg-zinc-950/40 border border-zinc-900 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-emerald-400 font-extrabold">l0-grid-type Identities</span>
                <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded font-bold uppercase">Grid Identities</span>
              </div>
              <p className="text-zinc-300 text-[11px] font-sans leading-relaxed">
                Represents standard anchors for spectral slicing configurations under the GMPLS and wavelength switched frameworks.
              </p>
              <div className="bg-background/80 border border-zinc-850 p-3.5 rounded-xl space-y-2 text-[10px] text-zinc-500 leading-normal">
                <div>
                  <span className="text-white font-bold">wson-grid-dwdm</span>
                  <div className="text-[9px] text-zinc-550 leading-relaxed font-sans mt-0.5">Represents DWDM frequency channels (ITU-T G.694.1).</div>
                </div>
                <div className="border-t border-zinc-900 pt-1.5 mt-1.5">
                  <span className="text-white font-bold">wson-grid-cwdm</span>
                  <div className="text-[9px] text-zinc-550 leading-relaxed font-sans mt-0.5">Represents CWDM conventional wavelength channels (ITU-T G.694.2).</div>
                </div>
                <div className="border-t border-zinc-900 pt-1.5 mt-1.5">
                  <span className="text-white font-bold">flexi-grid-dwdm</span>
                  <div className="text-[9px] text-zinc-550 leading-relaxed font-sans mt-0.5">Defines dynamic elastic Flexi-grid channels.</div>
                </div>
              </div>
            </div>

            {/* Channel-spacing DWDM definitions info */}
            <div className="bg-zinc-950/40 border border-zinc-900 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-emerald-400 font-extrabold">dwdm-ch-spc-type</span>
                <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded font-bold uppercase">DWDM spacing</span>
              </div>
              <p className="text-zinc-300 text-[11px] font-sans leading-relaxed">
                Inherits from base dwdm-ch-spc-type representing grid spacing dimensions used in frequency formula offsets:
              </p>
              <div className="bg-background/80 border border-zinc-850 p-3.5 rounded-xl space-y-2 text-[10px] text-zinc-500 leading-normal">
                <div>
                  <span className="text-white font-bold">dwdm-100ghz</span>
                  <div className="text-[9px] text-zinc-550 font-sans mt-0.5">Offset spacing set to 100.000 GHz.</div>
                </div>
                <div className="border-t border-zinc-900 pt-1.5 mt-1.5">
                  <span className="text-white font-bold">dwdm-50ghz</span>
                  <div className="text-[9px] text-zinc-550 font-sans mt-0.5">Offset spacing set to 50.000 GHz.</div>
                </div>
                <div className="border-t border-zinc-900 pt-1.5 mt-1.5">
                  <span className="text-white font-bold">dwdm-25ghz</span>
                  <div className="text-[9px] text-zinc-555 font-sans mt-0.5">Offset spacing set to 25.000 GHz.</div>
                </div>
                <div className="border-t border-zinc-900 pt-1.5 mt-1.5">
                  <span className="text-white font-bold">dwdm-12p5ghz</span>
                  <div className="text-[9px] text-zinc-555 font-sans mt-0.5">Offset spacing set to 12.500 GHz.</div>
                </div>
              </div>
            </div>

            {/* Flex-Grid info */}
            <div className="bg-zinc-950/40 border border-zinc-900 p-5 rounded-2xl space-y-3 col-span-1 md:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <span className="text-emerald-400 font-extrabold font-mono">flexi-grid-specific rules</span>
                <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded font-bold uppercase">Flexi-Grid</span>
              </div>
              <p className="text-zinc-300 text-[11px] font-sans leading-relaxed">
                A highly dynamic flexible spectrum slicing architecture constrained by slot granularities, multipliers, and steps:
              </p>
              <div className="bg-background/80 border border-zinc-850 p-3.5 rounded-xl space-y-2.5 text-[10px] text-zinc-500 leading-normal">
                <div>
                  <span className="text-white font-bold block">must '. &gt;= ../min-slot-width-factor'</span>
                  <div className="text-[9px] text-zinc-550 leading-relaxed font-sans mt-0.5">Defines slot factoring scale ensuring maximum card thresholds reside securely over minimum configurations.</div>
                </div>
                <div className="border-t border-zinc-900 pt-1.5 mt-1.5">
                  <span className="text-white font-bold block">flexi-n-step constraints</span>
                  <div className="text-[9px] text-zinc-555 leading-relaxed font-sans mt-0.5">Forces multiplier alignments for index N (e.g. given 6.25 GHz spacing with 12.5 GHz step, forces even N integers).</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
