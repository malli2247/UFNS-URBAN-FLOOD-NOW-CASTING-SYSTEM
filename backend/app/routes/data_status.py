from fastapi import APIRouter
from ..simulation.state_manager import state_manager
from ..data.historical_events import HISTORICAL_EVENTS

router = APIRouter(prefix="/api/data", tags=["data"])

@router.get("/status")
def get_data_status():
    sm = state_manager
    ev_name = HISTORICAL_EVENTS.get(sm.active_event_id, {}).get("name", "Custom Scenario")
    return {
        "data_mode": sm.data_mode,
        "rainfall_source": "Open-Meteo Live API / Station Feed" if sm.data_mode == "LIVE DATA" else ("Historical IMD/Gauge Replay" if sm.data_mode == "HISTORICAL REPLAY" else "Calibrated Synthetic Convection"),
        "radar_status": "HISTORICAL" if sm.data_mode == "HISTORICAL REPLAY" else ("LIVE" if sm.data_mode == "LIVE DATA" else "SIMULATED"),
        "dem_source": "REAL" if sm.data_mode in ["HISTORICAL REPLAY", "LIVE DATA"] else "SIMULATED",
        "road_network_source": "OpenStreetMap Real Road Network Graph",
        "drainage_mode": "ESTIMATED DRAINAGE NETWORK",
        "sensor_count": len(sm.sensor_store.get_all_sensors()),
        "observation_count": len(sm.sensor_store.get_all_ground_truth()),
        "active_event_name": ev_name if sm.data_mode == "HISTORICAL REPLAY" else "Active Horizon Monitoring",
        "system_status": "OPERATIONAL"
    }

@router.get("/quality")
def get_data_quality():
    return {
        "rainfall_coverage": "High (Sub-kilometer radar & 4 station feeds)",
        "dem_quality": "High (30m SRTM/Cartosat elevation corrected)",
        "drainage_completeness": "Medium (Estimated Primary Trunk Conduits)",
        "ground_truth_density": "High (14 online ultrasonic sensors + verified reports)",
        "forecast_latency_sec": 0.42,
        "quality_score_pct": 84
    }

@router.post("/mode")
def set_data_mode(payload: dict):
    mode = payload.get("mode", "DEMO SIMULATION")
    event_id = payload.get("event_id")
    state_manager.set_data_mode(mode, event_id)
    return {"status": "SUCCESS", "active_mode": state_manager.data_mode}
