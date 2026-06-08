import React from 'react';
import { Info, Database, Settings as SettingsIcon, Cpu, Network, Zap } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { HardwareComponent } from '../../../types';

interface HardwareTreeNode {
  component: HardwareComponent;
  children: HardwareTreeNode[];
}

export interface HardwareTreeComponentProps {
  node: any;
  components: HardwareComponent[];
  onNavigate: (id: string, type: any) => void;
}

export function HardwareTreeComponent({ 
  node, 
  components, 
  onNavigate 
}: HardwareTreeComponentProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const tree = React.useMemo(() => {
    const componentMap = new Map<string, HardwareTreeNode>();
    components.forEach(comp => {
      componentMap.set(comp.uuid, { component: comp, children: [] });
    });

    const roots: HardwareTreeNode[] = [];
    components.forEach(comp => {
      const treeNode = componentMap.get(comp.uuid);
      if (treeNode) {
        if (comp.parentUuid && componentMap.has(comp.parentUuid)) {
          componentMap.get(comp.parentUuid)!.children.push(treeNode);
        } else {
          roots.push(treeNode);
        }
      }
    });
    return roots;
  }, [components]);

  React.useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    components.forEach(comp => {
      initialExpanded[comp.uuid] = true;
    });
    setExpanded(initialExpanded);
  }, [components]);

  const toggleExpand = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [uuid]: !prev[uuid] }));
  };

  const renderNode = (treeNode: HardwareTreeNode, depth: number): React.ReactNode => {
    const comp = treeNode.component;
    const isExpanded = expanded[comp.uuid] !== false;
    const hasChildren = treeNode.children.length > 0;

    let icon = <Info size={16} className="text-muted-foreground" />;
    if (comp.class === 'chassis') {
      icon = <Database size={16} className="text-amber-500" />;
    } else if (comp.class === 'container' || comp.class === 'slot') {
      icon = <SettingsIcon size={16} className="text-blue-400" />;
    } else if (comp.class === 'module') {
      icon = <Cpu size={16} className="text-purple-400" />;
    } else if (comp.class === 'port') {
      icon = <Network size={16} className="text-emerald-400" />;
    } else if (comp.class === 'transceiver') {
      icon = <Zap size={16} className="text-rose-400" />;
    }

    let matchedIface: any = undefined;
    if (comp.class === 'port' && node.ietfInterfaces) {
      matchedIface = node.ietfInterfaces.find((iface: any) => {
        const normalizedName = iface.name.replace('/', '-');
        return comp.uuid.endsWith(`-${normalizedName}`) || comp.uuid.endsWith(`/${iface.name}`) || comp.uuid === normalizedName;
      });
    }

    return (
      <React.Fragment key={comp.uuid}>
        <div 
          className="group flex flex-col md:flex-row md:items-center justify-between p-3.5 border-b border-border/40 hover:bg-muted/15 transition-all text-left"
          style={{ paddingLeft: `${Math.max(16, depth * 24 + 16)}px` }}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            {depth > 0 && (
              <span className="text-zinc-650 font-mono select-none text-sm leading-none pt-0.5 shrink-0">
                └──
              </span>
            )}
            
            <div className="flex items-start gap-2">
              <button 
                onClick={(e) => hasChildren && toggleExpand(comp.uuid, e)} 
                className={`p-0.5 rounded hover:bg-muted/30 transition-colors ${hasChildren ? 'cursor-pointer' : 'cursor-default opacity-0'}`}
              >
                <span className="block text-[10px] font-bold w-4 h-4 text-center leading-4 font-mono select-none">
                  {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
                </span>
              </button>
              
              <div className="shrink-0 mt-0.5">
                {icon}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span 
                    onClick={() => onNavigate(comp.uuid, 'hardware')}
                    className="font-bold text-zinc-150 hover:text-blue-400 hover:underline cursor-pointer select-all text-xs truncate"
                  >
                    {comp.name}
                  </span>
                  
                  <Badge variant="outline" className={`text-[9px] font-semibold font-mono uppercase tracking-wider h-4 px-1 ${
                    comp.class === 'chassis' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    comp.class === 'port' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    comp.class === 'container' || comp.class === 'slot' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-zinc-800 text-zinc-400 border-border'
                  }`}>
                    {comp.class} {comp.isMain && '(MAIN)'}
                  </Badge>

                  {comp.status && (
                    <Badge variant="outline" className={`text-[9px] font-mono h-4 px-1 ${
                      comp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {comp.status}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 mt-1 font-mono text-[10px] text-muted-foreground/85 text-left">
                  <span>ID: <span className="cursor-pointer hover:underline text-indigo-400 font-mono select-all text-left" onClick={() => onNavigate(comp.uuid, 'hardware')}>{comp.uuid}</span></span>
                  {comp.partNumber && <span>Part: {comp.partNumber}</span>}
                  {comp.serialNumber && <span>S/N: {comp.serialNumber}</span>}
                  
                  {matchedIface && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-sans text-emerald-400">
                      <span>➔ Logical TP:</span>
                      <span 
                        onClick={(e) => { e.stopPropagation(); onNavigate(`${node.uuid}/${matchedIface.name}`, 'port'); }}
                        className="hover:text-blue-400 hover:underline cursor-pointer font-bold select-all font-mono"
                      >
                        {matchedIface.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 md:mt-0 justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 px-2.5 text-[10px] border-border bg-background/50 hover:text-blue-400 hover:border-blue-500/35 hover:bg-blue-500/5 font-bold transition-all"
              onClick={() => onNavigate(comp.uuid, 'hardware')}
            >
              Inspect
            </Button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {treeNode.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col divide-y divide-border/30">
      {tree.length > 0 ? (
        tree.map(root => renderNode(root, 0))
      ) : (
        <div className="p-6 text-center text-xs text-muted-foreground font-mono">
          No hardware components configured on this device.
        </div>
      )}
    </div>
  );
}
