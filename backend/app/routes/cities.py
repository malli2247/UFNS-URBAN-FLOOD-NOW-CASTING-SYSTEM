# UFNS City-Agnostic Metropolitan REST & Streaming API Router
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from ..simulation.state_manager import state_manager
from ..adapters.city_adapter import city_adapter
from ..data.buildings import ALL_BUILDINGS_FEATURES

router = APIRouter(prefix="/api/cities", tags=["cities"])

class RouteCalcPoint(BaseModel):
    lat: float
    lng: Optional[float] = None
    lon: Optional[float] = None

class CityRouteRequest(BaseModel):
    origin: Optional[RouteCalcPoint] = None
    destination: Optional[RouteCalcPoint] = None
    vehicle: Optional[str] = "ambulance"
    vehicle_type: Optional[str] = None
    horizon: Optional[str] = None

class CitySelectRequest(BaseModel):
    city_id: str

@router.get("")
def list_supported_cities():
    """List all metropolitan cities supported by the UFNS platform."""
    return {
        "total_cities": len(city_adapter.cities),
        "active_city_id": state_manager.active_city_id,
        "cities": city_adapter.list_cities()
    }

@router.get("/comparison")
def get_metropolitan_overview():
    """Side-by-side descriptive comparison across all supported metropolitan cities."""
    overview = []
    current_active = state_manager.active_city_id
    
    for cid, cfg in city_adapter.cities.items():
        # Get city metrics
        is_active = (cid == current_active)
        dem = cfg.get("dem", {})
        drain = cfg.get("drainage", {})
        roads = cfg.get("roads", {})
        fac = cfg.get("facilities", {}).get("items", [])
        rain = cfg.get("rainfall", {})
        
        # Calculate depth estimates
        if is_active:
            cells = state_manager.get_grid_cells()
            depths = [c["water_depth_cm"] for c in cells]
            max_d = max(depths) if depths else 0.0
            aff_roads = sum(1 for d in state_manager.road_depth_map.values() if d > 10.0)
            crit_nodes = sum(1 for n in state_manager.latest_nodes if n.get("is_surcharged", False))
            rain_rate = state_manager._get_rainfall_for_horizon(state_manager.active_horizon)
        else:
            rain_rate = rain.get("default_intensity_mm_hr", 75.0)
            max_d = round(rain_rate * 0.42, 1)
            aff_roads = 6
            crit_nodes = 2
            
        risk_lvl = "SAFE" if max_d < 10 else ("MODERATE" if max_d < 30 else ("HIGH" if max_d < 50 else "CRITICAL"))
        
        overview.append({
            "city_id": cid,
            "city": cfg.get("city"),
            "state": cfg.get("state"),
            "basin_name": cfg.get("focus_basin", {}).get("name"),
            "center": cfg.get("center"),
            "rainfall_rate_mm_hr": round(rain_rate, 1),
            "rainfall_status": rain.get("status", "LIVE"),
            "flood_risk_level": risk_lvl,
            "max_water_depth_cm": round(max_d, 1),
            "drainage_utilization_pct": 104 if crit_nodes > 0 else 78,
            "affected_roads_count": aff_roads,
            "critical_nodes_count": crit_nodes,
            "active_alerts_count": 2 if risk_lvl in ["HIGH", "CRITICAL"] else 0,
            "safe_routes_available": max(0, len(roads.get("road_segments", [])) - aff_roads),
            "is_active": is_active
        })
    return {
        "timestamp": "2026-09-23T20:30:00 IST",
        "system_status": "OPERATIONAL",
        "active_city_id": current_active,
        "cities": overview
    }

@router.get("/{city_id}")
def get_city_profile(city_id: str):
    """Retrieve full configuration for a specific metropolitan city."""
    cid = city_id.lower().strip()
    if cid not in city_adapter.cities:
        raise HTTPException(status_code=404, detail=f"City '{city_id}' not found.")
    return city_adapter.get_city(cid)

@router.post("/select")
def select_active_city_body(payload: CitySelectRequest):
    """Switch active city via JSON body: { 'city_id': '...' }"""
    city_id = payload.city_id
    cid = city_id.lower().strip()
    if cid not in city_adapter.cities:
        raise HTTPException(status_code=404, detail=f"City '{city_id}' not found.")
    res = state_manager.switch_city(cid)
    return res

@router.post("/{city_id}/select")
def select_active_city(city_id: str):
    """Switch active metropolitan city dynamically without application restart."""
    cid = city_id.lower().strip()
    if cid not in city_adapter.cities:
        raise HTTPException(status_code=404, detail=f"City '{city_id}' not found.")
    res = state_manager.switch_city(cid)
    return res

@router.get("/{city_id}/status")
def get_city_status(city_id: str):
    """Get real-time data status and provenance for specified city."""
    cid = city_id.lower().strip()
    cfg = city_adapter.get_city(cid)
    prov = cfg.get("data_sources", {})
    return {
        "city_id": cid,
        "city": cfg.get("city"),
        "state": cfg.get("state"),
        "data_mode": state_manager.data_mode,
        "provenance": prov,
        "is_active": (cid == state_manager.active_city_id),
        "status": "OPERATIONAL"
    }

@router.get("/{city_id}/rainfall")
def get_city_rainfall(city_id: str):
    """Get hyetograph and forecast for specified city."""
    cid = city_id.lower().strip()
    cfg = city_adapter.get_city(cid)
    b = cfg.get("bounding_box", {})
    rain_cfg = cfg.get("rainfall", {})
    base_rate = rain_cfg.get("default_intensity_mm_hr", 75.0)
    
    horizons = ["0m", "15m", "30m", "45m", "1h", "2h", "3h"]
    factors = {"0m": 0.65, "15m": 0.85, "30m": 1.15, "45m": 1.40, "1h": 1.55, "2h": 1.10, "3h": 0.45}
    timeline = []
    cum = 0.0
    for h in horizons:
        rate = round(base_rate * factors[h], 1)
        cum += rate * 0.25
        dbz = round(10.0 * 2.4 + rate * 0.45, 1)
        timeline.append({
            "horizon": h,
            "rainfall_rate_mm_hr": rate,
            "cumulative_mm": round(cum, 1),
            "radar_reflectivity_dbz": dbz
        })
    return {
        "city_id": cid,
        "city": cfg.get("city"),
        "radar_station": rain_cfg.get("radar_station"),
        "source": rain_cfg.get("source"),
        "current_rate_mm_hr": base_rate,
        "forecast_timeline": timeline
    }

@router.get("/{city_id}/flood")
def get_city_flood(city_id: str):
    """Get flood cells and inundation grid for specified city."""
    cid = city_id.lower().strip()
    if cid != state_manager.active_city_id:
        state_manager.switch_city(cid)
    cells = state_manager.get_grid_cells()
    depths = [c["water_depth_cm"] for c in cells]
    max_d = max(depths) if depths else 0.0
    return {
        "city_id": cid,
        "active_horizon": state_manager.active_horizon,
        "predicted_max_water_depth_cm": round(max_d, 1),
        "total_cells": len(cells),
        "grid_cells": cells
    }

@router.get("/{city_id}/drainage")
def get_city_drainage(city_id: str):
    """Get subterranean drainage graph and surcharge status for specified city."""
    cid = city_id.lower().strip()
    if cid != state_manager.active_city_id:
        state_manager.switch_city(cid)
    return {
        "city_id": cid,
        "nodes": state_manager.latest_nodes,
        "edges": state_manager.latest_edges,
        "surcharged_nodes_count": sum(1 for n in state_manager.latest_nodes if n.get("is_surcharged", False))
    }

@router.get("/{city_id}/roads")
def get_city_roads(city_id: str):
    """Get road network and travel risk for specified city."""
    cid = city_id.lower().strip()
    if cid != state_manager.active_city_id:
        state_manager.switch_city(cid)
    roads = []
    rg = state_manager.router.road_graph
    for u, v, data in rg.edges(data=True):
        u_d = rg.nodes[u]
        v_d = rg.nodes[v]
        d = state_manager.road_depth_map.get(data["road_id"], 0.0)
        status = "OPEN" if d < 8.0 else ("CAUTION" if d < 18.0 else ("HIGH_RISK" if d < 30.0 else "BLOCKED"))
        roads.append({
            "road_id": data["road_id"],
            "name": data["name"],
            "length_km": data["length_km"],
            "speed_kmh": data["speed_kmh"],
            "road_type": data["road_type"],
            "water_depth_cm": d,
            "travel_status": status,
            "coordinates": [[u_d["lat"], u_d["lon"]], [v_d["lat"], v_d["lon"]]]
        })
    return {
        "city_id": cid,
        "total_roads": len(roads),
        "affected_roads_count": sum(1 for r in roads if r["water_depth_cm"] > 10.0),
        "roads": roads
    }

@router.get("/{city_id}/facilities")
def get_city_facilities(city_id: str):
    """Get emergency hospitals, fire stations, shelters for specified city."""
    cid = city_id.lower().strip()
    facs = city_adapter.get_facilities(cid)
    out = []
    for f in facs:
        r, c = state_manager._lat_lon_to_cell(f["lat"], f["lon"])
        d = float(state_manager.latest_depth_matrix[r, c])
        status = "OPERATIONAL_CLEAR" if d < 10.0 else ("ACCESSIBLE_WITH_CAUTION" if d < 25.0 else "FLOOD_ISOLATED")
        out.append({
            **f,
            "water_depth_cm": d,
            "operational_status": status
        })
    return {
        "city_id": cid,
        "facilities": out
    }

@router.get("/{city_id}/routes")
def get_city_default_route(city_id: str, vehicle: str = "ambulance"):
    """Get default emergency route for specified city."""
    cid = city_id.lower().strip()
    if cid != state_manager.active_city_id:
        state_manager.switch_city(cid)
    
    cfg = city_adapter.get_city(cid)
    intersections = cfg.get("roads", {}).get("intersections", {})
    r_cfg = cfg.get("routing", {})
    orig_id = r_cfg.get("default_origin_node")
    dest_id = r_cfg.get("default_destination_node")
    
    if orig_id and dest_id and orig_id in intersections and dest_id in intersections:
        s_lat = intersections[orig_id]["lat"]
        s_lon = intersections[orig_id]["lon"]
        d_lat = intersections[dest_id]["lat"]
        d_lon = intersections[dest_id]["lon"]
    else:
        b = cfg.get("bounding_box", {})
        s_lat = b.get("min_lat", 12.92) + 0.2 * (b.get("max_lat", 12.96) - b.get("min_lat", 12.92))
        s_lon = b.get("min_lon", 77.61) + 0.2 * (b.get("max_lon", 77.67) - b.get("min_lon", 77.61))
        d_lat = b.get("min_lat", 12.92) + 0.8 * (b.get("max_lat", 12.96) - b.get("min_lat", 12.92))
        d_lon = b.get("min_lon", 77.61) + 0.8 * (b.get("max_lon", 77.67) - b.get("min_lon", 77.61))

    return state_manager.router.calculate_routes(
        start_lat=s_lat,
        start_lon=s_lon,
        dest_lat=d_lat,
        dest_lon=d_lon,
        vehicle_type=vehicle,
        road_depth_map=state_manager.road_depth_map
    )

@router.post("/{city_id}/routes/calculate")
def calculate_city_route(city_id: str, req: CityRouteRequest):
    """Calculate customized dynamic safe route in specified city."""
    cid = city_id.lower().strip()
    if cid != state_manager.active_city_id:
        state_manager.switch_city(cid)
        
    s_lat = req.origin.lat if req.origin else 12.923
    s_lon = (req.origin.lng if req.origin and req.origin.lng is not None else (req.origin.lon if req.origin else 77.618)) or 77.618
    d_lat = req.destination.lat if req.destination else 12.928
    d_lon = (req.destination.lng if req.destination and req.destination.lng is not None else (req.destination.lon if req.destination else 77.682)) or 77.682
    v_type = (req.vehicle_type or req.vehicle or "ambulance").lower()

    if req.horizon and req.horizon != state_manager.active_horizon:
        state_manager.set_simulation_config(horizon=req.horizon)

    return state_manager.router.calculate_routes(
        start_lat=s_lat,
        start_lon=s_lon,
        dest_lat=d_lat,
        dest_lon=d_lon,
        vehicle_type=v_type,
        road_depth_map=state_manager.road_depth_map
    )

@router.get("/{city_id}/digital-twin")
def get_city_digital_twin(city_id: str):
    """Retrieve 3D buildings, water bodies, and elevation markers for digital twin."""
    cid = city_id.lower().strip()
    bldgs = city_adapter.get_buildings(cid)
    water = city_adapter.get_water_bodies(cid)
    dem = city_adapter.get_dem_config(cid)
    cfg = city_adapter.get_city(cid)
    
    features = []
    for b in bldgs:
        features.append({
            "type": "Feature",
            "properties": {
                "id": b["id"],
                "name": b["name"],
                "height": b["height_m"],
                "type": b["type"]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [b["polygon"]]
            }
        })
    return {
        "city_id": cid,
        "city": cfg.get("city"),
        "center": cfg.get("center"),
        "buildings": {
            "type": "FeatureCollection",
            "features": features
        },
        "water_bodies": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"name": wb["name"], "type": wb["type"]},
                    "geometry": {
                        "type": "Polygon" if wb["type"] in ["LAKE", "BAY", "WETLAND"] else "LineString",
                        "coordinates": [wb["coords"]] if wb["type"] in ["LAKE", "BAY", "WETLAND"] else wb["coords"]
                    }
                }
                for wb in water
            ]
        },
        "dem_markers": dem.get("markers", [])
    }

@router.get("/{city_id}/dem")
def get_city_dem(city_id: str):
    """Get elevation markers and contours for specified city."""
    cid = city_id.lower().strip()
    cfg = city_adapter.get_city(cid)
    dem = cfg.get("dem", {})
    return {
        "city_id": cid,
        "base_elevation_m": dem.get("base_elevation_m"),
        "min_elevation_m": dem.get("min_elevation_m"),
        "max_elevation_m": dem.get("max_elevation_m", dem.get("base_elevation_m")),
        "markers": dem.get("markers", []),
        "troughs": dem.get("troughs", [])
    }

@router.get("/{city_id}/sensors")
def get_city_sensors(city_id: str):
    """Get IoT sensors and telemetry for specified city."""
    cid = city_id.lower().strip()
    return city_adapter.get_sensors(cid)

@router.get("/{city_id}/story")
def get_city_story(city_id: str):
    """Get 10-scene guided cinematic narrative for specified city."""
    cid = city_id.lower().strip()
    return city_adapter.get_story(cid)
