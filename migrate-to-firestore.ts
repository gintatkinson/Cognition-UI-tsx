import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc, connectFirestoreEmulator } from 'firebase/firestore';
import { getJapaneseNTNTopology } from './src/lib/japanese-ntn-generator';
import { getPassiveDevices, getPassiveCables, getRFC8345Networks } from './src/lib/mock-inventory';

const app = initializeApp({ projectId: 'demo-cognition-topology' });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function migrate() {
  console.log('Starting migration to Firestore...');
  console.log('Clearing old collections to purge orphaned data...');
  const collectionsToClear = ['nodes', 'links', 'passive-devices', 'passive-cables', 'rfc8345-networks'];
  for (const collName of collectionsToClear) {
    const querySnapshot = await getDocs(collection(db, collName));
    for (const d of querySnapshot.docs) {
      await deleteDoc(d.ref);
    }
    console.log(`Cleared collection: ${collName}`);
  }

  const topology = getJapaneseNTNTopology();
  
  for (const node of topology.nodes) {
    await setDoc(doc(db, 'nodes', node.uuid), node);
    console.log(`Saved node: ${node.uuid} as ${node.name}`);
  }

  for (const link of topology.links) {
    await setDoc(doc(db, 'links', link.uuid), link);
    console.log(`Saved link: ${link.uuid}`);
  }

  // Seed Passive Devices
  const passiveDevices = getPassiveDevices();
  for (const pd of passiveDevices) {
    await setDoc(doc(db, 'passive-devices', pd.id), pd);
    console.log(`Saved passive-device: ${pd.id}`);
  }

  // Seed Passive Cables
  const passiveCables = getPassiveCables();
  for (const pc of passiveCables) {
    await setDoc(doc(db, 'passive-cables', pc.id), pc);
    console.log(`Saved passive-cable: ${pc.id}`);
  }

  // Seed RFC8345 Networks
  const rfcNetworks = getRFC8345Networks();
  for (const net of rfcNetworks) {
    await setDoc(doc(db, 'rfc8345-networks', net.networkId), net);
    console.log(`Saved rfc8345-network: ${net.networkId}`);
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(console.error);

