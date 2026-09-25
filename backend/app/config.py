# AQUILA Configuration and Domain Constants
# SIH 2026 Problem Statement ID: 26085
import os
from typing import Dict

# Data mode: DEMO SIMULATION | HISTORICAL REPLAY | LIVE DATA
DATA_MODE = os.getenv("AQUILA_DATA_MODE", "DEMO SIMULATION")

# Domain coordinates: Bengaluru Koramangala - Bellandur - Rainbow Drive basin
DOMAIN_BOUNDS = {
    "min_lat": 12.912,
    "max_lat": 12.962,
    "min_lon": 77.605,
    "max_lon": 77.675,
    "center_lat": 12.937,
    "center_lon": 77.640,
}

GRID_ROWS = 16
GRID_COLS = 16
CELL_SIZE_M = 350.0  # 350m x 350m spatial cell resolution
CELL_AREA_M2 = CELL_SIZE_M * CELL_SIZE_M

TIME_HORIZONS = ["0m", "15m", "30m", "45m", "1h", "2h", "3h"]

# Vehicle clearance limits in cm
VEHICLE_CLEARANCES: Dict[str, float] = {
    "pedestrian": 10.0,
    "car": 20.0,
    "ambulance": 25.0,
    "police": 35.0,
    "fire_truck": 50.0,
}

# Flood risk thresholds in cm
RISK_THRESHOLDS = {
    "SAFE": (0.0, 5.0),
    "LOW": (5.0, 15.0),
    "MODERATE": (15.0, 30.0),
    "HIGH": (30.0, 50.0),
    "CRITICAL": (50.0, 999.0),
}
RISK_THRESHOLD_DISCLAIMER = "Prototype thresholds - configurable according to local authority guidelines."
