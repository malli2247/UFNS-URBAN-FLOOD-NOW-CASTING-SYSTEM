from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from ..simulation.state_manager import state_manager

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

class SimConfigPayload(BaseModel):
    rainfall_mm_hr: Optional[float] = None
    drainage_capacity_mult: Optional[float] = None
    horizon: Optional[str] = None
    preset: Optional[str] = None

@router.post("/config")
def update_simulation_config(payload: SimConfigPayload):
    sm = state_manager
    if payload.preset:
        presets = {
            "cloudburst": {"rain": 135.0, "drain": 0.8},
            "2015_severe": {"rain": 148.0, "drain": 0.6},
            "monsoon_extreme": {"rain": 95.0, "drain": 1.0},
            "moderate_rain": {"rain": 35.0, "drain": 1.2},
            "normal_drainage": {"rain": 65.0, "drain": 1.0},
            "blocked_drainage": {"rain": 65.0, "drain": 0.4},
        }
        p = presets.get(payload.preset)
        if p:
            sm.set_simulation_config(rainfall_mm_hr=p["rain"], drainage_mult=p["drain"])
    
    sm.set_simulation_config(
        rainfall_mm_hr=payload.rainfall_mm_hr,
        drainage_mult=payload.drainage_capacity_mult,
        horizon=payload.horizon
    )
    return {
        "status": "CONFIG_UPDATED",
        "rainfall_mm_hr": sm.base_rainfall_mm_hr,
        "drainage_mult": sm.drainage_capacity_mult,
        "horizon": sm.active_horizon
    }

@router.post("/reset")
def reset_simulation():
    sm = state_manager
    sm.data_mode = "DEMO SIMULATION"
    sm.active_horizon = "0m"
    sm.base_rainfall_mm_hr = 85.0
    sm.drainage_capacity_mult = 1.0
    sm.set_simulation_config(rainfall_mm_hr=85.0, drainage_mult=1.0, horizon="0m")
    return {"status": "RESET_COMPLETE"}

@router.post("/start")
def start_demo_scenario():
    # Progresses to peak flood scenario
    sm = state_manager
    sm.set_simulation_config(rainfall_mm_hr=120.0, drainage_mult=0.85, horizon="1h")
    return {
        "status": "SCENARIO_STARTED",
        "horizon": "1h",
        "message": "Flood nowcast scenario triggered: Peak precipitation and drainage surcharge applied."
    }

@router.get("/scenarios/compare")
def compare_scenarios():
    return {
        "scenarios": [
            {
                "id": "scenario_a_normal",
                "name": "Scenario A: Normal Drainage Infrastructure",
                "max_depth_cm": 38.5,
                "affected_roads": 5,
                "surcharged_nodes": 1,
                "risk_category": "MODERATE",
                "flow_retention_m3": 14200.0
            },
            {
                "id": "scenario_b_blocked",
                "name": "Scenario B: 50% Silted / Blocked Storm Drains",
                "max_depth_cm": 64.2,
                "affected_roads": 14,
                "surcharged_nodes": 7,
                "risk_category": "CRITICAL",
                "flow_retention_m3": 38900.0
            },
            {
                "id": "scenario_c_extreme",
                "name": "Scenario C: Extreme Convective Cloudburst (130 mm/hr)",
                "max_depth_cm": 78.0,
                "affected_roads": 17,
                "surcharged_nodes": 11,
                "risk_category": "EXTREME_CRITICAL",
                "flow_retention_m3": 62500.0
            }
        ]
    }
