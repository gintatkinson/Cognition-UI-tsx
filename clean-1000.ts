import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, connectFirestoreEmulator } from 'firebase/firestore';
import { NetworkElement } from './src/types';

const app = initializeApp({ projectId: 'demo-cognition-topology' });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function clean() {
  const nodesSnap = await getDocs(collection(db, 'nodes'));
  const nodes = nodesSnap.docs.map(d => d.data() as NetworkElement);

  for (const node of nodes) {
    if (node.type !== 'OPTICAL_SWITCH') {
      delete (node as any).gridConfig;
      // also clean any stray optical channel interfaces if they leaked
      if (node.ietfInterfaces) {
        if (node.type === 'O_CU' || node.type === 'MICROWAVE_RADIO' || node.type === 'SATELLITE') {
           // Satellites can have opticalChannel for ISL, FSO has it for frontside
        }
      }
    }
    await setDoc(doc(db, 'nodes', node.uuid), node);
  }
  console.log('Cleaned stray DWDM properties.');
  process.exit(0);
}
clean();
