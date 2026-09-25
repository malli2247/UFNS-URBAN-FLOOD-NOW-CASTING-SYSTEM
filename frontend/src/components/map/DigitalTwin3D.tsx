import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useSimulation } from '../../context/SimulationContext';
import { DEFAULT_BUILDINGS_GEOJSON } from '../../data/buildingsData';
import { DEFAULT_TERRAIN_CONTOURS } from '../../data/terrainContours';
import {
  Layers,
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
  MapPin,
  HelpCircle,
  Mountain,
  Grid,
  Satellite
} from 'lucide-react';
import { BuildingFeature, RoadFeature, EmergencyFacility, DrainageNode, GridCell, MapViewMode } from '../../types';
import { DEMO_FLOOD_COLORS, ROUTE_PALETTE, DRAINAGE_PALETTE } from '../../config/floodColors';
import { STORY_STAGES } from '../../data/storyStepsData';
import { globalStoryCamera } from '../../utils/StoryCameraController';
import { Sparkles } from 'lucide-react';

interface DigitalTwin3DProps {
  compact?: boolean;
  isVisible?: boolean;
}

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

export const DigitalTwin3D: React.FC<DigitalTwin3DProps> = ({ compact = false, isVisible = true }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);
  const sensorMarkersRef = useRef<maplibregl.Marker[]>([]);
  const facilityMarkersRef = useRef<maplibregl.Marker[]>([]);

  // View & Camera Controls
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [activeCameraPreset, setActiveCameraPreset] = useState<'isometric' | 'top' | 'city' | 'emergency' | 'reset'>('isometric');
  const [isUndergroundView, setIsUndergroundView] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [activePanel, setActivePanel] = useState<'layers' | 'style' | 'opacity' | 'camera' | null>(null);

  // Layer Toggles
  const [showBuildings, setShowBuildings] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showFloodWater, setShowFloodWater] = useState(true);
  const [showDrainage, setShowDrainage] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);

  const {
    prediction,
    drainageNetwork,
    roads,
    facilities,
    buildings,
    sensors,
    activeHorizon,
    dataMode,
    activeRoute,
    isRunningScenario,
    runFloodScenario,
    stopScenario,
    twinMode,
    setTwinMode,
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
    floodOpacity,
    setFloodOpacity,
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
    cityWaterBodies
  } = useSimulation();

  // Focus 3D camera on target when focusTarget changes in Story Mode
  useEffect(() => {
    if (focusTarget && mapRef.current) {
      mapRef.current.flyTo({
        center: focusTarget.center,
        zoom: focusTarget.zoom,
        pitch: focusTarget.pitch ?? 50,
        bearing: focusTarget.bearing ?? -20,
        duration: 1200
      });
    }
  }, [focusTarget]);

  // Fly to new city center when selectedCity changes (and not in story mode)
  useEffect(() => {
    if (mapRef.current && isMapLoaded && selectedCityConfig?.center && !isStoryMode) {
      const c = selectedCityConfig.center;
      mapRef.current.flyTo({
        center: [c.longitude, c.latitude],
        zoom: 13.5,
        pitch: 50,
        bearing: -22,
        duration: 1200
      });
    }
  }, [selectedCity, isMapLoaded]);

  // Active Water Bodies dataset: city config or default
  const activeWaterBodiesGeoJSON = useMemo(() => {
    if (cityWaterBodies && cityWaterBodies.features && cityWaterBodies.features.length > 0) {
      return cityWaterBodies;
    }
    return WATER_BODIES_GEOJSON;
  }, [cityWaterBodies]);

  // Active Buildings dataset: backend or robust local baseline
  const activeBuildingsGeoJSON = useMemo(() => {
    if (buildings && buildings.features && buildings.features.length > 0) {
      return buildings;
    }
    return DEFAULT_BUILDINGS_GEOJSON;
  }, [buildings]);

  // Generate glowing wireframe perimeter line geometry from extruded buildings
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

  // Active Topographic Contours (Backend DEM matrix or deterministic baseline)
  const activeContoursGeoJSON = useMemo(() => {
    if (contours && contours.features && contours.features.length > 0) {
      return contours;
    }
    return DEFAULT_TERRAIN_CONTOURS;
  }, [contours]);

  // Convert prediction grid to 3D Extruded Flood Polygons GeoJSON
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

  // Active Routes GeoJSON
  const routesGeoJSON = useMemo(() => {
    if (!activeRoute?.routes || activeRoute.routes.length === 0) return { type: 'FeatureCollection', features: [] };
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
  }, [activeRoute]);

  // Invalidate / Resize map when visibility changes
  useEffect(() => {
    if (isVisible && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.resize();
      }, 100);
    }
  }, [isVisible]);

  // Initialize MapLibre GL 3D Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

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
              attribution: 'Esri World Imagery (Zero API Key)'
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
                'raster-opacity': 0.70,
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
        center: [mapCenter[0], mapCenter[1]],
        zoom: mapZoom,
        pitch: 50,
        bearing: -22,
        maxPitch: 85
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

      map.on('load', () => {
        mapRef.current = map;
        setIsMapLoaded(true);
        globalStoryCamera.setMaplibreMap(map);

        map.on('moveend', () => {
          const c = map.getCenter();
          const z = map.getZoom();
          setMapCenter([c.lng, c.lat]);
          setMapZoom(Math.round(z * 10) / 10);
        });

        map.setLight({
          anchor: 'viewport',
          color: '#ffffff',
          intensity: 0.55,
          position: [1.5, 90, 45]
        });

        // 1. Water Bodies Layer
        map.addSource('water-bodies-src', {
          type: 'geojson',
          data: activeWaterBodiesGeoJSON as any
        });
        map.addLayer({
          id: 'water-bodies-fill',
          type: 'fill',
          source: 'water-bodies-src',
          paint: {
            'fill-color': '#071f38',
            'fill-opacity': 0.85
          }
        });
        map.addLayer({
          id: 'water-bodies-line',
          type: 'line',
          source: 'water-bodies-src',
          paint: {
            'line-color': '#00f0ff',
            'line-width': 2.2,
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
            'line-color': '#cbd5e1',
            'line-width': 2.0,
            'line-opacity': 0.85
          }
        });
        map.addLayer({
          id: 'contours-minor-line',
          type: 'line',
          source: 'contours-src',
          filter: ['==', ['get', 'type'], 'INTERMEDIATE'],
          paint: {
            'line-color': '#94a3b8',
            'line-width': 1.0,
            'line-dasharray': [2, 2],
            'line-opacity': 0.50
          }
        });

        // 3. 3D Volumetric Flood Water
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
            'line-width': 6.0,
            'line-blur': 4.0,
            'line-opacity': 0.65
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
              ['==', ['get', 'road_type'], 'ELEVATED_BYPASS'], 4.5,
              ['==', ['get', 'road_type'], 'PRIMARY'], 3.8,
              ['==', ['get', 'road_type'], 'SECONDARY'], 2.8,
              1.8
            ],
            'line-opacity': 0.95
          }
        });

        // 5. 3D Architectural Buildings
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
              ['==', ['get', 'type'], 'HOSPITAL'], '#1a365d',
              ['==', ['get', 'type'], 'TECH_PARK'], '#0f2b48',
              ['==', ['get', 'type'], 'COMMERCIAL'], '#0c2238',
              ['==', ['get', 'type'], 'CIVIC'], '#162e4a',
              '#0a1c2e'
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

        // 7. Underground Drainage Network
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

        // 8. Drainage Nodes
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
              ['==', ['get', 'is_surcharged'], true], 8.0,
              5.0
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'is_surcharged'], true], '#ef4444',
              '#ffffff'
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

        // Click event listeners
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
              data_source: props.data_source || `${selectedCityConfig?.city?.toUpperCase() || 'METROPOLITAN'} URBAN GIS BASELINE`,
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

        map.on('click', 'flood-water-3d', (e) => {
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            setSelectedEntity({
              category: 'FLOOD_CELL',
              id: props.id,
              water_depth_cm: props.water_depth_cm,
              elevation_m: props.elevation_m,
              risk_level: props.risk_level,
              slope_deg: props.slope_deg,
              surcharge_cm: props.surcharge_cm,
              confidence_pct: props.confidence_pct
            });
          }
        });

        const interactiveLayers = ['buildings-3d', 'roads-line', 'drainage-nodes-circle', 'flood-water-3d'];
        interactiveLayers.forEach(l => {
          map.on('mouseenter', l, () => (map.getCanvas().style.cursor = 'pointer'));
          map.on('mouseleave', l, () => (map.getCanvas().style.cursor = ''));
        });
      });
    } catch (err) {
      console.error('Failed to initialize MapLibre GL 3D Map:', err);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (vehicleMarkerRef.current) vehicleMarkerRef.current.remove();
      sensorMarkersRef.current.forEach(m => m.remove());
      facilityMarkersRef.current.forEach(m => m.remove());
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update dynamic GeoJSON data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !isMapLoaded) return;

    const waterSrc = map.getSource('water-bodies-src') as maplibregl.GeoJSONSource;
    if (waterSrc) waterSrc.setData(activeWaterBodiesGeoJSON as any);

    const floodSrc = map.getSource('flood-grid-src') as maplibregl.GeoJSONSource;
    if (floodSrc) floodSrc.setData(floodGridGeoJSON as any);

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
  }, [isMapLoaded, activeWaterBodiesGeoJSON, floodGridGeoJSON, roadsGeoJSON, activeBuildingsGeoJSON, buildingWireframesGeoJSON, activeContoursGeoJSON, drainagePipesGeoJSON, drainageNodesGeoJSON, routesGeoJSON]);

  // Master Basemap, Opacity & Technical Styling Controller
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !isMapLoaded) return;

    const currentStoryStage = isStoryMode ? STORY_STAGES.find(s => s.id === storyStep) : null;
    const effShowBuildings = isStoryMode ? (currentStoryStage?.visibleLayers.buildings ?? true) : showBuildings;
    const effShowFloodWater = isStoryMode ? (currentStoryStage?.visibleLayers.floodGrid ?? false) : showFloodWater;
    const effShowDrainage = isStoryMode ? (currentStoryStage?.visibleLayers.drainage ?? false) : showDrainage;
    const effShowRoads = isStoryMode ? (currentStoryStage?.visibleLayers.roads ?? true) : showRoads;
    const effShowRoutes = isStoryMode ? (currentStoryStage?.visibleLayers.routes ?? false) : showRoutes;

    // 1. Satellite Raster Layer Opacity
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

    // 3. Extruded 3D Buildings Appearance & Opacity
    if (map.getLayer('buildings-3d')) {
      map.setLayoutProperty('buildings-3d', 'visibility', effShowBuildings ? 'visible' : 'none');

      if (isUndergroundView || (isStoryMode && currentStoryStage?.cutawayActive)) {
        map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity', 0.08);
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

    // 4. Glowing Neon Cyan Building Wireframes
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

    // 6. Volumetric Flood Water
    if (map.getLayer('flood-water-3d')) {
      map.setLayoutProperty('flood-water-3d', 'visibility', effShowFloodWater ? 'visible' : 'none');
      map.setPaintProperty('flood-water-3d', 'fill-extrusion-opacity', isUndergroundView ? 0.20 : floodOpacity);
    }

    // 7. Roads
    if (map.getLayer('roads-line')) {
      map.setLayoutProperty('roads-line', 'visibility', effShowRoads ? 'visible' : 'none');
      map.setLayoutProperty('roads-glow', 'visibility', effShowRoads ? 'visible' : 'none');
    }

    // 8. Underground Drainage Network
    if (map.getLayer('drainage-pipes-line')) {
      map.setLayoutProperty('drainage-pipes-line', 'visibility', effShowDrainage ? 'visible' : 'none');
      map.setLayoutProperty('drainage-pipes-glow', 'visibility', effShowDrainage ? 'visible' : 'none');
      map.setLayoutProperty('drainage-nodes-circle', 'visibility', effShowDrainage ? 'visible' : 'none');

      map.setPaintProperty('drainage-pipes-line', 'line-width', isUndergroundView ? 4.5 : 2.6);
      map.setPaintProperty('drainage-pipes-glow', 'line-width', isUndergroundView ? 8.5 : 5.0);
    }

    // 9. Routes
    if (map.getLayer('routes-line')) {
      map.setLayoutProperty('routes-line', 'visibility', effShowRoutes ? 'visible' : 'none');
      map.setLayoutProperty('routes-glow', 'visibility', effShowRoutes ? 'visible' : 'none');
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
    showRoads,
    showDrainage,
    showRoutes,
    isUndergroundView,
    floodOpacity,
    isStoryMode,
    storyStep
  ]);

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
          location: s.location || `${selectedCityConfig?.city || 'Basin'} Ingress`
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

  // Animated 3D Emergency Vehicle Simulation along selected route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || !activeRoute?.routes || activeRoute.routes.length === 0) {
      if (vehicleMarkerRef.current) vehicleMarkerRef.current.remove();
      return;
    }

    const selectedRouteObj = activeRoute.routes.find(r => r.route_type === activeRoute.selected_route) || activeRoute.routes[0];
    const coords = selectedRouteObj.coordinates;
    if (!coords || coords.length < 2) return;

    if (!vehicleMarkerRef.current) {
      const vEl = document.createElement('div');
      vEl.className = 'emergency-vehicle-marker flex items-center justify-center';
      vEl.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-rose-500/40 animate-ping"></div>
          <div class="w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-[0_0_14px_#f43f5e] flex items-center justify-center text-xs font-bold">
            🚑
          </div>
        </div>
      `;
      vehicleMarkerRef.current = new maplibregl.Marker({ element: vEl, anchor: 'center' })
        .setLngLat([coords[0][1], coords[0][0]])
        .addTo(map);
    }

    let progress = 0;
    const speed = 0.0035;

    const animate = () => {
      progress += speed;
      if (progress > 1.0) progress = 0;

      const totalSegments = coords.length - 1;
      const globalPos = progress * totalSegments;
      const segIndex = Math.min(Math.floor(globalPos), totalSegments - 1);
      const segFraction = globalPos - segIndex;

      const p0 = coords[segIndex];
      const p1 = coords[segIndex + 1];

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

  // Camera Presets
  const setCameraPreset = (preset: 'isometric' | 'top' | 'city' | 'emergency' | 'reset') => {
    setActiveCameraPreset(preset);
    const map = mapRef.current;
    if (!map) return;
    const cLon = mapCenter ? mapCenter[0] : (selectedCityConfig?.center?.longitude || 77.640);
    const cLat = mapCenter ? mapCenter[1] : (selectedCityConfig?.center?.latitude || 12.937);

    if (preset === 'isometric') {
      map.flyTo({ center: [cLon, cLat], zoom: 13.6, pitch: 60, bearing: -22, duration: 1200 });
      setIsUndergroundView(false);
    } else if (preset === 'top') {
      map.flyTo({ center: [cLon, cLat], zoom: 13.2, pitch: 0, bearing: 0, duration: 1200 });
      setIsUndergroundView(false);
    } else if (preset === 'city') {
      map.flyTo({ center: [cLon - 0.008, cLat + 0.001], zoom: 15.6, pitch: 74, bearing: 35, duration: 1400 });
      setIsUndergroundView(false);
    } else if (preset === 'emergency') {
      map.flyTo({ center: [cLon + 0.025, cLat - 0.005], zoom: 14.4, pitch: 65, bearing: -45, duration: 1400 });
      setIsUndergroundView(false);
    } else if (preset === 'reset') {
      map.flyTo({ center: [cLon, cLat], zoom: 13.6, pitch: 60, bearing: -22, duration: 1200 });
      setIsUndergroundView(false);
    }
  };

  const toggleUnderground = () => {
    const next = !isUndergroundView;
    setIsUndergroundView(next);
    const map = mapRef.current;
    if (!map) return;

    if (next) {
      map.flyTo({ pitch: 48, bearing: -15, duration: 1000 });
    }
  };

  return (
    <div className={`relative w-full ${compact ? 'h-[500px]' : 'h-full'} bg-[#030712] rounded-2xl overflow-hidden shadow-2xl border border-slate-800`}>
      {/* 3D WebGL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Master Navigation Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        {/* Left: Mode Switcher (2D GIS <-> 3D DIGITAL TWIN) & Domain Status */}
        <div className="pointer-events-auto flex items-center space-x-3">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl flex items-center space-x-1">
            <button
              onClick={() => setTwinMode('2d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                twinMode === '2d' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>2D GIS</span>
            </button>
            <button
              onClick={() => setTwinMode('3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                twinMode === '3d' ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_15px_#06b6d4]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
              <span>3D DIGITAL TWIN</span>
            </button>
          </div>

          {/* Domain & Telemetry Badge */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">{selectedCityConfig?.city || 'Metropolitan'} Digital Twin</span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-cyan-400 font-mono font-bold">{(buildings?.features?.length || 36)} Extruded Buildings</span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-purple-400 font-mono font-bold">DEM {selectedCityConfig?.dem?.min_elevation_m || 875}–{selectedCityConfig?.dem?.max_elevation_m || 915}m AMSL</span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-amber-400 font-mono font-bold">{dataMode}</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={toggleUnderground}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold shadow-xl transition-all flex items-center space-x-2 ${
              isUndergroundView
                ? 'bg-purple-600/90 border-purple-400 text-white shadow-[0_0_20px_#a855f7]'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white hover:border-purple-500/50'
            }`}
          >
            <GitFork className="w-4 h-4 text-purple-300" />
            <span>{isUndergroundView ? 'SURFACE VIEW' : 'UNDERGROUND CUTAWAY'}</span>
          </button>

          <button
            onClick={isRunningScenario ? stopScenario : runFloodScenario}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold shadow-xl transition-all flex items-center space-x-2 ${
              isRunningScenario
                ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                : 'bg-slate-900/90 border-slate-700/80 text-sky-400 hover:text-sky-300 hover:border-sky-500/50'
            }`}
          >
            {isRunningScenario ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-sky-400" />}
            <span>{isRunningScenario ? 'PAUSE SCENARIO' : 'RUN FLOOD SCENARIO'}</span>
          </button>
        </div>
      </div>

      {/* Compact Floating HUD Toolbar & Popovers */}
      <div className="absolute top-20 left-4 z-20 pointer-events-auto space-y-2">
        {/* Horizontal Mini Toolbar */}
        <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-800 shadow-2xl">
          {/* Story Mode Toggle Pill */}
          <button
            onClick={() => isStoryMode ? stopStoryMode() : startStoryMode()}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 border shadow-sm ${
              isStoryMode
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                : 'bg-gradient-to-r from-sky-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
            }`}
            title="Launch Guided Demonstration Story Mode"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current text-cyan-400" />
            <span>{isStoryMode ? 'EXIT STORY' : 'DEMO STORY'}</span>
          </button>
          <button
            onClick={() => setActivePanel(activePanel === 'layers' ? null : 'layers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
              activePanel === 'layers'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>LAYERS</span>
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'style' ? null : 'style')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
              activePanel === 'style'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>MAP STYLE</span>
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'opacity' ? null : 'opacity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
              activePanel === 'opacity'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-slate-900'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-sky-400" />
            <span>FLOOD: {Math.round(floodOpacity * 100)}%</span>
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'camera' ? null : 'camera')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
              activePanel === 'camera'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                : 'text-slate-300 hover:text-white border-transparent hover:bg-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>CAMERA</span>
          </button>

          <button
            onClick={() => setCameraPreset('reset')}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all border border-transparent"
            title="Recenter Camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Popover: Layers Checklist */}
        {activePanel === 'layers' && (
          <div className="w-72 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3.5 space-y-2 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>3D Physical Layers</span>
              </span>
              <button onClick={() => setActivePanel(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-slate-300">
              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1.5 rounded">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
                  <span>3D Buildings (162)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showBuildings}
                  onChange={(e) => setShowBuildings(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1.5 rounded">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                  <span>Road Network</span>
                </span>
                <input
                  type="checkbox"
                  checked={showRoads}
                  onChange={(e) => setShowRoads(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1.5 rounded">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                  <span>3D Volumetric Water</span>
                </span>
                <input
                  type="checkbox"
                  checked={showFloodWater}
                  onChange={(e) => setShowFloodWater(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1.5 rounded">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-400" />
                  <span>Drainage &amp; Surcharge</span>
                </span>
                <input
                  type="checkbox"
                  checked={showDrainage}
                  onChange={(e) => setShowDrainage(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1.5 rounded">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  <span>Dispatch Routes</span>
                </span>
                <input
                  type="checkbox"
                  checked={showRoutes}
                  onChange={(e) => setShowRoutes(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1.5 rounded">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                  <span>IoT Sensors</span>
                </span>
                <input
                  type="checkbox"
                  checked={showSensors}
                  onChange={(e) => setShowSensors(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1.5 rounded">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-white" />
                  <span>Emergency Facilities</span>
                </span>
                <input
                  type="checkbox"
                  checked={showFacilities}
                  onChange={(e) => setShowFacilities(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
              </label>
            </div>
          </div>
        )}

        {/* Popover: Map Style & Technical Overlays */}
        {activePanel === 'style' && (
          <div className="w-72 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3.5 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 flex items-center space-x-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>3D Basemap &amp; Styling</span>
              </span>
              <button onClick={() => setActivePanel(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setMapViewMode('satellite_blueprint')}
                className={`col-span-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border flex items-center justify-center space-x-1.5 ${
                  mapViewMode === 'satellite_blueprint'
                    ? 'bg-gradient-to-r from-cyan-950/90 to-sky-950/90 border-cyan-400 text-cyan-300 shadow-sm'
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
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>🛰️ Satellite</span>
              </button>

              <button
                onClick={() => setMapViewMode('blueprint')}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border flex items-center justify-center space-x-1 ${
                  mapViewMode === 'blueprint'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>📐 Blueprint</span>
              </button>

              <button
                onClick={() => setMapViewMode('twin_3d')}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border flex items-center justify-center space-x-1 ${
                  mapViewMode === 'twin_3d' || mapViewMode === 'dark'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>🏢 3D Model</span>
              </button>

              <button
                onClick={() => setMapViewMode('street')}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border flex items-center justify-center space-x-1 ${
                  mapViewMode === 'street'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>🗺️ Street</span>
              </button>
            </div>

            {/* Continuous Opacity Sliders */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Satellite Opacity:</span>
                  <span className="font-mono text-cyan-400 font-bold">{Math.round(satelliteOpacity * 100)}%</span>
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

              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Blueprint Overlay:</span>
                  <span className="font-mono text-cyan-400 font-bold">{Math.round(blueprintOpacity * 100)}%</span>
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

            {/* Technical Feature Toggles */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1 rounded">
                <span className="flex items-center space-x-1.5">
                  <Grid className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-cyan-300">Wireframe Outlines</span>
                </span>
                <input
                  type="checkbox"
                  checked={showWireframe}
                  onChange={(e) => setShowWireframe(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:bg-slate-900/60 p-1 rounded">
                <span className="flex items-center space-x-1.5">
                  <Mountain className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-emerald-300">Elevation Contours</span>
                </span>
                <input
                  type="checkbox"
                  checked={showContours}
                  onChange={(e) => setShowContours(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500"
                />
              </label>
            </div>
          </div>
        )}

        {/* Popover: Flood Opacity Slider */}
        {activePanel === 'opacity' && (
          <div className="w-72 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3.5 space-y-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 flex items-center space-x-1.5">
                <Waves className="w-4 h-4 text-sky-400" />
                <span>3D Flood Water Opacity</span>
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

        {/* Popover: Camera Presets */}
        {activePanel === 'camera' && (
          <div className="w-64 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3.5 space-y-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Camera Presets</span>
              </span>
              <button onClick={() => setActivePanel(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setCameraPreset('isometric')}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                  activeCameraPreset === 'isometric'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                Isometric 50°
              </button>
              <button
                onClick={() => setCameraPreset('top')}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                  activeCameraPreset === 'top'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                Plan 0°
              </button>
              <button
                onClick={() => setCameraPreset('city')}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                  activeCameraPreset === 'city'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                Street 74°
              </button>
              <button
                onClick={() => setCameraPreset('emergency')}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                  activeCameraPreset === 'emergency'
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                Emergency Hub
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Selected Entity Inspector Card */}
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
              <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                <span className="text-slate-400">Height Provenance:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  selectedEntity.height_provenance === 'REAL'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                }`}>
                  {selectedEntity.height_provenance === 'REAL' ? 'REAL (BBMP GIS / OSM)' : 'SIMULATED (LOD-2)'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Data Source:</span>
                <span className="text-slate-300 font-mono truncate max-w-[170px]">{selectedEntity.data_source}</span>
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
              <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                {selectedEntity.why_prediction}
              </p>
            </div>
          )}

          {selectedEntity.category === 'DRAINAGE_NODE' && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Node Type:</span>
                <span className="font-semibold text-purple-400">{selectedEntity.node_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Design Capacity:</span>
                <span className="font-mono text-slate-300">{selectedEntity.capacity} m³/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Inflow:</span>
                <span className="font-mono text-cyan-400 font-bold">{selectedEntity.inflow} m³/s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Surcharge State:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedEntity.is_surcharged ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {selectedEntity.is_surcharged ? 'SURCHARGED (BACKFLOW)' : 'NORMAL DRAINAGE'}
                </span>
              </div>
              {selectedEntity.is_surcharged && (
                <div className="text-[11px] text-rose-300 bg-rose-950/60 border border-rose-800 p-2 rounded-lg">
                  ⚠️ Hydraulic head exceeds surface grade. Water backing up onto road (+{selectedEntity.spill_depth_cm} cm).
                </div>
              )}
            </div>
          )}

          {selectedEntity.category === 'FLOOD_CELL' && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Water Depth:</span>
                <span className="font-mono text-cyan-400 font-black text-sm">{selectedEntity.water_depth_cm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DEM Elevation:</span>
                <span className="font-mono text-slate-300">{selectedEntity.elevation_m} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Terrain Slope:</span>
                <span className="font-mono text-slate-300">{selectedEntity.slope_deg}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedEntity.confidence_pct}%</span>
              </div>
            </div>
          )}

          {selectedEntity.category === 'FACILITY' && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Facility Type:</span>
                <span className="font-semibold text-slate-200">{selectedEntity.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Access Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {selectedEntity.access_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emergency Phone:</span>
                <span className="font-mono text-cyan-400">{selectedEntity.contact}</span>
              </div>
            </div>
          )}

          {selectedEntity.category === 'SENSOR' && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Observed Water Depth:</span>
                <span className="font-mono text-cyan-400 font-bold">{selectedEntity.water_depth_cm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Battery Level:</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedEntity.battery_pct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Operating Status:</span>
                <span className="font-mono text-sky-300 font-bold">{selectedEntity.status}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom-Right 3D Legend & Technical Contour Key */}
      <div className="absolute bottom-6 right-4 z-20 pointer-events-auto space-y-2">
        {showContours && (mapViewMode === 'satellite_blueprint' || mapViewMode === 'blueprint' || mapViewMode === 'twin_3d' || mapViewMode === 'dark') && (
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 shadow-2xl text-xs space-y-1.5 min-w-[210px]">
            <div className="font-bold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <Mountain className="w-3.5 h-3.5" />
                <span>DEM TOPOGRAPHY</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">875–915m AMSL</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-slate-300"></span>
                <span className="text-slate-300">875m (Basin)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-slate-400"></span>
                <span className="text-slate-300">885m (Mid-low)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-slate-400"></span>
                <span className="text-slate-300">895m (Mid-slope)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-slate-300"></span>
                <span className="text-slate-300">915m (West Ridge)</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl text-xs space-y-2 min-w-[210px]">
          <div className="font-bold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span>3D INUNDATION DEPTH</span>
            <span className="text-cyan-400 font-mono text-[11px]">+{activeHorizon}</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-[#38bdf8]"></span>
              <span className="text-slate-300">0 – 5 cm (Shallow)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-[#2563eb]"></span>
              <span className="text-slate-300">5 – 15 cm (Moderate)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-[#f59e0b]"></span>
              <span className="text-slate-300">15 – 30 cm (Hazard)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-[#f97316]"></span>
              <span className="text-slate-300">30 – 50 cm (Blocked)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-[#ef4444] animate-pulse"></span>
              <span className="text-slate-300">&gt; 50 cm (Critical)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
