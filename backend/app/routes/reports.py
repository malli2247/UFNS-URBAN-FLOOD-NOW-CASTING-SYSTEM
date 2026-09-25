from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from ..simulation.state_manager import state_manager

router = APIRouter(prefix="/api/reports", tags=["reports"])

class CitizenReportPayload(BaseModel):
    lat: float
    lon: float
    category: str
    water_depth_cm: float
    description: Optional[str] = ""
    photo_url: Optional[str] = None

@router.get("")
def list_reports():
    return state_manager.sensor_store.citizen_reports

@router.post("")
def submit_report(payload: CitizenReportPayload):
    sm = state_manager
    rep = sm.sensor_store.add_citizen_report(payload.dict())
    return {"status": "REPORT_ACCEPTED", "report": rep}
