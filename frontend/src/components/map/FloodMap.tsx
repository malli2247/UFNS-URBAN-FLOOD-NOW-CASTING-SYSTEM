import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { useSimulation } from '../../context/SimulationContext';
import {
  Layers,
  Compass,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Info,
  AlertTriangle,
  Waves,
  Radio,
  GitFork,
  Activity,
  Shield,
  Hospital,
  Flame,
  Home,
  Navigation,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Mountain,
  Grid,
  Satellite
} from 'lucide-react';
import { DEFAULT_TERRAIN_CONTOURS } from '../../data/terrainContours';
import { RoadFeature, EmergencyFacility, FloodRiskZone, DrainageNode, DrainageEdge, GridCell } from '../../types';
import { DigitalTwin3D } from './DigitalTwin3D';
import { StoryModeOverlay } from '../story/StoryModeOverlay';
import { PREDICTED_FLOOD_ZONE_POLYGON, STORY_STAGES, DEMO_ALTITUDE_MARKERS, getStoryStagesForCity, getWhyThisAreaForCity, getAltitudeMarkersForCity } from '../../data/storyStepsData';
import { globalStoryCamera } from '../../utils/StoryCameraController';
import { Sparkles } from 'lucide-react';
import {
  DEMO_FLOOD_COLORS,
  ROUTE_PALETTE,
  DRAINAGE_PALETTE,
  WATER_MOVING_COLOR,
  CONTOUR_NEUTRAL_COLOR,
  getFloodDepthColor,
  getFloodDepthLabel
} from '../../config/floodColors';

interface FloodMapProps {
  compact?: boolean;
}

export const FloodMap: React.FC<FloodMapProps> = ({ compact = false }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Basemap style: dark-osm | satellite | standard-osm
  const [basemapType, setBasemapType] = useState<'dark-osm' | 'satellite' | 'standard-osm'>('dark-osm');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activePanel, setActivePanel] = useState<'layers' | 'style' | 'opacity' | null>(null);

  // Grouped Toggleable Layers (Clean Scientific Defaults)
  // Group 1: Hydrology & Depth
  const [showFloodDepth, setShowFloodDepth] = useState(true);
  const [showRadar, setShowRadar] = useState(false);
  const [showFlowDirection, setShowFlowDirection] = useState(false);
  const [showRiskZones, setShowRiskZones] = useState(false);

  // Group 2: Drainage Network
  const [showDrainagePipes, setShowDrainagePipes] = useState(true);
  const [showDrainageNodes, setShowDrainageNodes] = useState(true);
  const [showDrainageSurcharge, setShowDrainageSurcharge] = useState(true);

  // Group 3: Roads & Routing
  const [showRoads, setShowRoads] = useState(true);
  const [showRoadStatus, setShowRoadStatus] = useState(true);
  const [showSafeRoutes, setShowSafeRoutes] = useState(true);
  const [showEmergencyRoutes, setShowEmergencyRoutes] = useState(true);

  // Group 4: Assets & Telemetry
  const [showSensors, setShowSensors] = useState(true);
  const [showCitizenReports, setShowCitizenReports] = useState(false);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showFireStations, setShowFireStations] = useState(true);
  const [showPoliceStations, setShowPoliceStations] = useState(true);

  // Universal Popup System State
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);

  const {
    prediction,
    drainageNetwork,
    roads,
    facilities,
    radarData,
    riskZones,
    citizenReports,
    sensors,
    activeHorizon,
    dataMode,
    activeRoute,
    alerts,
    twinMode,
    setTwinMode,
    mapViewMode,
    setMapViewMode,
    satelliteOpacity,
    setSatelliteOpacity,
    blueprintOpacity,
    setBlueprintOpacity,
    floodOpacity,
    setFloodOpacity,
    showWireframe,
    setShowWireframe,
    showContours,
    setShowContours,
    contours,
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    isStoryMode,
    setIsStoryMode,
    storyStep,
    setStoryStep,
    isStoryAutoPlaying,
    startStoryMode,
    stopStoryMode,
    focusTarget,
    selectedCity,
    selectedCityConfig,
    cityStoryData
  } = useSimulation();

  // Focus camera on target when focusTarget changes in Story Mode
  useEffect(() => {
    if (focusTarget && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(focusTarget.center, focusTarget.zoom, {
        animate: true,
        duration: 1.2
      });
    }
  }, [focusTarget]);

  // Color mapping based on depth cm using centralized scientific palette
  const getDepthColor = (depthCm: number) => getFloodDepthColor(depthCm);

  // Camera flyTo on city change (when not in story mode)
  useEffect(() => {
    if (mapInstanceRef.current && selectedCityConfig?.center && !isStoryMode) {
      const c = selectedCityConfig.center;
      mapInstanceRef.current.flyTo([c.latitude, c.longitude], 13.5, {
        animate: true,
        duration: 1.2
      });
    }
  }, [selectedCity]);

  // Helper to re-center map to active basin
  const recenterMap = () => {
    if (mapInstanceRef.current && mapCenter) {
      mapInstanceRef.current.setView([mapCenter[1], mapCenter[0]], mapZoom || 13);
      mapInstanceRef.current.invalidateSize();
    }
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
      globalStoryCamera.setLeafletMap(map);

      map.on('moveend', () => {
        const c = map.getCenter();
        setMapCenter([c.lng, c.lat]);
        setMapZoom(map.getZoom());
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      window.addEventListener('resize', () => map.invalidateSize());
    }

    return () => {
      // Keep map alive unless unmounted
    };
  }, []);

  // Invalidate map size when full screen toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullScreen]);

  // Update Base Tile Layer with Satellite + Blueprint support
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let newTileLayer: L.TileLayer;

    if (mapViewMode === 'satellite') {
      newTileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri &mdash; High-Resolution Aerial Imagery',
          maxZoom: 18,
          opacity: satelliteOpacity,
        }
      );
    } else if (mapViewMode === 'satellite_blueprint') {
      newTileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri &mdash; High-Resolution Aerial Imagery',
          maxZoom: 18,
          opacity: satelliteOpacity * 0.85,
        }
      );
    } else if (mapViewMode === 'street') {
      newTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });
    } else if (mapViewMode === 'blueprint') {
      newTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        className: 'ufns-dark-tiles',
        maxZoom: 19,
        opacity: 0.20,
      });
    } else {
      // Dark OSM: Clean inverted dark mode, ZERO watermark, NO API KEY required
      newTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        className: 'ufns-dark-tiles',
        maxZoom: 19,
      });
    }

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
    map.invalidateSize();
  }, [mapViewMode, satelliteOpacity]);

  // Render Overlays according to active layers and simulation state
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous overlay layers (preserve tile layer)
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) return;
      map.removeLayer(layer);
    });

    const overlayGroup = L.layerGroup().addTo(map);

    // Story Mode Stage Spotlight Configuration
    const cityStages = getStoryStagesForCity(selectedCityConfig);
    const currentStoryStage = isStoryMode ? (cityStages.find(s => s.id === storyStep) || STORY_STAGES.find(s => s.id === storyStep)) : null;
    const effShowFloodDepth = isStoryMode ? (currentStoryStage?.visibleLayers.floodGrid ?? false) : showFloodDepth;
    const effShowRadar = isStoryMode ? (currentStoryStage?.visibleLayers.radar ?? false) : showRadar;
    const effShowDrainagePipes = isStoryMode ? (currentStoryStage?.visibleLayers.drainage ?? false) : showDrainagePipes;
    const effShowDrainageNodes = isStoryMode ? (currentStoryStage?.visibleLayers.drainage ?? false) : showDrainageNodes;
    const effShowDrainageSurcharge = isStoryMode ? (currentStoryStage?.visibleLayers.surchargeNodeHighlight ?? false) : showDrainageSurcharge;
    const effShowRoads = isStoryMode ? (currentStoryStage?.visibleLayers.roads ?? true) : showRoads;
    const effShowSafeRoutes = isStoryMode ? (currentStoryStage?.visibleLayers.routes ?? false) : showSafeRoutes;
    const effShowEmergencyRoutes = isStoryMode ? (currentStoryStage?.visibleLayers.routes ?? false) : showEmergencyRoutes;
    const effShowAmbulance = isStoryMode ? (currentStoryStage?.visibleLayers.ambulance ?? false) : false;
    const effShowSensors = isStoryMode ? false : showSensors;
    const effShowFacilities = isStoryMode ? (currentStoryStage?.visibleLayers.facilities ?? true) : true;
    const effShowRiskZones = isStoryMode ? false : showRiskZones;
    const effShowFlowDirection = isStoryMode ? (storyStep === 4) : showFlowDirection;

    // =========================================================================
    // CINEMATIC SPOTLIGHT MASK SYSTEM: Dims non-relevant surroundings to 40%
    // =========================================================================
    if (isStoryMode && currentStoryStage?.spotlightTarget) {
      const target = currentStoryStage.spotlightTarget;
      const radiusDeg = target.radiusKm / 111.0;
      const cLat = target.center[0];
      const cLon = target.center[1];

      // Circular cutout hole around focal problem
      const holeCoords: [number, number][] = [];
      for (let i = 0; i <= 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        const lat = cLat + (radiusDeg * 0.88) * Math.sin(angle);
        const lon = cLon + radiusDeg * Math.cos(angle);
        holeCoords.push([lat, lon]);
      }

      // World boundary inverted polygon
      const outerBox: [number, number][] = [
        [85, -180],
        [85, 180],
        [-85, 180],
        [-85, -180],
        [85, -180]
      ];

      const spotlightMask = L.polygon([outerBox, holeCoords], {
        color: '#000000',
        weight: 0,
        fillColor: '#050914',
        fillOpacity: 0.52,
        interactive: false
      });
      overlayGroup.addLayer(spotlightMask);

      // Subtle neon boundary ring around spotlight area
      const spotlightRing = L.circle([cLat, cLon], {
        radius: target.radiusKm * 1000 * 0.92,
        color: currentStoryStage.semanticColor,
        weight: 1.8,
        dashArray: '6, 6',
        fill: false,
        opacity: 0.65,
        interactive: false
      });
      overlayGroup.addLayer(spotlightRing);

      // Double pulse subtle highlight ring at focal center
      const pulseIcon = L.divIcon({
        className: 'spotlight-double-pulse',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 2px solid ${currentStoryStage.semanticColor}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) 2; opacity: 0.75;"></div>
            <div style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid ${currentStoryStage.semanticColor}; background: ${currentStoryStage.semanticColor}35;"></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });
      overlayGroup.addLayer(L.marker([cLat, cLon], { icon: pulseIcon, interactive: false }));
    }

    // =========================================================================
    // 10-SCENE STORY MODE DYNAMIC SPATIAL FEATURES
    // =========================================================================

    // SCENE 2: Heavy Rainfall Particles (Sky Blue Moving Water)
    if (isStoryMode && storyStep === 2) {
      const cLat = selectedCityConfig?.center?.latitude || 12.936;
      const cLon = selectedCityConfig?.center?.longitude || 77.642;
      const rainCoords: [number, number][] = [
        [cLat + 0.006, cLon - 0.010],
        [cLat + 0.002, cLon + 0.003],
        [cLat - 0.005, cLon - 0.004],
        [cLat + 0.009, cLon - 0.001],
        [cLat - 0.002, cLon + 0.006],
        [cLat, cLon - 0.017],
        [cLat + 0.004, cLon + 0.013],
        [cLat - 0.008, cLon - 0.007]
      ];
      rainCoords.forEach(([rLat, rLon], idx) => {
        const rainDrop = L.divIcon({
          className: 'rain-drop-particle',
          html: `<div style="color: ${WATER_MOVING_COLOR}; font-size: 16px; animation: bounce 0.9s infinite; animation-delay: ${idx * 0.12}s; text-shadow: 0 0 10px #38bdf8;">🌧️</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        overlayGroup.addLayer(L.marker([rLat, rLon], { icon: rainDrop, interactive: false }));
      });
    }

    // SCENE 3: Visible Topographic Elevation Markers Directly on the Map (No Altitude Rainbow Colors)
    if (isStoryMode && (storyStep === 3 || currentStoryStage?.visibleLayers.elevationContours)) {
      const activeAltitudeMarkers = selectedCityConfig?.dem?.markers || cityStoryData?.altitude_markers || DEMO_ALTITUDE_MARKERS;
      activeAltitudeMarkers.forEach((marker: any) => {
        const isTrough = marker.tag?.includes('LOW') || marker.tag?.includes('Trough') || marker.elevM === selectedCityConfig?.story?.elevation_low;
        const isRidge = marker.tag?.includes('HIGH') || marker.tag?.includes('Ridge') || marker.elevM === selectedCityConfig?.story?.elevation_high;
        const badgeColor = isTrough ? '#f43f5e' : (isRidge ? '#38bdf8' : '#cbd5e1');

        const altIcon = L.divIcon({
          className: 'alt-marker-badge',
          html: `
            <div style="background: rgba(11, 15, 25, 0.94); border: 1.5px solid ${badgeColor}; border-radius: 8px; padding: 3px 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.7); display: flex; align-items: center; gap: 6px; font-family: monospace; white-space: nowrap; pointer-events: none; backdrop-blur: 8px;">
              <span style="font-weight: 900; font-size: 11px; color: #ffffff; letter-spacing: 0.5px;">${marker.label}</span>
              <span style="font-size: 9px; font-weight: 700; color: ${badgeColor};">${marker.tag}</span>
            </div>
          `,
          iconSize: [140, 26],
          iconAnchor: [70, 13]
        });
        overlayGroup.addLayer(L.marker([marker.lat, marker.lon], { icon: altIcon, interactive: false, zIndexOffset: 800 }));
      });
    }

    // SCENE 4: Downhill Surface Water Runoff Streams (Sky-Blue Moving Overland Flow)
    if (isStoryMode && storyStep === 4) {
      const cLat = selectedCityConfig?.center?.latitude || 12.936;
      const cLon = selectedCityConfig?.center?.longitude || 77.642;
      const runoffStreams: [number, number][][] = [
        [[cLat + 0.010, cLon - 0.024], [cLat + 0.006, cLon - 0.016], [cLat + 0.001, cLon - 0.006], [cLat - 0.002, cLon + 0.006], [cLat - 0.002, cLon + 0.016]],
        [[cLat + 0.004, cLon - 0.022], [cLat, cLon - 0.014], [cLat - 0.002, cLon - 0.004], [cLat - 0.004, cLon + 0.007], [cLat - 0.002, cLon + 0.016]],
        [[cLat + 0.012, cLon - 0.017], [cLat + 0.007, cLon - 0.008], [cLat + 0.002, cLon + 0.002], [cLat - 0.001, cLon + 0.010], [cLat - 0.002, cLon + 0.016]]
      ];

      runoffStreams.forEach((streamCoords) => {
        const streamPoly = L.polyline(streamCoords, {
          color: WATER_MOVING_COLOR,
          weight: 3.5,
          dashArray: '8, 6',
          opacity: 0.95
        });
        overlayGroup.addLayer(streamPoly);
      });

      // Moving downhill stream badges
      const runoffBadge = L.marker([12.938, 77.636], {
        icon: L.divIcon({
          className: 'runoff-badge',
          html: '<div style="background: rgba(14, 165, 233, 0.92); border: 1px solid #38bdf8; border-radius: 6px; padding: 2px 7px; color: #082f49; font-size: 10px; font-weight: 800; font-family: monospace; box-shadow: 0 0 12px #38bdf8; white-space: nowrap;">➔ DOWNHILL RUNOFF: 2.4 m³/s (Δh = 40m) ➔</div>',
          iconAnchor: [120, 12]
        })
      });
      overlayGroup.addLayer(runoffBadge);
    }

    // SCENE 5: Predicted Flood Zone Boundary Polygon (Accumulated Flood Water)
    if (isStoryMode && (storyStep === 5 || currentStoryStage?.visibleLayers.floodZoneBoundary)) {
      const floodZoneCoords: L.LatLngExpression[] = PREDICTED_FLOOD_ZONE_POLYGON.map(([lon, lat]) => [lat, lon]);
      const fzPoly = L.polygon(floodZoneCoords, {
        color: '#2563eb',
        weight: 3.0,
        dashArray: '6, 6',
        fillColor: '#1d4ed8',
        fillOpacity: 0.28,
      });
      fzPoly.bindTooltip('<b>PREDICTED FLOOD ACCUMULATION BASIN</b><br/>Area: <b>1.84 km²</b> &bull; Depression Floor: <b>875m AMSL</b><br/>Max Standing Depth: <b>46.5 cm (Blue Flood Scale)</b>', {
        permanent: true,
        direction: 'center',
        className: 'flood-zone-tooltip font-mono font-bold text-xs'
      });
      overlayGroup.addLayer(fzPoly);
    }

    // SCENE 6: Subterranean Drainage Flow toward Bellandur Outfall (White Pipes + Sky Blue Water)
    if (isStoryMode && storyStep === 6) {
      const outfallMarker = L.marker([12.934, 77.662], {
        icon: L.divIcon({
          className: 'outfall-badge',
          html: '<div style="background: rgba(16, 185, 129, 0.92); border: 1.5px solid #ffffff; border-radius: 6px; padding: 2px 7px; color: #ffffff; font-size: 10px; font-weight: 800; font-family: monospace; box-shadow: 0 0 12px #10b981; white-space: nowrap;">DRAINAGE DISCHARGE ➔ Bellandur Outfall (2.4 m³/s)</div>',
          iconAnchor: [150, 12]
        })
      });
      overlayGroup.addLayer(outfallMarker);
    }

    // SCENE 7: Critical Drainage Surcharge Node & Reverse Backflow Emitter (Dynamic Surcharge Node)
    if (isStoryMode && (storyStep === 7 || currentStoryStage?.visibleLayers.surchargeNodeHighlight)) {
      const cLat = selectedCityConfig?.center?.latitude || 12.936;
      const cLon = selectedCityConfig?.center?.longitude || 77.642;
      const surchargedNode = drainageNetwork?.nodes?.find(n => n.is_surcharged) || drainageNetwork?.nodes?.[1];
      const m02Lat = surchargedNode ? surchargedNode.lat : (selectedCityConfig?.story?.camera_poses?.surcharge_manhole?.center?.[0] || cLat - 0.002);
      const m02Lon = surchargedNode ? surchargedNode.lon : (selectedCityConfig?.story?.camera_poses?.surcharge_manhole?.center?.[1] || cLon - 0.017);
      const surchargedName = selectedCityConfig?.story?.surcharge_node || surchargedNode?.name || 'Central Surcharged Junction';

      const halo = L.circleMarker([m02Lat, m02Lon], {
        radius: 22,
        color: DRAINAGE_PALETTE.SURCHARGED,
        weight: 3.5,
        fillColor: '#ef4444',
        fillOpacity: 0.55,
      });
      halo.bindTooltip(`<b>SURCHARGED JUNCTION: ${surchargedName}</b><br/>Capacity: 2.5 m³/s &bull; Inflow: <b>2.7 m³/s (108% LOAD)</b><br/>HGL > Rim: Reverse backflow spill (+18 cm)`, {
        permanent: true,
        direction: 'top',
        className: 'surcharge-tooltip font-bold text-xs'
      });
      overlayGroup.addLayer(halo);

      // Backflow Emitter Visualizer with Sky-Blue water spewing out
      const backflowIcon = L.divIcon({
        className: 'backflow-emitter-badge',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none;">
            <div style="color: ${WATER_MOVING_COLOR}; font-size: 10px; font-weight: 800; font-family: monospace; background: rgba(15,23,42,0.95); border: 1.5px solid ${WATER_MOVING_COLOR}; border-radius: 6px; padding: 2px 6px; box-shadow: 0 0 14px ${WATER_MOVING_COLOR}; animation: bounce 1.2s infinite;">
              ▲ SKY-BLUE REVERSE BACKFLOW SPILL (+18cm) ▲
            </div>
            <div style="width: 36px; height: 36px; border-radius: 50%; border: 2.5px solid #ef4444; background: rgba(56, 189, 248, 0.4); animation: ping 1.4s infinite; margin-top: 4px;"></div>
          </div>
        `,
        iconSize: [220, 60],
        iconAnchor: [110, 50]
      });
      overlayGroup.addLayer(L.marker([m02Lat, m02Lon], { icon: backflowIcon, interactive: false, zIndexOffset: 900 }));
    }

    // SCENE 8: Blocked Road Segment & Impassable Direct Route
    if (isStoryMode && (storyStep === 8 || currentStoryStage?.visibleLayers.blockedRoadsHighlight)) {
      const cLat = selectedCityConfig?.center?.latitude || 12.936;
      const cLon = selectedCityConfig?.center?.longitude || 77.642;
      const blockedRoad = roads?.find(r => r.travel_status === 'BLOCKED') || roads?.[1];
      const roadCoord = blockedRoad?.coordinates?.[0] || [cLat - 0.002, cLon - 0.017];
      const roadLat = roadCoord[0];
      const roadLon = roadCoord[1];
      const roadName = selectedCityConfig?.story?.hotspot_road || blockedRoad?.name || 'Arterial Road Corridor';
      const origName = selectedCityConfig?.story?.hospital_origin || 'District Hospital';
      const destName = selectedCityConfig?.story?.hospital_dest || 'Emergency Trauma Center';
      const origCoord = [cLat - 0.007, cLon - 0.024] as [number, number];
      const destCoord = [cLat - 0.008, cLon + 0.040] as [number, number];

      const blockedLabel = L.marker([roadLat, roadLon], {
        icon: L.divIcon({
          className: 'blocked-road-badge',
          html: `<div class="px-2.5 py-1.5 rounded-xl bg-rose-950/95 border-2 border-rose-500 text-rose-200 font-bold text-[11px] shadow-2xl flex items-center space-x-1.5 animate-pulse"><span>⛔ ROAD BLOCKED: ${roadName} (46.5cm &gt; 25cm clearance)</span></div>`,
          iconAnchor: [160, 15]
        }),
        zIndexOffset: 850
      });
      overlayGroup.addLayer(blockedLabel);

      // Direct Route Impassable Overlay in Scene 8
      const directRouteCoords: [number, number][] = [
        origCoord,
        [roadLat, roadLon],
        [cLat, cLon - 0.002],
        [cLat - 0.004, cLon + 0.018],
        destCoord
      ];
      const directPoly = L.polyline(directRouteCoords, {
        color: '#ef4444',
        weight: 4.5,
        dashArray: '8, 8',
        opacity: 0.95
      });
      directPoly.bindTooltip('<b>DIRECT ROUTE (Impassable)</b><br/>Status: <b style="color:#ef4444">IMPASSABLE (46.5 cm flood)</b><br/>Risk: <b>AMBULANCE STALL HAZARD</b>', {
        permanent: true,
        direction: 'top',
        className: 'direct-route-tooltip font-mono text-xs'
      });
      overlayGroup.addLayer(directPoly);

      // Origin & Destination Badges
      const origIcon = L.divIcon({
        className: 'hosp-orig',
        html: `<div style="background: #10b981; color: white; border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:11px; box-shadow: 0 0 12px #10b981;">A</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      const destIcon = L.divIcon({
        className: 'hosp-dest',
        html: `<div style="background: #ec4899; color: white; border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:11px; box-shadow: 0 0 12px #ec4899;">B</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      overlayGroup.addLayer(L.marker(origCoord, { icon: origIcon }).bindTooltip(`<b>ORIGIN: ${origName}</b>`, { permanent: true, direction: 'left' }));
      overlayGroup.addLayer(L.marker(destCoord, { icon: destIcon }).bindTooltip(`<b>DESTINATION: ${destName}</b>`, { permanent: true, direction: 'right' }));
    }

    // ==========================================
    // LAYER 0: DEM TOPOGRAPHIC CONTOURS (875m to 915m AMSL)
    // ==========================================
    const isContoursActive = (showContours || (isStoryMode && (storyStep === 3 || currentStoryStage?.visibleLayers.elevationContours))) && (mapViewMode === 'satellite_blueprint' || mapViewMode === 'blueprint' || mapViewMode === 'twin_3d' || mapViewMode === 'dark' || isStoryMode);
    if (isContoursActive) {
      const activeContours = contours || DEFAULT_TERRAIN_CONTOURS;
      if (activeContours?.features) {
        activeContours.features.forEach((feat: any) => {
          const elev = feat.properties.elevation_m;
          const isIndex = feat.properties.type === 'INDEX';
          // STRICT NO ALTITUDE RAINBOW: Clean technical neutral contour lines
          const color = CONTOUR_NEUTRAL_COLOR;

          const coords = feat.geometry.type === 'MultiLineString'
            ? feat.geometry.coordinates.map((line: any[]) => line.map(([lon, lat]: [number, number]) => [lat, lon]))
            : [feat.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon])];

          coords.forEach((lineCoords: any[]) => {
            const line = L.polyline(lineCoords, {
              color,
              weight: isIndex ? 2.2 : 1.1,
              dashArray: isIndex ? undefined : '3, 3',
              opacity: isIndex ? 0.85 * blueprintOpacity : 0.55 * blueprintOpacity,
            });
            line.bindTooltip(`<b>DEM Topographic Contour:</b> ${elev} m AMSL (${isIndex ? 'Index' : 'Intermediate'})`, {
              sticky: true,
            });
            overlayGroup.addLayer(line);
          });
        });
      }
    }

    // ==========================================
    // LAYER 1: FLOOD RISK ZONES (Polygons)
    // ==========================================
    if (effShowRiskZones && riskZones && riskZones.length > 0) {
      riskZones.forEach(zone => {
        const poly = L.polygon(zone.polygon_coordinates, {
          color: zone.color,
          weight: 2,
          dashArray: '5, 5',
          fillColor: zone.color,
          fillOpacity: zone.fill_opacity,
        });

        poly.on('click', () => {
          setSelectedFeature({
            objectType: 'Flood Risk Zone',
            id: zone.zone_id,
            title: zone.name,
            state: `${zone.risk_level} INUNDATION RISK`,
            measurements: [
              { label: 'Risk Rating', value: zone.risk_level, highlight: zone.color },
              { label: 'Mean Water Depth', value: `${zone.mean_depth_cm} cm` },
              { label: 'Affected Inundation Area', value: `${zone.area_km2} km²` },
              { label: 'Topographic Elevation Range', value: zone.elevation_range },
              { label: 'Hydrologic Grid Cells', value: `${zone.cell_count} cells` },
            ],
            why: zone.recommended_action,
            source: `${dataMode} Risk Assessment`,
            horizon: activeHorizon,
          });
        });

        poly.bindTooltip(`<b>${zone.name}</b><br/>Risk: <b>${zone.risk_level}</b> &bull; Area: ${zone.area_km2} km²`);
        overlayGroup.addLayer(poly);
      });
    }

    // ==========================================
    // LAYER 2: FLOOD WATER DEPTH GRID
    // ==========================================
    if (effShowFloodDepth && prediction?.grid) {
      const bounds = prediction?.bounds || {
        min_lat: selectedCityConfig?.bounding_box?.min_lat || 12.912,
        max_lat: selectedCityConfig?.bounding_box?.max_lat || 12.962,
        min_lon: selectedCityConfig?.bounding_box?.min_lon || 77.605,
        max_lon: selectedCityConfig?.bounding_box?.max_lon || 77.675
      };
      const cellSizeLat = (bounds.max_lat - bounds.min_lat) / 16;
      const cellSizeLon = (bounds.max_lon - bounds.min_lon) / 16;

      prediction.grid.forEach(cell => {
        if (cell.water_depth_cm > 0.8) {
          const bounds: L.LatLngBoundsExpression = [
            [cell.lat - cellSizeLat / 2, cell.lon - cellSizeLon / 2],
            [cell.lat + cellSizeLat / 2, cell.lon + cellSizeLon / 2],
          ];

          const color = getDepthColor(cell.water_depth_cm);
          const rect = L.rectangle(bounds, {
            color: color,
            weight: 0.5,
            fillColor: color,
            fillOpacity: Math.min(0.60, floodOpacity * (0.65 + (cell.water_depth_cm / 80.0) * 0.35)),
          });

          rect.on('click', () => {
            setSelectedFeature({
              objectType: 'Flood Depth Grid Cell',
              id: cell.cell_id,
              title: `Grid Cell ${cell.cell_id}`,
              state: `${cell.risk_level} RISK (${cell.water_depth_cm} cm)`,
              measurements: [
                { label: 'Predicted Water Depth', value: `${cell.water_depth_cm} cm`, highlight: color },
                { label: 'Rainfall Intensity', value: `${cell.rainfall_rate_mm_hr} mm/hr` },
                { label: 'Elevation', value: `${cell.elevation_m} m AMSL` },
                { label: 'Terrain Slope', value: `${cell.slope_deg}°` },
                { label: 'Imperviousness Factor', value: `${(cell.imperviousness * 100).toFixed(0)}% (Urban concrete)` },
                { label: 'Downhill Flow Direction', value: `${cell.flow_direction_compass || 'SE'} (${cell.flow_direction_deg.toFixed(1)}°)` },
                { label: 'Drainage Surcharge Spill', value: cell.drainage_surcharge_cm > 0 ? `+${cell.drainage_surcharge_cm} cm` : 'None (Gravity Intake)' },
                { label: 'Nowcast Confidence', value: `${cell.confidence_pct}%` },
              ],
              why: cell.why_prediction || `Rainfall accumulation in local depression (elev ${cell.elevation_m}m) with ${cell.slope_deg}° runoff gradient.`,
              source: `${dataMode} / Hydro-Engine Coupled`,
              horizon: activeHorizon,
            });
          });

          rect.bindTooltip(
            `<b>Cell ${cell.cell_id}</b><br/>Depth: <b>${cell.water_depth_cm} cm</b><br/>Risk: <b>${cell.risk_level}</b><br/>Flow: <b>${cell.flow_direction_compass || 'SE'}</b>`,
            { sticky: true }
          );

          overlayGroup.addLayer(rect);
        }
      });
    }

    // ==========================================
    // LAYER 3: D8 SURFACE FLOW DIRECTION ARROWS
    // ==========================================
    if (effShowFlowDirection && prediction?.grid) {
      prediction.grid.forEach(cell => {
        // Only show arrows where there is active surface water movement (depth > 1.0 cm)
        if (cell.water_depth_cm > 1.2 && (cell.row % 2 === 0 && cell.col % 2 === 0)) {
          const bearing = cell.flow_direction_deg || 135;
          const arrowIcon = L.divIcon({
            className: 'flow-arrow-marker',
            html: `<div style="transform: rotate(${bearing}deg); font-size: 13px; color: #38bdf8; text-shadow: 0 0 4px #0284c7; font-weight: bold;">➔</div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          const arrowMarker = L.marker([cell.lat, cell.lon], { icon: arrowIcon, interactive: false });
          overlayGroup.addLayer(arrowMarker);
        }
      });
    }

    // ==========================================
    // LAYER 4: DOPPLER RADAR REFLECTIVITY & COVERAGE
    // ==========================================
    if (effShowRadar) {
      // 1. Radar Station Coverage Circle
      const cLat = selectedCityConfig?.center?.latitude || 12.936;
      const cLon = selectedCityConfig?.center?.longitude || 77.642;
      const cityName = selectedCityConfig?.city || 'IMD Doppler';
      const radarStn = radarData?.radar_station || {
        name: selectedCityConfig?.rainfall?.radar_station || `${cityName} Doppler Weather Radar (IMD)`,
        lat: cLat + 0.035,
        lon: cLon - 0.020,
        coverage_radius_m: 4500,
        frequency: 'C-Band (5.62 GHz)',
        status: 'OPERATIONAL'
      };

      const coverageCircle = L.circle([radarStn.lat, radarStn.lon], {
        radius: radarStn.coverage_radius_m,
        color: '#8b5cf6',
        weight: 1.5,
        dashArray: '6, 6',
        fillColor: '#8b5cf6',
        fillOpacity: 0.05,
      });

      coverageCircle.on('click', () => {
        setSelectedFeature({
          objectType: 'Doppler Weather Radar Station',
          id: 'IMD-DWR-BLR',
          title: radarStn.name,
          state: radarStn.status,
          measurements: [
            { label: 'Frequency', value: radarStn.frequency },
            { label: 'Coverage Radius', value: `${radarStn.coverage_radius_m / 1000} km (Basin scan)` },
            { label: 'Sweep Strategy', value: 'VCP-21 (Volume Coverage)' },
            { label: 'Beam Resolution', value: '250m x 250m polar gate' },
            { label: 'Data Provenance', value: `IMD Radar Grid (${dataMode})` },
          ],
          why: 'C-band polarimetric radar detects precipitation reflectivity (Z). UFNS advection engine tracks storm convective cells across Koramangala basin.',
          source: dataMode,
          horizon: activeHorizon,
        });
      });

      coverageCircle.bindTooltip(`<b>${radarStn.name}</b><br/>Coverage: ${radarStn.coverage_radius_m / 1000} km &bull; Status: ${radarStn.status}`);
      overlayGroup.addLayer(coverageCircle);

      // 2. Storm Convective Cells
      const stormCells = radarData?.storm_cells || [
        { cell_id: 'CELL-01', name: `${cityName} Meso-Convective Core`, lat: cLat - 0.006, lon: cLon - 0.017, radius_m: 1900, reflectivity_dbz: 54.5, speed_kmh: 22 },
        { cell_id: 'CELL-02', name: `${selectedCityConfig?.focus_basin?.name || 'Catchment'} Supercell Feeder`, lat: cLat + 0.006, lon: cLon + 0.010, radius_m: 2400, reflectivity_dbz: 58.2, speed_kmh: 24 }
      ];

      stormCells.forEach((storm, idx) => {
        const stormCircle = L.circle([storm.lat, storm.lon], {
          radius: storm.radius_m,
          color: storm.reflectivity_dbz > 55 ? '#ec4899' : '#a855f7',
          weight: 2,
          dashArray: '4, 4',
          fillColor: storm.reflectivity_dbz > 55 ? '#f43f5e' : '#a855f7',
          fillOpacity: 0.18,
        });

        stormCircle.on('click', () => {
          setSelectedFeature({
            objectType: 'Radar Storm Convective Cell',
            id: storm.cell_id,
            title: storm.name,
            state: `ACTIVE (${storm.reflectivity_dbz} dBZ)`,
            measurements: [
              { label: 'Radar Reflectivity (Z)', value: `${storm.reflectivity_dbz} dBZ`, highlight: '#ec4899' },
              { label: 'Equivalent Rain Rate', value: `${(storm.rainfall_equivalent_mm_hr || 85).toFixed(1)} mm/hr` },
              { label: 'Storm Diameter', value: `${(storm.radius_m * 2 / 1000).toFixed(1)} km` },
              { label: 'Advection Velocity', value: `${storm.speed_kmh} km/h toward ENE (70°)` },
              { label: 'Classification', value: storm.reflectivity_dbz > 55 ? 'Severe Convective Cell' : 'Moderate Rain Band' },
            ],
            why: 'Intense radar echo returns indicate high liquid water content aloft, advecting northeastward with prevailing mid-tropospheric winds.',
            source: `IMD DWR / ${dataMode}`,
            horizon: activeHorizon,
          });
        });

        stormCircle.bindTooltip(`<b>${storm.name}</b><br/>Reflectivity: <b>${storm.reflectivity_dbz} dBZ</b><br/>Label: ${dataMode}`);
        overlayGroup.addLayer(stormCircle);
      });
    }

    // ==========================================
    // LAYER 5: DRAINAGE NETWORK PIPES (Graph Edges)
    // ==========================================
    if (effShowDrainagePipes && drainageNetwork?.edges && drainageNetwork?.nodes) {
      drainageNetwork.edges.forEach(edge => {
        const fromNode = drainageNetwork.nodes.find(n => n.node_id === edge.from_node);
        const toNode = drainageNetwork.nodes.find(n => n.node_id === edge.to_node);
        if (fromNode && toNode) {
          const isSurcharged = edge.status === 'SURCHARGED';
          const isWarning = edge.status === 'WARNING';
          const color = isSurcharged ? DRAINAGE_PALETTE.SURCHARGED : (isWarning ? DRAINAGE_PALETTE.WARNING : DRAINAGE_PALETTE.NORMAL);
          const weight = isSurcharged ? 3.5 : (isWarning ? 2.5 : 1.8);
          const opacity = isSurcharged ? 0.95 : (isWarning ? 0.75 : 0.55);

          const poly = L.polyline([[fromNode.lat, fromNode.lon], [toNode.lat, toNode.lon]], {
            color: color,
            weight: weight,
            dashArray: isSurcharged ? '4, 4' : undefined,
            opacity: opacity,
          });

          poly.on('click', () => {
            setSelectedFeature({
              objectType: 'Stormwater Drainage Conduit',
              id: edge.edge_id,
              title: `Drainage Pipe ${edge.edge_id}`,
              state: edge.status,
              measurements: [
                { label: 'Capacity (Manning Q)', value: `${edge.capacity_m3_s} m³/s` },
                { label: 'Current Flow Rate', value: `${edge.flow_m3_s} m³/s`, highlight: color },
                { label: 'Hydraulic Utilization', value: `${edge.utilization_pct}%` },
                { label: 'Conduit Diameter', value: `${edge.diameter_m} m` },
                { label: 'Slope Gradient', value: `${(edge.slope * 100).toFixed(2)}%` },
                { label: 'Connecting Nodes', value: `${edge.from_node} ➔ ${edge.to_node}` },
              ],
              why: isSurcharged
                ? `Inflow rate (${edge.flow_m3_s} m³/s) exceeds Manning pipe full-flow capacity (${edge.capacity_m3_s} m³/s). Surplus backflow forces manholes to surcharge onto road surface.`
                : `Normal gravity flow operating at ${edge.utilization_pct}% hydraulic load.`,
              source: 'UFNS Coupled Hydraulic Engine',
              horizon: activeHorizon,
            });
          });

          poly.bindTooltip(
            `<b>Conduit ${edge.edge_id}</b><br/>Cap: ${edge.capacity_m3_s} m³/s &bull; Flow: ${edge.flow_m3_s} m³/s<br/>Util: <b>${edge.utilization_pct}% (${edge.status})</b>`
          );
          overlayGroup.addLayer(poly);
        }
      });
    }

    // ==========================================
    // LAYER 6: DRAINAGE NODES (Manholes, Inlets, Sluices)
    // ==========================================
    if (effShowDrainageNodes && drainageNetwork?.nodes) {
      drainageNetwork.nodes.forEach(node => {
        const isSurcharged = node.is_surcharged;
        const nodeType = node.node_type || 'Manhole';

        const markerColor = isSurcharged ? '#ef4444' : (nodeType === 'Outfall' ? '#10b981' : '#ffffff');
        const nodeMarker = L.circleMarker([node.lat, node.lon], {
          radius: isSurcharged ? 8 : (nodeType === 'Outfall' ? 9 : 6),
          color: markerColor,
          weight: 2,
          fillColor: isSurcharged ? '#ef4444' : (nodeType === 'Outfall' ? '#059669' : '#ffffff'),
          fillOpacity: 0.95,
        });

        nodeMarker.on('click', () => {
          setSelectedFeature({
            objectType: `Drainage Node (${nodeType})`,
            id: node.node_id,
            title: node.name,
            state: isSurcharged ? 'SURCHARGED (Backflow Active)' : 'OPERATIONAL',
            measurements: [
              { label: 'Node Classification', value: nodeType },
              { label: 'Ground Elevation', value: `${node.elevation_m} m` },
              { label: 'Inlet Intake Capacity', value: `${node.inlet_capacity_m3_s} m³/s` },
              { label: 'Current Surface Inflow', value: `${node.current_inflow_m3_s} m³/s` },
              { label: 'Surcharge Spill Volume', value: isSurcharged ? `${node.surcharge_volume_m3} m³` : '0 m³', highlight: isSurcharged ? '#ec4899' : undefined },
              { label: 'Spill Depth on Street', value: isSurcharged ? `${node.spill_depth_cm} cm` : '0 cm' },
            ],
            why: isSurcharged
              ? `Backflow pressure from overloaded downstream conduit has exceeded junction capacity. Backflow of ${node.surcharge_volume_m3} m³ is spilling onto surrounding streets.`
              : `Surface stormwater entering inlet normally at ${node.current_inflow_m3_s} m³/s without surcharge backpressure.`,
            source: '2-Way Coupled Hydro-Engine',
            horizon: activeHorizon,
          });
        });

        nodeMarker.bindTooltip(
          `<b>${node.name} (${nodeType})</b><br/>Status: <b>${isSurcharged ? 'SURCHARGED (Backflow!)' : 'Normal'}</b><br/>Elev: ${node.elevation_m}m`
        );
        overlayGroup.addLayer(nodeMarker);
      });
    }

    // ==========================================
    // LAYER 7: DRAINAGE SURCHARGE HALOS (Animated Pulsing)
    // ==========================================
    if (effShowDrainageSurcharge && drainageNetwork?.nodes) {
      drainageNetwork.nodes.forEach(node => {
        if (node.is_surcharged) {
          // Add animated pulsing outer circle indicator
          const pulseIcon = L.divIcon({
            className: 'surcharge-pulse-container',
            html: `<div class="surcharge-pulse-halo" style="width: 32px; height: 32px; border-radius: 50%; border: 3px solid #ec4899; background-color: rgba(236, 72, 153, 0.25);"></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const pulseMarker = L.marker([node.lat, node.lon], { icon: pulseIcon, interactive: false });
          overlayGroup.addLayer(pulseMarker);
        }
      });
    }

    // ==========================================
    // LAYER 8 & 9: ROAD NETWORK & FLOOD TRAVEL STATUS
    // ==========================================
    if (effShowRoads && roads && roads.length > 0) {
      roads.forEach(road => {
        const status = road.travel_status;
        const isBlocked = status === 'BLOCKED';
        const isHighRisk = status === 'HIGH_RISK';
        const isCaution = status === 'CAUTION';

        let roadColor = '#10b981'; // OPEN
        if (showRoadStatus) {
          if (isBlocked) roadColor = '#ef4444';
          else if (isHighRisk) roadColor = '#f97316';
          else if (isCaution) roadColor = '#eab308';
        }

        const isBypass = road.road_type === 'ELEVATED_BYPASS';
        const poly = L.polyline(road.coordinates, {
          color: roadColor,
          weight: isBlocked ? 5.5 : (isBypass ? 4.5 : 3.5),
          opacity: 0.9,
          dashArray: isBlocked ? '6, 4' : undefined,
        });

        poly.on('click', () => {
          setSelectedFeature({
            objectType: 'Urban Road Network Edge',
            id: road.road_id,
            title: road.name,
            state: road.travel_status,
            measurements: [
              { label: 'Travel Status', value: road.travel_status, highlight: roadColor },
              { label: 'Predicted Flood Depth', value: `${road.predicted_depth_cm} cm` },
              { label: 'Road Classification', value: road.road_type },
              { label: 'Segment Length', value: `${road.length_km} km` },
              { label: 'Nominal Speed', value: `${road.speed_kmh} km/h` },
              { label: 'Passable For', value: road.passable_vehicles.length > 0 ? road.passable_vehicles.join(', ') : 'None (Completely Inundated)' },
              { label: 'Recommended Detour', value: road.alternative_route || 'Direct passage permissible' },
            ],
            why: road.why_prediction,
            source: 'UFNS Routing & Inundation State',
            horizon: activeHorizon,
          });
        });

        poly.bindTooltip(
          `<b>${road.name}</b><br/>Depth: <b>${road.predicted_depth_cm} cm</b> &bull; Status: <b style="color:${roadColor}">${road.travel_status}</b>`
        );
        overlayGroup.addLayer(poly);

        // Add Road Blockage Warning Badge if blocked
        if (showRoadStatus && isBlocked) {
          const midLat = (road.coordinates[0][0] + road.coordinates[1][0]) / 2.0;
          const midLon = (road.coordinates[0][1] + road.coordinates[1][1]) / 2.0;

          const blockIcon = L.divIcon({
            className: 'road-block-badge',
            html: `⛔`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const blockMarker = L.marker([midLat, midLon], { icon: blockIcon });
          blockMarker.on('click', () => {
            setSelectedFeature({
              objectType: 'Road Blockage Obstacle',
              id: road.road_id,
              title: `${road.name} (BLOCKED)`,
              state: 'BLOCKED TO CIVILIAN & PASSENGER TRAFFIC',
              measurements: [
                { label: 'Water Depth', value: `${road.predicted_depth_cm} cm`, highlight: '#ef4444' },
                { label: 'Blockage Reason', value: 'Depth exceeds passenger vehicle clearance (20cm)' },
                { label: 'Recommended Detour', value: road.alternative_route || 'Elevated Ring Road' },
              ],
              why: road.why_prediction,
              source: 'Real-Time Clearance Analyzer',
              horizon: activeHorizon,
            });
          });
          overlayGroup.addLayer(blockMarker);
        }
      });
    }

    // ==========================================
    // LAYER 10 & 11: MULTI-OBJECTIVE ROUTES
    // ==========================================
    if ((effShowSafeRoutes || effShowEmergencyRoutes) && activeRoute?.routes && activeRoute.routes.length > 0) {
      activeRoute.routes.forEach(rt => {
        const isEmergency = rt.route_type === 'emergency';
        const isSafest = rt.route_type === 'safest';
        const isFastest = rt.route_type === 'fastest';
        const isShortest = rt.route_type === 'shortest';

        if (isEmergency && !effShowEmergencyRoutes) return;
        if (!isEmergency && !effShowSafeRoutes) return;

        const isSelected = activeRoute.selected_route === rt.route_type;

        let color: string = ROUTE_PALETTE.EMERGENCY;
        if (isSafest) color = ROUTE_PALETTE.SAFEST;
        else if (isFastest) color = ROUTE_PALETTE.FASTEST;
        else if (isShortest) color = ROUTE_PALETTE.SHORTEST;
        else if (isEmergency) color = ROUTE_PALETTE.EMERGENCY;

        const poly = L.polyline(rt.coordinates, {
          color: color,
          weight: isSelected ? 5.5 : 2.0,
          opacity: isSelected ? 1.0 : 0.25,
          dashArray: !rt.passable ? '5, 5' : undefined,
        });

        poly.on('click', () => {
          setSelectedFeature({
            objectType: `${rt.route_type.toUpperCase()} Route`,
            id: `ROUTE-${rt.route_type.toUpperCase()}`,
            title: `${rt.route_type.toUpperCase()} Evacuation / Dispatch Corridor`,
            state: rt.passable ? 'PASSABLE & CLEAR' : 'PASSABILITY COMPROMISED',
            measurements: [
              { label: 'Route Type', value: rt.route_type.toUpperCase(), highlight: color },
              { label: 'Total Distance', value: `${rt.distance_km} km` },
              { label: 'Estimated Transit Time', value: `${rt.travel_time_min || rt.duration_min || 0} min` },
              { label: 'Maximum Water Inundation', value: `${rt.max_depth_cm || rt.maximum_water_depth_cm || 0} cm` },
              { label: 'Risk Level', value: rt.risk_level || 'LOW' },
            ],
            why: `Dynamic A* multi-objective path computed against ${activeRoute.vehicle_type} (${activeRoute.vehicle_clearance_cm}cm threshold).`,
            source: 'UFNS Clearance Router',
            horizon: activeHorizon,
          });
        });

        poly.bindTooltip(`<b>${rt.route_type.toUpperCase()} ROUTE</b><br/>Time: ${rt.travel_time_min || rt.duration_min || 0} min &bull; Dist: ${rt.distance_km} km`);
        overlayGroup.addLayer(poly);
      });

      // Render Start and Destination Waypoint Markers once
      const mainRoute = activeRoute.routes.find(r => r.route_type === activeRoute.selected_route) || activeRoute.routes[0];
      if (mainRoute && mainRoute.coordinates && mainRoute.coordinates.length > 1) {
        const startPt = mainRoute.coordinates[0];
        const endPt = mainRoute.coordinates[mainRoute.coordinates.length - 1];

        const startIcon = L.divIcon({
          className: 'route-waypoint-start',
          html: `<div style="background-color: #10b981; color: white; border: 2px solid white; width: 24px; height: 24px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; box-shadow: 0 0 10px #10b981;">A</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const endIcon = L.divIcon({
          className: 'route-waypoint-end',
          html: `<div style="background-color: #ef4444; color: white; border: 2px solid white; width: 24px; height: 24px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; box-shadow: 0 0 10px #ef4444;">B</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const startMarker = L.marker(startPt, { icon: startIcon });
        startMarker.bindTooltip(`<b>ORIGIN (A)</b><br/>${activeRoute.origin?.name || 'Start Point'}`);
        const endMarker = L.marker(endPt, { icon: endIcon });
        endMarker.bindTooltip(`<b>DESTINATION (B)</b><br/>${activeRoute.destination?.name || 'Emergency Target'}`);

        overlayGroup.addLayer(startMarker);
        overlayGroup.addLayer(endMarker);
      }

      // Animated Emergency Ambulance along the safe corridor
      if (effShowAmbulance) {
        const safeRoute = activeRoute.routes.find(r => r.route_type === 'safest') || activeRoute.routes[0];
        const routeCoords: [number, number][] = (safeRoute?.coordinates && safeRoute.coordinates.length > 1)
          ? safeRoute.coordinates
          : [
              [12.929, 77.618],
              [12.935, 77.630],
              [12.946, 77.635],
              [12.945, 77.652],
              [12.941, 77.662],
              [12.928, 77.682]
            ];

        const ambIcon = L.divIcon({
          className: 'ambulance-pulse-icon',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
              <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(239,68,68,0.4); animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 28px; height: 28px; border-radius: 50%; background: #e11d48; border: 2px solid white; box-shadow: 0 0 14px #f43f5e; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold;">
                🚑
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const ambMarker = L.marker(routeCoords[0], { icon: ambIcon, zIndexOffset: 1000 }).addTo(overlayGroup);
        ambMarker.bindTooltip('<b>EMERGENCY AMBULANCE DISPATCHED</b><br/>Corridor: <b>0% Flood Hazard</b> &bull; Transit: 12.6 min', {
          permanent: false,
          direction: 'top'
        });

        let progress = 0;
        const speed = 0.004;

        const animateAmb = () => {
          progress += speed;
          if (progress > 1.0) progress = 0;

          const totalSegments = routeCoords.length - 1;
          const globalPos = progress * totalSegments;
          const segIndex = Math.min(Math.floor(globalPos), totalSegments - 1);
          const segFraction = globalPos - segIndex;

          const p0 = routeCoords[segIndex];
          const p1 = routeCoords[segIndex + 1];

          const currentLat = p0[0] + (p1[0] - p0[0]) * segFraction;
          const currentLon = p0[1] + (p1[1] - p0[1]) * segFraction;

          ambMarker.setLatLng([currentLat, currentLon]);
          animFrameRef.current = requestAnimationFrame(animateAmb);
        };

        animFrameRef.current = requestAnimationFrame(animateAmb);
      }
    }

    // ==========================================
    // LAYER 12: IOT WATER-LEVEL SENSORS
    // ==========================================
    if (effShowSensors && sensors && sensors.length > 0) {
      sensors.forEach(s => {
        const isCritical = s.depth_cm > 40;
        const isWarning = s.depth_cm > 25;
        const color = isCritical ? '#ef4444' : (isWarning ? '#f59e0b' : '#10b981');

        const sensorIcon = L.divIcon({
          className: 'sensor-marker-dot',
          html: `<div style="background-color: ${color}; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 0 6px ${color};"></div>`,
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        });

        const marker = L.marker([s.lat, s.lon], { icon: sensorIcon });

        marker.on('click', () => {
          setSelectedFeature({
            objectType: 'IoT Ultrasonic Water-Level Gauge',
            id: s.id,
            title: s.name,
            state: s.status,
            measurements: [
              { label: 'Live Measured Depth', value: `${s.depth_cm} cm`, highlight: color },
              { label: 'Sensor Battery', value: `${s.battery_pct}% (LiFePO4 Solar Buffer)` },
              { label: 'Telemetry Quality Score', value: `${((s.quality || 0.95) * 100).toFixed(0)}%` },
              { label: 'Transmission Protocol', value: 'LoRaWAN / 868 MHz' },
              { label: 'Calibration Status', value: 'Ground-Truth Anchor Point' },
            ],
            why: 'Physical ultrasonic sensor mounted above stormwater channel. Feeds the bias-correction Kalman/ratio calibration loop.',
            source: 'Municipal IoT Telemetry Mesh',
            horizon: 'Real-time telemetry',
          });
        });

        marker.bindTooltip(`<b>${s.name} (${s.id})</b><br/>Observed Depth: <b>${s.depth_cm} cm</b> &bull; Battery: ${s.battery_pct}%`);
        overlayGroup.addLayer(marker);
      });
    }

    // ==========================================
    // LAYER 13: CROWDSOURCED CITIZEN INCIDENT REPORTS
    // ==========================================
    if (showCitizenReports && citizenReports && citizenReports.length > 0) {
      citizenReports.forEach(rep => {
        const catIcon = rep.category === 'Waterlogging' ? '🌊' : (rep.category === 'Drain Overflow' ? '🚰' : '⚠️');
        const repIcon = L.divIcon({
          className: 'citizen-report-icon',
          html: `<div style="background-color: #f59e0b; padding: 2px 4px; border-radius: 8px; border: 1.5px solid white; font-size: 11px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">${catIcon}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([rep.lat, rep.lon], { icon: repIcon });

        marker.on('click', () => {
          setSelectedFeature({
            objectType: 'Crowdsourced Citizen Incident Report',
            id: rep.id,
            title: `${rep.category} Incident Report`,
            state: rep.verified ? 'VERIFIED (Cross-checked by Gauge)' : 'PENDING VALIDATION',
            measurements: [
              { label: 'Incident Category', value: rep.category },
              { label: 'Reported Depth', value: `${rep.depth_cm} cm` },
              { label: 'Citizen Notes', value: rep.desc || 'No additional comment' },
              { label: 'Submitted Timestamp', value: rep.timestamp || 'Recent' },
              { label: 'Verification Confidence', value: `${((rep.quality || 0.88) * 100).toFixed(0)}%` },
            ],
            why: 'Crowdsourced ground-truth submitted via UFNS Citizen Portal. Automatically filtered and integrated for hyper-local validation.',
            source: 'Verified Citizen Mobile App',
            horizon: 'Field Observation',
          });
        });

        marker.bindTooltip(`<b>Citizen Report: ${rep.category}</b><br/>Observed: <b>${rep.depth_cm} cm</b> &bull; ${rep.timestamp}`);
        overlayGroup.addLayer(marker);
      });
    }

    // ==========================================
    // LAYERS 14-17: EMERGENCY FACILITIES (Hospitals, Shelters, Fire, Police)
    // ==========================================
    if (facilities && facilities.length > 0) {
      facilities.forEach(fac => {
        let shouldShow = false;
        let iconHtml = '🏥';
        let bgColor = '#3b82f6';

        if (fac.facility_type === 'Hospital' && showHospitals) {
          shouldShow = true;
          iconHtml = '🏥';
          bgColor = '#2563eb';
        } else if (fac.facility_type === 'Shelter' && showShelters) {
          shouldShow = true;
          iconHtml = '⛺';
          bgColor = '#059669';
        } else if (fac.facility_type === 'Fire Station' && showFireStations) {
          shouldShow = true;
          iconHtml = '🚒';
          bgColor = '#dc2626';
        } else if (fac.facility_type === 'Police Station' && showPoliceStations) {
          shouldShow = true;
          iconHtml = '🚓';
          bgColor = '#4f46e5';
        }

        if (shouldShow) {
          const facIcon = L.divIcon({
            className: 'facility-badge-clean',
            html: `<div style="background-color: ${bgColor}; width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid white; display:flex; align-items:center; justify-content:center; font-size: 10px; color: white; box-shadow: 0 1px 4px rgba(0,0,0,0.5);">${iconHtml}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          const marker = L.marker([fac.lat, fac.lon], { icon: facIcon });

          marker.on('click', () => {
            setSelectedFeature({
              objectType: `Emergency Facility (${fac.facility_type})`,
              id: fac.id,
              title: fac.name,
              state: fac.access_status,
              measurements: [
                { label: 'Facility Type', value: fac.facility_type },
                { label: 'Operational Capacity', value: fac.capacity_desc },
                { label: 'Surrounding Flood Depth', value: `${fac.current_depth_cm} cm`, highlight: fac.current_depth_cm > 15 ? '#f97316' : '#10b981' },
                { label: 'Flood Risk Level', value: fac.flood_risk },
                { label: 'Nearest Access Road', value: fac.nearest_access_road },
                { label: 'Emergency Contact', value: fac.contact },
              ],
              why: fac.why_status,
              source: `${selectedCityConfig?.city || 'Metropolitan'} Disaster Management Authority`,
              horizon: activeHorizon,
            });
          });

          marker.bindTooltip(`<b>${fac.name}</b><br/>Type: <b>${fac.facility_type}</b> &bull; Risk: <b>${fac.flood_risk}</b>`);
          overlayGroup.addLayer(marker);
        }
      });
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [
    showFloodDepth,
    showRadar,
    showFlowDirection,
    showRiskZones,
    showDrainagePipes,
    showDrainageNodes,
    showDrainageSurcharge,
    showRoads,
    showRoadStatus,
    showSafeRoutes,
    showEmergencyRoutes,
    showSensors,
    showCitizenReports,
    showHospitals,
    showShelters,
    showFireStations,
    showPoliceStations,
    prediction,
    drainageNetwork,
    roads,
    facilities,
    radarData,
    riskZones,
    citizenReports,
    sensors,
    activeHorizon,
    dataMode,
    activeRoute,
    isStoryMode,
    storyStep
  ]);

  // Dynamic Map Legend calculation (only for active layers)
  const activeLegendSections = useMemo(() => {
    const list: string[] = [];
    if (showFloodDepth) list.push('depth');
    if (showDrainagePipes || showDrainageNodes || showDrainageSurcharge) list.push('drainage');
    if (showRoads || showRoadStatus) list.push('roads');
    if (showSafeRoutes || showEmergencyRoutes) list.push('routes');
    if (showSensors) list.push('sensors');
    return list;
  }, [showFloodDepth, showDrainagePipes, showDrainageNodes, showDrainageSurcharge, showRoads, showRoadStatus, showSafeRoutes, showEmergencyRoutes, showSensors]);

  // Summary counts for Map Status Overlay
  const mapSummary = useMemo(() => {
    const flooded = prediction?.grid?.filter(c => c.water_depth_cm > 1.0).length || 0;
    const critical = prediction?.grid?.filter(c => c.risk_level === 'CRITICAL').length || 0;
    const surcharged = drainageNetwork?.nodes?.filter(n => n.is_surcharged).length || 0;
    const blocked = roads?.filter(r => r.travel_status === 'BLOCKED').length || 0;
    const sensOnline = sensors?.length || 0;
    const alertsCount = alerts?.filter(a => !a.acknowledged).length || 0;

    return { flooded, critical, surcharged, blocked, sensOnline, alertsCount };
  }, [prediction, drainageNetwork, roads, sensors, alerts]);

  // Quick preset helper
  const handleSelectAllLayers = (enable: boolean) => {
    setShowFloodDepth(enable);
    setShowRadar(enable);
    setShowFlowDirection(enable);
    setShowRiskZones(enable);
    setShowDrainagePipes(enable);
    setShowDrainageNodes(enable);
    setShowDrainageSurcharge(enable);
    setShowRoads(enable);
    setShowRoadStatus(enable);
    setShowSafeRoutes(enable);
    setShowEmergencyRoutes(enable);
    setShowSensors(enable);
    setShowCitizenReports(enable);
    setShowHospitals(enable);
    setShowShelters(enable);
    setShowFireStations(enable);
    setShowPoliceStations(enable);
  };

  // Handle 2D Leaflet size recalculation when switching from 3D to 2D
  useEffect(() => {
    if (twinMode === '2d' && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 50);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 300);
    }
  }, [twinMode]);

  return (
    <div className={`w-full relative flex flex-col ${isFullScreen ? 'fixed inset-0 z-50 bg-[#0a0f1d]' : 'h-full'}`}>
      {/* 2D Leaflet GIS View Container */}
      <div className={`w-full h-full relative ${twinMode === '2d' ? 'block z-10' : 'hidden z-0 pointer-events-none'}`}>
        {/* Map Leaflet Container */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Mode Switcher & Header Banner */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex items-center space-x-2">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl flex items-center space-x-1">
          <button
            onClick={() => setTwinMode('2d')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 bg-sky-500 text-white shadow-lg"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2D GIS</span>
          </button>
          <button
            onClick={() => setTwinMode('3d')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>3D DIGITAL TWIN</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 text-[11px] shadow-lg">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400 font-semibold">SOURCE:</span>
          <span className="text-sky-400 font-bold">{dataMode}</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center space-x-1">
          <span className="text-slate-400 font-semibold">HORIZON:</span>
          <span className="text-amber-400 font-mono font-bold">+{activeHorizon}</span>
        </div>
        <span className="text-slate-700">|</span>
        <button
          onClick={() => setIsFullScreen(!isFullScreen)}
          className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-all flex items-center space-x-1 font-semibold"
          title={isFullScreen ? 'Exit Full Screen' : 'Full Screen GIS Workstation'}
        >
          {isFullScreen ? <Minimize2 className="w-3.5 h-3.5 text-rose-400" /> : <Maximize2 className="w-3.5 h-3.5 text-sky-400" />}
          <span>{isFullScreen ? 'Exit GIS' : 'Full GIS'}</span>
        </button>
        </div>
      </div>

      {/* Compact Floating Map Control Toolbar (Top Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 pointer-events-auto">
        <div className="flex items-center space-x-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-xl">
          {/* DEMO STORY Button */}
          <button
            onClick={() => {
              if (isStoryMode) {
                stopStoryMode();
              } else {
                startStoryMode();
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 border ${
              isStoryMode
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
                : 'bg-gradient-to-r from-sky-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isStoryMode ? 'EXIT STORY' : 'DEMO STORY'}</span>
          </button>
          <button
            onClick={() => setActivePanel(activePanel === 'layers' ? null : 'layers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activePanel === 'layers'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>LAYERS</span>
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'style' ? null : 'style')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activePanel === 'style'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>MAP STYLE</span>
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'opacity' ? null : 'opacity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activePanel === 'opacity'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-sky-400" />
            <span>FLOOD: {Math.round(floodOpacity * 100)}%</span>
          </button>

          <button
            onClick={recenterMap}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Recenter Map"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        {/* Floating Popover 1: Layers */}
        {activePanel === 'layers' && (
          <div className="w-72 max-h-[calc(100vh-160px)] overflow-y-auto rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3 space-y-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Layer Visibility</span>
              </span>
              <button onClick={() => setActivePanel(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hydrology */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">Hydrology</span>
              <label className="flex items-center space-x-2 cursor-pointer hover:text-white text-slate-300">
                <input type="checkbox" checked={showFloodDepth} onChange={e => setShowFloodDepth(e.target.checked)} className="rounded text-sky-500 bg-slate-900 border-slate-700" />
                <span>Flood Water Depth Grid</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer hover:text-white text-slate-300">
                <input type="checkbox" checked={showFlowDirection} onChange={e => setShowFlowDirection(e.target.checked)} className="rounded text-teal-500 bg-slate-900 border-slate-700" />
                <span>Surface Flow Vectors</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer hover:text-white text-slate-300">
                <input type="checkbox" checked={showRadar} onChange={e => setShowRadar(e.target.checked)} className="rounded text-purple-500 bg-slate-900 border-slate-700" />
                <span>Doppler Radar Reflectivity</span>
              </label>
            </div>

            {/* Drainage */}
            <div className="space-y-1 pt-1.5 border-t border-slate-800">
              <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">Drainage Infrastructure</span>
              <label className="flex items-center space-x-2 cursor-pointer hover:text-white text-slate-300">
                <input type="checkbox" checked={showDrainagePipes} onChange={e => setShowDrainagePipes(e.target.checked)} className="rounded text-pink-500 bg-slate-900 border-slate-700" />
                <span>Drainage Conduits</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer hover:text-white text-slate-300">
                <input type="checkbox" checked={showDrainageSurcharge} onChange={e => setShowDrainageSurcharge(e.target.checked)} className="rounded text-rose-500 bg-slate-900 border-slate-700" />
                <span>Surcharged Manholes &amp; Backflow</span>
              </label>
            </div>

            {/* Roads & Routing */}
            <div className="space-y-1 pt-1.5 border-t border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Roads &amp; Evacuation</span>
              <label className="flex items-center space-x-2 cursor-pointer hover:text-white text-slate-300">
                <input type="checkbox" checked={showRoads} onChange={e => setShowRoads(e.target.checked)} className="rounded text-emerald-500 bg-slate-900 border-slate-700" />
                <span>Road Network Geometry</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer hover:text-white text-slate-300">
                <input type="checkbox" checked={showSafeRoutes} onChange={e => setShowSafeRoutes(e.target.checked)} className="rounded text-emerald-400 bg-slate-900 border-slate-700" />
                <span>Multi-Objective Safe Routes</span>
              </label>
            </div>

            {/* Assets & Facilities */}
            <div className="space-y-1 pt-1.5 border-t border-slate-800">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Assets &amp; Facilities</span>
              <label className="flex items-center space-x-2 cursor-pointer hover:text-white text-slate-300">
                <input type="checkbox" checked={showSensors} onChange={e => setShowSensors(e.target.checked)} className="rounded text-teal-500 bg-slate-900 border-slate-700" />
                <span>IoT Water-Level Gauges</span>
              </label>
              <div className="grid grid-cols-2 gap-1 pt-0.5">
                <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white text-slate-300 text-[10px]">
                  <input type="checkbox" checked={showHospitals} onChange={e => setShowHospitals(e.target.checked)} className="rounded text-blue-500 bg-slate-900" />
                  <span>Hospitals</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white text-slate-300 text-[10px]">
                  <input type="checkbox" checked={showShelters} onChange={e => setShowShelters(e.target.checked)} className="rounded text-emerald-500 bg-slate-900" />
                  <span>Shelters</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white text-slate-300 text-[10px]">
                  <input type="checkbox" checked={showFireStations} onChange={e => setShowFireStations(e.target.checked)} className="rounded text-rose-500 bg-slate-900" />
                  <span>Fire Stations</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer hover:text-white text-slate-300 text-[10px]">
                  <input type="checkbox" checked={showPoliceStations} onChange={e => setShowPoliceStations(e.target.checked)} className="rounded text-indigo-500 bg-slate-900" />
                  <span>Police</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
              <button onClick={() => handleSelectAllLayers(true)} className="text-sky-400 hover:text-sky-300 font-semibold">Enable All</button>
              <button onClick={() => handleSelectAllLayers(false)} className="text-slate-400 hover:text-slate-300">Clear All</button>
            </div>
          </div>
        )}

        {/* Floating Popover 2: Map Style */}
        {activePanel === 'style' && (
          <div className="w-72 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3 space-y-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 flex items-center space-x-1.5">
                <Satellite className="w-4 h-4 text-cyan-400" />
                <span>Basemap Style</span>
              </span>
              <button onClick={() => setActivePanel(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setMapViewMode('satellite_blueprint')}
                className={`col-span-2 py-1.5 px-2 rounded-lg text-center transition-all border flex items-center justify-center space-x-1 ${
                  mapViewMode === 'satellite_blueprint'
                    ? 'bg-gradient-to-r from-cyan-950/90 to-sky-950/90 border-cyan-400 text-cyan-300 font-bold shadow'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>🛰️ + 📐 SATELLITE + BLUEPRINT</span>
              </button>
              <button
                onClick={() => setMapViewMode('satellite')}
                className={`py-1.5 px-2 rounded-lg text-center transition-all border ${
                  mapViewMode === 'satellite'
                    ? 'bg-sky-600 text-white border-sky-400 font-bold'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                🛰️ Satellite
              </button>
              <button
                onClick={() => setMapViewMode('blueprint')}
                className={`py-1.5 px-2 rounded-lg text-center transition-all border ${
                  mapViewMode === 'blueprint'
                    ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                📐 Blueprint
              </button>
            </div>

            {/* Opacity Sliders */}
            <div className="space-y-2 pt-1.5 border-t border-slate-800">
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Satellite Opacity:</span>
                  <span className="text-cyan-400 font-mono font-bold">{Math.round(satelliteOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={satelliteOpacity}
                  onChange={(e) => setSatelliteOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Blueprint Overlay:</span>
                  <span className="text-cyan-400 font-mono font-bold">{Math.round(blueprintOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={blueprintOpacity}
                  onChange={(e) => setBlueprintOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Technical Subtlety Toggles */}
            <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[11px]">
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="flex items-center space-x-1.5">
                  <Grid className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CAD Wireframe Grid</span>
                </span>
                <input
                  type="checkbox"
                  checked={showWireframe}
                  onChange={(e) => setShowWireframe(e.target.checked)}
                  className="rounded text-cyan-500 bg-slate-900 border-slate-700"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="flex items-center space-x-1.5">
                  <Mountain className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DEM Contours (875–915m)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showContours}
                  onChange={(e) => setShowContours(e.target.checked)}
                  className="rounded text-emerald-500 bg-slate-900 border-slate-700"
                />
              </label>
            </div>
          </div>
        )}

        {/* Floating Popover 3: Flood Opacity Slider */}
        {activePanel === 'opacity' && (
          <div className="w-72 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3 space-y-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 flex items-center space-x-1.5">
                <Waves className="w-4 h-4 text-sky-400" />
                <span>Flood Grid Opacity</span>
              </span>
              <button onClick={() => setActivePanel(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Translucent Opacity:</span>
                <span className="text-sky-400 font-mono font-bold">{Math.round(floodOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.65"
                step="0.05"
                value={floodOpacity}
                onChange={(e) => setFloodOpacity(parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1 text-[10px]">
              <button
                onClick={() => setFloodOpacity(0.25)}
                className="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-center"
              >
                25% Light
              </button>
              <button
                onClick={() => setFloodOpacity(0.35)}
                className="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-sky-300 text-center font-bold"
              >
                35% Optimal
              </button>
              <button
                onClick={() => setFloodOpacity(0.50)}
                className="px-1.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-center"
              >
                50% Vivid
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Status Summary Overlay Card (Top Center / Mobile Friendly) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 hidden lg:flex items-center space-x-3 px-3.5 py-1.5 rounded-full bg-[#0b1329]/95 backdrop-blur-md border border-slate-800 text-[11px] shadow-xl text-slate-300">
        <div className="flex items-center space-x-1">
          <span className="text-slate-400">Flooded Cells:</span>
          <span className="text-sky-400 font-bold font-mono">{mapSummary.flooded}</span>
        </div>
        <span className="text-slate-700">&bull;</span>
        <div className="flex items-center space-x-1">
          <span className="text-slate-400">Critical Cells:</span>
          <span className="text-rose-400 font-bold font-mono">{mapSummary.critical}</span>
        </div>
        <span className="text-slate-700">&bull;</span>
        <div className="flex items-center space-x-1">
          <span className="text-slate-400">Surcharged Nodes:</span>
          <span className="text-pink-400 font-bold font-mono">{mapSummary.surcharged}</span>
        </div>
        <span className="text-slate-700">&bull;</span>
        <div className="flex items-center space-x-1">
          <span className="text-slate-400">Blocked Roads:</span>
          <span className="text-red-400 font-bold font-mono">{mapSummary.blocked}</span>
        </div>
        <span className="text-slate-700">&bull;</span>
        <div className="flex items-center space-x-1">
          <span className="text-slate-400">Sensors Online:</span>
          <span className="text-emerald-400 font-bold font-mono">{mapSummary.sensOnline}</span>
        </div>
      </div>

      {/* Dynamic Map Legend (Bottom Left - Adapts to Active Layers) */}
      <div className="absolute bottom-4 left-4 z-20 p-3 rounded-2xl bg-[#0b1329]/95 backdrop-blur-md border border-slate-800 shadow-2xl text-[10px] space-y-2 max-w-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <span className="font-bold text-slate-200">GIS Dynamic Map Legend</span>
          <span className="text-[9px] text-slate-400">Active Layers</span>
        </div>

        {/* Depth Scale - Strict Blue Palette */}
        {activeLegendSections.includes('depth') && (
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block text-[9px]">PREDICTED WATER DEPTH (BLUE PALETTE):</span>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#93c5fd]" /><span>0–5 cm</span></div>
              <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]" /><span>5–15 cm</span></div>
              <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#2563eb]" /><span>15–30 cm</span></div>
              <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#1d4ed8]" /><span>30–50 cm</span></div>
              <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#1e3a8a]" /><span>&gt;50 cm</span></div>
            </div>
          </div>
        )}

        {/* Drainage Status Scale - Pure White Normal */}
        {activeLegendSections.includes('drainage') && (
          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            <span className="text-slate-400 font-semibold block text-[9px]">DRAINAGE NETWORK STATUS:</span>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <div className="flex items-center space-x-1"><span className="w-3 h-0.5 bg-[#ffffff]" /><span>Normal Conduits</span></div>
              <div className="flex items-center space-x-1"><span className="w-3 h-0.5 bg-[#f59e0b]" /><span>Warning (&gt;85%)</span></div>
              <div className="flex items-center space-x-1"><span className="w-3 h-1 bg-[#ef4444] border-b border-dashed border-white" /><span>Surcharged (Backflow)</span></div>
            </div>
          </div>
        )}

        {/* Roads Status Scale */}
        {activeLegendSections.includes('roads') && (
          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            <span className="text-slate-400 font-semibold block text-[9px]">ROAD TRAVEL STATUS:</span>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <div className="flex items-center space-x-1"><span className="w-3 h-1 rounded-sm bg-[#10b981]" /><span>Open</span></div>
              <div className="flex items-center space-x-1"><span className="w-3 h-1 rounded-sm bg-[#eab308]" /><span>Caution (10-25cm)</span></div>
              <div className="flex items-center space-x-1"><span className="w-3 h-1 rounded-sm bg-[#f97316]" /><span>High Risk</span></div>
              <div className="flex items-center space-x-1"><span className="w-3 h-1 rounded-sm bg-[#ef4444]" /><span>Blocked (⛔)</span></div>
            </div>
          </div>
        )}

        {/* Routes Scale */}
        {activeLegendSections.includes('routes') && (
          <div className="space-y-1 pt-1 border-t border-slate-800/60">
            <span className="text-slate-400 font-semibold block text-[9px]">EMERGENCY ROUTING:</span>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <div className="flex items-center space-x-1"><span className="w-3 h-1 bg-[#cbd5e1]" /><span>Shortest</span></div>
              <div className="flex items-center space-x-1"><span className="w-3 h-1 bg-[#06b6d4]" /><span>Fastest</span></div>
              <div className="flex items-center space-x-1"><span className="w-3 h-1 bg-[#10b981]" /><span>Safest</span></div>
              <div className="flex items-center space-x-1"><span className="w-3 h-1 bg-[#f43f5e]" /><span>Emergency</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Universal Feature Inspection Modal (Bottom Right - "Why this prediction?" Engine) */}
      {selectedFeature && (
        <div className="absolute bottom-4 right-4 z-30 p-4 rounded-2xl bg-[#0f172a]/95 backdrop-blur-md border border-slate-700 shadow-2xl text-xs space-y-2.5 max-w-sm sm:max-w-md animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono text-[10px] font-bold">
                  {selectedFeature.objectType}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">ID: {selectedFeature.id}</span>
              </div>
              <h4 className="font-bold text-slate-100 text-sm">{selectedFeature.title}</h4>
            </div>
            <button
              onClick={() => setSelectedFeature(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-lg leading-none"
            >
              &times;
            </button>
          </div>

          {/* Current State Badge */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-slate-400 font-semibold text-[11px]">Current State:</span>
            <span className="font-bold text-xs text-sky-400">{selectedFeature.state}</span>
          </div>

          {/* Key Physical Measurements */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Key Physical Measurements
            </span>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 text-[11px]">
              {selectedFeature.measurements?.map((m: any, idx: number) => (
                <div key={idx} className="space-y-0.5">
                  <span className="text-slate-400 block text-[10px]">{m.label}:</span>
                  <span className="font-semibold font-mono text-slate-100" style={{ color: m.highlight }}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic "Why this prediction?" Hydrological Reasoning Engine */}
          <div className="space-y-1 p-2.5 rounded-xl bg-sky-950/30 border border-sky-800/40 text-[11px]">
            <div className="flex items-center space-x-1 text-sky-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Hydrological Reasoning (Why this result?):</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px] italic">
              "{selectedFeature.why}"
            </p>
          </div>

          {/* Provenance Footer */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
            <span>Source: <b className="text-slate-400">{selectedFeature.source}</b></span>
            <span>Horizon: <b className="text-amber-400 font-mono">+{selectedFeature.horizon}</b></span>
          </div>
        </div>
      )}
      </div>

      {/* 3D MapLibre Digital Twin View Container */}
      <div className={`w-full h-full relative ${twinMode === '3d' ? 'block z-10' : 'hidden z-0 pointer-events-none'}`}>
        <DigitalTwin3D compact={compact} isVisible={twinMode === '3d'} />
      </div>

      {/* Story Mode Overlay - visible across both 2D and 3D map views */}
      <StoryModeOverlay />
    </div>
  );
};
