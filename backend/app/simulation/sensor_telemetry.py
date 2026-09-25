# UFNS Real-Time IoT Sensor Telemetry & Citizen Ground-Truth Store
from typing import Dict, List, Any, Optional

class SensorAndObservationStore:
    def __init__(self, sensors_list: Optional[List[Dict[str, Any]]] = None):
        if sensors_list:
            self.sensors = []
            for s in sensors_list:
                self.sensors.append({
                    "id": s["id"],
                    "name": s["name"],
                    "lat": s["lat"],
                    "lon": s["lon"],
                    "depth_cm": 24.5,
                    "battery_pct": 91,
                    "status": s.get("status", "ONLINE"),
                    "quality": 0.95
                })
        else:
            self.sensors = [
                {"id": "WL-101", "name": "Sony World Junction Sensor", "lat": 12.934, "lon": 77.626, "depth_cm": 14.5, "battery_pct": 92, "status": "ONLINE", "quality": 0.96},
                {"id": "WL-102", "name": "EcoSpace Underpass Sensor", "lat": 12.926, "lon": 77.684, "depth_cm": 38.0, "battery_pct": 84, "status": "ONLINE", "quality": 0.98},
                {"id": "WL-103", "name": "Rainbow Drive Storm Canal", "lat": 12.915, "lon": 77.671, "depth_cm": 52.0, "battery_pct": 78, "status": "CRITICAL_ALERT", "quality": 0.94},
                {"id": "WL-104", "name": "Agara Lake Inflow Gauge", "lat": 12.922, "lon": 77.636, "depth_cm": 28.0, "battery_pct": 95, "status": "ONLINE", "quality": 0.99},
                {"id": "WL-105", "name": "Sarjapur Road Wipro Crossing", "lat": 12.919, "lon": 77.653, "depth_cm": 22.0, "battery_pct": 89, "status": "ONLINE", "quality": 0.91},
                {"id": "WL-106", "name": "Intermediate Ring Road Sump", "lat": 12.946, "lon": 77.639, "depth_cm": 44.0, "battery_pct": 86, "status": "ONLINE", "quality": 0.95},
                {"id": "WL-107", "name": "Bellandur Outfall Sluice", "lat": 12.942, "lon": 77.662, "depth_cm": 41.0, "battery_pct": 91, "status": "ONLINE", "quality": 0.97},
                {"id": "WL-108", "name": "HSR Sector 1 Primary Drain", "lat": 12.916, "lon": 77.644, "depth_cm": 18.0, "battery_pct": 88, "status": "ONLINE", "quality": 0.93},
            ]
        self.citizen_reports: List[Dict[str, Any]] = [
            {"id": "CR-881", "lat": 12.915, "lon": 77.671, "category": "Waterlogging", "depth_cm": 60.0, "desc": "Water inside residential lane, knee deep", "verified": True, "quality": 0.92, "timestamp": "10 min ago"},
            {"id": "CR-882", "lat": 12.926, "lon": 77.660, "category": "Drain Overflow", "depth_cm": 42.0, "desc": "Manhole lid dislodged by backflow pressure", "verified": True, "quality": 0.89, "timestamp": "15 min ago"},
            {"id": "CR-883", "lat": 12.934, "lon": 77.626, "category": "Blocked Road", "depth_cm": 35.0, "desc": "Cars stalling near junction underpass", "verified": True, "quality": 0.85, "timestamp": "25 min ago"},
        ]

    def get_all_sensors(self) -> List[Dict[str, Any]]:
        return self.sensors

    def add_citizen_report(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        new_id = f"CR-{len(self.citizen_reports) + 884}"
        report = {
            "id": new_id,
            "lat": report_data["lat"],
            "lon": report_data["lon"],
            "category": report_data["category"],
            "depth_cm": float(report_data["water_depth_cm"]),
            "desc": report_data.get("description", ""),
            "verified": True,
            "quality": 0.88,
            "timestamp": "Just now"
        }
        self.citizen_reports.insert(0, report)
        return report

    def get_all_ground_truth(self) -> List[Dict[str, Any]]:
        points = []
        for s in self.sensors:
            points.append({
                "id": s["id"],
                "type": "IOT_SENSOR",
                "lat": s["lat"],
                "lon": s["lon"],
                "observed_depth_cm": s["depth_cm"],
                "source": "Municipal IoT Water Sensor",
                "quality_score": s["quality"]
            })
        for c in self.citizen_reports:
            points.append({
                "id": c["id"],
                "type": "CITIZEN_REPORT",
                "lat": c["lat"],
                "lon": c["lon"],
                "observed_depth_cm": c["depth_cm"],
                "source": "Verified Citizen Incident Report",
                "quality_score": c["quality"]
            })
        return points
