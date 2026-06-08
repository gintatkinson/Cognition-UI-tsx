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
  GitCommit,
  Cpu,
  Activity,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { 
  L1Protocol,
  L1ClientSignal,
  L1CodingFunc,
  L1OpticalInterfaceFunc,
  TributarySlotGranularity,
  OduType,
  OduflexPayloadType,
  L1TransceiverPortConfig,
  L1OtnLabelConfig,
  L1OtnBandwidthPayloadConfig,
  validateL1TransceiverConfig,
  validateL1TributaryLabelConfig,
  validateL1BandwidthPayloadConfig,
  L1_BDD_SCENARIOS,
  PROTOCOL_SIGNALS,
  SIGNAL_CODINGS,
  PROTOCOL_PMDS,
  TSG_SLOT_CAPACITY_GBPS
} from '../../lib/ietfLayer1Types';
import { BDDScenario } from '../../lib/ietfLayer0Types';
import { NetworkService } from '../../services/networkService';

export function OpticalLayer1View({ onNavigate }: { onNavigate?: (id: string, type: any) => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'sandbox' | 'suite' | 'docs'>('sandbox');
  const [sandboxSection, setSandboxSection] = useState<'transceiver' | 'label' | 'bandwidth'>('transceiver');
  const [validationLogs, setValidationLogs] = useState<string[]>([]);
  const [validationState, setValidationState] = useState<'idle' | 'validated' | 'invalid'>('idle');

  // Live Optical Model State Integration
  const [underlayNetworks, setUnderlayNetworks] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-L0-TK-terminal');
  const [provisionProgress, setProvisionProgress] = useState<string>('');

  // Sandbox I: Transceiver & PCS Configuration States
  const [protocol, setProtocol] = useState<L1Protocol>('Ethernet');
  const [clientSignal, setClientSignal] = useState<L1ClientSignal>('ETH-10Gb-LAN');
  const [codingFunc, setCodingFunc] = useState<L1CodingFunc>('ETH-10GR');
  const [pmdFunc, setPmdFunc] = useState<L1OpticalInterfaceFunc>('LR-PMD-10G');
  const [adminStatus, setAdminStatus] = useState<'UP' | 'DOWN'>('UP');

  // Sandbox II: Timeslot & Label Configuration States
  const [labelRangeType, setLabelRangeType] = useState<'trib-slot' | 'trib-port'>('trib-slot');
  const [tsg, setTsg] = useState<TributarySlotGranularity>('tsg-1.25G');
  const [oduTypeList, setOduTypeList] = useState<OduType[]>(['ODU2']);
  const [labelPriority, setLabelPriority] = useState<number>(6);
  const [tpn, setTpn] = useState<number>(1);
  const [ts, setTs] = useState<number>(1);
  const [tsList, setTsList] = useState<string>('1-8');

  // Sandbox III: Bandwidth & Payload Configuration States
  const [oduType, setOduType] = useState<OduType>('ODUflex');
  const [numberContainers, setNumberContainers] = useState<number>(1);
  const [tsNumber, setTsNumber] = useState<number>(8);
  const [maxTsNumber, setMaxTsNumber] = useState<number>(16);
  const [payloadType, setPayloadType] = useState<OduflexPayloadType>('gfp-n-k');
  const [nominalBitRateSci, setNominalBitRateSci] = useState<string>('9.953e9');
  const [cbrClientType, setCbrClientType] = useState<L1ClientSignal>('ETH-10Gb-LAN');
  const [gfpN, setGfpN] = useState<number>(8);
  const [gfpK, setGfpK] = useState<'2' | '3' | '4'>('2');
  const [flexeClientRate, setFlexeClientRate] = useState<'10G' | '40G'>('10G');
  const [flexeAwareN, setFlexeAwareN] = useState<number>(1);
  const [opuflexPayloadRateSci, setOpuflexPayloadRateSci] = useState<string>('1.25e9');
  
  // fg-OTN topology options
  const [isFineGrainOtn, setIsFineGrainOtn] = useState<boolean>(true);
  const [fgtsReservedList, setFgtsReservedList] = useState<string>('1-8');
  const [fgtsUnreservedList, setFgtsUnreservedList] = useState<string>('9-80');
  const [linkDistanceKm, setLinkDistanceKm] = useState<number>(85);
  const [supportsFgOtn, setSupportsFgOtn] = useState<boolean>(true);

  // Active validation output
  const [validationResult, setValidationResult] = useState<any>(null);

  // BDD State Simulation
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [scenarioLogs, setScenarioLogs] = useState<string[]>([]);
  const [scenarioJson, setScenarioJson] = useState<string>('');
  const [scenarioStatus, setScenarioStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // Load physical elements from underlay network layer
  useEffect(() => {
    try {
      const netService = NetworkService.getInstance();
      setUnderlayNetworks(netService.getRFC8345Networks());
    } catch (e) {
      console.error("Could not load network underlay mapping", e);
    }
  }, []);

  // Sync client types when protocol changes inside Sandbox I
  useEffect(() => {
    const validSignals = PROTOCOL_SIGNALS[protocol];
    if (validSignals && validSignals.length > 0) {
      const nextSignal = validSignals[0];
      setClientSignal(nextSignal);
    }
  }, [protocol]);

  // Sync default code functions and PMDs when client signal rate changes
  useEffect(() => {
    const codings = SIGNAL_CODINGS[clientSignal] || [];
    if (codings.length > 0) {
      setCodingFunc(codings[0]);
    } else {
      setCodingFunc(clientSignal as any);
    }

    const pmds = PROTOCOL_PMDS[clientSignal] || [];
    if (pmds.length > 0) {
      setPmdFunc(pmds[0]);
    }
  }, [clientSignal]);

  // Real-time recalculation / validation hooks
  useEffect(() => {
    runSandboxedValidation();
  }, [
    sandboxSection, protocol, clientSignal, codingFunc, pmdFunc, adminStatus,
    labelRangeType, tsg, oduTypeList, labelPriority, tpn, ts, tsList,
    oduType, numberContainers, tsNumber, maxTsNumber, payloadType,
    nominalBitRateSci, cbrClientType, gfpN, gfpK, flexeClientRate, flexeAwareN,
    opuflexPayloadRateSci, isFineGrainOtn, fgtsReservedList, fgtsUnreservedList, supportsFgOtn
  ]);

  const runSandboxedValidation = () => {
    setValidationLogs([]);
    try {
      if (sandboxSection === 'transceiver') {
        const config: L1TransceiverPortConfig = {
          portId: 'client-port-sandbox',
          protocol,
          clientSignal,
          codingFunc,
          pmdFunc,
          adminStatus,
          hardwareTransceiverId: 'SFP-SANDBOX-01'
        };
        const res = validateL1TransceiverConfig(config);
        setValidationResult(res);
        setValidationState(res.isValid ? 'validated' : 'invalid');
        setValidationLogs(res.errors);
      } else if (sandboxSection === 'label') {
        const config: L1OtnLabelConfig = {
          rangeType: labelRangeType,
          tsg: labelRangeType === 'trib-slot' ? tsg : undefined,
          oduTypeList,
          priority: Number(labelPriority),
          tpn: labelRangeType === 'trib-port' ? Number(tpn) : undefined,
          ts: labelRangeType === 'trib-slot' ? Number(ts) : undefined,
          tsList: labelRangeType === 'trib-slot' ? tsList : undefined
        };
        const res = validateL1TributaryLabelConfig(config);
        setValidationResult(res);
        setValidationState(res.isValid ? 'validated' : 'invalid');
        setValidationLogs(res.errors);
      } else {
        const config: L1OtnBandwidthPayloadConfig = {
          oduType,
          numberContainers: Number(numberContainers),
          tsNumber: (oduType === 'ODUflex' || oduType === 'ODUflex-resizable' || oduType === 'fgODUflex') ? Number(tsNumber) : undefined,
          maxTsNumber: (oduType === 'ODUflex-resizable' || oduType === 'fgODUflex') ? Number(maxTsNumber) : undefined,
          payloadType,
          nominalBitRateScientific: nominalBitRateSci,
          clientType: cbrClientType,
          gfpN: Number(gfpN),
          gfpK,
          flexeClientRate,
          flexeAwareN: Number(flexeAwareN),
          opuflexPayloadRateScientific: opuflexPayloadRateSci,
          isFineGrainOtn,
          fgtsReservedList: isFineGrainOtn ? fgtsReservedList : undefined,
          fgtsUnreservedList: isFineGrainOtn ? fgtsUnreservedList : undefined,
          linkFiberDistanceKm: Number(linkDistanceKm),
          supportsFgOtn
        };
        const res = validateL1BandwidthPayloadConfig(config);
        setValidationResult(res);
        setValidationState(res.isValid ? 'validated' : 'invalid');
        setValidationLogs(res.errors);
      }
    } catch (e: any) {
      setValidationState('invalid');
      setValidationLogs([`Standard Parsing Exception: ${e.message}`]);
    }
  };

  const handleApplyL1ToTfsNode = () => {
    try {
      const netService = NetworkService.getInstance();
      const networks = netService.getRFC8345Networks();
      const l1Network = networks.find(n => n.networkId === 'underlay-L0' || n.networkId === 'underlay-L1') || networks[0];
      
      if (!l1Network) {
        setProvisionProgress("Error: Active transport network layers are not provisioned in controller.");
        return;
      }

      setProvisionProgress(`Initiating transaction commit. Standard OSPF-TE GMPLS link state update initialized on node ${selectedNodeId}...`);

      setTimeout(() => {
        const node = l1Network.nodes.find((n: any) => n.nodeId === selectedNodeId) || l1Network.nodes[0];
        if (!node) {
          setProvisionProgress(`Error: Node ID '${selectedNodeId}' is not registered.`);
          return;
        }

        // Augment node model state
        (node as any).l1Config = {
          sandboxSection,
          protocol,
          clientSignal,
          codingFunc,
          pmdFunc,
          labelRangeType,
          tsg: labelRangeType === 'trib-slot' ? tsg : undefined,
          maxTsNumber,
          isFineGrainOtn,
          calculatedLineRateGbps: validationResult?.calculations?.calculatedLineRateGbps,
          fgOtnUnreservedBandwidthGbps: validationResult?.calculations?.fgOtnUnreservedBandwidthGbps
        };

        // Propagate state to physical interfaces
        if (node.terminationPoints && node.terminationPoints.length > 0) {
          node.terminationPoints.forEach((tp: any) => {
            tp.l1ClientSignal = clientSignal;
            tp.l1Protocol = protocol;
            tp.tsg = tsg;
            if (isFineGrainOtn && validationResult?.calculations?.fgOtnUnreservedBandwidthGbps !== undefined) {
              tp.fgOtnUnreservedBandwidthGbps = validationResult.calculations.fgOtnUnreservedBandwidthGbps;
            }
          });
        }

        netService.updateRFC8345Network(l1Network);
        setUnderlayNetworks([...netService.getRFC8345Networks()]);
        setProvisionProgress(`Success: Standard ODU multiplex channels and line parameters successfully provisioned to node '${node.name || node.nodeId}'! Unreserved bandwidth updated to ${validationResult?.calculations?.fgOtnUnreservedBandwidthGbps || 'N/A'} Gbps.`);
      }, 800);
    } catch (e: any) {
      setProvisionProgress(`Transaction fails: ${e.message}`);
    }
  };

  // Run a scenario from the executable test suite
  const runVerificationScenario = (sc: BDDScenario) => {
    setSelectedScenarioId(sc.id);
    setScenarioStatus('idle');
    setScenarioLogs(['Initializing testing module...', `Executing ${sc.name}...`]);

    setTimeout(() => {
      try {
        const runResult = sc.run();
        if (runResult.success) {
          setScenarioStatus('success');
          setScenarioLogs([...runResult.logs]);
          setScenarioJson(runResult.resultJson || '{}');
        } else {
          setScenarioStatus('failed');
          setScenarioLogs([...runResult.logs]);
          setScenarioJson(runResult.resultJson || '{}');
        }
      } catch (err: any) {
        setScenarioStatus('failed');
        setScenarioLogs([`BDD Context Exception Error: ${err.message}`]);
        setScenarioJson(JSON.stringify({ error: err.stack }, null, 2));
      }
    }, 450);
  };

  const handleToggleOduTypeInList = (type: OduType) => {
    if (oduTypeList.includes(type)) {
      setOduTypeList(oduTypeList.filter(t => t !== type));
    } else {
      setOduTypeList([...oduTypeList, type]);
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6" id="optical-l1-view-root">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-zinc-900 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-[#10b981] font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            draft-ietf-ccamp-layer1-types
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white font-sans">Optical Layer 1 Configurations</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl font-sans leading-relaxed">
            Configure Standard Client Protocols, physical medium transceivers, PCS line codings, timeslot ranges, and ODUflex (GFP/Packet/CBR) payload mappings compliant with NMDA and ITU-T standards.
          </p>
        </div>

        {/* Global Tab controls */}
        <div className="flex bg-zinc-950 p-1.5 rounded-lg border border-zinc-900 shrink-0 self-start md:self-center">
          <button 
            onClick={() => setActiveSubTab('sandbox')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${activeSubTab === 'sandbox' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Sandbox Simulator
          </button>
          <button 
            onClick={() => setActiveSubTab('suite')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${activeSubTab === 'suite' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Acceptance Suite
            <span className="text-[9px] bg-zinc-900 px-1 border border-zinc-800 text-zinc-400 rounded-full">{L1_BDD_SCENARIOS.length}</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('docs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${activeSubTab === 'docs' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Specs (draft-ietf)
          </button>
        </div>
      </div>

      {activeSubTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Sandbox Input Settings */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Subsection Tab buttons */}
            <div className="p-1 bg-zinc-950 border border-zinc-900 rounded-lg flex gap-1">
              <button 
                onClick={() => setSandboxSection('transceiver')}
                className={`flex-1 py-2 text-[11px] uppercase tracking-wider font-mono font-semibold transition-all rounded-md flex items-center justify-center gap-2 ${sandboxSection === 'transceiver' ? 'bg-[#1e293b] text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'}`}
              >
                <Cpu className="w-3 h-3 text-indigo-400" />
                I. Port Transceiver
              </button>
              <button 
                onClick={() => setSandboxSection('label')}
                className={`flex-1 py-1.5 text-[11px] uppercase tracking-wider font-mono font-semibold transition-all rounded-md flex items-center justify-center gap-2 ${sandboxSection === 'label' ? 'bg-[#1e293b] text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'}`}
              >
                <Tag className="w-3 h-3 text-amber-400" />
                II. Timeslots Label
              </button>
              <button 
                onClick={() => setSandboxSection('bandwidth')}
                className={`flex-1 py-1.5 text-[11px] uppercase tracking-wider font-mono font-semibold transition-all rounded-md flex items-center justify-center gap-2 ${sandboxSection === 'bandwidth' ? 'bg-[#1e293b] text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'}`}
              >
                <Activity className="w-3 h-3 text-emerald-400" />
                III. Bandwidth & pay
              </button>
            </div>

            {/* Sandbox SECTION I: Transceiver & Physical Signal */}
            {sandboxSection === 'transceiver' && (
              <div className="bg-zinc-950 border border-zinc-900/80 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2 font-sans">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    Physical Signal & PCS Coding configuration
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 font-sans">
                    Define client protocols, PCS line rate coding properties, and physical medium dependent (PMD) transceivers mapping models.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Client Profile Protocol (F37)</label>
                    <select 
                      value={protocol} 
                      onChange={(e) => setProtocol(e.target.value as L1Protocol)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    >
                      <option value="Ethernet">Ethernet (MEF63)</option>
                      <option value="Fibre-Channel">Fibre-Channel (FC-SAN)</option>
                      <option value="SDH">SDH (ITU-T G.707)</option>
                      <option value="SONET">SONET (GR-253-CORE)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Rate / Client Signal (F37)</label>
                    <select 
                      value={clientSignal} 
                      onChange={(e) => setClientSignal(e.target.value as L1ClientSignal)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    >
                      {PROTOCOL_SIGNALS[protocol]?.map(sig => (
                        <option key={sig} value={sig}>{sig}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">PCS line coding standard (F37)</label>
                    <select 
                      value={codingFunc} 
                      onChange={(e) => setCodingFunc(e.target.value as L1CodingFunc)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    >
                      {SIGNAL_CODINGS[clientSignal]?.length > 0 ? (
                        SIGNAL_CODINGS[clientSignal].map(cod => (
                          <option key={cod} value={cod}>{cod} Coding sublayer</option>
                        ))
                      ) : (
                        <option value={clientSignal}>{clientSignal} Raw Stream</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Transceiver PMD module (F38)</label>
                    <select 
                      value={pmdFunc} 
                      onChange={(e) => setPmdFunc(e.target.value as L1OpticalInterfaceFunc)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    >
                      {PROTOCOL_PMDS[clientSignal]?.length > 0 ? (
                        PROTOCOL_PMDS[clientSignal].map(pmd => (
                          <option key={pmd} value={pmd}>{pmd} Transceiver</option>
                        ))
                      ) : (
                        <option value="">No Active Transceiver compatible</option>
                      )}
                    </select>
                    {PROTOCOL_PMDS[clientSignal]?.length === 0 && (
                      <p className="text-[10px] text-amber-500/80 font-sans mt-1">
                        Notice: Transceiver PMDs are only applicable for active optical physical layers (Ethernet/FC).
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Administrative Status</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setAdminStatus('UP')}
                        className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded border transition-all ${adminStatus === 'UP' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : 'bg-transparent text-zinc-500 border-zinc-800'}`}
                      >
                        UP (In Service)
                      </button>
                      <button 
                        onClick={() => setAdminStatus('DOWN')}
                        className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded border transition-all ${adminStatus === 'DOWN' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-transparent text-zinc-500 border-zinc-800'}`}
                      >
                        DOWN (Admin Out)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Detected Hardware SFP Slot ID</label>
                    <input 
                      type="text" 
                      readOnly 
                      value="XE-QSFP28-SLOT-03" 
                      className="w-full bg-zinc-900 border border-zinc-850 px-3 py-2 text-xs text-zinc-500 font-mono rounded-lg outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sandbox SECTION II: GMPLS Labels & ranges */}
            {sandboxSection === 'label' && (
              <div className="bg-zinc-950 border border-zinc-900/80 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2 font-sans">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    GMPLS timeslots & labels allocation
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 font-sans">
                    Configure Generalized MPLS routing identifiers, including OTN tributary slot ranges (TS), port mappings (TPN), and disjoint timeslots strings.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Label Filter Range Scope</label>
                    <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-850">
                      <button 
                        onClick={() => setLabelRangeType('trib-slot')}
                        className={`flex-1 py-1.5 text-xs font-semibold font-mono rounded transition-all ${labelRangeType === 'trib-slot' ? 'bg-[#1e293b] text-white' : 'text-zinc-400 hover:text-white'}`}
                      >
                        Tributary Slot (trib-slot)
                      </button>
                      <button 
                        onClick={() => setLabelRangeType('trib-port')}
                        className={`flex-1 py-1.5 text-xs font-semibold font-mono rounded transition-all ${labelRangeType === 'trib-port' ? 'bg-[#1e293b] text-white' : 'text-zinc-400 hover:text-white'}`}
                      >
                        Tributary Port (trib-port)
                      </button>
                    </div>
                  </div>

                  {labelRangeType === 'trib-slot' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Tributary Slot Granularity (F36/F39)</label>
                        <select 
                          value={tsg} 
                          onChange={(e) => setTsg(e.target.value as TributarySlotGranularity)}
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                        >
                          <option value="tsg-1.25G">1.25G (tsg-1.25G)</option>
                          <option value="tsg-2.5G">2.5G (tsg-2.5G)</option>
                          <option value="tsg-5G">5G (tsg-5G)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Primary slot index ts (F39)</label>
                        <input 
                          type="number"
                          value={ts}
                          onChange={(e) => setTs(Math.max(1, Number(e.target.value)))}
                          placeholder="Timeslot e.g. 1"
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Disjoint Timeslot list ts-list (F38/F39)</label>
                        <input 
                          type="text"
                          value={tsList}
                          onChange={(e) => setTsList(e.target.value)}
                          placeholder="e.g. 1-10,12,15-20"
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none placeholder-zinc-650"
                        />
                        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed mt-1">
                          Note: Evaluates comma disjoint sequences via IETF regex validation. Characters must represent ordered, non-overlapping channels.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Tributary Port Number tpn (F39)</label>
                      <input 
                        type="number"
                        value={tpn}
                        onChange={(e) => setTpn(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                      />
                      <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                        Tributary channel identifier for physical connection. Standard boundaries map in range [1..4095].
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">TE Interface priority (0..7) (F39)</label>
                    <input 
                      type="number"
                      value={labelPriority}
                      onChange={(e) => setLabelPriority(Math.max(0, Math.min(7, Number(e.target.value))))}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2 space-y-2 border-t border-zinc-900 pt-4 mt-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Target logical path containers (odu-type-list)</label>
                    <div className="flex flex-wrap gap-2">
                      {(['ODU0', 'ODU1', 'ODU2', 'ODU2e', 'ODU3', 'ODU4', 'ODUflex'] as OduType[]).map(o => {
                        const isSel = oduTypeList.includes(o);
                        return (
                          <button 
                            key={o}
                            onClick={() => handleToggleOduTypeInList(o)}
                            className={`px-3 py-1 text-xs font-mono font-semibold rounded border transition-all ${isSel ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                          >
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sandbox SECTION III: OTN Bandwidth Profile & Fine Grain */}
            {sandboxSection === 'bandwidth' && (
              <div className="bg-zinc-950 border border-zinc-900/80 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2 font-sans">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    OTN Path bandwidth & fine grain (fg-OTN) parameters
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 font-sans">
                    Configure ODUflex container properties, scientific notation bit rates, and fine-grain bandwidth allocations to optimize spectral efficiency.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Main container type (F36)</label>
                    <select 
                      value={oduType} 
                      onChange={(e) => {
                        const val = e.target.value as OduType;
                        setOduType(val);
                        if (val === 'fgODUflex' && (tsNumber > 80 || tsNumber < 1)) {
                          setTsNumber(5);
                        }
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    >
                      <option value="ODUflex">ODUflex (Flexible container)</option>
                      <option value="ODUflex-resizable">ODUflex-resizable (G.7044 Hitless)</option>
                      <option value="fgODUflex">fgODUflex (Fine-Grain sub-1G, F41)</option>
                      <option value="ODU0">ODU0 (~1.24 Gbps)</option>
                      <option value="ODU1">ODU1 (~2.49 Gbps)</option>
                      <option value="ODU2">ODU2 (~10.03 Gbps)</option>
                      <option value="ODU2e">ODU2e (~10.39 Gbps for 10GE)</option>
                      <option value="ODU4">ODU4 (~104.79 Gbps)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Containers count</label>
                    <input 
                      type="number"
                      value={numberContainers}
                      onChange={(e) => setNumberContainers(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  {(oduType === 'ODUflex' || oduType === 'ODUflex-resizable' || oduType === 'fgODUflex') && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block flex justify-between">
                          <span>Allocated slots ts-number {oduType === 'fgODUflex' ? '(1..80, F41)' : '(F40)'}</span>
                          {oduType === 'fgODUflex' && <span className="text-emerald-400 font-bold">10 Mbps per slot</span>}
                        </label>
                        <input 
                          type="number"
                          value={tsNumber}
                          min={1}
                          max={oduType === 'fgODUflex' ? 80 : 4095}
                          className="w-full bg-zinc-900 border border-zinc-850 px-3 py-2 text-xs text-white font-mono rounded-lg outline-none focus:border-emerald-500"
                          onChange={(e) => setTsNumber(Number(e.target.value))}
                        />
                        {oduType === 'fgODUflex' && (
                          <div className="text-[10px] text-zinc-500 font-mono mt-1">
                            Allocating {tsNumber} slots would provision a {tsNumber * 10} Mbps container slice.
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Max slot factor max-ts-number (F40)</label>
                        <input 
                          type="number"
                          value={maxTsNumber}
                          disabled={oduType !== 'ODUflex-resizable' && oduType !== 'fgODUflex'}
                          className={`w-full bg-zinc-900 border border-zinc-855 px-3 py-2 text-xs text-white font-mono rounded-lg outline-none ${(oduType !== 'ODUflex-resizable' && oduType !== 'fgODUflex') ? 'cursor-not-allowed opacity-50' : 'focus:border-emerald-500'}`}
                          onChange={(e) => setMaxTsNumber(Number(e.target.value))}
                        />
                      </div>
                    </>
                  )}

                  {oduType === 'fgODUflex' && (
                    <div className="col-span-2 border border-emerald-500/10 bg-emerald-500/5 rounded-xl p-4 flex items-center justify-between">
                      <div className="space-y-0.5 pr-4">
                        <h4 className="text-xs font-semibold text-emerald-400 font-sans">Simulate Hardware Support (F41)</h4>
                        <p className="text-[11px] text-zinc-400 font-sans">
                          Toggling this simulates physical hardware capabilities. Disabling this simulates legacy network hardware to verify rejection.
                        </p>
                      </div>
                      <button
                        onClick={() => setSupportsFgOtn(!supportsFgOtn)}
                        className={`text-xs font-semibold px-4 py-2 rounded-lg font-mono tracking-wider text-white select-none transition-all outline-none shrink-0 ${supportsFgOtn ? 'bg-emerald-600 hover:bg-emerald-700 font-bold' : 'bg-red-950/40 border border-red-500/30 text-rose-400 hover:bg-red-900/30'}`}
                      >
                        {supportsFgOtn ? 'ACTIVE (SUPPORTS fgOTN)' : 'LEGACY HARDWARE'}
                      </button>
                    </div>
                  )}

                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">ODUflex payload mapping structure (F40)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-850">
                      {(['gfp-n-k', 'cbr', 'packet', 'generic', 'flexe-client'] as OduflexPayloadType[]).map(pt => (
                        <button 
                          key={pt}
                          onClick={() => setPayloadType(pt)}
                          className={`py-1 text-[10px] font-semibold font-mono rounded transition-all uppercase ${payloadType === pt ? 'bg-[#10b981]/15 text-[#10b981]' : 'text-zinc-400 hover:text-white'}`}
                        >
                          {pt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contextual payload fields */}
                  {payloadType === 'gfp-n-k' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block flex justify-between">
                          <span>GFP slot count gfp-n: {gfpN}</span>
                          <span className="text-[#10b981] font-bold">1..80 Max</span>
                        </label>
                        <input 
                          type="range"
                          min="1"
                          max="80"
                          value={gfpN}
                          onChange={(e) => setGfpN(Number(e.target.value))}
                          className="w-full accent-[#10b981] bg-zinc-900 rounded-lg height-1.5 cursor-pointer mt-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">GFP container anchor gfp-k</label>
                        <select 
                          value={gfpK}
                          onChange={(e) => setGfpK(e.target.value as any)}
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                        >
                          <option value="2">ODU2 (Table 7-7 G.709)</option>
                          <option value="3">ODU3 (Table 7-7 G.709)</option>
                          <option value="4">ODU4 (Table 7-7 G.709)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {payloadType === 'generic' && (
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Nominal rate scientific notation (F40)</label>
                      <input 
                        type="text"
                        value={nominalBitRateSci}
                        onChange={(e) => setNominalBitRateSci(e.target.value)}
                        placeholder="e.g. 9.953e9"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none placeholder-zinc-700"
                      />
                    </div>
                  )}

                  {payloadType === 'cbr' && (
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">CBR client signal mapping (F40)</label>
                      <select 
                        value={cbrClientType}
                        onChange={(e) => setCbrClientType(e.target.value as L1ClientSignal)}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                      >
                        <option value="ETH-10Gb-LAN">10G Ethernet (LAN PHY)</option>
                        <option value="STM-16">STM-16 (SDH 2.5 Gbps)</option>
                        <option value="OC-192">OC-192 (SONET 10 Gbps)</option>
                        <option value="FC-800">Fibre-Channel 8G</option>
                      </select>
                    </div>
                  )}

                  {payloadType === 'packet' && (
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Packet payload target rate (eE format)</label>
                      <input 
                        type="text"
                        value={opuflexPayloadRateSci}
                        onChange={(e) => setOpuflexPayloadRateSci(e.target.value)}
                        placeholder="e.g. 1.25e9"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none placeholder-zinc-700"
                      />
                    </div>
                  )}

                  <div className="col-span-2 border-t border-zinc-900 pt-4 mt-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-white tracking-tight font-mono">Fine-Grain fg-OTN Network Slice Extension</h4>
                        <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Augment topology structures to model low-rate multiplex channels with guaranteed jitter.</p>
                      </div>
                      <button 
                        onClick={() => setIsFineGrainOtn(!isFineGrainOtn)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-all outline-none flex items-center ${isFineGrainOtn ? 'bg-emerald-600 justify-end' : 'bg-zinc-800 justify-start'}`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                      </button>
                    </div>

                    {isFineGrainOtn && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/60 p-4 border border-zinc-850/60 rounded-lg mt-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider block">fgts timeslots reserved list</label>
                          <input 
                            type="text"
                            value={fgtsReservedList}
                            onChange={(e) => setFgtsReservedList(e.target.value)}
                            placeholder="e.g. 1-10"
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider block">fgts timeslots unreserved list</label>
                          <input 
                            type="text"
                            value={fgtsUnreservedList}
                            onChange={(e) => setFgtsUnreservedList(e.target.value)}
                            placeholder="e.g. 11-80"
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider block">Physical path span length (Km)</label>
                          <input 
                            type="number"
                            value={linkDistanceKm}
                            onChange={(e) => setLinkDistanceKm(Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Live Controller Provisioning Integration box */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-500 shrink-0" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Commission to Cognitive Controller Topology</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-400 font-mono block">Node Target Select</span>
                  <select 
                    value={selectedNodeId} 
                    onChange={(e) => setSelectedNodeId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white font-mono outline-none"
                  >
                    <option value="node-L0-TK-terminal">Tokyo Transponder Terminal (L0-TK-terminal)</option>
                    <option value="node-L0-OS-terminal">Osaka WSS Optical Switch (L0-OS-terminal)</option>
                    <option value="node-L0-NG-terminal">Nagoya ROADM CrossConnect (L0-NG-terminal)</option>
                  </select>
                </div>

                <div className="space-y-1.5 flex items-end">
                  <button 
                    onClick={handleApplyL1ToTfsNode}
                    disabled={validationState === 'invalid'}
                    className={`w-full py-2 px-4 rounded text-xs font-bold tracking-wide uppercase font-mono transition-all flex items-center justify-center gap-2 ${validationState === 'invalid' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-transparent' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20 active:translate-y-0.5'}`}
                  >
                    <GitCommit className="w-4 h-4" />
                    Commit NETCONF to Node
                  </button>
                </div>
              </div>

              {provisionProgress && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono leading-relaxed select-all">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold block">Cognitive Controller CLI Output</span>
                  </div>
                  <span className={`block ${provisionProgress.startsWith('Error') || provisionProgress.includes('fails') ? 'text-rose-400' : 'text-emerald-400'}`}>{provisionProgress}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Real-time validator outcomes & JSON Output */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-5">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <span className="text-xs font-extrabold font-mono text-zinc-400 uppercase tracking-wider block">YANG Model Integrity Audit</span>
                <span className={`text-[10px] tracking-widest font-extrabold uppercase font-mono px-2 py-0.5 rounded-sm shrink-0 border ${validationState === 'validated' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/25' : 'bg-rose-500/10 text-rose-400 border-rose-500/25'}`}>
                  {validationState}
                </span>
              </div>

              {/* Status report */}
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  {validationState === 'validated' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-xs text-white block">Status message:</span>
                    <span className="text-xs text-zinc-400 block leading-relaxed mt-0.5 select-text">{validationResult?.message}</span>
                  </div>
                </div>

                {validationLogs.length > 0 && (
                  <div className="p-3 bg-rose-500/5 border border-rose-950/40 rounded-lg space-y-2">
                    <span className="text-[10px] text-rose-400 tracking-wider uppercase font-mono block font-bold">Incompatible Schemas ({validationLogs.length}):</span>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-rose-300 font-mono">
                      {validationLogs.map((log, lIdx) => (
                        <li key={lIdx}>{log}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Internal metrics computations */}
              {validationState === 'validated' && validationResult?.calculations && (
                <div className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-lg space-y-3">
                  <span className="text-[9px] text-[#2563eb] font-extrabold uppercase tracking-widest font-mono block">Real-time parameters calculations</span>
                  <div className="grid grid-cols-2 gap-4">
                    {validationResult.calculations.calculatedLineRateGbps !== undefined && (
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-zinc-400 font-mono uppercase block">Active Line Rate</span>
                        <span className="text-sm font-semibold font-mono text-white select-all">{validationResult.calculations.calculatedLineRateGbps.toFixed(3)} Gbps</span>
                      </div>
                    )}
                    {validationResult.calculations.slotsInitializedCount !== undefined && (
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-zinc-400 font-mono uppercase block">Allocated Channels</span>
                        <span className="text-sm font-semibold font-mono text-white select-all">{validationResult.calculations.slotsInitializedCount} TS Slots</span>
                      </div>
                    )}
                    {validationResult.calculations.gfpNominalRateGbps !== undefined && (
                      <div className="space-y-0.5 col-span-2 border-t border-zinc-850 pt-2.5">
                        <span className="text-[9px] text-zinc-400 font-mono uppercase block">Nominal GFP Bit Rate (Table 7-7)</span>
                        <span className="text-sm font-semibold font-mono text-emerald-400 select-all">{validationResult.calculations.gfpNominalRateGbps.toFixed(6)} Gbps</span>
                      </div>
                    )}
                    {validationResult.calculations.fgOtnUnreservedBandwidthGbps !== undefined && (
                      <div className="space-y-0.5 col-span-2 border-t border-zinc-850 pt-2.5">
                        <span className="text-[9px] text-zinc-400 font-mono uppercase block">Unreserved Fine-Grain fg-OTN capacity</span>
                        <span className="text-sm font-semibold font-mono text-indigo-400 select-all">{validationResult.calculations.fgOtnUnreservedBandwidthGbps.toFixed(2)} Gbps of 100 Gbps</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* JSON representation tree */}
              {validationState === 'validated' && (
                <div className="space-y-2.5 border-t border-zinc-900 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">YANG JSON Representation</span>
                    <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono py-0.5 px-2 rounded uppercase">rfc-8345-aligned</span>
                  </div>
                  <pre className="p-3 bg-zinc-900 text-[11px] font-mono leading-normal text-zinc-300 rounded-lg overflow-x-auto select-all max-h-[300px] border border-zinc-850">
                    <code>{validationResult?.jsonOutput}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'suite' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Scenarios selection list */}
          <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold block font-mono">Available System Scenarios ({L1_BDD_SCENARIOS.length})</span>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">Select and execute standard Gherkin verification scenarios to execute automated tests with live feedback.</p>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {L1_BDD_SCENARIOS.map((sc) => (
                <button 
                  key={sc.id}
                  onClick={() => runVerificationScenario(sc)}
                  className={`w-full p-4 border rounded-xl font-sans transition-all text-left flex flex-col space-y-2 select-none relative group ${selectedScenarioId === sc.id ? 'bg-[#1e2e4f]/30 border-[#2563eb]/50 shadow-[inset_0_0_15px_rgba(29,78,216,0.1)]' : 'bg-transparent border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/30'}`}
                >
                  <div className="flex justify-between items-center w-full border-b border-zinc-900 pb-1.5">
                    <span className="text-xs font-bold font-mono text-white tracking-tight">{sc.name}</span>
                    <span className="text-[8px] tracking-widest uppercase font-mono px-1.5 bg-zinc-800 text-indigo-400 rounded-sm shrink-0">
                      {sc.id.startsWith('scenario-f36') ? 'F36' :
                       sc.id.startsWith('scenario-f37') ? 'F37' :
                       sc.id.startsWith('scenario-f38') ? 'F38' :
                       sc.id.startsWith('scenario-f39') ? 'F39' :
                       sc.id.startsWith('scenario-f40') ? 'F40' :
                       sc.id.startsWith('scenario-us38') ? 'US38' :
                       sc.id.startsWith('scenario-us40') ? 'US40' :
                       sc.id.startsWith('scenario-uc18') ? 'UC18' :
                       sc.id.startsWith('scenario-uc21') ? 'UC21' : 'EPIC-11'}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400 space-y-1">
                    <div className="flex items-start gap-1"><span className="text-[9px] font-bold text-[#10b981] font-mono shrink-0 uppercase w-10">GIVEN:</span> <span className="line-clamp-1">{sc.given}</span></div>
                    <div className="flex items-start gap-1"><span className="text-[9px] font-bold text-sky-400 font-mono shrink-0 uppercase w-10">WHEN:</span> <span className="line-clamp-1">{sc.when}</span></div>
                    <div className="flex items-start gap-1"><span className="text-[9px] font-bold text-amber-400 font-mono shrink-0 uppercase w-10">THEN:</span> <span className="line-clamp-1">{sc.then}</span></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scenario results displayer */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 min-h-[450px] flex flex-col justify-between">
              {selectedScenarioId ? (
                <div className="space-y-6">
                  {/* Header info */}
                  <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white tracking-tight font-sans">
                        {L1_BDD_SCENARIOS.find(s => s.id === selectedScenarioId)?.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 tracking-wider uppercase font-mono mt-0.5">
                        Parent Model: {L1_BDD_SCENARIOS.find(s => s.id === selectedScenarioId)?.epic}
                      </p>
                    </div>
                    {scenarioStatus !== 'idle' && (
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${scenarioStatus === 'success' ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/25' : 'bg-rose-500/15 text-rose-400 border-rose-500/25'}`}>
                        scenario {scenarioStatus}
                      </span>
                    )}
                  </div>

                  {/* Terminal simulation log lines */}
                  <div className="space-y-4">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest font-extrabold block">Execution telemetry logs</span>
                    
                    <div className="bg-zinc-900 p-4 border border-zinc-850 rounded-lg space-y-2.5 max-h-[250px] overflow-y-auto">
                      {scenarioLogs.map((log, idx) => {
                        let textStyle = 'text-zinc-300';
                        if (log.startsWith('GIVEN')) textStyle = 'text-[#10b981]/90';
                        else if (log.startsWith('WHEN')) textStyle = 'text-sky-450';
                        else if (log.startsWith('THEN')) textStyle = 'text-amber-400';
                        else if (log.startsWith('STATUS: PASS')) textStyle = 'text-emerald-400 font-bold';
                        else if (log.startsWith('STATUS: FAIL') || log.startsWith('ERROR')) textStyle = 'text-rose-400 font-bold';

                        return (
                          <div key={idx} className="flex items-start gap-2 font-mono text-xs select-text">
                            <span className="text-[10px] text-zinc-600 shrink-0 select-none">[{idx + 1}]</span>
                            <span className={textStyle}>{log}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scenario JSON payload outcome */}
                  {scenarioJson && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest font-extrabold block">Output compiled data payload</span>
                      <pre className="p-3 bg-zinc-900 text-[11px] font-mono leading-normal text-zinc-400 rounded-lg overflow-x-auto select-all max-h-[200px] border border-zinc-850">
                        <code>{scenarioJson}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4 animate-bounce">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">No Scenario Active</h4>
                  <p className="text-xs text-zinc-500 font-sans mt-1 max-w-sm">Select an automated test scenario from the left panel to execute validations conforming with the YANG constraints definitions.</p>
                </div>
              )}

              <div className="text-[10px] text-zinc-650 uppercase font-mono tracking-widest border-t border-zinc-900 pt-4 text-center mt-3 flex justify-between select-none">
                <span>Verification parity: 100%</span>
                <span>Controller: Cognitive-CORE-L1-VAL-01</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'docs' && (
        <div className="bg-zinc-950 border border-zinc-900/80 rounded-xl p-6 space-y-6">
          <div className="border-b border-zinc-900 pb-4">
            <h3 className="text-md font-semibold text-white tracking-tight font-sans">YANG Data Model specification details (draft-ietf-ccamp-layer1-types)</h3>
            <p className="text-xs text-zinc-400 mt-1">Verbatim definitions, structural groupings, and key type declarations from RFCs guidelines.</p>
          </div>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {/* Spec Feature 36 */}
            <div className="space-y-2 border-b border-zinc-900/50 pb-5">
              <h4 className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider">Feature 36: Layer 1 ODU Type and Granularity (Issue #124)</h4>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Optical Data Unit container identities map directly to physical multiplexing capabilities. Types include <code className="text-zinc-400 font-mono">ODU0</code>, <code className="text-zinc-400 font-mono">ODU1</code>, <code className="text-zinc-400 font-mono">ODU2</code>, <code className="text-zinc-400 font-mono">ODU4</code>, and <code className="text-zinc-400 font-mono">ODUflex-resizable</code> that supports hitless bandwidth resizing according to ITU-T G.7044 standard rules.
              </p>
              <pre className="p-3 bg-zinc-900 text-[10px] font-mono text-zinc-400 rounded border border-zinc-850 overflow-x-auto">
{`identity tributary-slot-granularity {
  description "Tributary Slot Granularity (TSG).";
  reference "ITU-T G.709 v6.0: Optical Transport Network";
}
identity tsg-1.25G {
  base tributary-slot-granularity;
  description "1.25G slots capacity.";
}`}
              </pre>
            </div>

            {/* Spec Feature 37 */}
            <div className="space-y-2 border-b border-zinc-900/50 pb-5">
              <h4 className="text-xs font-bold text-[#10b981] font-mono uppercase tracking-wider">Feature 37: L1 Client Protocols and Coding sublayers (Issue #125)</h4>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Defines standard physical layer input protocols like Ethernet, Fibre-Channel, SDH and SONET. In addition, it registers their corresponding line rates and PCS coding functions (e.g. 10GBASE-R / 10GBASE-W).
              </p>
              <pre className="p-3 bg-zinc-900 text-[10px] font-mono text-zinc-400 rounded border border-zinc-850 overflow-x-auto">
{`identity client-signal {
  description "Base identity from which specific CBR client signal is derived";
}
identity ETH-10Gb-LAN {
  base client-signal;
  description "Client signal type of ETH-10Gb-LAN (10.3 Gb/s).";
}`}
              </pre>
            </div>

            {/* Spec Feature 39 */}
            <div className="space-y-2 border-b border-zinc-900/50 pb-5">
              <h4 className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">Feature 39: OTN Tributary Slot and Label Structure (Issue #127)</h4>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Manages standard GMPLS routing elements, restricting path labels to logical tributary ports (<code className="text-zinc-400 font-mono">tpn</code> in range 1..4095) or tributary slots (<code className="text-zinc-400 font-mono">ts</code> in range 1..4095).
              </p>
              <pre className="p-3 bg-zinc-900 text-[10px] font-mono text-zinc-400 rounded border border-zinc-850 overflow-x-auto">
{`typedef otn-tpn {
  type uint16 {
    range "1..4095";
  }
}
grouping otn-label-range-info {
  container otn-label-range {
    leaf range-type {
      type otn-label-range-type;
    }
  }
}`}
              </pre>
            </div>

            {/* Spec Feature 40 */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-rose-400 font-mono uppercase tracking-wider">Feature 40: OTN Bandwidth and GFP Payload Capabilities (Issue #128)</h4>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Enables scientific IEEE float notation formats to define transport bit rates, as well as modeling GFP (Generic Framing Procedure) slider ranges and fine-grain fg-OTN topology bandwidth mappings.
              </p>
              <pre className="p-3 bg-zinc-900 text-[10px] font-mono text-zinc-400 rounded border border-zinc-850 overflow-x-auto">
{`typedef bandwidth-scientific-notation {
  type string {
    pattern '0(\\.[0-9]{0,6})?[eE](\\+)?0?|[1-9](\\.[0-9]{0,6})?[eE](\\+)?(9[0-6]|[1-8][0-9]|0?[0-9])?';
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
