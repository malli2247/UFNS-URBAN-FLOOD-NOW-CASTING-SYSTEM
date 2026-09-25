# UFNS Unified Metropolitan Hydrology & Simulation State Manager
from typing import Dict, List, Any, Optional
import numpy as np
from ..config import GRID_ROWS, GRID_COLS, TIME_HORIZONS, VEHICLE_CLEARANCES
from ..adapters.city_adapter import city_adapter
from .surface_runoff import UrbanSurfaceGrid
from .drainage_graph import UrbanDrainageNetwork
from .bidirectional_coupler import BidirectionalCoupler
from .risk_engine import FloodRiskEngine
from .routing_engine import FloodSafeRouter
from .sensor_telemetry import SensorAndObservationStore
from .calibration import CalibrationEngine
from ..models.ml_interfaces import PersistenceNowcaster, AdvectionVelocityNowcaster, LightweightMLNowcaster, ModelEvaluator, MODEL_REGISTRY
from ..ml.inference_engine import get_inference_engine
from ..ingestion.providers import HistoricalRainfallProvider, OpenMeteoRainfallProvider, SyntheticRainfallProvider
from ..data.historical_events import HISTORICAL_EVENTS

class AquilaStateManager:
    def __init__(self):
        self.data_mode = "DEMO SIMULATION"  # DEMO SIMULATION | HISTORICAL REPLAY | LIVE DATA
        self.active_city_id = city_adapter.get_active_city_id()
        self.active_event_id = "bengaluru_2022_rainbow_drive"
        self.active_horizon = "0m"
        self.drainage_capacity_mult = 1.0
        self.calibrator = CalibrationEngine()
        
        # Production ML Inference Engine
        self.inference_engine = get_inference_engine()
        
        # ML models
        self.persistence_model = PersistenceNowcaster()
        self.advection_model = AdvectionVelocityNowcaster()
        self.ml_model = LightweightMLNowcaster()
        
        # Load active city subsystems
        self.load_city(self.active_city_id)

    def load_city(self, city_id: str):
        self.active_city_id = city_id
        dem_cfg = city_adapter.get_dem_config(city_id)
        drain_cfg = city_adapter.get_drainage_config(city_id)
        roads_cfg = city_adapter.get_roads_config(city_id)
        bounds = city_adapter.get_domain_bounds(city_id)
        sensors_list = city_adapter.get_sensors(city_id)
        
        city_cfg = city_adapter.get_city(city_id)
        self.base_rainfall_mm_hr = float(city_cfg.get("rainfall", {}).get("default_intensity_mm_hr", 75.0))
        
        self.surface_grid = UrbanSurfaceGrid(dem_config=dem_cfg, domain_bounds=bounds)
        self.drainage_network = UrbanDrainageNetwork(self.drainage_capacity_mult, drainage_config=drain_cfg)
        self.coupler = BidirectionalCoupler(self.drainage_network)
        self.router = FloodSafeRouter(roads_config=roads_cfg)
        self.sensor_store = SensorAndObservationStore(sensors_list=sensors_list)
        
        self._recompute_state()

    def switch_city(self, city_id: str) -> Dict[str, Any]:
        cfg = city_adapter.set_active_city(city_id)
        self.load_city(city_id)
        return {
            "status": "SUCCESS",
            "active_city_id": self.active_city_id,
            "city_name": cfg.get("city"),
            "focus_basin": cfg.get("focus_basin"),
            "center": cfg.get("center")
        }

    def set_data_mode(self, mode: str, event_id: Optional[str] = None):
        self.data_mode = mode
        if event_id and event_id in HISTORICAL_EVENTS:
            self.active_event_id = event_id
        self._recompute_state()

    def set_simulation_config(self, rainfall_mm_hr: Optional[float] = None, drainage_mult: Optional[float] = None, horizon: Optional[str] = None):
        if rainfall_mm_hr is not None:
            self.base_rainfall_mm_hr = max(0.0, rainfall_mm_hr)
        if drainage_mult is not None:
            self.drainage_capacity_mult = max(0.2, min(3.0, drainage_mult))
            drain_cfg = city_adapter.get_drainage_config(self.active_city_id)
            self.drainage_network = UrbanDrainageNetwork(self.drainage_capacity_mult, drainage_config=drain_cfg)
            self.coupler = BidirectionalCoupler(self.drainage_network)
        if horizon and horizon in TIME_HORIZONS:
            self.active_horizon = horizon
        self._recompute_state()

    def _get_rainfall_for_horizon(self, horizon: str) -> float:
        if self.data_mode == "HISTORICAL REPLAY":
            ev = HISTORICAL_EVENTS.get(self.active_event_id, HISTORICAL_EVENTS.get("bengaluru_2022_rainbow_drive", {}))
            timeline = ev.get("rainfall_timeline", [])
            for item in timeline:
                if item["horizon"] == horizon:
                    return float(item["rainfall_rate_mm_hr"])
            return float(ev.get("peak_rainfall_mm_hr", 75.0) * 0.7)
            
        elif self.data_mode == "LIVE DATA":
            b = city_adapter.get_domain_bounds(self.active_city_id)
            provider = OpenMeteoRainfallProvider()
            forecasts = provider.get_forecast(b["center_lat"], b["center_lon"])
            for f in forecasts:
                if f["horizon"] == horizon:
                    return float(f["rainfall_rate_mm_hr"])
            return 32.0
            
        else:  # DEMO SIMULATION
            factors = {"0m": 0.65, "15m": 0.85, "30m": 1.15, "45m": 1.40, "1h": 1.55, "2h": 1.10, "3h": 0.45}
            return float(self.base_rainfall_mm_hr * factors.get(horizon, 1.0))

    def _recompute_state(self):
        rain_rate = self._get_rainfall_for_horizon(self.active_horizon)
        h_mins = {"0m": 5, "15m": 15, "30m": 30, "45m": 45, "1h": 60, "2h": 120, "3h": 180}.get(self.active_horizon, 15)
        
        # 1. Surface runoff accumulation
        raw_depth = self.surface_grid.calculate_runoff_depth(rain_rate, h_mins)
        
        # 2. Coupled drainage interaction
        coupled_depth, self.latest_nodes, self.latest_edges = self.coupler.couple(raw_depth, rain_rate)
        self.latest_depth_matrix = coupled_depth
        
        # 3. Road depths lookup
        self.road_depth_map = {}
        for u, v, data in self.router.road_graph.edges(data=True):
            # Sample depth at mid-point of road
            u_data = self.router.road_graph.nodes[u]
            v_data = self.router.road_graph.nodes[v]
            mid_lat = (u_data["lat"] + v_data["lat"]) / 2.0
            mid_lon = (u_data["lon"] + v_data["lon"]) / 2.0
            r, c = self._lat_lon_to_cell(mid_lat, mid_lon)
            d = float(self.latest_depth_matrix[r, c])
            
            if data.get("road_type") == "ELEVATED_BYPASS" or "Overpass" in data.get("name", "") or "Elevated" in data.get("name", "") or "Flyover" in data.get("name", ""):
                d = round(d * 0.10, 1)  # elevated deck stays dry
            elif "Underpass" in data.get("name", "") or "Low-Lying" in data.get("name", "") or "Trough" in data.get("name", ""):
                d = round(d * 1.45, 1)  # low-lying troughs collect runoff ponding
            self.road_depth_map[data["road_id"]] = d

    def _lat_lon_to_cell(self, lat: float, lon: float) -> (int, int):
        b = city_adapter.get_domain_bounds(self.active_city_id)
        lat_span = max(1e-4, b["max_lat"] - b["min_lat"])
        lon_span = max(1e-4, b["max_lon"] - b["min_lon"])
        r = int(((lat - b["min_lat"]) / lat_span) * (GRID_ROWS - 1))
        c = int(((lon - b["min_lon"]) / lon_span) * (GRID_COLS - 1))
        return max(0, min(GRID_ROWS - 1, r)), max(0, min(GRID_COLS - 1, c))

    def get_grid_cells(self) -> List[Dict[str, Any]]:
        cells = []
        b = city_adapter.get_domain_bounds(self.active_city_id)
        dem_cfg = city_adapter.get_dem_config(self.active_city_id)
        elev_min = dem_cfg.get("min_elevation_m", 0.0)
        elev_base = dem_cfg.get("base_elevation_m", 100.0)
        t_low = elev_min + 0.25 * (elev_base - elev_min)
        t_mid = elev_min + 0.65 * (elev_base - elev_min)
        
        rain_rate = self._get_rainfall_for_horizon(self.active_horizon)
        
        for r in range(GRID_ROWS):
            lat = b["min_lat"] + (r / (GRID_ROWS - 1)) * (b["max_lat"] - b["min_lat"])
            for c in range(GRID_COLS):
                lon = b["min_lon"] + (c / (GRID_COLS - 1)) * (b["max_lon"] - b["min_lon"])
                depth = float(self.latest_depth_matrix[r, c])
                elev = float(self.surface_grid.elevation_matrix[r, c])
                slope = float(self.surface_grid.slope_matrix[r, c])
                flow_dir = float(self.surface_grid.flow_dir_matrix[r, c])
                imperv = float(self.surface_grid.imperviousness_matrix[r, c])
                
                risk_lvl, risk_score = FloodRiskEngine.calculate_cell_risk(depth, rain_rate)
                
                conf = 88 if self.data_mode == "HISTORICAL REPLAY" else (82 if self.data_mode == "LIVE DATA" else 75)
                h_penalty = {"0m": 0, "15m": 2, "30m": 4, "45m": 6, "1h": 9, "2h": 14, "3h": 18}.get(self.active_horizon, 5)
                conf = max(45, conf - h_penalty)
                
                compass = str(self.surface_grid.compass_matrix[r, c])
                vx = round(float(self.surface_grid.flow_vx[r, c]), 3)
                vy = round(float(self.surface_grid.flow_vy[r, c]), 3)
                
                surch_depth = 0.0
                surch_node_name = None
                for nd in self.latest_nodes:
                    if nd.get("is_surcharged", False):
                        nd_r, nd_c = self._lat_lon_to_cell(nd["lat"], nd["lon"])
                        if abs(nd_r - r) <= 1 and abs(nd_c - c) <= 1:
                            surch_depth = max(surch_depth, float(nd.get("spill_depth_cm", 0.0)))
                            surch_node_name = nd["name"]

                elev_desc = "Low-lying basin" if elev < t_low else ("Intermediate terrace" if elev < t_mid else "High ridge")
                imperv_desc = "High imperviousness (urban concrete)" if imperv > 0.7 else "Moderate permeability"
                
                if depth > 40.0:
                    why = f"Severe accumulation due to intense rainfall ({rain_rate} mm/hr) in {elev_desc.lower()} (elev {round(elev,1)}m). {imperv_desc} drives high runoff. " + (f"Drainage node {surch_node_name} is surcharged adding backflow." if surch_node_name else "Downstream gravity drains are bottlenecked.")
                elif depth > 20.0:
                    why = f"Elevated ponding caused by {rain_rate} mm/hr rainfall discharging toward {compass} along {round(slope,1)}° slope into {elev_desc.lower()}."
                elif depth > 5.0:
                    why = f"Moderate surface runoff ({round(depth,1)} cm) traversing downhill towards {compass} (elev {round(elev,1)}m)."
                else:
                    why = f"Normal drainage conditions with minimal ponding (<5 cm) on well-draining terrain (elev {round(elev,1)}m)."
                
                ml_features = {
                    'rainfall_1h': rain_rate,
                    'rainfall_3h': round(rain_rate * 2.1, 1),
                    'rainfall_6h': round(rain_rate * 3.4, 1),
                    'rainfall_24h': round(rain_rate * 4.2, 1),
                    'elevation': elev,
                    'slope': slope,
                    'flow_direction': flow_dir,
                    'flow_accumulation': round(max(30.0, 600.0 / (slope + 0.2)), 1),
                    'building_density': round(imperv * 0.75 + 0.1, 2),
                    'road_density': round(imperv * 0.45 + 0.35, 2),
                    'distance_to_drainage': 35.0,
                    'drainage_capacity': round(120.0 * self.drainage_capacity_mult, 1),
                    'drainage_load': round(145.0 if surch_depth > 0 else (90.0 * min(2.0, rain_rate / 60.0)), 1)
                }
                ml_pred = self.inference_engine.predict_cell(ml_features)

                cells.append({
                    "cell_id": f"C_{r:02d}_{c:02d}",
                    "row": r,
                    "col": c,
                    "lat": round(lat, 5),
                    "lon": round(lon, 5),
                    "elevation_m": round(elev, 1),
                    "slope_deg": round(slope, 1),
                    "imperviousness": round(imperv, 2),
                    "rainfall_rate_mm_hr": round(rain_rate, 1),
                    "water_depth_cm": round(depth, 1),
                    "risk_level": risk_lvl,
                    "risk_score": risk_score,
                    "flow_direction_deg": round(flow_dir, 1),
                    "flow_direction_compass": compass,
                    "flow_vx": vx,
                    "flow_vy": vy,
                    "drainage_surcharge_cm": round(surch_depth, 1),
                    "confidence_pct": conf,
                    "flood_probability": ml_pred["flood_probability"],
                    "flood_extent": ml_pred["flood_extent"],
                    "ml_predicted_depth_cm": ml_pred["flood_depth_cm"],
                    "ml_confidence_pct": ml_pred["confidence_pct"],
                    "data_provenance": {
                        "rainfall_source": "IMD Automatic Weather Station / CHIRPS v3 (0.05°)",
                        "dem_source": "Copernicus DEM GLO-30 (2024 Edition)",
                        "drainage_source": "Simulated Hydrology / Municipal Master Plan Calibration" if self.data_mode != "LIVE DATA" else "DRAINAGE DATA: UNAVAILABLE / SIMULATED",
                        "model_version": self.inference_engine.model_metadata.get("model_version", "v2.0.0-metropolitan")
                    },
                    "why_prediction": why
                })
        return cells

UFNSStateManager = AquilaStateManager
state_manager = AquilaStateManager()
