import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';
import { NetworkElement, NetworkLink } from './src/types';

const app = initializeApp({ projectId: 'demo-cognition-topology' });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function validateDatabase() {
  console.log('--- Starting Database Validation Audit ---');
  let errors = 0;
  let warnings = 0;

  const nodesSnap = await getDocs(collection(db, 'nodes'));
  const linksSnap = await getDocs(collection(db, 'links'));

  const nodes = nodesSnap.docs.map(d => d.data() as NetworkElement);
  const links = linksSnap.docs.map(d => d.data() as NetworkLink);

  const nodeMap = new Map<string, NetworkElement>();
  nodes.forEach(n => nodeMap.set(n.uuid, n));

  console.log(`Auditing ${nodes.length} Nodes...`);

  nodes.forEach(node => {
    // Check O-CU specifics
    if (node.type === 'O_CU') {
      if ((node as any).gridConfig) {
        console.error(`❌ ERROR: O-CU Node ${node.uuid} has a Layer 0 gridConfig.`);
        errors++;
      }
      if (node.ietfInterfaces?.some(i => i.type.includes('opticalChannel'))) {
        console.error(`❌ ERROR: O-CU Node ${node.uuid} has opticalChannel interfaces.`);
        errors++;
      }
    }

    // Check MICROWAVE_RADIO specifics
    if (node.type === 'MICROWAVE_RADIO') {
      if ((node as any).gridConfig) {
        console.error(`❌ ERROR: Microwave Node ${node.uuid} has a Layer 0 gridConfig.`);
        errors++;
      }
      if (node.hardware?.some(hw => hw.name.includes('FSO') || hw.name.includes('WaveLogic'))) {
        console.error(`❌ ERROR: Microwave Node ${node.uuid} has FSO or WaveLogic hardware.`);
        errors++;
      }
    }

    // Check gNB_NTN specifics
    if (node.type === 'gNB_NTN') {
      if (node.hardware?.some(hw => hw.name.includes('WaveLogic') || hw.name.includes('Optic'))) {
        console.error(`❌ ERROR: gNB_NTN Node ${node.uuid} has WaveLogic or Optical transceiver hardware.`);
        errors++;
      }
      if (node.ietfInterfaces?.some(i => i.type.includes('opticalChannel'))) {
        console.error(`❌ ERROR: gNB_NTN Node ${node.uuid} has opticalChannel interfaces.`);
        errors++;
      }
    }
  });

  console.log(`Auditing ${links.length} Links for Referential Integrity...`);

  links.forEach(link => {
    const srcNode = nodeMap.get(link.sourceNodeUuid);
    const tgtNode = nodeMap.get(link.targetNodeUuid);

    if (!srcNode) {
      console.error(`❌ ERROR: Link ${link.uuid} references missing sourceNodeUuid: ${link.sourceNodeUuid}`);
      errors++;
    }
    if (!tgtNode) {
      console.error(`❌ ERROR: Link ${link.uuid} references missing targetNodeUuid: ${link.targetNodeUuid}`);
      errors++;
    }

    // Check link type logic
    const linkType = link.inventoryMappingAttributes?.linkType;
    if (srcNode?.uuid.includes('SAT') && tgtNode?.uuid.includes('SAT') && linkType !== 'free-space-optics') {
      console.error(`❌ ERROR: ISL Link ${link.uuid} must be free-space-optics, but is ${linkType}`);
      errors++;
    }
  });

  console.log('--- Audit Complete ---');
  if (errors === 0) {
    console.log(`✅ SUCCESS: Zero errors found.`);
    process.exit(0);
  } else {
    console.error(`🛑 FAILED: Found ${errors} errors.`);
    process.exit(1);
  }
}

validateDatabase().catch(e => {
  console.error('Audit failed to execute:', e);
  process.exit(1);
});
