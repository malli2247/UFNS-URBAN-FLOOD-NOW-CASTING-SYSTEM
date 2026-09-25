# UFNS Reproducible ML Training Pipeline
# Enforces strict temporal splits (Older -> Train, 2023 -> Val, 2024 -> Test)
# Trains Flood Extent Classifier and Flood Depth Regressor with zero label leakage.

import json
import os
import math
import numpy as np
from typing import Dict, List, Any
from datetime import datetime
from .feature_engineering import FeatureTransformer, FEATURE_COLUMNS

def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-np.clip(z, -25.0, 25.0)))

class FloodExtentClassifier:
    """Calibrated L2 Regularized Logistic Classifier for Flood Inundation Probability."""
    def __init__(self, lr=0.08, l2=0.02, epochs=400):
        self.lr = lr
        self.l2 = l2
        self.epochs = epochs
        self.weights = None
        self.bias = 0.0

    def fit(self, X: np.ndarray, y: np.ndarray):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features, dtype=np.float32)
        self.bias = 0.0

        for _ in range(self.epochs):
            linear = np.dot(X, self.weights) + self.bias
            preds = sigmoid(linear)
            dw = (1.0 / n_samples) * (np.dot(X.T, (preds - y)) + self.l2 * self.weights)
            db = (1.0 / n_samples) * np.sum(preds - y)
            self.weights -= self.lr * dw
            self.bias -= self.lr * db

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        linear = np.dot(X, self.weights) + self.bias
        return sigmoid(linear)

    def predict(self, X: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        return (self.predict_proba(X) >= threshold).astype(int)

class FloodDepthRegressor:
    """Regularized Ridge Regression for Continuous Flood Depth (cm)."""
    def __init__(self, l2=1.5):
        self.l2 = l2
        self.weights = None
        self.bias = 0.0

    def fit(self, X: np.ndarray, y: np.ndarray):
        n_samples, n_features = X.shape
        # Add bias column
        X_b = np.c_[np.ones((n_samples, 1)), X]
        I = np.eye(n_features + 1)
        I[0, 0] = 0.0  # Do not regularize bias
        # Normal equations: (X^T X + lambda I)^-1 X^T y
        theta = np.linalg.inv(X_b.T.dot(X_b) + self.l2 * I).dot(X_b.T).dot(y)
        self.bias = float(theta[0])
        self.weights = theta[1:].astype(np.float32)

    def predict(self, X: np.ndarray) -> np.ndarray:
        preds = np.dot(X, self.weights) + self.bias
        return np.maximum(0.0, preds)

def compute_regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    bias = float(np.mean(y_pred - y_true))
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    ss_res = np.sum((y_true - y_pred) ** 2)
    r2 = float(1.0 - (ss_res / ss_tot)) if ss_tot > 1e-6 else 0.0
    return {
        "mae_cm": round(mae, 2),
        "rmse_cm": round(rmse, 2),
        "mean_bias_cm": round(bias, 2),
        "r2_score": round(max(-1.0, min(1.0, r2)), 3)
    }

def compute_classification_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 1.0
    recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 1.0
    f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    accuracy = float((tp + tn) / len(y_true)) if len(y_true) > 0 else 1.0
    return {
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1_score": round(f1, 3),
        "accuracy": round(accuracy, 3),
        "confusion_matrix": {"tp": tp, "fp": fp, "fn": fn, "tn": tn}
    }

def run_training_pipeline(dataset_path: str = None, output_dir: str = None) -> Dict[str, Any]:
    """Execute reproducible training pipeline across multi-city historical dataset."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    if dataset_path is None:
        dataset_path = os.path.join(base_dir, 'data', 'training', 'unified_flood_training_dataset.json')
    if output_dir is None:
        output_dir = os.path.join(base_dir, 'models', 'flood_prediction')
    os.makedirs(output_dir, exist_ok=True)

    with open(dataset_path, 'r', encoding='utf-8') as f:
        data_json = json.load(f)

    observations = data_json["observations"]
    train_records = [r for r in observations if r["split"] == "TRAIN"]
    val_records = [r for r in observations if r["split"] == "VALIDATION"]
    test_records = [r for r in observations if r["split"] == "TEST"]

    assert len(train_records) > 0, "No training records found!"
    assert len(val_records) > 0, "No validation records found!"
    assert len(test_records) > 0, "No test records found!"

    # 1. Fit Feature Transformer on Training Set ONLY
    transformer = FeatureTransformer()
    transformer.fit(train_records)

    X_train = transformer.transform_all(train_records)
    y_clf_train = np.array([r["flood_observed"] for r in train_records], dtype=np.float32)
    y_reg_train = np.array([r["flood_depth"] for r in train_records], dtype=np.float32)

    X_val = transformer.transform_all(val_records)
    y_clf_val = np.array([r["flood_observed"] for r in val_records], dtype=np.float32)
    y_reg_val = np.array([r["flood_depth"] for r in val_records], dtype=np.float32)

    X_test = transformer.transform_all(test_records)
    y_clf_test = np.array([r["flood_observed"] for r in test_records], dtype=np.float32)
    y_reg_test = np.array([r["flood_depth"] for r in test_records], dtype=np.float32)

    # 2. Train Models
    clf = FloodExtentClassifier(lr=0.09, l2=0.015, epochs=500)
    clf.fit(X_train, y_clf_train)

    reg = FloodDepthRegressor(l2=1.2)
    reg.fit(X_train, y_reg_train)

    # 3. Evaluate Predictions
    # Validation Evaluation
    val_prob = clf.predict_proba(X_val)
    val_clf_pred = (val_prob >= 0.5).astype(int)
    val_reg_pred = reg.predict(X_val)
    # Physically couple: if prob < 0.20, force depth to 0
    val_reg_pred = np.where(val_prob < 0.20, 0.0, val_reg_pred)

    val_clf_metrics = compute_classification_metrics(y_clf_val, val_clf_pred)
    val_reg_metrics = compute_regression_metrics(y_reg_val, val_reg_pred)

    # Test Evaluation (Unseen 2024 Events)
    test_prob = clf.predict_proba(X_test)
    test_clf_pred = (test_prob >= 0.5).astype(int)
    test_reg_pred = reg.predict(X_test)
    test_reg_pred = np.where(test_prob < 0.20, 0.0, test_reg_pred)

    test_clf_metrics = compute_classification_metrics(y_clf_test, test_clf_pred)
    test_reg_metrics = compute_regression_metrics(y_reg_test, test_reg_pred)

    trained_timestamp = datetime.now().isoformat()
    model_version = "v2.0.0-metropolitan"

    # Feature Importance (Absolute weights)
    feature_names = FEATURE_COLUMNS + ["overland_surge_interaction", "drainage_bottleneck_interaction"]
    reg_weights = reg.weights.tolist()
    clf_weights = clf.weights.tolist()
    feature_importances = []
    for fn, rw, cw in zip(feature_names, reg_weights, clf_weights):
        feature_importances.append({
            "feature": fn,
            "reg_weight": round(rw, 4),
            "clf_weight": round(cw, 4),
            "importance_score": round(abs(rw) + abs(cw), 4)
        })
    feature_importances.sort(key=lambda x: x["importance_score"], reverse=True)

    # 4. Save Model Artifact
    model_artifact = {
        "model_name": "UFNS Unified Metropolitan Flood Nowcasting Model",
        "model_version": model_version,
        "trained_at": trained_timestamp,
        "dataset_name": data_json["metadata"]["dataset_name"],
        "dataset_version": data_json["metadata"]["version"],
        "target_cities": ["Delhi", "Mumbai", "Bengaluru"],
        "expandable_cities": ["Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow"],
        "feature_transformer": transformer.to_dict(),
        "classifier": {
            "weights": clf.weights.tolist(),
            "bias": float(clf.bias),
            "threshold": 0.5
        },
        "regressor": {
            "weights": reg.weights.tolist(),
            "bias": float(reg.bias)
        },
        "metrics": {
            "validation": {
                "regression": val_reg_metrics,
                "classification": val_clf_metrics
            },
            "test": {
                "regression": test_reg_metrics,
                "classification": test_clf_metrics
            }
        },
        "feature_importances": feature_importances
    }

    model_file = os.path.join(output_dir, 'ufns_model_v2.0.json')
    with open(model_file, 'w', encoding='utf-8') as f:
        json.dump(model_artifact, f, indent=2)

    # 5. Save Model Card
    model_card = {
        "model_details": {
            "name": "UFNS Multi-City Urban Flood Extent & Depth Nowcaster",
            "version": model_version,
            "date": trained_timestamp,
            "license": "Apache 2.0 (SIH 2026 Open Source Project)",
            "model_type": "Coupled Regularized Hydrologic Ensemble (Classifier + Regressor)",
            "framework": "UFNS Native Python/NumPy (Zero External Heavy Dependencies, CPU Optimized)"
        },
        "intended_use": {
            "primary_use": "Real-time 0-3 hour urban flood depth and road impassability prediction for emergency dispatch and civic alerts.",
            "users": "Disaster Management Authorities (DDMA/BDMA/MCGM), Emergency Responders, Citizens",
            "out_of_scope": "Coastal storm surge wave modeling without inland precipitation, or long-term climate projections beyond 6 hours."
        },
        "training_data": {
            "training_period": "2019-2022 Verified Cloudburst and Monsoon Floods",
            "validation_period": "2023 Monsoon Extreme Inundation Events",
            "test_period": "2024 Unseen Flood Events (Recent Overpasses)",
            "temporal_split_rationale": "Strict temporal sequence prevents temporal data leakage across sequential storm overpasses.",
            "total_records": len(observations),
            "train_samples": len(train_records),
            "val_samples": len(val_records),
            "test_samples": len(test_records)
        },
        "quantitative_metrics": {
            "validation_results_2023": {
                "mae_cm": val_reg_metrics["mae_cm"],
                "rmse_cm": val_reg_metrics["rmse_cm"],
                "r2_score": val_reg_metrics["r2_score"],
                "f1_score": val_clf_metrics["f1_score"],
                "precision": val_clf_metrics["precision"],
                "recall": val_clf_metrics["recall"]
            },
            "test_results_2024_unseen": {
                "mae_cm": test_reg_metrics["mae_cm"],
                "rmse_cm": test_reg_metrics["rmse_cm"],
                "r2_score": test_reg_metrics["r2_score"],
                "f1_score": test_clf_metrics["f1_score"],
                "precision": test_clf_metrics["precision"],
                "recall": test_clf_metrics["recall"]
            }
        },
        "data_provenance_summary": data_json["metadata"]["data_provenance"],
        "top_predictive_features": [f["feature"] for f in feature_importances[:5]],
        "limitations_and_caveats": [
            "Conduit flow calculations assume clean drainage unless manual choke factor is set.",
            "Subterranean municipal drainage is marked as SIMULATED/UNAVAILABLE if authoritative GIS is missing.",
            "Predictions are updated continuously on fresh rainfall observations without mutating training weights."
        ]
    }

    card_file = os.path.join(output_dir, 'model_card.json')
    with open(card_file, 'w', encoding='utf-8') as f:
        json.dump(model_card, f, indent=2)

    print(f"Successfully trained UFNS Model {model_version}!")
    print(f"Validation MAE: {val_reg_metrics['mae_cm']} cm | R2: {val_reg_metrics['r2_score']} | F1: {val_clf_metrics['f1_score']}")
    print(f"Test MAE: {test_reg_metrics['mae_cm']} cm | R2: {test_reg_metrics['r2_score']} | F1: {test_clf_metrics['f1_score']}")
    print(f"Model saved: {model_file}")
    print(f"Model card saved: {card_file}")

    return model_artifact

if __name__ == '__main__':
    run_training_pipeline()
