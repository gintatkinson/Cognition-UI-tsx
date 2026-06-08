import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Layers, 
  Home, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Zap, 
  Grid, 
  Cpu, 
  Sliders, 
  Bookmark, 
  ChevronRight, 
  RotateCcw,
  Maximize2,
  Calendar,
  Compass,
  FileText
} from 'lucide-react';
import { NetworkService } from '../../services/networkService';
import { NetworkElement, HardwareComponent } from '../../types';

// Types inside Epic 3: Network Inventory Location
export interface LocationEntry {
  id: string; // Unique Identifier
  type: string; // custom location type: Site, Room, Building, etc
  parent?: string; // id reference to other containing location
  timestamp: string; // recorded date-and-time (ISO format)
  validUntil: string; // validation expiration date (ISO format)
  
  // Feature 12 Address
  address?: string;
  postalCode?: string;
  state?: string;
  city?: string;
  countryCode?: string; // ISO 3166-1 Alpha-2 uppercase two-letter
}

export interface DirectChassis {
  chassisId: number;
  neRef: string; // network element UUID
  componentRef: string; // component UUID
}

export interface RackEntry {
  id: string;
  rackClass: 'rack-standard' | 'rack-secure-baseline' | 'rack-secure-medium' | 'rack-secure-high';
  height: number; // millimetres
  width: number; // millimetres
  depth: number; // millimetres
  timestamp: string;
  validUntil: string;
  
  // Feature 15 Location & coordinates
  locationRef: string; // valid location ID
  rowNumber: number;
  columnNumber: number;

  // Feature 16 electricity
  maxVoltage: number; // Volts
  maxAllocatedPower: number; // Watts
  containedChassis: {
    relativePosition: number; // relative U-slot number
    neRef: string;
    componentRef: string;
    powerAllocated: number; // Watts
  }[];
}

// Automatically build comprehensive hierarchical locations, racks, cards and ports directories for all topology nodes
function buildInitialDataset(nodes: any[]): { locations: LocationEntry[], racks: RackEntry[], directChassis: DirectChassis[] } {
  const locationsMap = new Map<string, LocationEntry>();
  const racksList: RackEntry[] = [];
  const directChassisList: DirectChassis[] = [];

  // Seed regional high-level centers for hierarchical validation checks
  locationsMap.set("loc-tokyo-hq", {
    id: "loc-tokyo-hq",
    type: "Site",
    timestamp: "2026-06-01T08:00:00Z",
    validUntil: "2027-06-01T08:00:00Z",
    address: "1-1 Chiyoda",
    postalCode: "100-0001",
    state: "Tokyo",
    city: "Chiyoda-ku",
    countryCode: "JP"
  });

  locationsMap.set("loc-munich-hq", {
    id: "loc-munich-hq",
    type: "Site",
    timestamp: "2026-06-01T08:00:00Z",
    validUntil: "2027-06-01T08:00:00Z",
    address: "Munich Technical Park",
    postalCode: "80331",
    state: "Bayern",
    city: "Munich",
    countryCode: "DE"
  });

  locationsMap.set("loc-osaka-hub", {
    id: "loc-osaka-hub",
    type: "Site",
    timestamp: "2026-06-01T08:00:00Z",
    validUntil: "2027-06-01T08:00:00Z",
    address: "2-4 Umeda, Kita-ku",
    postalCode: "530-0001",
    state: "Osaka",
    city: "Osaka-shi",
    countryCode: "JP"
  });

  // Iteratively map every single network element
  nodes.forEach((node, index) => {
    // Generate normalized ID for the parent facility
    const safeLocName = (node.location || "Default Location").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const facilityId = `facility-${node.uuid.toLowerCase()}`;
    
    // Geographical address parser rules
    let countryCode = "JP";
    let state = "Tokyo";
    let city = "Tokyo";
    let address = node.location || "NTT Exchange Floor";
    let postalCode = "100-0004";
    let parentRegion = "loc-tokyo-hq";

    if (address.toLowerCase().includes("frankfurt") || node.ietfSystem?.contact?.includes("de") || address.toLowerCase().includes("fra")) {
      countryCode = "DE";
      state = "Hessen";
      city = "Frankfurt";
      postalCode = "60311";
      parentRegion = "loc-munich-hq";
    } else if (address.toLowerCase().includes("munich") || address.toLowerCase().includes("mun")) {
      countryCode = "DE";
      state = "Bayern";
      city = "Munich";
      postalCode = "80331";
      parentRegion = "loc-munich-hq";
    } else if (address.toLowerCase().includes("berlin") || address.toLowerCase().includes("ber")) {
      countryCode = "DE";
      state = "Berlin";
      city = "Berlin";
      postalCode = "10115";
      parentRegion = "loc-munich-hq";
    } else if (address.toLowerCase().includes("osaka") || node.name.toLowerCase().includes("os") || address.toLowerCase().includes("umeda")) {
      countryCode = "JP";
      state = "Osaka";
      city = "Osaka-shi";
      postalCode = "530-0001";
      parentRegion = "loc-osaka-hub";
    } else if (address.toLowerCase().includes("fuji")) {
      countryCode = "JP";
      state = "Yamanashi";
      city = "Fujiyoshida";
      postalCode = "403-0005";
      parentRegion = "loc-tokyo-hq";
    }

    // Parse specific street/facility descriptor if available in ietfSystem
    if (node.ietfSystem?.location) {
      address = node.ietfSystem.location;
    }

    // 1. Facility level containment node
    locationsMap.set(facilityId, {
      id: facilityId,
      type: "Data Center",
      parent: parentRegion,
      timestamp: "2026-06-01T08:00:00Z",
      validUntil: "2028-06-01T08:00:00Z",
      address: address,
      postalCode: postalCode,
      state: state,
      city: city,
      countryCode: countryCode
    });

    // 2. Specific room level containment node
    const roomId = `room-${node.uuid.toLowerCase()}`;
    locationsMap.set(roomId, {
      id: roomId,
      type: "Equipment Room",
      parent: facilityId,
      timestamp: "2026-06-01T09:00:00Z",
      validUntil: "2028-06-01T09:00:00Z",
      address: `Zone A, Cabinet Suite Row ${4 + (index % 4)}`,
      postalCode: postalCode,
      state: state,
      city: city,
      countryCode: countryCode
    });

    // Find custom Chassis identifier in node.hardware
    const chassisComp = node.hardware?.find((h: any) => h.class === "chassis") || 
                        node.hardware?.find((h: any) => h.class === "enclosure") ||
                        node.hardware?.[0];
    const chassisUuid = chassisComp ? chassisComp.uuid : `ch-${node.uuid}`;

    // Select suitable electric variables & hardware class metrics
    let powerAllocated = 850;
    let voltage = 220;
    let rackClass: any = "rack-secure-baseline";

    if (node.type === "OPTICAL_SWITCH" || node.layer?.includes("L0")) {
      powerAllocated = 1400; // 1.4 kW for coherent optics
      voltage = 230;
      rackClass = "rack-secure-high";
    } else if (node.type === "ROUTER") {
      powerAllocated = 1800; // heavy line-cards
      voltage = 220;
      rackClass = "rack-secure-medium";
    } else if (node.type === "QKD_NODE") {
      powerAllocated = 450;
      voltage = 110;
      rackClass = "rack-secure-high";
    }

    // Unique coordinates inside grid room map
    const row = 1 + (index % 6);
    const col = 2 + (index % 8);

    // 3. Create a Telecom Rack for this element containing its main chassis
    const rackId = `rack-${node.uuid.toLowerCase()}`;
    racksList.push({
      id: rackId,
      rackClass: rackClass,
      height: 2200, // height in mm
      width: 600,
      depth: 1000,
      timestamp: "2026-06-01T10:00:00Z",
      validUntil: "2028-06-01T10:00:00Z",
      locationRef: roomId,
      rowNumber: row,
      columnNumber: col,
      maxVoltage: voltage,
      maxAllocatedPower: 6000, // 6kW Max
      containedChassis: [
        {
          relativePosition: 6 + (index % 4), // slots 6, 7, 8, 9
          neRef: node.uuid,
          componentRef: chassisUuid,
          powerAllocated: powerAllocated
        }
      ]
    });

    // If there are auxiliary physical items, we can set up direct-chassis references
    if (index % 3 === 2) {
      directChassisList.push({
        chassisId: 550000 + index * 1333,
        neRef: node.uuid,
        componentRef: chassisUuid
      });
    }
  });

  return {
    locations: Array.from(locationsMap.values()),
    racks: racksList,
    directChassis: directChassisList
  };
}

export function NetworkLocationsView({ onNavigate }: { onNavigate?: (id: string, type: any) => void }) {
  const networkService = NetworkService.getInstance();
  const nodes = networkService.getTopology().nodes;

  // Pre-generate complete list of assets based on actual nodes (Feature 11 to 16)
  const initialSet = useMemo(() => buildInitialDataset(nodes), [nodes]);

  // State maps
  const [locations, setLocations] = useState<LocationEntry[]>(() => initialSet.locations);
  const [directChassis, setDirectChassis] = useState<DirectChassis[]>(() => initialSet.directChassis);
  const [racks, setRacks] = useState<RackEntry[]>(() => initialSet.racks);

  // Active sub-views
  const [subView, setSubView] = useState<'hierarchy' | 'racks' | 'direct-chassis'>('hierarchy');

  // Interactive Form States
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [locForm, setLocForm] = useState({
    id: '',
    type: 'Site',
    parent: '',
    timestamp: new Date().toISOString(),
    validUntil: new Date(Date.now() + 31536000000).toISOString(),
    address: '',
    postalCode: '',
    state: '',
    city: '',
    countryCode: 'JP'
  });

  const [rackForm, setRackForm] = useState({
    id: '',
    rackClass: 'rack-secure-baseline' as any,
    height: 2000,
    width: 600,
    depth: 1000,
    locationRef: 'loc-tokyo-room-01',
    rowNumber: 1,
    columnNumber: 1,
    maxVoltage: 235,
    maxAllocatedPower: 4000,
    timestamp: new Date().toISOString(),
    validUntil: new Date(Date.now() + 31536000000).toISOString()
  });

  const [directForm, setDirectForm] = useState({
    chassisId: 100000 + Math.floor(Math.random() * 800000),
    neRef: 'd3',
    componentRef: 'h1_d3'
  });

  // Chassis mounting (Feature 16 slots & power) Form State for Racks
  const [selectedRackId, setSelectedRackId] = useState<string>(() => racks[0]?.id || 'rack-b12');
  const [mountForm, setMountForm] = useState({
    relativePosition: 1,
    neRef: 'd3',
    componentRef: 'h1_d3',
    powerAllocated: 500
  });

  // Selected Network Element for Card and Port physical hardware blueprint explorer (Epic 3)
  const [selectedNeForExplorer, setSelectedNeForExplorer] = useState<string | null>(() => nodes[0]?.uuid || null);
  const explorerNode = useMemo(() => {
    return nodes.find(n => n.uuid === selectedNeForExplorer) || nodes[0];
  }, [selectedNeForExplorer, nodes]);

  // Error & Status Indicators
  const [locError, setLocError] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [rackError, setRackError] = useState<string | null>(null);
  const [mountError, setMountError] = useState<string | null>(null);

  // Dynamic filter lists for chassis parts
  const selectedNeComponents = useMemo(() => {
    const targetNe = nodes.find(n => n.uuid === directForm.neRef);
    return targetNe ? targetNe.hardware : [];
  }, [directForm.neRef, nodes]);

  const selectedRackMountNeComponents = useMemo(() => {
    const targetNe = nodes.find(n => n.uuid === mountForm.neRef);
    return targetNe ? targetNe.hardware : [];
  }, [mountForm.neRef, nodes]);

  // Recursively trace ancestors to detect circular parent dependency loops (Scenario 1 loop checkers)
  const isCircularParent = (childId: string, candidateParentId: string): boolean => {
    if (!candidateParentId) return false;
    if (candidateParentId === childId) return true;
    
    let current = locations.find(loc => loc.id === candidateParentId);
    while (current && current.parent) {
      if (current.parent === childId) {
        return true;
      }
      current = locations.find(loc => loc.id === current.parent);
    }
    return false;
  };

  // Check Expiry of a location (Scenario 2 temporal expiry)
  const isLocationExpired = (loc: LocationEntry): boolean => {
    try {
      const exp = new Date(loc.validUntil);
      return exp.getTime() < Date.now();
    } catch {
      return false;
    }
  };

  // Handle Location Submit/Add
  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocError(null);
    setAppStatus(null);

    const trimmedId = locForm.id.trim();
    if (!trimmedId) {
      setLocError("Location ID is mandatory.");
      return;
    }

    // Verify ISO 31661-1 Alpha 2 code: Uppercase two letters
    const ccRegex = /^[A-Z]{2}$/;
    if (locForm.countryCode && !ccRegex.test(locForm.countryCode)) {
      setLocError("Country Code validation failed. Must fit ISO 3166-1 Alpha-2 uppercase 2-letter pattern (e.g. JP, US).");
      return;
    }

    // Circular containment prevention path check
    if (locForm.parent) {
      const isLoop = isCircularParent(trimmedId, locForm.parent);
      if (isLoop) {
        setLocError(`Circular containment detected: Cannot assign parent '${locForm.parent}' because it resides nested under '${trimmedId}'.`);
        return;
      }
    }

    const newLoc: LocationEntry = {
      id: trimmedId,
      type: locForm.type,
      parent: locForm.parent || undefined,
      timestamp: locForm.timestamp,
      validUntil: locForm.validUntil,
      address: locForm.address || undefined,
      postalCode: locForm.postalCode || undefined,
      state: locForm.state || undefined,
      city: locForm.city || undefined,
      countryCode: locForm.countryCode || undefined
    };

    // If editing or existing
    const exists = locations.some(l => l.id === trimmedId);
    if (exists) {
      setLocations(prev => prev.map(l => l.id === trimmedId ? newLoc : l));
      setAppStatus({ type: 'success', message: "Location modified and committed successfully." });
    } else {
      setLocations(prev => [...prev, newLoc]);
      setAppStatus({ type: 'success', message: "New hierarchical location registered into index database." });
    }

    // Reset Form
    setLocForm({
      id: '',
      type: 'Site',
      parent: '',
      timestamp: new Date().toISOString(),
      validUntil: new Date(Date.now() + 31536000000).toISOString(),
      address: '',
      postalCode: '',
      state: '',
      city: '',
      countryCode: 'JP'
    });
    setEditingLocId(null);
  };

  const handleEditLocation = (loc: LocationEntry) => {
    setEditingLocId(loc.id);
    setLocForm({
      id: loc.id,
      type: loc.type,
      parent: loc.parent || '',
      timestamp: loc.timestamp,
      validUntil: loc.validUntil,
      address: loc.address || '',
      postalCode: loc.postalCode || '',
      state: loc.state || '',
      city: loc.city || '',
      countryCode: loc.countryCode || 'JP'
    });
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    setAppStatus({ type: 'success', message: `Location '${id}' dropped from indexes.` });
  };

  // Handle direct location-contained chassis mapping
  const handleDirectChassisSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppStatus(null);

    // Relational Co-dependency checks: confirm core details are set
    if (!directForm.componentRef) {
      setAppStatus({ type: 'error', message: 'No physical component selected.' });
      return;
    }

    const newDirect: DirectChassis = {
      chassisId: directForm.chassisId,
      neRef: directForm.neRef,
      componentRef: directForm.componentRef
    };

    setDirectChassis(prev => [newDirect, ...prev]);
    setAppStatus({ type: 'success', message: `Contained-Chassis ${directForm.chassisId} successfully declared at location.` });
    
    // Regenerate ID
    setDirectForm(prev => ({
      ...prev,
      chassisId: 100000 + Math.floor(Math.random() * 800000)
    }));
  };

  // RACK CRUD / Dimension Validators
  const handleRackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRackError(null);
    setAppStatus(null);

    const rackIdTrimmed = rackForm.id.trim();
    if (!rackIdTrimmed) {
      setRackError("Rack unique ID is required.");
      return;
    }

    // Millimeter size restraints: must be positive positive non-zero integers
    if (rackForm.height <= 0 || rackForm.width <= 0 || rackForm.depth <= 0) {
      setRackError("Invalid Physical Dimension constraints. Height, width, and depth must be positive non-zero integers (mm).");
      return;
    }

    const newRack: RackEntry = {
      id: rackIdTrimmed,
      rackClass: rackForm.rackClass,
      height: Number(rackForm.height),
      width: Number(rackForm.width),
      depth: Number(rackForm.depth),
      locationRef: rackForm.locationRef,
      rowNumber: Number(rackForm.rowNumber),
      columnNumber: Number(rackForm.columnNumber),
      maxVoltage: Number(rackForm.maxVoltage),
      maxAllocatedPower: Number(rackForm.maxAllocatedPower),
      timestamp: rackForm.timestamp,
      validUntil: rackForm.validUntil,
      containedChassis: []
    };

    setRacks(prev => {
      const exists = prev.some(r => r.id === rackIdTrimmed);
      if (exists) {
        return prev.map(r => r.id === rackIdTrimmed ? { ...newRack, containedChassis: r.containedChassis } : r);
      } else {
        return [...prev, newRack];
      }
    });

    setAppStatus({ type: 'success', message: `Rack unit ${rackIdTrimmed} added on Row ${rackForm.rowNumber}, Column ${rackForm.columnNumber} grid coordinates.` });
    
    setRackForm({
      id: '',
      rackClass: 'rack-standard' as any,
      height: 2000,
      width: 600,
      depth: 1000,
      locationRef: 'loc-tokyo-room-01',
      rowNumber: 1,
      columnNumber: 1,
      maxVoltage: 220,
      maxAllocatedPower: 4000,
      timestamp: new Date().toISOString(),
      validUntil: new Date(Date.now() + 31536000000).toISOString()
    });
  };

  // Mount chassis inside rack with slot conflict checks (Feature 16)
  const handleMountChassis = (e: React.FormEvent) => {
    e.preventDefault();
    setMountError(null);
    setAppStatus(null);

    const targetRack = racks.find(r => r.id === selectedRackId);
    if (!targetRack) {
      setMountError("No target rack unit chosen.");
      return;
    }

    const pos = Number(mountForm.relativePosition);
    if (pos < 1 || pos > 42) {
      setMountError("Slot position out of range (standard 1U to 42U range).");
      return;
    }

    // Check duplicate Slot occupancies (Scenario 1 slot-unicity)
    const slotBusy = targetRack.containedChassis.some(ch => ch.relativePosition === pos);
    if (slotBusy) {
      setMountError(`Mount Conflict Exception: Relative layout U-slot coordinate ${pos} is already occupied by another chassis component!`);
      return;
    }

    // Check custom power allocation exceeds max allocations
    const currentAllocatedGroupPower = targetRack.containedChassis.reduce((s, c) => s + c.powerAllocated, 0);
    const candidateAllocated = currentAllocatedGroupPower + mountForm.powerAllocated;
    if (candidateAllocated > targetRack.maxAllocatedPower) {
      setMountError(`Power Budget Constraint Violation: Total power of ${candidateAllocated}W exceeds max-allocated-power limit of ${targetRack.maxAllocatedPower}W defined for this rack.`);
      return;
    }

    // Addition
    setRacks(prev => prev.map(r => {
      if (r.id === selectedRackId) {
        return {
          ...r,
          containedChassis: [
            ...r.containedChassis,
            {
              relativePosition: pos,
              neRef: mountForm.neRef,
              componentRef: mountForm.componentRef,
              powerAllocated: mountForm.powerAllocated
            }
          ]
        };
      }
      return r;
    }));

    setAppStatus({ type: 'success', message: `Chassis mounted securely in U-Slot ${pos} with ${mountForm.powerAllocated}W allocated.` });
  };

  const handleUnmountChassis = (rackId: string, pos: number) => {
    setRacks(prev => prev.map(r => {
      if (r.id === rackId) {
        return {
          ...r,
          containedChassis: r.containedChassis.filter(ch => ch.relativePosition !== pos)
        };
      }
      return r;
    }));
    setAppStatus({ type: 'success', message: `Chassis unmounted from U-Slot ${pos}.` });
  };

  const handleResetSampleData = () => {
    const freshSet = buildInitialDataset(nodes);
    setLocations(freshSet.locations);
    setDirectChassis(freshSet.directChassis);
    setRacks(freshSet.racks);
    setAppStatus({ type: 'success', message: "Reverted location database to default configurations dynamically for all nodes." });
  };

  // Helper selectors
  const activeRack = racks.find(r => r.id === selectedRackId);

  return (
    <div className="flex-1 flex flex-col gap-6 h-full pb-16 text-foreground/90" id="ni-locations-root">
      
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <MapPin className="w-7 h-7 text-emerald-500" />
            Network Inventory Location Manager
          </h2>
          <p className="text-muted-foreground text-sm">
            IETF `ietf-ni-location` schema manager controlling site coordinates, spatial containment, physical racks bounds and electrical U-slots.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleResetSampleData}
            className="px-3.5 py-1.5 border border-border bg-background hover:bg-muted text-xs font-mono text-muted-foreground hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET DATA
          </button>
        </div>
      </div>

      {/* Sub tabs selectors */}
      <div className="flex border-b border-border/80 gap-6">
        <button
          onClick={() => { setSubView('hierarchy'); setAppStatus(null); }}
          className={`pb-3 text-sm font-bold tracking-wide relative transition-colors ${subView === 'hierarchy' ? 'text-emerald-500 border-b-2 border-emerald-500 font-extrabold' : 'text-zinc-400 hover:text-white'}`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Hierarchical Sites & Addresses
          </div>
        </button>

        <button
          onClick={() => { setSubView('racks'); setAppStatus(null); }}
          className={`pb-3 text-sm font-bold tracking-wide relative transition-colors ${subView === 'racks' ? 'text-emerald-500 border-b-2 border-emerald-500 font-extrabold' : 'text-zinc-400 hover:text-white'}`}
        >
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            Racks Placements & Grid
          </div>
        </button>

        <button
          onClick={() => { setSubView('direct-chassis'); setAppStatus(null); }}
          className={`pb-3 text-sm font-bold tracking-wide relative transition-colors ${subView === 'direct-chassis' ? 'text-emerald-500 border-b-2 border-emerald-500 font-extrabold' : 'text-zinc-400 hover:text-white'}`}
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Direct Site Chassis
          </div>
        </button>
      </div>

      {/* Status banner response */}
      {appStatus && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-mono ${appStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
          {appStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
          <span className="flex-1">{appStatus.message}</span>
        </div>
      )}

      {/* SUBVIEW 1: Location Hierarchy & Addresses (Feature 11 & 12) */}
      {subView === 'hierarchy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Location Site Form input and validations */}
          <div className="lg:col-span-5 bg-zinc-950/20 border border-border rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-white text-sm">
                {editingLocId ? `Modifying Location: ${editingLocId}` : "Register New Hierarchical Location"}
              </h3>
            </div>

            <form onSubmit={handleLocationSubmit} className="space-y-4">
              {locError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs leading-normal flex items-start gap-2 font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{locError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block mb-1">Location ID</label>
                  <input
                    type="text"
                    value={locForm.id}
                    disabled={!!editingLocId}
                    onChange={(e) => setLocForm(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full bg-background border border-border px-3 py-1.5 rounded-lg text-xs font-mono text-white focus:border-emerald-500 outline-none disabled:opacity-40"
                    placeholder="loc-tokyo-corridor"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block mb-1">Spatial Type</label>
                  <select
                    value={locForm.type}
                    onChange={(e) => setLocForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs font-mono text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="Site">Site</option>
                    <option value="Data Center">Data Center</option>
                    <option value="Building">Building</option>
                    <option value="Equipment Room">Equipment Room</option>
                    <option value="Row Corridor">Row Corridor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Containing Parent Location (optional leafref)</label>
                <select
                  value={locForm.parent}
                  onChange={(e) => setLocForm(prev => ({ ...prev, parent: e.target.value }))}
                  className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs font-mono text-white focus:border-emerald-500 outline-none"
                >
                  <option value="">-- No containing parent --</option>
                  {locations.filter(l => l.id !== locForm.id).map(l => (
                    <option key={l.id} value={l.id}>{l.id} ({l.type})</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 font-serif mt-1">
                  Constraints: Cannot map to dynamic circular references (e.g. self or descendant).
                </p>
              </div>

              {/* Feature 12 physical-address fields */}
              <div className="border-t border-border/70 pt-4 space-y-4">
                <span className="text-[11px] font-mono uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-zinc-400" />
                  Physical Address Grouping
                </span>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 block mb-1">Street Address</label>
                  <input
                    type="text"
                    value={locForm.address}
                    onChange={(e) => setLocForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-background border border-border px-3 py-1.5 rounded-lg text-xs text-white focus:border-emerald-500 outline-none"
                    placeholder="e.g. Floor 2, 88 Minato Blvd"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">City</label>
                    <input
                      type="text"
                      value={locForm.city}
                      onChange={(e) => setLocForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-background border border-border px-3 py-1.5 rounded-lg text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">State / Region</label>
                    <input
                      type="text"
                      value={locForm.state}
                      onChange={(e) => setLocForm(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full bg-background border border-border px-3 py-1.5 rounded-lg text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 font-mono">
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={locForm.postalCode}
                      onChange={(e) => setLocForm(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full bg-background border border-border px-3 py-1.5 rounded-lg text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1 font-bold">Country ISO Code</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={locForm.countryCode}
                      onChange={(e) => setLocForm(prev => ({ ...prev, countryCode: e.target.value }))}
                      className="w-full bg-background border border-border px-3 py-1.5 rounded-lg text-xs text-white focus:border-emerald-500 outline-none"
                      placeholder="e.g. JP, US"
                    />
                  </div>
                </div>
              </div>

              {/* Temporal controls */}
              <div className="border-t border-border/70 pt-4 grid grid-cols-2 gap-4 font-mono">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Recorded TS</label>
                  <input
                    type="text"
                    value={locForm.timestamp}
                    onChange={(e) => setLocForm(prev => ({ ...prev, timestamp: e.target.value }))}
                    className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-[10px] text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Valid Until</label>
                  <input
                    type="text"
                    value={locForm.validUntil}
                    onChange={(e) => setLocForm(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-[10px] text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
                >
                  {editingLocId ? "UPDATE LOCATION" : "CREATE LOCATION"}
                </button>
                {editingLocId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLocId(null);
                      setLocForm({
                        id: '',
                        type: 'Site',
                        parent: '',
                        timestamp: new Date().toISOString(),
                        validUntil: new Date(Date.now() + 31536000000).toISOString(),
                        address: '',
                        postalCode: '',
                        state: '',
                        city: '',
                        countryCode: 'JP'
                      });
                    }}
                    className="px-4 bg-muted hover:bg-zinc-800 border border-border rounded-lg text-xs font-bold text-zinc-400 hover:text-white"
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right side Location lists */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-mono font-bold px-1">Registered CONTAINMENT HIERARCHY</h4>
            
            {locations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground bg-zinc-950/20 border border-border rounded-xl">
                No location entries registered. Use the configuration form.
              </div>
            ) : (
              <div className="space-y-4">
                {locations.map(loc => {
                  const isExpired = isLocationExpired(loc);
                  return (
                    <div key={loc.id} className="p-5 bg-background border border-border rounded-xl hover:border-zinc-700 transition-all flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-white text-sm">{loc.id}</h5>
                              <span className="text-[10px] font-mono bg-zinc-800 border border-border text-zinc-300 px-2 py-0.5 rounded">
                                {loc.type}
                              </span>
                              {loc.parent && (
                                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/40 px-2 py-0.5 rounded border border-zinc-800/80">
                                  Parent: {loc.parent}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                              {loc.address ? `${loc.address}, ${loc.city}, ${loc.state} ${loc.postalCode}` : "No physical address configured"}
                            </p>
                          </div>
                        </div>

                        {/* Validity states & badge */}
                        <div className="flex flex-col items-end gap-1 font-mono">
                          {isExpired ? (
                            <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-1 rounded font-bold flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              EXPIRED
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              VALID
                            </span>
                          )}
                          <span className="text-[9px] text-zinc-500">
                            Until: {new Date(loc.validUntil).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Detail Addresses / country rules */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 font-mono">
                        <div>
                          <span className="text-zinc-500 block">COUNTRY CODE</span>
                          <span className={`${loc.countryCode ? 'text-white' : 'text-zinc-600'}`}>{loc.countryCode || "n/a"}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">POSTAL ZIP</span>
                          <span>{loc.postalCode || "n/a"}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">RECORDED TIMESTAMP</span>
                          <span className="truncate block" style={{ maxWidth: '100px' }} title={loc.timestamp}>
                            {loc.timestamp}
                          </span>
                        </div>
                        <div className="flex gap-2 justify-end self-end text-right">
                          <button
                            onClick={() => handleEditLocation(loc)}
                            className="px-2 py-1 border border-border hover:bg-muted text-[10px] font-bold text-white rounded transition-colors"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => handleDeleteLocation(loc.id)}
                            className="px-2 py-1 border border-red-500/20 text-red-500 hover:bg-red-500/10 text-[10px] font-bold rounded transition-colors"
                          >
                            DELETE
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUBVIEW 2: Equipment Racks Physical Bounds & Grid Coordinates (Feature 14, 15, 16) */}
      {subView === 'racks' && (
        <div className="space-y-6">

          {/* U-slot chassis positions / electricity constraints dashboard selector */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-950/10 p-4 border border-border rounded-xl">
            {racks.map(rk => {
              const cap = rk.containedChassis.reduce((s, c) => s + c.powerAllocated, 0);
              const pct = (cap / rk.maxAllocatedPower) * 100;
              return (
                <button
                  key={rk.id}
                  onClick={() => setSelectedRackId(rk.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${selectedRackId === rk.id ? 'bg-zinc-900 border-emerald-500' : 'bg-background/40 hover:bg-zinc-900/40 border-border/60'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-white font-mono">{rk.id}</span>
                    <span className="text-[9px] font-mono uppercase bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                      {rk.rackClass.replace('rack-', '')}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-[11px] font-mono text-zinc-400">
                    <div>Grid Position: Row {rk.rowNumber}, Col {rk.columnNumber}</div>
                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span>Power budget ({pct.toFixed(0)}%)</span>
                      <span className={pct > 90 ? 'text-rose-500 font-bold' : 'text-emerald-400'}>{cap}W / {rk.maxAllocatedPower}W</span>
                    </div>
                    {/* Tiny micro budget bar */}
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Col: Rack CRUD Form */}
            <div className="lg:col-span-4 bg-zinc-950/20 border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Maximize2 className="w-4 h-4 text-emerald-500" />
                <h4 className="font-bold text-white text-sm">Register Telecom Rack</h4>
              </div>

              <form onSubmit={handleRackSubmit} className="space-y-4">
                {rackError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs font-mono">
                    {rackError}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Rack ID</label>
                  <input
                    type="text"
                    value={rackForm.id}
                    onChange={(e) => setRackForm(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full bg-background border border-border px-3 py-1.5 rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-500"
                    placeholder="rack-b13"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Class</label>
                    <select
                      value={rackForm.rackClass}
                      onChange={(e) => setRackForm(prev => ({ ...prev, rackClass: e.target.value as any }))}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    >
                      <option value="rack-standard">Standard</option>
                      <option value="rack-secure-baseline">Secure Baseline</option>
                      <option value="rack-secure-medium">Secure Medium</option>
                      <option value="rack-secure-high">Secure High</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Location ID Ref</label>
                    <select
                      value={rackForm.locationRef}
                      onChange={(e) => setRackForm(prev => ({ ...prev, locationRef: e.target.value }))}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    >
                      {locations.map(lc => (
                        <option key={lc.id} value={lc.id}>{lc.id}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Millimeter validations strictly postive non-zero */}
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Height (mm)</label>
                    <input
                      type="number"
                      value={rackForm.height}
                      onChange={(e) => setRackForm(prev => ({ ...prev, height: Number(e.target.value) }))}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Width (mm)</label>
                    <input
                      type="number"
                      value={rackForm.width}
                      onChange={(e) => setRackForm(prev => ({ ...prev, width: Number(e.target.value) }))}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Depth (mm)</label>
                    <input
                      type="number"
                      value={rackForm.depth}
                      onChange={(e) => setRackForm(prev => ({ ...prev, depth: Number(e.target.value) }))}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {/* Feature 15 Racks grid positioning coords */}
                <div className="grid grid-cols-2 gap-3 font-mono border-t border-border/60 pt-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Grid Row (Row#)</label>
                    <input
                      type="number"
                      min={1}
                      value={rackForm.rowNumber}
                      onChange={(e) => setRackForm(prev => ({ ...prev, rowNumber: Number(e.target.value) }))}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Grid Column (Col#)</label>
                    <input
                      type="number"
                      min={1}
                      value={rackForm.columnNumber}
                      onChange={(e) => setRackForm(prev => ({ ...prev, columnNumber: Number(e.target.value) }))}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {/* Feature 16 electrical configuration */}
                <div className="grid grid-cols-2 gap-3 font-mono border-t border-border/60 pt-3 text-[11px]">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Max Voltage (V)</label>
                    <input
                      type="number"
                      value={rackForm.maxVoltage}
                      onChange={(e) => setRackForm(prev => ({ ...prev, maxVoltage: Number(e.target.value) }))}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1 font-bold">Allocated Power (W)</label>
                    <input
                      type="number"
                      value={rackForm.maxAllocatedPower}
                      onChange={(e) => setRackForm(prev => ({ ...prev, maxAllocatedPower: Number(e.target.value) }))}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold text-white transition-colors pt-2"
                >
                  ADD RACK UNIT
                </button>
              </form>
            </div>

            {/* Middle Col: Selected Rack visualization elevation + chassis (Feature 16 slots conflict & power indicator) */}
            <div className="lg:col-span-4 bg-background border border-border/80 rounded-xl p-6 space-y-4">
              {activeRack ? (
                <div className="space-y-4">
                  <div className="border-b border-border/40 pb-3">
                    <h5 className="font-bold text-white text-sm">Visual U-Slot Elevation for {activeRack.id}</h5>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase">
                      Physical Specs: {activeRack.height}h × {activeRack.width}w × {activeRack.depth}d mm
                    </p>
                  </div>

                  {/* Electrical status budget */}
                  {(() => {
                    const consumedWatts = activeRack.containedChassis.reduce((s, c) => s + c.powerAllocated, 0);
                    const isOverBudget = consumedWatts > activeRack.maxAllocatedPower;
                    return (
                      <div className={`p-3 rounded-lg border font-mono text-xs ${isOverBudget ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Zap className="w-3.5 h-3.5 fill-emerald-500 stroke-none" />
                            Electricity Budget
                          </span>
                          <span>{consumedWatts}W / {activeRack.maxAllocatedPower}W</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">Max voltage support: {activeRack.maxVoltage} Volts AC</p>
                      </div>
                    );
                  })()}

                  {/* 42U rack layout simulation graphic */}
                  <div className="bg-zinc-950/60 p-4 border border-border rounded-lg space-y-1 max-h-[350px] overflow-y-auto">
                    {Array.from({ length: 15 }, (_, idx) => {
                      const uSlot = 15 - idx; // visual from top
                      const occupiedChassis = activeRack.containedChassis.find(c => c.relativePosition === uSlot);

                      return (
                        <div 
                          key={uSlot}
                          className={`p-2 border rounded text-[10px] font-mono flex items-center justify-between ${occupiedChassis ? 'bg-blue-600/10 border-blue-500/30 text-white' : 'border-zinc-800/40 text-zinc-500'}`}
                        >
                          <span className="text-[9px] font-bold tracking-wider px-1 bg-zinc-900 border border-border">
                            {uSlot}U
                          </span>

                          {occupiedChassis ? (
                            <div className="flex-1 flex justify-between items-center pl-3">
                              <div className="truncate pr-2">
                                <b className="text-white text-xs">{occupiedChassis.componentRef}</b>
                                <span className="text-zinc-500 text-[10px] ml-1">({occupiedChassis.neRef})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-400 text-[9px] bg-emerald-505/10 rounded font-bold">{occupiedChassis.powerAllocated}W</span>
                                <button 
                                  onClick={() => handleUnmountChassis(activeRack.id, uSlot)}
                                  className="text-red-500 hover:text-red-400 font-bold"
                                  title="Unmount slot"
                                >
                                  <Trash2 className="w-3 h-3 hover:scale-110 cursor-pointer" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] pr-2">Slot Vacant</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground font-mono text-xs">
                  Choose or add a rack unit to inspect slot elevations.
                </div>
              )}
            </div>

            {/* Right Col: Mount chassis inside a rack (co-dependencies checks Feature 16) */}
            <div className="lg:col-span-4 bg-zinc-950/25 border border-border rounded-xl p-6 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  <h4 className="font-bold text-white text-sm">Mount Chassis in {selectedRackId}</h4>
                </div>

                <form onSubmit={handleMountChassis} className="space-y-4">
                  {mountError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-xs font-mono">
                      {mountError}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">Target Rack Unit</label>
                    <select
                      value={selectedRackId}
                      onChange={(e) => setSelectedRackId(e.target.value)}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs font-mono text-white outline-none"
                    >
                      {racks.map(rk => (
                        <option key={rk.id} value={rk.id}>{rk.id}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">U-Slot (Relative-Position)</label>
                      <input
                        type="number"
                        min={1}
                        max={15}
                        value={mountForm.relativePosition}
                        onChange={(e) => setMountForm(prev => ({ ...prev, relativePosition: Number(e.target.value) }))}
                        className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1 font-bold">Consumption (Watts)</label>
                      <input
                        type="number"
                        min={50}
                        value={mountForm.powerAllocated}
                        onChange={(e) => setMountForm(prev => ({ ...prev, powerAllocated: Number(e.target.value) }))}
                        className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Multi-tier selection constraint check: component dropdown scales dynamically depending on chosen neRef */}
                  <div>
                    <label className="text-[10px] font-mono tracking-wide text-zinc-400 block mb-1">Network Element Parent (ne-ref)</label>
                    <select
                      value={mountForm.neRef}
                      onChange={(e) => setMountForm(prev => ({ ...prev, neRef: e.target.value, componentRef: nodes.find(n => n.uuid === e.target.value)?.hardware[0]?.uuid || '' }))}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    >
                      {nodes.map(nd => (
                        <option key={nd.uuid} value={nd.uuid}>{nd.name} ({nd.type})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono tracking-wide text-zinc-400 block mb-1">Component Ref (component-ref leafref)</label>
                    <select
                      value={mountForm.componentRef}
                      onChange={(e) => setMountForm(prev => ({ ...prev, componentRef: e.target.value }))}
                      className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    >
                      {selectedRackMountNeComponents.length === 0 ? (
                        <option value="">No components configured</option>
                      ) : (
                        selectedRackMountNeComponents.map(comp => (
                          <option key={comp.uuid} value={comp.uuid}>{comp.name} ({comp.class})</option>
                        ))
                      )}
                    </select>
                    <p className="text-[9px] text-zinc-500 font-serif mt-1">
                      Enforced path constraint: Dynamic leafref selects values restricted to components under the sibling ne-ref.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold text-white transition-colors"
                  >
                    CONFIRM MOUNT CHASSIS
                  </button>
                </form>
              </div>

              {/* Floor Plan Coordinates Map (Feature 15 layout visualization) */}
              <div className="border-t border-border/60 pt-4 space-y-3">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold tracking-wider flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-zinc-500" />
                  Site Grid Coordinates (ietf-ni-location Specs)
                </span>

                <div className="p-3 bg-zinc-950/60 rounded-lg border border-border font-mono text-[10px] leading-relaxed text-zinc-400 space-y-1">
                  <p><span className="text-white">Active Racks Row Positioning:</span></p>
                  {racks.map(rk => (
                    <div key={rk.id} className="flex justify-between border-b border-border/30 py-1">
                      <span>{rk.id} Placement:</span>
                      <span className="text-white font-bold">[{rk.rowNumber}, {rk.columnNumber}]</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Section: Comprehensive Physical Card & Port Level Hardware Inventory (Epic 3 Complete Coverage) */}
          <div className="bg-zinc-950/20 border border-border rounded-xl p-6 space-y-6" id="card-port-hardware-directory">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4">
              <div className="flex items-center gap-2.5">
                <Grid className="w-5 h-5 text-emerald-500 animate-pulse" />
                <div>
                  <h3 className="font-bold text-white text-sm">Physical Card & Port-Level Card Deck Explorer</h3>
                  <p className="text-xs text-muted-foreground">Select a Network Element to inspect nested cards, ports, transceivers, and spatial containment hierarchies.</p>
                </div>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-zinc-400">Network Element:</span>
                <select
                  value={selectedNeForExplorer || ''}
                  onChange={(e) => setSelectedNeForExplorer(e.target.value)}
                  className="bg-background border border-border px-3 py-1.5 rounded-lg text-white font-medium outline-none text-xs focus:border-emerald-500"
                >
                  {nodes.map(nd => (
                    <option key={nd.uuid} value={nd.uuid}>
                      {nd.name} ({nd.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* If explorer node is found */}
            {explorerNode ? (() => {
              // Find location definitions
              const itemRoom = locations.find(l => l.id === `room-${explorerNode.uuid.toLowerCase()}`);
              const itemFacility = itemRoom?.parent ? locations.find(l => l.id === itemRoom.parent) : null;
              const itemRegion = itemFacility?.parent ? locations.find(l => l.id === itemFacility.parent) : null;
              
              const itemRack = racks.find(r => r.id === `rack-${explorerNode.uuid.toLowerCase()}`);
              const itemMount = itemRack?.containedChassis.find(c => c.neRef === explorerNode.uuid);

              // Group hardware elements
              const chassis = explorerNode.hardware.find(h => h.class === 'chassis' || h.class === 'container') || explorerNode.hardware[0];
              const modules = explorerNode.hardware.filter(h => h.class === 'module');
              
              // ports grouped by module
              const ports = explorerNode.hardware.filter(h => h.class === 'port');
              const transceivers = explorerNode.hardware.filter(h => h.class === 'transceiver');

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Part 1: Location & Spatial Containment Hierarchy */}
                  <div className="bg-background/40 border border-border/60 rounded-xl p-5 space-y-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 font-mono flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      1. Spatial Containment Hierarchy
                    </span>

                    <div className="space-y-3 font-mono text-xs text-zinc-400">
                      {/* Regional Node */}
                      {itemRegion && (
                        <div className="flex items-start gap-2.5 border-l-2 border-emerald-500/20 pl-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                          <div>
                            <div className="text-white font-bold text-xs">{itemRegion.id} ({itemRegion.type})</div>
                            <div className="text-[10px] mt-0.5 text-zinc-500 font-sans">
                              {itemRegion.address && `${itemRegion.address}, `}{itemRegion.city}, {itemRegion.countryCode}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Parent Facility */}
                      {itemFacility && (
                        <div className="flex items-start gap-2.5 border-l-2 border-emerald-500/30 pl-3 ml-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500/60 mt-1.5" />
                          <div>
                            <div className="text-white font-bold text-xs">{itemFacility.id} ({itemFacility.type})</div>
                            <div className="text-[10px] mt-0.5 text-zinc-500 font-sans">
                              {itemFacility.address && `${itemFacility.address}, `}{itemFacility.city}, {itemFacility.countryCode}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Room Unit */}
                      {itemRoom && (
                        <div className="flex items-start gap-2.5 border-l-2 border-emerald-500 pl-3 ml-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
                          <div>
                            <div className="text-emerald-400 font-extrabold text-xs">{itemRoom.id}</div>
                            <div className="text-[10px] mt-0.5 text-zinc-300 font-sans text-emerald-400">
                              {itemRoom.address}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rack Placement */}
                      {itemRack && (
                        <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-lg mt-2 leading-relaxed">
                          <div className="flex justify-between text-white font-bold text-xs mb-1.5">
                            <span>Rack Location: {itemRack.id}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
                              {itemRack.rackClass.replace('rack-', '')}
                            </span>
                          </div>
                          <div>Grid Index: <b className="text-white">Row {itemRack.rowNumber}, Col {itemRack.columnNumber}</b></div>
                          <div>Relative Size: <b className="text-white">{itemRack.width}w × {itemRack.height}h × {itemRack.depth}d mm</b></div>
                          {itemMount && (
                            <div className="text-emerald-400 mt-1 font-bold">
                              Chassis U-Slot Slot Elevation: U-Slot {itemMount.relativePosition}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Part 2: Card / Module Assembly Details */}
                  <div className="bg-background/40 border border-border/60 rounded-xl p-5 space-y-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 font-mono flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      2. Card (Line Module) Directory
                    </span>

                    <div className="space-y-3">
                      {chassis ? (
                        <div className="bg-zinc-950/40 p-3 rounded-lg border border-border/40 font-mono text-xs">
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold mb-1">Enclosing Chassis Info</div>
                          <div className="text-white font-bold">{chassis.name}</div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            Part: {chassis.partNumber || 'N/A'} | S/N: {chassis.serialNumber || 'N/A'}
                          </div>
                          <div className="flex gap-2 items-center text-[10px] mt-1.5">
                            <span className="text-zinc-500">Mfr: {chassis.manufacturer || 'N/A'}</span>
                            <span className={`px-1 rounded-sm text-[8px] font-bold uppercase ${chassis.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                              {chassis.status}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-zinc-500 font-mono text-[10px]">No container component configured</div>
                      )}

                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-extrabold">Installed Cards ({modules.length})</div>
                        {modules.length === 0 ? (
                          <div className="text-zinc-500 font-mono italic text-xs py-2 text-center bg-zinc-950/10 border border-dashed border-border rounded-lg">No line cards registered</div>
                        ) : (
                          modules.map(mod => (
                            <div key={mod.uuid} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs leading-relaxed hover:border-emerald-500/40 transition-colors">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-white text-[11px]">{mod.name}</span>
                                <span className={`px-1 text-[8px] font-bold rounded uppercase ${mod.status === 'active' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'}`}>
                                  {mod.status}
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5">Part: {mod.partNumber || 'N/A'}</div>
                              <div className="text-[10px] text-zinc-500">S/N: {mod.serialNumber || 'N/A'}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Part 3: Port and Interface Allocation */}
                  <div className="bg-background/40 border border-border/60 rounded-xl p-5 space-y-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 font-mono flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      3. Interfaces & Optical Channels
                    </span>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold border-b border-zinc-800 pb-1.5">
                        <span>Physical Ports ({ports.length})</span>
                        <span>Media Class Info</span>
                      </div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {ports.length === 0 ? (
                          <div className="text-zinc-500 font-mono italic text-xs py-4 text-center bg-zinc-950/10 border border-dashed border-border rounded-lg">No physical ports allocated</div>
                        ) : (
                          ports.map(pt => {
                            // Find transceiver for this port
                            const tc = transceivers.find(t => t.parentUuid === pt.uuid);
                            // Get link stats if available from network element ietf interfaces
                            const ietfIntf = explorerNode.ietfInterfaces?.find(i => i.name.toLowerCase().includes(pt.name.toLowerCase()));

                            return (
                              <div key={pt.uuid} className="p-2 bg-zinc-950/80 rounded border border-zinc-800/60 font-mono text-xs hover:border-emerald-500/20 transition-colors">
                                <div className="flex justify-between items-center">
                                  <span className="font-extrabold text-white">{pt.name}</span>
                                  <span className={`px-1 text-[8px] font-bold rounded ${pt.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {pt.status}
                                  </span>
                                </div>
                                
                                {tc && (
                                  <div className="text-[10px] text-zinc-400 mt-1 pl-1 border-l border-emerald-500/30">
                                    <span>Optic: <b className="text-zinc-300 font-medium">{tc.name}</b></span>
                                    {tc.partNumber && <span className="block text-[9px] text-zinc-500">[{tc.partNumber} / {tc.serialNumber}]</span>}
                                  </div>
                                )}

                                {ietfIntf && (
                                  <div className="text-[9px] text-zinc-500 mt-1 flex justify-between gap-1">
                                    <span>{ietfIntf.type.split(':').pop() || 'fiber'}</span>
                                    {ietfIntf.speed && <span className="text-emerald-500 font-bold">{(ietfIntf.speed / 1e9).toFixed(0)} Gbps</span>}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })() : (
              <div className="text-center font-mono py-8 text-zinc-500 text-xs">
                No telemetry details configured for search term
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUBVIEW 3: Location Direct Site Contained Chassis Form & validation states (Feature 13) */}
      {subView === 'direct-chassis' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Declarations column */}
          <div className="lg:col-span-5 bg-zinc-950/20 border border-border rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-white text-sm">Declare Site Contained-Chassis</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Declare physical chassis components directly present at physical locations without being contained within telecom cabinets or racks (ietf-ni-location Specs).
            </p>

            <form onSubmit={handleDirectChassisSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Generated Chassis ID</label>
                <input
                  type="number"
                  value={directForm.chassisId}
                  onChange={(e) => setDirectForm(prev => ({ ...prev, chassisId: Number(e.target.value) }))}
                  className="w-full bg-background border border-border px-3 py-1.5 rounded-lg text-xs font-mono text-white outline-none"
                />
              </div>

              {/* Dynamic related drop constraints */}
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Network Element Parent (ne-ref)</label>
                <select
                  value={directForm.neRef}
                  onChange={(e) => setDirectForm(prev => ({ ...prev, neRef: e.target.value, componentRef: nodes.find(n => n.uuid === e.target.value)?.hardware[0]?.uuid || '' }))}
                  className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs font-mono text-white outline-none"
                >
                  {nodes.map(nd => (
                    <option key={nd.uuid} value={nd.uuid}>{nd.name} ({nd.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1 font-bold">Component Reference (component-ref leafref)</label>
                <select
                  value={directForm.componentRef}
                  onChange={(e) => setDirectForm(prev => ({ ...prev, componentRef: e.target.value }))}
                  className="w-full bg-background border border-border px-2 py-1.5 rounded-lg text-xs font-mono text-white outline-none"
                >
                  {selectedNeComponents.length === 0 ? (
                    <option value="">No components configured</option>
                  ) : (
                    selectedNeComponents.map(comp => (
                      <option key={comp.uuid} value={comp.uuid}>{comp.name} ({comp.class})</option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-zinc-500 font-serif mt-1">
                  Path restriction: Choices automatically constraint to standard list belonging to the parent ne-ref.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition-colors"
              >
                DECLARE DIRECT CHASSIS MOUNT
              </button>
            </form>
          </div>

          {/* List list */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-mono font-bold px-1">Active site-contained chassis registry</h4>
            
            <div className="space-y-3">
              {directChassis.map((ch, idx) => (
                <div key={idx} className="p-4 bg-background border border-border rounded-xl flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Chassis ID: {ch.chassisId}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">ne-ref: <b className="text-white">{ch.neRef}</b> | component-ref: <b className="text-white">{ch.componentRef}</b></div>
                    </div>
                  </div>

                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-505/10 border border-emerald-505/10 px-2 py-1 rounded">
                    Direct Mounted
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
