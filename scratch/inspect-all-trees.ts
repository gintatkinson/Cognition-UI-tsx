import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, connectFirestoreEmulator } from 'firebase/firestore';
import { NetworkElement, HardwareComponent } from '../src/types';
import { MOCK_DEVICES } from '../src/lib/mock-data';

const app = initializeApp({ projectId: 'demo-cognition-topology' });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function inspectAllTrees() {
  console.log('Fetching database nodes...');
  const nodesSnap = await getDocs(collection(db, 'nodes'));
  const dbNodes = nodesSnap.docs.map(d => d.data() as NetworkElement);

  // Replicate the hardware mapping for mock nodes from networkService.ts
  const mappedMockNodes: NetworkElement[] = MOCK_DEVICES.map(dev => {
    return {
      uuid: dev.id,
      name: dev.name,
      type: dev.type as any,
      layer: dev.type as any,
      location: 'Legacy Mock Region',
      ietfSystem: {
        hostname: dev.name,
        contact: 'noc@legacy.net',
        platform: { osName: 'MockOS', osRelease: '1.0', osVersion: '1.0', machine: 'x86_64' },
        clock: { timezoneName: 'Asia/Tokyo', currentDatetime: new Date().toISOString() }
      },
      ietfInterfaces: dev.endpoints.map((ep: string) => ({
        name: ep,
        type: ep.startsWith('q') ? 'iana-if-type:opticalChannel' : 'iana-if-type:ethernetCsmacd',
        enabled: dev.status === 'OPERATIONAL',
        adminStatus: dev.status === 'OPERATIONAL' ? 'up' : 'down',
        operStatus: dev.status === 'OPERATIONAL' ? 'up' : 'down',
        speed: ep.startsWith('q') ? 1200000 : 100000000000,
        physAddress: ep.startsWith('q') ? 'N/A' : `00:1A:2B:3C:${dev.id === 'd1' ? '11' : '22'}:${ep === 'eth0' ? '00' : '01'}`,
        description: `Active legacy mock ${ep.startsWith('q') ? 'quantum' : 'ethernet'} interface`
      })),
      hardware: [
        {
          uuid: `hw-ch-${dev.id}`,
          name: `${dev.name} Chassis`,
          class: 'chassis',
          manufacturer: 'Legacy Vendor',
          partNumber: 'MOCK-HW',
          serialNumber: `SN-${dev.id.toUpperCase()}`,
          status: 'active' as const
        },
        ...dev.endpoints.flatMap((ep: string) => [
          {
            uuid: `hw-port-${dev.id}-${ep.replace('/', '-')}`,
            name: `Physical Port ${ep}`,
            class: 'port',
            parentUuid: `hw-ch-${dev.id}`,
            manufacturer: 'Legacy Vendor',
            partNumber: 'MOCK-PORT',
            serialNumber: `SN-${dev.id.toUpperCase()}-PRT-${ep.toUpperCase().replace('/', '-')}`,
            status: 'active' as const
          },
          {
            uuid: `hw-tcvr-${dev.id}-${ep.replace('/', '-')}`,
            name: `SFP Transceiver - ${ep}`,
            class: 'transceiver',
            parentUuid: `hw-port-${dev.id}-${ep.replace('/', '-')}`,
            manufacturer: 'Legacy Vendor',
            partNumber: 'MOCK-SFP',
            serialNumber: `SN-${dev.id.toUpperCase()}-SFP-${ep.toUpperCase().replace('/', '-')}`,
            status: 'active' as const
          }
        ])
      ],
      services: []
    };
  });

  const allNodes = [...dbNodes, ...mappedMockNodes];
  console.log(`Inspecting ${allNodes.length} devices...`);

  let errors = 0;

  allNodes.forEach(node => {
    console.log(`\nDevice: ${node.name} (${node.uuid}) - Type: ${node.type}`);
    
    // 1. Verify Chassis
    const chassis = node.hardware?.filter(hw => hw.class === 'chassis');
    if (!chassis || chassis.length === 0) {
      console.log(`  ❌ ERROR: No chassis found in hardware list!`);
      errors++;
    } else {
      console.log(`  ✓ Chassis found: ${chassis.map(c => c.name).join(', ')}`);
    }

    // 2. Verify Interfaces have matching hardware ports
    if (node.ietfInterfaces && node.ietfInterfaces.length > 0) {
      node.ietfInterfaces.forEach(iface => {
        const normalizedName = iface.name.replace('/', '-');
        const matchedPort = node.hardware?.find(hw => {
          return hw.class === 'port' && (
            hw.uuid.endsWith(`-${normalizedName}`) ||
            hw.uuid.endsWith(`/${iface.name}`) ||
            hw.uuid === normalizedName ||
            hw.name === iface.name ||
            hw.name === `Physical Port ${iface.name}` ||
            hw.name === `Port ${iface.name}`
          );
        });

        if (!matchedPort) {
          console.log(`  ❌ ERROR: Interface '${iface.name}' has no matching hardware port!`);
          errors++;
        } else {
          // Verify Port has an SFP transceiver parented to it (if not a fixed backhaul/microwave/FSO port)
          const isFixed = matchedPort.name.includes('Fixed') || 
                          matchedPort.name.includes('Microwave') || 
                          matchedPort.name.includes('FSO');
          
          const childTransceiver = node.hardware?.find(
            hw => hw.class === 'transceiver' && hw.parentUuid === matchedPort.uuid
          );

          if (!childTransceiver && !isFixed) {
            console.log(`  ⚠️ WARNING: Port '${matchedPort.name}' (${matchedPort.uuid}) has no child SFP transceiver (empty cage or fixed port).`);
          } else if (childTransceiver) {
            console.log(`  ✓ Port '${iface.name}' matches hardware port '${matchedPort.name}' with transceiver '${childTransceiver.name}'`);
          } else {
            console.log(`  ✓ Port '${iface.name}' matches hardware port '${matchedPort.name}' (Fixed)`);
          }
        }
      });
    } else {
      console.log(`  ℹ️ No logical interfaces defined.`);
    }

    if (node.hardware) {
      node.hardware.forEach(comp => {
        if (comp.assetId) return; // Skip passive assetId components
        if (!comp.partNumber || comp.partNumber === '---' || comp.partNumber.trim() === '') {
          console.log(`  ❌ ERROR: Hardware component '${comp.name}' (${comp.uuid}) is missing a valid partNumber!`);
          errors++;
        }
        const needsFullIdentity = ['chassis', 'module', 'port', 'transceiver'].includes(comp.class);
        if (needsFullIdentity) {
          if (!comp.manufacturer || comp.manufacturer.trim() === '') {
            console.log(`  ❌ ERROR: Hardware component '${comp.name}' (${comp.uuid}) of class '${comp.class}' is missing manufacturer!`);
            errors++;
          }
          if (!comp.serialNumber || comp.serialNumber.trim() === '') {
            console.log(`  ❌ ERROR: Hardware component '${comp.name}' (${comp.uuid}) of class '${comp.class}' is missing serialNumber!`);
            errors++;
          }
        }
      });
    }
  });

  console.log(`\n=== INSPECTION COMPLETED ===`);
  console.log(`Total verified devices: ${allNodes.length}`);
  console.log(`Total structural errors found: ${errors}`);
  console.log(`============================\n`);
  process.exit(errors > 0 ? 1 : 0);
}

inspectAllTrees().catch(err => {
  console.error(err);
  process.exit(1);
});
