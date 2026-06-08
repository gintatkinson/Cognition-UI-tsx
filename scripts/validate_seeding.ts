import { getJapaneseNTNTopology } from '../src/lib/japanese-ntn-generator';
import { getRFC8345Networks } from '../src/lib/mock-inventory';

console.log('Running strict database seeding validations...');

const topology = getJapaneseNTNTopology();
const networks = getRFC8345Networks();
let errors = 0;

console.log(`Topology contains ${topology.nodes.length} nodes and ${topology.links.length} links.`);
console.log(`Logical structures contain ${networks.length} networks.`);

// Helper to get node type
const getNode = (uuid: string) => topology.nodes.find(n => n.uuid === uuid);

// 1. Validate Nodes and Naming Prefix Alignment
for (const node of topology.nodes) {
  const { uuid, type } = node;
  
  if (type === 'SATELLITE') {
    if (!uuid.startsWith('node-SAT')) {
      console.error(`Error: Satellite node ${uuid} must start with 'node-SAT' prefix.`);
      errors++;
    }
  } else if (type === 'O_CU') {
    if (!uuid.startsWith('CU-node-')) {
      console.error(`Error: BBU/O-CU node ${uuid} must start with 'CU-node-' prefix.`);
      errors++;
    }
  } else if (type === 'OPTICAL_SWITCH') {
    if (!uuid.startsWith('node-') || uuid.startsWith('node-SAT')) {
      console.error(`Error: ROADM node ${uuid} must start with 'node-' prefix and not 'node-SAT'.`);
      errors++;
    }
  } else if (type === 'FSO_TERMINAL') {
    if (!uuid.startsWith('Tightbeam-node-')) {
      console.error(`Error: FSO transponder node ${uuid} must start with 'Tightbeam-node-' prefix.`);
      errors++;
    }
  } else if (type === 'MICROWAVE_RADIO') {
    if (!uuid.startsWith('Microwave-node-')) {
      console.error(`Error: Microwave radio node ${uuid} must start with 'Microwave-node-' prefix.`);
      errors++;
    }
  } else {
    console.error(`Error: Node ${uuid} has unknown type ${type}.`);
    errors++;
  }
}

// 2. Validate Physical Links against the Connection Truth Matrix
for (const link of topology.links) {
  const { uuid, sourceNodeUuid, sourcePortUuid, targetNodeUuid, targetPortUuid, layer, capacity } = link;
  const linkType = link.inventoryMappingAttributes?.linkType;

  if (!linkType) {
    console.error(`Error: Link ${uuid} is missing linkType!`);
    errors++;
    continue;
  }

  const sourceNode = getNode(sourceNodeUuid);
  const targetNode = getNode(targetNodeUuid);

  if (!sourceNode || !targetNode) {
    console.error(`Error: Link ${uuid} references non-existent endpoints: ${sourceNodeUuid} -> ${targetNodeUuid}`);
    errors++;
    continue;
  }

  const t1 = sourceNode.type;
  const t2 = targetNode.type;

  // Enforce Matrix Rules based on endpoint types, not link self-reported linkType
  let expectedLinkType = '';
  let expectedLayer = '';
  let expectedCapacity = '';
  let expectedProtection = '';
  let expectedRestoration = '';

  if (t1 === 'OPTICAL_SWITCH' && t2 === 'OPTICAL_SWITCH') {
    expectedLinkType = 'fiber';
    expectedLayer = 'L0 (Optical)';
    expectedCapacity = '800 Gbps';
    expectedProtection = '1+1 Optical Backup';
    expectedRestoration = 'Enabled (WSON Phase)';
  } else if ((t1 === 'O_CU' && t2 === 'OPTICAL_SWITCH') || (t1 === 'OPTICAL_SWITCH' && t2 === 'O_CU')) {
    expectedLinkType = 'fiber';
    expectedLayer = 'L2 (Ethernet)';
    expectedCapacity = '100 Gbps';
    expectedProtection = 'none';
    expectedRestoration = 'none';
  } else if ((t1 === 'O_CU' && (t2 === 'FSO_TERMINAL' || t2 === 'MICROWAVE_RADIO')) || 
             ((t1 === 'FSO_TERMINAL' || t1 === 'MICROWAVE_RADIO') && t2 === 'O_CU')) {
    expectedLinkType = 'fiber'; // local fiber backhaul cable inside the station hut
    expectedLayer = 'L2 (Ethernet)';
    expectedCapacity = '100 Gbps';
    expectedProtection = 'none';
    expectedRestoration = 'none';
  } else if (t1 === 'SATELLITE' && t2 === 'SATELLITE') {
    expectedLinkType = 'free-space-optics'; // Inter-Satellite laser links
    expectedLayer = 'L2 (Ethernet)';
    expectedCapacity = '100 Gbps';
    expectedProtection = '1+1 Laser Spatial Diversity';
    expectedRestoration = 'Enabled (Spacetime Weather Routing)';
  } else if ((t1 === 'FSO_TERMINAL' && t2 === 'SATELLITE') || (t1 === 'SATELLITE' && t2 === 'FSO_TERMINAL')) {
    expectedLinkType = 'free-space-optics';
    expectedLayer = 'Mobile (RAN/Core)';
    expectedCapacity = '10 Gbps';
    expectedProtection = '1+1 Laser Spatial Diversity';
    expectedRestoration = 'Enabled (Spacetime Weather Routing)';
  } else if ((t1 === 'MICROWAVE_RADIO' && t2 === 'SATELLITE') || (t1 === 'SATELLITE' && t2 === 'MICROWAVE_RADIO')) {
    expectedLinkType = 'microwave';
    expectedLayer = 'Mobile (RAN/Core)';
    expectedCapacity = '10 Gbps';
    expectedProtection = '1+1 Microwave Hot Standby';
    expectedRestoration = 'Enabled (Hitless ACM)';
  } else {
    console.error(`Error: Link ${uuid} represents an illegal connection archetype: ${sourceNodeUuid} (${t1}) <-> ${targetNodeUuid} (${t2})`);
    errors++;
    continue;
  }

  // Assertions against the matrix truth values
  if (linkType !== expectedLinkType) {
    console.error(`Error: Link ${uuid} type is '${linkType}' but physically must be '${expectedLinkType}' for endpoints ${t1} <-> ${t2}.`);
    errors++;
  }

  if (layer !== expectedLayer) {
    console.error(`Error: Link ${uuid} network layer is '${layer}' but must be '${expectedLayer}' for endpoints ${t1} <-> ${t2}.`);
    errors++;
  }

  if (capacity !== expectedCapacity) {
    console.error(`Error: Link ${uuid} capacity is '${capacity}' but must be '${expectedCapacity}' for endpoints ${t1} <-> ${t2}.`);
    errors++;
  }

  const { protectionType, dynamicRestoration } = link.protection || {};
  if (protectionType !== expectedProtection) {
    console.error(`Error: Link ${uuid} protection type is '${protectionType}' but must be '${expectedProtection}' for endpoints ${t1} <-> ${t2}.`);
    errors++;
  }

  if (dynamicRestoration !== expectedRestoration) {
    console.error(`Error: Link ${uuid} dynamic restoration is '${dynamicRestoration}' but must be '${expectedRestoration}' for endpoints ${t1} <-> ${t2}.`);
    errors++;
  }

  // Verify ports exist in nodes' hardware and ietfInterfaces lists
  const sourceNodeObj = sourceNode;
  const targetNodeObj = targetNode;

  const sourceInterface = sourceNodeObj.ietfInterfaces?.find(i => i.name === sourcePortUuid);
  const targetInterface = targetNodeObj.ietfInterfaces?.find(i => i.name === targetPortUuid);

  if (!sourceInterface) {
    console.error(`Error: Link ${uuid} sourcePort '${sourcePortUuid}' does not exist as an interface on node ${sourceNodeUuid}.`);
    errors++;
  }

  if (!targetInterface) {
    console.error(`Error: Link ${uuid} targetPort '${targetPortUuid}' does not exist as an interface on node ${targetNodeUuid}.`);
    errors++;
  }

  const sourceHwPort = sourceNodeObj.hardware.find(h => h.class === 'port' && h.uuid === `hw-port-${sourceNodeUuid}-${sourcePortUuid.replace('/', '-')}`);
  const targetHwPort = targetNodeObj.hardware.find(h => h.class === 'port' && h.uuid === `hw-port-${targetNodeUuid}-${targetPortUuid.replace('/', '-')}`);

  if (!sourceHwPort) {
    console.error(`Error: Link ${uuid} sourcePort '${sourcePortUuid}' is missing corresponding hardware port in node ${sourceNodeUuid}.`);
    errors++;
  }

  if (!targetHwPort) {
    console.error(`Error: Link ${uuid} targetPort '${targetPortUuid}' is missing corresponding hardware port in node ${targetNodeUuid}.`);
    errors++;
  }
}

// 3. Validate RFC8345 Logical Networks against physical references
for (const net of networks) {
  for (const node of net.nodes) {
    const { nodeId, activeNeRef, supportingNodes, terminationPoints } = node;

    if (activeNeRef) {
      const activeNode = getNode(activeNeRef);
      if (!activeNode) {
        console.error(`Error: Logical Node ${nodeId} references non-existent active node ${activeNeRef} under activeNeRef.`);
        errors++;
      }
    }

    if (supportingNodes) {
      for (const sn of supportingNodes) {
        const uNet = networks.find(n => n.networkId === sn.networkRef);
        if (!uNet) {
          console.error(`Error: Logical Node ${nodeId} supporting node references non-existent network ${sn.networkRef}.`);
          errors++;
        } else {
          const uNode = uNet.nodes.find(n => n.nodeId === sn.nodeRef);
          if (!uNode) {
            console.error(`Error: Logical Node ${nodeId} supporting node references non-existent node ${sn.nodeRef} in network ${sn.networkRef}.`);
            errors++;
          }
        }
      }
    }

    if (terminationPoints) {
      for (const tp of terminationPoints) {
        const { tpId, activePortRef, supportingTerminationPoints } = tp;

        if (activePortRef && activeNeRef) {
          const activeNode = getNode(activeNeRef);
          if (activeNode) {
            const hasPort = activeNode.ietfInterfaces?.some(i => i.name === activePortRef);
            if (!hasPort) {
              console.error(`Error: Logical TP ${tpId} under ${nodeId} references non-existent active port '${activePortRef}' on node ${activeNeRef}.`);
              errors++;
            }
          }
        }

        if (supportingTerminationPoints) {
          for (const stp of supportingTerminationPoints) {
            const uNet = networks.find(n => n.networkId === stp.networkRef);
            if (!uNet) {
              console.error(`Error: Logical TP ${tpId} supporting TP references non-existent network ${stp.networkRef}.`);
              errors++;
            } else {
              const uNode = uNet.nodes.find(n => n.nodeId === stp.nodeRef);
              if (!uNode) {
                console.error(`Error: Logical TP ${tpId} supporting TP references non-existent node ${stp.nodeRef} in network ${stp.networkRef}.`);
                errors++;
              } else {
                const uTp = uNode.terminationPoints?.some(t => t.tpId === stp.tpRef);
                if (!uTp) {
                  console.error(`Error: Logical TP ${tpId} supporting TP references non-existent TP ${stp.tpRef} under node ${stp.nodeRef} in network ${stp.networkRef}.`);
                  errors++;
                }
              }
            }
          }
        }
      }
    }
  }

  if (net.links) {
    for (const link of net.links) {
      const { linkId, source, destination, supportingLinks } = link;

      const srcNode = net.nodes.find(n => n.nodeId === source.sourceNode);
      const destNode = net.nodes.find(n => n.nodeId === destination.destNode);

      if (!srcNode) {
        console.error(`Error: Link ${linkId} in network ${net.networkId} references non-existent sourceNode ${source.sourceNode}.`);
        errors++;
      } else {
        const hasTp = srcNode.terminationPoints?.some(tp => tp.tpId === source.sourceTp);
        if (!hasTp) {
          console.error(`Error: Link ${linkId} in network ${net.networkId} references non-existent sourceTp ${source.sourceTp} on node ${source.sourceNode}.`);
          errors++;
        }
      }

      if (!destNode) {
        console.error(`Error: Link ${linkId} in network ${net.networkId} references non-existent destNode ${destination.destNode}.`);
        errors++;
      } else {
        const hasTp = destNode.terminationPoints?.some(tp => tp.tpId === destination.destTp);
        if (!hasTp) {
          console.error(`Error: Link ${linkId} in network ${net.networkId} references non-existent destTp ${destination.destTp} on node ${destination.destNode}.`);
          errors++;
        }
      }

      if (!(link as any).teMetrics || !(link as any).protection) {
        console.error(`Error: Logical Link ${link.linkId} in network ${net.networkId} is missing teMetrics or protection!`);
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(`Strict validation failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log('Strict seeding validations passed successfully! 100% of physical and logical links align perfectly with the connection truth matrix.');
  process.exit(0);
}
