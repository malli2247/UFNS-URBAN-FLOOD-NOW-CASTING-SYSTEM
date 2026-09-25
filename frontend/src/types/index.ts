// UFNS Core TypeScript Definitions

export interface DataStatus {
  data_mode: 'DEMO SIMULATION' | 'HISTORICAL REPLAY' | 'LIVE DATA';
  rainfall_source: string;
  radar_status: 'LIVE' | 'HISTORICAL' | 'SIMULATED' | 'UNAVAILABLE';
  dem_source: 'REAL' | 'SIMULATED';
  road_network_source: string;
  drainage_mode: string;
  sensor_count: number;
  observation_count: number;
  active_event_name: string;
  system_status: string;
}

export interface GridCell {
  cell_id: string;
  row: number;
  col: number;
  lat: number;
  lon: number;
  elevation_m: number;
  slope_deg: number;
  imperviousness: number;
  rainfall_rate_mm_hr: number;
  water_depth_cm: number;
  risk_level: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  flow_direction_deg: number;
  flow_direction_compass?: string;
  flow_vx?: number;
  flow_vy?: number;
  drainage_surcharge_cm: number;
  confidence_pct: number;
  why_prediction?: string;
}

export interface RoadFeature {
  road_id: string;
  name: string;
  road_type: 'PRIMARY' | 'SECONDARY' | 'LOCAL' | 'ELEVATED_BYPASS';
  length_km: number;
  speed_kmh: number;
  from_intersection: { id: string; name: string; lat: number; lon: number };
  to_intersection: { id: string; name: string; lat: number; lon: number };
  coordinates: [number, number][];
  predicted_depth_cm: number;
  travel_status: 'OPEN' | 'CAUTION' | 'HIGH_RISK' | 'BLOCKED';
  risk_level: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  passable_vehicles: string[];
  alternative_route?: string | null;
  why_prediction: string;
}

export interface EmergencyFacility {
  id: string;
  name: string;
  facility_type: 'Hospital' | 'Shelter' | 'Fire Station' | 'Police Station';
  lat: number;
  lon: number;
  capacity_desc: string;
  contact: string;
  elevation_m: number;
  nearest_access_road: string;
  current_depth_cm: number;
  flood_risk: 'LOW' | 'MODERATE' | 'HIGH';
  access_status: 'ACCESSIBLE' | 'CAUTION' | 'ACCESS_RESTRICTED';
  why_status: string;
}

export interface StormCell {
  cell_id: string;
  name: string;
  lat: number;
  lon: number;
  radius_m: number;
  reflectivity_dbz: number;
  rainfall_equivalent_mm_hr: number;
  movement_vector: { dx_km_hr: number; dy_km_hr: number; direction: string };
  speed_kmh: number;
  data_label: string;
}

export interface RadarStation {
  station_id: string;
  name: string;
  operator: string;
  lat: number;
  lon: number;
  elevation_m: number;
  coverage_radius_m: number;
  resolution: string;
  frequency: string;
  sweep_strategy: string;
  data_age: string;
  status: string;
}

export interface RadarOverlayData {
  radar_station: RadarStation;
  storm_cells: StormCell[];
  active_horizon: string;
  horizon_mins: number;
  data_mode: string;
  provenance: string;
}

export interface FloodRiskZone {
  zone_id: string;
  name: string;
  risk_level: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  color: string;
  fill_opacity: number;
  mean_depth_cm: number;
  cell_count: number;
  area_km2: number;
  elevation_range: string;
  recommended_action: string;
  polygon_coordinates: [number, number][];
}

export interface FloodPrediction {
  timestamp: string;
  horizon: string;
  data_source: string;
  model_used: string;
  validation_status: string;
  overall_confidence_pct: number;
  confidence_factors: Record<string, string>;
  grid: GridCell[];
  max_depth_cm: number;
  mean_depth_cm: number;
  affected_roads_count: number;
  critical_nodes_count: number;
  bounds?: {
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
  };
}

export interface RainfallForecastHorizon {
  horizon: string;
  rainfall_rate_mm_hr: number;
  cumulative_mm: number;
  radar_reflectivity_dbz: number;
}

export interface RainfallForecast {
  model_name: string;
  data_source: string;
  forecasts: RainfallForecastHorizon[];
}

export interface DrainageNode {
  node_id: string;
  name: string;
  node_type?: string;
  lat: number;
  lon: number;
  elevation_m: number;
  inlet_capacity_m3_s: number;
  current_inflow_m3_s: number;
  is_surcharged: boolean;
  surcharge_volume_m3: number;
  spill_depth_cm: number;
}

export interface DrainageEdge {
  edge_id: string;
  from_node: string;
  to_node: string;
  diameter_m: number;
  slope: number;
  capacity_m3_s: number;
  flow_m3_s: number;
  utilization_pct: number;
  status: 'NORMAL' | 'WARNING' | 'SURCHARGED';
}

export interface DrainageNetwork {
  mode: string;
  nodes: DrainageNode[];
  edges: DrainageEdge[];
  total_surcharged_nodes: number;
  disclaimer: string;
}

export interface RouteRoadSegment {
  road_id: string;
  road_name: string;
  from_node: string;
  to_node: string;
  length_km: number;
  predicted_depth_cm: number;
  speed_kmh: number;
  travel_time_min: number;
  risk_level: string;
  status: string;
}

export interface AvoidedEdge {
  road_id: string;
  road_name: string;
  length_km: number;
  predicted_depth_cm: number;
  clearance_cm: number;
  status: string;
  reason: string;
  coordinates: [number, number][];
}

export interface RouteAlternative {
  route_type: 'shortest' | 'fastest' | 'safest' | 'emergency';
  title?: string;
  duration_min?: number;
  travel_time_min?: number;
  distance_km: number;
  max_depth_cm?: number;
  maximum_water_depth_cm?: number;
  average_flood_depth_cm?: number;
  flood_exposure_km?: number;
  risk_level: string;
  risk_score?: number;
  passable: boolean;
  warning?: string | null;
  coordinates: [number, number][];
  geometry?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  roads?: RouteRoadSegment[];
  blocked_edges_encountered?: { road_id: string; road_name: string; depth_cm: number }[];
  avoided_roads?: { road_id: string; road_name: string; reason: string }[];
}

export interface SafeRouteResult {
  origin?: { lat: number; lon: number; name: string; node_id?: string };
  destination?: { lat: number; lon: number; name: string; node_id?: string };
  vehicle_type: string;
  vehicle_clearance_cm: number;
  shortest?: RouteAlternative;
  fastest?: RouteAlternative;
  safest?: RouteAlternative;
  emergency?: RouteAlternative;
  routes: RouteAlternative[];
  selected_route?: string;
  recommended_route?: string;
  recommendation_reason?: string;
  avoided_edges?: AvoidedEdge[];
  disclaimer: string;
}

export interface ObservationPoint {
  id: string;
  type: string;
  lat: number;
  lon: number;
  observed_depth_cm: number;
  predicted_depth_cm: number;
  error_cm: number;
  timestamp: string;
  source: string;
  quality_score: number;
  status: string;
}

export interface ErrorMapData {
  observations: ObservationPoint[];
  mae_cm: number;
  rmse_cm: number;
  mean_bias_cm: number;
  r2_score: number;
  validation_status: string;
  note: string;
}

export interface AlertItem {
  alert_id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  location: string;
  timestamp: string;
  acknowledged: boolean;
  coordinates?: [number, number];
}

export interface ModelMetrics {
  model_name: string;
  version: string;
  task_type: string;
  baseline_name: string;
  baseline_mae_cm: number;
  ml_mae_cm: number;
  baseline_rmse_cm: number;
  ml_rmse_cm: number;
  r2_score: number;
  f1_score: number;
  precision: number;
  recall: number;
  horizon_metrics: Record<string, { mae_cm: number; rmse_cm: number; f1: number }>;
  spatial_resolution_m: number;
  status: string;
  training_period: string;
  validation_period: string;
  test_period: string;
}

export interface HistoricalEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  peak_rainfall_mm_hr: number;
  observation_count: number;
  timeline_steps: number;
}

export interface BuildingProperties {
  id: string;
  name: string;
  type: string;
  height_m: number;
  levels: number;
  lon: number;
  lat: number;
  area_m2: number;
  data_source: string;
  elevation_m: number;
  flood_risk: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  nearest_flood_depth_cm: number;
  height_provenance?: 'REAL' | 'SIMULATED';
}

export interface BuildingFeature {
  type: 'Feature';
  properties: BuildingProperties;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface BuildingsGeoJSON {
  type: 'FeatureCollection';
  features: BuildingFeature[];
  metadata?: {
    total_buildings: number;
    data_source: string;
    domain: string;
    active_horizon: string;
  };
}

export type MapViewMode = 'satellite_blueprint' | 'satellite' | 'blueprint' | 'dark' | 'twin_3d' | 'street';

export interface TerrainContourProperties {
  elevation_m: number;
  label: string;
  type: 'INDEX' | 'INTERMEDIATE';
  color?: string;
}

export interface TerrainContourFeature {
  type: 'Feature';
  properties: TerrainContourProperties;
  geometry: {
    type: 'MultiLineString' | 'LineString';
    coordinates: number[][][] | number[][];
  };
}

export interface TerrainContoursGeoJSON {
  type: 'FeatureCollection';
  features: TerrainContourFeature[];
  metadata?: {
    source?: string;
    count?: number;
    interval_m?: number;
    [key: string]: any;
  };
}

export type StoryMilestone =
  | '01 CITY'
  | '02 RAIN'
  | '03 ALTITUDE'
  | '04 RUNOFF'
  | '05 FLOOD'
  | '06 DRAINAGE'
  | '07 SURCHARGE'
  | '08 ROADS'
  | '09 ROUTE'
  | '10 SOLUTION';

export interface StoryStageConfig {
  id: number;
  stageNumber: number;
  milestone: StoryMilestone;
  progressMilestone: 'Rainfall' | 'Altitude' | 'Runoff' | 'Flood' | 'Drainage' | 'Roads' | 'Emergency' | 'Solution';
  title: string;
  subtitle: string;
  badge: string;
  narration: string;
  problem: string;
  effect: string;
  evidence: string;
  action: string;
  presenterNotes: string;
  durationSeconds: number; // Base duration in seconds for auto-play
  singleLabel?: string;
  semanticColor: string;
  spotlightTarget?: {
    center: [number, number]; // [lat, lng]
    radiusKm: number;
  };
  camera: {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
    durationMs?: number;
  };
  visibleLayers: {
    buildings: boolean;
    roads: boolean;
    facilities: boolean;
    radar: boolean;
    floodZoneBoundary: boolean;
    floodGrid: boolean;
    drainage: boolean;
    surchargeNodeHighlight: boolean;
    blockedRoadsHighlight: boolean;
    routes: boolean;
    ambulance: boolean;
    elevationContours: boolean;
    runoffVectors: boolean;
    drainageFlow: boolean;
  };
  highlightEntityId?: string;
  cutawayActive?: boolean;
  backflowActive?: boolean;
  roadStatusTransition?: boolean;
  shortestRouteBlocked?: boolean;
  safeRouteActive?: boolean;
  elevationProfileActive?: boolean;
  liveDepthCm?: number;
  liveDrainageLoadPct?: number;
}

export interface CitySummary {
  city_id: string;
  city: string;
  state: string;
  country: string;
  center: { latitude: number; longitude: number };
  focus_basin?: { name: string; area_sqkm: number; description?: string };
  is_active?: boolean;
  data_status?: string;
}

export interface MetropolitanOverviewItem {
  city_id: string;
  city: string;
  state: string;
  basin_name: string;
  center: { latitude: number; longitude: number };
  rainfall_rate_mm_hr: number;
  rainfall_status: string;
  flood_risk_level: string;
  max_water_depth_cm: number;
  drainage_utilization_pct: number;
  affected_roads_count: number;
  critical_nodes_count: number;
  active_alerts_count: number;
  safe_routes_available: number;
  is_active: boolean;
}

export interface MetropolitanOverviewResponse {
  timestamp: string;
  system_status: string;
  active_city_id: string;
  cities: MetropolitanOverviewItem[];
}

