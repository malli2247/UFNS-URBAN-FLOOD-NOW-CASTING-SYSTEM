# AQUILA 3D Buildings & Urban Fabric Route
from typing import Dict, List, Any
from fastapi import APIRouter
from ..simulation.state_manager import state_manager
from ..data.buildings import ALL_BUILDINGS_FEATURES
from ..config import RISK_THRESHOLDS

router = APIRouter(prefix="/api/buildings", tags=["buildings"])

@router.get("")
def get_buildings_geojson():
    """Returns GeoJSON FeatureCollection of 3D urban buildings with dynamic flood risk and DEM elevation."""
    sm = state_manager
    depth_matrix = sm.latest_depth_matrix
    elev_matrix = sm.surface_grid.elevation_matrix
    
    features = []
    for feat in ALL_BUILDINGS_FEATURES:
        props = dict(feat["properties"])
        lat = props["lat"]
        lon = props["lon"]
        
        # Sample DEM elevation and flood depth
        r, c = sm._lat_lon_to_cell(lat, lon)
        cell_elev = float(round(elev_matrix[r, c], 1))
        cell_depth = float(round(depth_matrix[r, c], 1))
        
        props["elevation_m"] = cell_elev
        props["nearest_flood_depth_cm"] = cell_depth
        
        # Risk assessment
        if cell_depth <= 5.0:
            props["flood_risk"] = "SAFE"
        elif cell_depth <= 15.0:
            props["flood_risk"] = "LOW"
        elif cell_depth <= 30.0:
            props["flood_risk"] = "MODERATE"
        elif cell_depth <= 50.0:
            props["flood_risk"] = "HIGH"
        else:
            props["flood_risk"] = "CRITICAL"
            
        features.append({
            "type": "Feature",
            "properties": props,
            "geometry": feat["geometry"]
        })
        
    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total_buildings": len(features),
            "data_source": "SIMULATED URBAN FABRIC (BENGALURU GIS)",
            "domain": "Koramangala - Bellandur Catchment",
            "active_horizon": sm.active_horizon
        }
    }

@router.get("/status")
def get_buildings_status():
    """Summary statistics of 3D building dataset."""
    sm = state_manager
    depth_matrix = sm.latest_depth_matrix
    
    total = len(ALL_BUILDINGS_FEATURES)
    affected = 0
    high_risk = 0
    
    for feat in ALL_BUILDINGS_FEATURES:
        props = feat["properties"]
        r, c = sm._lat_lon_to_cell(props["lat"], props["lon"])
        d = float(depth_matrix[r, c])
        if d > 10.0:
            affected += 1
        if d > 30.0:
            high_risk += 1
            
    return {
        "total_buildings": total,
        "data_source": "SIMULATED URBAN FABRIC",
        "affected_buildings_count": affected,
        "high_risk_buildings_count": high_risk,
        "landmark_count": 25,
        "height_range_m": {"min": 12.0, "max": 88.0},
        "active_horizon": sm.active_horizon,
        "status": "ONLINE"
    }
