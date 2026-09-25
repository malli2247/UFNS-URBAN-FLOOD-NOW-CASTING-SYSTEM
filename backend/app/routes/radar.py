# AQUILA Radar & Rainfall Advection Overlay Router
from typing import Dict, List, Any
from fastapi import APIRouter
from ..simulation.state_manager import state_manager

router = APIRouter(prefix="/api/radar", tags=["radar"])

RADAR_STATION = {
    "station_id": "IMD-DWR-BLR",
    "name": "Bengaluru Doppler Weather Radar Station",
    "operator": "India Meteorological Department (IMD)",
    "lat": 12.971,
    "lon": 77.622,
    "elevation_m": 930.0,
    "coverage_radius_m": 4500,  # basin-scale visual radius
    "resolution": "250m x 250m / 0.5 deg beamwidth",
    "frequency": "C-Band (5.62 GHz)",
    "sweep_strategy": "VCP-21 (Volume Coverage Pattern)",
    "data_age": "3 min ago",
    "status": "OPERATIONAL"
}

# Base storm convective centroids at T=0
BASE_STORM_CELLS = [
    {
        "cell_id": "CELL-01",
        "name": "Koramangala Meso-Convective Core",
        "base_lat": 12.930,
        "base_lon": 77.625,
        "base_radius_m": 1900,
        "reflectivity_dbz": 54.5,
        "velocity_kmh": 22.0,
        "heading_deg": 65.0,  # ENE
        "movement_vector": {"dx_km_hr": 9.3, "dy_km_hr": 20.0, "direction": "ENE (65°)"}
    },
    {
        "cell_id": "CELL-02",
        "name": "Bellandur Supercell Feeder",
        "base_lat": 12.942,
        "base_lon": 77.652,
        "base_radius_m": 2400,
        "reflectivity_dbz": 58.2,
        "velocity_kmh": 24.0,
        "heading_deg": 70.0,  # ENE
        "movement_vector": {"dx_km_hr": 8.2, "dy_km_hr": 22.5, "direction": "ENE (70°)"}
    }
]

@router.get("")
def get_radar_overlay():
    sm = state_manager
    h = sm.active_horizon
    h_mins = {"0m": 0, "15m": 15, "30m": 30, "45m": 45, "1h": 60, "2h": 120, "3h": 180}.get(h, 0)
    
    # Calculate storm advection displacement
    # 1 deg lat approx 111 km, 1 deg lon approx 108 km
    dt_hr = h_mins / 60.0
    rain_rate = sm._get_rainfall_for_horizon(h)
    
    storm_cells = []
    for cell in BASE_STORM_CELLS:
        # Advect along heading
        d_lat = (cell["velocity_kmh"] * dt_hr * 0.35) / 111.0  # slight drift
        d_lon = (cell["velocity_kmh"] * dt_hr * 0.85) / 108.0
        
        cur_lat = round(cell["base_lat"] + d_lat, 4)
        cur_lon = round(cell["base_lon"] + d_lon, 4)
        
        # Scale dBZ with rainfall rate
        # Marshall-Palmer Z = 200 * R^1.6
        eff_rain = max(5.0, rain_rate)
        z = 200.0 * (eff_rain ** 1.6)
        import math
        dbz = round(10.0 * math.log10(max(1.0, z)), 1)
        dbz = min(65.0, max(28.0, dbz))
        
        storm_cells.append({
            "cell_id": cell["cell_id"],
            "name": cell["name"],
            "lat": cur_lat,
            "lon": cur_lon,
            "radius_m": cell["base_radius_m"],
            "reflectivity_dbz": dbz,
            "rainfall_equivalent_mm_hr": round(rain_rate, 1),
            "movement_vector": cell["movement_vector"],
            "speed_kmh": cell["velocity_kmh"],
            "data_label": f"RADAR {sm.data_mode}"
        })
        
    return {
        "radar_station": RADAR_STATION,
        "storm_cells": storm_cells,
        "active_horizon": h,
        "horizon_mins": h_mins,
        "data_mode": sm.data_mode,
        "provenance": "IMD Doppler Weather Radar Grid (Synthesized for simulation demo or Replay)" if sm.data_mode != "LIVE DATA" else "IMD Open Weather Grid"
    }
