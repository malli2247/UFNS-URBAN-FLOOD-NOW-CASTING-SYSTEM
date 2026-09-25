# AQUILA Urban Building Footprints Dataset (Bengaluru Koramangala-Bellandur Basin)
# Provides realistic 3D building geometries, heights, levels, and types
from typing import List, Dict, Any

def _box_poly(center_lon: float, center_lat: float, width_m: float, height_m: float, angle_deg: float = 0.0) -> List[List[float]]:
    d_lat = (height_m / 2.0) / 111000.0
    d_lon = (width_m / 2.0) / 108000.0
    
    corners = [
        [-d_lon, -d_lat],
        [d_lon, -d_lat],
        [d_lon, d_lat],
        [-d_lon, d_lat],
        [-d_lon, -d_lat]
    ]
    
    import math
    rad = math.radians(angle_deg)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)
    
    poly = []
    for dx, dy in corners:
        rx = dx * cos_a - dy * sin_a
        ry = dx * sin_a + dy * cos_a
        poly.append([round(center_lon + rx, 6), round(center_lat + ry, 6)])
    return poly

LANDMARK_BUILDINGS = [
    # St. John's Medical College & Hospital Complex
    {
        "id": "BLD-HOSP-01",
        "name": "St. John's Hospital - Main Surgical Tower",
        "type": "HOSPITAL",
        "lon": 77.6192,
        "lat": 12.9348,
        "height_m": 42.0,
        "levels": 11,
        "width_m": 85.0,
        "length_m": 60.0,
        "angle": 12.0
    },
    {
        "id": "BLD-HOSP-02",
        "name": "St. John's Emergency & Trauma Pavilion",
        "type": "HOSPITAL",
        "lon": 77.6202,
        "lat": 12.9340,
        "height_m": 32.0,
        "levels": 8,
        "width_m": 65.0,
        "length_m": 45.0,
        "angle": 12.0
    },
    {
        "id": "BLD-HOSP-03",
        "name": "St. John's Medical College Block",
        "type": "CIVIC",
        "lon": 77.6185,
        "lat": 12.9332,
        "height_m": 28.0,
        "levels": 7,
        "width_m": 90.0,
        "length_m": 50.0,
        "angle": 15.0
    },
    # Sakra World Hospital Complex
    {
        "id": "BLD-HOSP-04",
        "name": "Sakra World Hospital - Main Inpatient Tower",
        "type": "HOSPITAL",
        "lon": 77.6834,
        "lat": 12.9260,
        "height_m": 46.0,
        "levels": 12,
        "width_m": 75.0,
        "length_m": 55.0,
        "angle": -8.0
    },
    {
        "id": "BLD-HOSP-05",
        "name": "Sakra Critical Care & Cardiac Wing",
        "type": "HOSPITAL",
        "lon": 77.6842,
        "lat": 12.9268,
        "height_m": 36.0,
        "levels": 9,
        "width_m": 60.0,
        "length_m": 45.0,
        "angle": -8.0
    },
    # RMZ Ecospace Tech Park
    {
        "id": "BLD-TECH-01",
        "name": "RMZ Ecospace - Tower 1A",
        "type": "TECH_PARK",
        "lon": 77.6685,
        "lat": 12.9325,
        "height_m": 68.0,
        "levels": 18,
        "width_m": 80.0,
        "length_m": 55.0,
        "angle": 25.0
    },
    {
        "id": "BLD-TECH-02",
        "name": "RMZ Ecospace - Tower 1B",
        "type": "TECH_PARK",
        "lon": 77.6698,
        "lat": 12.9328,
        "height_m": 72.0,
        "levels": 19,
        "width_m": 85.0,
        "length_m": 55.0,
        "angle": 25.0
    },
    {
        "id": "BLD-TECH-03",
        "name": "RMZ Ecospace - Tower 2A",
        "type": "TECH_PARK",
        "lon": 77.6680,
        "lat": 12.9338,
        "height_m": 64.0,
        "levels": 16,
        "width_m": 75.0,
        "length_m": 50.0,
        "angle": 25.0
    },
    {
        "id": "BLD-TECH-04",
        "name": "RMZ Ecospace - Central Campus Hub",
        "type": "COMMERCIAL",
        "lon": 77.6692,
        "lat": 12.9342,
        "height_m": 35.0,
        "levels": 8,
        "width_m": 95.0,
        "length_m": 65.0,
        "angle": 25.0
    },
    # Intel ORR & Embassy TechVillage
    {
        "id": "BLD-TECH-05",
        "name": "Intel Campus ORR - R&D Tower A",
        "type": "TECH_PARK",
        "lon": 77.6740,
        "lat": 12.9310,
        "height_m": 78.0,
        "levels": 20,
        "width_m": 90.0,
        "length_m": 60.0,
        "angle": -15.0
    },
    {
        "id": "BLD-TECH-06",
        "name": "Intel Campus ORR - Innovation Center",
        "type": "TECH_PARK",
        "lon": 77.6752,
        "lat": 12.9315,
        "height_m": 65.0,
        "levels": 17,
        "width_m": 80.0,
        "length_m": 55.0,
        "angle": -15.0
    },
    {
        "id": "BLD-TECH-07",
        "name": "Embassy TechVillage - Block 9",
        "type": "TECH_PARK",
        "lon": 77.6715,
        "lat": 12.9285,
        "height_m": 82.0,
        "levels": 22,
        "width_m": 95.0,
        "length_m": 65.0,
        "angle": 10.0
    },
    # Forum Mall Koramangala & Commercial Corridor
    {
        "id": "BLD-COMM-01",
        "name": "Forum Mall Koramangala - Main Atrium",
        "type": "COMMERCIAL",
        "lon": 77.6115,
        "lat": 12.9355,
        "height_m": 45.0,
        "levels": 9,
        "width_m": 110.0,
        "length_m": 80.0,
        "angle": 0.0
    },
    {
        "id": "BLD-COMM-02",
        "name": "Forum Commercial Cineplex Tower",
        "type": "COMMERCIAL",
        "lon": 77.6125,
        "lat": 12.9360,
        "height_m": 54.0,
        "levels": 14,
        "width_m": 70.0,
        "length_m": 55.0,
        "angle": 0.0
    },
    # National Games Village Residential Blocks
    {
        "id": "BLD-RES-01",
        "name": "National Games Village - Block A (Godavari)",
        "type": "RESIDENTIAL_HIGH",
        "lon": 77.6235,
        "lat": 12.9430,
        "height_m": 52.0,
        "levels": 15,
        "width_m": 60.0,
        "length_m": 45.0,
        "angle": 45.0
    },
    {
        "id": "BLD-RES-02",
        "name": "National Games Village - Block B (Cauvery)",
        "type": "RESIDENTIAL_HIGH",
        "lon": 77.6245,
        "lat": 12.9438,
        "height_m": 52.0,
        "levels": 15,
        "width_m": 60.0,
        "length_m": 45.0,
        "angle": 45.0
    },
    {
        "id": "BLD-RES-03",
        "name": "National Games Village - Block C (Krishna)",
        "type": "RESIDENTIAL_HIGH",
        "lon": 77.6255,
        "lat": 12.9445,
        "height_m": 52.0,
        "levels": 15,
        "width_m": 60.0,
        "length_m": 45.0,
        "angle": 45.0
    },
    {
        "id": "BLD-RES-04",
        "name": "National Games Village - Block D (Narmada)",
        "type": "RESIDENTIAL_HIGH",
        "lon": 77.6225,
        "lat": 12.9435,
        "height_m": 48.0,
        "levels": 14,
        "width_m": 60.0,
        "length_m": 45.0,
        "angle": 45.0
    },
    # Sony World Signal Commercial District
    {
        "id": "BLD-COMM-03",
        "name": "Sony World Crossing Commercial Hub",
        "type": "COMMERCIAL",
        "lon": 77.6322,
        "lat": 12.9382,
        "height_m": 40.0,
        "levels": 10,
        "width_m": 70.0,
        "length_m": 50.0,
        "angle": -10.0
    },
    {
        "id": "BLD-COMM-04",
        "name": "Koramangala 80ft Apex Tower",
        "type": "COMMERCIAL",
        "lon": 77.6335,
        "lat": 12.9375,
        "height_m": 48.0,
        "levels": 12,
        "width_m": 65.0,
        "length_m": 45.0,
        "angle": -10.0
    },
    # Civic & Emergency Services
    {
        "id": "BLD-CIVIC-01",
        "name": "Koramangala Fire & Emergency Operations Post",
        "type": "CIVIC",
        "lon": 77.6290,
        "lat": 12.9315,
        "height_m": 22.0,
        "levels": 5,
        "width_m": 50.0,
        "length_m": 40.0,
        "angle": 0.0
    },
    {
        "id": "BLD-CIVIC-02",
        "name": "Koramangala Police Station & Traffic HQ",
        "type": "CIVIC",
        "lon": 77.6275,
        "lat": 12.9365,
        "height_m": 24.0,
        "levels": 5,
        "width_m": 45.0,
        "length_m": 35.0,
        "angle": 5.0
    },
    # Silk Board & HSR Gateway
    {
        "id": "BLD-COMM-05",
        "name": "Silk Board Junction Landmark Tower",
        "type": "COMMERCIAL",
        "lon": 77.6225,
        "lat": 12.9185,
        "height_m": 65.0,
        "levels": 17,
        "width_m": 75.0,
        "length_m": 55.0,
        "angle": 30.0
    },
    {
        "id": "BLD-COMM-06",
        "name": "HSR Sector 1 Gateway Plaza",
        "type": "COMMERCIAL",
        "lon": 77.6385,
        "lat": 12.9195,
        "height_m": 58.0,
        "levels": 15,
        "width_m": 70.0,
        "length_m": 50.0,
        "angle": 15.0
    },
    # Rainbow Drive Layout (Flood-Prone Catchment)
    {
        "id": "BLD-RES-05",
        "name": "Rainbow Drive Residential Enclave - Cluster A",
        "type": "RESIDENTIAL_LOW",
        "lon": 77.6710,
        "lat": 12.9145,
        "height_m": 12.0,
        "levels": 3,
        "width_m": 50.0,
        "length_m": 40.0,
        "angle": 0.0
    },
    {
        "id": "BLD-RES-06",
        "name": "Rainbow Drive Community Clubhouse",
        "type": "CIVIC",
        "lon": 77.6720,
        "lat": 12.9152,
        "height_m": 14.0,
        "levels": 3,
        "width_m": 45.0,
        "length_m": 35.0,
        "angle": 0.0
    },
    {
        "id": "BLD-RES-07",
        "name": "Rainbow Drive Residential Enclave - Cluster B",
        "type": "RESIDENTIAL_LOW",
        "lon": 77.6732,
        "lat": 12.9140,
        "height_m": 12.0,
        "levels": 3,
        "width_m": 55.0,
        "length_m": 42.0,
        "angle": 0.0
    }
]

def generate_urban_fabric_buildings() -> List[Dict[str, Any]]:
    """Generates deterministic urban building blocks filling the Koramangala-Bellandur urban basin."""
    buildings = list(LANDMARK_BUILDINGS)
    bld_counter = 100

    sectors = [
        {"name": "Koramangala Urban Block", "type": "COMMERCIAL", "min_lon": 77.615, "max_lon": 77.635, "min_lat": 12.932, "max_lat": 12.945, "h_min": 24, "h_max": 54, "n": 35},
        {"name": "HSR Layout Sector Tower", "type": "RESIDENTIAL_HIGH", "min_lon": 77.635, "max_lon": 77.655, "min_lat": 12.914, "max_lat": 12.930, "h_min": 28, "h_max": 65, "n": 35},
        {"name": "ORR Tech Park Pavilion", "type": "TECH_PARK", "min_lon": 77.656, "max_lon": 77.674, "min_lat": 12.925, "max_lat": 12.942, "h_min": 38, "h_max": 88, "n": 30},
        {"name": "Ejipura Urban Complex", "type": "RESIDENTIAL_HIGH", "min_lon": 77.620, "max_lon": 77.640, "min_lat": 12.945, "max_lat": 12.958, "h_min": 20, "h_max": 45, "n": 25}
    ]

    import random
    rng = random.Random(26085)  # SIH problem statement ID seed

    for sec in sectors:
        for i in range(sec["n"]):
            bld_counter += 1
            clon = rng.uniform(sec["min_lon"], sec["max_lon"])
            clat = rng.uniform(sec["min_lat"], sec["max_lat"])
            
            # Avoid lakes
            if 77.660 < clon < 77.674 and 12.934 < clat < 12.946:
                continue
            if 77.633 < clon < 77.644 and 12.918 < clat < 12.926:
                continue

            h = round(rng.uniform(sec["h_min"], sec["h_max"]), 1)
            levels = max(3, int(h / 3.4))
            wm = round(rng.uniform(40.0, 75.0), 1)
            lm = round(rng.uniform(35.0, 65.0), 1)
            ang = round(rng.uniform(-45.0, 45.0), 1)

            buildings.append({
                "id": f"BLD-URB-{bld_counter}",
                "name": f"{sec['name']} #{i+1}",
                "type": sec["type"],
                "lon": round(clon, 5),
                "lat": round(clat, 5),
                "height_m": h,
                "levels": levels,
                "width_m": wm,
                "length_m": lm,
                "angle": ang
            })

    features = []
    for b in buildings:
        poly_coords = _box_poly(b["lon"], b["lat"], b["width_m"], b["length_m"], b.get("angle", 0.0))
        features.append({
            "type": "Feature",
            "properties": {
                "id": b["id"],
                "name": b["name"],
                "type": b["type"],
                "height_m": b["height_m"],
                "levels": b["levels"],
                "lon": b["lon"],
                "lat": b["lat"],
                "area_m2": round(b["width_m"] * b["length_m"], 1),
                "data_source": "SIMULATED URBAN FABRIC (BENGALURU GIS)",
                "elevation_m": 900.0,
                "flood_risk": "SAFE",
                "nearest_flood_depth_cm": 0.0
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [poly_coords]
            }
        })

    return features

ALL_BUILDINGS_FEATURES = generate_urban_fabric_buildings()
