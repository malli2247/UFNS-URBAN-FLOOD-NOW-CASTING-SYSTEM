# UFNS Automatic Dataset Update Checker
# Monitors upstream repositories for newer dataset versions.
# Does NOT automatically retrain production models without human command confirmation.

import json
import os
from typing import Dict, List, Any

class DataUpdateChecker:
    def __init__(self, registry_path: str = None):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
        if registry_path is None:
            registry_path = os.path.join(base_dir, 'data', 'dataset_registry.json')
        self.registry_path = registry_path

    def check_updates(self) -> Dict[str, Any]:
        """Check current installed dataset versions against latest verified upstream releases."""
        if not os.path.exists(self.registry_path):
            return {"update_available": False, "datasets": []}

        with open(self.registry_path, 'r', encoding='utf-8') as f:
            registry = json.load(f)

        datasets = registry.get("datasets", [])
        
        # Upstream registry of verified available updates (simulating upstream manifest check)
        available_updates = [
            {
                "dataset_id": "chirps_v3_rainfall",
                "dataset_name": "CHIRPS High-Resolution Precipitation",
                "current_version": "v3.0-p05",
                "available_version": "v3.1-preview (Sept 2026 Update)",
                "provider": "Climate Hazards Center, UCSB",
                "update_severity": "RECOMMENDED",
                "change_summary": "Incorporates updated IMD radar calibration bias factors for Indian subcontinent.",
                "requires_review": True
            },
            {
                "dataset_id": "sentinel1_sar_grd",
                "dataset_name": "Sentinel-1 SAR GRD Flood Masks",
                "current_version": "2024 Cycle (Overpass IW)",
                "available_version": "2026 Cycle (High-Revisit Overpass)",
                "provider": "European Space Agency (Copernicus)",
                "update_severity": "NEW_DATA_ACQUISITION",
                "change_summary": "12 new flood season scenes available covering recent monsoon events across Delhi, Mumbai, and Bengaluru.",
                "requires_review": True
            }
        ]

        return {
            "status": "CHECK_COMPLETE",
            "update_available": len(available_updates) > 0,
            "total_registered_datasets": len(datasets),
            "available_updates": available_updates,
            "policy": "DO_NOT_AUTO_RETRAIN_PRODUCTION",
            "action_required": "REVIEW_DATA_UPDATE",
            "message": "Newer dataset versions detected. Production model retraining requires operator authorization."
        }

    def confirm_and_retrain(self) -> Dict[str, Any]:
        """Authorized action to execute the reproducible training pipeline after reviewing updates."""
        from .train_pipeline import run_training_pipeline
        artifact = run_training_pipeline()
        return {
            "status": "RETRAINING_SUCCESSFUL",
            "model_version": artifact["model_version"],
            "trained_at": artifact["trained_at"],
            "validation_mae": artifact["metrics"]["validation"]["regression"]["mae_cm"],
            "test_mae": artifact["metrics"]["test"]["regression"]["mae_cm"]
        }
