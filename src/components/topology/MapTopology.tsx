import React, { useMemo, useRef, useEffect, useState } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { Viewer, Entity, PointGraphics, PolylineGraphics, LabelGraphics, ImageryLayer, CesiumComponentRef } from 'resium';
import * as Cesium from 'cesium';
import { Device, Link, QKDDevice } from '@/types/tfs';
import { Settings, Layers, Eye, Globe, Compass, SlidersHorizontal } from 'lucide-react';

const cesiumToken = (import.meta as any).env.VITE_CESIUM_ION_TOKEN;
if (cesiumToken) {
  Cesium.Ion.defaultAccessToken = cesiumToken;
}

interface MapTopologyProps {
  devices: (Device | QKDDevice)[];
  links: Link[];
  onNavigate?: (id: string, type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl') => void;
  onNodeClick?: (device: Device | QKDDevice) => void;
  nodeStates?: Record<string, 'included' | 'excluded' | 'candidate' | 'source' | 'target' | 'default'>;
  highlightedLinks?: string[];
}

export function MapTopology({
  devices,
  links,
  onNavigate,
  onNodeClick,
  nodeStates = {},
  highlightedLinks = []
}: MapTopologyProps) {
  
  const viewerRef = useRef<CesiumComponentRef<Cesium.Viewer>>(null);
  const [terrainProvider, setTerrainProvider] = useState<Cesium.TerrainProvider | null>(null);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite' | 'dark' | 'light'>('dark');
  const [showLabels, setShowLabels] = useState(true);
  const [showDropLines, setShowDropLines] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [showDevices, setShowDevices] = useState(true);
  const [enable3DTerrain, setEnable3DTerrain] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(true);

  // Load Cesium World Terrain
  useEffect(() => {
    let mounted = true;
    const loadTerrain = async () => {
      try {
        const arcgisToken = (import.meta as any).env.VITE_ARCGIS_API_TOKEN;
        const cesiumToken = (import.meta as any).env.VITE_CESIUM_ION_TOKEN;

        let provider: Cesium.TerrainProvider;
        if (arcgisToken) {
          // Use ArcGIS terrain if they want ArcGIS
          provider = await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
            'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
            { token: arcgisToken }
          );
        } else if (cesiumToken) {
          provider = await Cesium.createWorldTerrainAsync({
            requestWaterMask: true,
            requestVertexNormals: true
          });
        } else {
          provider = new Cesium.EllipsoidTerrainProvider();
        }

        if (mounted) setTerrainProvider(provider);
      } catch (err) {
        console.error('Failed to load terrain', err);
        if (mounted) setTerrainProvider(new Cesium.EllipsoidTerrainProvider());
      }
    };
    loadTerrain();
    return () => { mounted = false; };
  }, []);

  // Zoom to Japan initially and configure rendering enhancements
  useEffect(() => {
    if (terrainProvider && viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      
      // Modern High-DPI screen sharp rendering
      viewer.resolutionScale = Math.min(window.devicePixelRatio || 1.0, 2.0); // clamped to 2.0 for outstanding performance on 4k/Retina
      viewer.useBrowserRecommendedResolution = false;
      
      // Enable anti-aliasing post-processing
      if (viewer.scene?.postProcessStages?.fxaa) {
        viewer.scene.postProcessStages.fxaa.enabled = true;
      }

      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(138.2529, 36.2048, 4000000), // Height 4000km to see LEO orbit and Japan
        duration: 0
      });
    }
  }, [terrainProvider]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, Device | QKDDevice>();
    devices.forEach(d => map.set(d.id, d));
    return map;
  }, [devices]);

  const validDevices = useMemo(() => devices.filter(d => 
    d.location && 
    typeof d.location.latitude === 'number' && 
    typeof d.location.longitude === 'number'
  ), [devices]);

  const validLinks = useMemo(() => links.filter(link => {
    const source = nodeMap.get(link.source);
    const target = nodeMap.get(link.target);
    return !!(source?.location && target?.location);
  }), [links, nodeMap]);

  const getDeviceColor = (d: Device | QKDDevice) => {
    const state = nodeStates[d.id] || 'default';
    if (state === 'source' || state === 'target') return Cesium.Color.ORANGE;
    if (d.type === 'QKD_NODE') return Cesium.Color.LIMEGREEN;
    if (d.type === 'gNB_NTN' || d.type === 'SATELLITE') return Cesium.Color.CYAN;
    return Cesium.Color.DODGERBLUE;
  };

  const getLinkColor = (l: Link) => {
    if (highlightedLinks.includes(l.id)) return Cesium.Color.YELLOW;
    if (l.type === 'QUANTUM') return Cesium.Color.LIME.withAlpha(0.65);
    if (l.layer?.includes('ISL')) return Cesium.Color.CYAN.withAlpha(0.65);
    if (l.layer?.includes('NTN')) return Cesium.Color.AQUA.withAlpha(0.65);
    if (l.type === 'OPTICAL') return Cesium.Color.ORANGE.withAlpha(0.65);
    return Cesium.Color.WHITE.withAlpha(0.45);
  };

  // Define full list of available tile providers
  const imageryProviders = useMemo(() => {
    return {
      street: new Cesium.UrlTemplateImageryProvider({
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 19,
        credit: '© OpenStreetMap contributors'
      }),
      satellite: new Cesium.UrlTemplateImageryProvider({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        minimumLevel: 0,
        maximumLevel: 19,
        credit: '© Esri Image Server'
      }),
      dark: new Cesium.UrlTemplateImageryProvider({
        url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 20,
        credit: '© CARTO Basemaps'
      }),
      light: new Cesium.UrlTemplateImageryProvider({
        url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        minimumLevel: 0,
        maximumLevel: 20,
        credit: '© CARTO Basemaps'
      })
    };
  }, []);

  // Determine active terrain provider (toggle flat terrain when ellipsoid is active)
  const activeTerrainProvider = useMemo(() => {
    if (!enable3DTerrain) {
      return new Cesium.EllipsoidTerrainProvider();
    }
    return terrainProvider || new Cesium.EllipsoidTerrainProvider();
  }, [enable3DTerrain, terrainProvider]);

  const handleResetCamera = () => {
    if (viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(138.2529, 36.2048, 4000000),
        duration: 1.5
      });
    }
  };

  if (!terrainProvider) {
    return <div className="w-full h-full flex items-center justify-center bg-slate-900 border border-slate-700/50 rounded-xl text-slate-400 font-mono text-xs">Initializing Globe...</div>;
  }

  return (
    <div className="w-full h-full relative z-0 bg-background overflow-hidden rounded-xl border border-border">
      <Viewer 
        className="w-full h-full"
        ref={viewerRef}
        animation={false} 
        timeline={false} 
        infoBox={false}
        navigationHelpButton={false}
        sceneModePicker={true}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        selectionIndicator={true}
        terrainProvider={activeTerrainProvider}
      >
        <ImageryLayer imageryProvider={imageryProviders[mapStyle]} />

        {showDevices && validDevices.map(d => {
          const lat = d.location!.latitude;
          const lng = d.location!.longitude;
          const alt = d.location!.altitude || 0;
          
          return (
            <Entity 
              key={d.id} 
              name={d.name}
              description={`Type: ${d.type}\nAltitude: ${alt}m`}
              position={Cesium.Cartesian3.fromDegrees(lng, lat, alt)}
            >
              <PointGraphics 
                pixelSize={12} 
                color={getDeviceColor(d)} 
                outlineColor={Cesium.Color.WHITE} 
                outlineWidth={2}
                heightReference={alt <= 0 ? Cesium.HeightReference.CLAMP_TO_GROUND : Cesium.HeightReference.NONE}
              />
              {showLabels && (
                <LabelGraphics
                  text={d.name}
                  font="12px sans-serif"
                  fillColor={Cesium.Color.WHITE}
                  showBackground={true}
                  backgroundColor={Cesium.Color.BLACK.withAlpha(0.7)}
                  pixelOffset={{ x: 0, y: -20 } as any}
                />
              )}
            </Entity>
          );
        })}

        {showLinks && validLinks.map(l => {
          const source = nodeMap.get(l.source)!;
          const target = nodeMap.get(l.target)!;
          const sourcePos = Cesium.Cartesian3.fromDegrees(
            source.location!.longitude, 
            source.location!.latitude, 
            source.location!.altitude || 0
          );
          const targetPos = Cesium.Cartesian3.fromDegrees(
            target.location!.longitude, 
            target.location!.latitude, 
            target.location!.altitude || 0
          );

          // Use GEODESIC for grounding links so they follow the curvature of the earth
          // NONE goes through the earth which obscures terrestrial links
          const isElevated = (source.location!.altitude || 0) > 10000 || (target.location!.altitude || 0) > 10000;
          
          return (
            <Entity 
              key={l.id} 
              name={`Link: ${source.name} \u2194 ${target.name}`}
            >
              <PolylineGraphics
                positions={[sourcePos, targetPos]}
                width={highlightedLinks.includes(l.id) ? 2.5 : (l.type === 'QUANTUM' ? 1.2 : 0.8)}
                material={getLinkColor(l)}
                arcType={isElevated ? Cesium.ArcType.NONE : Cesium.ArcType.GEODESIC}
                clampToGround={!isElevated}
              />
            </Entity>
          );
        })}

        {/* Vertical Drop Lines to ground for elevated nodes (satellites/drones/mountains) */}
        {showDropLines && validDevices.filter(d => (d.location?.altitude || 0) > 0).map(d => {
          const posElevated = Cesium.Cartesian3.fromDegrees(d.location!.longitude, d.location!.latitude, d.location!.altitude!);
          const posGround = Cesium.Cartesian3.fromDegrees(d.location!.longitude, d.location!.latitude, 0);

          return (
            <Entity key={`drop-${d.id}`}>
               <PolylineGraphics
                  positions={[posElevated, posGround]}
                  width={1}
                  material={Cesium.Color.WHITE.withAlpha(0.3)}
               />
            </Entity>
          );
        })}

      </Viewer>
      
      {/* Floating config panel toggle button */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 pr-2 sm:pr-0">
        <button
          id="btn-map-layout-config"
          onClick={() => setShowConfigPanel(!showConfigPanel)}
          className={`p-2.5 rounded-lg border shadow-lg transition-all focus:outline-none flex items-center justify-center gap-2 font-mono text-[11px] font-bold cursor-pointer ${
            showConfigPanel 
              ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700' 
              : 'bg-slate-900/90 backdrop-blur-md border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/95'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Config Options</span>
        </button>

        {showConfigPanel && (
          <div 
            id="map-config-flyout" 
            className="w-72 bg-slate-950/95 backdrop-blur-md border border-slate-800/95 rounded-xl p-4 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-250 text-slate-200 text-left"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold font-mono tracking-wider text-slate-300 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-blue-500 animate-spin-slow" />
                MAP CONFIGURATION
              </span>
              <button 
                onClick={() => setShowConfigPanel(false)}
                className="text-xs font-sans text-slate-500 hover:text-slate-300 font-medium px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Section 1: Map Imagery Style */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold font-mono text-slate-400 tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-500" /> BASE LAYER STYLE
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['dark', 'street', 'satellite', 'light'] as const).map((style) => (
                  <button
                    key={style}
                    id={`btn-style-${style}`}
                    onClick={() => setMapStyle(style)}
                    className={`px-2 py-1.5 rounded text-[10px] font-mono capitalize border transition-all text-left flex items-center justify-between cursor-pointer ${
                      mapStyle === style
                        ? 'bg-blue-500/15 border-blue-500 text-blue-400 font-bold'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{style} Map</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${mapStyle === style ? 'bg-blue-500' : 'bg-transparent'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Terrain Elevation */}
            <div className="flex flex-col gap-1.5 border-t border-slate-800/50 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-slate-400 tracking-wider flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-500" /> 3D SURFACE ELEVATION
                </span>
                <button
                  id="btn-toggle-terrain"
                  onClick={() => setEnable3DTerrain(!enable3DTerrain)}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono border font-bold transition-all cursor-pointer ${
                    enable3DTerrain
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {enable3DTerrain ? 'ACTIVE 3D' : 'FLAT'}
                </button>
              </div>
              <p className="text-[9px] text-slate-500 leading-normal">
                Uses customized terrain height values to elevate orbital/mountain nodes beautifully above terrestrial grounds.
              </p>
            </div>

            {/* Section 3: Component Visibility toggles */}
            <div className="flex flex-col gap-2 border-t border-slate-800/50 pt-3">
              <span className="text-[10px] font-bold font-mono text-slate-400 tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-500" /> VISIBILITY TOGGLES
              </span>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'Devices / Nodes', value: showDevices, setter: setShowDevices, id: 'toggle-devices' },
                  { label: 'Topology Links', value: showLinks, setter: setShowLinks, id: 'toggle-links' },
                  { label: 'Address Labels', value: showLabels, setter: setShowLabels, id: 'toggle-labels' },
                  { label: 'Vertical Drop Lines', value: showDropLines, setter: setShowDropLines, id: 'toggle-droplines' },
                ].map((item) => (
                  <label key={item.label} className="flex items-center justify-between text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer py-0.5 select-none">
                    <span>{item.label}</span>
                    <input
                      id={item.id}
                      type="checkbox"
                      checked={item.value}
                      onChange={(e) => item.setter(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0 focus:ring-1 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Section 4: Diagnostics & reset camera */}
            <div className="border-t border-slate-800/50 pt-3 flex gap-2">
              <button
                id="btn-recenter-view"
                onClick={handleResetCamera}
                className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded font-mono text-[10px] font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Compass className="w-3 h-3 text-blue-400" />
                Reset Camera perspective
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-950/80 text-zinc-300 backdrop-blur rounded-full border border-slate-800 text-xs font-mono shadow-lg pointer-events-none z-10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        3D Globe with Multi-Orbit Support (CesiumJS) | Links: {validLinks.length}
      </div>
    </div>
  );
}
