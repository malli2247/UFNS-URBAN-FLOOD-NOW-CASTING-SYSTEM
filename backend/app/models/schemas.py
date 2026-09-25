# AQUILA Pydantic Data Schemas
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class DataStatusResponse(BaseModel):
    data_mode: str  # DEMO SIMULATION | HISTORICAL REPLAY | LIVE DATA
    rainfall_source: str
    radar_status: str  # LIVE | HISTORICAL | SIMULATED | UNAVAILABLE
    dem_source: str  # REAL | SIMULATED
    road_network_source: str
    drainage_mode: str  # REAL DRAINAGE NETWORK | ESTIMATED DRAINAGE NETWORK
    sensor_count: int
    observation_count: int
    active_event_name: str
    system_status: str

class DataQualityResponse(BaseModel):
    rainfall_coverage: str  # High | Medium | Low | Not Available
    dem_quality: str  # High (30m SRTM/Cartosat) | Synthetic
    drainage_completeness: str  # Medium (Estimated Trunk Nodes)
    ground_truth_density: str  # High (14 sensors + 28 historical points)
    forecast_latency_sec: float
    quality_score_pct: int

class RainfallCurrentResponse(BaseModel):
    timestamp: str
    latitude: float
    longitude: float
    rainfall_rate_mm_hr: float
    source: str
    intensity_label: str

class RainfallForecastHorizon(BaseModel):
    horizon: str  # 0m, 15m, 30m, 45m, 1h, 2h, 3h
    rainfall_rate_mm_hr: float
    cumulative_mm: float
    radar_reflectivity_dbz: float

class RainfallForecastResponse(BaseModel):
    model_name: str  # Persistence Baseline | ConvLSTM
    data_source: str
    forecasts: List[RainfallForecastHorizon]

class RadarCell(BaseModel):
    id: str
    lat: float
    lon: float
    reflectivity_dbz: float
    storm_direction_deg: float
    velocity_kmh: float

class RadarStatusResponse(BaseModel):
    status: str  # LIVE | HISTORICAL | SIMULATED | UNAVAILABLE
    source: str
    radar_cells: List[RadarCell]
    timestamp: str

class GridCell(BaseModel):
    cell_id: str
    row: int
    col: int
    lat: float
    lon: float
    elevation_m: float
    slope_deg: float
    imperviousness: float
    rainfall_rate_mm_hr: float
    water_depth_cm: float
    risk_level: str  # SAFE | LOW | MODERATE | HIGH | CRITICAL
    risk_score: int  # 0 - 100
    flow_direction_deg: float
    drainage_surcharge_cm: float
    confidence_pct: int

class FloodPredictionResponse(BaseModel):
    timestamp: str
    horizon: str
    data_source: str
    model_used: str
    validation_status: str
    overall_confidence_pct: Optional[int]
    confidence_factors: Dict[str, str]
    grid: List[GridCell]
    max_depth_cm: float
    mean_depth_cm: float
    affected_roads_count: int
    critical_nodes_count: int

class ObservationPoint(BaseModel):
    id: str
    type: str  # IOT_SENSOR | CITIZEN_REPORT | GOVERNMENT_GAUGE | FIELD_SURVEY
    lat: float
    lon: float
    observed_depth_cm: float
    predicted_depth_cm: float
    error_cm: float
    timestamp: str
    source: str
    quality_score: float
    status: str

class ErrorMapResponse(BaseModel):
    observations: List[ObservationPoint]
    mae_cm: float
    rmse_cm: float
    mean_bias_cm: float
    r2_score: float
    validation_status: str
    note: str

class DrainageNode(BaseModel):
    node_id: str
    name: str
    lat: float
    lon: float
    elevation_m: float
    inlet_capacity_m3_s: float
    current_inflow_m3_s: float
    is_surcharged: bool
    surcharge_volume_m3: float
    spill_depth_cm: float

class DrainageEdge(BaseModel):
    edge_id: str
    from_node: str
    to_node: str
    diameter_m: float
    slope: float
    capacity_m3_s: float
    flow_m3_s: float
    utilization_pct: float
    status: str  # NORMAL | WARNING | SURCHARGED

class DrainageNetworkResponse(BaseModel):
    mode: str  # REAL DRAINAGE NETWORK | ESTIMATED DRAINAGE NETWORK
    nodes: List[DrainageNode]
    edges: List[DrainageEdge]
    total_surcharged_nodes: int

class RoadSegment(BaseModel):
    road_id: str
    name: str
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    length_m: float
    speed_kmh: float
    road_type: str
    predicted_depth_cm: float
    risk_level: str
    travel_status: str  # OPEN | CAUTION | RESTRICTED | IMPASSABLE

class SafeRouteRequest(BaseModel):
    start_lat: float
    start_lon: float
    dest_lat: float
    dest_lon: float
    vehicle_type: str = "car"  # pedestrian | car | ambulance | police | fire_truck
    horizon: str = "0m"

class RouteAlternative(BaseModel):
    route_type: str  # fastest | safest | emergency
    duration_min: float
    distance_km: float
    max_depth_cm: float
    risk_level: str
    coordinates: List[List[float]]
    avoided_roads: List[Dict[str, str]]
    passable: bool

class SafeRouteResponse(BaseModel):
    vehicle_type: str
    vehicle_clearance_cm: float
    routes: List[RouteAlternative]
    selected_route: str
    disclaimer: str

class AlertItem(BaseModel):
    alert_id: str
    severity: str  # CRITICAL | WARNING | INFO
    title: str
    message: str
    location: str
    timestamp: str
    acknowledged: bool
    coordinates: Optional[List[float]] = None

class CitizenReportCreate(BaseModel):
    lat: float
    lon: float
    category: str
    water_depth_cm: float
    description: str
    photo_url: Optional[str] = None

class CalibrationResult(BaseModel):
    before_mae_cm: float
    after_mae_cm: float
    rmse_cm: float
    bias_cm: float
    calibrated_factor: float
    status: str
    timestamp: str
    sample_count: int

class ModelMetricsResponse(BaseModel):
    model_name: str
    version: str
    task_type: str  # Regression (Depth cm) & Classification (Flood Risk)
    baseline_name: str
    baseline_mae_cm: float
    ml_mae_cm: float
    baseline_rmse_cm: float
    ml_rmse_cm: float
    r2_score: float
    f1_score: float
    precision: float
    recall: float
    horizon_metrics: Dict[str, Dict[str, float]]
    spatial_resolution_m: float
    status: str
    training_period: str
    validation_period: str
    test_period: str
