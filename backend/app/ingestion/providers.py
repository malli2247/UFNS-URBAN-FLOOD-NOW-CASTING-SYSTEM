# AQUILA Pluggable Data Providers Architecture
# Modular interfaces for Rainfall, Radar, DEM, Roads, Observations, and Sensors
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import math
import requests
from ..config import DOMAIN_BOUNDS
from ..data.historical_events import HISTORICAL_EVENTS

class RainfallDataProvider(ABC):
    @abstractmethod
    def get_current_rainfall(self, lat: float, lon: float) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_forecast(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        pass

class HistoricalRainfallProvider(RainfallDataProvider):
    def __init__(self, event_id: str = "bengaluru_2022_rainbow_drive"):
        self.event_id = event_id
        self.event_data = HISTORICAL_EVENTS.get(event_id, HISTORICAL_EVENTS["bengaluru_2022_rainbow_drive"])

    def get_current_rainfall(self, lat: float, lon: float) -> Dict[str, Any]:
        current = self.event_data["rainfall_timeline"][0]
        return {
            "timestamp": f"{self.event_data['date']} 18:30 IST",
            "latitude": lat,
            "longitude": lon,
            "rainfall_rate_mm_hr": current["rainfall_rate_mm_hr"],
            "source": f"HISTORICAL REAL DATA ({self.event_data['name']})",
            "intensity_label": "Heavy Convective Rain"
        }

    def get_forecast(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        forecasts = []
        cum = 0.0
        for step in self.event_data["rainfall_timeline"]:
            rate = step["rainfall_rate_mm_hr"]
            cum += (rate * 0.25)  # 15m step approx
            forecasts.append({
                "horizon": step["horizon"],
                "rainfall_rate_mm_hr": rate,
                "cumulative_mm": round(cum, 1),
                "radar_reflectivity_dbz": step["radar_dbz"]
            })
        return forecasts

class OpenMeteoRainfallProvider(RainfallDataProvider):
    """Fetches live precipitation from Open-Meteo free API with automatic offline fallback."""
    def get_current_rainfall(self, lat: float, lon: float) -> Dict[str, Any]:
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=precipitation,rain&hourly=precipitation&forecast_days=1"
            resp = requests.get(url, timeout=2.5)
            if resp.status_code == 200:
                data = resp.json()
                current_p = data.get("current", {}).get("precipitation", 0.0)
                # Convert mm in 15min to mm/hr
                rate = current_p * 4.0
                return {
                    "timestamp": data.get("current", {}).get("time", "2026-09-13T20:30"),
                    "latitude": lat,
                    "longitude": lon,
                    "rainfall_rate_mm_hr": round(rate, 2),
                    "source": "LIVE OPEN-METEO API",
                    "intensity_label": "Live Meteorological Feed"
                }
        except Exception:
            pass
        # Graceful fallback to historical calibrated profile
        return HistoricalRainfallProvider().get_current_rainfall(lat, lon)

    def get_forecast(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=precipitation&forecast_days=1"
            resp = requests.get(url, timeout=2.5)
            if resp.status_code == 200:
                data = resp.json()
                hourly_precip = data.get("hourly", {}).get("precipitation", [0.0]*24)[:4]
                horizons = ["0m", "15m", "30m", "45m", "1h", "2h", "3h"]
                out = []
                cum = 0.0
                for i, h in enumerate(horizons):
                    p_val = hourly_precip[min(i, len(hourly_precip)-1)] * 2.5
                    cum += p_val * 0.25
                    dbz = 10.0 * math.log10(max(1.0, 200.0 * (max(0.1, p_val) ** 1.6)))
                    out.append({
                        "horizon": h,
                        "rainfall_rate_mm_hr": round(p_val, 1),
                        "cumulative_mm": round(cum, 1),
                        "radar_reflectivity_dbz": round(dbz, 1)
                    })
                return out
        except Exception:
            pass
        return HistoricalRainfallProvider().get_forecast(lat, lon)

class SyntheticRainfallProvider(RainfallDataProvider):
    def __init__(self, base_rate_mm_hr: float = 85.0):
        self.base_rate = base_rate_mm_hr

    def get_current_rainfall(self, lat: float, lon: float) -> Dict[str, Any]:
        return {
            "timestamp": "2026-09-13 20:30 IST",
            "latitude": lat,
            "longitude": lon,
            "rainfall_rate_mm_hr": self.base_rate,
            "source": "DEMO SIMULATION SYNTHETIC",
            "intensity_label": "Simulated Severe Cloudburst"
        }

    def get_forecast(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        rates = [self.base_rate * f for f in [0.7, 0.9, 1.25, 1.45, 1.3, 0.8, 0.35]]
        horizons = ["0m", "15m", "30m", "45m", "1h", "2h", "3h"]
        out = []
        cum = 0.0
        for h, r in zip(horizons, rates):
            cum += r * 0.25
            dbz = 10.0 * math.log10(max(1.0, 200.0 * (max(0.1, r) ** 1.6)))
            out.append({
                "horizon": h,
                "rainfall_rate_mm_hr": round(r, 1),
                "cumulative_mm": round(cum, 1),
                "radar_reflectivity_dbz": round(dbz, 1)
            })
        return out
