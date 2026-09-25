from fastapi import APIRouter
from ..simulation.state_manager import state_manager

router = APIRouter(prefix="/api/drainage", tags=["drainage"])

@router.get("/network")
def get_drainage_network():
    sm = state_manager
    surch_cnt = sum(1 for n in sm.latest_nodes if n.get("is_surcharged", False))
    return {
        "mode": "ESTIMATED DRAINAGE NETWORK",
        "nodes": sm.latest_nodes,
        "edges": sm.latest_edges,
        "total_surcharged_nodes": surch_cnt,
        "disclaimer": "Coupled 2-way stormwater graph with Manning full pipe flow equation & surface backflow surcharge."
    }

@router.get("/status")
def get_drainage_status():
    sm = state_manager
    surcharged_nodes = [n for n in sm.latest_nodes if n.get("is_surcharged", False)]
    warning_edges = [e for e in sm.latest_edges if e.get("status") in ["WARNING", "SURCHARGED"]]
    total_spill_vol = sum(n.get("surcharge_volume_m3", 0.0) for n in surcharged_nodes)
    return {
        "surcharged_nodes_count": len(surcharged_nodes),
        "warning_conduits_count": len(warning_edges),
        "total_backflow_surcharge_m3": round(total_spill_vol, 1),
        "surcharged_nodes": surcharged_nodes,
        "conduits_above_85pct_utilization": warning_edges
    }
