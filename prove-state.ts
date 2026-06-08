import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';
import { NetworkElement } from './src/types';

const app = initializeApp({ projectId: 'demo-cognition-topology' });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function prove() {
  const nodesSnap = await getDocs(collection(db, 'nodes'));
  const nodes = nodesSnap.docs.map(d => d.data() as NetworkElement);

  let ocuCount = 0, mwCount = 0, fsoCount = 0, satCount = 0, otherCount = 0;
  let serverStrings = 0, dwdmLeaks = 0;

  nodes.forEach(node => {
    const nodeStr = JSON.stringify(node).toLowerCase();
    if (nodeStr.includes('server')) serverStrings++;

    if (node.type === 'O_CU') {
      ocuCount++;
      if (node.hardware?.some(hw => hw.name.toLowerCase().includes('server'))) serverStrings++;
      if (node.ietfInterfaces?.some(i => i.type.includes('opticalChannel'))) dwdmLeaks++;
    } else if (node.type === 'MICROWAVE_RADIO') {
      mwCount++;
      if (!node.uuid.startsWith('Microwave-node')) console.log('MW UUID FAIL:', node.uuid);
      if (node.ietfSystem?.platform?.osName !== 'MINI-LINK OS') console.log('MW OS FAIL:', node.ietfSystem?.platform?.osName);
      if (!node.ietfInterfaces?.some(i => i.name === 'rf-1/1')) console.log('MW IFACE FAIL');
      if (node.ietfInterfaces?.some(i => i.type.includes('opticalChannel'))) dwdmLeaks++;
    } else if (node.type === 'FSO_TERMINAL') {
      fsoCount++;
      if (!node.uuid.startsWith('Tightbeam-node')) console.log('FSO UUID FAIL:', node.uuid);
      if (!node.ietfInterfaces?.some(i => i.name === 'fso-1/1')) console.log('FSO IFACE FAIL');
    } else if (node.type === 'SATELLITE') {
      satCount++;
      if (!node.hardware?.some(hw => hw.name.includes('AESA'))) console.log('SAT AESA FAIL');
    } else {
      otherCount++;
    }
  });

  console.log(`\n=== PROOF REPORT ===`);
  console.log(`Total Nodes: ${nodes.length}`);
  console.log(`O-CU Nodes: ${ocuCount}`);
  console.log(`Microwave Radios: ${mwCount}`);
  console.log(`Tightbeam Terminals: ${fsoCount}`);
  console.log(`Satellites: ${satCount}`);
  console.log(`Other (Optical Core): ${otherCount}`);
  console.log(`\n=== ANOMALIES ===`);
  console.log(`Nodes containing the word 'server': ${serverStrings}`);
  console.log(`Nodes with leaked DWDM opticalChannels: ${dwdmLeaks}`);
  console.log(`====================\n`);
  process.exit(0);
}
prove();
