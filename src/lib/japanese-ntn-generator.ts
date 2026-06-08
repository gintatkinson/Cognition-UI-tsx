import { NetworkTopology, NetworkElement, NetworkLayer, HardwareComponent } from '../types';

export const sites = [
  { id: 'TK1', name: 'Tokyo', lat: 35.6881, lon: 139.7635, siteName: 'Tokyo Central Ground Station', isFso: false },
  { id: 'TH_OTE', name: 'Tateyama', lat: 34.9972, lon: 139.8617, siteName: 'Tateyama Optical/RF Exchange', isFso: false },
  { id: 'TY1', name: 'Toyama', lat: 36.6959, lon: 137.2137, siteName: 'Toyama Ground Station Site', isFso: false },
  { id: 'CC1', name: 'Chiba', lat: 35.6074, lon: 140.1063, siteName: 'Chiba Lasers Exchange Hub', isFso: true },
  { id: 'FUJI_SUMMIT', name: 'Fuji Summit', lat: 35.3606, lon: 138.7278, siteName: 'Mt. Fuji Summit Observatory', isFso: false },
  { id: 'TYO2', name: 'Tokyo Otemachi', lat: 35.6872, lon: 139.7644, siteName: 'Otemachi Optical Core Node', isFso: true },
  { id: 'M_CLS', name: 'Miura Cls', lat: 35.1432, lon: 139.6202, siteName: 'Miura Cable Landing Station', isFso: false },
  { id: 'OS1', name: 'Osaka', lat: 34.6937, lon: 135.5023, siteName: 'Osaka Ground Terminal Exchange', isFso: true },
  { id: 'OS3', name: 'Osaka Business Park', lat: 34.6942, lon: 135.5348, siteName: 'Osaka Business Park Exchange', isFso: false },
  { id: 'DC12', name: 'Data Center 12', lat: 35.5489, lon: 139.7844, siteName: 'DC12 Telecom Exchange Hub', isFso: true },
  { id: 'EQ_OS1', name: 'Equinix OS1', lat: 34.6821, lon: 135.4912, siteName: 'Equinix OS1 Exchange', isFso: false },
  { id: 'KOZU', name: 'Kozu Island', lat: 34.2052, lon: 139.1362, siteName: 'Kozu Island Ground Station', isFso: true },
  { id: 'SP_OD', name: 'Sapporo', lat: 43.0621, lon: 141.3544, siteName: 'Sapporo Ground Station Center', isFso: false },
  { id: 'SD_CH', name: 'Sendai', lat: 38.2682, lon: 140.8694, siteName: 'Sendai Lasers Optical Exchange', isFso: true },
  { id: 'NG_SM', name: 'Nagoya', lat: 35.1814, lon: 136.9063, siteName: 'Nagoya Ground Station Hub', isFso: false },
  { id: 'FK_TJ', name: 'Fukuoka', lat: 33.6063, lon: 130.4182, siteName: 'Fukuoka Ground Station Center', isFso: true },
  { id: 'OK_NH', name: 'Okinawa', lat: 26.2124, lon: 127.6809, siteName: 'Okinawa Island Ground Terminal', isFso: false }
];

export const satellites = [
  { id: 'node-SAT1', name: 'LEO-SAT-1', lat: 28.0, lon: 129.0, altitude: 1200000 },
  { id: 'node-SAT2', name: 'LEO-SAT-2', lat: 30.0, lon: 131.0, altitude: 1200000 },
  { id: 'node-SAT3', name: 'LEO-SAT-3', lat: 32.0, lon: 133.0, altitude: 1200000 },
  { id: 'node-SAT4', name: 'LEO-SAT-4', lat: 34.0, lon: 135.0, altitude: 1200000 }
];

function generateMacAddress(nodeId: string, portName: string): string {
  let hash = 0;
  const combined = `${nodeId}-${portName}`;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  const octets = ['00', '1A', '2B'];
  for (let i = 0; i < 3; i++) {
    const val = (hash >> (i * 8)) & 255;
    octets.push(val.toString(16).padStart(2, '0').toUpperCase());
  }
  return octets.join(':');
}

const getFacility = (site: typeof sites[number], room: string, rack: string, position: number, notes = '') => ({
  siteName: site.siteName,
  buildingOrHut: site.isFso ? 'Optical Tower Building' : 'Telco Hut',
  roomOrHall: room,
  rackIdentifier: rack,
  rackPosition: position,
  notes
});

const getGeoLocation = (lat: number, lon: number, height = 10) => ({
  referenceFrame: {
    astronomicalBody: 'earth',
    geodeticSystem: {
      geodeticDatum: 'WGS84',
      coordAccuracy: 1
    }
  },
  location: {
    ellipsoid: {
      latitude: lat,
      longitude: lon,
      height
    }
  }
});

function buildCienaROADM(site: typeof sites[number]): NetworkElement {
  const uuid = `node-${site.id}`;
  const hw: HardwareComponent[] = [];
  const ifaces: any[] = [];

  const chassisId = `hw-ch-${uuid}`;
  const slotId = `hw-slot-${uuid}-1`;
  const moduleId = `hw-mod-${uuid}-trsp`;

  hw.push({
    uuid: chassisId,
    name: site.id === 'FUJI_SUMMIT' ? `FUJI_SUMMIT-OPT-Core` : `Ciena 6500 ROADM Chassis`,
    class: 'chassis',
    manufacturer: 'Ciena Corporation',
    partNumber: 'NTK-5510-ROADM',
    serialNumber: `ROADM-CIENA-${site.id}-732`,
    status: 'active',
    isMain: true
  });

  hw.push({
    uuid: slotId,
    name: `Slot 1 (Line Card Slot)`,
    class: 'container',
    parentUuid: chassisId,
    partNumber: 'ROADM-LC-SLOT',
    status: 'active'
  });

  hw.push({
    uuid: moduleId,
    name: `WaveLogic 5 Extreme Transponder`,
    class: 'module',
    parentUuid: slotId,
    manufacturer: 'Ciena Corporation',
    partNumber: 'WLE5-TRSP',
    serialNumber: `WL5-TRSP-${site.id}-504`,
    status: 'active'
  });

  // Pre-allocate 16 Optical Ports and Transceivers
  for (let idx = 1; idx <= 16; idx++) {
    const portName = `opt-1/${idx}`;
    const portHwId = `hw-port-${uuid}-opt-1-${idx}`;
    const xcvrHwId = `hw-tcvr-${uuid}-opt-1-${idx}`;

    hw.push({
      uuid: portHwId,
      name: `Physical Port ${portName}`,
      class: 'port',
      parentUuid: moduleId,
      manufacturer: 'Ciena Corporation',
      partNumber: 'WLE5-TRSP-PORT',
      serialNumber: `WL5-PORT-${site.id}-${idx}`,
      status: 'active'
    });

    hw.push({
      uuid: xcvrHwId,
      name: `800G coherent ZR Transceiver`,
      class: 'transceiver',
      parentUuid: portHwId,
      manufacturer: 'Ciena Corporation',
      partNumber: 'NTK-800G-ZR',
      serialNumber: `TCVR-WL5-${site.id}-${idx}`,
      status: 'active'
    });

    ifaces.push({
      name: portName,
      type: 'iana-if-type:opticalChannel',
      enabled: false,
      adminStatus: 'down',
      operStatus: 'down',
      speed: 800000000000,
      description: `Pre-allocated optical port ${portName}`
    });
  }

  // Pre-allocate Ethernet backhaul ports (eth-1 to eth-4)
  for (let idx = 1; idx <= 4; idx++) {
    const portName = `eth-${idx}`;
    const portHwId = `hw-port-${uuid}-eth-${idx}`;

    hw.push({
      uuid: portHwId,
      name: `Local Backhaul Port ${portName}`,
      class: 'port',
      parentUuid: chassisId,
      manufacturer: 'Ciena Corporation',
      partNumber: 'NTK-ETH-PORT',
      serialNumber: `WL5-ETH-${site.id}-${idx}`,
      status: 'active'
    });

    // ROADM Ethernet backhaul ports need SFPs for active/connected ports (eth-1)
    if (idx === 1) {
      const xcvrHwId = `hw-tcvr-${uuid}-eth-${idx}`;
      hw.push({
        uuid: xcvrHwId,
        name: `100G BASE-LR4 QSFP28 Transceiver`,
        class: 'transceiver',
        parentUuid: portHwId,
        manufacturer: 'Ciena Corporation',
        partNumber: 'CNA-QSFP28-100G',
        serialNumber: `WL5-ETH-TCV-${site.id}-${idx}`,
        status: 'active'
      });
    }

    ifaces.push({
      name: portName,
      type: 'iana-if-type:ethernetCsmacd',
      physAddress: generateMacAddress(uuid, portName),
      enabled: false,
      adminStatus: 'down',
      operStatus: 'down',
      speed: 100000000000,
      description: `Pre-allocated backhaul port ${portName}`
    });
  }

  return {
    uuid,
    name: site.id === 'FUJI_SUMMIT' ? 'FUJI_SUMMIT-OPT-Core' : `${site.name}-OPT-Core`,
    type: 'OPTICAL_SWITCH',
    layer: NetworkLayer.L0_OPTICAL,
    location: site.id === 'FUJI_SUMMIT' ? 'Mount Fuji' : site.siteName,
    facilityLocation: getFacility(site, 'Optics Exchange Room', `Rack-ROADM-${site.id}`, 15, 'Core optical switch (ROADM)'),
    ietfGeoLocation: getGeoLocation(site.lat, site.lon, site.id === 'FUJI_SUMMIT' ? 3776 : 10),
    ietfInterfaces: ifaces,
    hardware: hw,
    services: [],
    ietfSystem: {
      hostname: `opt-${site.id.toLowerCase()}-01`,
      contact: 'opt-noc@telecom.jp',
      location: `Exchange Room, Rack-ROADM-${site.id}`,
      platform: {
        osName: 'SAOS',
        osRelease: '10.7.1',
        osVersion: '10.7',
        machine: 'x86_64'
      },
      clock: {
        timezoneName: 'Asia/Tokyo',
        currentDatetime: '2026-05-02T02:35:36.539Z'
      }
    }
  };
}

const manufacturers = [
  'NEC Corporation',
  'Fujitsu',
  'Rakuten Symphony'
];

function buildNECBasebandUnit(site: typeof sites[number], index: number): NetworkElement {
  const uuid = `CU-node-${site.id}`;
  const hw: HardwareComponent[] = [];
  const ifaces: any[] = [];

  const chassisId = `hw-ch-${uuid}`;
  const slotId = `hw-slot-${uuid}-cpu`;
  const moduleId = `hw-mod-${uuid}-cpu`;

  const manufacturer = manufacturers[index % manufacturers.length];

  hw.push({
    uuid: chassisId,
    name: `O-CU PNF Chassis`,
    class: 'chassis',
    manufacturer,
    partNumber: 'NTN-CU-BBU',
    serialNumber: `BBU-${manufacturer === 'Fujitsu' ? 'FUJ' : (manufacturer === 'NEC Corporation' ? 'NEC' : 'RKT')}-${site.id}-246`,
    status: 'active',
    isMain: true
  });

  hw.push({
    uuid: slotId,
    name: `Slot CPU (Main Processor Slot)`,
    class: 'container',
    parentUuid: chassisId,
    partNumber: 'BBU-CPU-SLOT',
    status: 'active'
  });

  hw.push({
    uuid: moduleId,
    name: `O-CU Baseband Processing Module`,
    class: 'module',
    parentUuid: slotId,
    manufacturer,
    partNumber: 'NEC-BBU-PROC',
    serialNumber: `PROC-NEC-${site.id}-981`,
    status: 'active'
  });

  // Interfaces eth-1 to eth-16
  for (let idx = 1; idx <= 16; idx++) {
    const portName = `eth-${idx}`;
    const portHwId = `hw-port-${uuid}-eth-${idx}`;

    hw.push({
      uuid: portHwId,
      name: `Physical Port ${portName}`,
      class: 'port',
      parentUuid: moduleId,
      manufacturer: manufacturer,
      partNumber: 'QSFP28-100G-PORT',
      serialNumber: `${manufacturer === 'Fujitsu' ? 'FUJ' : (manufacturer === 'NEC Corporation' ? 'NEC' : 'RKT')}-${site.id}-PRT-${idx}`,
      status: 'active'
    });

    if (idx === 1 || idx === 2) {
      const tcvrHwId = `hw-tcvr-${uuid}-eth-${idx}`;
      hw.push({
        uuid: tcvrHwId,
        name: `100G BASE-LR4 QSFP28 Transceiver`,
        class: 'transceiver',
        parentUuid: portHwId,
        manufacturer: manufacturer,
        partNumber: `${manufacturer === 'Fujitsu' ? 'FUJ' : 'NEC'}-QSFP28-100G-LR4`,
        serialNumber: `BBU-TCV-${site.id}-${idx}`,
        status: 'active'
      });
    }

    ifaces.push({
      name: portName,
      type: 'iana-if-type:ethernetCsmacd',
      physAddress: generateMacAddress(uuid, portName),
      enabled: false,
      adminStatus: 'down',
      operStatus: 'down',
      speed: 100000000000,
      description: `Pre-allocated BBU eCPRI interface port ${portName}`
    });
  }

  return {
    uuid,
    name: `O-CU Baseband Unit`,
    type: 'O_CU',
    layer: NetworkLayer.L3_IP_MPLS,
    location: site.id === 'FUJI_SUMMIT' ? 'Mount Fuji' : 'NTN Ground Station',
    facilityLocation: getFacility(site, 'Router/BBU Hall', `Rack-BBU-${site.id}`, 22, 'Main baseband computing node'),
    ietfGeoLocation: getGeoLocation(site.lat, site.lon, site.id === 'FUJI_SUMMIT' ? 3776 : 10),
    ietfInterfaces: ifaces,
    hardware: hw,
    services: [],
    ietfSystem: {
      hostname: `cu-node-${site.id.toLowerCase()}`,
      contact: 'ntn-ops@telecom.jp',
      platform: {
        osName: 'Wind River Studio RTOS',
        osRelease: '22.12',
        osVersion: '2',
        machine: 'x86_64'
      },
      clock: {
        timezoneName: 'Asia/Tokyo',
        currentDatetime: '2026-05-02T02:35:36.539Z'
      }
    }
  };
}

function buildEricssonMicrowave(site: typeof sites[number]): NetworkElement {
  const uuid = `Microwave-node-${site.id}`;
  const hw: HardwareComponent[] = [];
  const ifaces: any[] = [];

  const chassisId = `hw-ch-${uuid}`;
  const slotId = `hw-slot-${uuid}-radio`;
  const moduleId = `hw-mod-${uuid}-rau`;

  hw.push({
    uuid: chassisId,
    name: `Ericsson MINI-LINK Chassis`,
    class: 'chassis',
    manufacturer: 'Ericsson',
    partNumber: 'MINI-LINK-6366',
    serialNumber: `MW-CH-ERR-${site.id}-192`,
    status: 'active',
    isMain: true
  });

  hw.push({
    uuid: slotId,
    name: `Slot 1 (Radio Module Slot)`,
    class: 'container',
    parentUuid: chassisId,
    partNumber: 'MW-RAU-SLOT',
    status: 'active'
  });

  hw.push({
    uuid: moduleId,
    name: `Microwave Carrier Module`,
    class: 'module',
    parentUuid: slotId,
    manufacturer: 'Ericsson',
    partNumber: 'MINI-LINK-RAU',
    serialNumber: `MW-MOD-ERR-${site.id}-882`,
    status: 'active'
  });

  // Pre-allocate up-down-link-1 to up-down-link-4
  for (let idx = 1; idx <= 4; idx++) {
    const portName = `up-down-link-${idx}`;
    const portHwId = `hw-port-${uuid}-up-down-link-${idx}`;

    const tcvrHwId = `hw-tcvr-${uuid}-up-down-link-${idx}`;

    hw.push({
      uuid: portHwId,
      name: `RF Port ${portName}`,
      class: 'port',
      parentUuid: moduleId,
      manufacturer: 'Ericsson',
      partNumber: 'MINI-LINK-RF-PORT',
      serialNumber: `MW-RF-${site.id}-${idx}`,
      status: 'active'
    });

    hw.push({
      uuid: tcvrHwId,
      name: `E-Band Microwave RF Transceiver`,
      class: 'transceiver',
      parentUuid: portHwId,
      manufacturer: 'Ericsson',
      partNumber: 'MINI-LINK-RAU-TCVR',
      serialNumber: `MW-TCV-${site.id}-${idx}`,
      status: 'active'
    });

    ifaces.push({
      name: portName,
      type: 'iana-if-type:radioMAC',
      enabled: false,
      adminStatus: 'down',
      operStatus: 'down',
      speed: 10000000000,
      description: `Pre-allocated Microwave RF transceiver port ${portName}`
    });
  }

  // Pre-allocate eth-1 to eth-4
  for (let idx = 1; idx <= 4; idx++) {
    const portName = `eth-${idx}`;
    const portHwId = `hw-port-${uuid}-eth-${idx}`;

    hw.push({
      uuid: portHwId,
      name: `BBU Interface Port ${portName}`,
      class: 'port',
      parentUuid: chassisId,
      manufacturer: 'Ericsson',
      partNumber: 'MINI-LINK-BBU-PORT',
      serialNumber: `MW-ETH-${site.id}-${idx}`,
      status: 'active'
    });

    if (idx === 1) {
      const tcvrHwId = `hw-tcvr-${uuid}-eth-${idx}`;
      hw.push({
        uuid: tcvrHwId,
        name: `100G BASE-LR4 QSFP28 Transceiver`,
        class: 'transceiver',
        parentUuid: portHwId,
        manufacturer: 'Ericsson',
        partNumber: 'ERR-QSFP28-100G',
        serialNumber: `MW-ETH-TCV-${site.id}-${idx}`,
        status: 'active'
      });
    }

    ifaces.push({
      name: portName,
      type: 'iana-if-type:ethernetCsmacd',
      physAddress: generateMacAddress(uuid, portName),
      enabled: false,
      adminStatus: 'down',
      operStatus: 'down',
      speed: 100000000000,
      description: `Pre-allocated backhaul port ${portName}`
    });
  }

  return {
    uuid,
    name: `Ericsson MINI-LINK Microwave Radio`,
    type: 'MICROWAVE_RADIO',
    layer: NetworkLayer.L1_TRANSPORT,
    location: site.id === 'FUJI_SUMMIT' ? 'Mount Fuji' : 'NTN Ground Station',
    facilityLocation: getFacility(site, 'RF transponder Cabinet', `Rack-RF-${site.id}`, 8, 'E-Band microwave transponder unit'),
    ietfGeoLocation: getGeoLocation(site.lat, site.lon, site.id === 'FUJI_SUMMIT' ? 3776 : 25),
    ietfInterfaces: ifaces,
    hardware: hw,
    services: [],
    ietfSystem: {
      hostname: `microwave-node-${site.id.toLowerCase()}`,
      contact: 'space-ops@telecom.jp',
      platform: {
        osName: 'MINI-LINK OS',
        osRelease: '10.0',
        osVersion: '2',
        machine: 'arm64'
      },
      clock: {
        timezoneName: 'Asia/Tokyo',
        currentDatetime: '2026-05-02T02:35:36.539Z'
      }
    }
  };
}

function buildAalyriaFsoTerminal(site: typeof sites[number]): NetworkElement {
  const uuid = `Tightbeam-node-${site.id}`;
  const hw: HardwareComponent[] = [];
  const ifaces: any[] = [];

  const chassisId = `hw-ch-${uuid}`;
  const slotId = `hw-slot-${uuid}-laser`;
  const moduleId = `hw-mod-${uuid}-laser`;

  hw.push({
    uuid: chassisId,
    name: `Tightbeam Terminal Enclosure`,
    class: 'chassis',
    manufacturer: 'Aalyria',
    partNumber: 'TIGHTBEAM-ENCLOSURE',
    serialNumber: `FSO-CH-AAL-${site.id}-381`,
    status: 'active',
    isMain: true
  });

  hw.push({
    uuid: slotId,
    name: `Slot 1 (Optical Laser slot)`,
    class: 'container',
    parentUuid: chassisId,
    partNumber: 'FSO-LSR-SLOT',
    status: 'active'
  });

  hw.push({
    uuid: moduleId,
    name: `Tightbeam FSO Modem`,
    class: 'module',
    parentUuid: slotId,
    manufacturer: 'Aalyria',
    partNumber: 'TIGHTBEAM-MODEM',
    serialNumber: `FSO-MOD-AAL-${site.id}-902`,
    status: 'active'
  });

  // Pre-allocate up-down-link-1 to up-down-link-4
  for (let idx = 1; idx <= 4; idx++) {
    const portName = `up-down-link-${idx}`;
    const portHwId = `hw-port-${uuid}-up-down-link-${idx}`;

    const tcvrHwId = `hw-tcvr-${uuid}-up-down-link-${idx}`;

    hw.push({
      uuid: portHwId,
      name: `Laser Port ${portName}`,
      class: 'port',
      parentUuid: moduleId,
      manufacturer: 'Aalyria',
      partNumber: 'TIGHTBEAM-LSR-PORT',
      serialNumber: `FSO-LSR-${site.id}-${idx}`,
      status: 'active'
    });

    hw.push({
      uuid: tcvrHwId,
      name: `Tightbeam FSO Laser Optical Transceiver`,
      class: 'transceiver',
      parentUuid: portHwId,
      manufacturer: 'Aalyria',
      partNumber: 'TIGHTBEAM-LSR-ZR',
      serialNumber: `FSO-TCV-${site.id}-${idx}`,
      status: 'active'
    });

    ifaces.push({
      name: portName,
      type: 'iana-if-type:opticalChannel',
      enabled: false,
      adminStatus: 'down',
      operStatus: 'down',
      speed: 10000000000,
      description: `Pre-allocated FSO Laser transceiver port ${portName}`
    });
  }

  // Pre-allocate eth-1 to eth-4
  for (let idx = 1; idx <= 4; idx++) {
    const portName = `eth-${idx}`;
    const portHwId = `hw-port-${uuid}-eth-${idx}`;

    hw.push({
      uuid: portHwId,
      name: `BBU Connection Port ${portName}`,
      class: 'port',
      parentUuid: chassisId,
      manufacturer: 'Aalyria',
      partNumber: 'TIGHTBEAM-ETH-PORT',
      serialNumber: `FSO-ETH-${site.id}-${idx}`,
      status: 'active'
    });

    if (idx === 1) {
      const tcvrHwId = `hw-tcvr-${uuid}-eth-${idx}`;
      hw.push({
        uuid: tcvrHwId,
        name: `100G BASE-LR4 QSFP28 Transceiver`,
        class: 'transceiver',
        parentUuid: portHwId,
        manufacturer: 'Aalyria',
        partNumber: 'AAL-QSFP28-100G',
        serialNumber: `FSO-ETH-TCV-${site.id}-${idx}`,
        status: 'active'
      });
    }

    ifaces.push({
      name: portName,
      type: 'iana-if-type:ethernetCsmacd',
      physAddress: generateMacAddress(uuid, portName),
      enabled: false,
      adminStatus: 'down',
      operStatus: 'down',
      speed: 100000000000,
      description: `Pre-allocated backhaul port ${portName}`
    });
  }

  return {
    uuid,
    name: `Aalyria Tightbeam Terminal`,
    type: 'FSO_TERMINAL',
    layer: NetworkLayer.L1_TRANSPORT,
    location: site.id === 'FUJI_SUMMIT' ? 'Mount Fuji' : 'NTN Ground Station',
    facilityLocation: getFacility(site, 'Laser Exchange room', `Rack-Laser-${site.id}`, 10, 'FSO coherent optical terminal'),
    ietfGeoLocation: getGeoLocation(site.lat, site.lon, site.id === 'FUJI_SUMMIT' ? 3776 : 30),
    ietfInterfaces: ifaces,
    hardware: hw,
    services: [],
    ietfSystem: {
      hostname: `tightbeam-node-${site.id.toLowerCase()}`,
      contact: 'space-ops@telecom.jp',
      platform: {
        osName: 'TerraOS',
        osRelease: '2.0',
        osVersion: '2',
        machine: 'arm64'
      },
      clock: {
        timezoneName: 'Asia/Tokyo',
        currentDatetime: '2026-05-02T02:35:36.539Z'
      }
    }
  };
}

function buildToshibaSatelliteNode(sat: typeof satellites[number]): NetworkElement {
  const uuid = sat.id;
  const hw: HardwareComponent[] = [];
  const ifaces: any[] = [];

  const chassisId = `hw-ch-${uuid}`;
  const slotId = `hw-slot-${uuid}-payload`;
  const moduleId = `hw-mod-${uuid}-transponder`;

  hw.push({
    uuid: chassisId,
    name: `JAC-Bus300-Telemetry-Chassis`,
    class: 'chassis',
    manufacturer: 'Japan Aerospace Communications',
    partNumber: 'JAC-BUS-300-X1',
    serialNumber: `SAT-CH-${uuid.replace('node-SAT', '')}-001`,
    status: 'active',
    isMain: true
  });

  hw.push({
    uuid: slotId,
    name: `Payload Bay (Payload Integration slot)`,
    class: 'container',
    parentUuid: chassisId,
    partNumber: 'SAT-PL-BAY',
    status: 'active'
  });

  hw.push({
    uuid: moduleId,
    name: `NEC Space Transponder`,
    class: 'module',
    parentUuid: slotId,
    manufacturer: 'NEC Corporation',
    partNumber: 'NEC-DU-LEO',
    serialNumber: `SAT-MOD-${uuid.replace('node-SAT', '')}-005`,
    status: 'active'
  });

  hw.push({
    uuid: `hw-bus-${uuid}`,
    name: `JAC-Bus300-Telemetry-Bus`,
    class: 'module',
    parentUuid: chassisId,
    manufacturer: 'Japan Aerospace Communications',
    partNumber: 'JAC-BUS300',
    serialNumber: `SAT-BUS-${uuid.replace('node-SAT', '')}-102`,
    status: 'active'
  });

  hw.push({
    uuid: `hw-clk-${uuid}`,
    name: `IEEE-1588v2 Space Clock`,
    class: 'module',
    parentUuid: chassisId,
    manufacturer: 'Japan Aerospace Communications',
    partNumber: 'JAC-CLK-90',
    serialNumber: `SAT-CLK-${uuid.replace('node-SAT', '')}-903`,
    status: 'active'
  });

  hw.push({
    uuid: `hw-odu-${uuid}`,
    name: `O-DU Regenerative SoC`,
    class: 'module',
    parentUuid: slotId,
    manufacturer: 'NEC Corporation',
    partNumber: 'NEC-DU-LEO',
    serialNumber: `SAT-ODU-${uuid.replace('node-SAT', '')}-204`,
    status: 'active'
  });

  hw.push({
    uuid: `hw-oru-${uuid}`,
    name: `O-RU Frontend`,
    class: 'module',
    parentUuid: slotId,
    manufacturer: 'Fujitsu Limited',
    partNumber: 'FJ-RU-LEO',
    serialNumber: `SAT-ORU-${uuid.replace('node-SAT', '')}-305`,
    status: 'active'
  });

  hw.push({
    uuid: `hw-aesa-${uuid}`,
    name: `Ka/Ku Phased Array (MHS-AESA)`,
    class: 'module',
    parentUuid: slotId,
    manufacturer: 'Fujitsu Limited',
    partNumber: 'FJ-AESA-40',
    serialNumber: `SAT-AESA-${uuid.replace('node-SAT', '')}-406`,
    status: 'active'
  });

  hw.push({
    uuid: `hw-laser-${uuid}`,
    name: `Coherent Laser Engine`,
    class: 'module',
    parentUuid: slotId,
    manufacturer: 'Toshiba Corporation',
    partNumber: 'TOSH-ISL',
    serialNumber: `SAT-LSR-${uuid.replace('node-SAT', '')}-507`,
    status: 'active'
  });

  // Pre-allocate hardware ports for internal interfaces
  hw.push({
    uuid: `hw-port-${uuid}-open-front-haul`,
    name: `Internal Fronthaul Port`,
    class: 'port',
    parentUuid: `hw-odu-${uuid}`,
    manufacturer: 'NEC Corporation',
    partNumber: 'INT-BBU-FHB',
    serialNumber: `INT-FHB-${uuid.replace('node-SAT', '')}`,
    status: 'active'
  });

  hw.push({
    uuid: `hw-port-${uuid}-f1-u`,
    name: `Internal F1-U Port`,
    class: 'port',
    parentUuid: `hw-odu-${uuid}`,
    manufacturer: 'NEC Corporation',
    partNumber: 'INT-BBU-F1U',
    serialNumber: `INT-F1U-${uuid.replace('node-SAT', '')}`,
    status: 'active'
  });

  ifaces.push({
    name: 'open-front-haul',
    type: 'iana-if-type:ethernetCsmacd',
    physAddress: generateMacAddress(uuid, 'open-front-haul'),
    enabled: true,
    adminStatus: 'up',
    operStatus: 'up',
    speed: 25000000000,
    description: 'Internal O-RAN Option-7.2x fronthaul interface'
  });

  ifaces.push({
    name: 'f1-u',
    type: 'iana-if-type:ethernetCsmacd',
    physAddress: generateMacAddress(uuid, 'f1-u'),
    enabled: true,
    adminStatus: 'up',
    operStatus: 'up',
    speed: 10000000000,
    description: 'Internal F1-U user-plane ground gateway interface'
  });

  // 4 ISL Ports
  for (let idx = 1; idx <= 4; idx++) {
    const portName = `isl-port-${idx}`;
    const portHwId = `hw-port-${uuid}-isl-port-${idx}`;

    const tcvrHwId = `hw-tcvr-${uuid}-isl-port-${idx}`;

    hw.push({
      uuid: portHwId,
      name: `ISL Port ${portName}`,
      class: 'port',
      parentUuid: `hw-laser-${uuid}`,
      manufacturer: 'Toshiba Corporation',
      partNumber: 'TOSH-ISL-PORT',
      serialNumber: `SAT-ISL-PRT-${uuid.replace('node-SAT', '')}-${idx}`,
      status: 'active'
    });

    hw.push({
      uuid: tcvrHwId,
      name: `Inter-Satellite Laser WDM Transceiver`,
      class: 'transceiver',
      parentUuid: portHwId,
      manufacturer: 'Toshiba Corporation',
      partNumber: 'TOSH-ISL-ZR',
      serialNumber: `SAT-ISL-TCV-${uuid.replace('node-SAT', '')}-${idx}`,
      status: 'active'
    });

    ifaces.push({
      name: portName,
      type: 'iana-if-type:opticalChannel',
      enabled: false,
      adminStatus: 'down',
      operStatus: 'down',
      speed: 100000000000,
      description: `Pre-allocated Inter-Satellite Laser Link port ${portName}`
    });
  }

  // 16 Ground Downlink Ports
  for (let idx = 1; idx <= 16; idx++) {
    const portName = `sat-downlink-${idx}`;
    const portHwId = `hw-port-${uuid}-sat-downlink-${idx}`;

    const tcvrHwId = `hw-tcvr-${uuid}-sat-downlink-${idx}`;

    hw.push({
      uuid: portHwId,
      name: `Downlink RF/Laser Port ${portName}`,
      class: 'port',
      parentUuid: `hw-aesa-${uuid}`,
      manufacturer: 'Fujitsu Limited',
      partNumber: 'FJ-DOWNLINK-PORT',
      serialNumber: `SAT-DWN-PRT-${uuid.replace('node-SAT', '')}-${idx}`,
      status: 'active'
    });

    hw.push({
      uuid: tcvrHwId,
      name: `LEO Satellite RF/Laser Ground Transceiver`,
      class: 'transceiver',
      parentUuid: portHwId,
      manufacturer: 'Fujitsu Limited',
      partNumber: 'FJ-SAT-DOWNLINK-TCVR',
      serialNumber: `SAT-DWN-TCV-${uuid.replace('node-SAT', '')}-${idx}`,
      status: 'active'
    });

    ifaces.push({
      name: portName,
      type: 'iana-if-type:radioMAC',
      enabled: false,
      adminStatus: 'down',
      operStatus: 'down',
      speed: 1000000000,
      description: `Pre-allocated ground downlink interface port ${portName}`
    });
  }

  return {
    uuid,
    name: sat.name,
    type: 'SATELLITE',
    layer: NetworkLayer.L2_ETHERNET,
    location: `LEO Orbit (Altitude ${sat.altitude / 1000}km)`,
    facilityLocation: {
      siteName: `LEO Spacecraft Platform`,
      buildingOrHut: `Satellite Chassis`,
      roomOrHall: `Spacecraft Payload Bay`,
      rackIdentifier: `Payload-Slot-01`,
      rackPosition: 1,
      notes: `LEO satellite operational unit`
    },
    ietfGeoLocation: getGeoLocation(sat.lat, sat.lon, sat.altitude),
    ietfInterfaces: ifaces,
    hardware: hw,
    services: [],
    ietfSystem: {
      hostname: `sat-${uuid.replace('node-SAT', '')}`,
      contact: 'space-ops@telecom.jp',
      location: `LEO Orbit Altitude ${sat.altitude / 1000}km`,
      platform: {
        osName: 'SpaceOS',
        osRelease: '1.0',
        osVersion: '1',
        machine: 'x86_64'
      },
      clock: {
        timezoneName: 'UTC',
        currentDatetime: '2026-06-07T18:35:27.774Z'
      }
    }
  };
}

function connectNodes(
  topology: NetworkTopology,
  sourceId: string,
  targetId: string,
  linkType: 'copper' | 'fiber' | 'coax' | 'microwave' | 'wlan' | 'unknown' | 'leased-fiber' | 'free-space-optics',
  capacity: string,
  layer: NetworkLayer,
  sourcePrefix: string,
  targetPrefix: string
) {
  const sourceNode = topology.nodes.find(n => n.uuid === sourceId);
  const targetNode = topology.nodes.find(n => n.uuid === targetId);

  if (!sourceNode || !targetNode) {
    throw new Error(`Referential Error: Cannot link ${sourceId} to ${targetId} as one or both do not exist.`);
  }

  const sourceInterface = sourceNode.ietfInterfaces?.find(i => i.name.startsWith(sourcePrefix) && !i.enabled);
  const targetInterface = targetNode.ietfInterfaces?.find(i => i.name.startsWith(targetPrefix) && !i.enabled);

  if (!sourceInterface) {
    throw new Error(`Port Allocation Error: Node ${sourceId} has run out of ports matching '${sourcePrefix}'.`);
  }

  if (!targetInterface) {
    throw new Error(`Port Allocation Error: Node ${targetId} has run out of ports matching '${targetPrefix}'.`);
  }

  sourceInterface.enabled = true;
  sourceInterface.adminStatus = 'up';
  sourceInterface.operStatus = 'up';
  sourceInterface.description = `Active physical link to node ${targetId}`;

  targetInterface.enabled = true;
  targetInterface.adminStatus = 'up';
  targetInterface.operStatus = 'up';
  targetInterface.description = `Active physical link to node ${sourceId}`;

  const sourcePort = sourceInterface.name;
  const targetPort = targetInterface.name;

  const isMw = linkType === 'microwave';
  const isFso = linkType === 'free-space-optics';
  const isLocalLink = sourceNode.type === 'O_CU' || targetNode.type === 'O_CU';

  const defaultMetric = isLocalLink ? 2 : (isFso ? 15 : (isMw ? 25 : 12));
  const priorityLevel = isMw ? 'Priority 4 (Silver Class)' : (isLocalLink ? 'Priority 5 (Local Cable)' : 'Priority 3 (Gold Class)');
  const oneWayDelay = isLocalLink ? '0.05 ms' : (isFso ? '3.85 ms' : (isMw ? '12.45 ms' : '4.82 ms'));
  const delayVariation = isLocalLink ? '0.002 ms' : (isFso ? '0.12 ms' : (isMw ? '0.85 ms' : '0.08 ms'));
  const packetLoss = isLocalLink ? '0.0000% (Direct PHY)' : (isFso ? '0.0002% (Protected)' : (isMw ? '0.0015% (Protected)' : '0.0001% (Protected)'));

  const protectionType = isLocalLink ? 'none' : (isMw ? '1+1 Microwave Hot Standby' : (isFso ? '1+1 Laser Spatial Diversity' : '1+1 Optical Backup'));
  const dynamicRestoration = isLocalLink ? 'none' : (isMw ? 'Enabled (Hitless ACM)' : (isFso ? 'Enabled (Spacetime Weather Routing)' : 'Enabled (WSON Phase)'));

  topology.links.push({
    uuid: `link-${sourceId}-${targetId}`,
    sourceNodeUuid: sourceId,
    sourcePortUuid: sourcePort,
    targetNodeUuid: targetId,
    targetPortUuid: targetPort,
    layer,
    capacity,
    usage: Math.floor(Math.random() * 20) + 15,
    inventoryMappingAttributes: { linkType },
    teMetrics: {
      defaultMetric,
      administrativeGroup: isMw ? '0x00000004' : (isLocalLink ? '0x00000000' : '0x00000001'),
      priorityLevel,
      oneWayDelay,
      delayVariation,
      packetLoss
    },
    protection: {
      protectionType,
      dynamicRestoration,
      switchoverTime: isLocalLink ? '0 ms' : '< 45 ms',
      srlgs: [100 + Math.floor(Math.random() * 20), 200 + Math.floor(Math.random() * 20), 300 + Math.floor(Math.random() * 20)]
    }
  });
}

export const getJapaneseNTNTopology = (): NetworkTopology => {
  const topology: NetworkTopology = { nodes: [], links: [] };

  // 1. Generate Ground Station elements
  sites.forEach((site, idx) => {
    topology.nodes.push(buildCienaROADM(site));
    topology.nodes.push(buildNECBasebandUnit(site, idx));
    if (site.isFso) {
      topology.nodes.push(buildAalyriaFsoTerminal(site));
    } else {
      topology.nodes.push(buildEricssonMicrowave(site));
    }
  });

  // 2. Generate Satellites
  satellites.forEach(sat => {
    topology.nodes.push(buildToshibaSatelliteNode(sat));
  });

  // 3. Connect local station nodes
  sites.forEach(site => {
    // Link 1: ROADM to BBU
    connectNodes(
      topology,
      `node-${site.id}`,
      `CU-node-${site.id}`,
      'fiber',
      '100 Gbps',
      NetworkLayer.L2_ETHERNET,
      'eth-',
      'eth-'
    );

    // Link 2: BBU to Transponder
    const transponderId = site.isFso ? `Tightbeam-node-${site.id}` : `Microwave-node-${site.id}`;
    connectNodes(
      topology,
      `CU-node-${site.id}`,
      transponderId,
      'fiber',
      '100 Gbps',
      NetworkLayer.L2_ETHERNET,
      'eth-',
      'eth-'
    );
  });

  // 4. Connect Core Inter-ROADM Optical Mesh
  const coreMesh = [
    { src: 'node-TK1', dest: 'node-TH_OTE' },
    { src: 'node-TH_OTE', dest: 'node-CC1' },
    { src: 'node-CC1', dest: 'node-TY1' },
    { src: 'node-TY1', dest: 'node-FUJI_SUMMIT' },
    { src: 'node-FUJI_SUMMIT', dest: 'node-TYO2' },
    { src: 'node-TYO2', dest: 'node-TK1' },

    { src: 'node-OS1', dest: 'node-OS3' },
    { src: 'node-OS3', dest: 'node-DC12' },
    { src: 'node-DC12', dest: 'node-EQ_OS1' },
    { src: 'node-EQ_OS1', dest: 'node-KOZU' },
    { src: 'node-KOZU', dest: 'node-OS1' },

    { src: 'node-TK1', dest: 'node-OS1' },
    { src: 'node-TY1', dest: 'node-EQ_OS1' },

    { src: 'node-M_CLS', dest: 'node-TK1' },
    { src: 'node-SP_OD', dest: 'node-TK1' },
    { src: 'node-SD_CH', dest: 'node-TK1' },
    { src: 'node-NG_SM', dest: 'node-DC12' },
    { src: 'node-FK_TJ', dest: 'node-OS1' },
    { src: 'node-OK_NH', dest: 'node-FK_TJ' },
    { src: 'node-NG_SM', dest: 'node-TK1' }
  ];

  coreMesh.forEach(link => {
    connectNodes(
      topology,
      link.src,
      link.dest,
      'fiber',
      '800 Gbps',
      NetworkLayer.L0_OPTICAL,
      'opt-1/',
      'opt-1/'
    );
  });

  // 5. Connect Satellites cross links (ISLs)
  connectNodes(topology, 'node-SAT1', 'node-SAT2', 'free-space-optics', '100 Gbps', NetworkLayer.L2_ETHERNET, 'isl-port-', 'isl-port-');
  connectNodes(topology, 'node-SAT2', 'node-SAT3', 'free-space-optics', '100 Gbps', NetworkLayer.L2_ETHERNET, 'isl-port-', 'isl-port-');
  connectNodes(topology, 'node-SAT3', 'node-SAT4', 'free-space-optics', '100 Gbps', NetworkLayer.L2_ETHERNET, 'isl-port-', 'isl-port-');

  // 6. Connect Satellite-to-Ground
  const satMapping: Record<string, string> = {
    TK1: 'node-SAT1',
    FUJI_SUMMIT: 'node-SAT1',
    OS3: 'node-SAT1',
    SP_OD: 'node-SAT1',
    OK_NH: 'node-SAT1',
    TH_OTE: 'node-SAT2',
    TYO2: 'node-SAT2',
    DC12: 'node-SAT2',
    SD_CH: 'node-SAT2',
    TY1: 'node-SAT3',
    M_CLS: 'node-SAT3',
    EQ_OS1: 'node-SAT3',
    NG_SM: 'node-SAT3',
    CC1: 'node-SAT4',
    OS1: 'node-SAT4',
    KOZU: 'node-SAT4',
    FK_TJ: 'node-SAT4'
  };

  Object.entries(satMapping).forEach(([siteId, satId]) => {
    const site = sites.find(s => s.id === siteId)!;
    const transponderId = site.isFso ? `Tightbeam-node-${siteId}` : `Microwave-node-${siteId}`;
    connectNodes(
      topology,
      transponderId,
      satId,
      site.isFso ? 'free-space-optics' : 'microwave',
      '10 Gbps',
      NetworkLayer.MOBILE,
      'up-down-link-',
      'sat-downlink-'
    );
  });

  return topology;
};
