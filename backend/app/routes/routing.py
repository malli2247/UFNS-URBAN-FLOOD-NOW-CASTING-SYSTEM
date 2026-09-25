# AQUILA Routing API Router
from typing import Dict, List, Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field
from ..simulation.state_manager import state_manager
from ..config import VEHICLE_CLEARANCES

router = APIRouter(prefix="/api/routes", tags=["routing"])

class LatLngPoint(BaseModel):
    lat: float
    lng: Optional[float] = None
    lon: Optional[float] = None

class CalculateRouteRequest(BaseModel):
    origin: Optional[LatLngPoint] = None
    destination: Optional[LatLngPoint] = None
    start_lat: Optional[float] = 12.923
    start_lon: Optional[float] = 77.618
    dest_lat: Optional[float] = 12.928
    dest_lon: Optional[float] = 77.682
    vehicle: Optional[str] = "ambulance"
    vehicle_type: Optional[str] = None
    forecast_horizon_minutes: Optional[int] = 60
    horizon: Optional[str] = None

@router.post("/calculate")
def calculate_routes_api(req: CalculateRouteRequest):
    sm = state_manager
    
    # Resolve start coordinates
    if req.origin:
        s_lat = req.origin.lat
        s_lon = req.origin.lng if req.origin.lng is not None else (req.origin.lon or 77.618)
    else:
        s_lat = req.start_lat or 12.923
        s_lon = req.start_lon or 77.618

    # Resolve dest coordinates
    if req.destination:
        d_lat = req.destination.lat
        d_lon = req.destination.lng if req.destination.lng is not None else (req.destination.lon or 77.682)
    else:
        d_lat = req.dest_lat or 12.928
        d_lon = req.dest_lon or 77.682

    # Resolve vehicle type
    v_type = (req.vehicle_type or req.vehicle or "ambulance").lower()
    
    # Check if horizon needs synchronization
    if req.horizon and req.horizon in ["0m", "15m", "30m", "45m", "1h", "2h", "3h"]:
        if sm.active_horizon != req.horizon:
            sm.set_simulation_config(horizon=req.horizon)
            
    result = sm.router.calculate_routes(
        start_lat=s_lat,
        start_lon=s_lon,
        dest_lat=d_lat,
        dest_lon=d_lon,
        vehicle_type=v_type,
        road_depth_map=sm.road_depth_map
    )
    return result

@router.post("/safe")
def calculate_safe_route_legacy(req: CalculateRouteRequest):
    return calculate_routes_api(req)

@router.get("/safe")
def get_default_safe_route(
    start_lat: float = 12.923,
    start_lon: float = 77.618,
    dest_lat: float = 12.928,
    dest_lon: float = 77.682,
    vehicle_type: str = "ambulance",
    horizon: Optional[str] = None
):
    req = CalculateRouteRequest(
        start_lat=start_lat,
        start_lon=start_lon,
        dest_lat=dest_lat,
        dest_lon=dest_lon,
        vehicle_type=vehicle_type,
        horizon=horizon
    )
    return calculate_routes_api(req)
