// UFNS Cinematic Story Camera Controller
// Manages smooth ease-in-out camera transitions, zooms, panning, and route tracking across Leaflet (2D) and MapLibre (3D)

export interface CameraPose {
  center: [number, number]; // [lat, lng] for Leaflet
  zoom: number;
  pitch?: number;
  bearing?: number;
  durationMs?: number;
}

export class StoryCameraController {
  private leafletMap: any | null = null;
  private maplibreMap: any | null = null;
  private trackingAnimFrame: number | null = null;

  constructor(leafletMap?: any, maplibreMap?: any) {
    this.leafletMap = leafletMap || null;
    this.maplibreMap = maplibreMap || null;
  }

  public setLeafletMap(map: any | null) {
    this.leafletMap = map;
  }

  public setMaplibreMap(map: any | null) {
    this.maplibreMap = map;
  }

  /**
   * Smoothly focus on a target geographic coordinate with specified zoom, pitch, bearing.
   */
  public focusArea(
    center: [number, number], // [lat, lng]
    zoom: number,
    pitch: number = 0,
    bearing: number = 0,
    durationMs: number = 2000
  ) {
    this.cancelRouteTracking();

    // 1. Leaflet (2D)
    if (this.leafletMap) {
      this.leafletMap.flyTo(center, zoom, {
        animate: true,
        duration: durationMs / 1000,
        easeLinearity: 0.25 // Smooth cubic ease
      });
    }

    // 2. MapLibre (3D)
    if (this.maplibreMap) {
      this.maplibreMap.flyTo({
        center: [center[1], center[0]], // [lng, lat]
        zoom: zoom,
        pitch: pitch,
        bearing: bearing,
        duration: durationMs,
        essential: true
      });
    }
  }

  /**
   * Zoom in by a delta with smooth transition
   */
  public zoomIn(delta: number = 1.5, durationMs: number = 1500) {
    if (this.leafletMap) {
      const currentZoom = this.leafletMap.getZoom();
      this.leafletMap.setZoom(currentZoom + delta, { animate: true, duration: durationMs / 1000 });
    }
    if (this.maplibreMap) {
      this.maplibreMap.zoomTo(this.maplibreMap.getZoom() + delta, { duration: durationMs });
    }
  }

  /**
   * Zoom out by a delta with smooth transition
   */
  public zoomOut(delta: number = 1.5, durationMs: number = 1500) {
    if (this.leafletMap) {
      const currentZoom = this.leafletMap.getZoom();
      this.leafletMap.setZoom(Math.max(10, currentZoom - delta), { animate: true, duration: durationMs / 1000 });
    }
    if (this.maplibreMap) {
      this.maplibreMap.zoomTo(Math.max(10, this.maplibreMap.getZoom() - delta), { duration: durationMs });
    }
  }

  /**
   * Smooth pan without altering current zoom
   */
  public panTo(center: [number, number], durationMs: number = 1800) {
    if (this.leafletMap) {
      this.leafletMap.panTo(center, { animate: true, duration: durationMs / 1000 });
    }
    if (this.maplibreMap) {
      this.maplibreMap.panTo([center[1], center[0]], { duration: durationMs });
    }
  }

  /**
   * Rotate 3D camera bearing smoothly
   */
  public orbit(targetBearing: number, durationMs: number = 3000) {
    if (this.maplibreMap) {
      this.maplibreMap.rotateTo(targetBearing, { duration: durationMs });
    }
  }

  /**
   * Reset to wide city overview
   */
  public reset(durationMs: number = 2200) {
    const defaultCenter: [number, number] = [12.936, 77.642];
    this.focusArea(defaultCenter, 13.0, 40, -15, durationMs);
  }

  /**
   * Smoothly follow a multi-point route from origin to destination
   */
  public followRoute(
    coordinates: [number, number][], // [[lat, lng], ...]
    durationMs: number = 6000,
    onProgress?: (progress: number, currentPos: [number, number]) => void,
    onComplete?: () => void
  ) {
    this.cancelRouteTracking();
    if (!coordinates || coordinates.length < 2) {
      if (onComplete) onComplete();
      return;
    }

    const startTime = performance.now();
    const totalSegments = coordinates.length - 1;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(1.0, elapsed / durationMs);

      // Smooth easeInOutCubic
      const easedProgress = rawProgress < 0.5
        ? 4 * rawProgress * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

      const globalIndex = easedProgress * totalSegments;
      const segIndex = Math.min(Math.floor(globalIndex), totalSegments - 1);
      const fraction = globalIndex - segIndex;

      const p0 = coordinates[segIndex];
      const p1 = coordinates[segIndex + 1];

      const currentLat = p0[0] + (p1[0] - p0[0]) * fraction;
      const currentLon = p0[1] + (p1[1] - p0[1]) * fraction;
      const currentPos: [number, number] = [currentLat, currentLon];

      // Pan cameras gently
      if (this.leafletMap) {
        this.leafletMap.panTo(currentPos, { animate: false });
      }
      if (this.maplibreMap) {
        this.maplibreMap.setCenter([currentLon, currentLat]);
      }

      if (onProgress) {
        onProgress(easedProgress, currentPos);
      }

      if (rawProgress < 1.0) {
        this.trackingAnimFrame = requestAnimationFrame(step);
      } else {
        this.trackingAnimFrame = null;
        if (onComplete) onComplete();
      }
    };

    this.trackingAnimFrame = requestAnimationFrame(step);
  }

  public cancelRouteTracking() {
    if (this.trackingAnimFrame !== null) {
      cancelAnimationFrame(this.trackingAnimFrame);
      this.trackingAnimFrame = null;
    }
  }
}

export const globalStoryCamera = new StoryCameraController();
