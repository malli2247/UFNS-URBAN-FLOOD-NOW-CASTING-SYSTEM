# AQUILA Emergency Facilities Router
from typing import Dict, List, Any
from fastapi import APIRouter
from ..simulation.state_manager import state_manager

router = APIRouter(prefix="/api/facilities", tags=["facilities"])

FACILITIES_DATABASE = [
    {
        "id": "HOSP-01",
        "name": "St. John Medical College Hospital",
        "facility_type": "Hospital",
        "lat": 12.929,
        "lon": 77.618,
        "capacity_desc": "Trauma Center & ICU Ready (120 beds)",
        "contact": "+91 80 2206 5000",
        "elevation_m": 910.0,
        "nearest_access_road": "Hosur Road Arterial"
    },
    {
        "id": "HOSP-02",
        "name": "Sakra World Hospital",
        "facility_type": "Hospital",
        "lat": 12.928,
        "lon": 77.682,
        "capacity_desc": "Tertiary Care & Emergency Ward (60 beds)",
        "contact": "+91 80 4969 4969",
        "elevation_m": 884.0,
        "nearest_access_road": "Carmelaram - Sakra Link"
    },
    {
        "id": "HOSP-03",
        "name": "Manipal Hospital Sarjapur Road",
        "facility_type": "Hospital",
        "lat": 12.918,
        "lon": 77.662,
        "capacity_desc": "Emergency Triage Unit (45 beds)",
        "contact": "+91 80 2502 4444",
        "elevation_m": 886.0,
        "nearest_access_road": "Sarjapur Road Arterial"
    },
    {
        "id": "FIRE-01",
        "name": "Koramangala Fire & Rescue Station",
        "facility_type": "Fire Station",
        "lat": 12.935,
        "lon": 77.620,
        "capacity_desc": "4 Water Rescue Units & High-Clearance Boats",
        "contact": "101 / +91 80 2297 1500",
        "elevation_m": 906.0,
        "nearest_access_road": "Koramangala 80ft Road"
    },
    {
        "id": "FIRE-02",
        "name": "Sarjapur Road Fire Brigade Unit",
        "facility_type": "Fire Station",
        "lat": 12.924,
        "lon": 77.652,
        "capacity_desc": "2 Heavy Water Pumping Tenders",
        "contact": "101 / +91 80 2297 1515",
        "elevation_m": 887.0,
        "nearest_access_road": "Sarjapur - Agara Link"
    },
    {
        "id": "POLICE-01",
        "name": "Koramangala Police Station",
        "facility_type": "Police Station",
        "lat": 12.931,
        "lon": 77.624,
        "capacity_desc": "Disaster Quick Response Team (QRT) Mobile HQ",
        "contact": "112 / +91 80 2294 2552",
        "elevation_m": 908.0,
        "nearest_access_road": "St. John Link Road"
    },
    {
        "id": "POLICE-02",
        "name": "Bellandur Traffic Police Station",
        "facility_type": "Police Station",
        "lat": 12.936,
        "lon": 77.670,
        "capacity_desc": "Traffic Diversion & Evacuation Escort Command",
        "contact": "112 / +91 80 2294 3460",
        "elevation_m": 880.0,
        "nearest_access_road": "EcoSpace ORR Underpass Road"
    },
    {
        "id": "SHELTER-01",
        "name": "Bellandur Community Flood Relief Shelter",
        "facility_type": "Shelter",
        "lat": 12.944,
        "lon": 77.665,
        "capacity_desc": "Safe Elevation Sump Shelter (Capacity: 400 evacuees)",
        "contact": "Municipal Relief Cell 1077",
        "elevation_m": 894.0,
        "nearest_access_road": "Challaghatta - Bellandur Bypass"
    },
    {
        "id": "SHELTER-02",
        "name": "Agara Lake Municipal Evacuation Hall",
        "facility_type": "Shelter",
        "lat": 12.921,
        "lon": 77.639,
        "capacity_desc": "Equipped with Generator & Potable Water (Capacity: 350 evacuees)",
        "contact": "Municipal Relief Cell 1077",
        "elevation_m": 895.0,
        "nearest_access_road": "Agara Junction"
    },
]

@router.get("")
def get_emergency_facilities():
    sm = state_manager
    out = []
    
    for f in FACILITIES_DATABASE:
        r, c = sm._lat_lon_to_cell(f["lat"], f["lon"])
        depth = float(sm.latest_depth_matrix[r, c])
        
        if depth <= 5.0:
            risk = "LOW"
            access_status = "ACCESSIBLE"
            why = f"Facility is on elevated terrain ({f['elevation_m']}m) with {depth:.1f} cm water. Normal emergency vehicular ingress/egress."
        elif depth <= 20.0:
            risk = "MODERATE"
            access_status = "CAUTION"
            why = f"Surrounding access apron has {depth:.1f} cm water. High-clearance ambulances advised."
        else:
            risk = "HIGH"
            access_status = "ACCESS_RESTRICTED"
            why = f"Approach roads experience {depth:.1f} cm flood ponding. Immediate pumping deployment or boat transfer required."

        item = {
            **f,
            "current_depth_cm": round(depth, 1),
            "flood_risk": risk,
            "access_status": access_status,
            "why_status": why,
            "geojson": {
                "type": "Feature",
                "properties": {
                    "id": f["id"],
                    "name": f["name"],
                    "facility_type": f["facility_type"],
                    "risk": risk,
                    "depth_cm": round(depth, 1)
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [f["lon"], f["lat"]]
                }
            }
        }
        out.append(item)

    return {
        "facilities": out,
        "total_facilities": len(out),
        "hospitals_count": sum(1 for f in out if f["facility_type"] == "Hospital"),
        "fire_stations_count": sum(1 for f in out if f["facility_type"] == "Fire Station"),
        "police_stations_count": sum(1 for f in out if f["facility_type"] == "Police Station"),
        "shelters_count": sum(1 for f in out if f["facility_type"] == "Shelter"),
        "geojson": {
            "type": "FeatureCollection",
            "features": [f["geojson"] for f in out]
        }
    }
