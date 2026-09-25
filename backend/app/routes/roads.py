# AQUILA Road Network & Flood Travel Status Router
from typing import Dict, List, Any
from fastapi import APIRouter, HTTPException
from ..simulation.state_manager import state_manager
from ..config import VEHICLE_CLEARANCES

router = APIRouter(prefix="/api/roads", tags=["roads"])

# Alternative detour mappings if a road becomes blocked
ROAD_ALTERNATIVES = {
    "R06": "R19 (Koramangala 100ft Elevated Way)",
    "R13": "R12 (Challaghatta - Bellandur Elevated Bypass)",
    "R15": "R16 (Carmelaram - Sakra Link Arterial)",
    "R05": "R04 (Koramangala 80ft Road)",
    "R07": "R11 (Agara - Iblur Outer Ring Road)",
    "R10": "R18 (Marathahalli Elevated Expressway)",
}

def _get_road_feature(road_id: str, u: str, v: str, attrs: Dict[str, Any], depth_cm: float) -> Dict[str, Any]:
    rg = state_manager.router.road_graph
    u_data = rg.nodes[u]
    v_data = rg.nodes[v]
    
    # Travel status based on depth vs urban vehicle clearances
    if depth_cm <= 8.0:
        travel_status = "OPEN"
        risk_lvl = "LOW"
    elif depth_cm <= 18.0:
        travel_status = "CAUTION"
        risk_lvl = "MODERATE"
    elif depth_cm <= 30.0:
        travel_status = "HIGH_RISK"
        risk_lvl = "HIGH"
    else:
        travel_status = "BLOCKED"
        risk_lvl = "CRITICAL"
        
    passable = [
        v_type for v_type, clr in VEHICLE_CLEARANCES.items()
        if depth_cm <= clr
    ]
    
    # Dynamic reasoning
    alt = ROAD_ALTERNATIVES.get(road_id, "Secondary grid detour available")
    if travel_status == "BLOCKED":
        why = f"Water depth of {depth_cm:.1f} cm exceeds safe vehicle clearance thresholds. Local low elevation causes surface water pooling from surrounding catchment. Recommended detour: {alt}."
    elif travel_status == "HIGH_RISK":
        why = f"Ponding depth of {depth_cm:.1f} cm presents severe hydroplaning hazard. Passable only by high-clearance emergency SUVs and Fire Trucks ({', '.join(passable)})."
    elif travel_status == "CAUTION":
        why = f"Moderate standing water ({depth_cm:.1f} cm). Speed reduced by 40%. Passable for standard passenger cars and above."
    else:
        why = f"Clear road surface with minimal water accumulation ({depth_cm:.1f} cm). Normal traffic speed."

    coords = [
        [u_data["lat"], u_data["lon"]],
        [v_data["lat"], v_data["lon"]]
    ]

    return {
        "road_id": road_id,
        "name": attrs["name"],
        "road_type": attrs.get("road_type", "PRIMARY"),
        "length_km": attrs["length_km"],
        "speed_kmh": attrs["speed_kmh"],
        "from_intersection": {"id": u, "name": u_data["name"], "lat": u_data["lat"], "lon": u_data["lon"]},
        "to_intersection": {"id": v, "name": v_data["name"], "lat": v_data["lat"], "lon": v_data["lon"]},
        "coordinates": coords,
        "predicted_depth_cm": round(depth_cm, 1),
        "travel_status": travel_status,
        "risk_level": risk_lvl,
        "passable_vehicles": passable,
        "alternative_route": alt if travel_status in ["BLOCKED", "HIGH_RISK"] else None,
        "why_prediction": why,
        "geojson": {
            "type": "Feature",
            "properties": {
                "road_id": road_id,
                "name": attrs["name"],
                "status": travel_status,
                "depth_cm": round(depth_cm, 1),
                "risk": risk_lvl
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [[u_data["lon"], u_data["lat"]], [v_data["lon"], v_data["lat"]]]
            }
        }
    }

@router.get("")
def get_all_roads():
    sm = state_manager
    roads_list = []
    rg = sm.router.road_graph
    
    for u, v, data in rg.edges(data=True):
        rid = data["road_id"]
        depth = sm.road_depth_map.get(rid, 0.0)
        roads_list.append(_get_road_feature(rid, u, v, data, depth))
        
    blocked_count = sum(1 for r in roads_list if r["travel_status"] == "BLOCKED")
    caution_count = sum(1 for r in roads_list if r["travel_status"] in ["CAUTION", "HIGH_RISK"])
    open_count = sum(1 for r in roads_list if r["travel_status"] == "OPEN")
    
    return {
        "total_roads": len(roads_list),
        "open_roads_count": open_count,
        "caution_roads_count": caution_count,
        "blocked_roads_count": blocked_count,
        "roads": roads_list,
        "geojson": {
            "type": "FeatureCollection",
            "features": [r["geojson"] for r in roads_list]
        }
    }

@router.get("/{road_id}")
def get_road_detail(road_id: str):
    sm = state_manager
    rg = sm.router.road_graph
    for u, v, data in rg.edges(data=True):
        if data["road_id"].lower() == road_id.lower():
            depth = sm.road_depth_map.get(data["road_id"], 0.0)
            return _get_road_feature(data["road_id"], u, v, data, depth)
    raise HTTPException(status_code=404, detail=f"Road {road_id} not found")
