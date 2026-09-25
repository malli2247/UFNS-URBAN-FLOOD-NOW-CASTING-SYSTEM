# UFNS Stormwater Drainage Graph Network
from typing import Dict, List, Any, Optional
import networkx as nx
from .physics_units import manning_pipe_capacity_m3_s

class UrbanDrainageNetwork:
    def __init__(self, capacity_multiplier: float = 1.0, drainage_config: Optional[Dict[str, Any]] = None):
        self.capacity_multiplier = capacity_multiplier
        self.drainage_config = drainage_config or {}
        self.graph = nx.DiGraph()
        self._build_network()

    def _build_network(self):
        nodes_data = self.drainage_config.get("nodes")
        pipes_data = self.drainage_config.get("pipes")

        if not nodes_data or not pipes_data:
            nodes_data = [
                {"id": "M01", "name": "Hosur Road Primary Inlet", "node_type": "Inlet", "lat": 12.924, "lon": 77.618, "elev": 912.0, "inlet_cap": 2.5, "row": 3, "col": 2},
                {"id": "M02", "name": "Koramangala 80ft Junction", "node_type": "Junction", "lat": 12.934, "lon": 77.625, "elev": 905.0, "inlet_cap": 3.2, "row": 5, "col": 4},
                {"id": "M03", "name": "Sony World Crossing Node", "node_type": "Manhole", "lat": 12.938, "lon": 77.632, "elev": 898.0, "inlet_cap": 4.0, "row": 6, "col": 6},
                {"id": "M04", "name": "Intermediate Ring Road Sump", "node_type": "Junction", "lat": 12.946, "lon": 77.639, "elev": 892.0, "inlet_cap": 4.5, "row": 8, "col": 7},
                {"id": "M05", "name": "Ejipura Trunk Collector", "node_type": "Manhole", "lat": 12.942, "lon": 77.628, "elev": 896.0, "inlet_cap": 3.8, "row": 7, "col": 5},
                {"id": "M06", "name": "Agara Lake Inflow Sluice", "node_type": "Inlet", "lat": 12.922, "lon": 77.636, "elev": 888.0, "inlet_cap": 5.0, "row": 2, "col": 6},
                {"id": "M07", "name": "HSR Layout Sector 1 Drain", "node_type": "Manhole", "lat": 12.916, "lon": 77.644, "elev": 885.0, "inlet_cap": 3.5, "row": 1, "col": 8},
                {"id": "M08", "name": "Sarjapur Road Underpass Pit", "node_type": "Manhole", "lat": 12.925, "lon": 77.654, "elev": 882.0, "inlet_cap": 3.0, "row": 4, "col": 10},
                {"id": "M09", "name": "Iblur Junction Central Chamber", "node_type": "Junction", "lat": 12.929, "lon": 77.660, "elev": 880.0, "inlet_cap": 4.2, "row": 5, "col": 12},
                {"id": "M10", "name": "EcoSpace ORR Storm Conduit", "node_type": "Manhole", "lat": 12.933, "lon": 77.668, "elev": 878.0, "inlet_cap": 3.8, "row": 6, "col": 14},
                {"id": "M11", "name": "Rainbow Drive Storm Bypass", "node_type": "Inlet", "lat": 12.915, "lon": 77.671, "elev": 876.0, "inlet_cap": 2.8, "row": 1, "col": 14},
                {"id": "M12", "name": "Bellandur Lake Outfall Sluice", "node_type": "Outfall", "lat": 12.942, "lon": 77.663, "elev": 874.0, "inlet_cap": 7.0, "row": 9, "col": 13},
            ]
            pipes_data = [
                {"from": "M01", "to": "M02", "pipe_id": "P-01", "diameter_m": 1.2, "slope": 0.007, "length_m": 1100},
                {"from": "M02", "to": "M03", "pipe_id": "P-02", "diameter_m": 1.5, "slope": 0.006, "length_m": 850},
                {"from": "M05", "to": "M03", "pipe_id": "P-03", "diameter_m": 1.2, "slope": 0.005, "length_m": 650},
                {"from": "M03", "to": "M04", "pipe_id": "P-04", "diameter_m": 1.8, "slope": 0.005, "length_m": 920},
                {"from": "M06", "to": "M07", "pipe_id": "P-05", "diameter_m": 1.4, "slope": 0.004, "length_m": 780},
                {"from": "M07", "to": "M08", "pipe_id": "P-06", "diameter_m": 1.5, "slope": 0.004, "length_m": 1100},
                {"from": "M08", "to": "M09", "pipe_id": "P-07", "diameter_m": 1.6, "slope": 0.003, "length_m": 820},
                {"from": "M04", "to": "M09", "pipe_id": "P-08", "diameter_m": 2.0, "slope": 0.004, "length_m": 1450},
                {"from": "M09", "to": "M10", "pipe_id": "P-09", "diameter_m": 1.8, "slope": 0.003, "length_m": 900},
                {"from": "M11", "to": "M10", "pipe_id": "P-10", "diameter_m": 1.4, "slope": 0.002, "length_m": 850},
                {"from": "M10", "to": "M12", "pipe_id": "P-11", "diameter_m": 2.4, "slope": 0.003, "length_m": 1200},
            ]

        for n in nodes_data:
            self.graph.add_node(n["id"], **n)

        for p in pipes_data:
            u = p["from"]
            v = p["to"]
            cap = manning_pipe_capacity_m3_s(p["diameter_m"], p["slope"]) * self.capacity_multiplier
            attrs = {
                "pipe_id": p["pipe_id"],
                "diameter_m": p["diameter_m"],
                "slope": p["slope"],
                "length_m": p["length_m"],
                "capacity_m3_s": round(cap, 2)
            }
            self.graph.add_edge(u, v, **attrs)
