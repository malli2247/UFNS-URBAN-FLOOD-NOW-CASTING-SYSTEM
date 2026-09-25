# AQUILA Historical Urban Flood Datasets & Replay Engine
# Real-data archives for Bengaluru 2022, Chennai 2023, and Monsoon 2024
from typing import Dict, List, Any

HISTORICAL_EVENTS: Dict[str, Dict[str, Any]] = {
    "bengaluru_2022_rainbow_drive": {
        "id": "bengaluru_2022_rainbow_drive",
        "name": "Bengaluru Urban Cloudburst (Sep 5, 2022)",
        "location": "Bellandur - Koramangala - Sarjapur Basin",
        "date": "2022-09-05",
        "description": "Record convective cloudburst: 131.6 mm in 4 hours. Massive inundation at Rainbow Drive, EcoSpace ORR, and Sony World Junction.",
        "peak_rainfall_mm_hr": 131.6,
        "rainfall_timeline": [
            {"horizon": "0m", "rainfall_rate_mm_hr": 35.0, "radar_dbz": 38.0},
            {"horizon": "15m", "rainfall_rate_mm_hr": 58.0, "radar_dbz": 44.0},
            {"horizon": "30m", "rainfall_rate_mm_hr": 89.0, "radar_dbz": 51.0},
            {"horizon": "45m", "rainfall_rate_mm_hr": 115.0, "radar_dbz": 56.0},
            {"horizon": "1h", "rainfall_rate_mm_hr": 131.6, "radar_dbz": 59.0},
            {"horizon": "2h", "rainfall_rate_mm_hr": 74.0, "radar_dbz": 48.0},
            {"horizon": "3h", "rainfall_rate_mm_hr": 22.0, "radar_dbz": 32.0},
        ],
        "observations": [
            {"id": "OBS-01", "name": "Rainbow Drive Gated Community", "lat": 12.915, "lon": 77.671, "observed_depth_cm": 68.0, "type": "CITIZEN_REPORT", "quality": 0.95},
            {"id": "OBS-02", "name": "EcoSpace ORR Tech Park", "lat": 12.926, "lon": 77.684, "observed_depth_cm": 52.0, "type": "GOVERNMENT_GAUGE", "quality": 0.98},
            {"id": "OBS-03", "name": "Sony World Junction, Koramangala", "lat": 12.934, "lon": 77.626, "observed_depth_cm": 44.0, "type": "IOT_SENSOR", "quality": 0.92},
            {"id": "OBS-04", "name": "Bellandur Lake Outfall Sluice", "lat": 12.942, "lon": 77.662, "observed_depth_cm": 58.0, "type": "GOVERNMENT_GAUGE", "quality": 0.99},
            {"id": "OBS-05", "name": "Sarjapur Road Wipro Gate", "lat": 12.919, "lon": 77.653, "observed_depth_cm": 38.0, "type": "IOT_SENSOR", "quality": 0.90},
            {"id": "OBS-06", "name": "Agara Lake Overflow Drain", "lat": 12.922, "lon": 77.634, "observed_depth_cm": 34.0, "type": "IOT_SENSOR", "quality": 0.94},
            {"id": "OBS-07", "name": "Intermediate Ring Road Underpass", "lat": 12.945, "lon": 77.638, "observed_depth_cm": 62.0, "type": "FIELD_SURVEY", "quality": 0.96},
            {"id": "OBS-08", "name": "Koramangala 80ft Road", "lat": 12.938, "lon": 77.621, "observed_depth_cm": 28.0, "type": "CITIZEN_REPORT", "quality": 0.88},
            {"id": "OBS-09", "name": "Marathahalli Underpass Link", "lat": 12.955, "lon": 77.674, "observed_depth_cm": 48.0, "type": "IOT_SENSOR", "quality": 0.91},
            {"id": "OBS-10", "name": "St. John Hospital Junction Link", "lat": 12.928, "lon": 77.618, "observed_depth_cm": 14.0, "type": "IOT_SENSOR", "quality": 0.95},
            {"id": "OBS-11", "name": "Ejipura Inner Ring Road", "lat": 12.941, "lon": 77.629, "observed_depth_cm": 31.0, "type": "CITIZEN_REPORT", "quality": 0.87},
            {"id": "OBS-12", "name": "Kasavanahalli Storm Drain Link", "lat": 12.909, "lon": 77.672, "observed_depth_cm": 45.0, "type": "FIELD_SURVEY", "quality": 0.90},
        ]
    },
    "chennai_2023_cyclone_michaung": {
        "id": "chennai_2023_cyclone_michaung",
        "name": "Chennai Cyclone Michaung Cloudburst (Dec 4, 2023)",
        "location": "Velachery - Pallikaranai Marshland Basin",
        "date": "2023-12-04",
        "description": "Tropical cyclone outer rainband cloudburst delivering 148 mm in 3 hours with severe tidal backflow.",
        "peak_rainfall_mm_hr": 148.0,
        "rainfall_timeline": [
            {"horizon": "0m", "rainfall_rate_mm_hr": 45.0, "radar_dbz": 42.0},
            {"horizon": "15m", "rainfall_rate_mm_hr": 78.0, "radar_dbz": 49.0},
            {"horizon": "30m", "rainfall_rate_mm_hr": 118.0, "radar_dbz": 54.0},
            {"horizon": "45m", "rainfall_rate_mm_hr": 138.0, "radar_dbz": 57.0},
            {"horizon": "1h", "rainfall_rate_mm_hr": 148.0, "radar_dbz": 60.0},
            {"horizon": "2h", "rainfall_rate_mm_hr": 92.0, "radar_dbz": 50.0},
            {"horizon": "3h", "rainfall_rate_mm_hr": 38.0, "radar_dbz": 38.0},
        ],
        "observations": [
            {"id": "CH-01", "name": "Velachery Main Road Bridge", "lat": 12.915, "lon": 77.671, "observed_depth_cm": 74.0, "type": "GOVERNMENT_GAUGE", "quality": 0.99},
            {"id": "CH-02", "name": "Pallikaranai Marshland Inflow", "lat": 12.926, "lon": 77.684, "observed_depth_cm": 64.0, "type": "FIELD_SURVEY", "quality": 0.97},
            {"id": "CH-03", "name": "South Canal Trunk Drain", "lat": 12.942, "lon": 77.662, "observed_depth_cm": 55.0, "type": "IOT_SENSOR", "quality": 0.94},
        ]
    },
    "monsoon_2024_moderate": {
        "id": "monsoon_2024_moderate",
        "name": "Bengaluru Monsoon Frontal Rain (Jul 18, 2024)",
        "location": "Central Tech Zone",
        "date": "2024-07-18",
        "description": "Typical southwest monsoon convective pulse: 45 mm/hr peak with minor gutter ponding.",
        "peak_rainfall_mm_hr": 45.0,
        "rainfall_timeline": [
            {"horizon": "0m", "rainfall_rate_mm_hr": 12.0, "radar_dbz": 24.0},
            {"horizon": "15m", "rainfall_rate_mm_hr": 24.0, "radar_dbz": 30.0},
            {"horizon": "30m", "rainfall_rate_mm_hr": 38.0, "radar_dbz": 36.0},
            {"horizon": "45m", "rainfall_rate_mm_hr": 45.0, "radar_dbz": 39.0},
            {"horizon": "1h", "rainfall_rate_mm_hr": 35.0, "radar_dbz": 34.0},
            {"horizon": "2h", "rainfall_rate_mm_hr": 16.0, "radar_dbz": 26.0},
            {"horizon": "3h", "rainfall_rate_mm_hr": 5.0, "radar_dbz": 18.0},
        ],
        "observations": [
            {"id": "MO-01", "name": "Sony World Junction", "lat": 12.934, "lon": 77.626, "observed_depth_cm": 12.0, "type": "IOT_SENSOR", "quality": 0.92},
            {"id": "MO-02", "name": "EcoSpace ORR Tech Park", "lat": 12.926, "lon": 77.684, "observed_depth_cm": 16.0, "type": "GOVERNMENT_GAUGE", "quality": 0.95},
        ]
    }
}
