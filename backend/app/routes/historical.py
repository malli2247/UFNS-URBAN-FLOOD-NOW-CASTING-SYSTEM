from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from ..data.historical_events import HISTORICAL_EVENTS
from ..simulation.state_manager import state_manager

router = APIRouter(prefix="/api/historical", tags=["historical"])

class ReplayReq(BaseModel):
    event_id: str
    horizon: Optional[str] = "0m"

@router.get("/events")
def list_historical_events():
    events_summary = []
    for k, v in HISTORICAL_EVENTS.items():
        events_summary.append({
            "id": v["id"],
            "name": v["name"],
            "date": v["date"],
            "location": v["location"],
            "description": v["description"],
            "peak_rainfall_mm_hr": v["peak_rainfall_mm_hr"],
            "observation_count": len(v.get("observations", [])),
            "timeline_steps": len(v.get("rainfall_timeline", []))
        })
    return events_summary

@router.post("/replay")
def replay_event(req: ReplayReq):
    sm = state_manager
    if req.event_id in HISTORICAL_EVENTS:
        sm.set_data_mode("HISTORICAL REPLAY", req.event_id)
        if req.horizon:
            sm.set_simulation_config(horizon=req.horizon)
        return {
            "status": "REPLAY_ACTIVATED",
            "active_event": req.event_id,
            "horizon": sm.active_horizon,
            "message": f"Historical event {req.event_id} successfully loaded into simulation engine."
        }
    return {"status": "ERROR", "message": "Event ID not found in historical archive."}
