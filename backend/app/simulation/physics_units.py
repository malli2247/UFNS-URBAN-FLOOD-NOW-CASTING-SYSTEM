# AQUILA Physics-Inspired Unit Conversion & Conservation Engine
# Guarantees explicit unit handling: mm/hr <-> m/s <-> m^3 <-> cm.
import math

def mm_per_hr_to_m_per_s(intensity_mm_hr: float) -> float:
    """Convert rainfall rate from mm/hr to m/s."""
    return (intensity_mm_hr * 1e-3) / 3600.0

def m_per_s_to_mm_per_hr(velocity_m_s: float) -> float:
    """Convert rate from m/s to mm/hr."""
    return velocity_m_s * 3600.0 * 1e3

def rainfall_volume_m3(intensity_mm_hr: float, area_m2: float, duration_seconds: float) -> float:
    """Total volume in m3 of water fallen over area_m2 during duration_seconds."""
    rate_m_s = mm_per_hr_to_m_per_s(intensity_mm_hr)
    return rate_m_s * area_m2 * duration_seconds

def volume_to_depth_cm(volume_m3: float, area_m2: float) -> float:
    """Convert water volume in m3 over cell area in m2 to depth in centimeters."""
    if area_m2 <= 0:
        return 0.0
    return (volume_m3 / area_m2) * 100.0

def depth_cm_to_volume_m3(depth_cm: float, area_m2: float) -> float:
    """Convert water depth in cm to volume in m3."""
    return (depth_cm / 100.0) * area_m2

def manning_pipe_capacity_m3_s(diameter_m: float, slope: float, roughness_n: float = 0.013) -> float:
    """
    Manning formula for full circular gravity pipe flow:
    Q = (1 / n) * A * R^(2/3) * S^(1/2)
    where A = pi * (D/2)^2, R = D / 4
    """
    if diameter_m <= 0 or slope <= 0:
        return 0.0
    area = math.pi * ((diameter_m / 2.0) ** 2)
    hydraulic_radius = diameter_m / 4.0
    velocity = (1.0 / roughness_n) * (hydraulic_radius ** (2.0 / 3.0)) * math.sqrt(slope)
    return area * velocity
