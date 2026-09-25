# AQUILA Dynamic Flood Risk Scoring & Classification Engine
from typing import Tuple, Dict, Any
from ..config import RISK_THRESHOLDS

class FloodRiskEngine:
    @staticmethod
    def calculate_cell_risk(depth_cm: float, rainfall_rate_mm_hr: float, surcharge_cm: float = 0.0) -> Tuple[str, int]:
        score = 0
        if depth_cm < 5.0:
            score += int((depth_cm / 5.0) * 15)
        elif depth_cm < 15.0:
            score += 15 + int(((depth_cm - 5.0) / 10.0) * 20)
        elif depth_cm < 30.0:
            score += 35 + int(((depth_cm - 15.0) / 15.0) * 20)
        elif depth_cm < 50.0:
            score += 55 + int(((depth_cm - 30.0) / 20.0) * 25)
        else:
            score += 80 + min(20, int(((depth_cm - 50.0) / 30.0) * 20))

        rain_pts = min(20, int((rainfall_rate_mm_hr / 100.0) * 20))
        score += rain_pts

        if surcharge_cm > 0:
            score += min(15, int(surcharge_cm * 1.5))

        score = max(0, min(100, score))

        if score <= 20:
            level = "SAFE"
        elif score <= 40:
            level = "LOW"
        elif score <= 60:
            level = "MODERATE"
        elif score <= 80:
            level = "HIGH"
        else:
            level = "CRITICAL"

        return level, score
