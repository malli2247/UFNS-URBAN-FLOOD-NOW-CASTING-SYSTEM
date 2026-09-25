# AQUILA Bidirectional Surface <-> Drainage Network Coupler
from typing import Dict, List, Any, Tuple
import numpy as np
import networkx as nx
from .physics_units import volume_to_depth_cm, depth_cm_to_volume_m3
from ..config import CELL_AREA_M2

class BidirectionalCoupler:
    def __init__(self, drainage_network):
        self.drainage = drainage_network

    def couple(self, surface_depth_matrix: np.ndarray, rainfall_intensity_mm_hr: float) -> Tuple[np.ndarray, List[Dict[str, Any]], List[Dict[str, Any]]]:
        updated_surface_depth = surface_depth_matrix.copy()
        nodes_out = []
        edges_out = []
        
        inflow_dict = {}
        for node_id, data in self.drainage.graph.nodes(data=True):
            r, c = data["row"], data["col"]
            cur_depth_cm = surface_depth_matrix[r, c]
            cur_volume_m3 = depth_cm_to_volume_m3(cur_depth_cm, CELL_AREA_M2)
            dt_sec = 15 * 60.0
            max_inlet_vol = data["inlet_cap"] * dt_sec
            captured_vol = min(cur_volume_m3, max_inlet_vol)
            
            updated_surface_depth[r, c] = max(0.0, cur_depth_cm - volume_to_depth_cm(captured_vol, CELL_AREA_M2))
            inflow_dict[node_id] = captured_vol / dt_sec

        flow_accum = {node_id: inflow_dict[node_id] for node_id in self.drainage.graph.nodes}
        try:
            top_order = list(nx.topological_sort(self.drainage.graph))
        except Exception:
            top_order = list(self.drainage.graph.nodes)

        surcharge_volume_dict = {n: 0.0 for n in top_order}
        
        for u in top_order:
            out_edges = list(self.drainage.graph.out_edges(u, data=True))
            if not out_edges:
                continue
            split_flow = flow_accum[u] / len(out_edges)
            for _, v, edge_data in out_edges:
                cap = edge_data["capacity_m3_s"]
                assigned_flow = round(split_flow, 2)
                util = round((assigned_flow / max(0.1, cap)) * 100.0, 1)
                
                if assigned_flow > cap:
                    status = "SURCHARGED"
                    surplus_rate = assigned_flow - cap
                    surcharge_vol = surplus_rate * (15 * 60.0)
                    surcharge_volume_dict[u] += surcharge_vol
                    actual_flow = cap
                elif util > 85.0:
                    status = "WARNING"
                    actual_flow = assigned_flow
                else:
                    status = "NORMAL"
                    actual_flow = assigned_flow
                
                flow_accum[v] += actual_flow
                edges_out.append({
                    "edge_id": edge_data["pipe_id"],
                    "from_node": u,
                    "to_node": v,
                    "diameter_m": edge_data["diameter_m"],
                    "slope": edge_data["slope"],
                    "capacity_m3_s": cap,
                    "flow_m3_s": assigned_flow,
                    "utilization_pct": util,
                    "status": status
                })

        for node_id, data in self.drainage.graph.nodes(data=True):
            r, c = data["row"], data["col"]
            surch_vol = surcharge_volume_dict[node_id]
            is_surch = surch_vol > 0.0
            spill_depth = volume_to_depth_cm(surch_vol, CELL_AREA_M2)
            updated_surface_depth[r, c] += spill_depth
            
            nodes_out.append({
                "node_id": node_id,
                "name": data["name"],
                "node_type": data.get("node_type", "Manhole"),
                "lat": data["lat"],
                "lon": data["lon"],
                "elevation_m": data["elev"],
                "inlet_capacity_m3_s": data["inlet_cap"],
                "current_inflow_m3_s": round(inflow_dict[node_id], 2),
                "is_surcharged": is_surch,
                "surcharge_volume_m3": round(surch_vol, 1),
                "spill_depth_cm": round(spill_depth, 1)
            })

        return np.round(updated_surface_depth, 1), nodes_out, edges_out
