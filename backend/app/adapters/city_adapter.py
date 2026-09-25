# UFNS City Adapter Layer
# Decouples city-specific geospatial, hydraulic, and environmental data from the core UFNS computation engines.
import os
import json
import glob
from typing import Dict, List, Any, Optional

CITIES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "cities")

class CityAdapter:
    def __init__(self, cities_dir: str = CITIES_DIR):
        self.cities_dir = cities_dir
        self.cities: Dict[str, Dict[str, Any]] = {}
        self.active_city_id: str = "bengaluru"
        self._load_all_cities()

    def _load_all_cities(self):
        json_files = glob.glob(os.path.join(self.cities_dir, "*.json"))
        for jf in json_files:
            try:
                with open(jf, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    cid = cfg.get("city_id")
                    if cid:
                        self.cities[cid] = cfg
            except Exception as e:
                print(f"Error loading city config {jf}: {e}")
        
        if "bengaluru" in self.cities:
            self.active_city_id = "bengaluru"
        elif self.cities:
            self.active_city_id = list(self.cities.keys())[0]

    def list_cities(self) -> List[Dict[str, Any]]:
        result = []
        for cid, cfg in self.cities.items():
            result.append({
                "city_id": cid,
                "city": cfg.get("city"),
                "state": cfg.get("state"),
                "country": cfg.get("country"),
                "center": cfg.get("center"),
                "focus_basin": cfg.get("focus_basin"),
                "is_active": (cid == self.active_city_id),
                "data_status": cfg.get("data_sources", {}).get("rainfall", {}).get("status", "AVAILABLE")
            })
        return result

    def get_active_city_id(self) -> str:
        return self.active_city_id

    def set_active_city(self, city_id: str) -> Dict[str, Any]:
        cid = city_id.lower().strip()
        if cid not in self.cities:
            raise ValueError(f"City '{city_id}' is not supported. Supported: {list(self.cities.keys())}")
        self.active_city_id = cid
        return self.cities[cid]

    def get_city(self, city_id: Optional[str] = None) -> Dict[str, Any]:
        cid = (city_id or self.active_city_id).lower().strip()
        if cid not in self.cities:
            cid = self.active_city_id
        return self.cities.get(cid, {})

    def get_domain_bounds(self, city_id: Optional[str] = None) -> Dict[str, float]:
        cfg = self.get_city(city_id)
        return cfg.get("bounding_box", {
            "min_lat": 12.912, "max_lat": 12.962,
            "min_lon": 77.605, "max_lon": 77.675,
            "center_lat": 12.937, "center_lon": 77.640
        })

    def get_dem_config(self, city_id: Optional[str] = None) -> Dict[str, Any]:
        cfg = self.get_city(city_id)
        return cfg.get("dem", {})

    def get_drainage_config(self, city_id: Optional[str] = None) -> Dict[str, Any]:
        cfg = self.get_city(city_id)
        return cfg.get("drainage", {})

    def get_roads_config(self, city_id: Optional[str] = None) -> Dict[str, Any]:
        cfg = self.get_city(city_id)
        return cfg.get("roads", {})

    def get_facilities(self, city_id: Optional[str] = None) -> List[Dict[str, Any]]:
        cfg = self.get_city(city_id)
        return cfg.get("facilities", {}).get("items", [])

    def get_sensors(self, city_id: Optional[str] = None) -> List[Dict[str, Any]]:
        cfg = self.get_city(city_id)
        return cfg.get("sensors", {}).get("items", [])

    def get_water_bodies(self, city_id: Optional[str] = None) -> List[Dict[str, Any]]:
        cfg = self.get_city(city_id)
        return cfg.get("water_bodies", {}).get("features", [])

    def get_buildings(self, city_id: Optional[str] = None) -> List[Dict[str, Any]]:
        cfg = self.get_city(city_id)
        return cfg.get("buildings", {}).get("items", [])

    def get_story(self, city_id: Optional[str] = None) -> Dict[str, Any]:
        cfg = self.get_city(city_id)
        raw_story = dict(cfg.get("story", {}))
        city_name = cfg.get("city", "Metropolitan")
        basin = cfg.get("focus_basin", {}).get("name", f"{city_name} Basin")
        hotspot = raw_story.get("hotspot_road", "Arterial Underpass Corridor")
        surcharge = raw_story.get("surcharge_node", "Primary Drainage Node M02")
        hosp_a = raw_story.get("hospital_origin", "General Hospital")
        hosp_b = raw_story.get("hospital_dest", "Emergency Trauma Center")
        bypass = raw_story.get("safe_bypass", "Elevated Bypass Corridor")
        high_m = raw_story.get("elevation_high", 915.0)
        low_m = raw_story.get("elevation_low", 875.0)
        poses = raw_story.get("camera_poses", {})

        stages = [
            {
                "id": 1, "title": "NORMAL URBAN BASELINE",
                "subtitle": f"{basin} ({city_name})",
                "narration": f"UFNS maintains continuous physics-based monitoring across {city_name}.",
                "camera": poses.get("city_view", {})
            },
            {
                "id": 2, "title": "HEAVY RAINFALL DETECTED",
                "subtitle": f"Convective Radar Precipitation Tracking ({city_name})",
                "narration": f"Severe convective precipitation enters {basin}.",
                "camera": poses.get("storm_focus", {})
            },
            {
                "id": 3, "title": "WHY HERE? ALTITUDE & CONTOURS",
                "subtitle": f"DEM Topographic Survey ({low_m}m - {high_m}m AMSL)",
                "narration": f"Elevation dictates where water accumulates. Slopes naturally to {low_m}m AMSL depression.",
                "camera": poses.get("altitude_focus", {})
            },
            {
                "id": 4, "title": "SURFACE RUNOFF CONVERGENCE",
                "subtitle": "Gravity-Driven Overland Sheet Flow",
                "narration": f"Runoff streams cascade downhill towards {hotspot}.",
                "camera": poses.get("runoff_focus", {})
            },
            {
                "id": 5, "title": "WATER ACCUMULATION & FLOOD FILL",
                "subtitle": "Hydrodynamic Inundation Expansion (0 -> 46.5 cm)",
                "narration": f"Surface water pools progressively along {hotspot}.",
                "camera": poses.get("flood_trough", {})
            },
            {
                "id": 6, "title": "SUBTERRANEAN DRAINAGE CONDUITS",
                "subtitle": "Stormwater Trunk Network Capacity",
                "narration": f"Beneath {city_name}, stormwater pipes transport water at high velocity.",
                "camera": poses.get("drainage_subterranean", {})
            },
            {
                "id": 7, "title": "DRAINAGE SURCHARGE & BACKFLOW",
                "subtitle": f"Underground Cutaway • {surcharge} (108% Load)",
                "narration": f"Conduit capacity exceeded at {surcharge}. Flow reverses up to street grade.",
                "camera": poses.get("surcharge_manhole", {})
            },
            {
                "id": 8, "title": f"ROAD IMPACT: {hotspot.upper()}",
                "subtitle": "Vehicular Clearance Limit Exceeded",
                "narration": f"Water depth reaches 46.5 cm on {hotspot}, exceeding 25 cm clearance.",
                "camera": poses.get("road_submerged", {})
            },
            {
                "id": 9, "title": "FLOOD-AWARE EMERGENCY ROUTING",
                "subtitle": f"{hosp_a} -> {hosp_b} ({bypass})",
                "narration": f"UFNS calculates a guaranteed 0% hazard bypass via {bypass}.",
                "camera": poses.get("route_tracking", {})
            },
            {
                "id": 10, "title": "UFNS COMPLETE FLOOD RESPONSE",
                "subtitle": f"Unified Command Center Synthesis ({city_name})",
                "narration": f"End-to-end operational nowcasting delivered across {city_name}.",
                "camera": poses.get("solution_overview", {})
            }
        ]

        raw_story["stages"] = stages
        return raw_story

    def get_data_provenance(self, city_id: Optional[str] = None) -> Dict[str, Any]:
        cfg = self.get_city(city_id)
        return cfg.get("data_sources", {})

    def get_metropolitan_overview(self) -> List[Dict[str, Any]]:
        overview = []
        for cid, cfg in self.cities.items():
            dem = cfg.get("dem", {})
            drain = cfg.get("drainage", {})
            roads = cfg.get("roads", {})
            fac = cfg.get("facilities", {}).get("items", [])
            rain = cfg.get("rainfall", {})
            overview.append({
                "city_id": cid,
                "city": cfg.get("city"),
                "state": cfg.get("state"),
                "basin_name": cfg.get("focus_basin", {}).get("name"),
                "area_sqkm": cfg.get("focus_basin", {}).get("area_sqkm"),
                "center": cfg.get("center"),
                "rainfall_rate_mm_hr": rain.get("default_intensity_mm_hr", 75.0),
                "rainfall_status": rain.get("status", "LIVE"),
                "elevation_range_m": f"{dem.get('min_elevation_m', 0)} - {dem.get('base_elevation_m', 0)}m AMSL",
                "drainage_nodes_count": len(drain.get("nodes", [])),
                "roads_count": len(roads.get("road_segments", [])),
                "hospitals_count": sum(1 for f in fac if f.get("type") == "HOSPITAL"),
                "is_active": (cid == self.active_city_id)
            })
        return overview

city_adapter = CityAdapter()
