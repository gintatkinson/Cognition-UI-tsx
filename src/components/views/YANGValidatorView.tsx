import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XSquare, 
  HelpCircle, 
  Database, 
  FileCode, 
  Calendar, 
  Clock, 
  Activity, 
  Layers, 
  ChevronRight, 
  Hash, 
  Globe, 
  RefreshCw, 
  Plus, 
  FileText,
  AlertTriangle,
  Play
} from 'lucide-react';
import { 
  validateCounter32, 
  validateCounter64, 
  validateGauge32, 
  validateGauge64, 
  validateObjectIdentifier, 
  validateYangIdentifier, 
  validateDateTimeAndOffset, 
  validateDateType, 
  validateDateNoZoneType, 
  validateTimeType, 
  validateTimeNoZoneType, 
  validateDuration32, 
  validateDuration64, 
  validateTimeticks, 
  validateMacAddress, 
  validatePhysicalAddress, 
  validateHexString, 
  validateUuid, 
  validateDottedQuad, 
  validateLanguageTag, 
  validateXPath 
} from '@/lib/yang-validator';

// Preloaded mock database of validated registry entries
const INITIAL_REGISTRY = [
  {
    uuid: "a809b456-c222-4cfc-b883-2068aa1cbb5a",
    name: "Tokai_Core_H30_ROADM",
    dateAndTime: "2026-06-02T11:00:00Z",
    macAddress: "00:1a:2b:3c:4d:5e",
    dottedQuad: "192.168.12.1",
    objectIdentifier: "1.3.6.1.2.1.2.2.1",
    counter32: "1429402",
    gauge32: "850",
    languageTag: "ja-jp"
  },
  {
    uuid: "4b2c12ef-2068-4cfc-8ff1-001a1c2b3d4e",
    name: "Osaka_Kozu_QKD_01",
    dateAndTime: "2026-06-01T23:59:60-09:00", // valid leap second
    macAddress: "52:54:00:12:34:56",
    dottedQuad: "10.0.4.15",
    objectIdentifier: "2.16.840.1",
    counter32: "89504",
    gauge32: "4122",
    languageTag: "en-us"
  }
];

export function YANGValidatorView({ onNavigate }: { onNavigate?: (id: string, type: any) => void }) {
  const [activeTab, setActiveTab] = useState<'playground' | 'registry'>('playground');
  const [activePlaygroundTab, setActivePlaygroundTab] = useState<number>(0);
  
  // Real-time states for Playgrounds
  
  // Feature 6: Numeric Counters and Gauges
  const [c32Val, setC32Val] = useState('1000');
  const [c32Old, setC32Old] = useState('950');
  const [allowC32Discon, setAllowC32Discon] = useState(false);
  const [c32Res, setC32Res] = useState<{valid: boolean; error?: string}>({ valid: true });

  const [g32Val, setG32Val] = useState('75');
  const [g32Res, setG32Res] = useState<{valid: boolean; error?: string}>({ valid: true });

  // Feature 7: Identifiers and Object References
  const [oidVal, setOidVal] = useState('1.3.6.1.2.1.1');
  const [oidRes, setOidRes] = useState<{valid: boolean; error?: string}>({ valid: true });

  const [yangVal, setYangVal] = useState('ROUTER-TOKYO_NORTH');
  const [yangRes, setYangRes] = useState<{valid: boolean; error?: string}>({ valid: true });

  // Feature 8: Date and Time Types
  const [dtVal, setDtVal] = useState('2026-06-02T11:18:49+09:00');
  const [isLeapExpected, setIsLeapExpected] = useState(false);
  const [dtRes, setDtRes] = useState<{valid: boolean; error?: string}>({ valid: true });

  // Feature 9: Time Durations + Timeticks Wrapping Simulator
  const [durVal, setDurVal] = useState('3600');
  const [durUnit, setDurUnit] = useState('seconds32');
  const [durRes, setDurRes] = useState<{valid: boolean; error?: string}>({ valid: true });

  // Timeticks active counter simulation
  const [simTimeticks, setSimTimeticks] = useState<bigint>(4294967000n); // Near wrapping limit of 2^32-1
  const [simTimestamp, setSimTimestamp] = useState<bigint>(230500n);
  const [timeticksRunning, setTimeticksRunning] = useState(false);
  const [wrapCounter, setWrapCounter] = useState(0);

  // Feature 10: General address, tags & Normalization
  const [macVal, setMacVal] = useState('00:1A:2B:3C:4D:5E');
  const [macRes, setMacRes] = useState<{valid: boolean; error?: string; normalized?: string}>({ valid: true, normalized: '00:1a:2b:3c:4d:5e' });
  const [uuidVal, setUuidVal] = useState('A809B456-C222-4CFC-B883-2068AA1CBB5A');
  const [uuidRes, setUuidRes] = useState<{valid: boolean; error?: string; normalized?: string}>({ valid: true, normalized: 'a809b456-c222-4cfc-b883-2068aa1cbb5a' });
  const [quadVal, setQuadVal] = useState('192.168.1.100');
  const [quadRes, setQuadRes] = useState<{valid: boolean; error?: string}>({ valid: true });
  const [langVal, setLangVal] = useState('JA-JP');
  const [langRes, setLangRes] = useState<{valid: boolean; error?: string; normalized?: string}>({ valid: true, normalized: 'ja-jp' });

  // Location Registry states
  const [registryDb, setRegistryDb] = useState(INITIAL_REGISTRY);
  const [regForm, setRegForm] = useState({
    name: 'Sapporo_Edge_Switch_05',
    dateAndTime: '2026-06-02T11:15:00Z',
    macAddress: 'AA:BB:CC:DD:EE:05',
    dottedQuad: '10.0.1.50',
    objectIdentifier: '1.3.6.1.4.1.2',
    counter32: '500',
    gauge32: '40',
    languageTag: 'en-US'
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [bulkStatus, setBulkStatus] = useState<{ success?: boolean; message?: string }>({});

  // Real-time verification side-effects when form changes
  useEffect(() => {
    setC32Res(validateCounter32(c32Val, c32Old, allowC32Discon));
  }, [c32Val, c32Old, allowC32Discon]);

  useEffect(() => {
    setG32Res(validateGauge32(g32Val));
  }, [g32Val]);

  useEffect(() => {
    setOidRes(validateObjectIdentifier(oidVal));
  }, [oidVal]);

  useEffect(() => {
    setYangRes(validateYangIdentifier(yangVal));
  }, [yangVal]);

  useEffect(() => {
    setDtRes(validateDateTimeAndOffset(dtVal, isLeapExpected));
  }, [dtVal, isLeapExpected]);

  useEffect(() => {
    if (durUnit === 'microseconds64' || durUnit === 'nanoseconds64') {
      setDurRes(validateDuration64(durVal, durUnit));
    } else {
      setDurRes(validateDuration32(durVal, durUnit));
    }
  }, [durVal, durUnit]);

  useEffect(() => {
    setMacRes(validateMacAddress(macVal));
  }, [macVal]);

  useEffect(() => {
    setUuidRes(validateUuid(uuidVal));
  }, [uuidVal]);

  useEffect(() => {
    setQuadRes(validateDottedQuad(quadVal));
  }, [quadVal]);

  useEffect(() => {
    setLangRes(validateLanguageTag(langVal));
  }, [langVal]);

  // Passive Timeticks Simulator logic
  useEffect(() => {
    let interval: any;
    if (timeticksRunning) {
      interval = setInterval(() => {
        setSimTimeticks(prev => {
          let next = prev + 100000n; // fast increment in centiseconds
          const maxVal = BigInt(4294967295);
          if (next > maxVal) {
            next = next % maxVal; // Wraps around
            setWrapCounter(c => c + 1);
            setSimTimestamp(0n); // Associated timestamp wraps automatically on simulation ticking!
          }
          return next;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [timeticksRunning]);

  const handleCaptureTimestamp = () => {
    // Captures the timeticks node configuration
    setSimTimestamp(simTimeticks % BigInt(100000000));
  };

  const handleLoadSample = (isValid: boolean) => {
    if (isValid) {
      setRegForm({
        name: 'Kyoto_Core_Cabinet_H12',
        dateAndTime: '2026-06-02T03:45:00+09:00',
        macAddress: '52:54:00:FF:11:22',
        dottedQuad: '172.16.4.12',
        objectIdentifier: '1.3.6.1.4.1.9',
        counter32: '5840921',
        gauge32: '99',
        languageTag: 'ja-JP'
      });
      setRegErrors({});
      setBulkStatus({});
    } else {
      // Intentionally load with various standard compilation/pattern errors
      setRegForm({
        name: '-invalid.name_xml', // cannot start with dash, cannot contain xml
        dateAndTime: '2026-06-02T11:18:49+15:30', // invalid UTC timezone bounds
        macAddress: '00-1A-2B-3C-4D-G6', // bad formatting, G6 invalid hex segments
        dottedQuad: '256.100.1.300', // exceeds 0..255 octets range
        objectIdentifier: '4.1.2.3', // OID starts with 4 (Invalid ASN.1 root arc)
        counter32: '-500', // counter must be non-negative
        gauge32: '5294967295', // exceeds maximum limit for uint32
        languageTag: 'lang_extremely_long_and_bad_syntax' // illegal Tag syntax
      });
      setRegErrors({});
      setBulkStatus({});
    }
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // Validate all inputs carefully
    const nameValRes = validateYangIdentifier(regForm.name);
    if (!nameValRes.valid) errors.name = nameValRes.error || 'Faulty identifier format.';

    const dtValRes = validateDateTimeAndOffset(regForm.dateAndTime, true);
    if (!dtValRes.valid) errors.dateAndTime = dtValRes.error || 'Invalid date style.';

    const macValRes = validateMacAddress(regForm.macAddress);
    if (!macValRes.valid) errors.macAddress = macValRes.error || 'Faulty MAC address.';

    const quadValRes = validateDottedQuad(regForm.dottedQuad);
    if (!quadValRes.valid) errors.dottedQuad = quadValRes.error || 'Incorrect dotted quad format.';

    const oidValRes = validateObjectIdentifier(regForm.objectIdentifier);
    if (!oidValRes.valid) errors.objectIdentifier = oidValRes.error || 'Invalid OID.';

    const c32ValRes = validateCounter32(regForm.counter32);
    if (!c32ValRes.valid) errors.counter32 = c32ValRes.error || 'Incorrect counter32 pattern.';

    const g32ValRes = validateGauge32(regForm.gauge32);
    if (!g32ValRes.valid) errors.gauge32 = g32ValRes.error || 'Incorrect gauge32 pattern.';

    const langValRes = validateLanguageTag(regForm.languageTag);
    if (!langValRes.valid) errors.languageTag = langValRes.error || 'Invalid BCP 47 marker.';

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      setBulkStatus({ 
        success: false, 
        message: `Validation Failed: ${Object.keys(errors).length} out-of-boundary constraints or format violations detected.` 
      });
      return;
    }

    // Since validation succeeded, we normalize case-sensitive values to lowercase structure!
    const normalizedEntry = {
      uuid: crypto.randomUUID ? crypto.randomUUID() : `f-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      name: regForm.name.trim(),
      dateAndTime: regForm.dateAndTime.trim(),
      macAddress: regForm.macAddress.trim().toLowerCase(), // Normalized to lowercase
      dottedQuad: regForm.dottedQuad.trim(),
      objectIdentifier: regForm.objectIdentifier.trim(),
      counter32: regForm.counter32.trim(),
      gauge32: regForm.gauge32.trim(),
      languageTag: regForm.languageTag.trim().toLowerCase() // Canonical lowercase
    };

    setRegistryDb(prev => [normalizedEntry, ...prev]);
    setRegErrors({});
    setBulkStatus({ 
      success: true, 
      message: "Validation Succeeded! Registry stored and normalized successfully with lowercase hardware/identity tags." 
    });
  };

  const playgroundTabs = [
    { id: 'f6', name: 'ietf-yang-types Number Models (RFC 6991)', desc: 'Validates non-negative limits, monotonicity updates, and gauge levels.' },
    { id: 'f7', name: 'ietf-yang-types Identifiers & OIDs (RFC 6991 / RFC 9562)', desc: 'Checks YANG valid syntax, OID syntax, and ASN.1 root arc rules.' },
    { id: 'f8', name: 'ietf-yang-types Date & Time Specs (RFC 6991)', desc: 'Parses Gregorian calendars, validates ISO 8601 patterns, and handles timezone offsets.' },
    { id: 'f9', name: 'ietf-yang-types Time Durations & Timeticks (RFC 6991)', desc: 'Calculates intervals from micro/milliseconds, tracks timeticks modulo 2^32 wrapping.' },
    { id: 'f10', name: 'ietf-yang-types Addresses & Normalization (RFC 6991 / RFC 5646)', desc: 'Processes physical addresses, UUIDs, dotted quads, and BCP 47 language tags.' }
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 h-full text-foreground/95" id="yang-validator-root">
      
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <FileCode className="w-7 h-7 text-blue-500" />
            IETF YANG Type Validator
          </h2>
          <p className="text-muted-foreground text-sm">
            Interactive schema assertion tool matching standard RFC 9911 Common YANG Data Types
          </p>
        </div>
        
        {/* Toggle View Mode */}
        <div className="flex bg-muted p-1 border border-border/60 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('playground')}
            className={`px-4 py-1.5 text-xs font-mono font-bold tracking-wide rounded-md transition-all flex items-center gap-2 ${activeTab === 'playground' ? 'bg-blue-600 text-white shadow' : 'text-muted-foreground hover:text-white'}`}
          >
            <Activity className="w-3.5 h-3.5" />
            PLAYGROUNDS
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`px-4 py-1.5 text-xs font-mono font-bold tracking-wide rounded-md transition-all flex items-center gap-2 ${activeTab === 'registry' ? 'bg-blue-600 text-white shadow' : 'text-muted-foreground hover:text-white'}`}
          >
            <Database className="w-3.5 h-3.5" />
            REGISTRY MANAGER
          </button>
        </div>
      </div>

      {activeTab === 'playground' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          
          {/* Left Navigation: Feature Selector */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-mono font-bold px-1 mb-2">RFC 6991 YANG Standards</h3>
            {playgroundTabs.map((pt, idx) => (
              <button
                key={pt.id}
                onClick={() => setActivePlaygroundTab(idx)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1 ${activePlaygroundTab === idx ? 'bg-muted border-blue-500/30' : 'bg-background/40 hover:bg-muted/40 border-border/50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded border ${activePlaygroundTab === idx ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-zinc-800/40 border-border text-muted-foreground'}`}>
                    {idx === 0 ? 'RFC 6991 / 6021' : idx === 1 ? 'RFC 6991 / 9562' : idx === 2 ? 'RFC 6991' : idx === 3 ? 'RFC 6991' : 'RFC 6991 / 5646'}
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform ${activePlaygroundTab === idx ? 'text-blue-500 translate-x-1' : 'text-muted-foreground/60'}`} />
                </div>
                <h4 className="font-semibold text-white text-sm mt-2">{pt.name}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{pt.desc}</p>
              </button>
            ))}
          </div>

          {/* Right Panel: Selected Interactive Playground */}
          <div className="lg:col-span-8 bg-background border border-border/80 rounded-2xl flex flex-col overflow-hidden shadow-xl">
            
            {/* Playground title */}
            <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{playgroundTabs[activePlaygroundTab].name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">SPECIFICATION CONSTRUCTS: RFC 6991 / ietf-yang-types</p>
              </div>
              <span className="text-[10px] font-mono bg-blue-500/10 border border-blue-500/25 text-blue-400 px-2 py-1 rounded">
                YANG SCHEMA ENFORCED
              </span>
            </div>

            {/* Playground details container */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* Feature 6 Layout */}
              {activePlaygroundTab === 0 && (
                <div className="space-y-6">
                  {/* Explanation card */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs leading-relaxed text-muted-foreground">
                    <p className="text-foreground font-semibold inline">Numeric Counters & Gauges: </p>
                    Counters are non-negative integers that monotonically increase until wrapping. Standard gauges fluctuates inside limits of 32-bit/64-bit unsigned bounds.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Counter 32 Validation */}
                    <div className="p-5 rounded-xl border border-border bg-zinc-950/40 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-emerald-500" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">counter32 / counter64</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[11px] font-mono text-muted-foreground block mb-1">Previous / Historical Value</label>
                          <input 
                            type="number"
                            value={c32Old}
                            onChange={(e) => setC32Old(e.target.value)}
                            className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-mono text-muted-foreground block mb-1">Proposed Update Value</label>
                          <input 
                            type="text"
                            value={c32Val}
                            onChange={(e) => setC32Val(e.target.value)}
                            className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input 
                            type="checkbox"
                            id="disconCheck"
                            checked={allowC32Discon}
                            onChange={(e) => setAllowC32Discon(e.target.checked)}
                            className="rounded border-border text-blue-600 bg-background outline-none w-3.5 h-3.5 cursor-pointer"
                          />
                          <label htmlFor="disconCheck" className="text-xs cursor-pointer text-muted-foreground">
                            Discontinuity Signaled (Permits reduction / wrap)
                          </label>
                        </div>

                        {/* Result Display */}
                        <div className={`p-3 rounded-lg border flex items-start gap-2 text-xs ${c32Res.valid ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                          {c32Res.valid ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>Valid update. Monotonicity preserved.</span>
                            </>
                          ) : (
                            <>
                              <XSquare className="w-4 h-4 mt-0.5 shrink-0" />
                              <span className="font-mono">{c32Res.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Gauge Bounds Validation */}
                    <div className="p-5 rounded-xl border border-border bg-zinc-950/40 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-purple-500" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">gauge32 & gauge64 Utilization</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[11px] font-mono text-muted-foreground block mb-1">Proposed Gauge Value</label>
                          <input 
                            type="text"
                            value={g32Val}
                            onChange={(e) => setG32Val(e.target.value)}
                            className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                          />
                        </div>

                        {/* Dial Indicator */}
                        {g32Res.valid && (
                          <div className="pt-2">
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono mb-2">
                              <span>SIMULATED RE-SEGMENTED GAUGE Utilization</span>
                              <span>{Math.min(100, Math.max(0, parseInt(g32Val, 10)) || 0)}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-border">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-purple-500 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, parseInt(g32Val, 10)) || 0)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Bounds feedback */}
                        <div className={`p-3 rounded-lg border flex items-start gap-2 text-xs ${g32Res.valid ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                          {g32Res.valid ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>Gauge holds bounded range of [0 to 2^32-1].</span>
                            </>
                          ) : (
                            <>
                              <XSquare className="w-4 h-4 mt-0.5 shrink-0" />
                              <span className="font-mono">{g32Res.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feature 7 Layout */}
              {activePlaygroundTab === 1 && (
                <div className="space-y-6">
                  {/* Explanation card */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs leading-relaxed text-muted-foreground">
                    <p className="text-foreground font-semibold inline">Identifiers & Object References: </p>
                    Object identifiers represent hierarchical registration trees. ASN.1 standard bounds limit the first root arc segment to 0, 1, or 2, and the second segment limit as specified in schema rules. YANG identifiers represent schemas names under RFC 7950.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* OID Pattern check */}
                    <div className="p-5 rounded-xl border border-border bg-zinc-950/40 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-blue-500" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">object-identifier (OID)</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[11px] font-mono text-muted-foreground block mb-1">Enter Tree OID Statement</label>
                          <input 
                            type="text"
                            value={oidVal}
                            onChange={(e) => setOidVal(e.target.value)}
                            className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                          />
                        </div>

                        {/* Constraints review */}
                        <div className="p-3 bg-zinc-900 border border-border rounded-lg text-[11px] space-y-1.5 leading-relaxed font-mono text-muted-foreground">
                          <p className="text-foreground font-bold">ASN.1 OID Rules Enforced:</p>
                          <p>• Root arc must belong to [0, 1, 2]</p>
                          <p>• If root is 0 or 1, next arc must be [0..39]</p>
                          <p>• Unlimited subsequent octets separated by dot</p>
                        </div>

                        {/* Result */}
                        <div className={`p-3 rounded-lg border flex items-start gap-2 text-xs ${oidRes.valid ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                          {oidRes.valid ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>Matches OID hierarchy constraints.</span>
                            </>
                          ) : (
                            <>
                              <XSquare className="w-4 h-4 mt-0.5 shrink-0" />
                              <span className="font-mono text-[11px]">{oidRes.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* YANG Identifier Name Validation */}
                    <div className="p-5 rounded-xl border border-border bg-zinc-950/40 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCode className="w-4 h-4 text-orange-500" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">YANG-IDENTIFIER Syntax</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[11px] font-mono text-muted-foreground block mb-1">Proposed YANG Identifier Label</label>
                          <input 
                            type="text"
                            value={yangVal}
                            onChange={(e) => setYangVal(e.target.value)}
                            className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                          />
                        </div>

                        <div className="p-3 bg-zinc-900 border border-border rounded-lg text-[11px] space-y-1.5 leading-relaxed font-mono text-muted-foreground">
                          <p className="text-foreground font-bold">RFC 7950 Identifiers Constraint:</p>
                          <p>• Allowed: ASCII letters, digits, dash, underscore, dots</p>
                          <p>• Must not begin with dash or digits</p>
                          <p>• Must not start with keyphrase "xml"</p>
                        </div>

                        {/* Result */}
                        <div className={`p-3 rounded-lg border flex items-start gap-2 text-xs ${yangRes.valid ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                          {yangRes.valid ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>Valid RFC 7950 Schema identifier tag.</span>
                            </>
                          ) : (
                            <>
                              <XSquare className="w-4 h-4 mt-0.5 shrink-0" />
                              <span className="font-mono text-[11px]">{yangRes.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feature 8 Layout */}
              {activePlaygroundTab === 2 && (
                <div className="space-y-6">
                  {/* Explanation card */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs leading-relaxed text-muted-foreground">
                    <p className="text-foreground font-semibold inline">Date & Time Formats: </p>
                    Gregorian representation with customized leap second profiles (seconds field = 60 is strictly accepted only when Leap Second schedule is enabled) and timezone boundaries of RFC 9557 / UTC offset rules [-14:00 to +14:00].
                  </div>

                  <div className="p-5 rounded-xl border border-border bg-zinc-950/40 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">Date-and-time parser (RFC 9911 / ISO 8601)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-[11px] font-mono text-muted-foreground block mb-1">Universal ISO 8601 Timestamp String</label>
                          <input 
                            type="text"
                            value={dtVal}
                            onChange={(e) => setDtVal(e.target.value)}
                            className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                            placeholder="e.g. 2026-06-02T11:18:49Z"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            id="leapCheck"
                            checked={isLeapExpected}
                            onChange={(e) => setIsLeapExpected(e.target.checked)}
                            className="rounded border-border text-blue-600 bg-background outline-none w-3.5 h-3.5 cursor-pointer"
                          />
                          <label htmlFor="leapCheck" className="text-xs cursor-pointer text-muted-foreground">
                            Scheduled Leap Second (Permits value 60 for seconds)
                          </label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-zinc-900 border border-border rounded-lg text-[11px] space-y-1.5 leading-relaxed font-mono text-muted-foreground">
                          <p className="text-foreground font-bold font-sans">Supported Datetime Subtypes:</p>
                          <p>• <span className="text-white">date:</span> YYYY-MM-DD[Offset]</p>
                          <p>• <span className="text-white">date-no-zone:</span> YYYY-MM-DD</p>
                          <p>• <span className="text-white">time:</span> HH:MM:SS[Offset]</p>
                          <p>• <span className="text-white">date-and-time:</span> Full combined ISO variant</p>
                        </div>
                      </div>
                    </div>

                    {/* Result */}
                    <div className={`p-3 rounded-lg border flex items-start gap-2 text-xs ${dtRes.valid ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                      {dtRes.valid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>Strict Profile parsed. Checks out with compliant zone offsets and leap-second guidelines.</span>
                        </>
                      ) : (
                        <>
                          <XSquare className="w-4 h-4 mt-0.5 shrink-0" />
                          <span className="font-mono text-[11px]">{dtRes.error}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Feature 9 Layout */}
              {activePlaygroundTab === 3 && (
                <div className="space-y-6">
                  {/* Explanation card */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs leading-relaxed text-muted-foreground">
                    <p className="text-foreground font-semibold inline">Time Durations & Timeticks Wrap: </p>
                    Supports period metrics from hours32 down to nanoseconds64 (using checked signed int32/int64 brackets). The standard timeticks type tracks elapsed time modulo 2^32 centiseconds. Any associated timestamp markers wrap and reset back to 0.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Duration parser */}
                    <div className="p-5 rounded-xl border border-border bg-zinc-950/40 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">YANG Duration Ranges</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[11px] font-mono text-muted-foreground block mb-1">Select Duration Subtype & Units</label>
                          <select 
                            value={durUnit}
                            onChange={(e) => setDurUnit(e.target.value)}
                            className="w-full bg-background border border-border px-2 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                          >
                            <option value="hours32">hours32 (int32 Hours)</option>
                            <option value="minutes32">minutes32 (int32 Minutes)</option>
                            <option value="seconds32">seconds32 (int32 Seconds)</option>
                            <option value="centiseconds32">centiseconds32 (int32 centisec)</option>
                            <option value="milliseconds32">milliseconds32 (int32 millisec)</option>
                            <option value="microseconds32">microseconds32 (int32 microsec)</option>
                            <option value="microseconds64">microseconds64 (int64 microsec)</option>
                            <option value="nanoseconds32">nanoseconds32 (int32 nanosec)</option>
                            <option value="nanoseconds64">nanoseconds64 (int64 nanosec)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-mono text-muted-foreground block mb-1">Enter Duration Period Value</label>
                          <input 
                            type="text"
                            value={durVal}
                            onChange={(e) => setDurVal(e.target.value)}
                            className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                          />
                        </div>

                        {/* Translating helper */}
                        {durRes.valid && !isNaN(parseFloat(durVal)) && (
                          <div className="p-2 border border-border/80 rounded bg-zinc-900/60 font-mono text-[11px] text-zinc-400">
                            {(() => {
                              const v = parseFloat(durVal);
                              if (durUnit === 'seconds32') {
                                return `Human Equivalent: ${(v/3600).toFixed(2)} hours (or ${(v/60).toFixed(1)} minutes)`;
                              } else if (durUnit === 'nanoseconds32' || durUnit === 'nanoseconds64') {
                                return `Human Equivalent: ${(v/1e9).toFixed(5)} seconds`;
                              } else if (durUnit === 'milliseconds32') {
                                return `Human Equivalent: ${(v/1000).toFixed(3)} seconds`;
                              }
                              return "Equivalent unit: standard Gregorian intervals";
                            })()}
                          </div>
                        )}

                        <div className={`p-3 rounded-lg border flex items-start gap-2 text-xs ${durRes.valid ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                          {durRes.valid ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>Valid duration length inside bounds.</span>
                            </>
                          ) : (
                            <>
                              <XSquare className="w-4 h-4 mt-0.5 shrink-0" />
                              <span className="font-mono text-[11px]">{durRes.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timeticks Wrapping Simulator */}
                    <div className="p-5 rounded-xl border border-border bg-zinc-950/40 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="w-4 h-4 text-purple-500" />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">Timeticks & Timestamp Wrap Simulator</span>
                      </div>

                      <div className="space-y-3 font-mono text-xs text-muted-foreground leading-relaxed">
                        <div className="flex justify-between border-b border-border/40 pb-1.5">
                          <span>Associated Timeticks:</span>
                          <span className="text-white font-bold">{simTimeticks.toString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/40 pb-1.5">
                          <span>Associated Timestamp epoch:</span>
                          <span className="text-orange-400 font-bold">{simTimestamp.toString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overflow Cycles wrapped:</span>
                          <span className="text-purple-400 font-bold">{wrapCounter}</span>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => setTimeticksRunning(!timeticksRunning)}
                            className={`flex-1 py-1.5 rounded text-[11px] font-bold text-white transition-colors bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-1`}
                          >
                            <Play className="w-3 h-3 fill-white" />
                            {timeticksRunning ? 'PAUSE TICKER' : 'RUN FAST-TICKER'}
                          </button>
                          
                          <button
                            onClick={handleCaptureTimestamp}
                            className="flex-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-[11px] font-bold text-white transition-colors"
                          >
                            CAPTURE TIMESTAMP
                          </button>
                        </div>

                        <div className="p-3 rounded bg-zinc-900 border border-border text-[10px] space-y-1">
                          <p className="text-orange-400/90 font-semibold">• Timeticks wraps modulo 2^32 centiseconds.</p>
                          <p className="text-zinc-500">• When Fast-Ticker crosses 4,294,967,295, the simulation auto-resets the Associated Timestamp to 0 (mimicking physical network reset epochs).</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feature 10 Layout */}
              {activePlaygroundTab === 4 && (
                <div className="space-y-6">
                  {/* Explanation card */}
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs leading-relaxed text-muted-foreground">
                    <p className="text-foreground font-semibold inline">Normalize General Identity & Tags: </p>
                    All values for `mac-address`, `phys-address`, `hex-string`, `uuid`, and `language-tag` have case-tolerant syntax checking, but normalise to lowercase strings for standardized storage in database systems.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* MAC Address */}
                    <div className="p-5 rounded-xl border border-border bg-zinc-950/40 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">48-bit mac-address</span>
                        <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">Case Normalization</span>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-muted-foreground block">Raw Input (Try mixing Case)</label>
                        <input 
                          type="text"
                          value={macVal}
                          onChange={(e) => setMacVal(e.target.value)}
                          className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                        />
                      </div>

                      {macRes.valid && (
                        <div className="p-2 bg-purple-500/5 border border-purple-500/20 text-purple-300 font-mono text-xs rounded">
                          Stored Canonical Value: <b className="text-white select-all">{macRes.normalized}</b>
                        </div>
                      )}

                      <div className={`p-2.5 rounded border text-[11px] ${macRes.valid ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-rose-500/5 border-rose-500/10 text-rose-400'}`}>
                        {macRes.valid ? "Pattern match validated." : macRes.error}
                      </div>
                    </div>

                    {/* UUID RFC 9562 */}
                    <div className="p-5 rounded-xl border border-border bg-zinc-950/40 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">uuid (RFC 9562)</span>
                        <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">Normalized Lowercase</span>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-muted-foreground block">Raw Input (Mixed Case)</label>
                        <input 
                          type="text"
                          value={uuidVal}
                          onChange={(e) => setUuidVal(e.target.value)}
                          className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                        />
                      </div>

                      {uuidRes.valid && (
                        <div className="p-2 bg-purple-500/5 border border-purple-500/20 text-purple-300 font-mono text-xs rounded">
                          Stored Canonical Lowercase: <b className="text-white select-all">{uuidRes.normalized}</b>
                        </div>
                      )}

                      <div className={`p-2.5 rounded border text-[11px] ${uuidRes.valid ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-rose-500/5 border-rose-500/10 text-rose-400'}`}>
                        {uuidRes.valid ? "Pattern correct." : uuidRes.error}
                      </div>
                    </div>

                    {/* Dotted-Quad IPv4 address */}
                    <div className="p-5 rounded-xl border border-border bg-zinc-950/40 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">dotted-quad</span>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-muted-foreground block">Octet input bounds [0..255]</label>
                        <input 
                          type="text"
                          value={quadVal}
                          onChange={(e) => setQuadVal(e.target.value)}
                          className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                        />
                      </div>

                      <div className={`p-2.5 rounded border text-[11px] ${quadRes.valid ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-rose-500/5 border-rose-500/10 text-rose-400'}`}>
                        {quadRes.valid ? "Dotted-quad validated." : quadRes.error}
                      </div>
                    </div>

                    {/* Language Tag BCP 47 */}
                    <div className="p-5 rounded-xl border border-border bg-zinc-950/40 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">language-tag (BCP 47)</span>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-muted-foreground block">Language tags</label>
                        <input 
                          type="text"
                          value={langVal}
                          onChange={(e) => setLangVal(e.target.value)}
                          className="w-full bg-background border border-border px-3 py-2 text-xs font-mono rounded-lg outline-none text-white focus:border-blue-500"
                        />
                      </div>

                      {langRes.valid && (
                        <div className="p-2 bg-purple-500/5 border border-purple-500/20 text-purple-300 font-mono text-xs rounded">
                          Normalized String: <b className="text-white select-all">{langRes.normalized}</b>
                        </div>
                      )}

                      <div className={`p-2.5 rounded border text-[11px] ${langRes.valid ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-rose-500/5 border-rose-500/10 text-rose-400'}`}>
                        {langRes.valid ? "BCP 47 tag matched." : langRes.error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      ) : (
        /* REGISTRY MANAGER MULTI-FIELD SUBMISSION (USE CASE 4) */
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Form Side */}
          <div className="xl:col-span-5 bg-background border border-border rounded-xl p-6 flex flex-col gap-5 shadow-lg h-fit">
            
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Bulk Registry Submission</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Validate and persist location registry keys</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLoadSample(true)}
                  className="px-2 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded hover:bg-emerald-500/20 transition-colors"
                >
                  PRELOAD VALID
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample(false)}
                  className="px-2 py-1 text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25 rounded hover:bg-rose-500/20 transition-colors"
                >
                  PRELOAD ERRORS
                </button>
              </div>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              
              {/* YANG Name */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider block mb-1 text-zinc-300">
                  Node / Chassis Label <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  value={regForm.name}
                  onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                  className={`w-full bg-zinc-900 border ${regErrors.name ? 'border-rose-500/60 focus:border-rose-500' : 'border-border focus:border-blue-500'} px-3 py-1.5 text-xs font-mono rounded-lg outline-none text-white`}
                />
                {regErrors.name && (
                  <p className="text-[10px] text-rose-400 font-mono mt-1">{regErrors.name}</p>
                )}
              </div>

              {/* Date profile ISO */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider block mb-1 text-zinc-300">
                  Registry Datestamp <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  value={regForm.dateAndTime}
                  onChange={(e) => setRegForm({...regForm, dateAndTime: e.target.value})}
                  className={`w-full bg-zinc-900 border ${regErrors.dateAndTime ? 'border-rose-500/60 focus:border-rose-500' : 'border-border focus:border-blue-500'} px-3 py-1.5 text-xs font-mono rounded-lg outline-none text-white`}
                  placeholder="YYYY-MM-DDTHH:MM:SSZ"
                />
                {regErrors.dateAndTime && (
                  <p className="text-[10px] text-rose-400 font-mono mt-1">{regErrors.dateAndTime}</p>
                )}
              </div>

              {/* MAC address */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider block mb-1 text-zinc-300">
                  Interface MAC Address <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  value={regForm.macAddress}
                  onChange={(e) => setRegForm({...regForm, macAddress: e.target.value})}
                  className={`w-full bg-zinc-900 border ${regErrors.macAddress ? 'border-rose-500/60 focus:border-rose-500' : 'border-border focus:border-blue-500'} px-3 py-1.5 text-xs font-mono rounded-lg outline-none text-white`}
                  placeholder="aa:bb:cc:dd:ee:ff"
                />
                {regErrors.macAddress && (
                  <p className="text-[10px] text-rose-400 font-mono mt-1">{regErrors.macAddress}</p>
                )}
              </div>

              {/* Dotted quad */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider block mb-1 text-zinc-300">
                  Dotted-Quad / IPv4 Ref <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  value={regForm.dottedQuad}
                  onChange={(e) => setRegForm({...regForm, dottedQuad: e.target.value})}
                  className={`w-full bg-zinc-900 border ${regErrors.dottedQuad ? 'border-rose-500/60 focus:border-rose-500' : 'border-border focus:border-blue-500'} px-3 py-1.5 text-xs font-mono rounded-lg outline-none text-white`}
                  placeholder="255.255.255.255"
                />
                {regErrors.dottedQuad && (
                  <p className="text-[10px] text-rose-400 font-mono mt-1">{regErrors.dottedQuad}</p>
                )}
              </div>

              {/* Object identifier */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider block mb-1 text-zinc-300">
                  YANG Registration OID <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  value={regForm.objectIdentifier}
                  onChange={(e) => setRegForm({...regForm, objectIdentifier: e.target.value})}
                  className={`w-full bg-zinc-900 border ${regErrors.objectIdentifier ? 'border-rose-500/60 focus:border-rose-500' : 'border-border focus:border-blue-500'} px-3 py-1.5 text-xs font-mono rounded-lg outline-none text-white`}
                  placeholder="e.g. 1.3.6.1.4.1"
                />
                {regErrors.objectIdentifier && (
                  <p className="text-[10px] text-rose-400 font-mono mt-1">{regErrors.objectIdentifier}</p>
                )}
              </div>

              {/* Counter32 / Gauge32 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider block mb-1 text-zinc-300">
                    Telemetry Counter
                  </label>
                  <input 
                    type="number"
                    value={regForm.counter32}
                    onChange={(e) => setRegForm({...regForm, counter32: e.target.value})}
                    className={`w-full bg-zinc-900 border ${regErrors.counter32 ? 'border-rose-500/60 focus:border-rose-500' : 'border-border focus:border-blue-500'} px-3 py-1.5 text-xs font-mono rounded-lg outline-none text-white`}
                  />
                  {regErrors.counter32 && (
                    <p className="text-[10px] text-rose-400 font-mono mt-1">{regErrors.counter32}</p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider block mb-1 text-zinc-300">
                    Active Gauge
                  </label>
                  <input 
                    type="number"
                    value={regForm.gauge32}
                    onChange={(e) => setRegForm({...regForm, gauge32: e.target.value})}
                    className={`w-full bg-zinc-900 border ${regErrors.gauge32 ? 'border-rose-500/60 focus:border-rose-500' : 'border-border focus:border-blue-500'} px-3 py-1.5 text-xs font-mono rounded-lg outline-none text-white`}
                  />
                  {regErrors.gauge32 && (
                    <p className="text-[10px] text-rose-400 font-mono mt-1">{regErrors.gauge32}</p>
                  )}
                </div>
              </div>

              {/* Language Code Tag */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider block mb-1 text-zinc-300">
                  Language Identifier Tag (BCP 47) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  value={regForm.languageTag}
                  onChange={(e) => setRegForm({...regForm, languageTag: e.target.value})}
                  className={`w-full bg-zinc-900 border ${regErrors.languageTag ? 'border-rose-500/60 focus:border-rose-500' : 'border-border focus:border-blue-500'} px-3 py-1.5 text-xs font-mono rounded-lg outline-none text-white`}
                  placeholder="e.g. ja-JP or en-US"
                />
                {regErrors.languageTag && (
                  <p className="text-[10px] text-rose-400 font-mono mt-1">{regErrors.languageTag}</p>
                )}
              </div>

              {bulkStatus.message && (
                <div className={`p-3 rounded-lg border text-xs leading-relaxed ${bulkStatus.success ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-400' : 'bg-rose-500/5 border-rose-500/25 text-rose-400'}`}>
                  <div className="flex gap-1.5 items-start font-sans">
                    {bulkStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                    <span>{bulkStatus.message}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Validate and Register Node
              </button>
            </form>
          </div>

          {/* Table Side */}
          <div className="xl:col-span-7 bg-background border border-border rounded-xl p-6 flex flex-col gap-4 shadow-lg min-h-[400px]">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-500" />
                Registered Location Database (Common Types Schema)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Displays normalized forms (hardware addresses & language codes converted to canonical lowercase)
              </p>
            </div>

            <div className="flex-1 overflow-x-auto border border-border/85 rounded-xl bg-zinc-950/40">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    <th className="px-4 py-3">Node Label</th>
                    <th className="px-4 py-3">Datestamp</th>
                    <th className="px-4 py-3">MAC Addr</th>
                    <th className="px-4 py-3">Dotted-Quad</th>
                    <th className="px-4 py-3">OID Node</th>
                    <th className="px-4 py-3 font-mono">Counter/Gauge</th>
                    <th className="px-4 py-3">Lang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs font-mono">
                  {registryDb.map((entry) => (
                    <tr key={entry.uuid} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-white font-semibold font-sans">{entry.name}</td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{entry.dateAndTime}</td>
                      <td className="px-4 py-3">
                        <span className="text-purple-400 select-all font-bold">{entry.macAddress}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{entry.dottedQuad}</td>
                      <td className="px-4 py-3 text-zinc-400">{entry.objectIdentifier}</td>
                      <td className="px-4 py-3 text-zinc-400">
                        <div className="flex flex-col">
                          <span>C: {entry.counter32}</span>
                          <span className="text-[10px] opacity-80">G: {entry.gauge32}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-blue-400 font-bold">{entry.languageTag}</span>
                      </td>
                    </tr>
                  ))}
                  {registryDb.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                        No registered nodes currently kept in database memory. Preload samples above to test.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
