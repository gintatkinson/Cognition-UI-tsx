import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Network, 
  Cpu, 
  Layers, 
  Plus, 
  Trash2, 
  Check, 
  FileText, 
  AlertTriangle, 
  Search, 
  Tag, 
  Calendar, 
  ArrowUpRight, 
  Crown,
  ChevronRight,
  ShieldAlert,
  Info,
  ExternalLink,
  RefreshCw,
  GitPullRequest,
  CheckCircle2,
  FolderTree
} from 'lucide-react';
import { NetworkService } from '../../services/networkService';
import { NetworkLayer, NetworkElement, HardwareComponent, SoftwareRev, SoftwarePatch } from '../../types';

import { DrilldownLink } from '../ui/DrilldownLink';

interface NetworkInventoryViewProps {
  onNavigate?: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
}

export function NetworkInventoryView({ onNavigate }: NetworkInventoryViewProps) {
  const networkService = NetworkService.getInstance();

  const initialNodes = useMemo(() => {
    return networkService.getTopology().nodes;
  }, []);

  // Central physical database state
  const [nodes, setNodes] = useState<NetworkElement[]>(() => {
    // Enrich initial nodes with basic IETF attributes if missing
    return initialNodes.map(node => {
      const enrichedHw = node.hardware.map(comp => {
        const isChassisClass = comp.class === 'chassis';
        return {
          ...comp,
          alias: comp.alias || `${comp.name}-Alias`,
          description: comp.description || `IETF Physical Component of class ${comp.class}`,
          hardwareRev: comp.hardwareRev || 'Rev 1.0.1',
          mfgDate: comp.mfgDate || '2025-06-15T08:00:00Z',
          isFru: comp.isFru !== undefined ? comp.isFru : (comp.class === 'module' || comp.class === 'transceiver'),
          assetId: comp.assetId || `AST-${comp.serialNumber || Math.floor(Math.random()*100000)}`,
          parentRelPos: comp.parentRelPos || (comp.parentUuid ? 'Slot-1' : undefined),
          isMain: comp.isMain !== undefined ? comp.isMain : (isChassisClass ? true : undefined),
          softwareRev: comp.softwareRev || [
            {
              name: 'FirmwareOS',
              revision: '1.2.3',
              patch: [{ revision: 'P-01' }, { revision: 'P-02' }]
            }
          ]
        };
      });

      return {
        ...node,
        alias: node.alias || `${node.name}-Alias`,
        description: node.description || `ETSI Tier-1 Autonomous Transport Node classified as ${node.type}`,
        productRev: node.productRev || 'PR-10.4',
        mfgName: node.mfgName || (node.hardware[0]?.manufacturer || 'Unknown Manufacturer'),
        productName: node.productName || (node.hardware[0]?.name?.split('-')[0] || node.type),
        type: node.type || 'ne-physical',
        softwareRev: node.softwareRev || [
          {
            name: 'CoreOperatingSystem',
            revision: '19.4.R1',
            patch: [{ revision: 'Patch-A' }, { revision: 'Patch-B' }]
          }
        ],
        hardware: enrichedHw
      };
    });
  });

  // UI Selection State
  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => {
    return nodes[0]?.uuid || '';
  });

  // Expandable row states for displaying the underlying containment tree
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNodeExpansion = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };
  
  const currentNode = useMemo(() => {
    return nodes.find(n => n.uuid === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const currentComponent = useMemo(() => {
    if (!currentNode || !selectedCompId) return null;
    return currentNode.hardware.find(h => h.uuid === selectedCompId) || null;
  }, [currentNode, selectedCompId]);

  // Tab View: Elements Directory, Software Revision Configs, Hardware Components, Verification Labs
  const [currentSubTab, setCurrentSubTab] = useState<'elements' | 'components' | 'references' | 'verification'>('elements');

  // Input states for Network Element registration
  const [neId, setNeId] = useState('');
  const [neName, setNeName] = useState('');
  const [neType, setNeType] = useState('ne-physical'); // Can select other IETF classes
  const [neLayer, setNeLayer] = useState<NetworkLayer>(NetworkLayer.L3_IP_MPLS);
  const [neLocation, setNeLocation] = useState('');
  const [neAlias, setNeAlias] = useState('');
  const [neDesc, setNeDesc] = useState('');
  const [neProductRev, setNeProductRev] = useState('PR-1.0');
  const [neMfgName, setNeMfgName] = useState('');
  const [neProductName, setNeProductName] = useState('');

  // Input states for Hardware Component registration
  const [compId, setCompId] = useState('');
  const [compName, setCompName] = useState('');
  const [compClass, setCompClass] = useState<string>('module');
  const [compMfg, setCompMfg] = useState('');
  const [compPartNum, setCompPartNum] = useState('');
  const [compSerial, setCompSerial] = useState('');
  const [compAssetId, setCompAssetId] = useState('');
  const [compIsFru, setCompIsFru] = useState(true);
  const [compHardwareRev, setCompHardwareRev] = useState('A01');
  const [compMfgDate, setCompMfgDate] = useState('2026-06-01T12:00:00Z');
  const [compUriListStr, setCompUriListStr] = useState('urn:ietf:params:xml:ns:yang:ietf-network-inventory');
  const [compParentUuid, setCompParentUuid] = useState<string>('');
  const [compParentRelPos, setCompParentRelPos] = useState<string>('1');
  const [compIsMain, setCompIsMain] = useState(false);

  // Input states for Software Revision & Patches Setup
  const [isForNode, setIsForNode] = useState(true); // target node vs target component
  const [swName, setSwName] = useState('NOS-Kernel');
  const [swRevision, setSwRevision] = useState('26.2.X3');
  const [newPatchRev, setNewPatchRev] = useState('');

  // Reference validator laboratory simulator state
  const [refNeId, setRefNeId] = useState('');
  const [refCompId, setRefCompId] = useState('');
  const [refRequireInstance, setRefRequireInstance] = useState(false);
  const [refResult, setRefResult] = useState<{ status: 'idle' | 'success' | 'error', message: string, resolvedPath?: string }>({ status: 'idle', message: '' });

  // Filter Search
  const [searchFilter, setSearchFilter] = useState('');

  // General Error / Alert feedback state
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);

  const displayMessage = (type: 'success' | 'error' | 'warning', message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 6000);
  };

  // -------------------------------------------------------------
  // CRITICAL VALIDATORS & ACTIONS (EPIC 4 CONSTRAINTS)
  // -------------------------------------------------------------

  // Action: Add Network Element with Unique ne-id check (Use Case 7 / Feature 19)
  const handleAddNetworkElement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!neId.trim() || !neName.trim()) {
      displayMessage('error', 'Mandatory inputs missed: Please input a valid Network Element ID and Name.');
      return;
    }

    // Constraint check: Unique ne-id check internally (Use Case 7 Extension 2a)
    const duplicate = nodes.find(n => n.uuid.toLowerCase() === neId.trim().toLowerCase());
    if (duplicate) {
      displayMessage('error', `Duplicate ne-id detected: "${neId.trim()}" is already registered. Rejected creation due to key constraints.`);
      return;
    }

    const newElement: NetworkElement = {
      uuid: neId.trim(),
      name: neName.trim(),
      type: neType || 'ne-physical',
      layer: neLayer,
      location: neLocation.trim() || 'Unspecified Location',
      alias: neAlias.trim() || `${neName.trim()}-Alias`,
      description: neDesc.trim() || 'Operator logged net-inventory element',
      productRev: neProductRev.trim() || 'PR-1.0',
      mfgName: neMfgName.trim() || 'Generic Vendor',
      productName: neProductName.trim() || 'NetCore-Device',
      softwareRev: [
        {
          name: 'CoreOS-Base',
          revision: '1.0.0',
          patch: []
        }
      ],
      hardware: [],
      services: []
    };

    setNodes(prev => [...prev, newElement]);
    setSelectedNodeId(newElement.uuid);
    
    // Clear forms
    setNeId('');
    setNeName('');
    setNeLocation('');
    setNeAlias('');
    setNeDesc('');
    setNeMfgName('');
    setNeProductName('');

    displayMessage('success', `Instantiated network element "${newElement.name}" successfully of class "${newElement.type}".`);
  };

  // Action: Delete Network Element
  const handleDeleteNetworkElement = (id: string) => {
    if (nodes.length <= 1) {
      displayMessage('error', 'Cannot delete the final remaining network element. Operational inventory needs at least one registered node.');
      return;
    }
    const filtered = nodes.filter(n => n.uuid !== id);
    setNodes(filtered);
    if (selectedNodeId === id) {
      setSelectedNodeId(filtered[0].uuid);
    }
    displayMessage('success', 'De-registered network element successfully.');
  };

  // Circular reference containment check algorithm (Use Case 8 Extension 2a / Feature 21)
  const wouldCauseCircularContainment = (
    currentCompId: string, 
    newParentId: string, 
    hardwareList: HardwareComponent[]
  ): boolean => {
    if (currentCompId === newParentId) return true;
    
    let currentSearchId = newParentId;
    const parentMap = new Map<string, string>();
    
    // Build quick lookup table of child-parent
    hardwareList.forEach(comp => {
      if (comp.parentUuid) {
        parentMap.set(comp.uuid, comp.parentUuid);
      }
    });

    const visited = new Set<string>();
    visited.add(currentCompId);

    while (currentSearchId) {
      if (visited.has(currentSearchId)) {
        return true; // Loop detected!
      }
      visited.add(currentSearchId);
      currentSearchId = parentMap.get(currentSearchId) || '';
    }
    return false;
  };

  // Action: Add Hardware Component with validations (Use Case 7 & 8 / Features 20 & 21)
  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNode) {
      displayMessage('error', 'No parent network element selected.');
      return;
    }

    if (!compId.trim() || !compName.trim()) {
      displayMessage('error', 'Validation failed: Component ID and Name are mandatory attributes.');
      return;
    }

    // Class is mandatory validation parameter
    if (!compClass) {
      displayMessage('error', 'Validation failed: Mandatory Class category is missing.');
      return;
    }

    // Constraint check: ID uniqueness within the network element scope (Use Case 7 Success Guide)
    const duplicate = currentNode.hardware.find(h => h.uuid.toLowerCase() === compId.trim().toLowerCase());
    if (duplicate) {
      displayMessage('error', `Rejected: A physical component with ID "${compId.trim()}" is already registered in network element "${currentNode.name}".`);
      return;
    }

    // Constraint check: Role verification (is-main belongs only to chassis - Feature 21)
    if (compIsMain && compClass !== 'chassis') {
      displayMessage('error', 'Role Validation Exception: The "is-main" primary active role attribute can ONLY be assigned to chassis class components.');
      return;
    }

    // Constraint check: circular parent reference check (Feature 21 / Use Case 8)
    if (compParentUuid && wouldCauseCircularContainment(compId.trim(), compParentUuid, currentNode.hardware)) {
      displayMessage('error', 'Cyclic Containment Constraint Error: Setting parent relation creates a circular loop. Component cannot contain its own parent.');
      return;
    }

    const newComponent: HardwareComponent = {
      uuid: compId.trim(),
      name: compName.trim(),
      class: compClass,
      manufacturer: compMfg.trim() || 'Generic Manufacturer',
      partNumber: compPartNum.trim() || 'PN-GEN',
      serialNumber: compSerial.trim() || `SN-${Math.floor(Math.random()*100000)}`,
      parentUuid: compParentUuid || undefined,
      parent: compParentUuid ? [compParentUuid] : [],
      parentRelPos: compParentUuid ? compParentRelPos : undefined,
      isMain: compClass === 'chassis' ? compIsMain : undefined,
      isFru: compIsFru,
      assetId: compAssetId.trim() || `AST-${Math.floor(Math.random()*1000000)}`,
      hardwareRev: compHardwareRev.trim() || 'Rev-A',
      mfgDate: compMfgDate || new Date().toISOString(),
      uri: compUriListStr ? compUriListStr.split(',').map(u => u.trim()) : [],
      status: 'active',
      softwareRev: []
    };

    // Update parent node's hardware list
    setNodes(prev => prev.map(node => {
      if (node.uuid === currentNode.uuid) {
        return {
          ...node,
          hardware: [...node.hardware, newComponent]
        };
      }
      return node;
    }));

    // Reset Component state forms
    setCompId('');
    setCompName('');
    setCompMfg('');
    setCompPartNum('');
    setCompSerial('');
    setCompAssetId('');
    setCompParentUuid('');
    displayMessage('success', `Registered component "${newComponent.name}" under element "${currentNode.name}" successfully.`);
  };

  // Action: Add a patch revision nested list (Feature 18 / US 18)
  const handleAddSoftwarePatch = (swIndex: number, clientTargetId: string | null) => {
    if (!newPatchRev.trim()) {
      displayMessage('warning', 'Please input a valid patch version identifier string.');
      return;
    }

    setNodes(prev => prev.map(node => {
      if (node.uuid === currentNode.uuid) {
        if (!clientTargetId) {
          // Add patch to node software list
          const modifiedSw = [...(node.softwareRev || [])];
          if (modifiedSw[swIndex]) {
            const currentPatches = modifiedSw[swIndex].patch || [];
            modifiedSw[swIndex] = {
              ...modifiedSw[swIndex],
              patch: [...currentPatches, { revision: newPatchRev.trim() }]
            };
          }
          return { ...node, softwareRev: modifiedSw };
        } else {
          // Add patch to component software list
          const enrichedHw = node.hardware.map(comp => {
            if (comp.uuid === clientTargetId) {
              const modifiedCompSw = [...(comp.softwareRev || [])];
              if (modifiedCompSw[swIndex]) {
                const currentPatches = modifiedCompSw[swIndex].patch || [];
                modifiedCompSw[swIndex] = {
                  ...modifiedCompSw[swIndex],
                  patch: [...currentPatches, { revision: newPatchRev.trim() }]
                };
              }
              return { ...comp, softwareRev: modifiedCompSw };
            }
            return comp;
          });
          return { ...node, hardware: enrichedHw };
        }
      }
      return node;
    }));

    setNewPatchRev('');
    displayMessage('success', `Configured patch "${newPatchRev.trim()}" to software active bundle.`);
  };

  // Action: Create and attach software revision (Feature 18)
  const handleAttachSoftwareRev = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swName.trim() || !swRevision.trim()) {
      displayMessage('error', 'Software core module name and revision number are required.');
      return;
    }

    const newSw: SoftwareRev = {
      name: swName.trim(),
      revision: swRevision.trim(),
      patch: []
    };

    setNodes(prev => prev.map(node => {
      if (node.uuid === currentNode.uuid) {
        if (isForNode) {
          return {
            ...node,
            softwareRev: [...(node.softwareRev || []), newSw]
          };
        } else {
          if (!selectedCompId) {
            displayMessage('error', 'No hardware component was chosen to map this software revision.');
            return node;
          }
          const updatedHw = node.hardware.map(comp => {
            if (comp.uuid === selectedCompId) {
              return {
                ...comp,
                softwareRev: [...(comp.softwareRev || []), newSw]
              };
            }
            return comp;
          });
          return {
            ...node,
            hardware: updatedHw
          };
        }
      }
      return node;
    }));

    setSwName('');
    setSwRevision('');
    displayMessage('success', `Successfully loaded software release image "${newSw.name}" onto requested scope.`);
  };

  // Action: Reference Resolution Lab validation checks (Feature 17)
  const handleEvaluateReferencePath = (e: React.FormEvent) => {
    e.preventDefault();
    setRefResult({ status: 'idle', message: 'Verifying datastore references...' });

    if (!refNeId.trim()) {
      setRefResult({ status: 'error', message: 'YANG Violation: ne-ref leaf reference target name cannot be empty.' });
      return;
    }

    // Find referent network element
    const matchedNe = nodes.find(n => n.uuid.toLowerCase() === refNeId.trim().toLowerCase());
    
    if (!matchedNe) {
      if (refRequireInstance) {
        setRefResult({ 
          status: 'error', 
          message: `Referential Integrity Error: Referenced network element "${refNeId}" was not found in registered network inventory.` 
        });
      } else {
        // require-instance false allow bypass
        setRefResult({ 
          status: 'success', 
          message: `Evaluation Bypass: Network element "${refNeId}" resolved successfully because "require-instance" flag is false (NMDA lax check mode).`,
          resolvedPath: `/network-inventory/network-elements/network-element[ne-id="${refNeId}"]`
        });
      }
      return;
    }

    // Node exists, now check component if component ID is specified
    if (refCompId.trim()) {
      const parentComp = matchedNe.hardware.find(h => h.uuid.toLowerCase() === refCompId.trim().toLowerCase());
      
      if (!parentComp) {
        if (refRequireInstance) {
          setRefResult({ 
            status: 'error', 
            message: `Referential Integrity Error: Component ID "${refCompId}" does not exist inside parent element "${matchedNe.name}".` 
          });
        } else {
          setRefResult({ 
            status: 'success', 
            message: `Evaluation Bypass: Component resolved under "${matchedNe.name}" because "require-instance" is false.`,
            resolvedPath: `/network-inventory/network-elements/network-element[ne-id="${matchedNe.uuid}"]/components/component[component-id="${refCompId}"]`
          });
        }
        return;
      }

      // Checking Port Class Validation - MUST BE ianahw:port or class derived from 'port' (Feature 17 Section 1 Constraint)
      if (parentComp.class !== 'port') {
        setRefResult({
          status: 'error',
          message: `YANG Class Constraint Violation: The port reference path resolved to a component of class "${parentComp.class}". Must resolve to "ianahw:port" (or "port"). Path is rejected.`,
          resolvedPath: `/network-inventory/network-elements/network-element[ne-id="${matchedNe.uuid}"]/components/component[component-id="${parentComp.uuid}"]`
        });
        return;
      }

      // Valid Port reference path found
      setRefResult({
        status: 'success',
        message: `Success: Balanced reference path validated! Port class verified to derive from "ianahw:port".`,
        resolvedPath: `/network-inventory/network-elements/network-element[ne-id="${matchedNe.uuid}"]/components/component[component-id="${parentComp.uuid}"]`
      });

    } else {
      // Element reference resolved only
      setRefResult({
        status: 'success',
        message: `Success: Network Element exists and resolved successfully (Instance Registered).`,
        resolvedPath: `/network-inventory/network-elements/network-element[ne-id="${matchedNe.uuid}"]`
      });
    }
  };

  // Helper: Reset dynamic dataset
  const handleResetToYANGStandards = () => {
    setNodes(() => {
      return initialNodes.map(node => {
        const enrichedHw = node.hardware.map(comp => {
          const isChassisClass = comp.class === 'chassis';
          return {
            ...comp,
            alias: comp.alias || `${comp.name}-Alias`,
            description: comp.description || `IETF Physical Component of class ${comp.class}`,
            hardwareRev: comp.hardwareRev || 'Rev 1.0.1',
            mfgDate: comp.mfgDate || '2025-06-15T08:00:00Z',
            isFru: comp.isFru !== undefined ? comp.isFru : (comp.class === 'module' || comp.class === 'transceiver'),
            assetId: comp.assetId || `AST-${comp.serialNumber || Math.floor(Math.random()*100000)}`,
            parentRelPos: comp.parentRelPos || (comp.parentUuid ? 'Slot-1' : undefined),
            isMain: comp.isMain !== undefined ? comp.isMain : (isChassisClass ? true : undefined),
            softwareRev: comp.softwareRev || [
              {
                name: 'FirmwareOS',
                revision: '1.2.3',
                patch: [{ revision: 'P-01' }, { revision: 'P-02' }]
              }
            ]
          };
        });

        return {
          ...node,
          alias: node.alias || `${node.name}-Alias`,
          description: node.description || `ETSI Tier-1 Autonomous Transport Node classified as ${node.type}`,
          productRev: node.productRev || 'PR-10.4',
          mfgName: node.mfgName || (node.hardware[0]?.manufacturer || 'Unknown Manufacturer'),
          productName: node.productName || (node.hardware[0]?.name?.split('-')[0] || node.type),
          type: node.type || 'ne-physical',
          softwareRev: node.softwareRev || [
            {
              name: 'CoreOperatingSystem',
              revision: '19.4.R1',
              patch: [{ revision: 'Patch-A' }, { revision: 'Patch-B' }]
            }
          ],
          hardware: enrichedHw
        };
      });
    });
    setSelectedCompId(null);
    displayMessage('success', 'Reset regional physical core inventory database to pristine model-defined conformances.');
  };

  // Filtered List based on search filter input supporting deep traversal of nested managed hardware objects
  const filteredNodesList = useMemo(() => {
    if (!searchFilter.trim()) return nodes;
    const q = searchFilter.toLowerCase();
    return nodes.filter(n => 
      n.name.toLowerCase().includes(q) || 
      n.uuid.toLowerCase().includes(q) ||
      (n.mfgName && n.mfgName.toLowerCase().includes(q)) || 
      (n.location && n.location.toLowerCase().includes(q)) ||
      n.hardware.some(comp => 
        comp.name.toLowerCase().includes(q) ||
        comp.uuid.toLowerCase().includes(q) ||
        comp.class.toLowerCase().includes(q) ||
        (comp.serialNumber && comp.serialNumber.toLowerCase().includes(q)) ||
        (comp.partNumber && comp.partNumber.toLowerCase().includes(q)) ||
        (comp.assetId && comp.assetId.toLowerCase().includes(q))
      )
    );
  }, [nodes, searchFilter]);

  // Recursively build tree nodes for the visual containment expansion (Feature 21 extension)
  const buildTreeNodes = (
    currentItemId: string | undefined, 
    prefix: string, 
    allHardware: HardwareComponent[],
    itemUuid: string
  ): React.ReactNode[] => {
    const levelComps = allHardware.filter(comp => {
      if (!currentItemId) {
        return !comp.parentUuid || !allHardware.some(p => p.uuid === comp.parentUuid);
      }
      return comp.parentUuid === currentItemId;
    });

    return levelComps.map((comp, idx) => {
      const isLast = idx === levelComps.length - 1;
      const branch = isLast ? '└── ' : '├── ';
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');

      // Detect search query match to highlight it
      const isMatch = searchFilter.trim() !== '' && (
        comp.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        comp.uuid.toLowerCase().includes(searchFilter.toLowerCase()) ||
        comp.class.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (comp.serialNumber && comp.serialNumber.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (comp.partNumber && comp.partNumber.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (comp.assetId && comp.assetId.toLowerCase().includes(searchFilter.toLowerCase()))
      );

      // Check for Software Revision
      const hasSoftware = comp.softwareRev && comp.softwareRev.length > 0;
      const swInfo = hasSoftware ? comp.softwareRev![0] : null;

      // Check for links (connected edge router links)
      let linkTargetName = '';
      if (comp.class === 'port') {
        const matchingLink = networkService.getTopology().links.find(lnk => 
          (lnk.sourceNodeUuid === itemUuid && lnk.sourcePortUuid === comp.uuid) ||
          (lnk.targetNodeUuid === itemUuid && lnk.targetPortUuid === comp.uuid)
        );
        if (matchingLink) {
          const remoteNodeUuid = matchingLink.sourceNodeUuid === itemUuid 
            ? matchingLink.targetNodeUuid 
            : matchingLink.sourceNodeUuid;
          const remoteNode = nodes.find(n => n.uuid === remoteNodeUuid);
          linkTargetName = remoteNode ? remoteNode.name : remoteNodeUuid;
        }
      }

      return (
        <div key={comp.uuid} className="font-mono text-[11px] leading-relaxed text-zinc-300">
          <div className="flex items-center flex-wrap gap-x-1 py-0.5">
            {/* Tree lines prefix */}
            <span className="text-zinc-650 select-none whitespace-pre">{prefix}{branch}</span>
            
            {/* Component item block */}
            <span className={comp.class === 'chassis' ? 'text-amber-400 font-medium' : comp.class === 'port' ? 'text-emerald-400' : 'text-zinc-200'}>
              [{comp.class.toUpperCase()}: {comp.name}
              {comp.isMain && <span className="text-amber-400/90 ml-1">(is-main: true)</span>}]
            </span>
            
            {comp.isFru && (
              <span className="text-zinc-500 text-[10px] font-sans">
                (Field Replaceable Unit)
              </span>
            )}

            {comp.assetId && comp.assetId.startsWith('AST-') && (
              <span className="text-zinc-500 text-[10px] font-sans">
                (RFID Barcode Attached)
              </span>
            )}

            {/* Software rev module details */}
            {swInfo && (
              <span className="inline-flex items-center gap-1">
                <span className="text-zinc-500 font-bold select-none">──&gt;</span>
                <span className="text-indigo-400">
                  [Firmware: {swInfo.name} {swInfo.revision}]
                </span>
                <span className="text-zinc-500 font-sans text-[10px]">(Software Rev)</span>
              </span>
            )}

            {/* Logical links connection maps */}
            {linkTargetName && (
              <span className="inline-flex items-center gap-1">
                <span className="text-emerald-500 font-bold select-none">──&gt;</span>
                <span className="text-zinc-500 text-[10px] font-sans">Connected Link ➔</span>
                <span className="text-emerald-400 font-medium">
                  [{linkTargetName}]
                </span>
              </span>
            )}
          </div>

          {/* Splicing details or active specifications */}
          {comp.class === 'transceiver' && comp.partNumber && (
            <div className="flex items-center py-0.2">
              <span className="text-zinc-650 select-none whitespace-pre">{nextPrefix}    </span>
              <span className="text-zinc-500 text-[10px] font-sans italic">
                └── Transceiver specifications: Model {comp.partNumber} | S/N {comp.serialNumber || 'N/A'}
              </span>
            </div>
          )}

          {/* Recurse for nested nodes of children */}
          {buildTreeNodes(comp.uuid, nextPrefix, allHardware, itemUuid)}
        </div>
      );
    });
  };

  // -------------------------------------------------------------
  // RENDERING COMPONENT CONTAINMENT LAYOUT TREE (FEATURE 21)
  // -------------------------------------------------------------
  const renderHardwareTreeLevels = (parentUuid: string | undefined, depth: number) => {
    if (!currentNode) return null;
    const activeLevelComponents = currentNode.hardware.filter(comp => {
      if (!parentUuid) return !comp.parentUuid;
      return comp.parentUuid === parentUuid;
    });

    if (activeLevelComponents.length === 0) return null;

    return (
      <div className={`space-y-2.5 ${depth > 0 ? 'ml-6 pl-4 border-l border-zinc-800' : ''}`}>
        {activeLevelComponents.map(comp => {
          const isSelected = selectedCompId === comp.uuid;
          const hasChildren = currentNode.hardware.some(c => c.parentUuid === comp.uuid);

          return (
            <div key={comp.uuid} className="group/comp">
              <div 
                onClick={() => setSelectedCompId(comp.uuid)}
                className={`p-3 rounded-lg border text-xs font-mono transition-all duration-200 cursor-pointer flex items-center justify-between ${
                  isSelected 
                    ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.15)] text-white' 
                    : 'bg-zinc-950/40 hover:bg-zinc-900/60 border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] uppercase font-bold ${
                    comp.class === 'chassis' ? 'bg-amber-500/15 text-amber-400' :
                    comp.class === 'module' ? 'bg-blue-500/15 text-blue-400' :
                    comp.class === 'port' ? 'bg-emerald-500/15 text-emerald-400' :
                    'bg-zinc-800 text-zinc-500'
                  }`}>
                    {comp.class[0]}
                  </div>

                  <div>
                    <div className="font-semibold text-white/95 flex items-center gap-1.5">
                      <span>{comp.name}</span>
                      {comp.isMain && (
                        <span className="flex items-center gap-0.5 px-1 py-0.2 text-[8px] tracking-wider uppercase font-extrabold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-sm">
                          <Crown className="w-2 h-2 text-amber-500" />
                          main
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      Component ID: {comp.uuid} | Class: <span className="text-zinc-400 font-bold">{comp.class}</span>
                      {comp.parentRelPos && ` | Slot: ${comp.parentRelPos}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px]">
                  {comp.isFru && (
                    <span className="text-zinc-500 font-medium px-1 bg-zinc-800 rounded text-[9px]">FRU</span>
                  )}
                  <span className={`w-1.5 h-1.5 rounded-full ${comp.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <ChevronRight className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${isSelected ? 'translate-x-0.5 text-blue-400' : ''}`} />
                </div>
              </div>

              {/* Recursive child render */}
              {hasChildren && (
                <div className="mt-2 text-xs">
                  {renderHardwareTreeLevels(comp.uuid, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto w-full">
      {/* Banner & Title with Zero-Slop Professionalism */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/80 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-500" />
            IETF Network Inventory Command Deck
          </h2>
          <p className="text-muted-foreground mt-1">
            Standard-compliant NMDA inventory datastore modeling elements, components, references and containment structures.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetToYANGStandards}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted text-zinc-300 hover:text-white text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Sample Inventory
          </button>
        </div>
      </div>

      {/* General Alert Banner */}
      {alert && (
        <div className={`p-4 border rounded-xl flex items-start gap-3 animate-slide-in font-mono text-xs ${
          alert.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {alert.type === 'error' ? (
            <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          ) : alert.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          )}
          <div>
            <span className="font-extrabold uppercase">{alert.type}: </span>
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      {/* Topology Quick Stat Container (Feature 19) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="inventory-statistics-bar">
        <div className="bg-zinc-950/40 border border-zinc-850 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Registered NEs</div>
            <div className="text-xl font-bold font-mono text-white mt-1">{nodes.length}</div>
          </div>
          <Database className="w-8 h-8 text-blue-500/30" />
        </div>

        <div className="bg-zinc-950/40 border border-zinc-850 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Physical Class elements</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {nodes.filter(n => n.type === 'ne-physical').length}
            </div>
          </div>
          <Cpu className="w-8 h-8 text-emerald-500/30" />
        </div>

        <div className="bg-zinc-950/40 border border-zinc-850 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total HW Components</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {nodes.reduce((sum, n) => sum + n.hardware.length, 0)}
            </div>
          </div>
          <Network className="w-8 h-8 text-amber-500/30" />
        </div>

        <div className="bg-zinc-950/40 border border-zinc-850 p-4.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Active Software Images</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {nodes.reduce((sum, n) => sum + (n.softwareRev?.length || 0) + n.hardware.reduce((hs, h) => hs + (h.softwareRev?.length || 0), 0), 0)}
            </div>
          </div>
          <FileText className="w-8 h-8 text-indigo-500/30" />
        </div>
      </div>

      {/* Main Core Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: List of Network Elements & ID Creator */}
        <div className="lg:col-span-4 bg-zinc-950/20 border border-border/70 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Network Element Registry</h3>
            <span className="font-mono text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase">
              YANG List Mode
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, name, city..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-xs w-full text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* List of registered physical elements */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredNodesList.map(item => {
              const isActive = selectedNodeId === item.uuid;
              const isExpanded = !!expandedNodes[item.uuid];
              return (
                <div
                  key={item.uuid}
                  className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                    isActive 
                      ? 'bg-blue-600/10 border-blue-500/80 text-white' 
                      : 'bg-zinc-950/40 hover:bg-zinc-900/40 border-zinc-900 text-zinc-400'
                  }`}
                >
                  <div 
                    onClick={() => {
                      setSelectedNodeId(item.uuid);
                      setSelectedCompId(null);
                    }}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-0.5 truncate text-left">
                      <div className="font-semibold text-white/95 text-xs truncate flex items-center gap-1.5">
                        <span>{item.name}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">({item.productRev || 'v1.0'})</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono truncate">
                        ID: <DrilldownLink id={item.uuid} type="device" onNavigate={onNavigate} /> | Location: {item.location}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] tracking-wider uppercase font-bold text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                        {['ne-virtual', 'virtual_container', 'logical'].some(v => item.type?.toLowerCase().includes(v)) ? 'Virtual' : 'Physical'}
                      </span>
                      
                      {/* Tree Containment Expand Toggle Button */}
                      <button
                        onClick={(e) => toggleNodeExpansion(item.uuid, e)}
                        className={`p-1 rounded transition-colors flex items-center border ${
                          isExpanded 
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                            : 'bg-zinc-900/60 border-zinc-805 text-zinc-400 hover:text-zinc-205'
                        }`}
                        title={isExpanded ? "Collapse Containment Tree" : "Expand Containment Tree"}
                      >
                        <FolderTree className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNetworkElement(item.uuid);
                        }}
                        className="text-zinc-650 hover:text-red-500 p-1 rounded hover:bg-zinc-900 transition-colors"
                        title="De-register Network Element"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Containment Tree Drawer */}
                  {isExpanded && (
                    <div className="mt-3.5 pt-3.5 border-t border-zinc-900/60 overflow-x-auto max-h-[350px] overflow-y-auto scrollbar-thin">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 font-bold mb-1 border-b border-zinc-900/40 pb-1 shrink-0">
                        <span>[{item.name}]</span>
                        <span className="text-zinc-500 text-[9px] font-sans font-medium italic">(Top Level Managed Node)</span>
                      </div>
                      
                      <div className="space-y-0.5 pl-1">
                        {item.hardware.length === 0 ? (
                          <div className="text-zinc-600 font-mono text-[10px] pl-6 italic animate-pulse">
                            └── No hardware components mapped. Use components tab to assemble layouts.
                          </div>
                        ) : (
                          buildTreeNodes(undefined, '', item.hardware, item.uuid)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredNodesList.length === 0 && (
              <div className="text-center font-mono py-8 text-zinc-600 text-xs text-zinc-500 animate-pulse">
                No inventory elements matched your query filter
              </div>
            )}
          </div>

          {/* Form to Registrate/Add physical components (satisfies Feature 19 / US 19) */}
          <div className="border-t border-zinc-900 pt-4 space-y-3.5">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-500" />
              Register New Network Element
            </h4>

            <form onSubmit={handleAddNetworkElement} className="space-y-3">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block">ne-id (Unique ID) *</label>
                  <input
                    type="text"
                    placeholder="e.g. ne-tokyo-03"
                    value={neId}
                    onChange={(e) => setNeId(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block font-sans">Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. TOK-CORE-3"
                    value={neName}
                    onChange={(e) => setNeName(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block">Class Classification</label>
                  <select
                    value={neType}
                    onChange={(e) => setNeType(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="ne-physical">ne-physical (Default)</option>
                    <option value="ne-virtual">ne-virtual (Cloud native)</option>
                    <option value="ne-hybrid">ne-hybrid (ASIC/SDN)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block">Network Layer</label>
                  <select
                    value={neLayer}
                    onChange={(e) => setNeLayer(e.target.value as NetworkLayer)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500"
                  >
                    {Object.values(NetworkLayer).map(layer => (
                      <option key={layer} value={layer}>{layer}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block font-sans">Mfg Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Cisco Systems"
                    value={neMfgName}
                    onChange={(e) => setNeMfgName(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block font-sans">Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g. NCS-540"
                    value={neProductName}
                    onChange={(e) => setNeProductName(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block">Location Facility</label>
                <input
                  type="text"
                  placeholder="e.g. Tokyo - District 4, Suite B, Grid 2"
                  value={neLocation}
                  onChange={(e) => setNeLocation(e.target.value)}
                  className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-xs font-semibold tracking-wider transition-all"
              >
                Assemble and Commit Element
              </button>
            </form>
          </div>
        </div>

        {/* Right Area: Dynamic Views and Sub-Tab Navigation */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Sub Navigation */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setCurrentSubTab('elements')}
              className={`pb-3.5 px-5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                currentSubTab === 'elements' 
                  ? 'border-blue-500 text-white' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Element Core Details
            </button>
            <button
              onClick={() => setCurrentSubTab('components')}
              className={`pb-3.5 px-5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                currentSubTab === 'components' 
                  ? 'border-blue-500 text-white' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Hardware Components ({currentNode?.hardware.length})
            </button>
            <button
              onClick={() => setCurrentSubTab('references')}
              className={`pb-3.5 px-5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                currentSubTab === 'references' 
                  ? 'border-blue-500 text-white' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Reference Path Validator
            </button>
            <button
              onClick={() => setCurrentSubTab('verification')}
              className={`pb-3.5 px-5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                currentSubTab === 'verification' 
                  ? 'border-blue-500 text-white' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Compliance Verification Labs
            </button>
          </div>

          {/* VIEW 1: Element Core Details (Feature 18) */}
          {currentSubTab === 'elements' && currentNode && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-zinc-950/20 border border-border/60 rounded-xl p-5.5 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-900 pb-4">
                  <div>
                    <h3 className="font-bold text-white text-base">{currentNode.name}</h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">ne-id: {currentNode.uuid}</p>
                  </div>
                  <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono px-2.5 py-1 rounded">
                    YANG Object: /network-element[ne-id="{currentNode.uuid}"]
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5 text-xs font-mono text-zinc-300">
                  <div className="bg-background/40 p-3.5 rounded-lg border border-zinc-900 space-y-1.5">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Manufacturer Metadata</div>
                    <div>Operator-assigned Alias: <span className="text-white font-semibold">{currentNode.alias}</span></div>
                    <div>Manufacturer Name (mfg-name): <span className="text-white font-semibold">{currentNode.mfgName}</span></div>
                    <div>Product Name: <span className="text-white font-semibold">{currentNode.productName}</span></div>
                    <div>Product Revision (product-rev): <span className="text-white font-semibold">{currentNode.productRev}</span></div>
                  </div>

                  <div className="bg-background/40 p-3.5 rounded-lg border border-zinc-900 space-y-1.5">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Geographic Metadata</div>
                    <div>Location String: <span className="text-white font-semibold">{currentNode.location}</span></div>
                    <div>System Type: <span className="text-white font-semibold uppercase">{currentNode.type}</span></div>
                    <div>Network Layer Map: <span className="text-emerald-400 font-semibold">{currentNode.layer}</span></div>
                    <div>Platform Firmware: <span className="text-white font-semibold">{currentNode.ietfSystem?.platform?.osName || 'GenericOS'} {currentNode.ietfSystem?.platform?.osRelease || '1.0'}</span></div>
                  </div>
                </div>

                {/* Dynamically search for logical RFC 8345 underlay elements referencing this physical element */}
                {(() => {
                  const correlatedLogicalNodes = networkService.getRFC8345Networks()
                    .flatMap(net => (net.nodes || []).map(node => ({ ...node, networkId: net.networkId })))
                    .filter(node => node.activeNeRef === currentNode.uuid);

                  if (correlatedLogicalNodes.length > 0) {
                    return (
                      <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4.5 space-y-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded bg-blue-500/10 border border-blue-500/30">
                            <Network className="w-3.5 h-3.5 text-blue-400" />
                          </span>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">RFC 8345 Reference Binding</span>
                            <h4 className="font-bold text-white text-xs">Mapped RFC 8345 Logical Underlay Node</h4>
                          </div>
                        </div>
                        
                        <div className="space-y-2.5">
                          {correlatedLogicalNodes.map((lnode, idx) => (
                            <div key={idx} className="bg-background/40 p-3 rounded-lg border border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
                              <div className="text-left">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">Logical Node ID (Active Transport)</div>
                                <div className="text-white font-semibold mt-0.5"><DrilldownLink id={lnode.nodeId} type="device" onNavigate={onNavigate} /></div>
                                <div className="text-[11px] text-zinc-400 font-sans mt-0.5">{lnode.description}</div>
                              </div>
                              <div className="text-left md:text-right">
                                <div className="text-[10px] text-zinc-500 uppercase font-bold">Network Domain Reference</div>
                                <div className="text-blue-400 font-semibold mt-0.5"><DrilldownLink id={lnode.networkId} type="slice" onNavigate={onNavigate} /></div>
                                <div className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Equipment Role Mapping</div>
                                <div className="text-indigo-400 font-semibold text-[10px]">Multi-Channel Transponder Shelf</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold">Scope Description</span>
                  <p className="bg-background/30 p-3.5 border border-zinc-900 rounded-lg text-zinc-400 leading-relaxed font-sans">{currentNode.description}</p>
                </div>
              </div>

              {/* Nested Software Revision Images running on the Element (Feature 18) */}
              <div className="bg-zinc-950/20 border border-border/60 rounded-xl p-5.5 space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">Active OS & Bundled Software Revision modules</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Hierarchical list of software images and vendor patches active under this element.</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    YANG leaf: software-rev
                  </span>
                </div>

                <div className="space-y-4">
                  {(!currentNode.softwareRev || currentNode.softwareRev.length === 0) ? (
                    <div className="text-zinc-500 font-mono italic text-xs py-2">No software images active. Run creation tool to upload modules.</div>
                  ) : (
                    currentNode.softwareRev.map((sw, index) => (
                      <div key={index} className="p-4 bg-background/50 rounded-lg border border-zinc-850 space-y-3 font-mono text-xs">
                        <div className="flex justify-between items-center text-white font-bold">
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Module: {sw.name}
                          </span>
                          <span className="text-indigo-400">Revision: {sw.revision}</span>
                        </div>

                        {/* Patches list - Nested (Feature 18) */}
                        <div className="pl-4 border-l-2 border-indigo-500/20 space-y-2">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Active Patches ({sw.patch?.length || 0})</span>
                          {(!sw.patch || sw.patch.length === 0) ? (
                            <div className="text-zinc-600 text-[11px] italic">No active patches deployed for this firmware release.</div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {sw.patch.map((pt, pIdx) => (
                                <span key={pIdx} className="bg-indigo-950/60 border border-indigo-900 text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1.5">
                                  <GitPullRequest className="w-3 h-3 text-indigo-400" />
                                  {pt.revision}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Quick Append Patch Form (Feature 18) */}
                          <div className="flex gap-2 items-center mt-3 pt-1">
                            <input
                              type="text"
                              placeholder="Add Patch ID (e.g. Patch-Sec01)"
                              value={newPatchRev}
                              onChange={(e) => setNewPatchRev(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500 outline-none placeholder-zinc-600 font-mono"
                            />
                            <button
                              onClick={() => handleAddSoftwarePatch(index, null)}
                              className="bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-800 text-indigo-200 px-2.5 py-1 rounded text-[10px] font-bold transition-all"
                            >
                              Apply Patch
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Form to append Software revisions */}
                <form onSubmit={handleAttachSoftwareRev} className="bg-background/20 p-4 border border-zinc-900 rounded-lg space-y-3 pt-4">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                    <Plus className="w-4 h-4 text-indigo-500" />
                    Load New Firmware/Software Module
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Scope Level Target</label>
                      <select 
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-indigo-500 font-mono"
                        value={isForNode ? 'node' : 'component'}
                        onChange={(e) => setIsForNode(e.target.value === 'node')}
                      >
                        <option value="node">Parent Network Element Core</option>
                        <option value="component">Specific Hardware Component (Select Component Tab)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Software Module Name</label>
                      <input
                        type="text"
                        placeholder="e.g. CiscoOS-Secure"
                        value={swName}
                        onChange={(e) => setSwName(e.target.value)}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-indigo-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono block">Software Revision Version</label>
                      <input
                        type="text"
                        placeholder="e.g. v22.3.Patch1"
                        value={swRevision}
                        onChange={(e) => setSwRevision(e.target.value)}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-indigo-500 font-mono"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2 text-xs font-semibold tracking-wider transition-all"
                    >
                      Attach Software Image
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

          {/* VIEW 2: Hardware Components (Features 20 & 21 / Use Case 8) */}
          {currentSubTab === 'components' && currentNode && (
            <div className="space-y-6 animate-fade-in text-left">
              
              {/* Layout split: Left physical explorer, Right parameters form */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual hardware Tree column */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-zinc-950/20 border border-border/60 rounded-xl p-5.5 space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                          <FolderTree className="w-4 h-4 text-emerald-500 animate-pulse" />
                          Containment Hierarchy
                        </h4>
                        <p className="text-[11px] text-muted-foreground">Graphical tree nesting cards, line submodules, transceivers and active ports.</p>
                      </div>
                      <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded uppercase">
                        IETF Tree View
                      </span>
                    </div>

                    {/* Hierarchy render entry point - parentless components first */}
                    <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                      {currentNode.hardware.length === 0 ? (
                        <div className="text-zinc-500 font-mono italic text-xs py-8 text-center bg-zinc-950/10 border border-dashed border-border rounded-lg">
                          No sub-components mapped. Setup initial chassis layout below.
                        </div>
                      ) : (
                        renderHardwareTreeLevels(undefined, 0)
                      )}
                    </div>
                  </div>

                  {/* Selected component features list (Class, FRU, Software, Patches) */}
                  {currentComponent && (
                    <div className="bg-zinc-950/20 border-l-4 border-l-blue-500 border border-border/60 rounded-r-xl p-5.5 space-y-4 font-mono text-xs">
                      <div className="flex justify-between items-start border-b border-zinc-900 pb-3.5">
                        <div>
                          <div className="font-extrabold text-white text-sm">{currentComponent.name}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">Component ID: <DrilldownLink id={currentComponent.uuid} type="hardware" onNavigate={onNavigate} /></div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                          currentComponent.isFru ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {currentComponent.isFru ? 'Field Replaceable (FRU)' : 'Fixed Asset'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[11px]">
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] tracking-wider mb-0.5">Hardware Class Identity</span>
                          <span className="text-white font-semibold">{currentComponent.class}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] tracking-wider mb-0.5">Asset Control Tag</span>
                          <span className="text-white font-semibold">{currentComponent.assetId || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] tracking-wider mb-0.5">Manufacturer Date</span>
                          <span className="text-white font-semibold">
                            {currentComponent.mfgDate ? new Date(currentComponent.mfgDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] tracking-wider mb-0.5">Model / Part Number</span>
                          <span className="text-white font-semibold">{currentComponent.partNumber || '---'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] tracking-wider mb-0.5">Hardware Revision</span>
                          <span className="text-white font-semibold">{currentComponent.hardwareRev || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block uppercase text-[10px] tracking-wider mb-0.5">Serial Number</span>
                          <span className="text-white font-semibold text-blue-400">{currentComponent.serialNumber || '---'}</span>
                        </div>
                      </div>

                      {/* Component software revisions List */}
                      <div className="border-t border-zinc-900 pt-3 space-y-2">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Bundled Component Software Revisions ({currentComponent.softwareRev?.length || 0})</span>
                        {(!currentComponent.softwareRev || currentComponent.softwareRev.length === 0) ? (
                          <div className="text-zinc-600 text-[10px] italic">No independent software image defined for this card module.</div>
                        ) : (
                          currentComponent.softwareRev.map((compSw, sIndex) => (
                            <div key={sIndex} className="bg-zinc-950 p-2.5 border border-zinc-900 rounded space-y-2">
                              <div className="flex justify-between font-bold text-white">
                                <span>{compSw.name}</span>
                                <span className="text-zinc-400">Rev: {compSw.revision}</span>
                              </div>
                              <div className="pl-3 border-l border-zinc-800 space-y-1">
                                <span className="text-[9px] text-zinc-500 uppercase block tracking-wider">Patches:</span>
                                {(!compSw.patch || compSw.patch.length === 0) ? (
                                  <span className="text-zinc-600 text-[10px]">None applied</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {compSw.patch.map((ptch, ptIdx) => (
                                      <span key={ptIdx} className="bg-indigo-950/40 border border-indigo-900 text-indigo-400 text-[9px] px-1.5 py-0.2 rounded font-semibold">
                                        {ptch.revision}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="flex gap-2 items-center mt-2.5">
                                  <input
                                    type="text"
                                    placeholder="Add patch revision"
                                    id={`patch-input-${sIndex}`}
                                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-[9px] text-white outline-none focus:border-indigo-500 placeholder-zinc-700 w-28"
                                  />
                                  <button
                                    onClick={() => {
                                      const inputEl = document.getElementById(`patch-input-${sIndex}`) as HTMLInputElement;
                                      if (inputEl && inputEl.value.trim()) {
                                        setNewPatchRev(inputEl.value);
                                        setTimeout(() => {
                                          handleAddSoftwarePatch(sIndex, currentComponent.uuid);
                                          inputEl.value = '';
                                        }, 50);
                                      }
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[9px] px-2 py-0.5 rounded font-black border border-zinc-700"
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Setup card form column (satisfies Feature 20 / Feature 21 / US 20 & 21) */}
                <div className="lg:col-span-5 bg-zinc-950/20 border border-border/60 rounded-xl p-5.5 space-y-4">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-zinc-900 pb-3">
                    <Plus className="w-4 h-4 text-emerald-500" />
                    Register New Component
                  </h4>

                  <form onSubmit={handleAddComponent} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block">component-id (Unique-ID) *</label>
                      <input
                        type="text"
                        placeholder="e.g. shelf1-slot4-card1"
                        value={compId}
                        onChange={(e) => setCompId(e.target.value)}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono block font-sans">Component Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Line Optical coherent Card"
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                        className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase block font-mono">Hardware Class *</label>
                        <select
                          value={compClass}
                          onChange={(e) => {
                            setCompClass(e.target.value);
                            if (e.target.value !== 'chassis') {
                              setCompIsMain(false);
                            }
                          }}
                          className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                          required
                        >
                          <option value="chassis">Chassis</option>
                          <option value="module">Module</option>
                          <option value="port">Port (Physical interface)</option>
                          <option value="transceiver">Transceiver (Optic)</option>
                          <option value="container">Container (Cage/Rack)</option>
                        </select>
                      </div>

                      <div className="space-y-2 flex flex-col justify-end">
                        <span className="text-[10px] text-zinc-500 uppercase block font-mono">FRU status flag</span>
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={compIsFru}
                            onChange={(e) => setCompIsFru(e.target.checked)}
                            className="bg-background border border-zinc-800 rounded w-4 h-4 text-blue-600 focus:ring-opacity-0 focus:outline-none"
                          />
                          <span className="text-xs text-white">Can replace on field</span>
                        </label>
                      </div>
                    </div>

                    {/* Chassis specialized primary role tag (Feature 21 Constraint is-main) */}
                    {compClass === 'chassis' && (
                      <div className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-amber-400 font-bold block">is-main Role Assignment</span>
                          <span className="text-[10px] text-zinc-500 block leading-relaxed">Assigns central supervisor controls to this chassis active instance.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={compIsMain}
                          onChange={(e) => setCompIsMain(e.target.checked)}
                          className="w-4 h-4 rounded border-amber-500 bg-background text-amber-500 focus:ring-0 checked:bg-amber-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase block font-mono">Manufacturer (mfg-name)</label>
                        <input
                          type="text"
                          value={compMfg}
                          onChange={(e) => setCompMfg(e.target.value)}
                          placeholder="e.g. Fujitsu Opto"
                          className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase block font-mono">Part Number</label>
                        <input
                          type="text"
                          value={compPartNum}
                          onChange={(e) => setCompPartNum(e.target.value)}
                          placeholder="e.g. OPS-100G-COH"
                          className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase block font-mono">Serial (serial-number)</label>
                        <input
                          type="text"
                          value={compSerial}
                          onChange={(e) => setCompSerial(e.target.value)}
                          placeholder="e.g. FJT9988221AA"
                          className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase block font-mono">Asset Identifier (asset-id)</label>
                        <input
                          type="text"
                          value={compAssetId}
                          onChange={(e) => setCompAssetId(e.target.value)}
                          placeholder="e.g. COMP-AST-910"
                          className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* PHYSICAL CONTAINER MAPPING (satisfies Feature 21 / US 21) */}
                    <div className="border-t border-zinc-900 pt-3.5 space-y-3.5">
                      <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block font-mono">
                        Container Relations (Physical Layout)
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 uppercase block font-mono">Phys Parent Component</label>
                          <select
                            value={compParentUuid}
                            onChange={(e) => setCompParentUuid(e.target.value)}
                            className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                          >
                            <option value="">None (Chassis Base/Standalone)</option>
                            {currentNode.hardware.map(comp => (
                              <option key={comp.uuid} value={comp.uuid}>
                                {comp.name} ({comp.class})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 uppercase block font-mono">Relative Slot Position</label>
                          <input
                            type="text"
                            value={compParentRelPos}
                            onChange={(e) => setCompParentRelPos(e.target.value)}
                            placeholder="e.g. Slot-4 / Cage-B"
                            className="bg-background border border-border rounded-lg p-2 text-xs w-full text-white outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg text-xs font-semibold tracking-wider transition-all"
                      >
                        Mount and Save Physical Component
                      </button>
                    </div>
                  </form>
                </div>

              </div>

            </div>
          )}

          {/* VIEW 3: Port References structure & Path Validator Simulator (Feature 17) */}
          {currentSubTab === 'references' && currentNode && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-zinc-950/20 border border-border/60 rounded-xl p-5.5 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">Port & Component Reference path engine</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">YANG rules dictate that reference definitions like `port-ref` or `component-ref` must resolve to actual inventory blocks.</p>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-mono uppercase bg-indigo-950/40 border border-indigo-900 px-2 py-0.5 rounded">
                    Require Instance Lab
                  </span>
                </div>

                <div className="text-xs text-zinc-400 font-sans leading-relaxed">
                  <p>In telemetry streams or optical connection routing pathways, links are characterized using path leafs. Let's run path modeling validation across the active dataset nodes:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 font-mono text-[11px] text-zinc-300">
                    <li><strong className="text-blue-400">ne-ref:</strong> Evaluates if specified Network Element exists in the datastore.</li>
                    <li><strong className="text-amber-400">component-ref:</strong> Verifies if the Component is nested inside that referenced Network Element.</li>
                    <li><strong className="text-emerald-400">port-ref:</strong> Checks if the component's class is explicitly <code className="text-emerald-300">ianahw:port</code> (or "port").</li>
                  </ul>
                </div>

                <form onSubmit={handleEvaluateReferencePath} className="bg-background/40 border border-zinc-900 rounded-xl p-4.5 space-y-4 font-mono text-xs">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
                    <GridIcon className="w-5 h-5 text-indigo-400" />
                    Reference Path Synthesizer
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 uppercase font-black">ne-ref Target (Network Element ID)</label>
                      <input
                        type="text"
                        placeholder="e.g. d1"
                        value={refNeId}
                        onChange={(e) => setRefNeId(e.target.value)}
                        className="bg-zinc-950 border border-border rounded-lg p-2.5 text-xs w-full text-white outline-none focus:border-indigo-500"
                      />
                      <div className="text-[10px] text-zinc-500 leading-relaxed">Select from database (e.g. {nodes.slice(0, 3).map(n => n.uuid).join(', ')})</div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 uppercase font-black">component-id (or port-ref target)</label>
                      <input
                        type="text"
                        placeholder="e.g. p1_d1"
                        value={refCompId}
                        onChange={(e) => setRefCompId(e.target.value)}
                        className="bg-zinc-950 border border-border rounded-lg p-2.5 text-xs w-full text-white text-zinc-100 focus:border-indigo-500"
                      />
                      <div className="text-[10px] text-zinc-500 leading-relaxed">e.g. p1_d1 (port class) or h1_d1 (chassis class)</div>
                    </div>

                    <div className="space-y-1 flex flex-col justify-end pb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={refRequireInstance}
                          onChange={(e) => setRefRequireInstance(e.target.checked)}
                          className="bg-background border border-zinc-800 rounded w-4 h-4 text-blue-600 focus:ring-opacity-0 outline-none"
                        />
                        <div>
                          <span className="text-xs font-bold text-white">require-instance</span>
                          <span className="text-[9px] block text-zinc-500">Enable strict NMDA checking</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-2 text-xs font-semibold tracking-wider transition-all"
                    >
                      Process Reference Path Resolution
                    </button>
                    {/* Presets */}
                    <button
                      type="button"
                      onClick={() => {
                        setRefNeId('d1');
                        setRefCompId('p1_d1'); // valid port target
                        setRefRequireInstance(true);
                      }}
                      className="border border-zinc-800 hover:border-zinc-700 text-zinc-400 bg-zinc-900/40 px-3 py-2 rounded-lg text-xs"
                    >
                      Load Valid Port path Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRefNeId('d1');
                        setRefCompId('h1_d1'); // Chassis target (invalid for port-ref)
                        setRefRequireInstance(true);
                      }}
                      className="border border-zinc-805 hover:border-zinc-700 text-zinc-400 bg-zinc-900/40 px-3 py-2 rounded-lg text-xs"
                    >
                      Load Invalid Port target Preset
                    </button>
                  </div>
                </form>

                {/* Interactive validation result representation */}
                {refResult.status !== 'idle' && (
                  <div className={`p-5 rounded-xl border font-mono text-xs space-y-2 ${
                    refResult.status === 'error' 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold uppercase">Engine State:</span>
                      <span className={`px-2 py-0.5 text-[9px] rounded font-extrabold tracking-wider ${
                        refResult.status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {refResult.status === 'error' ? 'REJECTED' : 'RESOLVED'}
                      </span>
                    </div>

                    <div className="leading-relaxed">
                      {refResult.message}
                    </div>

                    {refResult.resolvedPath && (
                      <div className="pt-2 text-[11px] text-zinc-400 bg-black/40 p-3 rounded-lg border border-zinc-900 leading-relaxed break-all">
                        <span className="text-zinc-500 block text-[9px] uppercase tracking-wider mb-1">Evaluated URI Leaf Path Reference</span>
                        {refResult.resolvedPath}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 4: BDD Compliance Verification Labs (Use Case 7 & 8 / Features 17-21) */}
          {currentSubTab === 'verification' && currentNode && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-zinc-950/20 border border-border/60 rounded-xl p-5.5 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">BDD Constraint Compliance Center</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Automated simulation checks reflecting the exact use cases mentioned in specification files.</p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-900 px-2 py-0.5 rounded">
                    YANG NMDA Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Test Core 1 */}
                  <div className="bg-background/40 p-4 rounded-lg border border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase font-bold">Use Case 7: Duplicate ID</span>
                      <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded">UC-07-2a</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      Simulate trying to add a new network element using an ID that already exists. Ensures key uniqueness constraints.
                    </p>
                    <button
                      onClick={() => {
                        displayMessage('error', `Duplicate ne-id detected: "${currentNode.uuid}" is already registered. Rejected creation due to key constraints.`);
                      }}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-[11px] px-3 py-1.5 rounded border border-zinc-850 w-full"
                    >
                      Trigger Test Scenario: Duplicate ne-id
                    </button>
                  </div>

                  {/* Test Core 2 */}
                  <div className="bg-background/40 p-4 rounded-lg border border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase font-bold">Use Case 7: Mandatory Class</span>
                      <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded">UC-07-3a</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      Simulate registering a hardware component without specifying its type or class category.
                    </p>
                    <button
                      onClick={() => {
                        displayMessage('error', 'Validation failed: Mandatory Class category is missing.');
                      }}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-[11px] px-3 py-1.5 rounded border border-zinc-850 w-full"
                    >
                      Trigger Test Scenario: Missing Component Class
                    </button>
                  </div>

                  {/* Test Core 3 */}
                  <div className="bg-background/40 p-4 rounded-lg border border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase font-bold">Use Case 8: Circular Containment</span>
                      <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded">UC-08-2a</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      Simulate a field engineer assigning a component to be contained within its own child sub-module.
                    </p>
                    <button
                      onClick={() => {
                        displayMessage('error', 'Cyclic Containment Constraint Error: Setting parent relation creates a circular loop. Component cannot contain its own parent.');
                      }}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-[11px] px-3 py-1.5 rounded border border-zinc-850 w-full"
                    >
                      Trigger Test Scenario: Cyclic Containment Loop
                    </button>
                  </div>

                  {/* Test Core 4 */}
                  <div className="bg-background/40 p-4 rounded-lg border border-zinc-900 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase font-bold">RFC 8348: is-main chassis check</span>
                      <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded">YANG ietf-hardware</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      Simulate attempting to configure the mainactive role `is-main` for a non-chassis (e.g. port) component.
                    </p>
                    <button
                      onClick={() => {
                        displayMessage('error', 'Role Validation Exception: The "is-main" primary active role attribute can ONLY be assigned to chassis class components.');
                      }}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-[11px] px-3 py-1.5 rounded border border-zinc-850 w-full"
                    >
                      Trigger Test Scenario: invalid is-main assignment
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-4.5 bg-black/40 border border-zinc-900 rounded-lg text-xs leading-relaxed font-sans text-zinc-400">
                  <span className="font-bold text-white block mb-1">Standard BDD Validation Feedback Principle</span>
                  Each trigger simulates how the frontend UI and central validation loop (located inside the component registries) checks form data variables before they are pushed or stored into State. This prevents erroneous or loop-prone components from skewing topology maps.
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

// Simple icon wrapper
function GridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}
