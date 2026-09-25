# AQUILA 2D Surface Runoff & Terrain Hydrology Engine
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from ..config import GRID_ROWS, GRID_COLS, CELL_AREA_M2
from .physics_units import mm_per_hr_to_m_per_s, volume_to_depth_cm

class UrbanSurfaceGrid:
    def __init__(self, calibration_factor: float = 1.0, dem_config: Optional[Dict[str, Any]] = None, domain_bounds: Optional[Dict[str, float]] = None):
        self.rows = GRID_ROWS
        self.cols = GRID_COLS
        self.calibration_factor = calibration_factor
        self.dem_config = dem_config or {}
        self.domain_bounds = domain_bounds or {
            "min_lat": 12.912, "max_lat": 12.962,
            "min_lon": 77.605, "max_lon": 77.675
        }
        self._init_dem_and_landuse()

    def _init_dem_and_landuse(self):
        r = np.linspace(0, 1, self.rows)
        c = np.linspace(0, 1, self.cols)
        R, C = np.meshgrid(r, c, indexing="ij")
        
        base_elev = float(self.dem_config.get("base_elevation_m", 915.0))
        min_elev = float(self.dem_config.get("min_elevation_m", 875.0))
        elev_range = max(5.0, base_elev - min_elev)
        
        # General gradient: higher on West/North, sloping towards East/South depression
        elev_matrix = base_elev - (R * 0.3 + C * 0.7) * (elev_range * 0.85)
        
        # Apply city-specific topographic depressions/troughs
        troughs = self.dem_config.get("troughs", [])
        b = self.domain_bounds
        lat_range = max(1e-4, b["max_lat"] - b["min_lat"])
        lon_range = max(1e-4, b["max_lon"] - b["min_lon"])
        
        if troughs:
            for tr in troughs:
                tr_lat = tr.get("lat", b["min_lat"] + 0.5 * lat_range)
                tr_lon = tr.get("lon", b["min_lon"] + 0.5 * lon_range)
                tr_r = (tr_lat - b["min_lat"]) / lat_range
                tr_c = (tr_lon - b["min_lon"]) / lon_range
                depth = tr.get("depth_m", 6.5)
                dip = -depth * np.exp(-((R - tr_r)**2 / 0.03 + (C - tr_c)**2 / 0.04))
                elev_matrix += dip
        else:
            underpass_dip = -6.5 * np.exp(-((R - 0.4)**2 / 0.02 + (C - 0.5)**2 / 0.03))
            lake_basin_dip = -8.0 * np.exp(-((R - 0.7)**2 / 0.04 + (C - 0.8)**2 / 0.05))
            elev_matrix += (underpass_dip + lake_basin_dip)
            
        self.elevation_matrix = elev_matrix
        
        dy, dx = np.gradient(self.elevation_matrix, 350.0)
        self.slope_matrix = np.degrees(np.arctan(np.sqrt(dx**2 + dy**2)))
        
        # Calculate downhill flow angle (0 to 360, where 0/360 is East, 90 is North in Cartesian, or compass bearing)
        # Downhill vector is (-dx, -dy)
        mag = np.sqrt(dx**2 + dy**2) + 1e-6
        self.flow_vx = -dx / mag
        self.flow_vy = -dy / mag
        
        # Meteorological compass bearing in degrees (0=N, 90=E, 180=S, 270=W)
        bearing = (np.degrees(np.arctan2(-dx, -dy)) + 360.0) % 360.0
        self.flow_dir_matrix = bearing
        
        # 8-direction compass mapping
        compass_points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        self.compass_matrix = np.empty((self.rows, self.cols), dtype=object)
        for r_idx in range(self.rows):
            for c_idx in range(self.cols):
                b_val = bearing[r_idx, c_idx]
                idx = int((b_val + 22.5) // 45) % 8
                self.compass_matrix[r_idx, c_idx] = compass_points[idx]
        
        self.imperviousness_matrix = 0.70 + 0.18 * np.sin(R * 3.14) * np.cos(C * 3.14)
        threshold_low = min_elev + 0.2 * elev_range
        self.imperviousness_matrix[self.elevation_matrix < threshold_low] = 0.35
        self.imperviousness_matrix = np.clip(self.imperviousness_matrix, 0.25, 0.95)

    def calculate_runoff_depth(self, rainfall_rate_mm_hr: float, horizon_mins: int = 15) -> np.ndarray:
        dt_seconds = horizon_mins * 60.0
        c_runoff = (0.20 + 0.70 * self.imperviousness_matrix) * self.calibration_factor
        c_runoff = np.clip(c_runoff, 0.15, 0.98)
        
        sat_ratio = min(1.0, horizon_mins / 60.0)
        infiltration_loss_mm_hr = 12.0 * (1.0 - sat_ratio) + 2.5
        effective_rain_mm_hr = np.maximum(0.0, rainfall_rate_mm_hr - infiltration_loss_mm_hr)
        
        q_rate_m_s = mm_per_hr_to_m_per_s(effective_rain_mm_hr) * c_runoff
        runoff_volume_m3 = q_rate_m_s * CELL_AREA_M2 * dt_seconds
        
        depth_cm = volume_to_depth_cm(runoff_volume_m3, CELL_AREA_M2)
        
        elev_min = np.min(self.elevation_matrix)
        elev_max = np.max(self.elevation_matrix)
        elev_norm = (self.elevation_matrix - elev_min) / (elev_max - elev_min + 1e-5)
        
        # Hydrologic catchment convergence: Runoff converges from higher elevations (elev_norm ~ 1)
        # into low depressions and valleys (elev_norm ~ 0)
        topo_accumulation = 3.6 * np.exp(-3.2 * elev_norm) + 0.35
        
        # Accumulation over event duration
        duration_mult = min(2.5, 0.75 + (horizon_mins / 45.0))
        depth_cm = depth_cm * topo_accumulation * duration_mult
        return np.maximum(0.0, np.round(depth_cm, 1))
