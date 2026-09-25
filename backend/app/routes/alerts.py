from fastapi import APIRouter
from typing import List, Dict, Any
from ..simulation.state_manager import state_manager

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

# Dynamic alert generator based on actual computed state
@router.get("")
def get_alerts():
    sm = state_manager
    alerts = []
    
    # 1. Critical Water Depth Alerts
    for r_id, depth in sm.road_depth_map.items():
        if depth >= 45.0:
            alerts.append({
                "alert_id": f"ALT-ROAD-{r_id}",
                "severity": "CRITICAL",
                "title": f"ROAD IMPASSABLE: Water Depth {depth:.1f} cm",
                "message": f"Critical inundation observed on corridor {r_id}. Standard vehicle passage prohibited.",
                "location": f"Road {r_id} Sector",
                "timestamp": "Active Now",
                "acknowledged": False,
                "coordinates": [12.926, 77.660]
            })
            
    # 2. Surcharged Manhole / Drain Alerts
    surcharged = [n for n in sm.latest_nodes if n.get("is_surcharged", False)]
    for n in surcharged:
        alerts.append({
            "alert_id": f"ALT-DRAIN-{n['node_id']}",
            "severity": "WARNING",
            "title": f"DRAINAGE SURCHARGE: {n['name']}",
            "message": f"Stormwater conduit at 100%+ capacity. Surface backflow estimated at {n.get('surcharge_volume_m3', 0.0):.1f} m3.",
            "location": n["name"],
            "timestamp": "Active Now",
            "acknowledged": False,
            "coordinates": [n["lat"], n["lon"]]
        })

    # 3. High Rainfall Intensity Alert
    rain_rate = sm._get_rainfall_for_horizon(sm.active_horizon)
    if rain_rate >= 50.0:
        alerts.append({
            "alert_id": "ALT-RAIN-CONVECTIVE",
            "severity": "CRITICAL" if rain_rate > 90 else "WARNING",
            "title": f"HEAVY PRECIPITATION NOWCAST: {rain_rate:.1f} mm/hr",
            "message": f"Doppler radar tracks convective cell with {rain_rate:.1f} mm/hr cloudburst intensity.",
            "location": "Central Tech Basin",
            "timestamp": "Active Now",
            "acknowledged": False,
            "coordinates": [12.935, 77.640]
        })

    if not alerts:
        alerts.append({
            "alert_id": "ALT-NORMAL",
            "severity": "INFO",
            "title": "SYSTEM NORMAL: No Inundation Exceedances",
            "message": "Current precipitation and runoff within drainage capacity limits.",
            "location": "Metropolitan Domain",
            "timestamp": "Recent",
            "acknowledged": True,
            "coordinates": [12.935, 77.640]
        })

    return alerts

@router.post("/{alert_id}/ack")
def acknowledge_alert(alert_id: str):
    return {"status": "SUCCESS", "alert_id": alert_id, "acknowledged": True}
