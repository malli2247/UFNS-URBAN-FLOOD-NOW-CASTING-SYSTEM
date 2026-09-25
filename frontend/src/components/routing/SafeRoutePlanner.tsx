import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Navigation,
  ShieldCheck,
  Zap,
  Ambulance,
  Flame,
  Shield,
  Car,
  User,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2,
  ArrowLeftRight,
  MapPin,
  Maximize2,
  Minimize2,
  Compass,
  Crosshair,
  Layers,
  AlertOctagon,
  Info,
  X,
  ChevronRight,
  Activity,
  Waves
} from 'lucide-react';
import { api } from '../../services/api';
import { SafeRouteResult, RouteAlternative, RouteRoadSegment, AvoidedEdge } from '../../types';
import { useSimulation } from '../../context/SimulationContext';

// Known landmark hubs in the Koramangala - Bellandur basin
const PRESET_LOCATIONS = [
  { id: 'st_john', name: 'St. John Medical College Hospital Hub', lat: 12.929, lon: 77.618, type: 'Hospital' },
  { id: 'sakra', name: 'Sakra World Hospital & Trauma Center', lat: 12.928, lon: 77.682, type: 'Hospital' },
  { id: 'fire_stn', name: 'Koramangala Fire & Rescue Station', lat: 12.935, lon: 77.620, type: 'Fire Station' },
  { id: 'police_stn', name: 'Koramangala Police Station (QRT Command)', lat: 12.931, lon: 77.624, type: 'Police Station' },
  { id: 'ecospace', name: 'EcoSpace Outer Ring Road Tech Park', lat: 12.931, lon: 77.671, type: 'Commercial' },
  { id: 'bellandur', name: 'Bellandur Central Crossing Hub', lat: 12.940, lon: 77.665, type: 'Intersection' },
  { id: 'rainbow_drive', name: 'Rainbow Drive Access Hub', lat: 12.915, lon: 77.672, type: 'Residential' },
  { id: 'agara', name: 'Agara Junction Central Hub', lat: 12.922, lon: 77.638, type: 'Intersection' },
  { id: 'hosur_rd', name: 'Hosur Road Arterial Gateway', lat: 12.923, lon: 77.618, type: 'Highway' },
];

export const SafeRoutePlanner: React.FC = () => {
  const {
    activeHorizon,
    dataMode,
    prediction,
    drainageNetwork,
    roads: allRoads,
    facilities,
    riskZones,
    sensors,
    setActiveRoute
  } = useSimulation();

  // Vehicle Profile state
  const [vehicleType, setVehicleType] = useState<string>('ambulance');

  // Waypoints state
  const [origin, setOrigin] = useState({
    lat: 12.929,
    lon: 77.618,
    name: 'St. John Medical College Hospital Hub'
  });
  const [destination, setDestination] = useState({
    lat: 12.928,
    lon: 77.682,
    name: 'Sakra World Hospital & Trauma Center'
  });

  // Map Click Picking Mode ('none' | 'origin' | 'destination')
  const [mapPickMode, setMapPickMode] = useState<'none' | 'origin' | 'destination'>('none');

  // Route Results & Selection
  const [routeResult, setRouteResult] = useState<SafeRouteResult | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<'shortest' | 'fastest' | 'safest' | 'emergency'>('emergency');
  const [loading, setLoading] = useState<boolean>(false);

  // Map inspection feature
  const [inspectedRoad, setInspectedRoad] = useState<RouteRoadSegment | null>(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [basemapType, setBasemapType] = useState<'dark-osm' | 'satellite' | 'standard-osm'>('dark-osm');
  const [showFloodOverlay, setShowFloodOverlay] = useState<boolean>(true);
  const [showFacilitiesOnMap, setShowFacilitiesOnMap] = useState<boolean>(true);

  const vehicleOptions = [
    { id: 'ambulance', label: 'Ambulance', clearance: 25, icon: Ambulance, color: 'text-rose-400' },
    { id: 'fire_truck', label: 'Fire Truck', clearance: 50, icon: Flame, color: 'text-amber-400' },
    { id: 'police', label: 'Police SUV', clearance: 35, icon: Shield, color: 'text-indigo-400' },
    { id: 'car', label: 'Standard Car', clearance: 20, icon: Car, color: 'text-sky-400' },
    { id: 'pedestrian', label: 'Pedestrian', clearance: 10, icon: User, color: 'text-emerald-400' },
  ];

  // Handle route selection synchronizing with SimulationContext
  const handleSelectRouteType = (type: 'shortest' | 'fastest' | 'safest' | 'emergency') => {
    setSelectedRouteType(type);
    if (routeResult) {
      const updated = { ...routeResult, selected_route: type };
      setRouteResult(updated);
      setActiveRoute(updated);
    }
  };

  // Fetch routes from backend
  const fetchRoute = async () => {
    setLoading(true);
    try {
      const res = await api.calculateSafeRoute({
        origin: { lat: origin.lat, lng: origin.lon },
        destination: { lat: destination.lat, lng: destination.lon },
        vehicle: vehicleType,
        horizon: activeHorizon,
        forecast_horizon_minutes: 60,
      });
      const selected = (res.recommended_route as any) || 'emergency';
      res.selected_route = selected;
      setRouteResult(res);
      setSelectedRouteType(selected);
      setActiveRoute(res);
    } catch (e) {
      console.warn('Error calculating routes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [vehicleType, activeHorizon, origin.lat, origin.lon, destination.lat, destination.lon]);

  // Swap origin and destination
  const handleSwapWaypoints = () => {
    const oldOrigin = { ...origin };
    setOrigin({ ...destination });
    setDestination(oldOrigin);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [12.936, 77.642],
        zoom: 13,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Handle map click for picking origin/destination
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const roundedLat = Math.round(lat * 1000) / 1000;
        const roundedLng = Math.round(lng * 1000) / 1000;

        // Check if we are in pick mode
        setMapPickMode(currentMode => {
          if (currentMode === 'origin') {
            setOrigin({
              lat: roundedLat,
              lon: roundedLng,
              name: `Custom Map Origin (${roundedLat.toFixed(3)}N, ${roundedLng.toFixed(3)}E)`
            });
            return 'none';
          } else if (currentMode === 'destination') {
            setDestination({
              lat: roundedLat,
              lon: roundedLng,
              name: `Custom Map Destination (${roundedLat.toFixed(3)}N, ${roundedLng.toFixed(3)}E)`
            });
            return 'none';
          }
          return 'none';
        });
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      window.addEventListener('resize', () => map.invalidateSize());
    }
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let newTileLayer: L.TileLayer;
    if (basemapType === 'satellite') {
      newTileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '&copy; Esri &mdash; High-Resolution Aerial Imagery', maxZoom: 18 }
      );
    } else if (basemapType === 'standard-osm') {
      newTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });
    } else {
      newTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        className: 'ufns-dark-tiles',
        maxZoom: 19,
      });
    }

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
    map.invalidateSize();
  }, [basemapType]);

  // Render Routes and GIS Overlays on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous vector layers (preserve tile layer)
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) return;
      map.removeLayer(layer);
    });

    const overlayGroup = L.layerGroup().addTo(map);

    // 1. FLOOD DEPTH GRID OVERLAY
    if (showFloodOverlay && prediction?.grid) {
      const cellSizeLat = (12.962 - 12.912) / 16;
      const cellSizeLon = (77.675 - 77.605) / 16;

      prediction.grid.forEach(cell => {
        if (cell.water_depth_cm > 0.8) {
          const bounds: L.LatLngBoundsExpression = [
            [cell.lat - cellSizeLat / 2, cell.lon - cellSizeLon / 2],
            [cell.lat + cellSizeLat / 2, cell.lon + cellSizeLon / 2],
          ];

          let color = '#38bdf8';
          if (cell.water_depth_cm >= 50) color = '#ef4444';
          else if (cell.water_depth_cm >= 30) color = '#f97316';
          else if (cell.water_depth_cm >= 10) color = '#eab308';
          else if (cell.water_depth_cm >= 5) color = '#0284c7';

          const rect = L.rectangle(bounds, {
            color: color,
            weight: 0.5,
            fillColor: color,
            fillOpacity: Math.min(0.70, 0.30 + (cell.water_depth_cm / 70.0) * 0.4),
          });
          rect.bindTooltip(`<b>Flood Cell</b><br/>Depth: <b>${cell.water_depth_cm} cm</b>`, { sticky: true });
          overlayGroup.addLayer(rect);
        }
      });
    }

    // 2. DRAINAGE SURCHARGE POINTS
    if (drainageNetwork?.nodes) {
      drainageNetwork.nodes.forEach(node => {
        if (node.is_surcharged) {
          const pulseIcon = L.divIcon({
            className: 'surcharge-pulse-container',
            html: `<div class="surcharge-pulse-halo" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #ec4899; background-color: rgba(236, 72, 153, 0.3);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          const pulseMarker = L.marker([node.lat, node.lon], { icon: pulseIcon, interactive: false });
          overlayGroup.addLayer(pulseMarker);
        }
      });
    }

    // 3. EMERGENCY FACILITIES
    if (showFacilitiesOnMap && facilities) {
      facilities.forEach(f => {
        const icon = L.divIcon({
          className: 'facility-badge',
          html: `<div style="background-color: ${f.facility_type === 'Hospital' ? '#2563eb' : (f.facility_type === 'Fire Station' ? '#dc2626' : '#059669')}; padding: 2px 4px; border-radius: 6px; border: 1.5px solid white; font-size: 10px; color: white;">${
            f.facility_type === 'Hospital' ? '🏥' : (f.facility_type === 'Fire Station' ? '🚒' : '⛺')
          }</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const marker = L.marker([f.lat, f.lon], { icon });
        marker.bindTooltip(`<b>${f.name}</b><br/>Type: ${f.facility_type} &bull; Depth: ${f.current_depth_cm} cm`);
        overlayGroup.addLayer(marker);
      });
    }

    // 4. AVOIDED / REJECTED ROADS (Dashed Red Lines with ⛔)
    if (routeResult?.avoided_edges) {
      routeResult.avoided_edges.forEach(edge => {
        const poly = L.polyline(edge.coordinates, {
          color: '#ef4444',
          weight: 4,
          dashArray: '6, 6',
          opacity: 0.85,
        });

        poly.bindTooltip(
          `<b>❌ AVOIDED: ${edge.road_name}</b><br/>Predicted Water: <b style="color:#ef4444">${edge.predicted_depth_cm} cm</b><br/>Clearance Threshold: ${edge.clearance_cm} cm (IMPASSABLE)`
        );
        overlayGroup.addLayer(poly);

        const midLat = (edge.coordinates[0][0] + edge.coordinates[1][0]) / 2.0;
        const midLon = (edge.coordinates[0][1] + edge.coordinates[1][1]) / 2.0;
        const blockIcon = L.divIcon({
          className: 'road-block-badge',
          html: `⛔`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const blockMarker = L.marker([midLat, midLon], { icon: blockIcon });
        blockMarker.bindTooltip(`<b>IMPASSABLE TO ${vehicleType.toUpperCase()}</b><br/>${edge.reason}`);
        overlayGroup.addLayer(blockMarker);
      });
    }

    // 5. ALL FOUR ROUTE PATHS (Non-Selected: Lower Opacity, Selected: Bold & Dominant)
    const routes = routeResult?.routes || [];
    let selectedRouteCoords: [number, number][] = [];

    // Route visual style definitions
    const routeStyles: Record<string, { color: string; dash?: string; label: string }> = {
      shortest: { color: '#a855f7', dash: '6, 4', label: '📍 Shortest Path' },
      fastest: { color: '#3b82f6', label: '⚡ Fastest Route' },
      safest: { color: '#10b981', label: '🛡️ Safest Path' },
      emergency: { color: '#06b6d4', label: '🚨 Emergency Priority' },
    };

    // First render non-selected routes in the background
    routes.forEach(r => {
      if (r.route_type !== selectedRouteType && r.coordinates.length > 0) {
        const style = routeStyles[r.route_type] || { color: '#94a3b8', label: r.route_type };
        const poly = L.polyline(r.coordinates, {
          color: style.color,
          weight: 3.5,
          opacity: 0.45,
          dashArray: style.dash,
        });

        poly.on('click', () => {
          setSelectedRouteType(r.route_type as any);
        });

        poly.bindTooltip(
          `<b>${style.label}</b><br/>Dist: ${r.distance_km} km &bull; Time: ${r.travel_time_min || r.duration_min} min<br/>Max Water: <b>${r.maximum_water_depth_cm || r.max_depth_cm} cm</b> &bull; Risk: <b>${r.risk_level}</b>`
        );
        overlayGroup.addLayer(poly);
      } else if (r.route_type === selectedRouteType) {
        selectedRouteCoords = r.coordinates;
      }
    });

    // Then render the SELECTED route prominently on top
    const activeRt = routes.find(r => r.route_type === selectedRouteType);
    if (activeRt && activeRt.coordinates.length > 0) {
      const activeStyle = routeStyles[activeRt.route_type] || { color: '#06b6d4', label: activeRt.route_type };

      // Outer glow line
      const glowPoly = L.polyline(activeRt.coordinates, {
        color: activeStyle.color,
        weight: 9,
        opacity: 0.35,
      });
      overlayGroup.addLayer(glowPoly);

      // Main prominent line
      const mainPoly = L.polyline(activeRt.coordinates, {
        color: activeStyle.color,
        weight: 5.5,
        opacity: 1.0,
      });

      mainPoly.bindTooltip(
        `<b>SELECTED: ${activeStyle.label}</b><br/>Distance: <b>${activeRt.distance_km} km</b> &bull; Time: <b>${activeRt.travel_time_min || activeRt.duration_min} min</b><br/>Max Water: <b>${activeRt.maximum_water_depth_cm || activeRt.max_depth_cm} cm</b>`,
        { sticky: true }
      );
      overlayGroup.addLayer(mainPoly);

      // Auto-fit bounds to the selected route
      try {
        const bounds = L.latLngBounds(activeRt.coordinates);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
      } catch (e) {
        console.warn(e);
      }
    }

    // 6. ORIGIN AND DESTINATION WAYPOINTS
    const startIcon = L.divIcon({
      className: 'route-waypoint-start',
      html: `<div style="background-color: #10b981; color: white; border: 2.5px solid white; width: 28px; height: 28px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; box-shadow: 0 0 12px #10b981;">A</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const originMarker = L.marker([origin.lat, origin.lon], { icon: startIcon });
    originMarker.bindTooltip(`<b>ORIGIN</b><br/>${origin.name}`);
    overlayGroup.addLayer(originMarker);

    const destIcon = L.divIcon({
      className: 'route-waypoint-end',
      html: `<div style="background-color: #ef4444; color: white; border: 2.5px solid white; width: 28px; height: 28px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; box-shadow: 0 0 12px #ef4444;">B</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const destMarker = L.marker([destination.lat, destination.lon], { icon: destIcon });
    destMarker.bindTooltip(`<b>DESTINATION</b><br/>${destination.name}`);
    overlayGroup.addLayer(destMarker);

  }, [routeResult, selectedRouteType, origin, destination, showFloodOverlay, showFacilitiesOnMap, prediction, drainageNetwork, facilities]);

  // Currently active route object
  const activeRouteObj = routeResult?.routes?.find(r => r.route_type === selectedRouteType) || routeResult?.emergency || routeResult?.routes?.[0];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner & Recalculate */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-lg sm:text-xl text-white tracking-wide">
                Flood-Safe Emergency Routing Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 text-[10px] font-bold border border-sky-800 font-mono">
                SIH 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-Objective NetworkX Dijkstra &bull; Clearance Avoidance &bull; Active Horizon: <b className="text-amber-400 font-mono">+{activeHorizon}</b>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchRoute}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>CALCULATING FLOOD-SAFE ROUTES...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>RECALCULATE ROUTES</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Safety Notice / Disclaimer */}
      <div className="px-4 py-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-amber-300/90 text-[11px] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <b>Prototype flood traversal thresholds:</b> Clearance thresholds are demonstration guidelines. Operational emergency dispatch requires validation by local disaster management authorities.
          </span>
        </div>
        <span className="text-[10px] text-amber-400/80 font-mono shrink-0 ml-2 hidden sm:inline">BDMA / IMD Coupler</span>
      </div>

      {/* 2. Vehicle Selection & Origin/Destination Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vehicle Selection (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                1. Select Vehicle Profile
              </span>
              <span className="text-[11px] text-slate-400">Clearance Threshold</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {vehicleOptions.map(v => {
                const Icon = v.icon;
                const isSel = vehicleType === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVehicleType(v.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSel
                        ? 'bg-sky-600/20 border-sky-400 text-sky-200 shadow-md ring-1 ring-sky-400/50'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${v.color}`} />
                    <div className="font-bold text-xs">{v.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{v.clearance} cm limit</div>
                    {isSel && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-400 animate-ping" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            Selected Clearance: <b className="text-sky-400 font-mono">{vehicleOptions.find(v => v.id === vehicleType)?.clearance} cm</b>. Roads exceeding this depth are flagged <b className="text-rose-400">IMPASSABLE</b>.
          </div>
        </div>

        {/* Origin & Destination Hubs (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              2. Origin &amp; Destination Waypoints
            </span>
            <span className="text-[11px] text-slate-400">Search Hubs or Click Map</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* Origin Box (5 cols) */}
            <div className="md:col-span-5 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Origin (Start A)</span>
                </span>
                <button
                  onClick={() => setMapPickMode(mapPickMode === 'origin' ? 'none' : 'origin')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center space-x-1 ${
                    mapPickMode === 'origin'
                      ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Click to activate map picking mode"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{mapPickMode === 'origin' ? 'Click Map Now' : 'Set on Map'}</span>
                </button>
              </div>

              {/* Preset Selector */}
              <select
                value={PRESET_LOCATIONS.find(p => Math.abs(p.lat - origin.lat) < 0.005 && Math.abs(p.lon - origin.lon) < 0.005)?.id || ''}
                onChange={e => {
                  const found = PRESET_LOCATIONS.find(p => p.id === e.target.value);
                  if (found) setOrigin({ lat: found.lat, lon: found.lon, name: found.name });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="" disabled>Choose Known Facility Hub...</option>
                {PRESET_LOCATIONS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                <span className="truncate max-w-[170px] text-slate-200">{origin.name}</span>
                <span className="text-emerald-400 shrink-0">{origin.lat.toFixed(3)}N, {origin.lon.toFixed(3)}E</span>
              </div>
            </div>

            {/* Swap Button (1 col) */}
            <div className="md:col-span-1 flex justify-center">
              <button
                onClick={handleSwapWaypoints}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shadow-md"
                title="Swap Origin and Destination"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Box (5 cols) */}
            <div className="md:col-span-5 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-rose-400 font-bold uppercase flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>Destination (Target B)</span>
                </span>
                <button
                  onClick={() => setMapPickMode(mapPickMode === 'destination' ? 'none' : 'destination')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center space-x-1 ${
                    mapPickMode === 'destination'
                      ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Click to activate map picking mode"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{mapPickMode === 'destination' ? 'Click Map Now' : 'Set on Map'}</span>
                </button>
              </div>

              {/* Preset Selector */}
              <select
                value={PRESET_LOCATIONS.find(p => Math.abs(p.lat - destination.lat) < 0.005 && Math.abs(p.lon - destination.lon) < 0.005)?.id || ''}
                onChange={e => {
                  const found = PRESET_LOCATIONS.find(p => p.id === e.target.value);
                  if (found) setDestination({ lat: found.lat, lon: found.lon, name: found.name });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="" disabled>Choose Known Facility Hub...</option>
                {PRESET_LOCATIONS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                <span className="truncate max-w-[170px] text-slate-200">{destination.name}</span>
                <span className="text-rose-400 shrink-0">{destination.lat.toFixed(3)}N, {destination.lon.toFixed(3)}E</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map-Click Mode Active Banner */}
      {mapPickMode !== 'none' && (
        <div className="p-3 rounded-xl bg-sky-950 border border-sky-500/80 text-sky-200 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <Crosshair className="w-4 h-4 text-sky-400" />
            <span>
              <b>Map Clicking Mode Active:</b> Click anywhere on the Route Intelligence Map below to set the{' '}
              <b className="text-white uppercase">{mapPickMode}</b> coordinate.
            </span>
          </div>
          <button
            onClick={() => setMapPickMode('none')}
            className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 3. Four Selectable Route Cards (Shortest, Fastest, Safest, Emergency) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <span>3. Multi-Objective Route Solutions</span>
            <span className="text-xs text-slate-400 font-normal">({routeResult?.routes?.length || 4} generated paths)</span>
          </h3>
          <span className="text-xs text-slate-400">Click any card to highlight on map</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Shortest Path */}
          {routeResult?.shortest && (
            <div
              onClick={() => handleSelectRouteType('shortest')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRouteType === 'shortest'
                  ? 'bg-purple-950/40 border-purple-400 shadow-xl ring-2 ring-purple-400/20'
                  : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Shortest Path</span>
                  </span>
                  {selectedRouteType === 'shortest' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>

                <div className="mt-3 space-y-0.5">
                  <div className="text-3xl font-black text-white font-mono">
                    {routeResult.shortest.distance_km} <span className="text-xs font-sans text-slate-400 font-normal">km</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Est. Time: <b className="text-slate-200">{routeResult.shortest.travel_time_min} min</b>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Max Inundation: <b className={routeResult.shortest.maximum_water_depth_cm > 20 ? 'text-rose-400' : 'text-sky-400'}>
                      {routeResult.shortest.maximum_water_depth_cm} cm
                    </b>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Flood Exposure: <b className="text-amber-400">{routeResult.shortest.flood_exposure_km} km</b>
                  </div>
                </div>

                {/* Impassable Warning if Shortest path crosses flooded road */}
                {routeResult.shortest.warning && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-[10px] text-rose-300 space-y-0.5">
                    <div className="font-bold flex items-center space-x-1 text-rose-400">
                      <AlertOctagon className="w-3 h-3 shrink-0" />
                      <span>NOT RECOMMENDED</span>
                    </div>
                    <p className="line-clamp-2">{routeResult.shortest.warning}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Risk Assessment:</span>
                <span className={`font-bold ${
                  routeResult.shortest.risk_level === 'SAFE' ? 'text-emerald-400' :
                  (routeResult.shortest.risk_level === 'LOW' ? 'text-emerald-400' :
                  (routeResult.shortest.risk_level === 'MODERATE' ? 'text-yellow-400' : 'text-rose-400'))
                }`}>
                  {routeResult.shortest.risk_level}
                </span>
              </div>
            </div>
          )}

          {/* Card 2: Fastest Route */}
          {routeResult?.fastest && (
            <div
              onClick={() => handleSelectRouteType('fastest')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRouteType === 'fastest'
                  ? 'bg-blue-950/40 border-blue-400 shadow-xl ring-2 ring-blue-400/20'
                  : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Fastest Route</span>
                  </span>
                  {selectedRouteType === 'fastest' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </div>

                <div className="mt-3 space-y-0.5">
                  <div className="text-3xl font-black text-white font-mono">
                    {routeResult.fastest.travel_time_min} <span className="text-xs font-sans text-slate-400 font-normal">min</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Total Dist: <b className="text-slate-200">{routeResult.fastest.distance_km} km</b>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Max Inundation: <b className="text-sky-400">{routeResult.fastest.maximum_water_depth_cm} cm</b>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Flood Exposure: <b className="text-amber-400">{routeResult.fastest.flood_exposure_km} km</b>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Risk Assessment:</span>
                <span className={`font-bold ${
                  routeResult.fastest.risk_level === 'SAFE' ? 'text-emerald-400' :
                  (routeResult.fastest.risk_level === 'LOW' ? 'text-emerald-400' :
                  (routeResult.fastest.risk_level === 'MODERATE' ? 'text-yellow-400' : 'text-rose-400'))
                }`}>
                  {routeResult.fastest.risk_level}
                </span>
              </div>
            </div>
          )}

          {/* Card 3: Safest Path */}
          {routeResult?.safest && (
            <div
              onClick={() => handleSelectRouteType('safest')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRouteType === 'safest'
                  ? 'bg-emerald-950/40 border-emerald-400 shadow-xl ring-2 ring-emerald-400/20'
                  : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Safest Path</span>
                  </span>
                  {selectedRouteType === 'safest' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>

                <div className="mt-3 space-y-0.5">
                  <div className="text-3xl font-black text-white font-mono">
                    {routeResult.safest.distance_km} <span className="text-xs font-sans text-slate-400 font-normal">km</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Est. Time: <b className="text-slate-200">{routeResult.safest.travel_time_min} min</b>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Max Inundation: <b className="text-emerald-400">{routeResult.safest.maximum_water_depth_cm} cm</b>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Flood Exposure: <b className="text-emerald-400">{routeResult.safest.flood_exposure_km} km</b>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Risk Assessment:</span>
                <span className="font-bold text-emerald-400">
                  {routeResult.safest.risk_level}
                </span>
              </div>
            </div>
          )}

          {/* Card 4: Emergency Priority */}
          {routeResult?.emergency && (
            <div
              onClick={() => handleSelectRouteType('emergency')}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRouteType === 'emergency'
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-xl ring-2 ring-cyan-400/20'
                  : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                    <Ambulance className="w-3.5 h-3.5" />
                    <span>Emergency Priority</span>
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      RECOMMENDED
                    </span>
                    {selectedRouteType === 'emergency' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                </div>

                <div className="mt-3 space-y-0.5">
                  <div className="text-3xl font-black text-white font-mono">
                    {routeResult.emergency.travel_time_min} <span className="text-xs font-sans text-slate-400 font-normal">min</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Total Dist: <b className="text-slate-200">{routeResult.emergency.distance_km} km</b>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Max Inundation: <b className="text-cyan-400">{routeResult.emergency.maximum_water_depth_cm} cm</b>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Elevated Bypass Bonus: <b className="text-cyan-300">Active</b>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Risk Assessment:</span>
                <span className="font-bold text-emerald-400">
                  {routeResult.emergency.risk_level}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Recommendation Banner */}
      {routeResult?.recommendation_reason && (
        <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-800/60 text-xs text-slate-200 flex items-start space-x-3 shadow-lg">
          <div className="p-2 rounded-xl bg-sky-900/60 text-sky-400 shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sky-300 uppercase tracking-wide text-[11px] mb-0.5">
              UFNS Recommendation: {routeResult.recommended_route?.toUpperCase()} ROUTE
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              "{routeResult.recommendation_reason}"
            </p>
          </div>
        </div>
      )}

      {/* 4. ROUTE INTELLIGENCE MAP (Interactive Leaflet Map) */}
      <div className="rounded-2xl border border-slate-800 shadow-2xl bg-[#0f172a] overflow-hidden flex flex-col">
        {/* Map Header Toolbar */}
        <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="font-bold text-slate-100 uppercase tracking-wider text-[12px]">
              Route Intelligence Map
            </h3>
            <span className="text-slate-500 font-mono">|</span>
            <span className="text-slate-400 text-[11px]">
              Active Display: <b className="text-cyan-400 uppercase">{selectedRouteType} Route</b>
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            {/* Basemap Switcher */}
            <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setBasemapType('dark-osm')}
                className={`px-1.5 py-0.5 rounded text-[10px] ${basemapType === 'dark-osm' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`}
              >
                Dark OSM
              </button>
              <button
                onClick={() => setBasemapType('satellite')}
                className={`px-1.5 py-0.5 rounded text-[10px] ${basemapType === 'satellite' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`}
              >
                Satellite
              </button>
            </div>

            {/* Overlay Toggles */}
            <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={showFloodOverlay}
                onChange={e => setShowFloodOverlay(e.target.checked)}
                className="rounded text-sky-500"
              />
              <span className="text-[10px]">Flood Grid</span>
            </label>

            <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={showFacilitiesOnMap}
                onChange={e => setShowFacilitiesOnMap(e.target.checked)}
                className="rounded text-blue-500"
              />
              <span className="text-[10px]">Facilities</span>
            </label>
          </div>
        </div>

        {/* Map Viewport */}
        <div className="h-[520px] w-full relative">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Floating Route Legend (Bottom Left) */}
          <div className="absolute bottom-4 left-4 z-20 p-3 rounded-2xl bg-[#0b1329]/95 backdrop-blur-md border border-slate-800 shadow-2xl text-[10px] space-y-1.5 max-w-xs">
            <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
              <span>Routing Map Legend</span>
              <span className="text-amber-400 font-mono">+{activeHorizon}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-[#06b6d4]" />
                <span>Emergency Priority</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-[#10b981]" />
                <span>Safest Path</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-[#3b82f6]" />
                <span>Fastest Route</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-[#a855f7] border-b border-dashed border-white" />
                <span>Shortest Path</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-[#ef4444] border-b border-dashed border-white" />
                <span>Avoided / Flooded</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span>⛔</span>
                <span>Impassable Blockage</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ROAD-BY-ROAD ROUTE BREAKDOWN */}
      {activeRouteObj && activeRouteObj.roads && activeRouteObj.roads.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Route Breakdown &bull; Turn-by-Turn Road Segments
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-[10px] font-bold">
                {activeRouteObj.roads.length} Segments
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Total Distance: <b className="text-white font-mono">{activeRouteObj.distance_km} km</b> &bull; Total Time: <b className="text-white font-mono">{activeRouteObj.travel_time_min || activeRouteObj.duration_min} min</b>
            </span>
          </div>

          <div className="space-y-2">
            {/* Origin Node Header */}
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-xs flex items-center justify-between text-emerald-300">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-bold">START: {origin.name}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">0.0 km</span>
            </div>

            {/* Sequence of Roads */}
            <div className="space-y-1.5 pl-3 border-l-2 border-slate-800 ml-3">
              {activeRouteObj.roads.map((seg, idx) => {
                const isWarning = seg.predicted_depth_cm > 12;
                const isSafe = seg.predicted_depth_cm <= 5;
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-100">{seg.road_name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 font-mono">
                          {seg.road_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 pl-7 flex items-center space-x-1">
                        <span>{seg.from_node}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>{seg.to_node}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] pl-7 sm:pl-0">
                      <div>
                        <span className="text-slate-400">Length: </span>
                        <span className="font-mono text-slate-200">{seg.length_km} km</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Ponding: </span>
                        <span className={`font-mono font-bold ${isSafe ? 'text-emerald-400' : (isWarning ? 'text-rose-400' : 'text-amber-400')}`}>
                          {seg.predicted_depth_cm} cm
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Speed: </span>
                        <span className="font-mono text-slate-200">{seg.speed_kmh} km/h</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        seg.status === 'PASSABLE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {seg.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Destination Node Footer */}
            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs flex items-center justify-between text-rose-300">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="font-bold">DESTINATION: {destination.name}</span>
              </div>
              <span className="text-[10px] text-rose-400 font-mono">Arrived ({activeRouteObj.distance_km} km)</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. ROADS AVOIDED BY UFNS (Clearance Rejection Transparency) */}
      {routeResult?.avoided_edges && routeResult.avoided_edges.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rose-400 border-b border-slate-800 pb-2">
            <AlertOctagon className="w-4 h-4" />
            <span>
              Roads Avoided by UFNS &bull; Clearance Rejections ({routeResult.avoided_edges.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {routeResult.avoided_edges.map((edge, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/50 text-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-200 flex items-center space-x-1.5">
                      <span>⛔</span>
                      <span>{edge.road_name}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                      IMPASSABLE
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Predicted Water:</span>
                      <span className="text-rose-400 font-bold">{edge.predicted_depth_cm} cm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{vehicleType.toUpperCase()} Clearance:</span>
                      <span className="text-slate-200">{edge.clearance_cm} cm</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 pt-2 border-t border-rose-900/40">
                  <span className="text-slate-400 font-semibold">Avoidance Reason: </span>
                  <span>{edge.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
