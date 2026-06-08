import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Cpu, 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  Info, 
  ArrowRight, 
  Check, 
  RefreshCw, 
  FileCode, 
  Network,
  Binary,
  Layers,
  ChevronRight,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';
import { 
  validateIpAddress, 
  validateIpAddressNoZone,
  validateIpv4Address,
  validateIpv4AddressNoZone,
  validateIpv6Address,
  validateIpv6AddressNoZone,
  validateIpPrefix,
  validateIpv4Prefix,
  validateIpv6Prefix,
  validateDomainName,
  validateHost,
  validateUri,
  validateDscp,
  validateIpv6FlowLabel,
  validatePortNumber,
  validateAsNumber,
  validateIpVersion,
  ValidationResult
} from '../../lib/ietfInetTypes';

type TypeDefOption = {
  id: string;
  name: string;
  category: 'address' | 'domain' | 'protocol';
  description: string;
  rfcText?: string;
  placeholder: string;
  validator: (val: string) => ValidationResult;
};

const TYPEDEF_OPTIONS: TypeDefOption[] = [
  {
    id: 'ip-address',
    name: 'ip-address',
    category: 'address',
    description: 'IP-version neutral address representation. Supports IPv4, IPv6, and interface zone scope suffixes.',
    placeholder: 'e.g., 192.168.1.1 or 2001:db8::1%eth0',
    validator: validateIpAddress
  },
  {
    id: 'ip-address-no-zone',
    name: 'ip-address-no-zone',
    category: 'address',
    description: 'IP-version neutral address excluding any interface zone scopes.',
    placeholder: 'e.g., 10.0.0.5 or fe80::a11',
    validator: validateIpAddressNoZone
  },
  {
    id: 'ipv4-address',
    name: 'ipv4-address',
    category: 'address',
    description: 'Dotted-quad notation IPv4 address. Optionally contains an interface zone identifier.',
    placeholder: 'e.g., 192.168.1.5%wan',
    validator: validateIpv4Address
  },
  {
    id: 'ipv4-address-no-zone',
    name: 'ipv4-address-no-zone',
    category: 'address',
    description: 'Strict dotted-quad notation IPv4 address without any zone indices allowed.',
    placeholder: 'e.g., 192.168.1.5',
    validator: validateIpv4AddressNoZone
  },
  {
    id: 'ipv6-address',
    name: 'ipv6-address',
    category: 'address',
    description: 'Full or compressed hexadecimal IPv6 representable address. Optionally supports scope zones.',
    placeholder: 'e.g., 2001:0DB8::0001%eth1',
    validator: validateIpv6Address
  },
  {
    id: 'ipv6-address-no-zone',
    name: 'ipv6-address-no-zone',
    category: 'address',
    description: 'Hexadecimal IPv6 address with zone suffixes strictly forbidden.',
    placeholder: 'e.g., 2001:db8::1',
    validator: validateIpv6AddressNoZone
  },
  {
    id: 'ip-prefix',
    name: 'ip-prefix',
    category: 'address',
    description: 'IP-version neutral representation of subnets. Expects base address followed by slash and bit mask.',
    placeholder: 'e.g., 10.0.0.0/24 or 2001:db8::/64',
    validator: validateIpPrefix
  },
  {
    id: 'ipv4-prefix',
    name: 'ipv4-prefix',
    category: 'address',
    description: 'IPv4 subnetwork layout containing dotted address and bit masks between 0 and 32 bits.',
    placeholder: 'e.g., 192.168.10.0/24',
    validator: validateIpv4Prefix
  },
  {
    id: 'ipv6-prefix',
    name: 'ipv6-prefix',
    category: 'address',
    description: 'IPv6 subnetwork segment terminating with slash and bit lengths up to 128 bits.',
    placeholder: 'e.g., 2001:db8:a::/48',
    validator: validateIpv6Prefix
  },
  {
    id: 'domain-name',
    name: 'domain-name',
    category: 'domain',
    description: 'Fully qualified DNS domain identifier. ASCII characters limit: 253 characters total.',
    placeholder: 'e.g., support.ietf.org',
    validator: validateDomainName
  },
  {
    id: 'host',
    name: 'host',
    category: 'domain',
    description: 'Internet host resource. Resolves as either a valid IP address or a DNS domain name.',
    placeholder: 'e.g., 127.0.0.1 or example.com',
    validator: validateHost
  },
  {
    id: 'uri',
    name: 'uri',
    category: 'domain',
    description: 'Uniform Resource Identifier under STD 66 and RFC 3986 with lowercase normalization capabilities.',
    placeholder: 'e.g., HTTP://www.Example.com/%7esmith',
    validator: validateUri
  },
  {
    id: 'port-number',
    name: 'port-number',
    category: 'protocol',
    description: 'Transport layer TCP/UDP/SCTP node service port with standard 16-bit boundaries.',
    placeholder: 'e.g., 443',
    validator: validatePortNumber
  },
  {
    id: 'dscp',
    name: 'dscp',
    category: 'protocol',
    description: 'Differentiated Services Code Point marking for traffic QoS classes.',
    placeholder: 'Range: 0..63',
    validator: validateDscp
  },
  {
    id: 'ipv6-flow-label',
    name: 'ipv6-flow-label',
    category: 'protocol',
    description: 'IPv6 header field for traffic discrimination. Standard 20-bit uint32 value.',
    placeholder: 'Range: 0..1048575',
    validator: validateIpv6FlowLabel
  },
  {
    id: 'as-number',
    name: 'as-number',
    category: 'protocol',
    description: 'BGP Autonomous System identifier ranging across 32-bit uint capacity.',
    placeholder: 'e.g., 65001',
    validator: validateAsNumber
  },
  {
    id: 'ip-version',
    name: 'ip-version',
    category: 'protocol',
    description: 'Enumerated value indicating IP version type.',
    placeholder: 'unknown, ipv4, ipv6',
    validator: validateIpVersion
  }
];

type TestCase = {
  name: string;
  typeId: string;
  input: string;
  expectSuccess: boolean;
  notes: string;
};

const TEST_CASES: TestCase[] = [
  {
    name: 'IPv4 Prefix boundaries (Overlimit)',
    typeId: 'ipv4-prefix',
    input: '192.168.1.0/33',
    expectSuccess: false,
    notes: 'Exceeds standard 32-bit subnet mask limit. Rejected under RFC 6021.'
  },
  {
    name: 'IPv6 Address canonicalization',
    typeId: 'ipv6-address',
    input: '2001:0db8::0001',
    expectSuccess: true,
    notes: 'Decodes and standardizes hex digits to lowercase and removes redundant leading zeros.'
  },
  {
    name: 'URI Path normalization',
    typeId: 'uri',
    input: 'HTTP://www.Example.com/%7esmith',
    expectSuccess: true,
    notes: 'Converts scheme and host names to lowercase, decodes percent-encoded tilde (~).'
  },
  {
    name: 'DNS Domain name sublabel size overflow',
    typeId: 'domain-name',
    input: 'this-sub-label-of-dns-domain-name-is-extremely-excessive-and-exceeds-the-maximum-limit-of-63-chars.com',
    expectSuccess: false,
    notes: 'Individual sub-host labels must not exceed 63 characters total.'
  },
  {
    name: 'Valid scoped Link Local with interface zone',
    typeId: 'ipv6-address',
    input: 'fe80::1ff%eth1',
    expectSuccess: true,
    notes: 'Extracts zone interface tags successfully inside scoped IPv6 references.'
  },
  {
    name: 'Strict no-zone constraint verification',
    typeId: 'ipv6-address-no-zone',
    input: 'fe80::1ff%eth1',
    expectSuccess: false,
    notes: 'Rejects zone parameters when evaluated under the restrictive -no-zone typedef.'
  },
  {
    name: 'Safe TCP Port validation',
    typeId: 'port-number',
    input: '8080',
    expectSuccess: true,
    notes: 'Well within standard 16-bit TCP port boundaries (0..65535).'
  },
  {
    name: '16-bit Port boundary check overflow',
    typeId: 'port-number',
    input: '70000',
    expectSuccess: false,
    notes: '16-bit unsigned port numbers cannot exceed standard 65535 count.'
  },
  {
    name: 'DSCP QoS markings limit verification',
    typeId: 'dscp',
    input: '64',
    expectSuccess: false,
    notes: 'Traffic DiffServ Code Points must reside within standard range (0..63).'
  }
];

export function InternetTypesView({ onNavigate }: { onNavigate?: (id: string, type: any) => void }) {
  const [selectedTypeId, setSelectedTypeId] = useState<string>('ip-address');
  const [inputValue, setInputValue] = useState<string>('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [validationLogs, setValidationLogs] = useState<string[]>([]);
  const [validationState, setValidationState] = useState<'idle' | 'parsing' | 'validated' | 'invalid'>('idle');
  const [activeSubTab, setActiveSubTab] = useState<'sandbox' | 'docs' | 'suite'>('sandbox');

  // Search input for scrolling through schema definitions
  const [searchTerm, setSearchTerm] = useState('');

  const selectedType = TYPEDEF_OPTIONS.find(t => t.id === selectedTypeId) || TYPEDEF_OPTIONS[0];

  // Perform validation on inputs
  useEffect(() => {
    if (!inputValue.trim()) {
      setResult(null);
      setValidationLogs([]);
      setValidationState('idle');
      return;
    }

    setValidationState('parsing');
    const logs: string[] = [];
    logs.push(`Evaluating schema boundaries for typedef: "${selectedType.name}"`);

    // Let's simulate step-by-step state machine transition
    setTimeout(() => {
      // Step 2: Check standard pattern / Syntax
      logs.push(`State: PATTERN_CHECK | Verifying syntax characters...`);
      
      const res = selectedType.validator(inputValue);
      
      if (res.isValid) {
        logs.push(`State: RANGE_CHECK | Standard pattern confirmed. Verifying bounds and capacities...`);
        logs.push(`State: NORMALIZATION | Compiling normalized canonical form...`);
        logs.push(`Success: Standard output normalized format: "${res.canonical}"`);
        setValidationState('validated');
      } else {
        logs.push(`State: TRANSITION_ABORTED | Syntax pattern or scale check failed.`);
        logs.push(`Error: ${res.message}`);
        setValidationState('invalid');
      }

      setResult(res);
      setValidationLogs(logs);
    }, 150);

  }, [inputValue, selectedTypeId]);

  const loadPresetTestCase = (tc: TestCase) => {
    setSelectedTypeId(tc.typeId);
    setInputValue(tc.input);
    setActiveSubTab('sandbox');
    // Simple notification logging is triggered inside the validation hook
  };

  const filteredDocs = TYPEDEF_OPTIONS.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto w-full text-left">
      
      {/* Header Info Banner */}
      <div className="border-b border-border/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest bg-emerald-600/15 text-emerald-400 font-mono px-2 py-0.5 rounded font-extrabold select-none">
            ietf-inet-types (RFC 6021)
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-2">
            <Globe className="w-6 h-6 text-emerald-500" />
            Internet Address & Protocol Types
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Validation suite, range checks, and canonical normalizers for core address structures, DNS hostnames, URIs, and protocol header attributes.
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
            <Binary className="w-4 h-4" />
            Types Sandbox
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
            BDD Test Cases
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
            YANG Typedefs
          </button>
        </div>
      </div>

      {/* Main View Grid container */}
      {activeSubTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Side panel: Type select menu */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Network className="w-4 h-4 text-emerald-500" />
                Select RFC 6021 Type
              </h3>

              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {/* Categorized address layouts */}
                <div className="space-y-2">
                  <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase font-extrabold">Addresses & Prefixes</div>
                  <div className="grid grid-cols-1 gap-1">
                    {TYPEDEF_OPTIONS.filter(o => o.category === 'address').map(o => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setSelectedTypeId(o.id);
                          setInputValue('');
                        }}
                        className={`text-left text-xs font-mono p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          selectedTypeId === o.id
                            ? 'bg-emerald-600/10 border-emerald-500 text-white font-bold'
                            : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:bg-zinc-900/30'
                        }`}
                      >
                        <span>{o.name}</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedTypeId === o.id ? 'text-emerald-400 transform translate-x-1' : 'text-zinc-650'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categorized domains & names layouts */}
                <div className="space-y-2">
                  <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase font-extrabold">Domains & URIs</div>
                  <div className="grid grid-cols-1 gap-1">
                    {TYPEDEF_OPTIONS.filter(o => o.category === 'domain').map(o => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setSelectedTypeId(o.id);
                          setInputValue('');
                        }}
                        className={`text-left text-xs font-mono p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          selectedTypeId === o.id
                            ? 'bg-emerald-600/10 border-emerald-500 text-white font-bold'
                            : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:bg-zinc-900/30'
                        }`}
                      >
                        <span>{o.name}</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedTypeId === o.id ? 'text-emerald-400 transform translate-x-1' : 'text-zinc-650'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categorized protocols QoS & header attributes */}
                <div className="space-y-2">
                  <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase font-extrabold">Protocol Fields / AS</div>
                  <div className="grid grid-cols-1 gap-1">
                    {TYPEDEF_OPTIONS.filter(o => o.category === 'protocol').map(o => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setSelectedTypeId(o.id);
                          setInputValue('');
                        }}
                        className={`text-left text-xs font-mono p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                          selectedTypeId === o.id
                            ? 'bg-emerald-600/10 border-emerald-500 text-white font-bold'
                            : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:bg-zinc-900/30'
                        }`}
                      >
                        <span>{o.name}</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedTypeId === o.id ? 'text-emerald-400 transform translate-x-1' : 'text-zinc-650'}`} />
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Column 2: Parser workspace box */}
          <div className="lg:col-span-8 bg-zinc-950/10 border border-border/70 rounded-xl p-5 space-y-6">
            
            {/* Context details */}
            <div className="border-b border-zinc-900 pb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">Target Typedef definition</span>
              <h3 className="text-lg font-bold text-white font-mono mt-0.5">{selectedType.name}</h3>
              <p className="text-zinc-400 text-xs font-sans mt-2 leading-relaxed">
                {selectedType.description}
              </p>
            </div>

            {/* Input workspace */}
            <div className="space-y-4 font-mono text-xs text-left">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold">Input String to evaluate</label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={selectedType.placeholder}
                    className="bg-background border border-border rounded-xl p-3.5 text-xs w-full text-white outline-none focus:border-emerald-500/80 pr-10"
                    id="ietf-type-input"
                  />
                  {inputValue && (
                    <button
                      type="button"
                      onClick={() => setInputValue('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      title="Clear string"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Live parsing visual flow representation (Features 30,31,32) */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4.5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-extrabold">Active NMDA State Evaluation Cascade</span>
                  <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded">
                    FSM SIMULATOR
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  {/* Step 1: Input state */}
                  <div className={`p-2 rounded border flex flex-col items-center justify-center gap-1 ${
                    inputValue ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-300' : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                  }`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>1. INPUT</span>
                  </div>

                  {/* Step 2: Pattern validation */}
                  <div className={`p-2 rounded border flex flex-col items-center justify-center gap-1 ${
                    validationState === 'parsing' || validationState === 'validated' || validationState === 'invalid'
                      ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                  }`}>
                    <FileCode className="w-3.5 h-3.5" />
                    <span>2. PATTERN</span>
                  </div>

                  {/* Step 3: Range capacity checker */}
                  <div className={`p-2 rounded border flex flex-col items-center justify-center gap-1 ${
                    validationState === 'validated' || (validationState === 'invalid' && validationLogs.length > 2)
                      ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                  }`}>
                    <Binary className="w-3.5 h-3.5" />
                    <span>3. RANGE</span>
                  </div>

                  {/* Step 4: Normalization output */}
                  <div className={`p-2 rounded border flex flex-col items-center justify-center gap-1 ${
                    validationState === 'validated' ? 'bg-emerald-500/20 border-emerald-500 text-white' :
                    validationState === 'invalid' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    'bg-zinc-900 border-zinc-850 text-zinc-500'
                  }`}>
                    {validationState === 'validated' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> :
                     validationState === 'invalid' ? <XCircle className="w-3.5 h-3.5 text-red-500" /> :
                     <HelpCircle className="w-3.5 h-3.5" />}
                    <span>4. NORMALIZED</span>
                  </div>
                </div>

                {/* Validation logs terminal console */}
                {inputValue && (
                  <div className="bg-black/40 border border-zinc-950 p-3.5 rounded-lg text-[11px] leading-relaxed text-zinc-400 font-mono space-y-1">
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
                )}
              </div>

              {/* Validation Response Result Card */}
              {result && (
                <div className={`p-5 rounded-xl border flex flex-col gap-3.5 ${
                  result.isValid 
                    ? 'bg-emerald-600/5 border-emerald-500/40' 
                    : 'bg-red-500/5 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-2.5 justify-between">
                    <div className="flex items-center gap-2">
                      {result.isValid ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <span className="font-bold text-white text-sm">
                          {result.isValid ? 'Validation Succeeded' : 'Validation Failed'}
                        </span>
                        <div className="text-[10px] text-zinc-500 mt-0.5">Constraint criteria alignment check</div>
                      </div>
                    </div>

                    {result.version && result.version !== 'none' && (
                      <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 rounded text-indigo-400 uppercase font-extrabold">
                        {result.version}
                      </span>
                    )}
                  </div>

                  <p className="text-zinc-300 text-xs italic bg-zinc-950/20 p-3 rounded-lg border border-zinc-900 leading-relaxed font-sans">
                    {result.message}
                  </p>

                  {result.isValid && result.canonical && (
                    <div className="border-t border-zinc-900/60 pt-3 flex flex-col gap-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase font-extrabold">Canonical Normalized Form (Store-ready)</span>
                      <div className="bg-background border border-border p-3 rounded-lg flex items-center justify-between text-white font-bold select-all overflow-x-auto">
                        <code className="text-xs text-emerald-400 tracking-wider whitespace-nowrap">{result.canonical}</code>
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded font-extrabold uppercase shrink-0">YANG NMDA canonical</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* If empty */}
              {!inputValue && (
                <div className="p-10 border border-dashed border-zinc-850 rounded-xl text-center text-zinc-650 flex flex-col items-center justify-center gap-2 font-sans">
                  <Info className="w-7 h-7 text-zinc-700" />
                  <p className="text-xs">
                    Input a value in the container above to test string constraints or select preloaded test scenarios.
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* --- TAB 2: BDD TEST CASES SUITE --- */}
      {activeSubTab === 'suite' && (
        <div className="bg-zinc-950/10 border border-border/70 rounded-xl p-5 space-y-6">
          <div className="border-b border-zinc-900 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                RFC 6021 BDD Given-When-Then Acceptance Suite
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Executable acceptance presets mapping to the test scenarios detailed in RFC 6021 and RFC 6991 specifications.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEST_CASES.map((tc, index) => {
              const matchingType = TYPEDEF_OPTIONS.find(t => t.id === tc.typeId);
              return (
                <div 
                  key={index} 
                  className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4.5 flex flex-col justify-between hover:border-zinc-800 transition-all cursor-pointer group"
                  onClick={() => loadPresetTestCase(tc)}
                >
                  <div className="space-y-3 font-mono">
                    <div className="flex justify-between items-start gap-2 border-b border-zinc-900 pb-2">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{tc.name}</span>
                      <span className={`text-[8px] uppercase px-1.5 py-0.2 rounded font-extrabold shrink-0 border ${
                        tc.expectSuccess 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {tc.expectSuccess ? 'EXPECTS PASS' : 'EXPECTS FAIL'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] uppercase font-bold text-zinc-500 leading-none">
                        <span>Typedef</span>
                        <span className="text-white bg-zinc-800/60 px-1 rounded">{tc.typeId}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 bg-background/50 p-2 border border-zinc-850 rounded truncate w-full" title={tc.input}>
                        Input: <code className="text-zinc-300 font-semibold">{tc.input}</code>
                      </div>
                    </div>

                    <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                      {tc.notes}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="w-full mt-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-transparent py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all"
                  >
                    Load & Run Sandbox
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: SCHEMA SPECIFICATIONS / DOCS --- */}
      {activeSubTab === 'docs' && (
        <div className="bg-zinc-950/10 border border-border/70 rounded-xl p-5 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                ietf-inet-types YANG Schema Definitions (RFC 6021)
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Consult precise typedef rules, length parameters, patterns, and normative specification descriptions.
              </p>
            </div>

            {/* Quick search */}
            <div className="relative shrink-0 w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search definitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background border border-border rounded-full pl-9 pr-3 py-1.5 text-xs text-white outline-none w-full font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDocs.map((t) => (
              <div key={t.id} className="bg-zinc-950/40 border border-zinc-900 p-4.5 rounded-xl font-mono text-xs space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span className="text-emerald-400 font-extrabold text-sm">{t.name}</span>
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded font-extrabold uppercase">
                    {t.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] text-zinc-300 font-sans leading-relaxed">{t.description}</div>
                  <div className="bg-background border border-zinc-850 p-3 rounded-lg text-[10px] text-zinc-500 leading-relaxed max-h-[140px] overflow-y-auto">
                    <div className="text-white font-bold uppercase text-[8px] mb-1">Standard Placeholder Example</div>
                    <code className="text-zinc-400">{t.placeholder}</code>
                  </div>
                </div>
              </div>
            ))}

            {filteredDocs.length === 0 && (
              <div className="col-span-2 text-center py-10 font-sans text-zinc-600 text-xs italic">
                No matching typedef definitions found. Try a different query spelling.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
