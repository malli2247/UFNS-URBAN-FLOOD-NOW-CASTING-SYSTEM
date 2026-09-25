# UFNS Flood-Safe Emergency Routing Engine
from typing import Dict, List, Any, Optional
import math
import networkx as nx
from ..config import VEHICLE_CLEARANCES

class FloodSafeRouter:
    def __init__(self, roads_config: Optional[Dict[str, Any]] = None):
        self.roads_config = roads_config or {}
        self.road_graph = nx.Graph()
        self._build_road_network()

    def _build_road_network(self):
        intersections = self.roads_config.get("intersections")
        road_segments = self.roads_config.get("road_segments")

        if not intersections or not road_segments:
            intersections = {
                "INT-01": {"name": "Hosur Road Junction", "lat": 12.923, "lon": 77.618},
                "INT-02": {"name": "Koramangala Sony World", "lat": 12.935, "lon": 77.626},
                "INT-03": {"name": "Koramangala 80ft / 100ft Corner", "lat": 12.938, "lon": 77.620},
                "INT-04": {"name": "Ejipura Signal", "lat": 12.943, "lon": 77.630},
                "INT-05": {"name": "Intermediate Ring Road Junction", "lat": 12.946, "lon": 77.639},
                "INT-06": {"name": "Agara Junction", "lat": 12.922, "lon": 77.638},
                "INT-07": {"name": "HSR 27th Main", "lat": 12.915, "lon": 77.646},
                "INT-08": {"name": "Sarjapur Road / ORR Iblur Junction", "lat": 12.926, "lon": 77.660},
                "INT-09": {"name": "EcoSpace Outer Ring Road", "lat": 12.931, "lon": 77.671},
                "INT-10": {"name": "Bellandur Central Crossing", "lat": 12.940, "lon": 77.665},
                "INT-11": {"name": "Rainbow Drive Access Road", "lat": 12.915, "lon": 77.672},
                "INT-12": {"name": "Marathahalli ORR Bridge", "lat": 12.955, "lon": 77.675},
                "INT-13": {"name": "St. John Hospital Emergency Gate", "lat": 12.929, "lon": 77.618},
                "INT-14": {"name": "Koramangala Police Station", "lat": 12.931, "lon": 77.624},
                "INT-15": {"name": "Wipro Sarjapur Campus Gate", "lat": 12.919, "lon": 77.653},
                "INT-16": {"name": "Sakra World Hospital Gate", "lat": 12.928, "lon": 77.682},
            }
            roads = [
                ("INT-01", "INT-13", {"road_id": "R01", "name": "Hosur Road Arterial", "length_km": 0.9, "speed_kmh": 45, "road_type": "PRIMARY"}),
                ("INT-13", "INT-14", {"road_id": "R02", "name": "St. John Link Road", "length_km": 0.8, "speed_kmh": 40, "road_type": "SECONDARY"}),
                ("INT-14", "INT-02", {"road_id": "R03", "name": "Koramangala 4th Block Way", "length_km": 0.7, "speed_kmh": 35, "road_type": "SECONDARY"}),
                ("INT-02", "INT-03", {"road_id": "R04", "name": "Koramangala 80ft Road", "length_km": 0.9, "speed_kmh": 40, "road_type": "PRIMARY"}),
                ("INT-02", "INT-04", {"road_id": "R05", "name": "Ejipura Main Road", "length_km": 1.1, "speed_kmh": 35, "road_type": "SECONDARY"}),
                ("INT-04", "INT-05", {"road_id": "R06", "name": "Intermediate Ring Road Underpass", "length_km": 1.2, "speed_kmh": 50, "road_type": "PRIMARY"}),
                ("INT-02", "INT-06", {"road_id": "R07", "name": "Sarjapur - Agara Link", "length_km": 1.8, "speed_kmh": 45, "road_type": "PRIMARY"}),
                ("INT-06", "INT-07", {"road_id": "R08", "name": "Agara - HSR 27th Main", "length_km": 1.1, "speed_kmh": 40, "road_type": "SECONDARY"}),
                ("INT-07", "INT-15", {"road_id": "R09", "name": "HSR to Wipro Sarjapur Way", "length_km": 1.2, "speed_kmh": 40, "road_type": "SECONDARY"}),
                ("INT-15", "INT-08", {"road_id": "R10", "name": "Sarjapur Road Arterial", "length_km": 1.4, "speed_kmh": 45, "road_type": "PRIMARY"}),
                ("INT-06", "INT-08", {"road_id": "R11", "name": "Agara - Iblur Outer Ring Road", "length_km": 2.2, "speed_kmh": 55, "road_type": "PRIMARY"}),
                ("INT-05", "INT-10", {"road_id": "R12", "name": "Challaghatta - Bellandur Bypass", "length_km": 2.4, "speed_kmh": 50, "road_type": "ELEVATED_BYPASS"}),
                ("INT-08", "INT-09", {"road_id": "R13", "name": "EcoSpace ORR Underpass Road", "length_km": 1.5, "speed_kmh": 50, "road_type": "PRIMARY"}),
                ("INT-09", "INT-10", {"road_id": "R14", "name": "Bellandur Lake Overpass", "length_km": 1.3, "speed_kmh": 45, "road_type": "SECONDARY"}),
                ("INT-08", "INT-11", {"road_id": "R15", "name": "Rainbow Drive Low-Lying Access", "length_km": 1.4, "speed_kmh": 30, "road_type": "LOCAL"}),
                ("INT-11", "INT-16", {"road_id": "R16", "name": "Carmelaram - Sakra Link", "length_km": 1.7, "speed_kmh": 40, "road_type": "SECONDARY"}),
                ("INT-09", "INT-16", {"road_id": "R17", "name": "Devarabisanahalli Tech Corridor", "length_km": 1.3, "speed_kmh": 45, "road_type": "PRIMARY"}),
                ("INT-10", "INT-12", {"road_id": "R18", "name": "Marathahalli Elevated Expressway", "length_km": 1.9, "speed_kmh": 60, "road_type": "ELEVATED_BYPASS"}),
                ("INT-03", "INT-04", {"road_id": "R19", "name": "Koramangala 100ft Elevated Way", "length_km": 1.0, "speed_kmh": 45, "road_type": "SECONDARY"}),
                ("INT-16", "INT-12", {"road_id": "R20", "name": "Kadubeesanahalli ORR Overpass", "length_km": 2.1, "speed_kmh": 55, "road_type": "ELEVATED_BYPASS"}),
            ]
            for node_id, data in intersections.items():
                self.road_graph.add_node(node_id, **data)
            for u, v, attrs in roads:
                self.road_graph.add_edge(u, v, **attrs)
        else:
            for node_id, data in intersections.items():
                self.road_graph.add_node(node_id, **data)
            for r in road_segments:
                u = r["u"]
                v = r["v"]
                attrs = {
                    "road_id": r["road_id"],
                    "name": r["name"],
                    "length_km": r["length_km"],
                    "speed_kmh": r["speed_kmh"],
                    "road_type": r["road_type"]
                }
                self.road_graph.add_edge(u, v, **attrs)

    def calculate_routes(self, start_lat: float, start_lon: float, dest_lat: float, dest_lon: float,
                         vehicle_type: str, road_depth_map: Dict[str, float]) -> Dict[str, Any]:
        clearance = VEHICLE_CLEARANCES.get(vehicle_type.lower(), 20.0)
        start_node = self._find_nearest_node(start_lat, start_lon)
        dest_node = self._find_nearest_node(dest_lat, dest_lon)
        
        # Identify all avoided edges in the network exceeding clearance
        avoided_edges = []
        for u, v, data in self.road_graph.edges(data=True):
            rid = data["road_id"]
            d_cm = road_depth_map.get(rid, 0.0)
            if d_cm > clearance:
                u_node = self.road_graph.nodes[u]
                v_node = self.road_graph.nodes[v]
                avoided_edges.append({
                    "road_id": rid,
                    "road_name": data["name"],
                    "length_km": data["length_km"],
                    "predicted_depth_cm": round(d_cm, 1),
                    "clearance_cm": clearance,
                    "status": "IMPASSABLE",
                    "reason": f"Predicted water depth of {d_cm:.1f} cm exceeds {vehicle_type} threshold ({clearance} cm).",
                    "coordinates": [[u_node["lat"], u_node["lon"]], [v_node["lat"], v_node["lon"]]]
                })

        route_types = ["shortest", "fastest", "safest", "emergency"]
        computed_routes = {}

        for r_type in route_types:
            weight_graph = nx.Graph()
            
            for u, v, data in self.road_graph.edges(data=True):
                rid = data["road_id"]
                d_cm = road_depth_map.get(rid, 0.0)
                length_km = data["length_km"]
                speed_kmh = data["speed_kmh"]
                base_time_min = (length_km / max(10, speed_kmh)) * 60.0
                
                # 1. SHORTEST PATH: operates on distance regardless of clearance (so it can demonstrate ordinary shortest route)
                if r_type == "shortest":
                    weight_graph.add_edge(u, v, weight=length_km, depth=d_cm, road_id=rid, length_km=length_km, speed_kmh=speed_kmh, data=data)
                    continue

                # 2. FASTEST, SAFEST, EMERGENCY: strictly exclude impassable edges
                if d_cm > clearance:
                    continue  # Impassable edge excluded

                if r_type == "fastest":
                    speed_factor = max(0.15, 1.0 - 0.75 * (d_cm / max(1.0, clearance)))
                    effective_speed = max(8.0, speed_kmh * speed_factor)
                    w = (length_km / effective_speed) * 60.0
                elif r_type == "safest":
                    depth_penalty = 1.0 + ((d_cm / 5.0) ** 2) * 0.45
                    w = base_time_min * depth_penalty + (d_cm * 1.5)
                else:  # emergency
                    elevated_bonus = 0.70 if "ELEVATED" in data.get("road_type", "") else 1.0
                    speed_factor = max(0.20, 1.0 - 0.65 * (d_cm / max(1.0, clearance)))
                    w = ((base_time_min * elevated_bonus) / speed_factor) + (d_cm * 0.5)

                weight_graph.add_edge(u, v, weight=w, depth=d_cm, road_id=rid, length_km=length_km, speed_kmh=speed_kmh, data=data)

            try:
                path = nx.shortest_path(weight_graph, source=start_node, target=dest_node, weight="weight")
                coords = [[self.road_graph.nodes[n]["lat"], self.road_graph.nodes[n]["lon"]] for n in path]
                geojson_coords = [[self.road_graph.nodes[n]["lon"], self.road_graph.nodes[n]["lat"]] for n in path]
                
                tot_dist = 0.0
                tot_time = 0.0
                max_d = 0.0
                depths_list = []
                exposure_km = 0.0
                blocked_edges_encountered = []
                road_breakdown = []

                for i in range(len(path) - 1):
                    u_n = path[i]
                    v_n = path[i+1]
                    edge_w = weight_graph[u_n][v_n]
                    l_km = edge_w["length_km"]
                    d = edge_w["depth"]
                    s_kmh = edge_w["speed_kmh"]
                    
                    # Compute realistic traversal time considering water drag
                    speed_factor = max(0.15, 1.0 - 0.75 * (d / max(1.0, clearance)))
                    effective_speed = max(8.0, s_kmh * speed_factor)
                    seg_time = (l_km / effective_speed) * 60.0
                    
                    tot_dist += l_km
                    tot_time += seg_time
                    max_d = max(max_d, d)
                    depths_list.append(d)
                    if d > 5.0:
                        exposure_km += l_km
                    
                    if d > clearance:
                        blocked_edges_encountered.append({
                            "road_id": edge_w["road_id"],
                            "road_name": edge_w["data"]["name"],
                            "depth_cm": round(d, 1)
                        })

                    # Segment risk
                    seg_risk = "SAFE" if d <= 5.0 else ("LOW" if d <= 12.0 else ("MODERATE" if d <= 25.0 else ("HIGH" if d <= 40.0 else "CRITICAL")))
                    
                    road_breakdown.append({
                        "road_id": edge_w["road_id"],
                        "road_name": edge_w["data"]["name"],
                        "from_node": self.road_graph.nodes[u_n]["name"],
                        "to_node": self.road_graph.nodes[v_n]["name"],
                        "length_km": round(l_km, 2),
                        "predicted_depth_cm": round(d, 1),
                        "speed_kmh": round(effective_speed, 1),
                        "travel_time_min": round(seg_time, 1),
                        "risk_level": seg_risk,
                        "status": "IMPASSABLE" if d > clearance else ("CAUTION" if d > 12 else "PASSABLE")
                    })

                avg_d = sum(depths_list) / max(1, len(depths_list))
                is_passable = len(blocked_edges_encountered) == 0

                # Risk classification
                if not is_passable or max_d > 40:
                    risk = "CRITICAL" if not is_passable else "HIGH"
                elif max_d > 25:
                    risk = "HIGH"
                elif max_d > 12:
                    risk = "MODERATE"
                elif max_d > 5:
                    risk = "LOW"
                else:
                    risk = "SAFE"

                warning = None
                if not is_passable:
                    worst_road = blocked_edges_encountered[0]
                    warning = f"⚠️ SHORTEST ROUTE NOT RECOMMENDED: Predicted water depth of {worst_road['depth_cm']:.1f} cm on {worst_road['road_name']} exceeds {vehicle_type} prototype threshold ({clearance} cm)."

                computed_routes[r_type] = {
                    "route_type": r_type,
                    "title": r_type.replace("_", " ").title(),
                    "distance_km": round(tot_dist, 2),
                    "travel_time_min": round(tot_time, 1),
                    "maximum_water_depth_cm": round(max_d, 1),
                    "average_flood_depth_cm": round(avg_d, 1),
                    "flood_exposure_km": round(exposure_km, 2),
                    "risk_level": risk,
                    "risk_score": int(min(100, max_d * 2.2 + (exposure_km * 8))),
                    "passable": is_passable,
                    "warning": warning,
                    "coordinates": coords,
                    "geometry": {
                        "type": "LineString",
                        "coordinates": geojson_coords
                    },
                    "roads": road_breakdown,
                    "blocked_edges_encountered": blocked_edges_encountered,
                    "avoided_roads": [e for e in avoided_edges if e["road_id"] not in [r["road_id"] for r in road_breakdown]]
                }
            except Exception:
                computed_routes[r_type] = {
                    "route_type": r_type,
                    "title": r_type.replace("_", " ").title(),
                    "distance_km": 0.0,
                    "travel_time_min": 0.0,
                    "maximum_water_depth_cm": 0.0,
                    "average_flood_depth_cm": 0.0,
                    "flood_exposure_km": 0.0,
                    "risk_level": "CRITICAL",
                    "risk_score": 100,
                    "passable": False,
                    "warning": f"No traversable {r_type} route found within {vehicle_type} clearance ({clearance} cm).",
                    "coordinates": [],
                    "geometry": {"type": "LineString", "coordinates": []},
                    "roads": [],
                    "blocked_edges_encountered": [],
                    "avoided_roads": avoided_edges
                }

        # Dynamic Recommendation Engine
        rec_type = "emergency" if vehicle_type.lower() in ["ambulance", "fire_truck", "police"] else "safest"
        if not computed_routes.get(rec_type, {}).get("passable", False):
            # Fallback to safest if emergency is impassable
            rec_type = "safest" if computed_routes.get("safest", {}).get("passable", False) else "fastest"

        shortest_passable = computed_routes.get("shortest", {}).get("passable", True)
        if not shortest_passable:
            rec_reason = f"Shortest route encounters flooded roads exceeding {vehicle_type} clearance ({clearance} cm). {rec_type.title()} route is recommended as it bypasses deep flood pockets and provides the lowest safe response time."
        else:
            rec_reason = f"Provides the lowest safe response time while avoiding roads predicted to exceed {vehicle_type} prototype clearance."

        return {
            "origin": {"lat": start_lat, "lon": start_lon, "name": self.road_graph.nodes[start_node]["name"], "node_id": start_node},
            "destination": {"lat": dest_lat, "lon": dest_lon, "name": self.road_graph.nodes[dest_node]["name"], "node_id": dest_node},
            "vehicle_type": vehicle_type,
            "vehicle_clearance_cm": clearance,
            "shortest": computed_routes.get("shortest"),
            "fastest": computed_routes.get("fastest"),
            "safest": computed_routes.get("safest"),
            "emergency": computed_routes.get("emergency"),
            "routes": [
                computed_routes.get("shortest"),
                computed_routes.get("fastest"),
                computed_routes.get("safest"),
                computed_routes.get("emergency")
            ],
            "recommended_route": rec_type,
            "recommendation_reason": rec_reason,
            "avoided_edges": avoided_edges,
            "disclaimer": "Prototype flood traversal thresholds. Operational clearances require verification by disaster response authorities."
        }

    def _find_nearest_node(self, lat: float, lon: float) -> str:
        best_n = "INT-01"
        best_d = 999.0
        for n, data in self.road_graph.nodes(data=True):
            d = math.sqrt((lat - data["lat"])**2 + (lon - data["lon"])**2)
            if d < best_d:
                best_d = d
                best_n = n
        return best_n
