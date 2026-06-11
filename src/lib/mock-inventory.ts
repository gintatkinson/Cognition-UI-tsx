import { PassiveDevice, PassiveCable, RFC8345Network, RFC8345Node, RFC8345Link } from '../types';
import { getJapaneseNTNTopology } from './japanese-ntn-generator';

// 1. Programmatically construct passive devices
const buildPassiveDevices = (): PassiveDevice[] => {
    return [
        {
            id: "odf-tokyo-otemachi-01",
            name: "Otemachi Main Optical Distribution Frame (ODF)",
            deviceType: "ODF",
            customTags: ["RFID-ODF-TK-102", "BARCODE-994119"],
            locationRef: "room-301-rack-R9D",
            passivePorts: Array.from({ length: 8 }, (_, i) => ({
                id: `port-${i + 1}`,
                portType: i % 2 === 0 ? 'input-port' : 'output-port',
                fiberCoreNum: i + 1
            }))
        },
        {
            id: "splitter-osaka-02",
            name: "Osaka Chuo-ku passive optical splitter",
            deviceType: "WDM",
            customTags: ["RFID-SPL-OS-554", "QR-OSAKA-WDM-9"],
            locationRef: "room-102-rack-OS-C",
            passivePorts: [
                { id: "common-in", portType: "input-port", fiberCoreNum: 1 },
                { id: "ch-1550", portType: "output-port", fiberCoreNum: 2 },
                { id: "ch-1310", portType: "output-port", fiberCoreNum: 3 },
                { id: "ch-1490", portType: "output-port", fiberCoreNum: 4 }
            ]
        },
        {
            id: "fat-kozu-03",
            name: "Kozu Beach Terminal Box (FAT)",
            deviceType: "FAT",
            customTags: ["QR-KOZU-FAT-01"],
            locationRef: "outdoor-enclosure-K3",
            passivePorts: [
                { id: "feeder-1", portType: "input-port", fiberCoreNum: 1 },
                { id: "drop-1", portType: "p2mp-port", fiberCoreNum: 2 },
                { id: "drop-2", portType: "p2mp-port", fiberCoreNum: 3 }
            ]
        }
    ];
};

export function getPassiveDevices(): PassiveDevice[] {
    return buildPassiveDevices();
}

// 2. Programmatically construct passive cables linking physical endpoints
export function getPassiveCables(): PassiveCable[] {
    const topology = getJapaneseNTNTopology();
    
    // Find active fiber link between Tokyo ROADM and Osaka ROADM
    const tkOsaLink = topology.links.find(l => 
      (l.sourceNodeUuid === 'node-TK1' && l.targetNodeUuid === 'node-OS1') ||
      (l.sourceNodeUuid === 'node-OS1' && l.targetNodeUuid === 'node-TK1')
    );
    
    const tkPort = tkOsaLink ? (tkOsaLink.sourceNodeUuid === 'node-TK1' ? tkOsaLink.sourcePortUuid : tkOsaLink.targetPortUuid) : 'opt-1/1';
    const osaPort = tkOsaLink ? (tkOsaLink.sourceNodeUuid === 'node-OS1' ? tkOsaLink.sourcePortUuid : tkOsaLink.targetPortUuid) : 'opt-1/1';

    // Find active fiber link between Tokyo ROADM and Toyosu (TYO2) FSO terminal
    const tkTyoLink = topology.links.find(l => 
      (l.sourceNodeUuid === 'node-TK1' && l.targetNodeUuid === 'node-TYO2') ||
      (l.sourceNodeUuid === 'node-TYO2' && l.targetNodeUuid === 'node-TK1')
    );
    const tkTyoPort = tkTyoLink ? (tkTyoLink.sourceNodeUuid === 'node-TK1' ? tkTyoLink.sourcePortUuid : tkTyoLink.targetPortUuid) : 'opt-1/2';

    return [
        {
            id: "cable-tk-osa-backbone-01",
            name: "Tokyo Otemachi to Osaka Chuo High-Capacity Trunk Cable",
            alias: "TK-OSA-BAK-01",
            description: "Primary trans-island passive underground optical fiber backbone cable.",
            cableType: "optical-fiber",
            cableRole: "backbone",
            length: 512000,
            aEnd: {
                deviceType: "active-device",
                neRef: "node-TK1",
                componentRef: tkPort
            },
            zEnd: {
                deviceType: "active-device",
                neRef: "node-OS1",
                componentRef: osaPort
            },
            opticalCable: {
                fiberCoreNum: 192,
                fiberType: "G652D",
                attenuation: 92.4
            }
        },
        {
            id: "cable-segmented-tokyo-metro-02",
            name: "Aoyama-Otemachi Spliced Concatenated Fiber Ring",
            alias: "TK-METRO-CONCAT-02",
            description: "A composite cable run linking NTT Otemachi main frame with Aoyama edge node through intermediate splicing points.",
            cableType: "optical-fiber",
            cableRole: "trunk",
            length: 15300,
            aEnd: {
                deviceType: "active-device",
                neRef: "node-TK1",
                componentRef: tkTyoPort
            },
            zEnd: {
                deviceType: "passive-device",
                deviceId: "odf-tokyo-otemachi-01"
            },
            opticalCable: {
                fiberCoreNum: 96,
                fiberType: "G657A1",
                attenuation: 3.1
            },
            childCables: [
                { id: "cable-segment-tokyo-otemachi-section-A", index: 1, length: 7300 },
                { id: "cable-segment-tokyo-otemachi-section-B", index: 2, length: 8000 }
            ]
        },
        {
            id: "cable-segment-tokyo-otemachi-section-A",
            name: "Otemachi Section A Spliced segment",
            alias: "TK-SEG-A",
            description: "Underground conduit segment A from Otemachi core to Manhole #22.",
            cableType: "optical-fiber",
            cableRole: "distribution",
            length: 7300,
            aEnd: {
                deviceType: "active-device",
                neRef: "node-TK1"
            },
            zEnd: {
                deviceType: "passive-device",
                deviceId: "odf-tokyo-otemachi-01"
            },
            opticalCable: {
                fiberCoreNum: 96,
                fiberType: "G652D",
                attenuation: 1.5
            }
        },
        {
            id: "cable-segment-tokyo-otemachi-section-B",
            name: "Otemachi Section B Spliced segment",
            alias: "TK-SEG-B",
            description: "Underground conduit segment B from Manhole #22 to Otemachi ODF frame.",
            cableType: "optical-fiber",
            cableRole: "distribution",
            length: 8000,
            aEnd: {
                deviceType: "passive-device",
                deviceId: "odf-tokyo-otemachi-01"
            },
            zEnd: {
                deviceType: "active-device",
                neRef: "node-TY1"
            },
            opticalCable: {
                fiberCoreNum: 96,
                fiberType: "G652D",
                attenuation: 1.6
            }
        },
        {
            id: "cable-coax-feed-04",
            name: "Basestation Copper Coaxial Feeder Run",
            alias: "BASE-COAX-4",
            description: "Outdoor RG-11 Coaxial electrical run for local GPS clock distribution.",
            cableType: "coaxial-cable",
            cableRole: "branch",
            length: 85,
            aEnd: {
                deviceType: "active-device",
                neRef: "node-TK1"
            },
            zEnd: {
                deviceType: "active-device",
                neRef: "node-KOZU"
            }
        }
    ];
}

// 3. Programmatically generate RFC 8345 networks
export function getRFC8345Networks(): RFC8345Network[] {
    const topology = getJapaneseNTNTopology();
    
    const roadmNodes = topology.nodes.filter(n => n.type === 'OPTICAL_SWITCH');
    const roadmLinks = topology.links.filter(l => l.layer === 'L0 (Optical)');
    const bbuNodes = topology.nodes.filter(n => n.type === 'O_CU');

    // Generate underlay-L0 (Physical Optical Underlay)
    const l0Nodes: RFC8345Node[] = roadmNodes.map(node => {
        const siteId = node.uuid.replace('node-', '');
        const code = siteId === 'TK1' ? 'TK' : (siteId === 'OS1' ? 'OS' : siteId);
        const l0NodeId = `node-L0-${code}-terminal`;
        
        const chassis = node.hardware.find(h => h.class === 'chassis')!;
        const modules = node.hardware.filter(h => h.class === 'module');

        return {
            nodeId: l0NodeId,
            name: `${node.location} L0 Terminal`,
            description: "Physical multi-wavelength transponder with dense wavelength division multiplexing (DWDM) filters.",
            activeNeRef: node.uuid,
            chassis: {
                chassisId: chassis.uuid,
                name: chassis.name,
                manufacturer: chassis.manufacturer || 'Ciena Corporation',
                partNumber: chassis.partNumber || 'NTK-5510-ROADM',
                serialNumber: chassis.serialNumber || `ROADM-CIENA-${siteId}-732`,
                status: 'active',
                isMain: true,
                alias: `${siteId}-OPT-CORE-PRIMARY-CHASSIS`,
                description: `Active packet-optical main chassis in ${node.location}`
            },
            modules: modules.map(m => ({
                uuid: m.uuid,
                name: m.name,
                class: 'module',
                parentUuid: m.parentUuid,
                manufacturer: m.manufacturer || 'Ciena Corporation',
                partNumber: m.partNumber || 'WLE5-TRSP',
                serialNumber: m.serialNumber || `WL5-TRSP-${siteId}-504`,
                status: 'active',
                alias: `${m.name} Line Card`
            })),
            gridConfig: {
                gridType: 'wson-grid-dwdm',
                priority: 7,
                dwdmSpacing: 'dwdm-50ghz',
                dwdmN: 2,
                centralFrequencyGhz: 193200,
                slotWidthGhz: 50
            },
            terminationPoints: node.ietfInterfaces
                ?.filter(i => i.name.startsWith('opt-1/') && i.enabled)
                .map((i, idx) => ({
                    tpId: `tp-L0-${code}-${i.name.replace('/', '-')}`,
                    activePortRef: i.name,
                    opticalChannelFreqGhz: 193200 + (idx * 50),
                    transceiver: {
                        uuid: `tcvr-${node.uuid}-${i.name.replace('/', '-')}`,
                        name: '800G-ZR-Optic',
                        manufacturer: 'Ciena Corporation',
                        partNumber: 'NTK-800G-ZR',
                        serialNumber: `CN-TCV-${siteId}-${idx + 1}`,
                        status: 'active',
                        alias: `XCVR-PORT-${idx + 1}-800G`,
                        description: 'Coherent 800G long-haul transceiver module'
                    }
                })) || []
        };
    });

    const l0Links: RFC8345Link[] = roadmLinks.map(link => {
        const srcSiteId = link.sourceNodeUuid.replace('node-', '');
        const destSiteId = link.targetNodeUuid.replace('node-', '');
        const srcCode = srcSiteId === 'TK1' ? 'TK' : (srcSiteId === 'OS1' ? 'OS' : srcSiteId);
        const destCode = destSiteId === 'TK1' ? 'TK' : (destSiteId === 'OS1' ? 'OS' : destSiteId);
        const srcL0NodeId = `node-L0-${srcCode}-terminal`;
        const destL0NodeId = `node-L0-${destCode}-terminal`;

        return {
            linkId: `link-L0-${srcCode}-to-${destCode}`,
            source: {
                sourceNode: srcL0NodeId,
                sourceTp: `tp-L0-${srcCode}-${link.sourcePortUuid.replace('/', '-')}`
            },
            destination: {
                destNode: destL0NodeId,
                destTp: `tp-L0-${destCode}-${link.targetPortUuid.replace('/', '-')}`
            },
            teMetrics: link.teMetrics,
            protection: link.protection
        };
    });

    // Generate underlay-OTN-L1 (OTN & fg-OTN Transport Network)
    const otnNodes: RFC8345Node[] = roadmNodes.map(node => {
        const siteId = node.uuid.replace('node-', '');
        const code = siteId === 'TK1' ? 'TK' : (siteId === 'OS1' ? 'OS' : siteId);
        const l0NodeId = `node-L0-${code}-terminal`;
        const otnNodeId = `node-OTN-${code}-card`;

        const tps = node.ietfInterfaces
            ?.filter(i => i.name.startsWith('opt-1/') && i.enabled)
            .map(i => ({
                tpId: `tp-OTN-${code}-${i.name.replace('/', '-')}`,
                activePortRef: i.name, // maps to ROADM physical port
                supportingTerminationPoints: [{
                    networkRef: 'underlay-L0',
                    nodeRef: l0NodeId,
                    tpRef: `tp-L0-${code}-${i.name.replace('/', '-')}`
                }],
                otnLinkTp: {
                    tsg: 'tsg-1.25G',
                    supportedClientSignal: [
                        { clientSignal: 'iana-if-type:ethernetCsmacd' },
                        { clientSignal: 'client-signal:OTU2' }
                    ]
                }
            })) || [];

        return {
            nodeId: otnNodeId,
            name: `${node.location} OTN/fg-OTN Transport Card`,
            description: "OTN G.709 transport card supporting sub-1G fine-grained timeslot slicing.",
            activeNeRef: node.uuid, // maps to physical ROADM switch
            supportingNodes: [{
                networkRef: 'underlay-L0',
                nodeRef: l0NodeId
            }],
            otnNode: {
                presence: true
            },
            terminationPoints: tps
        };
    });

    const otnLinks: RFC8345Link[] = roadmLinks.map(link => {
        const srcSiteId = link.sourceNodeUuid.replace('node-', '');
        const destSiteId = link.targetNodeUuid.replace('node-', '');
        const srcCode = srcSiteId === 'TK1' ? 'TK' : (srcSiteId === 'OS1' ? 'OS' : srcSiteId);
        const destCode = destSiteId === 'TK1' ? 'TK' : (destSiteId === 'OS1' ? 'OS' : destSiteId);
        const srcOtnNodeId = `node-OTN-${srcCode}-card`;
        const destOtnNodeId = `node-OTN-${destCode}-card`;

        return {
            linkId: `link-OTN-${srcCode}-to-${destCode}`,
            source: {
                sourceNode: srcOtnNodeId,
                sourceTp: `tp-OTN-${srcCode}-${link.sourcePortUuid.replace('/', '-')}`
            },
            destination: {
                destNode: destOtnNodeId,
                destTp: `tp-OTN-${destCode}-${link.targetPortUuid.replace('/', '-')}`
            },
            supportingLinks: [{
                networkRef: 'underlay-L0',
                linkRef: `link-L0-${srcCode}-to-${destCode}`
            }],
            otnLink: {
                distance: 512
            },
            fgotnList: [
                { oduType: 'fgODUflex', oduTsNumber: '1-10', fgotnBandwidth: 100 },
                { oduType: 'fgODUflex', oduTsNumber: '11-15', fgotnBandwidth: 50 }
            ],
            fgtsRange: [{
                oduType: 'fgODUflex',
                oduTsNumber: '1-80',
                fgtsReserved: '1-15',
                fgtsUnreserved: '16-80'
            }],
            teMetrics: link.teMetrics,
            protection: link.protection
        };
    });

    // Generate overlay-L3 (L3 IP Carrier Overlay Network)
    const l3Nodes: RFC8345Node[] = bbuNodes.map(node => {
        const siteId = node.uuid.replace('CU-node-', '');
        const code = siteId === 'TK1' ? 'TK' : (siteId === 'OS1' ? 'OS' : siteId);
        const l0NodeId = `node-L0-${code}-terminal`;
        const l3NodeId = `node-L3-${code}-router`;

        // Walk ROADM's active optical transit interfaces to represent routed L3 transit paths
        const roadmNode = roadmNodes.find(rn => rn.uuid === `node-${siteId}`);
        const tps = roadmNode?.ietfInterfaces
            ?.filter(i => i.name.startsWith('opt-1/') && i.enabled)
            .map((i, idx) => {
                const siteSubnet = code === 'TK' ? 10 : (code === 'OS' ? 20 : (code === 'CC1' ? 30 : Math.abs(code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 254 + 1));
                return {
                    tpId: `tp-L3-${code}-ge${idx + 1}`,
                    ipAddress: `10.${siteSubnet}.1.${idx + 1}/24`,
                    activePortRef: "eth-1", // Multiplexes over physical BBU port eth-1 connected to ROADM
                    supportingTerminationPoints: [{
                        networkRef: 'underlay-L0',
                        nodeRef: l0NodeId,
                        tpRef: `tp-L0-${code}-${i.name.replace('/', '-')}`
                    }]
                };
            }) || [];

        return {
            nodeId: l3NodeId,
            name: `${node.location} IP Core Router`,
            description: "Carrier-grade routing platform with L3 logical IP interfaces mapped to physical transceiver frames.",
            activeNeRef: node.uuid, // maps to physical BBU node
            supportingNodes: [{
                networkRef: 'underlay-L0',
                nodeRef: l0NodeId
            }],
            terminationPoints: tps
        };
    });

    const l3Links: RFC8345Link[] = roadmLinks.map(link => {
        const srcSiteId = link.sourceNodeUuid.replace('node-', '');
        const destSiteId = link.targetNodeUuid.replace('node-', '');
        const srcCode = srcSiteId === 'TK1' ? 'TK' : (srcSiteId === 'OS1' ? 'OS' : srcSiteId);
        const destCode = destSiteId === 'TK1' ? 'TK' : (destSiteId === 'OS1' ? 'OS' : destSiteId);
        const srcL3NodeId = `node-L3-${srcCode}-router`;
        const destL3NodeId = `node-L3-${destCode}-router`;

        const srcRoadmNode = roadmNodes.find(rn => rn.uuid === link.sourceNodeUuid);
        const srcIfaceIndex = srcRoadmNode?.ietfInterfaces
            ?.filter(i => i.name.startsWith('opt-1/') && i.enabled)
            .findIndex(i => i.name === link.sourcePortUuid) ?? 0;
        const srcTpId = `tp-L3-${srcCode}-ge${srcIfaceIndex !== -1 ? srcIfaceIndex + 1 : 1}`;

        const destRoadmNode = roadmNodes.find(rn => rn.uuid === link.targetNodeUuid);
        const destIfaceIndex = destRoadmNode?.ietfInterfaces
            ?.filter(i => i.name.startsWith('opt-1/') && i.enabled)
            .findIndex(i => i.name === link.targetPortUuid) ?? 0;
        const destTpId = `tp-L3-${destCode}-ge${destIfaceIndex !== -1 ? destIfaceIndex + 1 : 1}`;

        return {
            linkId: `link-L3-${srcCode}-to-${destCode}`,
            source: {
                sourceNode: srcL3NodeId,
                sourceTp: srcTpId
            },
            destination: {
                destNode: destL3NodeId,
                destTp: destTpId
            },
            supportingLinks: [{
                networkRef: 'underlay-L0',
                linkRef: `link-L0-${srcCode}-to-${destCode}`
            }],
            teMetrics: link.teMetrics,
            protection: link.protection
        };
    });

    return [
        {
            networkId: "underlay-L0",
            name: "L0 Physical Optical Underlay",
            description: "Underlying trans-island physical fiber cabling, optical wave multiplexers and active terminals.",
            networkTypes: {
                type: "physical"
            },
            nodes: l0Nodes,
            links: l0Links
        },
        {
            networkId: "underlay-OTN-L1",
            name: "OTN & fg-OTN Transport Network",
            description: "Layer 1 Optical Transport Network (OTN) conforming to ietf-otn-topology and ietf-fgotn-topology.",
            networkTypes: {
                type: "L1-transport"
            },
            otnTopology: true,
            supportingNetworks: [
                { networkRef: "underlay-L0" }
            ],
            nodes: otnNodes,
            links: otnLinks
        },
        {
            networkId: "overlay-L3",
            name: "L3 IP Carrier Overlay Network",
            description: "Logical IP routing overlay layer supported by the trans-island optical transport layer wavelengths.",
            networkTypes: {
                type: "L3-ip-overlay"
            },
            supportingNetworks: [
                { networkRef: "underlay-L0" }
            ],
            nodes: l3Nodes,
            links: l3Links
        },
        {
            networkId: "carrier-ethernet-L2",
            name: "L2 Carrier Ethernet Network",
            description: "Layer 2 Carrier Ethernet Network conforming to ietf-l2-topology.",
            networkTypes: {
                type: "L2-ethernet",
                "l2-topology": {}
            },
            "l2-topology-attributes": {
                name: "Carrier-Ethernet-L2-Topology",
                flags: []
            },
            nodes: [
                {
                    nodeId: "node-L2-TK-switch",
                    name: "Tokyo L2 Aggregation Switch",
                    description: "High-performance L2 switch in Tokyo site.",
                    terminationPoints: [
                        {
                            tpId: "tp-L2-TK-eth0",
                            "l2-termination-point-attributes": {
                                "interface-name": "eth0",
                                "mac-address": "00:11:22:33:44:55",
                                "port-number": [1],
                                "unnumbered-id": [10],
                                "encapsulation-type": "vlan",
                                "outer-tag": 100,
                                "outer-tpid": 33024,
                                lag: false
                            }
                        },
                        {
                            tpId: "tp-L2-TK-eth1",
                            "l2-termination-point-attributes": {
                                "interface-name": "eth1",
                                "mac-address": "00:11:22:33:44:66",
                                "port-number": [2],
                                "unnumbered-id": [20],
                                "encapsulation-type": "vxlan",
                                vxlan: {
                                    "vni-id": 5000
                                },
                                lag: false
                            }
                        }
                    ],
                    "l2-node-attributes": {
                        name: "L2-TK-SW",
                        flags: ["active"],
                        "bridge-id": ["00:11:22:33:44:55"],
                        "management-address": ["10.0.2.1"],
                        "management-mac": "00:11:22:33:44:55",
                        "management-vlan": 100
                    }
                },
                {
                    nodeId: "node-L2-OS-switch",
                    name: "Osaka L2 Edge Switch",
                    description: "L2 edge switch in Osaka site.",
                    terminationPoints: [
                        {
                            tpId: "tp-L2-OS-eth0"
                        }
                    ],
                    "l2-node-attributes": {
                        name: "L2-OS-SW",
                        flags: ["active"],
                        "bridge-id": ["00:66:77:88:99:AA"],
                        "management-address": ["10.0.2.2"],
                        "management-mac": "00:66:77:88:99:AA",
                        "management-vlan": 200
                    }
                }
            ],
            links: [
                {
                    linkId: "link-L2-TK-to-OS",
                    source: {
                        sourceNode: "node-L2-TK-switch",
                        sourceTp: "tp-L2-TK-eth0"
                    },
                    destination: {
                        destNode: "node-L2-OS-switch",
                        destTp: "tp-L2-OS-eth0"
                    },
                    teMetrics: {
                        defaultMetric: 10,
                        administrativeGroup: "0x00000001",
                        priorityLevel: "Priority 3 (Gold Class)",
                        oneWayDelay: "1.2 ms",
                        delayVariation: "0.01 ms",
                        packetLoss: "0.0000% (Protected)"
                    },
                    protection: {
                        protectionType: "none",
                        dynamicRestoration: "none",
                        switchoverTime: "N/A",
                        srlgs: [100, 200]
                    },
                    "l2-link-attributes": {
                        rate: 10,
                        delay: 50,
                        "auto-nego": true,
                        duplex: "full",
                        flags: ["active"]
                    }
                },
                {
                    linkId: "link-L2-OS-to-TK",
                    source: {
                        sourceNode: "node-L2-OS-switch",
                        sourceTp: "tp-L2-OS-eth0"
                    },
                    destination: {
                        destNode: "node-L2-TK-switch",
                        destTp: "tp-L2-TK-eth0"
                    },
                    teMetrics: {
                        defaultMetric: 10,
                        administrativeGroup: "0x00000001",
                        priorityLevel: "Priority 3 (Gold Class)",
                        oneWayDelay: "1.2 ms",
                        delayVariation: "0.01 ms",
                        packetLoss: "0.0000% (Protected)"
                    },
                    protection: {
                        protectionType: "none",
                        dynamicRestoration: "none",
                        switchoverTime: "N/A",
                        srlgs: [100, 200]
                    },
                    "l2-link-attributes": {
                        rate: 10,
                        delay: 50,
                        "auto-nego": true,
                        duplex: "full",
                        flags: ["active"]
                    }
                }
            ]
        }
    ];
}
