from fastapi import APIRouter
from ..simulation.state_manager import state_manager
from ..config import DOMAIN_BOUNDS

router = APIRouter(prefix="/api/dem", tags=["dem"])

@router.get("/status")
def get_dem_status():
    sm = state_manager
    return {
        "dem_source": "REAL (30m SRTM/Cartosat Topographic Baseline)" if sm.data_mode in ["HISTORICAL REPLAY", "LIVE DATA"] else "SIMULATED SYNTHETIC BASIN",
        "spatial_resolution_m": 350.0,
        "elevation_min_m": float(round(sm.surface_grid.elevation_matrix.min(), 1)),
        "elevation_max_m": float(round(sm.surface_grid.elevation_matrix.max(), 1)),
        "mean_slope_deg": float(round(sm.surface_grid.slope_matrix.mean(), 1)),
        "status": "LOADED"
    }

@router.get("/grid")
def get_dem_grid():
    sm = state_manager
    return {
        "elevation": sm.surface_grid.elevation_matrix.tolist(),
        "slope": sm.surface_grid.slope_matrix.tolist(),
        "flow_direction": sm.surface_grid.flow_dir_matrix.tolist(),
        "imperviousness": sm.surface_grid.imperviousness_matrix.tolist()
    }

_cached_contours = None

@router.get("/contours")
def get_dem_contours():
    global _cached_contours
    if _cached_contours is not None:
        return _cached_contours

    sm = state_manager
    elev = sm.surface_grid.elevation_matrix
    min_lat, max_lat = DOMAIN_BOUNDS["min_lat"], DOMAIN_BOUNDS["max_lat"]
    min_lon, max_lon = DOMAIN_BOUNDS["min_lon"], DOMAIN_BOUNDS["max_lon"]
    rows, cols = elev.shape

    levels = [875.0, 880.0, 885.0, 890.0, 895.0, 900.0, 905.0, 910.0, 915.0]
    
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots()
    cs = ax.contour(elev, levels=levels)

    features = []
    for lvl, segs in zip(cs.levels, cs.allsegs):
        is_index = (int(lvl) % 10 == 0)
        multi_coords = []
        for seg in segs:
            if len(seg) < 2:
                continue
            line = []
            for pt in seg:
                c_idx, r_idx = float(pt[0]), float(pt[1])
                lon = round(min_lon + (c_idx / (cols - 1)) * (max_lon - min_lon), 6)
                lat = round(min_lat + (r_idx / (rows - 1)) * (max_lat - min_lat), 6)
                line.append([lon, lat])
            if len(line) >= 2:
                multi_coords.append(line)

        if multi_coords:
            features.append({
                "type": "Feature",
                "properties": {
                    "elevation_m": float(lvl),
                    "label": f"{int(lvl)}m",
                    "type": "INDEX" if is_index else "INTERMEDIATE",
                    "color": "#38bdf8" if lvl <= 880 else ("#06b6d4" if lvl <= 890 else ("#10b981" if lvl <= 900 else ("#f59e0b" if lvl <= 910 else "#f97316")))
                },
                "geometry": {
                    "type": "MultiLineString",
                    "coordinates": multi_coords
                }
            })

    plt.close(fig)

    result = {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "source": "UFNS 16x16 DEM Isocontour Extractor",
            "interval_m": 5.0,
            "levels": levels,
            "count": len(features)
        }
    }
    _cached_contours = result
    return result
