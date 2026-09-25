// UFNS API Service Client
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`API call failed for ${endpoint}, returning fallback:`, err);
    throw err;
  }
}

export const api = {
  // Data Status & Mode
  getDataStatus: () => fetchJson<any>('/api/data/status'),
  getDataQuality: () => fetchJson<any>('/api/data/quality'),
  setDataMode: (mode: string, eventId?: string) =>
    fetchJson<any>('/api/data/mode', { method: 'POST', body: JSON.stringify({ mode, event_id: eventId }) }),

  // Dashboard summary
  getDashboardSummary: () => fetchJson<any>('/api/dashboard'),

  // Rainfall & Radar
  getCurrentRainfall: () => fetchJson<any>('/api/rainfall/current'),
  getRainfallForecast: () => fetchJson<any>('/api/rainfall/forecast'),
  getRadarStatus: () => fetchJson<any>('/api/radar/status'),

  // Flood prediction & Ground truth
  getFloodPrediction: () => fetchJson<any>('/api/flood/prediction'),
  getObservations: () => fetchJson<any[]>('/api/flood/observations'),
  getErrorMap: () => fetchJson<any>('/api/flood/error-map'),

  // Roads & Infrastructure
  getRoads: () => fetchJson<any>('/api/roads'),
  getFacilities: () => fetchJson<any>('/api/facilities'),
  getBuildings: () => fetchJson<any>('/api/buildings'),
  getBuildingsStatus: () => fetchJson<any>('/api/buildings/status'),
  getRadarOverlay: () => fetchJson<any>('/api/radar'),
  getRiskZones: () => fetchJson<any>('/api/flood/risk-zones'),
  getContours: () => fetchJson<any>('/api/dem/contours'),
  getDemStatus: () => fetchJson<any>('/api/dem/status'),

  // Drainage
  getDrainageNetwork: () => fetchJson<any>('/api/drainage/network'),
  getDrainageStatus: () => fetchJson<any>('/api/drainage/status'),

  // Routing
  calculateSafeRoute: (params: {
    origin?: { lat: number; lng?: number; lon?: number };
    destination?: { lat: number; lng?: number; lon?: number };
    start_lat?: number;
    start_lon?: number;
    dest_lat?: number;
    dest_lon?: number;
    vehicle?: string;
    vehicle_type?: string;
    horizon?: string;
    forecast_horizon_minutes?: number;
  }) => fetchJson<any>('/api/routes/calculate', { method: 'POST', body: JSON.stringify(params) }),

  // Alerts
  getAlerts: () => fetchJson<any[]>('/api/alerts'),
  acknowledgeAlert: (alertId: string) =>
    fetchJson<any>(`/api/alerts/${alertId}/ack`, { method: 'POST' }),

  // Citizen Reports & Sensors
  getSensors: () => fetchJson<any[]>('/api/sensors'),
  getReports: () => fetchJson<any[]>('/api/reports'),
  submitReport: (data: { lat: number; lon: number; category: string; water_depth_cm: number; description?: string }) =>
    fetchJson<any>('/api/reports', { method: 'POST', body: JSON.stringify(data) }),

  // Calibration
  runCalibration: () => fetchJson<any>('/api/calibration/run', { method: 'POST' }),

  // Historical Replay
  getHistoricalEvents: () => fetchJson<any[]>('/api/historical/events'),
  replayHistoricalEvent: (eventId: string, horizon?: string) =>
    fetchJson<any>('/api/historical/replay', { method: 'POST', body: JSON.stringify({ event_id: eventId, horizon }) }),

  // Simulation controls
  updateSimulationConfig: (config: { rainfall_mm_hr?: number; drainage_capacity_mult?: number; horizon?: string; preset?: string }) =>
    fetchJson<any>('/api/simulation/config', { method: 'POST', body: JSON.stringify(config) }),
  resetSimulation: () => fetchJson<any>('/api/simulation/reset', { method: 'POST' }),
  startScenario: () => fetchJson<any>('/api/simulation/start', { method: 'POST' }),
  compareScenarios: () => fetchJson<any>('/api/simulation/scenarios/compare'),

  // Analytics & ML models
  getAnalytics: () => fetchJson<any>('/api/analytics'),
  getModelStatus: () => fetchJson<any>('/api/model/status'),
  getModelMetrics: () => fetchJson<any>('/api/model/metrics'),
  getModelUncertainty: () => fetchJson<any>('/api/model/uncertainty'),
  getModelRegistry: () => fetchJson<any>('/api/model/registry'),

  // City-Agnostic Metropolitan Endpoints
  getCities: () => fetchJson<{ total_cities: number; active_city_id: string; cities: any[] }>('/api/cities'),
  getMetropolitanOverview: () => fetchJson<any>('/api/cities/comparison'),
  getCityProfile: (cityId: string) => fetchJson<any>(`/api/cities/${cityId}`),
  selectCity: (cityId: string) => fetchJson<any>(`/api/cities/${cityId}/select`, { method: 'POST' }),
  getCityDigitalTwin: (cityId: string) => fetchJson<any>(`/api/cities/${cityId}/digital-twin`),
  getCityStory: (cityId: string) => fetchJson<any>(`/api/cities/${cityId}/story`),
  getCityDem: (cityId: string) => fetchJson<any>(`/api/cities/${cityId}/dem`),
};
