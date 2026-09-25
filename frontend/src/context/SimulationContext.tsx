import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  DataStatus,
  FloodPrediction,
  RainfallForecast,
  DrainageNetwork,
  AlertItem,
  ObservationPoint,
  ErrorMapData,
  ModelMetrics,
  RoadFeature,
  EmergencyFacility,
  RadarOverlayData,
  FloodRiskZone,
  SafeRouteResult,
  BuildingsGeoJSON,
  MapViewMode,
  TerrainContoursGeoJSON,
  CitySummary
} from '../types';
import { DEFAULT_TERRAIN_CONTOURS } from '../data/terrainContours';

interface SimulationContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  twinMode: '2d' | '3d';
  setTwinMode: (mode: '2d' | '3d') => void;
  mapViewMode: MapViewMode;
  setMapViewMode: (mode: MapViewMode) => void;
  satelliteOpacity: number;
  setSatelliteOpacity: (opacity: number) => void;
  blueprintOpacity: number;
  setBlueprintOpacity: (opacity: number) => void;
  floodOpacity: number;
  setFloodOpacity: (opacity: number) => void;
  showWireframe: boolean;
  setShowWireframe: (val: boolean) => void;
  showContours: boolean;
  setShowContours: (val: boolean) => void;
  contours: TerrainContoursGeoJSON | null;
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
  mapZoom: number;
  setMapZoom: (zoom: number) => void;
  dataMode: 'DEMO SIMULATION' | 'HISTORICAL REPLAY' | 'LIVE DATA';
  setDataMode: (mode: 'DEMO SIMULATION' | 'HISTORICAL REPLAY' | 'LIVE DATA', eventId?: string) => Promise<void>;
  activeHorizon: string;
  setActiveHorizon: (horizon: string) => Promise<void>;
  presentationMode: boolean;
  setPresentationMode: (val: boolean) => void;
  isRunningScenario: boolean;
  runFloodScenario: () => void;
  stopScenario: () => void;
  dashboardData: any;
  dataStatus: DataStatus | null;
  prediction: FloodPrediction | null;
  rainfallForecast: RainfallForecast | null;
  drainageNetwork: DrainageNetwork | null;
  roads: RoadFeature[];
  facilities: EmergencyFacility[];
  radarData: RadarOverlayData | null;
  riskZones: FloodRiskZone[];
  citizenReports: any[];
  activeRoute: SafeRouteResult | null;
  setActiveRoute: (route: SafeRouteResult | null) => void;
  alerts: AlertItem[];
  observations: ObservationPoint[];
  errorMap: ErrorMapData | null;
  modelMetrics: ModelMetrics | null;
  sensors: any[];
  buildings: BuildingsGeoJSON | null;
  refreshData: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  isDigitalTwinOpen: boolean;
  setIsDigitalTwinOpen: (open: boolean) => void;
  isStoryMode: boolean;
  setIsStoryMode: (active: boolean) => void;
  storyStep: number;
  setStoryStep: (step: number) => void;
  isStoryAutoPlaying: boolean;
  setIsStoryAutoPlaying: (playing: boolean) => void;
  isPresenterMode: boolean;
  setIsPresenterMode: (val: boolean) => void;
  showPresenterNotes: boolean;
  setShowPresenterNotes: (val: boolean) => void;
  focusTarget: { center: [number, number]; zoom: number; pitch?: number; bearing?: number } | null;
  setFocusTarget: (target: { center: [number, number]; zoom: number; pitch?: number; bearing?: number } | null) => void;
  startStoryMode: () => void;
  stopStoryMode: () => void;
  nextStoryStep: () => void;
  prevStoryStep: () => void;
  replayStoryMode: () => void;
  storySpeed: number;
  setStorySpeed: (speed: number) => void;
  
  // City-Agnostic Metropolitan Extensions
  selectedCity: string;
  selectedCityConfig: any | null;
  availableCities: CitySummary[];
  switchCity: (cityId: string) => Promise<void>;
  cityStoryData: any | null;
  cityWaterBodies: any | null;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [twinMode, setTwinMode] = useState<'2d' | '3d'>('2d');
  const [isDigitalTwinOpen, setIsDigitalTwinOpenState] = useState<boolean>(false);

  const setIsDigitalTwinOpen = (open: boolean) => {
    setIsDigitalTwinOpenState(open);
    if (open) {
      if (window.location.hash !== '#digital-twin') {
        window.location.hash = 'digital-twin';
      }
    } else {
      if (window.location.hash === '#digital-twin') {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      }
    }
  };

  useEffect(() => {
    const checkLocation = () => {
      if (window.location.hash === '#digital-twin' || window.location.pathname.includes('digital-twin')) {
        setIsDigitalTwinOpenState(true);
      }
    };
    checkLocation();
    window.addEventListener('hashchange', checkLocation);
    window.addEventListener('popstate', checkLocation);
    return () => {
      window.removeEventListener('hashchange', checkLocation);
      window.removeEventListener('popstate', checkLocation);
    };
  }, []);

  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('satellite_blueprint');
  const [satelliteOpacity, setSatelliteOpacity] = useState<number>(0.70);
  const [blueprintOpacity, setBlueprintOpacity] = useState<number>(0.35);
  const [floodOpacity, setFloodOpacity] = useState<number>(0.35);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [showContours, setShowContours] = useState<boolean>(false);
  const [contours, setContours] = useState<TerrainContoursGeoJSON | null>(DEFAULT_TERRAIN_CONTOURS);
  const [mapCenter, setMapCenter] = useState<[number, number]>([77.640, 12.937]);
  const [mapZoom, setMapZoom] = useState<number>(13.6);

  // City-Agnostic State
  const [selectedCity, setSelectedCity] = useState<string>('bengaluru');
  const [selectedCityConfig, setSelectedCityConfig] = useState<any | null>(null);
  const [availableCities, setAvailableCities] = useState<CitySummary[]>([]);
  const [cityStoryData, setCityStoryData] = useState<any | null>(null);
  const [cityWaterBodies, setCityWaterBodies] = useState<any | null>(null);

  const [dataMode, setMode] = useState<'DEMO SIMULATION' | 'HISTORICAL REPLAY' | 'LIVE DATA'>('DEMO SIMULATION');
  const [activeHorizon, setHorizonState] = useState<string>('0m');
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [isRunningScenario, setIsRunningScenario] = useState<boolean>(false);

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [prediction, setPrediction] = useState<FloodPrediction | null>(null);
  const [rainfallForecast, setRainfallForecast] = useState<RainfallForecast | null>(null);
  const [drainageNetwork, setDrainageNetwork] = useState<DrainageNetwork | null>(null);
  const [roads, setRoads] = useState<RoadFeature[]>([]);
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [radarData, setRadarData] = useState<RadarOverlayData | null>(null);
  const [riskZones, setRiskZones] = useState<FloodRiskZone[]>([]);
  const [citizenReports, setCitizenReports] = useState<any[]>([]);
  const [activeRoute, setActiveRoute] = useState<SafeRouteResult | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [observations, setObservations] = useState<ObservationPoint[]>([]);
  const [errorMap, setErrorMap] = useState<ErrorMapData | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [sensors, setSensors] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<BuildingsGeoJSON | null>(null);

  // Story Mode State
  const [isStoryMode, setIsStoryMode] = useState<boolean>(false);
  const [storyStep, setStoryStep] = useState<number>(1);
  const [isStoryAutoPlaying, setIsStoryAutoPlaying] = useState<boolean>(false);
  const [isPresenterMode, setIsPresenterMode] = useState<boolean>(false);
  const [showPresenterNotes, setShowPresenterNotes] = useState<boolean>(false);
  const [focusTarget, setFocusTarget] = useState<{ center: [number, number]; zoom: number; pitch?: number; bearing?: number } | null>(null);
  const [storySpeed, setStorySpeed] = useState<number>(1.0);

  const startStoryMode = () => {
    setIsStoryMode(true);
    setStoryStep(1);
    setActiveTab('map');
    setIsStoryAutoPlaying(false);
  };

  const stopStoryMode = () => {
    setIsStoryMode(false);
    setIsStoryAutoPlaying(false);
    setFocusTarget(null);
  };

  const nextStoryStep = () => {
    setStoryStep(prev => Math.min(10, prev + 1));
  };

  const prevStoryStep = () => {
    setStoryStep(prev => Math.max(1, prev - 1));
  };

  const replayStoryMode = () => {
    setIsStoryMode(true);
    setStoryStep(1);
    setActiveTab('map');
    setIsStoryAutoPlaying(true);
  };

  const refreshData = async () => {
    try {
      const [
        statusRes, dashRes, predRes, rainRes, drainRes,
        roadsRes, facRes, radarRes, zonesRes, repRes,
        alertRes, obsRes, errRes, metricsRes, sensRes, bldRes, contoursRes
      ] = await Promise.allSettled([
        api.getDataStatus(),
        api.getDashboardSummary(),
        api.getFloodPrediction(),
        api.getRainfallForecast(),
        api.getDrainageNetwork(),
        api.getRoads(),
        api.getFacilities(),
        api.getRadarOverlay(),
        api.getRiskZones(),
        api.getReports(),
        api.getAlerts(),
        api.getObservations(),
        api.getErrorMap(),
        api.getModelMetrics(),
        api.getSensors(),
        api.getBuildings(),
        api.getContours(),
      ]);

      if (statusRes.status === 'fulfilled') {
        setDataStatus(statusRes.value);
        setMode(statusRes.value.data_mode);
      }
      if (dashRes.status === 'fulfilled') {
        setDashboardData(dashRes.value);
        if (dashRes.value.active_city_id) setSelectedCity(dashRes.value.active_city_id);
      }
      if (predRes.status === 'fulfilled') setPrediction(predRes.value);
      if (rainRes.status === 'fulfilled') setRainfallForecast(rainRes.value);
      if (drainRes.status === 'fulfilled') setDrainageNetwork(drainRes.value);
      if (roadsRes.status === 'fulfilled') setRoads(roadsRes.value?.roads || []);
      if (facRes.status === 'fulfilled') setFacilities(facRes.value?.facilities || []);
      if (radarRes.status === 'fulfilled') setRadarData(radarRes.value || null);
      if (zonesRes.status === 'fulfilled') setRiskZones(zonesRes.value?.risk_zones || []);
      if (repRes.status === 'fulfilled') setCitizenReports(repRes.value || []);
      if (alertRes.status === 'fulfilled') setAlerts(alertRes.value);
      if (obsRes.status === 'fulfilled') setObservations(obsRes.value);
      if (errRes.status === 'fulfilled') setErrorMap(errRes.value);
      if (metricsRes.status === 'fulfilled') setModelMetrics(metricsRes.value);
      if (sensRes.status === 'fulfilled') setSensors(sensRes.value);
      if (bldRes.status === 'fulfilled') setBuildings(bldRes.value);
      if (contoursRes.status === 'fulfilled' && contoursRes.value?.features) setContours(contoursRes.value);

      // Dynamic safe route initialization
      if (!activeRoute) {
        try {
          const rt = await api.calculateSafeRoute({
            vehicle: 'ambulance',
            horizon: activeHorizon,
            forecast_horizon_minutes: 60,
          });
          rt.selected_route = rt.recommended_route || 'emergency';
          setActiveRoute(rt);
        } catch (rtErr) {
          // background fallback
        }
      }
    } catch (e) {
      console.warn('Refresh error:', e);
    }
  };

  // Initial load: available cities and initial profile
  useEffect(() => {
    const initCities = async () => {
      try {
        const cRes = await api.getCities();
        if (cRes?.cities) {
          setAvailableCities(cRes.cities);
          const active = cRes.active_city_id || 'bengaluru';
          setSelectedCity(active);
          
          const prof = await api.getCityProfile(active);
          if (prof) {
            setSelectedCityConfig(prof);
            if (prof.center) {
              setMapCenter([prof.center.longitude, prof.center.latitude]);
            }
          }
          const dt = await api.getCityDigitalTwin(active);
          if (dt?.water_bodies) setCityWaterBodies(dt.water_bodies);
          const st = await api.getCityStory(active);
          if (st) setCityStoryData(st);
        }
      } catch (err) {
        console.warn('Failed to initialize cities:', err);
      }
    };
    initCities();
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Switch Active City
  const switchCity = async (cityId: string) => {
    try {
      setSelectedCity(cityId);
      await api.selectCity(cityId);

      const [profRes, dtRes, storyRes] = await Promise.allSettled([
        api.getCityProfile(cityId),
        api.getCityDigitalTwin(cityId),
        api.getCityStory(cityId)
      ]);

      if (profRes.status === 'fulfilled' && profRes.value) {
        setSelectedCityConfig(profRes.value);
        if (profRes.value.center) {
          setMapCenter([profRes.value.center.longitude, profRes.value.center.latitude]);
          setMapZoom(13.6);
        }
      }

      if (dtRes.status === 'fulfilled' && dtRes.value) {
        if (dtRes.value.buildings) setBuildings(dtRes.value.buildings);
        if (dtRes.value.water_bodies) setCityWaterBodies(dtRes.value.water_bodies);
      }

      if (storyRes.status === 'fulfilled' && storyRes.value) {
        setCityStoryData(storyRes.value);
      }

      setActiveRoute(null);
      await refreshData();
    } catch (e) {
      console.warn("City switch error:", e);
    }
  };

  const setDataMode = async (mode: 'DEMO SIMULATION' | 'HISTORICAL REPLAY' | 'LIVE DATA', eventId?: string) => {
    setMode(mode);
    await api.setDataMode(mode, eventId);
    await refreshData();
  };

  const setActiveHorizon = async (horizon: string) => {
    setHorizonState(horizon);
    await api.updateSimulationConfig({ horizon });
    await refreshData();
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a => (a.alert_id === alertId ? { ...a, acknowledged: true } : a)));
    } catch (e) {
      console.warn(e);
    }
  };

  // Automated 60-second flood demonstration time-lapse
  const runFloodScenario = () => {
    setIsRunningScenario(true);
    const sequence = ['0m', '15m', '30m', '45m', '1h', '2h', '3h'];
    let step = 0;

    const interval = setInterval(async () => {
      step++;
      if (step < sequence.length) {
        const nextHorizon = sequence[step];
        setHorizonState(nextHorizon);
        await api.updateSimulationConfig({ horizon: nextHorizon });
        await refreshData();
      } else {
        clearInterval(interval);
        setIsRunningScenario(false);
      }
    }, 4500); // 4.5s per horizon step
  };

  const stopScenario = () => {
    setIsRunningScenario(false);
  };

  return (
    <SimulationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        twinMode,
        setTwinMode,
        mapViewMode,
        setMapViewMode,
        satelliteOpacity,
        setSatelliteOpacity,
        blueprintOpacity,
        setBlueprintOpacity,
        floodOpacity,
        setFloodOpacity,
        showWireframe,
        setShowWireframe,
        showContours,
        setShowContours,
        contours,
        mapCenter,
        setMapCenter,
        mapZoom,
        setMapZoom,
        dataMode,
        setDataMode,
        activeHorizon,
        setActiveHorizon,
        presentationMode,
        setPresentationMode,
        isRunningScenario,
        runFloodScenario,
        stopScenario,
        dashboardData,
        dataStatus,
        prediction,
        rainfallForecast,
        drainageNetwork,
        roads,
        facilities,
        radarData,
        riskZones,
        citizenReports,
        activeRoute,
        setActiveRoute,
        alerts,
        observations,
        errorMap,
        modelMetrics,
        sensors,
        buildings,
        refreshData,
        acknowledgeAlert,
        isDigitalTwinOpen,
        setIsDigitalTwinOpen,
        isStoryMode,
        setIsStoryMode,
        storyStep,
        setStoryStep,
        isStoryAutoPlaying,
        setIsStoryAutoPlaying,
        isPresenterMode,
        setIsPresenterMode,
        showPresenterNotes,
        setShowPresenterNotes,
        focusTarget,
        setFocusTarget,
        startStoryMode,
        stopStoryMode,
        nextStoryStep,
        prevStoryStep,
        replayStoryMode,
        storySpeed,
        setStorySpeed,

        // City-Agnostic Extensions
        selectedCity,
        selectedCityConfig,
        availableCities,
        switchCity,
        cityStoryData,
        cityWaterBodies,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) throw new Error('useSimulation must be used within SimulationProvider');
  return context;
};
