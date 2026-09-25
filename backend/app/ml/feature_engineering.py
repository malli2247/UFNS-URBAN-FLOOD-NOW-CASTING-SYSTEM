# UFNS Feature Engineering Pipeline
from typing import Dict, List, Any
import numpy as np
import math

FEATURE_COLUMNS = [
    'rainfall_1h',
    'rainfall_3h',
    'rainfall_6h',
    'rainfall_24h',
    'elevation',
    'slope',
    'flow_direction',
    'flow_accumulation',
    'building_density',
    'road_density',
    'distance_to_drainage',
    'drainage_capacity',
    'drainage_load'
]

class FeatureTransformer:
    def __init__(self):
        self.feature_columns = FEATURE_COLUMNS
        self.means = {}
        self.stds = {}
        self.is_fitted = False

    def fit(self, records: List[Dict[str, Any]]):
        """Fit normalization parameters on the training partition only (No data leakage)."""
        for col in self.feature_columns:
            vals = [float(r.get(col, 0.0)) for r in records]
            mean_val = float(np.mean(vals)) if vals else 0.0
            std_val = float(np.std(vals)) if vals else 1.0
            if std_val < 1e-4:
                std_val = 1.0
            self.means[col] = round(mean_val, 4)
            self.stds[col] = round(std_val, 4)
        self.is_fitted = True

    def transform_record(self, r: Dict[str, Any]) -> np.ndarray:
        """Transform a single record dict into normalized vector + physical interaction terms."""
        row = []
        for col in self.feature_columns:
            raw = float(r.get(col, 0.0))
            m = self.means.get(col, 0.0)
            s = self.stds.get(col, 1.0)
            row.append((raw - m) / s)

        # Physical interaction terms:
        # 1. Overland runoff surge: (rain_1h * drainage_load) / max(0.5, slope)
        r1h = float(r.get('rainfall_1h', 0.0))
        slope = max(0.5, float(r.get('slope', 1.0)))
        d_load = float(r.get('drainage_load', 1.0))
        surge_term = (r1h * d_load) / slope
        row.append(math.log1p(max(0.0, surge_term)))

        # 2. Hydraulic bottleneck: flow_accumulation * road_density / max(1.0, drainage_capacity)
        flow_acc = float(r.get('flow_accumulation', 100.0))
        rd_dens = float(r.get('road_density', 0.8))
        d_cap = max(1.0, float(r.get('drainage_capacity', 2.5)))
        bottleneck_term = (flow_acc * rd_dens) / d_cap
        row.append(math.log1p(max(0.0, bottleneck_term)))

        return np.array(row, dtype=np.float32)

    def transform_all(self, records: List[Dict[str, Any]]) -> np.ndarray:
        matrix = [self.transform_record(r) for r in records]
        return np.array(matrix, dtype=np.float32)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "feature_columns": self.feature_columns,
            "means": self.means,
            "stds": self.stds,
            "total_features": len(self.feature_columns) + 2
        }

    def from_dict(self, data: Dict[str, Any]):
        self.feature_columns = data.get("feature_columns", FEATURE_COLUMNS)
        self.means = data.get("means", {})
        self.stds = data.get("stds", {})
        self.is_fitted = True
