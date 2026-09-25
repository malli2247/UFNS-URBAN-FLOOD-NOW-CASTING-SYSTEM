# UFNS Model Governance, Provenance, and Lifecycle REST API
import json
import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from ..ml.inference_engine import get_inference_engine
from ..ml.update_checker import DataUpdateChecker

router = APIRouter(prefix="/api/model", tags=["model-governance"])

class PointInferenceRequest(BaseModel):
    rainfall_1h: float
    rainfall_3h: Optional[float] = None
    rainfall_6h: Optional[float] = None
    rainfall_24h: Optional[float] = None
    elevation: float
    slope: float
    flow_direction: Optional[float] = 90.0
    flow_accumulation: Optional[float] = 500.0
    building_density: Optional[float] = 0.85
    road_density: Optional[float] = 0.80
    distance_to_drainage: Optional[float] = 30.0
    drainage_capacity: Optional[float] = 2.5
    drainage_load: Optional[float] = 1.0

@router.get("/status")
def get_model_status():
    """Retrieve operational status, training periods, and authentic test metrics."""
    eng = get_inference_engine()
    return eng.get_status()

@router.get("/card")
def get_model_card():
    """Retrieve comprehensive Model Card detailing training, validation, and physical constraints."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    card_path = os.path.join(base_dir, 'models', 'flood_prediction', 'model_card.json')
    if not os.path.exists(card_path):
        raise HTTPException(status_code=404, detail="Model Card not found. Run training pipeline first.")
    with open(card_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@router.get("/provenance")
def get_data_provenance():
    """Retrieve verified Data Version Registry tracking all external sources, versions, and checksums."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    registry_path = os.path.join(base_dir, 'data', 'dataset_registry.json')
    if not os.path.exists(registry_path):
        raise HTTPException(status_code=404, detail="Dataset Registry not found.")
    with open(registry_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@router.get("/updates")
def check_dataset_updates():
    """Check for newly available dataset versions without auto-retraining."""
    checker = DataUpdateChecker()
    return checker.check_updates()

@router.post("/retrain")
def retrain_model_with_confirmation(payload: Dict[str, Any] = Body(default={})):
    """Operator-confirmed training pipeline execution upon reviewing dataset updates."""
    checker = DataUpdateChecker()
    result = checker.confirm_and_retrain()
    # Reload singleton engine with newly trained weights
    eng = get_inference_engine()
    eng.load_model()
    return result

@router.post("/predict-point")
def predict_single_point(req: PointInferenceRequest):
    """Run real-time inference on a custom feature vector."""
    eng = get_inference_engine()
    feat = {
        "rainfall_1h": req.rainfall_1h,
        "rainfall_3h": req.rainfall_3h or (req.rainfall_1h * 1.5),
        "rainfall_6h": req.rainfall_6h or (req.rainfall_1h * 1.8),
        "rainfall_24h": req.rainfall_24h or (req.rainfall_1h * 2.2),
        "elevation": req.elevation,
        "slope": req.slope,
        "flow_direction": req.flow_direction,
        "flow_accumulation": req.flow_accumulation,
        "building_density": req.building_density,
        "road_density": req.road_density,
        "distance_to_drainage": req.distance_to_drainage,
        "drainage_capacity": req.drainage_capacity,
        "drainage_load": req.drainage_load
    }
    return eng.predict_cell(feat)
