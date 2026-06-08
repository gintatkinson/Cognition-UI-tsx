import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Layers, 
  GitCommit, 
  Share2, 
  Cpu, 
  Activity, 
  Shuffle, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Info,
  Sliders,
  Sparkles,
  MapPin,
  Maximize2,
  FileCode,
  Tag
} from 'lucide-react';
import { NetworkService } from '../../services/networkService';
import { PassiveCable, PassiveDevice, PassiveDeviceType, PassivePort, ChildCable, ConnectedDeviceEnd } from '../../types';

export function PassiveNetworkInventoryView({ onNavigate }: { onNavigate?: (id: string, type: any) => void }) {
  const networkService = NetworkService.getInstance();
  
  // Local state initialized from service
  const [cables, setCables] = useState<PassiveCable[]>(() => networkService.getPassiveCables());
  const [devices, setDevices] = useState<PassiveDevice[]>(() => networkService.getPassiveDevices());
  const [topology] = useState(() => networkService.getTopology());

  // Navigation tabs: 'cables' | 'devices' | 'sandbox'
  const [activeTab, setActiveTab] = useState<'cables' | 'devices' | 'sandbox'>('cables');

  // Selected Items
  const [selectedCableId, setSelectedCableId] = useState<string>(cables[0]?.id || '');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id || '');

  // Alert state
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const triggerAlert = (type: 'success' | 'error' | 'warning', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const selectedCable = useMemo(() => cables.find(c => c.id === selectedCableId), [cables, selectedCableId]);
  const selectedDevice = useMemo(() => devices.find(d => d.id === selectedDeviceId), [devices, selectedDeviceId]);

  // --- FEATURE 25: Create Cable State ---
  const [newCableId, setNewCableId] = useState('');
  const [newCableName, setNewCableName] = useState('');
  const [newCableAlias, setNewCableAlias] = useState('');
  const [newCableDesc, setNewCableDesc] = useState('');
  const [newCableType, setNewCableType] = useState<'optical-fiber' | 'electrical-cable' | 'coaxial-cable'>('optical-fiber');
  const [newCableRole, setNewCableRole] = useState<'backbone' | 'aggregation' | 'access' | 'trunk' | 'distribution' | 'branch'>('backbone');
  const [newCableLength, setNewCableLength] = useState<number>(1000);
  
  // Optical specific characteristics (Feature 25)
  const [fiberCoreNum, setFiberCoreNum] = useState<number>(48);
  const [fiberType, setFiberType] = useState<'G652A' | 'G652B' | 'G652C' | 'G652D' | 'G653' | 'G654' | 'G655' | 'G656' | 'G657A1' | 'G657A2' | 'G657B' | 'other'>('G652D');
  const [attenuation, setAttenuation] = useState<number>(2.5);

  const handleRegisterCable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCableId.trim()) {
      triggerAlert('error', 'Cable ID cannot be empty.');
      return;
    }
    if (cables.some(c => c.id === newCableId.trim())) {
      triggerAlert('error', `YANG Key Constraint Violation: Cable ID "${newCableId.trim()}" is already registered.`);
      return;
    }

    // Prepare default Ends (A & Z)
    const emptyEnd: ConnectedDeviceEnd = { deviceType: 'active-device', neRef: 'node-TK1' };

    const cable: PassiveCable = {
      id: newCableId.trim(),
      name: newCableName.trim() || undefined,
      alias: newCableAlias.trim() || undefined,
      description: newCableDesc.trim() || undefined,
      cableType: newCableType,
      cableRole: newCableRole,
      length: Number(newCableLength),
      aEnd: emptyEnd,
      zEnd: emptyEnd
    };

    // Feature 25: Conditionally attach optical properties
    if (newCableType === 'optical-fiber') {
      cable.opticalCable = {
        fiberCoreNum: Number(fiberCoreNum),
        fiberType,
        attenuation: Number(attenuation)
      };
    }

    try {
      networkService.addPassiveCable(cable);
      const updated = networkService.getPassiveCables();
      setCables(updated);
      setSelectedCableId(cable.id);
      
      // Cleanup inputs
      setNewCableId('');
      setNewCableName('');
      setNewCableAlias('');
      setNewCableDesc('');
      setNewCableLength(1000);
      triggerAlert('success', `Physical cable asset "${cable.id}" successfully registered under Passive Network Inventory.`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  // --- FEATURE 26: Endpoint Connections & Concatenation Splicing ---
  const [endToConfigure, setEndToConfigure] = useState<'aEnd' | 'zEnd'>('aEnd');
  const [connDeviceType, setConnDeviceType] = useState<'active-device' | 'passive-device'>('active-device');
  const [connActiveNe, setConnActiveNe] = useState('node-TK1');
  const [connComponent, setConnComponent] = useState('');
  const [connPassiveDevice, setConnPassiveDevice] = useState('');

  const handleUpdateEndConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCable) return;

    const endObj: ConnectedDeviceEnd = {
      deviceType: connDeviceType,
      ...(connDeviceType === 'active-device' 
        ? { neRef: connActiveNe, componentRef: connComponent.trim() || undefined }
        : { deviceId: connPassiveDevice || undefined })
    };

    const updatedCable = { ...selectedCable };
    if (endToConfigure === 'aEnd') {
      updatedCable.aEnd = endObj;
    } else {
      updatedCable.zEnd = endObj;
    }

    networkService.updatePassiveCable(updatedCable);
    setCables(networkService.getPassiveCables());
    triggerAlert('success', `Connection ${endToConfigure === 'aEnd' ? 'A-End' : 'Z-End'} of cable "${selectedCable.id}" updated successfully.`);
  };

  // Splicing child segment addition (Feature 2 child minimum rule)
  const [childCableIdInput, setChildCableIdInput] = useState('');
  const [childLengthInput, setChildLengthInput] = useState<number>(500);

  const handleAddChildSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCable) return;
    if (!childCableIdInput) {
      triggerAlert('error', 'Select a target child cable segment.');
      return;
    }
    if (childCableIdInput === selectedCable.id) {
      triggerAlert('error', 'Recursive Error: A cable cannot splicing-concatenate itself as a child-cable nested run.');
      return;
    }

    const currentChildren = selectedCable.childCables || [];
    const nextIndex = currentChildren.length + 1;

    // Check duplicate
    if (currentChildren.some(c => c.id === childCableIdInput)) {
      triggerAlert('error', `Segment "${childCableIdInput}" is already a spliced component of this cable run.`);
      return;
    }

    const newSegment: ChildCable = {
      id: childCableIdInput,
      index: nextIndex,
      length: Number(childLengthInput)
    };

    const updatedCable = {
      ...selectedCable,
      childCables: [...currentChildren, newSegment]
    };

    // Feature 26: Recalculate total composite length as sum of children lengths
    updatedCable.length = updatedCable.childCables.reduce((acc, c) => acc + c.length, 0);

    networkService.updatePassiveCable(updatedCable);
    setCables(networkService.getPassiveCables());
    triggerAlert('success', `Segment index ${nextIndex} spliced. Total composite length updated to ${updatedCable.length} m.`);
  };

  const handleDeleteChildSegment = (childId: string) => {
    if (!selectedCable || !selectedCable.childCables) return;

    const filtered = selectedCable.childCables.filter(c => c.id !== childId)
      // Re-index remaining sequences
      .map((c, i) => ({ ...c, index: i + 1 }));

    const updatedCable = {
      ...selectedCable,
      childCables: filtered.length > 0 ? filtered : undefined
    };

    if (updatedCable.childCables) {
      updatedCable.length = updatedCable.childCables.reduce((acc, c) => acc + c.length, 0);
    }

    networkService.updatePassiveCable(updatedCable);
    setCables(networkService.getPassiveCables());
    triggerAlert('warning', `Deleted spliced segment. Splicing index chain rebuilt.`);
  };

  // --- FEATURE 27: Passive Device & Input/Output splitters ---
  const [newDevId, setNewDevId] = useState('');
  const [newDevName, setNewDevName] = useState('');
  const [newDevType, setNewDevType] = useState<PassiveDeviceType>('ODF');
  const [newDevLocation, setNewDevLocation] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tagsList, setTagsList] = useState<string[]>([]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tagsList.includes(tagInput.trim())) {
      setTagsList([...tagsList, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTagsList(tagsList.filter(item => item !== t));
  };

  const handleRegisterDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevId.trim()) {
      triggerAlert('error', 'Device ID cannot be empty.');
      return;
    }
    if (devices.some(d => d.id === newDevId.trim())) {
      triggerAlert('error', `YANG Key Constraint Violation: Passive Device identifier "${newDevId.trim()}" already taken.`);
      return;
    }

    const devObj: PassiveDevice = {
      id: newDevId.trim(),
      name: newDevName.trim() || undefined,
      deviceType: newDevType,
      locationRef: newDevLocation.trim() || undefined,
      customTags: tagsList.length > 0 ? tagsList : undefined,
      passivePorts: [] // starts with empty ports
    };

    try {
      networkService.addPassiveDevice(devObj);
      setDevices(networkService.getPassiveDevices());
      setSelectedDeviceId(devObj.id);
      
      // Clear inputs
      setNewDevId('');
      setNewDevName('');
      setNewDevLocation('');
      setTagsList([]);
      triggerAlert('success', `Created passive ${newDevType} equipment box "${devObj.id}" aligned to localization refs.`);
    } catch (err: any) {
      triggerAlert('error', err.message);
    }
  };

  // Passive ports config inside device (Feature 27)
  const [passivePortId, setPassivePortId] = useState('');
  const [passivePortType, setPassivePortType] = useState<'service-port' | 'input-port' | 'output-port' | 'p2mp-port'>('service-port');
  const [portCoreNum, setPortCoreNum] = useState<number | ''>('');

  const handleAddPassivePort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    if (!passivePortId.trim()) {
      triggerAlert('error', 'Port identifier is required.');
      return;
    }

    const currentPorts = selectedDevice.passivePorts || [];
    if (currentPorts.some(p => p.id === passivePortId.trim())) {
      triggerAlert('error', `YANG Unique Constraint: Port index "${passivePortId.trim()}" already defined on passive unit.`);
      return;
    }

    const newPort: PassivePort = {
      id: passivePortId.trim(),
      portType: passivePortType,
      fiberCoreNum: portCoreNum !== '' ? Number(portCoreNum) : undefined
    };

    const updatedDevice = {
      ...selectedDevice,
      passivePorts: [...currentPorts, newPort]
    };

    networkService.updatePassiveDevice(updatedDevice);
    setDevices(networkService.getPassiveDevices());
    setPassivePortId('');
    setPortCoreNum('');
    triggerAlert('success', `Added passive port ${newPort.id} (${passivePortType}) linked to core index.`);
  };

  const handleDeletePassivePort = (portId: string) => {
    if (!selectedDevice) return;
    const updatedDevice = {
      ...selectedDevice,
      passivePorts: selectedDevice.passivePorts.filter(p => p.id !== portId)
    };
    networkService.updatePassiveDevice(updatedDevice);
    setDevices(networkService.getPassiveDevices());
    triggerAlert('warning', `Removed port "${portId}" from passive asset schema.`);
  };

  // Interactive BDD compiler playground
  const [activeBddScenario, setActiveBddScenario] = useState<'instantiate-fiber' | 'reject-electrical' | 'composite-splicing' | 'odf-rfid'>('instantiate-fiber');
  const [bddOutput, setBddOutput] = useState<{ status: 'idle' | 'running' | 'success' | 'failed'; log: string[]; json?: string }>({
    status: 'idle',
    log: []
  });

  const runBddSimulation = () => {
    setBddOutput({ status: 'running', log: ['Compiling ietf-nwi-passive-inventory.yang schema...', 'Checking YANG syntax on variables...'] });
    
    setTimeout(() => {
      switch (activeBddScenario) {
        case 'instantiate-fiber':
          setBddOutput({
            status: 'success',
            log: [
              'GIVEN: a newly deployed optical backbone cable exists physically in the field',
              'WHEN: the architect registers the cable in network inventory',
              'AND: sets cable-type = optical-fiber, fiber-type = G652D, attenuation = 45.2 dB',
              'THEN: optical traits are successfully stored and evaluated for DWDM loss margins.',
              'STATUS: Verification PASSED. Schema validation complete.'
            ],
            json: JSON.stringify({
              "ietf-nwi-passive-inventory:cable": {
                "id": "cable-tk-osa-backbone-01",
                "name": "Tokyo-Osaka Core High-Loss Trunk",
                "cable-type": "optical-fiber",
                "cable-role": "backbone",
                "length": 512000,
                "a-end": { "device-type": "active-device", "ne-ref": "node-TK1" },
                "z-end": { "device-type": "active-device", "ne-ref": "node-OS1" },
                "optical-cable": { "fiber-core-num": 192, "fiber-type": "G652D", "attenuation": 92.4 }
              }
            }, null, 2)
          });
          break;

        case 'reject-electrical':
          setBddOutput({
            status: 'success',
            log: [
              'GIVEN: a physical copper cable has cable-type set to coaxial-cable or electrical-cable',
              'WHEN: the parser or NOC engineer tries to inject optical properties like "fiber-core-num" or "fiber-type"',
              'THEN: YANG presence rule /with/ constraint blocks the mutation!',
              'STATUS: Transaction REJECTED. Validation rollback successfully prevented invalid attributes.'
            ],
            json: JSON.stringify({
              "transaction": "TX-11883",
              "action": "COMMIT_CABLE_ASSET",
              "status": "VALIDATION_FAILED",
              "error": {
                "tag": "data-invalid-under-yang-when-clause",
                "message": "/cable[id=\"cable-coax-feed-04\"]/optical-cable node is inactive because cable-type is coaxial-cable",
                "target-node": "optical-cable"
              }
            }, null, 2)
          });
          break;

        case 'composite-splicing':
          const currentSub = selectedCable?.childCables || [];
          if (currentSub.length < 2) {
            setBddOutput({
              status: 'failed',
              log: [
                'GIVEN: a composite logical cable is configured by splicing physical spans',
                `WHEN: validating the concatenation chain (current child elements: ${currentSub.length})`,
                'THEN: validator threw an exception! YANG constraint enforces "min-elements 2" for the child-cable list of composite runs.',
                'FIX: Choose "Aoyama-Otemachi Spliced Concatenated Fiber Ring" in Cables Registry list or splice at least two segmented cables.'
              ]
            });
          } else {
            setBddOutput({
              status: 'success',
              log: [
                'GIVEN: a composite fiber run with multiple registered physical child spans',
                `AND: the child-cable array satisfies 'min-elements 2' (configured: ${currentSub.length} spans)`,
                `WHEN: calculating total physical spans spliced individually: indexes ${currentSub.map(s => s.index).join(', ')}`,
                `THEN: NMDA config compiles and sums physical dimensions. Total length: ${selectedCable?.length} meters.`,
                'STATUS: Concat sequence holds reference integrity!'
              ],
              json: JSON.stringify({
                "composite-cable": {
                  "id": selectedCable?.id,
                  "total-length-meters": selectedCable?.length,
                  "child-cables": selectedCable?.childCables?.map(c => ({
                    "seq-index": c.index,
                    "referenced-cable-id": c.id,
                    "segment-length": c.length
                  }))
                }
              }, null, 2)
            });
          }
          break;

        case 'odf-rfid':
          setBddOutput({
            status: 'success',
            log: [
              'GIVEN: a physical Optical Distribution Frame panel mounted inside cabinet rack 4A',
              'WHEN: scanning or registering custom RFID tag RFID-ODF-TK-102 and geographic site references',
              'THEN: the system loads port classification matrices [input, output, service, p2mp-port] for end-to-end trace loops.',
              'STATUS: Geographic alignment verified.'
            ],
            json: JSON.stringify({
              "passive-device": {
                "id": "odf-tokyo-otemachi-01",
                "device-type": "ODF",
                "custom-tags": ["RFID-ODF-TK-102"],
                "location-ref": "room-301-rack-R9D",
                "ports-structure": {
                  "total-ports": 8,
                  "inputs": 2,
                  "outputs": 2,
                  "services": 2,
                  "multipoint-p2mp": 2
                }
              }
            }, null, 2)
          });
          break;
      }
    }, 600);
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto w-full text-left">
      
      {/* Visual Header without slop */}
      <div className="border-b border-border/80 pb-6">
        <span className="text-[10px] uppercase tracking-widest bg-emerald-600/15 text-emerald-400 font-mono px-2 py-0.5 rounded font-extrabold">
          ietf-nwi-passive-inventory
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-2">
          <Database className="w-6 h-6 text-emerald-500" />
          Passive Network Assets & Cables
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Digital engineering panel to trace non-powered physical assets (dark fibers, splice concatenation, patch components, ODF couplers) augmenting IETF topologies.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-zinc-950/40 p-1 rounded-xl border border-zinc-900 w-fit">
        <button
          onClick={() => setActiveTab('cables')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'cables' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          Cables & Spans (Feat 25, 26)
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'devices' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Passive Devices & ODF (Feat 27)
        </button>
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'sandbox' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Interactive BDD Sandbox
        </button>
      </div>

      {/* System alert banner */}
      {alert && (
        <div className={`p-4 border rounded-xl flex items-start gap-3 animate-slide-in font-mono text-xs ${
          alert.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {alert.type === 'error' ? (
            <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
          ) : (
            <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
          )}
          <div>
            <span className="font-extrabold uppercase">{alert.type}: </span>
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      {/* --- TAB 1: CABLES REGISTRY --- */}
      {activeTab === 'cables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* List and creation of cables */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-zinc-900 pb-3">
                <GitCommit className="w-4 h-4 text-emerald-500" />
                Physical Cable Records
              </h3>

              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                {cables.map(c => {
                  const isSelected = c.id === selectedCableId;
                  const isOptical = c.cableType === 'optical-fiber';
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCableId(c.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'bg-emerald-600/10 border-emerald-500 text-white' 
                          : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:bg-zinc-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-white truncate max-w-[150px]">{c.name || c.id}</span>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded font-bold">
                          {c.cableRole}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>Type: {c.cableType}</span>
                        <span>Length: {c.length} m</span>
                      </div>

                      {/* Display optical details if fiber */}
                      {isOptical && c.opticalCable && (
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-[9px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1 py-0.2 rounded">
                            {c.opticalCable.fiberType}
                          </span>
                          <span className="text-[9px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1 py-0.2 rounded">
                            {c.opticalCable.fiberCoreNum} Cores
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Registration Form (Feature 25 validation sandbox) */}
            <form onSubmit={handleRegisterCable} className="bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Plus className="w-4 h-4 text-emerald-500" />
                Register Physical Span
              </h3>

              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Cable Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cable-segment-Tokyo"
                    value={newCableId}
                    onChange={(e) => setNewCableId(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Alias/Tag Name</label>
                    <input
                      type="text"
                      placeholder="e.g. TK-SEG-4"
                      value={newCableAlias}
                      onChange={(e) => setNewCableAlias(e.target.value)}
                      className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Length (meters)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="meters"
                      value={newCableLength}
                      onChange={(e) => setNewCableLength(Number(e.target.value))}
                      className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Cable Class Type</label>
                    <select
                      value={newCableType}
                      onChange={(e) => setNewCableType(e.target.value as any)}
                      className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500 font-sans"
                    >
                      <option value="optical-fiber">optical-fiber</option>
                      <option value="electrical-cable">electrical-cable</option>
                      <option value="coaxial-cable">coaxial-cable</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Cable Routing Role</label>
                    <select
                      value={newCableRole}
                      onChange={(e) => setNewCableRole(e.target.value as any)}
                      className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500 font-sans"
                    >
                      <option value="backbone">backbone</option>
                      <option value="aggregation">aggregation</option>
                      <option value="access">access</option>
                      <option value="trunk">trunk</option>
                      <option value="distribution">distribution</option>
                      <option value="branch">branch</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Deployment Description</label>
                  <textarea
                    placeholder="Conduit layout parameters, depth, or path information..."
                    value={newCableDesc}
                    onChange={(e) => setNewCableDesc(e.target.value)}
                    rows={2}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500 font-sans resize-none"
                  />
                </div>

                {/* FEATURE 25 Optical Constraint container (Conditional styling) */}
                {newCableType === 'optical-fiber' ? (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl space-y-3 mt-1 animate-fade-in text-[11px]">
                    <div className="text-[9px] text-emerald-400 font-bold tracking-wider uppercase mb-1">
                      Optical Characteristics augmentations
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[9px] text-zinc-500 block">fiber-core-num (quantity)</label>
                        <input
                          type="number"
                          value={fiberCoreNum}
                          onChange={(e) => setFiberCoreNum(Number(e.target.value))}
                          className="bg-background/80 border border-zinc-800 rounded p-1.5 w-full text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 block">attenuation (estimated loss dB)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={attenuation}
                          onChange={(e) => setAttenuation(Number(e.target.value))}
                          className="bg-background/80 border border-zinc-800 rounded p-1.5 w-full text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 block">fiber-type (ITU conforming)</label>
                      <select
                        value={fiberType}
                        onChange={(e) => setFiberType(e.target.value as any)}
                        className="bg-background/80 border border-zinc-800 rounded p-1.5 w-full text-white"
                      >
                        {['G652A', 'G652B', 'G652C', 'G652D', 'G653', 'G654', 'G655', 'G656', 'G657A1', 'G657A2', 'G657B', 'other'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-950/50 p-2.5 border border-zinc-900 border-dashed rounded text-[11px] text-zinc-500 italic font-sans leading-relaxed">
                    Conditional Guard active: Optical characteristics are locked for electrical or coax cables as per YANG "when" constraint rules.
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-xs mt-2 text-center"
                >
                  Register Cable Entry
                </button>
              </div>
            </form>
          </div>

          {/* Detailed endpoints and splicing properties panel (Feature 26) */}
          <div className="lg:col-span-8 bg-zinc-950/10 border border-border/70 rounded-xl p-5 space-y-6">
            {selectedCable ? (
              <div className="space-y-6">
                
                {/* Title */}
                <div className="flex border-b border-zinc-900 pb-4 justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono">{selectedCable.name || selectedCable.id}</h3>
                    <span 
                      className="text-zinc-500 text-xs font-mono mt-0.5 cursor-pointer hover:underline hover:text-emerald-400"
                      onClick={() => onNavigate && onNavigate(selectedCable.id, 'link')}
                    >
                      ID: {selectedCable.id} | Class: {selectedCable.cableType}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded font-bold uppercase font-mono text-xs ${
                    selectedCable.cableRole === 'backbone' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    selectedCable.cableRole === 'trunk' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                    'bg-zinc-800 text-zinc-300'
                  }`}>
                    {selectedCable.cableRole}
                  </span>
                </div>

                {/* Grid describing connection ends (A-End & Z-End) for Feature 26 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* A-End Details */}
                  <div className="bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-zinc-500 font-mono text-[10px]">
                      <span className="font-extrabold uppercase text-emerald-400">Connection A-End</span>
                      <span>Type: {selectedCable.aEnd.deviceType}</span>
                    </div>

                    <div className="text-xs font-mono py-1.5 leading-relaxed font-semibold">
                      {selectedCable.aEnd.deviceType === 'active-device' ? (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-mono">active ne-ref:</span>
                            <span 
                              className="text-emerald-400 font-bold font-mono cursor-pointer hover:underline"
                              onClick={() => onNavigate && onNavigate(selectedCable.aEnd.neRef || '', 'device')}
                            >
                              {selectedCable.aEnd.neRef}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-mono">component-ref:</span>
                            <span 
                              className="text-blue-400 font-bold font-mono cursor-pointer hover:underline"
                              onClick={() => onNavigate && onNavigate((selectedCable.aEnd.neRef || '') + '/' + (selectedCable.aEnd.componentRef || 'chassis-root'), 'port')}
                            >
                              {selectedCable.aEnd.componentRef || 'chassis-root'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between border-b pb-1 border-zinc-900">
                          <span className="text-zinc-500 font-mono">passive device-id:</span>
                          <span 
                            className="text-amber-400 font-bold font-mono cursor-pointer hover:underline"
                            onClick={() => onNavigate && onNavigate(selectedCable.aEnd.deviceId || '', 'device')}
                          >
                            {selectedCable.aEnd.deviceId}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEndToConfigure('aEnd');
                        setConnDeviceType(selectedCable.aEnd.deviceType);
                        setConnActiveNe(selectedCable.aEnd.neRef || 'node-TK1');
                        setConnComponent(selectedCable.aEnd.componentRef || '');
                        setConnPassiveDevice(selectedCable.aEnd.deviceId || '');
                      }}
                      className="text-[10px] text-emerald-400 hover:underline font-mono mt-2 block"
                    >
                      Modify A-End
                    </button>
                  </div>

                  {/* Z-End Details */}
                  <div className="bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-zinc-500 font-mono text-[10px]">
                      <span className="font-extrabold uppercase text-indigo-400">Connection Z-End</span>
                      <span>Type: {selectedCable.zEnd.deviceType}</span>
                    </div>

                    <div className="text-xs font-mono py-1.5 leading-relaxed font-semibold">
                      {selectedCable.zEnd.deviceType === 'active-device' ? (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-mono">active ne-ref:</span>
                            <span 
                              className="text-indigo-400 font-bold font-mono cursor-pointer hover:underline"
                              onClick={() => onNavigate && onNavigate(selectedCable.zEnd.neRef || '', 'device')}
                            >
                              {selectedCable.zEnd.neRef}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500 font-mono">component-ref:</span>
                            <span 
                              className="text-blue-400 font-bold font-mono cursor-pointer hover:underline"
                              onClick={() => onNavigate && onNavigate((selectedCable.zEnd.neRef || '') + '/' + (selectedCable.zEnd.componentRef || 'chassis-root'), 'port')}
                            >
                              {selectedCable.zEnd.componentRef || 'chassis-root'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between border-b pb-1 border-zinc-900">
                          <span className="text-zinc-500 font-mono">passive device-id:</span>
                          <span 
                            className="text-amber-400 font-bold font-mono cursor-pointer hover:underline"
                            onClick={() => onNavigate && onNavigate(selectedCable.zEnd.deviceId || '', 'device')}
                          >
                            {selectedCable.zEnd.deviceId}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEndToConfigure('zEnd');
                        setConnDeviceType(selectedCable.zEnd.deviceType);
                        setConnActiveNe(selectedCable.zEnd.neRef || 'node-TK1');
                        setConnComponent(selectedCable.zEnd.componentRef || '');
                        setConnPassiveDevice(selectedCable.zEnd.deviceId || '');
                      }}
                      className="text-[10px] text-indigo-400 hover:underline font-mono mt-2 block"
                    >
                      Modify Z-End
                    </button>
                  </div>
                </div>

                {/* Symmetrical update Form for selected connection ends */}
                <form onSubmit={handleUpdateEndConnection} className="bg-background/20 p-4.5 border border-zinc-900 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-bold text-white font-mono">
                      Modify Cable End: <span className="uppercase text-emerald-400">{endToConfigure}</span>
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">YANG: connected-device-type</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Endpoint Device Class</label>
                      <select
                        value={connDeviceType}
                        onChange={(e) => setConnDeviceType(e.target.value as any)}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none"
                      >
                        <option value="active-device">active-device</option>
                        <option value="passive-device">passive-device</option>
                      </select>
                    </div>

                    {connDeviceType === 'active-device' ? (
                      <>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase block mb-1">active ne-ref</label>
                          <select
                            value={connActiveNe}
                            onChange={(e) => setConnActiveNe(e.target.value)}
                            className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none font-sans"
                          >
                            {topology.nodes.map(n => (
                              <option key={n.uuid} value={n.uuid}>{n.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase block mb-1">component-ref</label>
                          <input
                            type="text"
                            placeholder="e.g. transceiver-A"
                            value={connComponent}
                            onChange={(e) => setConnComponent(e.target.value)}
                            className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="md:col-span-2">
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">passive device-id</label>
                        <select
                          value={connPassiveDevice}
                          onChange={(e) => setConnPassiveDevice(e.target.value)}
                          className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none font-sans"
                        >
                          <option value="">-- Choose passive box --</option>
                          {devices.map(d => (
                            <option key={d.id} value={d.id}>{d.name || d.id} ({d.deviceType})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-xs"
                    >
                      Save End Connection
                    </button>
                  </div>
                </form>

                {/* FEATURE 2 child-cable concatenation splicing editor */}
                <div className="bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl space-y-4">
                  <div className="flex border-b border-zinc-900 pb-2.5 justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <Shuffle className="w-4 h-4 text-emerald-400" />
                        Splice Concatenation chain
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Order sequence of multiple child cables spliced into this composite cable run.</p>
                    </div>

                    <span className="font-mono text-[9px] bg-zinc-800 text-zinc-400 px-1.5 rounded">
                      YANG: child-cable [min-elements 2]
                    </span>
                  </div>

                  {selectedCable.childCables && selectedCable.childCables.length > 0 ? (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="text-[10px] uppercase text-zinc-500 tracking-wider font-extrabold">Active Splices Order</div>
                      
                      <div className="space-y-2">
                        {selectedCable.childCables.map((child) => {
                          const refCable = cables.find(c => c.id === child.id);
                          return (
                            <div key={child.id} className="flex justify-between items-center p-2.5 rounded bg-zinc-900/60 border border-zinc-850">
                              <div className="flex items-center gap-3">
                                <span className="bg-emerald-600/10 text-emerald-400 font-extrabold w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                                  {child.index}
                                </span>
                                <div>
                                  <div 
                                    className="text-white font-bold text-xs truncate max-w-[250px] cursor-pointer hover:underline hover:text-emerald-400"
                                    onClick={() => onNavigate && onNavigate(child.id, 'link')}
                                  >
                                    {refCable?.name || child.id}
                                  </div>
                                  <div 
                                    className="text-[10px] text-zinc-500 cursor-pointer hover:underline hover:text-emerald-400"
                                    onClick={() => onNavigate && onNavigate(child.id, 'link')}
                                  >
                                    Ref ID: {child.id}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <span className="text-zinc-300 font-bold">{child.length} meters</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChildSegment(child.id)}
                                  className="text-zinc-650 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded transition-all"
                                  title="Delete segment link"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {selectedCable.childCables.length < 2 && (
                        <div className="p-3 bg-rose-500/5 text-rose-400 border border-rose-500/20 text-[11px] rounded flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>YANG warning: Composite cables require at least 2 child segments configured (min-elements 2). Add more segments below.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-500 flex flex-col items-center gap-1.5 font-sans border border-dashed border-zinc-850 rounded-xl">
                      <Shuffle className="w-7 h-7 text-zinc-700" />
                      <span className="text-xs font-semibold text-zinc-400">Single Physical Span Run</span>
                      <p className="text-[11px] text-zinc-600 max-w-sm">This cable does not currently consolidate multiple segments. Splice child cables below to generate a composite concatenated trunk.</p>
                    </div>
                  )}

                  {/* Add child segment forms */}
                  <form onSubmit={handleAddChildSegment} className="bg-background/10 p-4 border border-zinc-900 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Select Child Cable Span</label>
                      <select
                        value={childCableIdInput}
                        onChange={(e) => setChildCableIdInput(e.target.value)}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none font-sans"
                      >
                        <option value="">-- Choose Segment --</option>
                        {cables.map(c => (
                          <option key={c.id} value={c.id}>{c.name || c.id} ({c.cableRole})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Segment length (m)</label>
                      <input
                        type="number"
                        min="1"
                        value={childLengthInput}
                        onChange={(e) => setChildLengthInput(Number(e.target.value))}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs"
                    >
                      Splice segment
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 font-mono text-zinc-500 flex flex-col items-center gap-2">
                <Info className="w-8 h-8 text-zinc-600" />
                Select a physical cable from the registry to inspect or splice.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: PASSIVE DEVICES AND ODF PORTS --- */}
      {activeTab === 'devices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* List and Creation of Passive Units */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Layers className="w-4 h-4 text-emerald-500" />
                Passive Equipment Cabinets
              </h3>

              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                {devices.map(d => {
                  const isSelected = d.id === selectedDeviceId;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDeviceId(d.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'bg-emerald-600/10 border-emerald-500 text-white' 
                          : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:bg-zinc-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-white truncate max-w-[150px]">{d.name || d.id}</span>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded font-bold">
                          {d.deviceType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>Ports inside: {d.passivePorts?.length || 0}</span>
                        <span className="truncate max-w-[120px]">Loc: {d.locationRef || 'N/A'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Creation Form (Feature 27 RFID Barcode mapping) */}
            <form onSubmit={handleRegisterDevice} className="bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Plus className="w-4 h-4 text-emerald-500" />
                Mount Passive Hardware Box
              </h3>

              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Equipment Box ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. odf-sub-floor-2"
                    value={newDevId}
                    onChange={(e) => setNewDevId(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase block mb-1">Label Name</label>
                  <input
                    type="text"
                    placeholder="e.g. ODF Frame Floor 2"
                    value={newDevName}
                    onChange={(e) => setNewDevName(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Device Type</label>
                    <select
                      value={newDevType}
                      onChange={(e) => setNewDevType(e.target.value as any)}
                      className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500 font-sans"
                    >
                      <option value="ODF">ODF (Optical frame)</option>
                      <option value="WDM">WDM (Wavelength coupler)</option>
                      <option value="FAT">FAT (Fiber access node)</option>
                      <option value="FDT">FDT (Distribution terminal)</option>
                      <option value="ATB">ATB (Access terminal box)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1">Geographic Location Ref</label>
                    <input
                      type="text"
                      placeholder="e.g. rack-K3"
                      value={newDevLocation}
                      onChange={(e) => setNewDevLocation(e.target.value)}
                      className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* RFID, barcode, custom tags list builder */}
                <div className="space-y-1.5 bg-background/25 p-3 rounded-lg border border-zinc-900">
                  <label className="text-[9px] text-zinc-500 uppercase block">Tracking QR / RFID Tags (custom-tags)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. RFID-9321"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="bg-background border border-border rounded p-1 w-full text-xs text-white outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1 rounded text-xs select-none"
                    >
                      Add
                    </button>
                  </div>

                  {tagsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tagsList.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-805 text-zinc-300 border border-zinc-800">
                          <Tag className="w-2.5 h-2.5 shrink-0" />
                          <span>{t}</span>
                          <button type="button" onClick={() => handleRemoveTag(t)} className="text-red-400 hover:text-red-300 ml-0.5">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-xs mt-2 text-center"
                >
                  Mount Passive Box
                </button>
              </div>
            </form>
          </div>

          {/* ODF frame detailed patch ports table (Feature 27) */}
          <div className="lg:col-span-8 bg-zinc-950/10 border border-border/70 rounded-xl p-5 space-y-6">
            {selectedDevice ? (
              <div className="space-y-6">
                
                {/* Title */}
                <div className="flex border-b border-zinc-900 pb-4 justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono">{selectedDevice.name || selectedDevice.id}</h3>
                    <span 
                      className="text-zinc-500 text-xs font-mono mt-0.5 cursor-pointer hover:underline hover:text-emerald-400 block"
                      onClick={() => onNavigate && onNavigate(selectedDevice.id, 'device')}
                    >
                      ID: {selectedDevice.id} | ClassType: {selectedDevice.deviceType}
                    </span>
                  </div>
                  
                  {selectedDevice.locationRef && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold font-sans">
                      <MapPin className="w-3.5 h-3.5" />
                      Location: {selectedDevice.locationRef}
                    </span>
                  )}
                </div>

                {/* RFID tags row */}
                {selectedDevice.customTags && selectedDevice.customTags.length > 0 && (
                  <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                    <span className="font-bold">Scanned RFID Tracking:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedDevice.customTags.map(t => (
                        <span key={t} className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-white">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ports list container (Feature 27 inputs outputs service ports) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      Passive Interface Slots & Ports
                    </h4>
                    <span className="font-mono text-[9px] bg-zinc-800 text-zinc-400 px-1.5 rounded">
                      YANG: passive-port (list)
                    </span>
                  </div>

                  {selectedDevice.passivePorts && selectedDevice.passivePorts.length > 0 ? (
                    <div className="border border-zinc-900 rounded-xl overflow-hidden text-xs font-mono text-left">
                      <div className="grid grid-cols-12 gap-2 bg-zinc-950 p-2.5 text-zinc-500 font-extrabold uppercase text-[10px]">
                        <div className="col-span-4">Port ID / Label</div>
                        <div className="col-span-4">Port Type classifier</div>
                        <div className="col-span-3">Linked Core Number</div>
                        <div className="col-span-1 text-right">Action</div>
                      </div>

                      <div className="divide-y divide-zinc-950">
                        {selectedDevice.passivePorts.map((port) => (
                          <div key={port.id} className="grid grid-cols-12 gap-2 p-2.5 items-center bg-zinc-900/10 hover:bg-zinc-900/30">
                            <div className="col-span-4 font-bold text-white">{port.id}</div>
                            <div className="col-span-4 self-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                port.portType === 'input-port' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                port.portType === 'output-port' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                port.portType === 'service-port' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                              }`}>
                                {port.portType}
                              </span>
                            </div>
                            <div className="col-span-3 text-zinc-400">
                              {port.fiberCoreNum ? `Core #${port.fiberCoreNum}` : 'Not Spliced'}
                            </div>
                            <div className="col-span-1 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeletePassivePort(port.id)}
                                className="text-zinc-600 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10"
                                title="Delete passive port"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 font-sans border border-dashed border-zinc-850 text-zinc-500 rounded-xl leading-relaxed">
                      <Sliders className="w-7 h-7 text-zinc-700 mx-auto mb-1.5" />
                      Passive patch container has no ports defined in schema.
                      <p className="text-[11px] text-zinc-650">Add input/output or multiplexed splitting ports using the form below.</p>
                    </div>
                  )}

                  {/* Add passive port Form */}
                  <form onSubmit={handleAddPassivePort} className="bg-background/20 p-4 border border-zinc-900 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Port identifier *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ingress-1"
                        value={passivePortId}
                        onChange={(e) => setPassivePortId(e.target.value)}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Port Service Type</label>
                      <select
                        value={passivePortType}
                        onChange={(e) => setPassivePortType(e.target.value as any)}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500 font-sans"
                      >
                        <option value="service-port">service-port (Active coupling)</option>
                        <option value="input-port">input-port (ODF Splitter In)</option>
                        <option value="output-port">output-port (ODF Splitter Out)</option>
                        <option value="p2mp-port">p2mp-port (Point-to-Multipoint)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase block mb-1">Linked Fiber Core #</label>
                      <input
                        type="number"
                        placeholder="e.g. 1"
                        value={portCoreNum}
                        onChange={(e) => setPortCoreNum(e.target.value === '' ? '' : Number(e.target.value))}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs"
                    >
                      Provision Port
                    </button>
                  </form>

                </div>

              </div>
            ) : (
              <div className="text-center py-20 font-mono text-zinc-500 flex flex-col items-center gap-2">
                <Info className="w-8 h-8 text-zinc-600" />
                Select a passive cabinet panel to view its patch layouts and fiber couplers.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: CONFORMANCE LABORATORY --- */}
      {activeTab === 'sandbox' && (
        <div className="bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-6">
          <div className="border-b border-zinc-900 pb-3 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Underlay Compliance Laboratory (Epic 6)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Execute formal schema evaluations mapping physical cables, child sequences and passive hardware.
              </p>
            </div>
            <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded">
              YANG Conformance Tests
            </span>
          </div>

          {/* Sub scenarios switcher */}
          <div className="flex border-b border-zinc-900 text-xs font-mono flex-wrap">
            <button
              onClick={() => setActiveBddScenario('instantiate-fiber')}
              className={`pb-2.5 px-4 font-semibold uppercase transition-all border-b-2 ${
                activeBddScenario === 'instantiate-fiber' ? 'border-emerald-500 text-emerald-400 font-black' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              US-24 (Fiber Registration)
            </button>
            <button
              onClick={() => setActiveBddScenario('reject-electrical')}
              className={`pb-2.5 px-4 font-semibold uppercase transition-all border-b-2 ${
                activeBddScenario === 'reject-electrical' ? 'border-emerald-500 text-emerald-400 font-black' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              US-24 (Guard Electrical Check)
            </button>
            <button
              onClick={() => setActiveBddScenario('composite-splicing')}
              className={`pb-2.5 px-4 font-semibold uppercase transition-all border-b-2 ${
                activeBddScenario === 'composite-splicing' ? 'border-emerald-500 text-emerald-400 font-black' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              UC-11 (Concatenation chain)
            </button>
            <button
              onClick={() => setActiveBddScenario('odf-rfid')}
              className={`pb-2.5 px-4 font-semibold uppercase transition-all border-b-2 ${
                activeBddScenario === 'odf-rfid' ? 'border-emerald-500 text-emerald-400 font-black' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              US-25 (ODF mount & RFID)
            </button>
          </div>

          <div className="bg-zinc-900/40 p-4.5 rounded-xl border border-zinc-850/60 flex flex-col md:flex-row gap-6 md:items-center justify-between text-xs font-mono">
            <div className="space-y-1">
              <p className="font-bold text-white text-sm">
                {activeBddScenario === 'instantiate-fiber' && 'Scenario 1: Instantiation of optical assets with ITU types (G.652D)'}
                {activeBddScenario === 'reject-electrical' && 'Scenario 2: Reject optical characteristics on electrical-cables (when block)'}
                {activeBddScenario === 'composite-splicing' && 'Scenario 3: Validate composite logical run concatenations (min-elements 2)'}
                {activeBddScenario === 'odf-rfid' && 'Scenario 4: Register patch ODF mounted units with RFID tracking tags'}
              </p>
              <p className="text-zinc-500">
                {activeBddScenario === 'instantiate-fiber' && 'Asserts ietf-nwi-passive-inventory G.652D core attenuation profiles database ingest.'}
                {activeBddScenario === 'reject-electrical' && 'Asserts model schema validation guarding attributes consistency. Prevents fiber attributes on coaxial.'}
                {activeBddScenario === 'composite-splicing' && 'Calculates composite sequence lengths and blocks short splice lists.'}
                {activeBddScenario === 'odf-rfid' && 'Correlates cabinet site references using ni-location and custom barcode indices.'}
              </p>
            </div>

            <button
              onClick={runBddSimulation}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-mono tracking-wider font-extrabold uppercase shrink-0 transition-all text-xs"
            >
              Evaluate Scenario
            </button>
          </div>

          {/* Test results console log & payload JSON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            
            {/* Terminal logs */}
            <div className="bg-black/80 rounded-xl border border-zinc-900 p-4 space-y-3">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-1.5 flex justify-between items-center">
                <span>JUnit Console Log</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-2 min-h-[160px] text-zinc-400 select-none">
                {bddOutput.log.length > 0 ? (
                  bddOutput.log.map((line, i) => {
                    const isSuccess = line.startsWith('STATUS: Verification PASSED') || line.startsWith('THEN: ') || line.startsWith('STATUS: Concat') || line.startsWith('STATUS: Geographic');
                    const isFailed = line.startsWith('error') || line.startsWith('THEN: validation error!') || line.startsWith('FIX: ') || line.startsWith('THEN: validator threw an exception!');
                    return (
                      <p key={i} className={`leading-relaxed text-[11px] ${
                        isSuccess ? 'text-emerald-400 text-xs font-bold' : 
                        isFailed ? 'text-red-400 text-xs font-bold' : 
                        line.startsWith('GIVEN:') ? 'text-white' : 'text-zinc-500'
                      }`}>
                        {line.startsWith('Compiling') || line.startsWith('Checking') ? '⚙️' : i >= 2 ? '⚡' : '●'} {line}
                      </p>
                    );
                  })
                ) : (
                  <div className="text-zinc-650 italic text-center py-12">
                    Click "Evaluate Scenario" to spin up the underlay physical engine tests.
                  </div>
                )}
              </div>
            </div>

            {/* Generated JSON Conforming draft */}
            <div className="bg-black/80 rounded-xl border border-zinc-900 p-4 space-y-3">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-900 pb-1.5">
                /ietf-nwi-passive-inventory:passive-inventory NMDA Datastore State
              </div>

              <pre className="max-h-[180px] overflow-y-auto pr-1 text-zinc-300 font-mono text-[11px] leading-relaxed">
                {bddOutput.json ? bddOutput.json : (
                  <span className="text-zinc-650 italic block text-center py-12">No evaluation payload compiled yet.</span>
                )}
              </pre>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
