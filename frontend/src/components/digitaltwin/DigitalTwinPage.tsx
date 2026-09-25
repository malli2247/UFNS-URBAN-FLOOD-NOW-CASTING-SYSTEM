import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useSimulation } from '../../context/SimulationContext';
import { DEFAULT_BUILDINGS_GEOJSON } from '../../data/buildingsData';
import { DEFAULT_TERRAIN_CONTOURS } from '../../data/terrainContours';
import {
  ArrowLeft,
  Compass,
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
  Eye,
  EyeOff,
  RotateCcw,
  Camera,
  Play,
  Pause,
  Sliders,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  MapPin,
  HelpCircle,
  Mountain,
  Grid,
  Satellite,
  Droplets,
  CloudRain,
  Zap,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { BuildingFeature, RoadFeature, EmergencyFacility, DrainageNode, GridCell, MapViewMode } from '../../types';
import { DEMO_FLOOD_COLORS, ROUTE_PALETTE, DRAINAGE_PALETTE } from '../../config/floodColors';

// Bengaluru Koramangala - Bellandur prominent water bodies
const WATER_BODIES_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Bellandur Lake Basin', type: 'LAKE' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [77.6610, 12.9345],
          [77.6655, 12.9330],
          [77.6710, 12.9360],
          [77.6750, 12.9410],
          [77.6730, 12.9465],
          [77.6660, 12.9470],
          [77.6615, 12.9420],
          [77.6610, 12.9345]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Agara Lake Wetland', type: 'LAKE' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [77.6335, 12.9205],
          [77.6390, 12.9185],
          [77.6435, 12.9215],
          [77.6440, 12.9265],
          [77.6385, 12.9275],
          [77.6340, 12.9245],
          [77.6335, 12.9205]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { name: 'Koramangala Valley Stormwater Rajakaluve', type: 'CANAL' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [77.6200, 12.9370],
          [77.6280, 12.9385],
          [77.6360, 12.9390],
          [77.6480, 12.9360],
          [77.6580, 12.9350],
          [77.6620, 12.9365]
        ]
      }
    }
  ]
};

// Fixed Callout Annotations with Leader Lines
const TECHNICAL_CALLOUTS = [
  {
    id: 'callout-risk',
    title: 'CRITICAL FLOOD RISK',
    subtitle: 'Depression Basin • 52 cm Depth',
    lon: 77.6325,
    lat: 12.9362,
    badgeColor: 'border-rose-500 bg-rose-950/90 text-rose-300',
    lineColor: '#ef4444',
    category: 'FLOOD_CELL',
    details: 'Water accumulation in low-lying Koramangala 80ft Road depression (876m AMSL). Inundation depth exceeds 50cm threshold.'
  },
  {
    id: 'callout-surcharge',
    title: 'DRAINAGE SURCHARGE DETECTED',
    subtitle: 'ST Bed Node • Backflow Active',
    lon: 77.6285,
    lat: 12.9340,
    badgeColor: 'border-amber-500 bg-amber-950/90 text-amber-300',
    lineColor: '#f59e0b',
    category: 'DRAINAGE_NODE',
    details: 'Hydraulic head exceeds street level (+32cm). Stormwater conduit capacity exceeded by 142%; water spilling upward onto surface.'
  },
  {
    id: 'callout-rain',
    title: 'RAINFALL NOWCAST: 68 mm/hr',
    subtitle: 'Sony World Convective Core',
    lon: 77.6250,
    lat: 12.9390,
    badgeColor: 'border-cyan-400 bg-cyan-950/90 text-cyan-300',
    lineColor: '#00f0ff',
    category: 'RAIN_CELL',
    details: 'Intense cloudburst cell detected via Doppler Radar (54 dBZ). Runoff rate calculated at 82 m³/s across 4.2 km² catchment.'
  },
  {
    id: 'callout-depth',
    title: 'PREDICTED WATER DEPTH: 45 cm',
    subtitle: '100ft Road Ingress Point',
    lon: 77.6385,
    lat: 12.9325,
    badgeColor: 'border-orange-500 bg-orange-950/90 text-orange-300',
    lineColor: '#f97316',
    category: 'ROAD',
    details: 'Primary arterial road blocked. Clearance threshold for standard 2-wheelers and sedans exceeded. High-clearance detour enforced.'
  },
  {
    id: 'callout-lake',
    title: 'AGARA LAKE OUTLET',
    subtitle: 'Wetland Retention: 94% Capacity',
    lon: 77.6380,
    lat: 12.9230,
    badgeColor: 'border-sky-400 bg-sky-950/90 text-sky-300',
    lineColor: '#38bdf8',
    category: 'LAKE',
    details: 'Retention basin buffering upstream stormwater runoff. Sluice gate outflow regulated into Bellandur lake channel.'
  },
  {
    id: 'callout-rajakaluve',
    title: 'KORAMANGALA VALLEY DRAIN',
    subtitle: 'Rajakaluve Trunk Conduit • 14.8 m³/s',
    lon: 77.6530,
    lat: 12.9355,
    badgeColor: 'border-purple-400 bg-purple-950/90 text-purple-300',
    lineColor: '#c084fc',
    category: 'DRAINAGE_PIPE',
    details: 'Major open stormwater canal carrying valley runoff. Flow velocity 2.4 m/s toward Bellandur basin.'
  }
];

// 11-Step Demonstration Story Guide definitions
interface DemoStep {
  step: number;
  title: string;
  subheading: string;
  explanation: string;
  camera: { center: [number, number]; zoom: number; pitch: number; bearing: number };
  horizon?: string;
  underground?: boolean;
  activeLayers?: {
    floatingGrid?: boolean;
    contours?: boolean;
    drainage?: boolean;
    routes?: boolean;
    floodWater?: boolean;
  };
}

const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: 'The City',
    subheading: 'Baseline LOD-2 Physical City Model',
    explanation: 'UFNS creates a physical 3D digital twin of the Bengaluru Koramangala-Bellandur basin containing 162 extruded buildings and true infrastructure geometry.',
    camera: { center: [77.640, 12.937], zoom: 13.6, pitch: 60, bearing: -22 },
    horizon: 'NOW',
    underground: false,
    activeLayers: { floatingGrid: false, contours: false, drainage: true, routes: false, floodWater: false }
  },
  {
    step: 2,
    title: 'Terrain & Low Elevation',
    subheading: 'Topographic Isocontours & Depressions',
    explanation: 'Digital Elevation Model (DEM 875m–915m AMSL) reveals the natural low-lying depression in Koramangala 80ft Road that forms an inland retention sink.',
    camera: { center: [77.634, 12.934], zoom: 14.8, pitch: 65, bearing: -15 },
    horizon: 'NOW',
    underground: false,
    activeLayers: { floatingGrid: false, contours: true, drainage: false, routes: false, floodWater: false }
  },
  {
    step: 3,
    title: 'Heavy Rain Detected',
    subheading: 'Doppler Radar & Convective Cloudburst',
    explanation: 'A severe convective cell delivering 68 mm/hr rainfall is detected over Sony World Junction, triggering the UFNS hydrodynamic nowcasting engine.',
    camera: { center: [77.626, 12.938], zoom: 15.2, pitch: 68, bearing: 20 },
    horizon: '+15m',
    underground: false,
    activeLayers: { floatingGrid: true, contours: true, drainage: false, routes: false, floodWater: false }
  },
  {
    step: 4,
    title: 'Predicted Flood Zones',
    subheading: 'Floating Translucent Hologram Grid',
    explanation: 'A translucent holographic prediction grid hovers above the urban canopy, computing cellular runoff and flagging critical inundation risk cells in glowing red.',
    camera: { center: [77.635, 12.937], zoom: 14.5, pitch: 65, bearing: -30 },
    horizon: '+30m',
    underground: false,
    activeLayers: { floatingGrid: true, contours: false, drainage: false, routes: false, floodWater: true }
  },
  {
    step: 5,
    title: 'Water Accumulation',
    subheading: 'Volumetric Depth Hydrodynamics',
    explanation: '2D shallow-water equations simulate overland flow gathering in urban depressions, building depths up to 52 cm along critical commercial corridors.',
    camera: { center: [77.632, 12.936], zoom: 15.6, pitch: 70, bearing: -10 },
    horizon: '+45m',
    underground: false,
    activeLayers: { floatingGrid: false, contours: false, drainage: true, routes: false, floodWater: true }
  },
  {
    step: 6,
    title: 'Drainage Network',
    subheading: 'Subterranean Stormwater Conduits',
    explanation: 'Underground cutaway reveals the buried stormwater conduits, catch basins, and Rajakaluve trunk channels responsible for urban drainage.',
    camera: { center: [77.636, 12.936], zoom: 15.0, pitch: 52, bearing: -20 },
    horizon: '+45m',
    underground: true,
    activeLayers: { floatingGrid: false, contours: false, drainage: true, routes: false, floodWater: false }
  },
  {
    step: 7,
    title: 'Surcharge & Backflow',
    subheading: 'Hydraulic Pressure Exceeds Street Level',
    explanation: 'When trunk conduit capacity reaches 100%, hydraulic head exceeds street grade, causing stormwater to surge upward out of manholes onto roads.',
    camera: { center: [77.629, 12.935], zoom: 16.0, pitch: 56, bearing: 10 },
    horizon: '+1h',
    underground: true,
    activeLayers: { floatingGrid: false, contours: false, drainage: true, routes: false, floodWater: true }
  },
  {
    step: 8,
    title: 'Road Inundation',
    subheading: 'Arterial Transport Links Submerged',
    explanation: 'Surface runoff coupled with drainage backflow submerges 80ft Road and 100ft Road, exceeding the 20cm safe clearance for conventional vehicles.',
    camera: { center: [77.634, 12.934], zoom: 15.2, pitch: 68, bearing: -35 },
    horizon: '+1h',
    underground: false,
    activeLayers: { floatingGrid: false, contours: false, drainage: true, routes: true, floodWater: true }
  },
  {
    step: 9,
    title: 'Route Disruption',
    subheading: 'Shortest Path Blocked by Floodwaters',
    explanation: 'The standard shortest path between Sony World Junction and Sakra Trauma Center is completely cut off by 52 cm deep water and marked BLOCKED.',
    camera: { center: [77.645, 12.935], zoom: 14.2, pitch: 65, bearing: -40 },
    horizon: '+1h',
    underground: false,
    activeLayers: { floatingGrid: false, contours: false, drainage: false, routes: true, floodWater: true }
  },
  {
    step: 10,
    title: 'Safe Route Recalculation',
    subheading: 'Dynamic Multi-Objective Clearance A*',
    explanation: 'UFNS immediately calculates the SAFEST green detour via elevated ring bypasses, avoiding all flooded grid cells while maintaining rapid transit.',
    camera: { center: [77.648, 12.933], zoom: 14.0, pitch: 62, bearing: -30 },
    horizon: '+2h',
    underground: false,
    activeLayers: { floatingGrid: false, contours: false, drainage: false, routes: true, floodWater: true }
  },
  {
    step: 11,
    title: 'Emergency Dispatch',
    subheading: 'Ambulance Reaches Trauma Center',
    explanation: 'High-clearance emergency ambulance safely navigates the green corridor and arrives at Sakra World Hospital with zero flood immersion.',
    camera: { center: [77.662, 12.934], zoom: 15.0, pitch: 66, bearing: -50 },
    horizon: '+2h',
    underground: false,
    activeLayers: { floatingGrid: false, contours: false, drainage: false, routes: true, floodWater: true }
  }
];

export const DigitalTwinPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);
  const sensorMarkersRef = useRef<maplibregl.Marker[]>([]);
  const facilityMarkersRef = useRef<maplibregl.Marker[]>([]);
  const calloutMarkersRef = useRef<maplibregl.Marker[]>([]);

  // Simulation Context
  const {
    prediction,
    drainageNetwork,
    roads,
    facilities,
    buildings,
    sensors,
    activeHorizon,
    setActiveHorizon,
    dataMode,
    activeRoute,
    isRunningScenario,
    runFloodScenario,
    stopScenario,
    mapViewMode,
    setMapViewMode,
    satelliteOpacity,
    setSatelliteOpacity,
    blueprintOpacity,
    setBlueprintOpacity,
    showWireframe,
    setShowWireframe,
    showContours,
    setShowContours,
    contours,
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    setIsDigitalTwinOpen,
    floodOpacity,
    setFloodOpacity
  } = useSimulation();

  // Component UI State
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [webGlAvailable, setWebGlAvailable] = useState(true);
  const [isUndergroundView, setIsUndergroundView] = useState(false);
  const [showFloatingGrid, setShowFloatingGrid] = useState(true);
  const [showCallouts, setShowCallouts] = useState(true);
  const [showStoryGuide, setShowStoryGuide] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [activePanel, setActivePanel] = useState<'layers' | 'style' | 'opacity' | 'camera' | null>(null);
  const [showCoupledDiagram, setShowCoupledDiagram] = useState(true);

  // Layer Toggles
  const [showBuildings, setShowBuildings] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showFloodWater, setShowFloodWater] = useState(true);
  const [showDrainage, setShowDrainage] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);

  // WebGL hardware acceleration check
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlAvailable(false);
      }
    } catch (e) {
      setWebGlAvailable(false);
    }
  }, []);

  // Sync back button: clean URL hash if present
  const handleReturnToGis = () => {
    if (window.location.hash.includes('digital-twin')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setIsDigitalTwinOpen(false);
  };

  // Active Buildings dataset
  const activeBuildingsGeoJSON = useMemo(() => {
    if (buildings && buildings.features && buildings.features.length > 0) {
      return buildings;
    }
    return DEFAULT_BUILDINGS_GEOJSON;
  }, [buildings]);

  // Glowing wireframe perimeter lines
  const buildingWireframesGeoJSON = useMemo(() => {
    if (!activeBuildingsGeoJSON?.features) return { type: 'FeatureCollection', features: [] };
    const lines: any[] = [];
    activeBuildingsGeoJSON.features.forEach((feat: any, idx: number) => {
      if (!feat.geometry) return;
      if (feat.geometry.type === 'Polygon') {
        lines.push({
          type: 'Feature',
          properties: { ...feat.properties, id: 'wf-' + (feat.properties?.id || idx) },
          geometry: {
            type: 'LineString',
            coordinates: feat.geometry.coordinates[0]
          }
        });
      } else if (feat.geometry.type === 'MultiPolygon') {
        feat.geometry.coordinates.forEach((polyCoords: any[], pIdx: number) => {
          lines.push({
            type: 'Feature',
            properties: { ...feat.properties, id: 'wf-' + (feat.properties?.id || idx) + '-' + pIdx },
            geometry: {
              type: 'LineString',
              coordinates: polyCoords[0]
            }
          });
        });
      }
    });
    return { type: 'FeatureCollection', features: lines };
  }, [activeBuildingsGeoJSON]);

  // Active Topographic Contours (DEM)
  const activeContoursGeoJSON = useMemo(() => {
    if (contours && contours.features && contours.features.length > 0) {
      return contours;
    }
    return DEFAULT_TERRAIN_CONTOURS;
  }, [contours]);

  // 1. Surface Volumetric Flood Water GeoJSON (at terrain level)
  const floodGridGeoJSON = useMemo(() => {
    if (!prediction?.grid || prediction.grid.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }
    const dLat = 350.0 / 111000.0 / 2.0;
    const dLon = 350.0 / 108000.0 / 2.0;

    const features = prediction.grid.map((cell: GridCell) => {
      const depth = cell.water_depth_cm || 0;
      const extrudeHeight = depth > 0.5 ? Math.max(1.8, depth * 0.75) : 0;
      return {
        type: 'Feature',
        properties: {
          id: cell.cell_id,
          water_depth_cm: depth,
          elevation_m: cell.elevation_m,
          risk_level: cell.risk_level,
          slope_deg: cell.slope_deg,
          flow_direction_deg: cell.flow_direction_deg || 0,
          surcharge_cm: cell.drainage_surcharge_cm || 0,
          confidence_pct: cell.confidence_pct || 85,
          extrude_height: extrudeHeight,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [cell.lon - dLon, cell.lat - dLat],
            [cell.lon + dLon, cell.lat - dLat],
            [cell.lon + dLon, cell.lat + dLat],
            [cell.lon - dLon, cell.lat + dLat],
            [cell.lon - dLon, cell.lat - dLat]
          ]]
        }
      };
    });

    return { type: 'FeatureCollection', features };
  }, [prediction]);

  // 2. Floating Translucent Holographic Flood Prediction Grid (Requirement 5)
  // Hovering 30m above terrain/buildings
  const floatingGridGeoJSON = useMemo(() => {
    if (!prediction?.grid || prediction.grid.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }
    const dLat = 330.0 / 111000.0 / 2.0;
    const dLon = 330.0 / 108000.0 / 2.0;

    const features = prediction.grid.map((cell: GridCell) => {
      const depth = cell.water_depth_cm || 0;
      return {
        type: 'Feature',
        properties: {
          id: 'float-' + cell.cell_id,
          cell_id: cell.cell_id,
          water_depth_cm: depth,
          elevation_m: cell.elevation_m,
          risk_level: cell.risk_level,
          confidence_pct: cell.confidence_pct || 88,
          base_elev: 32,
          top_elev: 34
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [cell.lon - dLon, cell.lat - dLat],
            [cell.lon + dLon, cell.lat - dLat],
            [cell.lon + dLon, cell.lat + dLat],
            [cell.lon - dLon, cell.lat + dLat],
            [cell.lon - dLon, cell.lat - dLat]
          ]]
        }
      };
    });

    return { type: 'FeatureCollection', features };
  }, [prediction]);

  // Floating Grid Holographic Wireframe Borders
  const floatingGridLinesGeoJSON = useMemo(() => {
    if (!floatingGridGeoJSON?.features) return { type: 'FeatureCollection', features: [] };
    const lines = floatingGridGeoJSON.features.map((f: any) => ({
      type: 'Feature',
      properties: f.properties,
      geometry: {
        type: 'LineString',
        coordinates: f.geometry.coordinates[0]
      }
    }));
    return { type: 'FeatureCollection', features: lines };
  }, [floatingGridGeoJSON]);

  // Roads GeoJSON
  const roadsGeoJSON = useMemo(() => {
    if (!roads || roads.length === 0) return { type: 'FeatureCollection', features: [] };
    return {
      type: 'FeatureCollection',
      features: roads.map((r: RoadFeature) => ({
        type: 'Feature',
        properties: {
          id: r.road_id,
          name: r.name,
          road_type: r.road_type,
          length_km: r.length_km,
          predicted_depth_cm: r.predicted_depth_cm,
          travel_status: r.travel_status,
          risk_level: r.risk_level,
          why_prediction: r.why_prediction,
          passable: r.travel_status !== 'BLOCKED'
        },
        geometry: {
          type: 'LineString',
          coordinates: r.coordinates.map(([lat, lon]) => [lon, lat])
        }
      }))
    };
  }, [roads]);

  // Drainage Pipes GeoJSON
  const drainagePipesGeoJSON = useMemo(() => {
    if (!drainageNetwork?.edges || !drainageNetwork?.nodes) return { type: 'FeatureCollection', features: [] };
    const nodeMap = new Map(drainageNetwork.nodes.map(n => [n.node_id, n]));

    const features = drainageNetwork.edges.map(e => {
      const fromNode = nodeMap.get(e.from_node);
      const toNode = nodeMap.get(e.to_node);
      if (!fromNode || !toNode) return null;

      return {
        type: 'Feature',
        properties: {
          id: e.edge_id,
          from_node: e.from_node,
          to_node: e.to_node,
          diameter_m: e.diameter_m,
          flow_m3_s: e.flow_m3_s,
          capacity_m3_s: e.capacity_m3_s,
          utilization_pct: e.utilization_pct,
          status: e.status
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [fromNode.lon, fromNode.lat],
            [toNode.lon, toNode.lat]
          ]
        }
      };
    }).filter(Boolean);

    return { type: 'FeatureCollection', features };
  }, [drainageNetwork]);

  // Drainage Nodes GeoJSON
  const drainageNodesGeoJSON = useMemo(() => {
    if (!drainageNetwork?.nodes) return { type: 'FeatureCollection', features: [] };
    return {
      type: 'FeatureCollection',
      features: drainageNetwork.nodes.map(n => ({
        type: 'Feature',
        properties: {
          id: n.node_id,
          name: n.name,
          node_type: n.node_type || 'Manhole',
          elevation_m: n.elevation_m,
          capacity: n.inlet_capacity_m3_s,
          inflow: n.current_inflow_m3_s,
          is_surcharged: n.is_surcharged,
          surcharge_volume_m3: n.surcharge_volume_m3,
          spill_depth_cm: n.spill_depth_cm
        },
        geometry: {
          type: 'Point',
          coordinates: [n.lon, n.lat]
        }
      }))
    };
  }, [drainageNetwork]);

  // Multi-Objective Routes GeoJSON with fallback if not yet calculated
  const routesGeoJSON = useMemo(() => {
    if (activeRoute?.routes && activeRoute.routes.length > 0) {
      return {
        type: 'FeatureCollection',
        features: activeRoute.routes.map(r => ({
          type: 'Feature',
          properties: {
            route_type: r.route_type,
            title: r.title || r.route_type.toUpperCase(),
            distance_km: r.distance_km,
            travel_time_min: r.travel_time_min || r.duration_min || 0,
            max_depth_cm: r.max_depth_cm || r.maximum_water_depth_cm || 0,
            passable: r.passable,
            risk_level: r.risk_level,
            is_selected: activeRoute.selected_route === r.route_type
          },
          geometry: {
            type: 'LineString',
            coordinates: r.coordinates.map(([lat, lon]) => [lon, lat])
          }
        }))
      };
    }

    // Default high-fidelity baseline routes for presentation demo
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            route_type: 'safest',
            title: 'SAFEST PATH (CLEARANCE > 30CM)',
            distance_km: 4.8,
            travel_time_min: 14,
            max_depth_cm: 2.1,
            passable: true,
            risk_level: 'SAFE',
            is_selected: true
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [77.6225, 12.9385],
              [77.6250, 12.9430],
              [77.6350, 12.9460],
              [77.6520, 12.9450],
              [77.6620, 12.9410],
              [77.6650, 12.9340]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {
            route_type: 'shortest',
            title: 'SHORTEST PATH (BLOCKED BY FLOOD)',
            distance_km: 3.2,
            travel_time_min: 28,
            max_depth_cm: 52.0,
            passable: false,
            risk_level: 'CRITICAL',
            is_selected: false
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [77.6225, 12.9385],
              [77.6325, 12.9362],
              [77.6450, 12.9350],
              [77.6650, 12.9340]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {
            route_type: 'fastest',
            title: 'FASTEST ROUTE',
            distance_km: 4.2,
            travel_time_min: 12,
            max_depth_cm: 18.5,
            passable: true,
            risk_level: 'CAUTION',
            is_selected: false
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [77.6225, 12.9385],
              [77.6280, 12.9320],
              [77.6420, 12.9310],
              [77.6580, 12.9330],
              [77.6650, 12.9340]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {
            route_type: 'emergency',
            title: 'EMERGENCY PRIORITY CORRIDOR',
            distance_km: 4.6,
            travel_time_min: 10,
            max_depth_cm: 0.0,
            passable: true,
            risk_level: 'SAFE',
            is_selected: false
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [77.6225, 12.9385],
              [77.6260, 12.9440],
              [77.6400, 12.9470],
              [77.6560, 12.9460],
              [77.6650, 12.9340]
            ]
          }
        }
      ]
    };
  }, [activeRoute]);

  // Initialize MapLibre GL 3D Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !webGlAvailable) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'satellite-tiles': {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              ],
              tileSize: 256,
              attribution: 'Esri World Imagery'
            },
            'osm-base-tiles': {
              type: 'raster',
              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: 'OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'background',
              type: 'background',
              paint: {
                'background-color': '#030712'
              }
            },
            {
              id: 'satellite-layer',
              type: 'raster',
              source: 'satellite-tiles',
              paint: {
                'raster-opacity': 0.75,
                'raster-contrast': 0.15,
                'raster-saturation': 0.05
              }
            },
            {
              id: 'dark-base-tiles',
              type: 'raster',
              source: 'osm-base-tiles',
              paint: {
                'raster-opacity': 0.0,
                'raster-saturation': -1.0,
                'raster-brightness-max': 0.28,
                'raster-contrast': 0.35
              }
            }
          ]
        },
        center: [77.640, 12.937],
        zoom: 13.8,
        pitch: 50,
        bearing: -22,
        maxPitch: 85
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

      map.on('load', () => {
        mapRef.current = map;
        setIsMapLoaded(true);

        map.setLight({
          anchor: 'viewport',
          color: '#ffffff',
          intensity: 0.60,
          position: [1.5, 90, 45]
        });

        // 1. Water Bodies
        map.addSource('water-bodies-src', {
          type: 'geojson',
          data: WATER_BODIES_GEOJSON as any
        });
        map.addLayer({
          id: 'water-bodies-fill',
          type: 'fill',
          source: 'water-bodies-src',
          paint: {
            'fill-color': '#062038',
            'fill-opacity': 0.90
          }
        });
        map.addLayer({
          id: 'water-bodies-line',
          type: 'line',
          source: 'water-bodies-src',
          paint: {
            'line-color': '#00f0ff',
            'line-width': 2.4,
            'line-opacity': 0.95
          }
        });

        // 2. DEM Elevation Contours
        map.addSource('contours-src', {
          type: 'geojson',
          data: activeContoursGeoJSON as any
        });
        map.addLayer({
          id: 'contours-index-line',
          type: 'line',
          source: 'contours-src',
          filter: ['==', ['get', 'type'], 'INDEX'],
          paint: {
            'line-color': [
              'step',
              ['get', 'elevation_m'],
              '#38bdf8',
              885, '#06b6d4',
              895, '#10b981',
              905, '#f59e0b',
              915, '#f97316'
            ],
            'line-width': 2.2,
            'line-opacity': 0.85
          }
        });
        map.addLayer({
          id: 'contours-minor-line',
          type: 'line',
          source: 'contours-src',
          filter: ['==', ['get', 'type'], 'INTERMEDIATE'],
          paint: {
            'line-color': '#38bdf8',
            'line-width': 1.1,
            'line-dasharray': [2, 2],
            'line-opacity': 0.55
          }
        });

        // 3. Volumetric Surface Flood Water (at ground level)
        map.addSource('flood-grid-src', {
          type: 'geojson',
          data: floodGridGeoJSON as any
        });
        map.addLayer({
          id: 'flood-water-3d',
          type: 'fill-extrusion',
          source: 'flood-grid-src',
          paint: {
            'fill-extrusion-color': [
              'step',
              ['get', 'water_depth_cm'],
              'transparent',
              0.5, DEMO_FLOOD_COLORS.SHALLOW,
              5, DEMO_FLOOD_COLORS.MODERATE,
              15, DEMO_FLOOD_COLORS.HIGH,
              30, DEMO_FLOOD_COLORS.VERY_HIGH,
              50, DEMO_FLOOD_COLORS.CRITICAL
            ],
            'fill-extrusion-height': ['get', 'extrude_height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': floodOpacity || 0.35,
            'fill-extrusion-vertical-gradient': true
          }
        });

        // 4. Roads Network
        map.addSource('roads-src', {
          type: 'geojson',
          data: roadsGeoJSON as any
        });
        map.addLayer({
          id: 'roads-glow',
          type: 'line',
          source: 'roads-src',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'travel_status'], 'BLOCKED'], '#ef4444',
              ['==', ['get', 'travel_status'], 'HIGH_RISK'], '#f97316',
              ['==', ['get', 'travel_status'], 'CAUTION'], '#eab308',
              ['==', ['get', 'road_type'], 'ELEVATED_BYPASS'], '#c084fc',
              '#38bdf8'
            ],
            'line-width': 6.5,
            'line-blur': 4.0,
            'line-opacity': 0.70
          }
        });
        map.addLayer({
          id: 'roads-line',
          type: 'line',
          source: 'roads-src',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'travel_status'], 'BLOCKED'], '#f87171',
              ['==', ['get', 'travel_status'], 'HIGH_RISK'], '#fb923c',
              ['==', ['get', 'travel_status'], 'CAUTION'], '#facc15',
              ['==', ['get', 'road_type'], 'ELEVATED_BYPASS'], '#e879f9',
              ['==', ['get', 'road_type'], 'PRIMARY'], '#38bdf8',
              ['==', ['get', 'road_type'], 'SECONDARY'], '#818cf8',
              '#64748b'
            ],
            'line-width': [
              'case',
              ['==', ['get', 'road_type'], 'ELEVATED_BYPASS'], 4.8,
              ['==', ['get', 'road_type'], 'PRIMARY'], 4.0,
              ['==', ['get', 'road_type'], 'SECONDARY'], 3.0,
              2.0
            ],
            'line-opacity': 0.95
          }
        });

        // 5. 3D Architectural Buildings (162 Extruded Physical Models)
        map.addSource('buildings-src', {
          type: 'geojson',
          data: activeBuildingsGeoJSON as any
        });
        map.addLayer({
          id: 'buildings-3d',
          type: 'fill-extrusion',
          source: 'buildings-src',
          paint: {
            'fill-extrusion-color': [
              'case',
              ['==', ['get', 'type'], 'HOSPITAL'], '#1e3a5f',
              ['==', ['get', 'type'], 'TECH_PARK'], '#112233',
              ['==', ['get', 'type'], 'COMMERCIAL'], '#0c1a29',
              ['==', ['get', 'type'], 'CIVIC'], '#16283d',
              '#091422'
            ],
            'fill-extrusion-height': ['get', 'height_m'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.30,
            'fill-extrusion-vertical-gradient': true
          }
        });

        // 6. Glowing Wireframe Building Outlines
        map.addSource('buildings-wireframe-src', {
          type: 'geojson',
          data: buildingWireframesGeoJSON as any
        });
        map.addLayer({
          id: 'buildings-wireframe-line',
          type: 'line',
          source: 'buildings-wireframe-src',
          paint: {
            'line-color': '#00f0ff',
            'line-width': 1.8,
            'line-opacity': 0.95
          }
        });

        // 7. FLOATING TRANSLUCENT FLOOD PREDICTION GRID (Requirement 5)
        // Hovering at 32m to 34m above the city
        map.addSource('floating-grid-src', {
          type: 'geojson',
          data: floatingGridGeoJSON as any
        });
        map.addLayer({
          id: 'floating-grid-plane',
          type: 'fill-extrusion',
          source: 'floating-grid-src',
          paint: {
            'fill-extrusion-color': [
              'case',
              ['==', ['get', 'risk_level'], 'CRITICAL'], '#ef4444',
              ['==', ['get', 'risk_level'], 'HIGH'], '#f97316',
              ['==', ['get', 'risk_level'], 'MODERATE'], '#eab308',
              '#10b981'
            ],
            'fill-extrusion-base': ['get', 'base_elev'],
            'fill-extrusion-height': ['get', 'top_elev'],
            'fill-extrusion-opacity': 0.55
          }
        });

        // Floating Grid Holographic Border Lines
        map.addSource('floating-grid-lines-src', {
          type: 'geojson',
          data: floatingGridLinesGeoJSON as any
        });
        map.addLayer({
          id: 'floating-grid-lines',
          type: 'line',
          source: 'floating-grid-lines-src',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'risk_level'], 'CRITICAL'], '#fca5a5',
              ['==', ['get', 'risk_level'], 'HIGH'], '#fdba74',
              ['==', ['get', 'risk_level'], 'MODERATE'], '#fde047',
              '#6ee7b7'
            ],
            'line-width': 1.6,
            'line-opacity': 0.90
          }
        });

        // 8. Underground Drainage Network
        map.addSource('drainage-pipes-src', {
          type: 'geojson',
          data: drainagePipesGeoJSON as any
        });
        map.addLayer({
          id: 'drainage-pipes-glow',
          type: 'line',
          source: 'drainage-pipes-src',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'status'], 'SURCHARGED'], DRAINAGE_PALETTE.surcharged,
              ['==', ['get', 'status'], 'WARNING'], DRAINAGE_PALETTE.warning,
              DRAINAGE_PALETTE.normal
            ],
            'line-width': 5.0,
            'line-blur': 3.0,
            'line-opacity': 0.7
          }
        });
        map.addLayer({
          id: 'drainage-pipes-line',
          type: 'line',
          source: 'drainage-pipes-src',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'status'], 'SURCHARGED'], DRAINAGE_PALETTE.surcharged,
              ['==', ['get', 'status'], 'WARNING'], DRAINAGE_PALETTE.warning,
              DRAINAGE_PALETTE.normal
            ],
            'line-width': 2.2,
            'line-dasharray': [3, 2],
            'line-opacity': 0.95
          }
        });

        // Drainage Nodes
        map.addSource('drainage-nodes-src', {
          type: 'geojson',
          data: drainageNodesGeoJSON as any
        });
        map.addLayer({
          id: 'drainage-nodes-circle',
          type: 'circle',
          source: 'drainage-nodes-src',
          paint: {
            'circle-radius': [
              'case',
              ['==', ['get', 'is_surcharged'], true], 8.5,
              5.5
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'is_surcharged'], true], '#ef4444',
              '#06b6d4'
            ],
            'circle-stroke-width': 2.0,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95
          }
        });

        // 9. Multi-Objective Routes
        map.addSource('routes-src', {
          type: 'geojson',
          data: routesGeoJSON as any
        });
        map.addLayer({
          id: 'routes-glow',
          type: 'line',
          source: 'routes-src',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'route_type'], 'emergency'], ROUTE_PALETTE.emergency,
              ['==', ['get', 'route_type'], 'safest'], ROUTE_PALETTE.safest,
              ['==', ['get', 'route_type'], 'fastest'], ROUTE_PALETTE.fastest,
              ROUTE_PALETTE.shortest
            ],
            'line-width': [
              'case',
              ['==', ['get', 'is_selected'], true], 8.0,
              3.0
            ],
            'line-blur': 3.0,
            'line-opacity': [
              'case',
              ['==', ['get', 'is_selected'], true], 0.85,
              0.15
            ]
          }
        });
        map.addLayer({
          id: 'routes-line',
          type: 'line',
          source: 'routes-src',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'route_type'], 'emergency'], ROUTE_PALETTE.emergency,
              ['==', ['get', 'route_type'], 'safest'], ROUTE_PALETTE.safest,
              ['==', ['get', 'route_type'], 'fastest'], ROUTE_PALETTE.fastest,
              ROUTE_PALETTE.shortest
            ],
            'line-width': [
              'case',
              ['==', ['get', 'is_selected'], true], 5.5,
              2.0
            ],
            'line-opacity': [
              'case',
              ['==', ['get', 'is_selected'], true], 1.0,
              0.25
            ]
          }
        });

        // Click listeners for entity inspector
        map.on('click', 'buildings-3d', (e) => {
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            setSelectedEntity({
              category: 'BUILDING',
              id: props.id,
              name: props.name,
              type: props.type,
              height_m: props.height_m,
              levels: props.levels,
              elevation_m: props.elevation_m,
              flood_risk: props.flood_risk,
              nearest_depth_cm: props.nearest_flood_depth_cm,
              data_source: props.data_source || 'BENGALURU URBAN GIS BASELINE',
              height_provenance: props.height_provenance || (props.id?.startsWith('BLD-HOSP') || props.id?.startsWith('BLD-TECH') || props.id?.startsWith('BLD-COMM') ? 'REAL' : 'SIMULATED')
            });
          }
        });

        map.on('click', 'roads-line', (e) => {
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            setSelectedEntity({
              category: 'ROAD',
              id: props.id,
              name: props.name,
              road_type: props.road_type,
              length_km: props.length_km,
              predicted_depth_cm: props.predicted_depth_cm,
              travel_status: props.travel_status,
              risk_level: props.risk_level,
              why_prediction: props.why_prediction
            });
          }
        });

        map.on('click', 'drainage-nodes-circle', (e) => {
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            setSelectedEntity({
              category: 'DRAINAGE_NODE',
              id: props.id,
              name: props.name,
              node_type: props.node_type,
              elevation_m: props.elevation_m,
              capacity: props.capacity,
              inflow: props.inflow,
              is_surcharged: props.is_surcharged,
              surcharge_volume_m3: props.surcharge_volume_m3,
              spill_depth_cm: props.spill_depth_cm
            });
          }
        });

        map.on('click', 'floating-grid-plane', (e) => {
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            setSelectedEntity({
              category: 'FLOATING_PREDICTION_GRID',
              id: props.cell_id,
              water_depth_cm: props.water_depth_cm,
              elevation_m: props.elevation_m,
              risk_level: props.risk_level,
              confidence_pct: props.confidence_pct,
              details: 'Holographic Prediction Cell hovering at 32m AMSL. Hydrodynamic runoff calculation verified.'
            });
          }
        });

        map.on('click', 'routes-line', (e) => {
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            setSelectedEntity({
              category: 'ROUTE',
              id: props.title,
              route_type: props.route_type,
              distance_km: props.distance_km,
              travel_time_min: props.travel_time_min,
              max_depth_cm: props.max_depth_cm,
              passable: props.passable,
              risk_level: props.risk_level
            });
          }
        });

        const interactiveLayers = ['buildings-3d', 'roads-line', 'drainage-nodes-circle', 'floating-grid-plane', 'routes-line'];
        interactiveLayers.forEach(l => {
          map.on('mouseenter', l, () => (map.getCanvas().style.cursor = 'pointer'));
          map.on('mouseleave', l, () => (map.getCanvas().style.cursor = ''));
        });
      });
    } catch (err) {
      console.error('Failed to initialize 3D Digital Twin Map:', err);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (vehicleMarkerRef.current) vehicleMarkerRef.current.remove();
      sensorMarkersRef.current.forEach(m => m.remove());
      facilityMarkersRef.current.forEach(m => m.remove());
      calloutMarkersRef.current.forEach(m => m.remove());
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [webGlAvailable]);

  // Update dynamic GeoJSON data on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !isMapLoaded) return;

    const floodSrc = map.getSource('flood-grid-src') as maplibregl.GeoJSONSource;
    if (floodSrc) floodSrc.setData(floodGridGeoJSON as any);

    const floatSrc = map.getSource('floating-grid-src') as maplibregl.GeoJSONSource;
    if (floatSrc) floatSrc.setData(floatingGridGeoJSON as any);

    const floatLinesSrc = map.getSource('floating-grid-lines-src') as maplibregl.GeoJSONSource;
    if (floatLinesSrc) floatLinesSrc.setData(floatingGridLinesGeoJSON as any);

    const roadsSrc = map.getSource('roads-src') as maplibregl.GeoJSONSource;
    if (roadsSrc) roadsSrc.setData(roadsGeoJSON as any);

    const bldSrc = map.getSource('buildings-src') as maplibregl.GeoJSONSource;
    if (bldSrc) bldSrc.setData(activeBuildingsGeoJSON as any);

    const wfSrc = map.getSource('buildings-wireframe-src') as maplibregl.GeoJSONSource;
    if (wfSrc) wfSrc.setData(buildingWireframesGeoJSON as any);

    const contSrc = map.getSource('contours-src') as maplibregl.GeoJSONSource;
    if (contSrc) contSrc.setData(activeContoursGeoJSON as any);

    const pipesSrc = map.getSource('drainage-pipes-src') as maplibregl.GeoJSONSource;
    if (pipesSrc) pipesSrc.setData(drainagePipesGeoJSON as any);

    const nodesSrc = map.getSource('drainage-nodes-src') as maplibregl.GeoJSONSource;
    if (nodesSrc) nodesSrc.setData(drainageNodesGeoJSON as any);

    const routesSrc = map.getSource('routes-src') as maplibregl.GeoJSONSource;
    if (routesSrc) routesSrc.setData(routesGeoJSON as any);
  }, [
    isMapLoaded,
    floodGridGeoJSON,
    floatingGridGeoJSON,
    floatingGridLinesGeoJSON,
    roadsGeoJSON,
    activeBuildingsGeoJSON,
    buildingWireframesGeoJSON,
    activeContoursGeoJSON,
    drainagePipesGeoJSON,
    drainageNodesGeoJSON,
    routesGeoJSON
  ]);

  // Master Basemap, Opacity & Technical Styling Controller
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !isMapLoaded) return;

    // 1. Satellite Layer
    if (map.getLayer('satellite-layer')) {
      if (mapViewMode === 'satellite') {
        map.setPaintProperty('satellite-layer', 'raster-opacity', satelliteOpacity);
      } else if (mapViewMode === 'satellite_blueprint') {
        map.setPaintProperty('satellite-layer', 'raster-opacity', satelliteOpacity * 0.85);
      } else {
        map.setPaintProperty('satellite-layer', 'raster-opacity', 0.0);
      }
    }

    // 2. Dark OSM Base Layer
    if (map.getLayer('dark-base-tiles')) {
      if (mapViewMode === 'street') {
        map.setPaintProperty('dark-base-tiles', 'raster-opacity', 0.90);
        map.setPaintProperty('dark-base-tiles', 'raster-saturation', 0.0);
        map.setPaintProperty('dark-base-tiles', 'raster-brightness-max', 1.0);
      } else if (mapViewMode === 'dark' || mapViewMode === 'twin_3d') {
        map.setPaintProperty('dark-base-tiles', 'raster-opacity', 0.45);
        map.setPaintProperty('dark-base-tiles', 'raster-saturation', -1.0);
        map.setPaintProperty('dark-base-tiles', 'raster-brightness-max', 0.28);
      } else if (mapViewMode === 'blueprint') {
        map.setPaintProperty('dark-base-tiles', 'raster-opacity', 0.12);
        map.setPaintProperty('dark-base-tiles', 'raster-saturation', -1.0);
        map.setPaintProperty('dark-base-tiles', 'raster-brightness-max', 0.20);
      } else {
        map.setPaintProperty('dark-base-tiles', 'raster-opacity', 0.0);
      }
    }

    // 3. Extruded 3D Buildings
    if (map.getLayer('buildings-3d')) {
      map.setLayoutProperty('buildings-3d', 'visibility', showBuildings ? 'visible' : 'none');

      if (isUndergroundView) {
        map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity', 0.12);
      } else if (mapViewMode === 'satellite_blueprint') {
        map.setPaintProperty('buildings-3d', 'fill-extrusion-color', '#0c2238');
        map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity', Math.min(0.35, Math.max(0.20, 0.35 * blueprintOpacity)));
      } else if (mapViewMode === 'blueprint') {
        map.setPaintProperty('buildings-3d', 'fill-extrusion-color', '#091827');
        map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity', Math.min(0.40, Math.max(0.25, 0.45 * blueprintOpacity)));
      } else if (mapViewMode === 'satellite') {
        map.setPaintProperty('buildings-3d', 'fill-extrusion-color', '#1e293b');
        map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity', 0.28);
      } else {
        map.setPaintProperty('buildings-3d', 'fill-extrusion-color', [
          'case',
          ['==', ['get', 'type'], 'HOSPITAL'], '#253550',
          ['==', ['get', 'type'], 'TECH_PARK'], '#1b2538',
          ['==', ['get', 'type'], 'COMMERCIAL'], '#161f2f',
          ['==', ['get', 'type'], 'CIVIC'], '#222d42',
          '#131a26'
        ]);
        map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity', 0.30);
      }
    }

    // 4. Glowing Wireframe Outlines
    if (map.getLayer('buildings-wireframe-line')) {
      const isWireframeActive = showWireframe && (mapViewMode === 'satellite_blueprint' || mapViewMode === 'blueprint' || mapViewMode === 'twin_3d' || mapViewMode === 'dark');
      map.setLayoutProperty('buildings-wireframe-line', 'visibility', isWireframeActive && showBuildings ? 'visible' : 'none');
      map.setPaintProperty('buildings-wireframe-line', 'line-opacity', Math.max(0.25, blueprintOpacity * 0.95));
      map.setPaintProperty('buildings-wireframe-line', 'line-width', isUndergroundView ? 1.0 : 1.8);
    }

    // 5. DEM Topographic Contours
    const isContoursActive = showContours && (mapViewMode === 'satellite_blueprint' || mapViewMode === 'blueprint' || mapViewMode === 'twin_3d' || mapViewMode === 'dark');
    if (map.getLayer('contours-index-line')) {
      map.setLayoutProperty('contours-index-line', 'visibility', isContoursActive ? 'visible' : 'none');
      map.setPaintProperty('contours-index-line', 'line-opacity', Math.max(0.3, blueprintOpacity * 0.85));
    }
    if (map.getLayer('contours-minor-line')) {
      map.setLayoutProperty('contours-minor-line', 'visibility', isContoursActive ? 'visible' : 'none');
      map.setPaintProperty('contours-minor-line', 'line-opacity', Math.max(0.15, blueprintOpacity * 0.55));
    }

    // 6. Surface Volumetric Flood Water
    if (map.getLayer('flood-water-3d')) {
      map.setLayoutProperty('flood-water-3d', 'visibility', showFloodWater ? 'visible' : 'none');
      map.setPaintProperty('flood-water-3d', 'fill-extrusion-opacity', isUndergroundView ? 0.20 : floodOpacity);
    }

    // 7. Floating Holographic Prediction Grid (Requirement 5)
    if (map.getLayer('floating-grid-plane')) {
      map.setLayoutProperty('floating-grid-plane', 'visibility', showFloatingGrid ? 'visible' : 'none');
    }
    if (map.getLayer('floating-grid-lines')) {
      map.setLayoutProperty('floating-grid-lines', 'visibility', showFloatingGrid ? 'visible' : 'none');
    }

    // 8. Roads
    if (map.getLayer('roads-line')) {
      map.setLayoutProperty('roads-line', 'visibility', showRoads ? 'visible' : 'none');
      map.setLayoutProperty('roads-glow', 'visibility', showRoads ? 'visible' : 'none');
    }

    // 9. Underground Drainage Network
    if (map.getLayer('drainage-pipes-line')) {
      map.setLayoutProperty('drainage-pipes-line', 'visibility', showDrainage ? 'visible' : 'none');
      map.setLayoutProperty('drainage-pipes-glow', 'visibility', showDrainage ? 'visible' : 'none');
      map.setLayoutProperty('drainage-nodes-circle', 'visibility', showDrainage ? 'visible' : 'none');

      map.setPaintProperty('drainage-pipes-line', 'line-width', isUndergroundView ? 4.5 : 3.0);
      map.setPaintProperty('drainage-pipes-glow', 'line-width', isUndergroundView ? 9.0 : 5.5);
    }

    // 10. Routes
    if (map.getLayer('routes-line')) {
      map.setLayoutProperty('routes-line', 'visibility', showRoutes ? 'visible' : 'none');
      map.setLayoutProperty('routes-glow', 'visibility', showRoutes ? 'visible' : 'none');
    }
  }, [
    isMapLoaded,
    mapViewMode,
    satelliteOpacity,
    blueprintOpacity,
    showWireframe,
    showContours,
    showBuildings,
    showFloodWater,
    showFloatingGrid,
    showRoads,
    showDrainage,
    showRoutes,
    isUndergroundView,
    floodOpacity
  ]);

  // Render 3D Vertical Technical Callout Leader Labels (Requirement 6)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    calloutMarkersRef.current.forEach(m => m.remove());
    calloutMarkersRef.current = [];

    if (!showCallouts) return;

    TECHNICAL_CALLOUTS.forEach(c => {
      const el = document.createElement('div');
      el.className = 'technical-callout-marker flex flex-col items-center cursor-pointer group';
      el.innerHTML = `
        <div class="px-2.5 py-1 rounded-lg border ${c.badgeColor} text-[11px] font-mono font-bold shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col items-center space-y-0.5 group-hover:scale-110 transition-transform">
          <div class="flex items-center space-x-1.5">
            <span class="w-2 h-2 rounded-full animate-ping" style="background-color: ${c.lineColor};"></span>
            <span class="tracking-wide">${c.title}</span>
          </div>
          <span class="text-[9px] font-normal text-slate-300">${c.subtitle}</span>
        </div>
        <div class="w-[1.5px] h-10" style="background: linear-gradient(to bottom, ${c.lineColor}, rgba(255,255,255,0.1));"></div>
        <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${c.lineColor}; box-shadow: 0 0 10px ${c.lineColor};"></div>
      `;

      el.addEventListener('click', () => {
        setSelectedEntity({
          category: 'TECHNICAL_CALLOUT',
          id: c.id,
          name: c.title,
          subtitle: c.subtitle,
          details: c.details
        });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([c.lon, c.lat])
        .addTo(map);

      calloutMarkersRef.current.push(marker);
    });
  }, [isMapLoaded, showCallouts]);

  // Render 3D Vertical IoT Sensor Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    sensorMarkersRef.current.forEach(m => m.remove());
    sensorMarkersRef.current = [];

    if (!showSensors || !sensors) return;

    sensors.forEach((s: any) => {
      const el = document.createElement('div');
      el.className = 'sensor-3d-pin cursor-pointer flex flex-col items-center group';
      el.innerHTML = `
        <div class="px-1.5 py-0.5 rounded bg-slate-900/90 border border-sky-400/80 text-[10px] font-mono text-sky-300 font-bold shadow-lg flex items-center space-x-1 group-hover:scale-110 transition-transform">
          <span class="w-1.5 h-1.5 rounded-full ${s.status === 'CRITICAL' ? 'bg-rose-500 animate-ping' : (s.status === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400')}"></span>
          <span>${s.id}</span>
        </div>
        <div class="w-0.5 h-5 bg-gradient-to-b from-sky-400 to-transparent"></div>
        <div class="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]"></div>
      `;

      el.addEventListener('click', () => {
        setSelectedEntity({
          category: 'SENSOR',
          id: s.id,
          name: s.name || 'IoT Telemeter ' + s.id,
          water_depth_cm: s.water_depth_cm || s.observed_depth_cm || 0,
          battery_pct: s.battery_pct || 94,
          status: s.status || 'NORMAL',
          location: s.location || 'Koramangala Basin Ingress'
        });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([s.lon, s.lat])
        .addTo(map);

      sensorMarkersRef.current.push(marker);
    });
  }, [isMapLoaded, sensors, showSensors]);

  // Render 3D Emergency Facility Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    facilityMarkersRef.current.forEach(m => m.remove());
    facilityMarkersRef.current = [];

    if (!showFacilities || !facilities) return;

    facilities.forEach((f: EmergencyFacility) => {
      const el = document.createElement('div');
      el.className = 'facility-3d-pin cursor-pointer flex flex-col items-center group';
      const isHospital = f.facility_type === 'Hospital';
      const isFire = f.facility_type === 'Fire Station';

      const color = isHospital ? 'text-rose-400 border-rose-500/80 bg-rose-950/80' :
        (isFire ? 'text-amber-400 border-amber-500/80 bg-amber-950/80' : 'text-blue-400 border-blue-500/80 bg-blue-950/80');

      el.innerHTML = `
        <div class="px-2 py-0.5 rounded-full border ${color} text-[10px] font-bold shadow-xl flex items-center space-x-1 backdrop-blur-sm group-hover:scale-115 transition-transform">
          <span>${isHospital ? '🏥' : (isFire ? '🚒' : '🏛️')}</span>
          <span class="truncate max-w-[110px]">${f.name}</span>
        </div>
        <div class="w-0.5 h-6 bg-gradient-to-b from-white to-transparent"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#ffffff]"></div>
      `;

      el.addEventListener('click', () => {
        setSelectedEntity({
          category: 'FACILITY',
          id: f.id,
          name: f.name,
          type: f.facility_type,
          elevation_m: f.elevation_m,
          current_depth_cm: f.current_depth_cm,
          access_status: f.access_status,
          why_status: f.why_status,
          contact: f.contact
        });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([f.lon, f.lat])
        .addTo(map);

      facilityMarkersRef.current.push(marker);
    });
  }, [isMapLoaded, facilities, showFacilities]);

  // Animated 3D Emergency Vehicle Simulation along safest route (Requirement 9)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) {
      if (vehicleMarkerRef.current) vehicleMarkerRef.current.remove();
      return;
    }

    // Use selected route or default safe route coords
    const routeCoords = (activeRoute?.routes?.find(r => r.route_type === 'safest') || activeRoute?.routes?.[0])?.coordinates || [
      [12.9385, 77.6225],
      [12.9430, 77.6250],
      [12.9460, 77.6350],
      [12.9450, 77.6520],
      [12.9410, 77.6620],
      [12.9340, 77.6650]
    ];

    if (!vehicleMarkerRef.current) {
      const vEl = document.createElement('div');
      vEl.className = 'emergency-vehicle-marker flex items-center justify-center';
      vEl.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-10 h-10 rounded-full bg-rose-500/40 animate-ping"></div>
          <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-[0_0_16px_#f43f5e] flex items-center justify-center text-sm font-bold">
            🚑
          </div>
        </div>
      `;
      vehicleMarkerRef.current = new maplibregl.Marker({ element: vEl, anchor: 'center' })
        .setLngLat([routeCoords[0][1], routeCoords[0][0]])
        .addTo(map);
    }

    let progress = 0;
    const speed = 0.0035;

    const animate = () => {
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

      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.setLngLat([currentLon, currentLat]);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isMapLoaded, activeRoute]);

  // Camera Presets (Requirement 11)
  const setCameraPreset = (preset: 'isometric' | 'top' | 'city' | 'flood' | 'underground' | 'emergency') => {
    const map = mapRef.current;
    if (!map) return;

    if (preset === 'isometric') {
      map.flyTo({ center: [77.640, 12.937], zoom: 13.6, pitch: 60, bearing: -22, duration: 1200 });
      setIsUndergroundView(false);
    } else if (preset === 'top') {
      map.flyTo({ center: [77.640, 12.937], zoom: 13.2, pitch: 0, bearing: 0, duration: 1200 });
      setIsUndergroundView(false);
    } else if (preset === 'city') {
      map.flyTo({ center: [77.632, 12.938], zoom: 15.6, pitch: 74, bearing: 35, duration: 1400 });
      setIsUndergroundView(false);
    } else if (preset === 'flood') {
      map.flyTo({ center: [77.633, 12.935], zoom: 15.2, pitch: 65, bearing: -30, duration: 1400 });
      setIsUndergroundView(false);
    } else if (preset === 'underground') {
      map.flyTo({ center: [77.638, 12.936], zoom: 14.8, pitch: 52, bearing: -18, duration: 1200 });
      setIsUndergroundView(true);
    } else if (preset === 'emergency') {
      map.flyTo({ center: [77.658, 12.935], zoom: 14.5, pitch: 65, bearing: -45, duration: 1400 });
      setIsUndergroundView(false);
    }
  };

  // Toggle Underground Cutaway
  const toggleUnderground = () => {
    const next = !isUndergroundView;
    setIsUndergroundView(next);
    const map = mapRef.current;
    if (!map) return;

    if (next) {
      map.flyTo({ pitch: 48, bearing: -15, duration: 1000 });
    }
  };

  // Step-by-Step Demonstration Story Guide Runner (Requirement 12)
  const jumpToDemoStep = (stepIdx: number) => {
    const step = DEMO_STEPS[stepIdx];
    if (!step) return;

    setCurrentStepIndex(stepIdx);
    const map = mapRef.current;
    if (map) {
      map.flyTo({
        center: step.camera.center,
        zoom: step.camera.zoom,
        pitch: step.camera.pitch,
        bearing: step.camera.bearing,
        duration: 1400
      });
    }

    if (step.horizon) {
      setActiveHorizon(step.horizon);
    }

    if (step.underground !== undefined) {
      setIsUndergroundView(step.underground);
    }

    if (step.activeLayers) {
      if (step.activeLayers.floatingGrid !== undefined) setShowFloatingGrid(step.activeLayers.floatingGrid);
      if (step.activeLayers.contours !== undefined) setShowContours(step.activeLayers.contours);
      if (step.activeLayers.drainage !== undefined) setShowDrainage(step.activeLayers.drainage);
      if (step.activeLayers.routes !== undefined) setShowRoutes(step.activeLayers.routes);
      if (step.activeLayers.floodWater !== undefined) setShowFloodWater(step.activeLayers.floodWater);
    }
  };

  // Hardware WebGL Fallback Screen
  if (!webGlAvailable) {
    return (
      <div className="fixed inset-0 z-50 bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="text-center max-w-md space-y-2">
          <h2 className="text-xl font-black tracking-wide text-white">3D DIGITAL TWIN UNAVAILABLE ON THIS HARDWARE</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Hardware-accelerated WebGL is required to render the 3D urban digital twin with extruded physical buildings,
            holographic flood prediction grids, and subterranean drainage networks.
          </p>
        </div>
        <button
          onClick={handleReturnToGis}
          className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-xl flex items-center space-x-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO UFNS GIS</span>
        </button>
      </div>
    );
  }

  const currentStep = DEMO_STEPS[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] text-slate-100 flex flex-col overflow-hidden select-none">
      {/* 1. TOP MASTER HEADER BAR */}
      <header className="h-16 px-4 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between z-30 shadow-2xl">
        {/* Left: Prominent Back Button + Title + Demonstration Mode Badge */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleReturnToGis}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 border border-slate-700/90 shadow-xl transition-all hover:border-cyan-500/60"
            title="Return to main UFNS dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="tracking-wide">BACK TO UFNS</span>
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300">
                  UFNS 3D DIGITAL TWIN
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400/60 text-[10px] font-mono font-bold text-cyan-300 tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  3D DIGITAL TWIN • DEMONSTRATION MODE
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Bengaluru Basin</span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-cyan-400 font-mono">162 Extruded Buildings</span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-purple-400 font-mono">DEM 875–915m AMSL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Interactive Time Horizon Stepper (Requirement 10) */}
        <div className="hidden xl:flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner space-x-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">HORIZON:</span>
          {['NOW', '+15m', '+30m', '+45m', '+1h', '+2h', '+3h'].map((h) => (
            <button
              key={h}
              onClick={() => setActiveHorizon(h)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                activeHorizon === h
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#06b6d4]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {h}
            </button>
          ))}
        </div>

        {/* Right: Actions (Scenario Runner + Underground Cutaway + Story Guide Toggle) */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={toggleUnderground}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold shadow-xl transition-all flex items-center space-x-1.5 ${
              isUndergroundView
                ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_18px_#a855f7]'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-purple-500/50'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-purple-300" />
            <span>{isUndergroundView ? 'SURFACE VIEW' : 'UNDERGROUND VIEW'}</span>
          </button>

          <button
            onClick={isRunningScenario ? stopScenario : runFloodScenario}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold shadow-xl transition-all flex items-center space-x-1.5 ${
              isRunningScenario
                ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                : 'bg-gradient-to-r from-sky-600 to-cyan-600 border-sky-400 text-white hover:from-sky-500 hover:to-cyan-500 shadow-[0_0_14px_rgba(14,165,233,0.4)]'
            }`}
          >
            {isRunningScenario ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRunningScenario ? 'PAUSE SCENARIO' : 'RUN 3D FLOOD SCENARIO'}</span>
          </button>

          <button
            onClick={() => setShowStoryGuide(!showStoryGuide)}
            className={`p-2 rounded-xl border transition-all ${
              showStoryGuide
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Demonstration Guide"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN 3D WORKSPACE CANVAS AREA */}
      <div className="flex-1 relative w-full h-[calc(100vh-64px)] overflow-hidden">
        {/* MapLibre WebGL Canvas */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* SURFACE TO DRAINAGE COUPLED CAUSAL FLOW BANNER (Requirement 8) */}
        {showCoupledDiagram && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl px-4 py-2 shadow-2xl flex items-center space-x-2 text-[11px] text-slate-300">
            <span className="font-bold text-cyan-400 flex items-center space-x-1">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>HYDRODYNAMIC CASCADE:</span>
            </span>
            <span className="text-sky-300 font-semibold">Rainfall (68mm/h)</span>
            <span className="text-slate-500">&rarr;</span>
            <span className="text-blue-300">Surface Runoff</span>
            <span className="text-slate-500">&rarr;</span>
            <span className="text-teal-300">Drainage Inlets</span>
            <span className="text-slate-500">&rarr;</span>
            <span className="text-indigo-300">Pipes Fill</span>
            <span className="text-slate-500">&rarr;</span>
            <span className="text-amber-400 font-semibold">Surcharge / Backflow</span>
            <span className="text-slate-500">&rarr;</span>
            <span className="text-rose-400 font-bold">Road Flooding (52cm)</span>
            <button
              onClick={() => setShowCoupledDiagram(false)}
              className="ml-2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* LEFT FLOATING CONTROL HUD (Basemap, Opacity, Layers & Camera Presets) */}
        <div className="absolute top-4 left-4 z-20 pointer-events-auto max-w-[280px] space-y-3">
          <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3.5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D TWIN BASEMAP</span>
              </span>
              <button
                onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
                className="text-slate-400 hover:text-white"
              >
                {isControlsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!isControlsCollapsed && (
              <>
                {/* Basemap Styles */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Digital Twin Modes
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setMapViewMode('satellite_blueprint')}
                      className={`col-span-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                        mapViewMode === 'satellite_blueprint'
                          ? 'bg-gradient-to-r from-cyan-950/90 to-sky-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>🛰️ + 📐</span>
                      <span>SATELLITE + BLUEPRINT</span>
                    </button>

                    <button
                      onClick={() => setMapViewMode('satellite')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border flex items-center justify-center space-x-1 ${
                        mapViewMode === 'satellite'
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_10px_#06b6d4]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>🛰️</span>
                      <span>Satellite</span>
                    </button>

                    <button
                      onClick={() => setMapViewMode('blueprint')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border flex items-center justify-center space-x-1 ${
                        mapViewMode === 'blueprint'
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_10px_#06b6d4]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>📐</span>
                      <span>Blueprint</span>
                    </button>

                    <button
                      onClick={() => setMapViewMode('twin_3d')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border flex items-center justify-center space-x-1 ${
                        mapViewMode === 'twin_3d' || mapViewMode === 'dark'
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_10px_#06b6d4]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>🏢</span>
                      <span>3D Dark Model</span>
                    </button>

                    <button
                      onClick={() => setMapViewMode('street')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border flex items-center justify-center space-x-1 ${
                        mapViewMode === 'street'
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-[0_0_10px_#06b6d4]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>🗺️</span>
                      <span>Street</span>
                    </button>
                  </div>
                </div>

                {/* Opacity Sliders */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Satellite className="w-3 h-3 text-sky-400" />
                        <span>Satellite Opacity:</span>
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">{Math.round(satelliteOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={satelliteOpacity}
                      onChange={(e) => setSatelliteOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Grid className="w-3 h-3 text-cyan-400" />
                        <span>Blueprint Overlay:</span>
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">{Math.round(blueprintOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={blueprintOpacity}
                      onChange={(e) => setBlueprintOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Layer Checklist */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs text-slate-300">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    3D Digital Twin Features
                  </span>

                  {/* Floating Prediction Grid Toggle (Requirement 5) */}
                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1 rounded">
                    <span className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 shadow-[0_0_8px_#06b6d4]"></span>
                      <span className="font-bold text-cyan-300">Floating Prediction Grid</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showFloatingGrid}
                      onChange={(e) => setShowFloatingGrid(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </label>

                  {/* Floating Technical Callouts Toggle (Requirement 6) */}
                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1 rounded">
                    <span className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-[0_0_8px_#ef4444]"></span>
                      <span className="font-bold text-rose-300">Callout Annotations</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showCallouts}
                      onChange={(e) => setShowCallouts(e.target.checked)}
                      className="rounded border-slate-700 text-rose-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1 rounded">
                    <span className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-400"></span>
                      <span>3D Buildings (162)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showBuildings}
                      onChange={(e) => setShowBuildings(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1 rounded">
                    <span className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>
                      <span>Elevation Contours (DEM)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showContours}
                      onChange={(e) => setShowContours(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1 rounded">
                    <span className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span>
                      <span>Volumetric Flood Water</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showFloodWater}
                      onChange={(e) => setShowFloodWater(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1 rounded">
                    <span className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-purple-400"></span>
                      <span>Drainage &amp; Surcharge</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showDrainage}
                      onChange={(e) => setShowDrainage(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1 rounded">
                    <span className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                      <span>3D Safe Routes &amp; 🚑</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showRoutes}
                      onChange={(e) => setShowRoutes(e.target.checked)}
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </label>
                </div>

                {/* 6 Camera Presets (Requirement 11) */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>CAMERA PRESETS</span>
                    </span>
                    <button
                      onClick={() => setCameraPreset('isometric')}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                      title="Reset view"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <button
                      onClick={() => setCameraPreset('isometric')}
                      className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold"
                    >
                      RESET VIEW
                    </button>
                    <button
                      onClick={() => setCameraPreset('top')}
                      className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold"
                    >
                      TOP VIEW
                    </button>
                    <button
                      onClick={() => setCameraPreset('city')}
                      className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold"
                    >
                      CITY VIEW
                    </button>
                    <button
                      onClick={() => setCameraPreset('flood')}
                      className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-rose-300 font-semibold"
                    >
                      FLOOD VIEW
                    </button>
                    <button
                      onClick={() => setCameraPreset('underground')}
                      className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-purple-500/50 text-purple-300 font-semibold"
                    >
                      UNDERGROUND
                    </button>
                    <button
                      onClick={() => setCameraPreset('emergency')}
                      className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-emerald-300 font-semibold"
                    >
                      EMERGENCY
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* FLOATING SELECTED ENTITY INSPECTOR */}
        {selectedEntity && (
          <div className="absolute bottom-6 left-4 z-30 pointer-events-auto w-84 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.25)] space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold">
                  {selectedEntity.category}
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[150px]">
                  {selectedEntity.name || selectedEntity.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedEntity.category === 'TECHNICAL_CALLOUT' && (
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-cyan-300">{selectedEntity.subtitle}</div>
                <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  {selectedEntity.details}
                </p>
              </div>
            )}

            {selectedEntity.category === 'FLOATING_PREDICTION_GRID' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Level:</span>
                  <span className="font-mono text-rose-400 font-bold">{selectedEntity.risk_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Predicted Depth:</span>
                  <span className="font-mono text-cyan-400 font-bold">{selectedEntity.water_depth_cm} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DEM Ground Elevation:</span>
                  <span className="font-mono text-slate-300">{selectedEntity.elevation_m} m AMSL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedEntity.confidence_pct}%</span>
                </div>
                <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  {selectedEntity.details}
                </p>
              </div>
            )}

            {selectedEntity.category === 'BUILDING' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Building Type:</span>
                  <span className="font-semibold text-slate-200">{selectedEntity.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Extruded Height:</span>
                  <span className="font-mono text-cyan-400 font-bold">{selectedEntity.height_m} m ({selectedEntity.levels} fl)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ground Elevation:</span>
                  <span className="font-mono text-slate-300">{selectedEntity.elevation_m} m MSL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Inundation Risk:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedEntity.flood_risk === 'CRITICAL' ? 'bg-rose-500 text-white' :
                    (selectedEntity.flood_risk === 'HIGH' ? 'bg-orange-500 text-white' :
                    (selectedEntity.flood_risk === 'MODERATE' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'))
                  }`}>
                    {selectedEntity.flood_risk} ({selectedEntity.nearest_depth_cm || 0} cm)
                  </span>
                </div>
              </div>
            )}

            {selectedEntity.category === 'ROUTE' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Route Type:</span>
                  <span className="font-semibold text-sky-400 uppercase">{selectedEntity.route_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Distance:</span>
                  <span className="font-mono text-slate-200 font-bold">{selectedEntity.distance_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Travel Time:</span>
                  <span className="font-mono text-slate-200 font-bold">{selectedEntity.travel_time_min} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Water Depth:</span>
                  <span className="font-mono text-amber-400 font-bold">{selectedEntity.max_depth_cm} cm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Passability:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedEntity.passable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-600 text-white'
                  }`}>
                    {selectedEntity.passable ? 'PASSABLE' : 'IMPASSABLE / BLOCKED'}
                  </span>
                </div>
              </div>
            )}

            {selectedEntity.category === 'ROAD' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Classification:</span>
                  <span className="font-semibold text-sky-400">{selectedEntity.road_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Predicted Depth:</span>
                  <span className="font-mono text-amber-400 font-bold">{selectedEntity.predicted_depth_cm} cm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Traffic Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedEntity.travel_status === 'BLOCKED' ? 'bg-rose-600 text-white' :
                    (selectedEntity.travel_status === 'HIGH_RISK' ? 'bg-orange-500 text-white' : 'bg-emerald-500/20 text-emerald-400')
                  }`}>
                    {selectedEntity.travel_status}
                  </span>
                </div>
              </div>
            )}

            {selectedEntity.category === 'DRAINAGE_NODE' && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Node Type:</span>
                  <span className="font-semibold text-purple-400">{selectedEntity.node_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Inflow:</span>
                  <span className="font-mono text-cyan-400 font-bold">{selectedEntity.inflow} m³/s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Surcharge Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedEntity.is_surcharged ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {selectedEntity.is_surcharged ? 'SURCHARGED (BACKFLOW)' : 'NORMAL DRAINAGE'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP-BY-STEP DEMONSTRATION STORY GUIDE (Requirement 12) */}
        {showStoryGuide && (
          <div className="absolute bottom-6 right-4 z-30 pointer-events-auto max-w-sm w-full bg-slate-950/95 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_35px_rgba(0,0,0,0.8)] space-y-3 animate-in fade-in slide-in-from-right-3 duration-200">
            {/* Guide Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black tracking-wide text-white uppercase">
                  DEMONSTRATION STORY GUIDE
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                  {currentStep.step} / {DEMO_STEPS.length}
                </span>
                <button
                  onClick={() => setShowStoryGuide(false)}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Step Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>{currentStep.title}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {currentStep.subheading}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                {currentStep.explanation}
              </p>
            </div>

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => jumpToDemoStep(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border transition-all ${
                  currentStepIndex === 0
                    ? 'opacity-40 border-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>PREVIOUS</span>
              </button>

              <div className="flex space-x-1">
                {DEMO_STEPS.map((s, idx) => (
                  <button
                    key={s.step}
                    onClick={() => jumpToDemoStep(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'w-5 bg-cyan-400 shadow-[0_0_8px_#06b6d4]'
                        : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`Step ${s.step}: ${s.title}`}
                  />
                ))}
              </div>

              <button
                onClick={() => jumpToDemoStep(Math.min(DEMO_STEPS.length - 1, currentStepIndex + 1))}
                disabled={currentStepIndex === DEMO_STEPS.length - 1}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border transition-all ${
                  currentStepIndex === DEMO_STEPS.length - 1
                    ? 'opacity-40 border-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 to-sky-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:brightness-110'
                }`}
              >
                <span>NEXT STEP</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM FLOATING TECHNICAL METRICS */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden md:flex items-center space-x-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-1.5 text-xs shadow-2xl">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold">UFNS HYDRO ENGINE: ACTIVE</span>
          </div>
          <span className="text-slate-600">&bull;</span>
          <div className="text-slate-300">
            Peak Inundation: <span className="font-mono text-rose-400 font-bold">{prediction?.max_depth_cm || 52} cm</span>
          </div>
          <span className="text-slate-600">&bull;</span>
          <div className="text-slate-300">
            Affected Arterials: <span className="font-mono text-amber-400 font-bold">{prediction?.affected_roads_count || 4} Roads</span>
          </div>
          <span className="text-slate-600">&bull;</span>
          <div className="text-slate-300">
            Surcharged Inlets: <span className="font-mono text-purple-400 font-bold">{prediction?.critical_nodes_count || 3} Manholes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinPage;
