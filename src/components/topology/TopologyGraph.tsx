
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Device, Link, QKDDevice } from '@/types/tfs';
import { NodeDetails } from './NodeDetails';

interface TopologyGraphProps {
  devices: (Device | QKDDevice)[];
  links: Link[];
  onNavigate?: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
  onNodeClick?: (device: Device | QKDDevice) => void;
  nodeStates?: Record<string, 'included' | 'excluded' | 'candidate' | 'source' | 'target' | 'default'>;
  highlightedLinks?: string[];
}

export function TopologyGraph({ 
  devices, 
  links, 
  onNavigate, 
  onNodeClick,
  nodeStates = {},
  highlightedLinks = []
}: TopologyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<Device | QKDDevice | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || devices.length === 0 || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        
        const k = event.transform.k;
        // Adjust stroke weights inversely to the current zoom level to keep them looking crisp
        // k > 1 (zoomed in): scale exactly 1/k to keep them perfectly perfectly thin
        // k < 1 (zoomed out): scale 1/sqrt(k) so they shrink slightly but remain visible without looking thick
        const strokeScale = k > 1 ? 1 / k : 1 / Math.sqrt(k);
        
        g.selectAll("*[data-baseweight]")
          .attr("stroke-width", function() {
            // @ts-ignore
            const base = parseFloat(d3.select(this).attr("data-baseweight"));
            return base * strokeScale;
          });
      });

    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity);

    // Create local copies to prevent mutation of the original data
    const nodes = devices.map(d => ({ ...d }));
    const edges = links.map(l => ({ ...l }));

    // Define Layer Cake groups and heights dynamically
    const numLayers = 5;
    const paddingY = 60;
    const bandHeight = Math.max(100, (height - paddingY * 2) / numLayers);

    const layerDefs = [
      { id: 'space', label: 'SPACE (LEO ORBIT / INFRASTRUCTURE)', color: 'rgba(168, 85, 247, 0.02)', stroke: 'rgba(168, 85, 247, 0.15)' },
      { id: 'l3', label: 'LAYER 3 (IP/MPLS CORE)', color: 'rgba(59, 130, 246, 0.02)', stroke: 'rgba(59, 130, 246, 0.15)' },
      { id: 'l2', label: 'LAYER 2 (CARRIER ACCESS & ETH)', color: 'rgba(16, 185, 129, 0.02)', stroke: 'rgba(16, 185, 129, 0.15)' },
      { id: 'l01', label: 'LAYER 1/0 (OPTICAL ROADM / TRANSPORT)', color: 'rgba(245, 158, 11, 0.02)', stroke: 'rgba(245, 158, 11, 0.15)' },
      { id: 'qkd', label: 'QUANTUM KEY DISTRIBUTION (QKD PLANE)', color: 'rgba(236, 72, 153, 0.02)', stroke: 'rgba(236, 72, 153, 0.15)' }
    ];

    const getNodeLayerIndex = (d: any): number => {
      const type = (d.type || '').toUpperCase();
      const layer = (d.layer || '').toUpperCase();
      const name = (d.name || '').toUpperCase();
      
      if (type === 'SATELLITE' || layer === 'LEO' || layer.includes('ISL') || name.includes('SAT') || (d.location?.altitude && d.location.altitude > 10000)) {
        return 0; // Space
      }
      if (type === 'QKD_NODE' || type.includes('QUANTUM') || layer.includes('QUANTUM') || layer.includes('QKD')) {
        return 4; // QKD
      }
      if (type.includes('OPTICAL') || type.includes('ROADM') || layer.includes('L0') || layer.includes('L1')) {
        return 3; // L1/L0
      }
      if (type.includes('ROUTER') || layer.includes('L3') || type === 'IP') {
        return 1; // L3
      }
      if (type.includes('SWITCH') || layer.includes('L2') || type === 'ETHERNET') {
        return 2; // L2
      }
      return 2; // Default to Layer 2
    };

    // Draw the horizontal planes (Layer Cake outline and backgrounds) under everything else
    const bgGroup = g.append("g").attr("class", "layer-cake-outlines");
    layerDefs.forEach((ld, i) => {
      const yStart = paddingY + i * bandHeight;
      
      // Horizontal background band
      bgGroup.append("rect")
        .attr("x", -5000)
        .attr("y", yStart)
        .attr("width", 10000)
        .attr("height", bandHeight)
        .attr("fill", ld.color)
        .attr("stroke", ld.stroke)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,6")
        .attr("data-baseweight", "1.5");

      // Pane Label
      bgGroup.append("text")
        .attr("x", 40)
        .attr("y", yStart + 24)
        .attr("fill", "#a1a1aa")
        .style("opacity", 0.95)
        .style("font-family", "monospace")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .text(ld.label);
    });

    // Define a scale for geographic longitudes of terrestrial nodes
    const validLons = nodes
      .filter((d: any) => getNodeLayerIndex(d) !== 0)
      .map((d: any) => d.location?.longitude)
      .filter((lon): lon is number => typeof lon === "number" && lon !== 0 && !isNaN(lon));

    let lonExtent = [128, 145];
    if (validLons.length > 0) {
      const minL = Math.min(...validLons);
      const maxL = Math.max(...validLons);
      if (maxL - minL > 0.01) {
        lonExtent = [minL, maxL];
      } else {
        lonExtent = [minL - 1, minL + 1];
      }
    }
    const lonScale = d3.scaleLinear()
      .domain(lonExtent)
      .range([120, width - 120]);

    // Simulation with customized X and Y alignment forces for stacked structure
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(edges).id((d: any) => d.id).distance(140))
      .force("charge", d3.forceManyBody().strength(-1100))
      .force("collision", d3.forceCollide().radius((d: any) => {
        const type = (d.type || '').toUpperCase();
        const name = (d.name || '').toUpperCase();
        return (type === 'SATELLITE' || name.includes('SAT')) ? 24 : 32;
      }).strength(1.0))
      .force("y", d3.forceY((d: any) => {
        const idx = getNodeLayerIndex(d);
        return paddingY + (idx + 0.5) * bandHeight;
      }).strength(0.95))
      .force("x", d3.forceX((d: any) => {
        const idx = getNodeLayerIndex(d);
        if (idx === 0) {
          // Space / satellites: distribute evenly across the Space lane
          const satelliteNodes = nodes.filter((n: any) => getNodeLayerIndex(n) === 0);
          const sortedSatellites = [...satelliteNodes].sort((a, b) => a.id.localeCompare(b.id));
          const sIndex = sortedSatellites.findIndex((n: any) => n.id === d.id);
          if (sIndex !== -1 && sortedSatellites.length > 0) {
            const step = (width - 240) / Math.max(1, sortedSatellites.length);
            return 120 + sIndex * step;
          }
          return width / 2;
        }
        
        const lon = d.location?.longitude;
        if (typeof lon === "number" && lon !== 0) {
          return lonScale(lon);
        }
        return width / 2;
      }).strength(0.95))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Links
    const link = g.append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", (d: any) => {
        if (highlightedLinks.includes(d.id)) return "#3b82f6"; // Path blue
        return d.type === 'QUANTUM' ? "#10b981" : "#3f3f46";
      })
      .attr("stroke-opacity", (d: any) => highlightedLinks.includes(d.id) ? 1 : 0.6)
      .attr("stroke-width", (d: any) => {
        if (highlightedLinks.includes(d.id)) return 4;
        return d.type === 'QUANTUM' ? 3 : 2;
      })
      .attr("data-baseweight", (d: any) => {
        if (highlightedLinks.includes(d.id)) return 4;
        return d.type === 'QUANTUM' ? 3 : 2;
      })
      .attr("stroke-dasharray", (d: any) => d.type === 'QUANTUM' ? "5,5" : "0")
      .attr("class", "cursor-pointer hover:stroke-blue-500 transition-all")
      .on("click", (event, d: any) => {
        if (onNavigate) onNavigate(d.id, 'link');
      });

    // Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "cursor-pointer")
      .on("click", (event, d: any) => {
        if (onNodeClick) {
          onNodeClick(d);
        } else {
          setSelectedNode(d);
          setIsDetailsOpen(true);
        }
      })
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Node shapes
    node.each(function(d: any) {
      const el = d3.select(this);
      const state = nodeStates[d.id] || 'default';
      const type = (d.type || '').toUpperCase();
      const name = (d.name || '').toUpperCase();
      
      let fillColor = "#71717a";
      let strokeColor = "#1e293b";
      let strokeWidth = 1.5;

      if (state === 'source') { fillColor = "#3b82f6"; strokeColor = "#1d4ed8"; strokeWidth = 2.5; }
      else if (state === 'target') { fillColor = "#f59e0b"; strokeColor = "#b45309"; strokeWidth = 2.5; }
      else if (state === 'included') { fillColor = "#10b981"; strokeColor = "#064e3b"; strokeWidth = 2.5; }
      else if (state === 'excluded') { fillColor = "#ef4444"; strokeColor = "#991b1b"; strokeWidth = 2.5; }
      else if (state === 'candidate') { fillColor = "#8b5cf6"; strokeColor = "#5b21b6"; strokeWidth = 2; }
      else if (d.status === 'OPERATIONAL') {
        fillColor = d.type === 'QKD_NODE' ? "#059669" : "#2563eb";
      }

      if (d.type === 'SATELLITE' || name.includes('SAT')) {
        // Satellite representation with wings-shaped solar panels & antenna
        // Horizontal arm
        el.append("rect")
          .attr("x", -15)
          .attr("y", -2)
          .attr("width", 30)
          .attr("height", 4)
          .attr("rx", 1)
          .attr("fill", "#64748b")
          .attr("stroke", strokeColor)
          .attr("stroke-width", 1)
          .attr("data-baseweight", 1);
          
        // Left Solar Panel grid
        el.append("rect")
          .attr("x", -20)
          .attr("y", -6)
          .attr("width", 8)
          .attr("height", 12)
          .attr("rx", 1.5)
          .attr("fill", "#0284c7")
          .attr("stroke", "#38bdf8")
          .attr("stroke-width", 1)
          .attr("data-baseweight", 1);
          
        // Right Solar Panel grid
        el.append("rect")
          .attr("x", 12)
          .attr("y", -6)
          .attr("width", 8)
          .attr("height", 12)
          .attr("rx", 1.5)
          .attr("fill", "#0284c7")
          .attr("stroke", "#38bdf8")
          .attr("stroke-width", 1)
          .attr("data-baseweight", 1);

        // Center satellite sphere body
        el.append("circle")
          .attr("r", 7)
          .attr("fill", "#ec4899") // bright rose/magenta Satellite Core
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.5)
          .attr("data-baseweight", 1.5);

        // Signal orbit outline
        el.append("circle")
          .attr("r", 11)
          .attr("fill", "none")
          .attr("stroke", "#ec4899")
          .attr("stroke-width", 1)
          .attr("opacity", 0.4)
          .attr("stroke-dasharray", "2,3")
          .attr("data-baseweight", 1);
      } else if (d.type === 'QKD_NODE') {
        // Hexagon for QKD nodes - scaled down to diameter ~28px
        const points = "0,-14 12,-7 12,7 0,14 -12,7 -12,-7";
        el.append("polygon")
          .attr("points", points)
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", strokeWidth)
          .attr("data-baseweight", strokeWidth);
        
        el.append("circle")
          .attr("r", 3)
          .attr("fill", "#fff")
          .attr("opacity", 0.8);
      } else {
        // Circle for standard nodes - scaled down to r=12 for less crowded styling
        el.append("circle")
          .attr("r", 12)
          .attr("fill", fillColor)
          .attr("stroke", strokeColor)
          .attr("stroke-width", strokeWidth)
          .attr("data-baseweight", strokeWidth);
      }

      // Add state indicator badge if not default
      if (state !== 'default') {
        el.append("circle")
          .attr("r", 8)
          .attr("cx", 15)
          .attr("cy", -15)
          .attr("fill", strokeColor)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .attr("data-baseweight", 1.5);
        
        el.append("text")
          .text(state[0].toUpperCase())
          .attr("x", 15)
          .attr("y", -12)
          .attr("text-anchor", "middle")
          .attr("fill", "#fff")
          .attr("font-size", "8px")
          .attr("font-weight", "bold");
      }
    });

    // Node labels
    node.append("text")
      .text((d: any) => d.name)
      .attr("x", 18) // Closer because of smaller radius
      .attr("y", 4)
      .attr("fill", "#e4e4e7")
      .attr("font-size", "10px") // slightly smaller font
      .attr("font-weight", "600")
      .attr("font-family", "monospace")
      .attr("class", "pointer-events-none select-none");

    simulation.on("tick", () => {
      // Force nodes strictly inside their designated horizontal layer lanes
      nodes.forEach((d: any) => {
        const idx = getNodeLayerIndex(d);
        const yMin = paddingY + idx * bandHeight + 16;
        const yMax = paddingY + (idx + 1) * bandHeight - 16;
        d.y = Math.max(yMin, Math.min(yMax, d.y));
        
        // Horizontal screen bounds clamping
        d.x = Math.max(25, Math.min(width - 25, d.x));
      });

      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [devices, links, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full bg-background rounded-lg border border-border overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-muted/80 backdrop-blur border border-border p-4 rounded-lg text-[10px] text-muted-foreground font-mono space-y-3">
        <div className="space-y-1.5">
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Nodes</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span>ROUTER / SWITCH</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="w-2.5 h-1 bg-[#64748b] inline-block mr-0.5 rounded-sm" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899] inline-block -mx-1.5 border border-white" />
              <span className="w-2.5 h-1 bg-[#64748b] inline-block ml-0.5 rounded-sm" />
            </div>
            <span>LEO SATELLITE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-600 rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
            <span>QKD NODE</span>
          </div>
          {Object.keys(nodeStates).length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-700" />
                <span>INCLUDED</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 border border-rose-700" />
                <span>EXCLUDED</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-700" />
                <span>SOURCE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-700" />
                <span>TARGET</span>
              </div>
            </>
          )}
        </div>
        <div className="space-y-1.5 pt-2 border-t border-border">
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Links</p>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-zinc-600" />
            <span>OPTICAL LINK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 border-t border-dashed border-emerald-500" />
            <span>QUANTUM LINK</span>
          </div>
          {highlightedLinks.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-blue-500" />
              <span>CANDIDATE PATH</span>
            </div>
          )}
        </div>
      </div>

      <NodeDetails 
        device={selectedNode} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        onNavigate={onNavigate}
      />
    </div>
  );
}
