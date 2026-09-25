from fastapi import APIRouter
from ..simulation.state_manager import state_manager
from ..config import DOMAIN_BOUNDS

router = APIRouter(tags=["rainfall"])

@router.get("/api/rainfall/current")
def get_current_rainfall():
    sm = state_manager
    rate = sm._get_rainfall_for_horizon(sm.active_horizon)
    label = "Light Rain" if rate < 10 else ("Moderate Rain" if rate < 30 else ("Heavy Rain" if rate < 70 else "Extreme Cloudburst"))
    return {
        "timestamp": "2026-09-13 21:00 IST",
        "latitude": DOMAIN_BOUNDS["center_lat"],
        "longitude": DOMAIN_BOUNDS["center_lon"],
        "rainfall_rate_mm_hr": round(rate, 1),
        "source": sm.data_mode,
        "intensity_label": label
    }

@router.get("/api/rainfall/forecast")
def get_rainfall_forecast():
    sm = state_manager
    horizons = ["0m", "15m", "30m", "45m", "1h", "2h", "3h"]
    forecasts = []
    cum = 0.0
    for h in horizons:
        r = sm._get_rainfall_for_horizon(h)
        cum += r * 0.25
        # Reflectivity Z = 200 * R^1.6
        dbz = 10.0 * 2.302 * (2.301 + 1.6 * (0.0 if r <= 0.1 else (r / 20.0)))
        dbz = min(65.0, max(15.0, dbz))
        forecasts.append({
            "horizon": h,
            "rainfall_rate_mm_hr": round(r, 1),
            "cumulative_mm": round(cum, 1),
            "radar_reflectivity_dbz": round(dbz, 1)
        })
    return {
        "model_name": sm.ml_model.get_model_name(),
        "data_source": sm.data_mode,
        "forecasts": forecasts
    }

@router.get("/api/radar/status")
def get_radar_status():
    sm = state_manager
    rate = sm._get_rainfall_for_horizon(sm.active_horizon)
    # Simulated radar cells moving East-North-East across Bengaluru
    cells = [
        {"id": "CELL-01", "lat": 12.928, "lon": 77.625, "reflectivity_dbz": min(62.0, 32.0 + rate * 0.25), "storm_direction_deg": 65.0, "velocity_kmh": 24.0},
        {"id": "CELL-02", "lat": 12.940, "lon": 77.652, "reflectivity_dbz": min(60.0, 28.0 + rate * 0.28), "storm_direction_deg": 60.0, "velocity_kmh": 22.0},
        {"id": "CELL-03", "lat": 12.915, "lon": 77.668, "reflectivity_dbz": min(65.0, 35.0 + rate * 0.30), "storm_direction_deg": 70.0, "velocity_kmh": 26.0},
    ]
    status = "HISTORICAL" if sm.data_mode == "HISTORICAL REPLAY" else ("LIVE" if sm.data_mode == "LIVE DATA" else "SIMULATED")
    return {
        "status": status,
        "source": "Radar Nowcast - " + ("HISTORICAL IMD ARCHIVE" if status == "HISTORICAL" else "DEMO DATA"),
        "radar_cells": cells,
        "timestamp": "2026-09-13 21:00 IST"
    }
