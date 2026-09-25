import pytest
import math
import numpy as np
from app.simulation.physics_units import (
    mm_per_hr_to_m_per_s,
    m_per_s_to_mm_per_hr,
    volume_to_depth_cm,
    depth_cm_to_volume_m3,
    manning_pipe_capacity_m3_s
)
from app.simulation.surface_runoff import UrbanSurfaceGrid
from app.simulation.drainage_graph import UrbanDrainageNetwork
from app.simulation.routing_engine import FloodSafeRouter
from app.models.ml_interfaces import ModelEvaluator
from app.simulation.calibration import CalibrationEngine

def test_unit_conversions():
    # 36 mm/hr should equal 1e-5 m/s
    m_s = mm_per_hr_to_m_per_s(36.0)
    assert math.isclose(m_s, 1e-5, rel_tol=1e-4)
    assert math.isclose(m_per_s_to_mm_per_hr(m_s), 36.0, rel_tol=1e-4)
    
    # 100 m3 over 1000 m2 is 0.1 m = 10 cm
    depth_cm = volume_to_depth_cm(100.0, 1000.0)
    assert math.isclose(depth_cm, 10.0, rel_tol=1e-4)
    assert math.isclose(depth_cm_to_volume_m3(depth_cm, 1000.0), 100.0, rel_tol=1e-4)

def test_manning_pipe_capacity():
    # 1.5m diameter, 0.005 slope
    cap = manning_pipe_capacity_m3_s(1.5, 0.005)
    assert cap > 0.0
    assert 2.0 < cap < 6.0

def test_surface_grid_runoff():
    grid = UrbanSurfaceGrid()
    assert grid.elevation_matrix.shape == (16, 16)
    assert grid.slope_matrix.shape == (16, 16)
    depth = grid.calculate_runoff_depth(60.0, 15)
    assert depth.shape == (16, 16)
    assert depth.max() > 0.0

def test_drainage_network_creation():
    dn = UrbanDrainageNetwork()
    assert dn.graph.number_of_nodes() == 12
    assert dn.graph.number_of_edges() >= 10

def test_router_avoidance():
    router = FloodSafeRouter()
    # If Rainbow Drive road (R15) has 45 cm depth, standard car (clearance 20 cm) should avoid it
    road_depths = {"R15": 45.0, "R13": 42.0}
    res = router.calculate_routes(12.923, 77.618, 12.928, 77.682, "ambulance", road_depths)
    assert "shortest" in res
    assert "fastest" in res
    assert "safest" in res
    assert "emergency" in res
    assert len(res["routes"]) == 4
    assert res["shortest"]["distance_km"] > 0
    assert len(res["avoided_edges"]) > 0
    # Check that avoided road is recorded
    avoided_ids = [a["road_id"] for a in res["avoided_edges"]]
    assert "R13" in avoided_ids

def test_model_evaluator_metrics():
    preds = [10.0, 20.0, 30.0, 40.0]
    obs = [12.0, 19.0, 28.0, 42.0]
    metrics = ModelEvaluator.evaluate_regression(preds, obs)
    assert metrics["mae"] > 0
    assert metrics["rmse"] > 0
    assert metrics["r2"] > 0.90

def test_calibration_engine():
    calibrator = CalibrationEngine()
    dummy_obs = [
        {"observed_depth_cm": 25.0},
        {"observed_depth_cm": 45.0},
        {"observed_depth_cm": 15.0}
    ]
    res = calibrator.run_calibration(dummy_obs)
    assert res["status"] == "CALIBRATED_OPTIMAL"
    assert res["after_mae_cm"] < res["before_mae_cm"]

def test_flow_directions_and_vectors():
    from app.simulation.surface_runoff import UrbanSurfaceGrid
    grid = UrbanSurfaceGrid()
    assert grid.compass_matrix.shape == (16, 16)
    assert grid.compass_matrix[0, 0] in ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    assert grid.flow_vx.shape == (16, 16)
    assert grid.flow_vy.shape == (16, 16)

def test_endpoints_via_testclient():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    
    # Test Roads endpoint
    res_roads = client.get("/api/roads")
    assert res_roads.status_code == 200
    roads_data = res_roads.json()
    assert roads_data["total_roads"] == 20
    assert "roads" in roads_data
    assert roads_data["roads"][0]["travel_status"] in ["OPEN", "CAUTION", "HIGH_RISK", "BLOCKED"]
    
    # Test Facilities endpoint
    res_fac = client.get("/api/facilities")
    assert res_fac.status_code == 200
    fac_data = res_fac.json()
    assert fac_data["total_facilities"] >= 8
    assert fac_data["hospitals_count"] >= 2
    
    # Test Radar endpoint
    res_radar = client.get("/api/radar")
    assert res_radar.status_code == 200
    radar_data = res_radar.json()
    assert len(radar_data["storm_cells"]) >= 2
    
    # Test Risk Zones endpoint
    res_zones = client.get("/api/flood/risk-zones")
    assert res_zones.status_code == 200
    zones_data = res_zones.json()
    assert len(zones_data["risk_zones"]) >= 4

