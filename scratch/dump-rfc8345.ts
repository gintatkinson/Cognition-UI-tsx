import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';

const app = initializeApp({ projectId: 'demo-cognition-topology' });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function dump() {
  const rfcSnap = await getDocs(collection(db, 'rfc8345-networks'));
  for (const d of rfcSnap.docs) {
    const net = d.data();
    console.log('Network ID:', net.networkId);
    if (net.networkId === 'overlay-L3') {
      const osNode = net.nodes.find((n: any) => n.nodeId === 'node-L3-OS-router');
      console.log('OS Node found:', JSON.stringify(osNode, null, 2));
    }
  }
  process.exit(0);
}
dump();
