import React from 'react';
import { MapPin, Info, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Button } from '../../ui/button';
import { NetworkService } from '../../../services/networkService';

export interface DetailPlacementCardProps {
  nodeUuid: string;
  allNodes: any[];
  onNavigate: (id: string, type: any) => void;
}

export function getFacilityLocationAndChassisHelper(nodeUuid: string, allNodes: any[]) {
  // 1. Search physical nodes
  let physical = allNodes.find(n => n.uuid === nodeUuid);
  
  // 2. Resolve logical to physical active reference
  if (!physical) {
    const rfcNetworks = NetworkService.getInstance().getRFC8345Networks() || [];
    for (const net of rfcNetworks) {
      const rn = net.nodes.find(n => n.nodeId === nodeUuid || n.name === nodeUuid);
      if (rn && rn.activeNeRef) {
        physical = allNodes.find(n => n.uuid === rn.activeNeRef);
        break;
      }
    }
  }

  // 3. Search passive inventory
  if (!physical) {
    const passiveDevices = NetworkService.getInstance().getPassiveDevices() || [];
    const pd = passiveDevices.find(d => d.id === nodeUuid || d.name === nodeUuid);
    if (pd) {
      return {
        facility: {
          siteName: pd.locationRef || 'Passive Inventory Area',
          buildingOrHut: 'OTN Distribution Frame',
          roomOrHall: 'Passive Distribution Hut',
          rackIdentifier: pd.id,
          rackPosition: 1,
          notes: `Passive Device Type: ${pd.deviceType}`
        },
        chassis: {
          name: pd.name || pd.id,
          uuid: pd.id,
          manufacturer: 'Passive ODF/FAT Vendor',
          partNumber: pd.deviceType,
          serialNumber: pd.customTags?.[0] || 'N/A'
        },
        isPassive: true,
        nodeName: pd.name || pd.id,
        nodeUuid: pd.id
      };
    }
  }

  if (!physical) return null;

  const facility = physical.facilityLocation || {
    siteName: physical.location || 'Logical Cloud Domain',
    buildingOrHut: 'Standard Virtual Rack',
    roomOrHall: 'Zone-A',
    rackIdentifier: 'V-RACK-01',
    rackPosition: 1,
    notes: 'Logical placement resolved from virtual network environment'
  };

  const chassis = physical.hardware?.find(h => h.class === 'chassis') || {
    uuid: `hw-ch-${physical.uuid}`,
    name: 'Virtual Chassis Container',
    manufacturer: physical.mfgName || 'Generic Software Emulated',
    partNumber: physical.productName || 'vNE-Chassis',
    serialNumber: `v-${physical.uuid.substring(0, 8)}`
  };

  return {
    facility,
    chassis: {
      name: chassis.name,
      uuid: chassis.uuid,
      manufacturer: chassis.manufacturer || 'Japan Aerospace Communications',
      partNumber: chassis.partNumber || 'JAC-BUS-300-X1',
      serialNumber: chassis.serialNumber || 'N/A'
    },
    isPassive: false,
    nodeName: physical.name || physical.uuid,
    nodeUuid: physical.uuid
  };
}

export function DetailPlacementCard({ nodeUuid, allNodes, onNavigate }: DetailPlacementCardProps) {
  const data = getFacilityLocationAndChassisHelper(nodeUuid, allNodes);
  if (!data) return null;

  return (
    <Card className="bg-background border-border shadow-none text-left">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-400" />
          Cabinet Location & Chassis Details
        </CardTitle>
        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] uppercase font-mono">
          Physical Placement
        </Badge>
      </CardHeader>
      <CardContent className="pt-4 space-y-4 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Facility Placement</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-semibold text-foreground/80">Site:</span> {data.facility.siteName}</p>
              <p><span className="font-semibold text-foreground/80">Building/Hut:</span> {data.facility.buildingOrHut}</p>
              <p><span className="font-semibold text-foreground/80">Room/Hall:</span> {data.facility.roomOrHall}</p>
              <p><span className="font-semibold text-foreground/80">Rack ID:</span> <span className="font-mono text-indigo-400 select-all">{data.facility.rackIdentifier}</span></p>
              <p><span className="font-semibold text-foreground/80">Position (RU):</span> RU {data.facility.rackPosition}</p>
            </div>
            {data.facility.notes && (
              <p className="text-[11px] text-amber-500/80 italic flex items-center gap-1 mt-1">
                <Info className="w-3 h-3" /> {data.facility.notes}
              </p>
            )}
          </div>
          <div className="space-y-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Chassis Component Details</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-semibold text-foreground/80">Chassis Name:</span> {data.chassis.name}</p>
              <p>
                <span className="font-semibold text-foreground/80">Chassis UUID:</span>{' '}
                <span 
                  className="font-mono text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer select-all"
                  onClick={() => onNavigate(data.chassis.uuid, 'hardware')}
                >
                  {data.chassis.uuid}
                </span>
              </p>
              <p><span className="font-semibold text-foreground/80">Manufacturer:</span> {data.chassis.manufacturer}</p>
              <p><span className="font-semibold text-foreground/80">Part Number:</span> {data.chassis.partNumber}</p>
              <p><span className="font-semibold text-foreground/80">Serial Number:</span> {data.chassis.serialNumber}</p>
            </div>
          </div>
        </div>
        <Separator className="bg-muted" />
        <div className="flex justify-end pt-1">
          <Button 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700 text-xs flex items-center gap-1.5"
            onClick={() => onNavigate(data.chassis.uuid, 'hardware')}
          >
            <Cpu className="w-3.5 h-3.5" />
            Inspect Full Chassis View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export interface LinkPlacementCardProps {
  nodeAId: string;
  nodeZId: string;
  allNodes: any[];
  onNavigate: (id: string, type: any) => void;
}

export function LinkPlacementCard({ nodeAId, nodeZId, allNodes, onNavigate }: LinkPlacementCardProps) {
  const aData = getFacilityLocationAndChassisHelper(nodeAId, allNodes);
  const zData = getFacilityLocationAndChassisHelper(nodeZId, allNodes);

  return (
    <Card className="bg-background border-border shadow-none text-left">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border bg-muted/5">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-400" />
          Link Endpoints Physical Placement & Chassis details
        </CardTitle>
        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] uppercase font-mono">
          Facility placements
        </Badge>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 text-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* A-End placement */}
          {aData && (
            <div className="p-4 bg-muted/15 border border-border rounded-lg space-y-3">
              <p className="text-xs font-bold text-[#10b981] flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                A-End Endpoint placement
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Device</p>
                  <p 
                    className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer select-all truncate"
                    onClick={() => onNavigate(aData.nodeUuid, 'device')}
                  >
                    {aData.nodeName} ({aData.nodeUuid})
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Cabinet / Rack</p>
                  <p className="text-foreground/80 font-mono">{aData.facility.rackIdentifier} (RU {aData.facility.rackPosition})</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs pt-1.5 border-t border-border/40">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Site & Room</p>
                  <p className="text-foreground/80">{aData.facility.siteName}, {aData.facility.roomOrHall}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Chassis Component</p>
                  <p 
                    className="text-indigo-400 hover:underline cursor-pointer font-mono truncate"
                    onClick={() => onNavigate(aData.chassis.uuid, 'hardware')}
                  >
                    {aData.chassis.name}
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-border text-xs flex items-center gap-1"
                  onClick={() => onNavigate(aData.chassis.uuid, 'hardware')}
                >
                  <Cpu className="w-3.5 h-3.5 text-[#10b981]" />
                  Inspect A-End Chassis
                </Button>
              </div>
            </div>
          )}

          {/* Z-End placement */}
          {zData && (
            <div className="p-4 bg-muted/15 border border-border rounded-lg space-y-3">
              <p className="text-xs font-bold text-[#6366f1] flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#6366f1] animate-pulse" />
                Z-End Endpoint placement
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Device</p>
                  <p 
                    className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer select-all truncate"
                    onClick={() => onNavigate(zData.nodeUuid, 'device')}
                  >
                    {zData.nodeName} ({zData.nodeUuid})
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">Cabinet / Rack</p>
                  <p className="text-foreground/80 font-mono">{zData.facility.rackIdentifier} (RU {zData.facility.rackPosition})</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs pt-1.5 border-t border-border/40">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Site & Room</p>
                  <p className="text-foreground/80">{zData.facility.siteName}, {zData.facility.roomOrHall}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Chassis Component</p>
                  <p 
                    className="text-indigo-400 hover:underline cursor-pointer font-mono truncate"
                    onClick={() => onNavigate(zData.chassis.uuid, 'hardware')}
                  >
                    {zData.chassis.name}
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-border text-xs flex items-center gap-1"
                  onClick={() => onNavigate(zData.chassis.uuid, 'hardware')}
                >
                  <Cpu className="w-3.5 h-3.5 text-[#6366f1]" />
                  Inspect Z-End Chassis
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
