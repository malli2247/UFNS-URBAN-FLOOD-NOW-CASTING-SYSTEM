from fastapi import APIRouter
from ..simulation.state_manager import state_manager

router = APIRouter(prefix="/api/calibration", tags=["calibration"])

@router.post("/run")
def trigger_calibration():
    sm = state_manager
    obs = sm.sensor_store.get_all_ground_truth()
    result = sm.calibrator.run_calibration(obs)
    # Apply calibrated factor to surface grid
    sm.surface_grid.calibration_factor = result["calibrated_factor"]
    sm._recompute_state()
    return result
