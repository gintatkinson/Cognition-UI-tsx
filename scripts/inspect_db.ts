import { getJapaneseNTNTopology } from '../src/lib/mock-japanese-topology';
import { getRFC8345Networks } from '../src/lib/mock-inventory';

const topology = getJapaneseNTNTopology();
const networks = getRFC8345Networks();

console.log('=== MANUAL SEMANTIC AUDIT ===\n');

// 1. Inspect Tateyama Node (Tateyama is microwave-only site, ID is Microwave-node-TH_OTE)
const tateyamaNode = topology.nodes.find(n => n.uuid === 'Microwave-node-TH_OTE');
console.log('--- 1. Node: Microwave-node-TH_OTE ---');
if (tateyamaNode) {
  console.log(`Name:        ${tateyamaNode.name}`);
  console.log(`Type:        ${tateyamaNode.type}`);
  console.log(`Layer:       ${tateyamaNode.layer}`);
  console.log(`Location:    ${tateyamaNode.location}`);
  console.log('Hardware Containment Hierarchy:');
  tateyamaNode.hardware.forEach(h => {
    console.log(`  - [Class: ${h.class}] ${h.name} (Part: ${h.partNumber || 'N/A'}, Serial: ${h.serialNumber || 'N/A'}, Parent: ${h.parentUuid || 'None'})`);
  });
} else {
  console.log('ERROR: Tateyama node not found!');
}
console.log();

// 2. Inspect Chiba Node (Chiba is FSO site, ID is Tightbeam-node-CC1)
const chibaNode = topology.nodes.find(n => n.uuid === 'Tightbeam-node-CC1');
console.log('--- 2. Node: Tightbeam-node-CC1 ---');
if (chibaNode) {
  console.log(`Name:        ${chibaNode.name}`);
  console.log(`Type:        ${chibaNode.type}`);
  console.log(`Location:    ${chibaNode.location}`);
  console.log('Hardware Containment Hierarchy (Sample):');
  chibaNode.hardware.slice(0, 5).forEach(h => {
    console.log(`  - [Class: ${h.class}] ${h.name} (Part: ${h.partNumber || 'N/A'}, Parent: ${h.parentUuid || 'None'})`);
  });
} else {
  console.log('ERROR: Chiba node not found!');
}
console.log();

// 3. Inspect Fukuoka FSO Link to Satellite-4 (link-Tightbeam-node-FK_TJ-node-SAT4)
const fukuokaLink = topology.links.find(l => l.uuid === 'link-Tightbeam-node-FK_TJ-node-SAT4');
console.log('--- 3. Link: link-Tightbeam-node-FK_TJ-node-SAT4 ---');
if (fukuokaLink) {
  console.log(`Type:                  ${fukuokaLink.inventoryMappingAttributes?.linkType}`);
  console.log(`Capacity:              ${fukuokaLink.capacity}`);
  console.log(`Layer:                 ${fukuokaLink.layer}`);
  console.log(`Delay:                 ${fukuokaLink.teMetrics?.oneWayDelay}`);
  console.log(`Protection Type:       ${fukuokaLink.protection?.protectionType}`);
  console.log(`Dynamic Restoration:   ${fukuokaLink.protection?.dynamicRestoration}`);
} else {
  console.log('ERROR: Fukuoka satellite link not found!');
}
console.log();

// 4. Inspect Local BBU to ROADM Link (e.g. Tokyo node-TK1 <-> CU-node-TK1)
const localLink = topology.links.find(l => l.uuid === 'link-node-TK1-CU-node-TK1');
console.log('--- 4. Link: link-node-TK1-CU-node-TK1 ---');
if (localLink) {
  console.log(`Type:                  ${localLink.inventoryMappingAttributes?.linkType}`);
  console.log(`Capacity:              ${localLink.capacity}`);
  console.log(`Layer:                 ${localLink.layer}`);
  console.log(`Protection Type:       ${localLink.protection?.protectionType}`);
  console.log(`Dynamic Restoration:   ${localLink.protection?.dynamicRestoration}`);
} else {
  console.log('ERROR: Local link not found!');
}
console.log();

// 5. Inspect Logical Network overlay mappings
const l3Network = networks.find(n => n.networkId === 'overlay-L3');
console.log('--- 5. Logical Network overlay-L3 Nodes ---');
if (l3Network) {
  l3Network.nodes.slice(0, 3).forEach(n => {
    console.log(`  Node ID: ${n.nodeId}`);
    console.log(`    Active NE Reference: ${n.activeNeRef}`);
    console.log(`    Supporting Nodes:     ${JSON.stringify(n.supportingNodes)}`);
    console.log(`    Active Port Binds (Sample):`);
    n.terminationPoints?.slice(0, 2).forEach(tp => {
      console.log(`      - TP: ${tp.tpId} maps to Active Port: ${tp.activePortRef}`);
    });
  });
} else {
  console.log('ERROR: Logical L3 network not found!');
}
