// UFNS Demonstration Story Mode Data & Step Configurations
// 10-Scene Physical Demonstration Narrative with Strict Water & Topographic Semantics
import { StoryStageConfig } from '../types';

export const PREDICTED_FLOOD_ZONE_POLYGON: [number, number][] = [
  [77.620, 12.931],
  [77.624, 12.941],
  [77.636, 12.946],
  [77.652, 12.944],
  [77.664, 12.939],
  [77.668, 12.933],
  [77.656, 12.927],
  [77.638, 12.925],
  [77.624, 12.928],
  [77.620, 12.931]
];

// Meaningful DEM Elevation Markers from NASA SRTM / Cartosat-1 Topographic Survey
export const DEMO_ALTITUDE_MARKERS: { lat: number; lon: number; elevM: number; label: string; tag: string }[] = [
  { lat: 12.946, lon: 77.618, elevM: 915.0, label: '915 m AMSL', tag: '▲ HIGH (Ridge)' },
  { lat: 12.941, lon: 77.625, elevM: 905.0, label: '905 m AMSL', tag: '▲ UPPER SLOPE' },
  { lat: 12.936, lon: 77.633, elevM: 895.0, label: '895 m AMSL', tag: '● MID SLOPE' },
  { lat: 12.934, lon: 77.642, elevM: 885.0, label: '885 m AMSL', tag: '● LOWER BASIN' },
  { lat: 12.934, lon: 77.658, elevM: 875.0, label: '875 m AMSL', tag: '▼ LOW POINT (Trough)' }
];

export interface WhyThisAreaFactor {
  stepNumber: string;
  factor: string;
  value: string;
  benchmark: string;
  impact: string;
  icon: string;
  color: string;
  actionSummary: string;
}

export const WHY_THIS_AREA_DATA: WhyThisAreaFactor[] = [
  {
    stepNumber: '01',
    factor: 'HEAVY RAINFALL',
    value: '82.0 mm/hr',
    benchmark: '> 50 mm/hr extreme',
    impact: 'Massive precipitation volume overwhelming surface retention',
    icon: 'CloudRain',
    color: '#38bdf8',
    actionSummary: 'Doppler radar detects severe convective precipitation hotspot'
  },
  {
    stepNumber: '02',
    factor: 'SURFACE RUNOFF',
    value: '0.88 Runoff Coeff',
    benchmark: '82.4% Impervious',
    impact: 'Zero soil infiltration; rainwater converts instantly into overland sheet flow',
    icon: 'Activity',
    color: '#38bdf8',
    actionSummary: 'Overland flow vectors direct 2.4 m³/s of water into depression'
  },
  {
    stepNumber: '03',
    factor: 'LOW ELEVATION',
    value: '875.0 m AMSL',
    benchmark: 'Lowest in Watershed',
    impact: 'Gravity-driven surface runoff concentrates into natural valley trough',
    icon: 'Mountain',
    color: '#cbd5e1',
    actionSummary: 'Terrain depression acts as an inescapable natural collection basin'
  },
  {
    stepNumber: '04',
    factor: 'DRAINAGE BOTTLENECK',
    value: '2.5 m³/s Limit',
    benchmark: '108% Surcharge Load',
    impact: 'Subterranean conduit exceeds capacity, forcing reverse backflow to surface',
    icon: 'GitFork',
    color: '#f97316',
    actionSummary: 'Drainage network surcharges, turning stormwater drains into surface flood emitters'
  },
  {
    stepNumber: '05',
    factor: 'CRITICAL FLOOD RISK',
    value: '46.5 cm Depth',
    benchmark: '> 25 cm Ambulance Clearance',
    impact: 'Surface inundation blocks critical roads and isolates medical facilities',
    icon: 'AlertTriangle',
    color: '#ef4444',
    actionSummary: 'UFNS detects road impassability and dynamically reroutes emergency services'
  }
];

export const STORY_STAGES: StoryStageConfig[] = [
  {
    id: 1,
    stageNumber: 1,
    milestone: '01 CITY',
    progressMilestone: 'Rainfall',
    title: 'NORMAL URBAN BASELINE',
    subtitle: 'Koramangala – Bellandur Urban Watershed (Bengaluru)',
    badge: 'NORMAL URBAN CONDITION',
    narration: "Let's see how UFNS responds when an urban flood event begins.",
    problem: 'Dry, normal conditions across arterial corridors with regular city traffic.',
    effect: 'Gravity drainage network operating with 12% baseline dry-weather flow.',
    evidence: 'Precipitation: 0.0 mm/hr • Roads: 100% Passable • Drainage: Normal capacity.',
    action: 'UFNS maintains continuous 2-way coupled hydrologic baselines across city infrastructure.',
    presenterNotes: 'Start with the wide city overview. Indian megacities experience flash flooding in 30-60 minutes. UFNS establishes a continuous physics-based baseline.',
    durationSeconds: 4,
    singleLabel: 'UFNS FLOOD NOWCASTING BASELINE',
    semanticColor: '#38bdf8',
    camera: {
      center: [12.936, 77.642],
      zoom: 13.0,
      pitch: 40,
      bearing: -15,
      durationMs: 2000
    },
    visibleLayers: {
      buildings: true,
      roads: true,
      facilities: true,
      radar: false,
      floodZoneBoundary: false,
      floodGrid: false,
      drainage: false,
      surchargeNodeHighlight: false,
      blockedRoadsHighlight: false,
      routes: false,
      ambulance: false,
      elevationContours: false,
      runoffVectors: false,
      drainageFlow: false
    }
  },
  {
    id: 2,
    stageNumber: 2,
    milestone: '02 RAIN',
    progressMilestone: 'Rainfall',
    title: 'HEAVY RAINFALL DETECTED',
    subtitle: 'Doppler Radar Convective Precipitation Tracking',
    badge: 'SEVERE RAINFALL ALERT',
    narration: 'Severe convective precipitation enters the watershed, concentrating intense rainfall over the central catchment.',
    problem: 'Cloudburst intensity (82.0 mm/hr) overwhelms standard natural soil infiltration (12 mm/hr).',
    effect: 'Immediate generation of massive overland sheet runoff across 82.4% impervious urban concrete.',
    evidence: 'Rainfall: 82.0 mm/hr • Radar Reflectivity: 58 dBZ • Infiltration Deficit: 70 mm/hr • Lead Time: 45 min.',
    action: 'UFNS initiates high-resolution 2D overland flood nowcasting 45 minutes ahead of street accumulation.',
    presenterNotes: 'Notice how the rest of the city dims to 40% opacity while the rainfall hotspot stands out with animated sky-blue rain streaks.',
    durationSeconds: 6,
    singleLabel: 'RAINFALL HOTSPOT (82 mm/hr)',
    semanticColor: '#38bdf8',
    spotlightTarget: {
      center: [12.937, 77.640],
      radiusKm: 2.2
    },
    camera: {
      center: [12.937, 77.638],
      zoom: 13.8,
      pitch: 42,
      bearing: -12,
      durationMs: 1800
    },
    visibleLayers: {
      buildings: true,
      roads: true,
      facilities: true,
      radar: true,
      floodZoneBoundary: false,
      floodGrid: false,
      drainage: false,
      surchargeNodeHighlight: false,
      blockedRoadsHighlight: false,
      routes: false,
      ambulance: false,
      elevationContours: false,
      runoffVectors: false,
      drainageFlow: false
    }
  },
  {
    id: 3,
    stageNumber: 3,
    milestone: '03 ALTITUDE',
    progressMilestone: 'Altitude',
    title: 'WHY HERE? ALTITUDE & CONTOURS',
    subtitle: 'Digital Elevation Model (DEM) Topographic Survey (875m – 915m AMSL)',
    badge: 'TOPOGRAPHIC ELEVATION',
    narration: 'Elevation dictates where water accumulates. The watershed slopes naturally from 915m AMSL down to an 875m AMSL catchment trough.',
    problem: 'Natural topographic depression forms a low-lying bowl at 875 m AMSL.',
    effect: 'Lower terrain contributes directly to runoff concentration and rapid water pooling.',
    evidence: 'High: 915 m • Mid: 895 m • Low: 875 m AMSL • Watershed Drop: 40 meters.',
    action: 'UFNS DEM engine maps multi-scale elevation contours and catchment slope gradients without artificial coloring.',
    presenterNotes: 'Point out the elevation contour lines and the 915m, 905m, 895m, 885m, and 875m labels directly on the map. Notice how the base map remains natural with zero color distortion.',
    durationSeconds: 6,
    singleLabel: 'ELEVATION PROFILE: 915m → 875m AMSL',
    semanticColor: '#cbd5e1',
    elevationProfileActive: true,
    spotlightTarget: {
      center: [12.936, 77.636],
      radiusKm: 2.0
    },
    camera: {
      center: [12.936, 77.636],
      zoom: 14.4,
      pitch: 45,
      bearing: -16,
      durationMs: 1800
    },
    visibleLayers: {
      buildings: false,
      roads: true,
      facilities: false,
      radar: false,
      floodZoneBoundary: false,
      floodGrid: false,
      drainage: false,
      surchargeNodeHighlight: false,
      blockedRoadsHighlight: false,
      routes: false,
      ambulance: false,
      elevationContours: true,
      runoffVectors: false,
      drainageFlow: false
    }
  },
  {
    id: 4,
    stageNumber: 4,
    milestone: '04 RUNOFF',
    progressMilestone: 'Runoff',
    title: 'SURFACE RUNOFF CONVERGENCE',
    subtitle: 'Gravity-Driven Overland Sheet Flow (High → Low)',
    badge: 'OVERLAND SHEET FLOW',
    narration: 'Runoff streams follow the terrain gradient, cascading from higher elevation down towards the low-lying valley.',
    problem: 'Impervious urban surfaces convert 88% of precipitation into instant downhill sheet flow.',
    effect: 'Stormwater accelerates along road grades towards the central depression at 2.4 m³/s.',
    evidence: 'Runoff Coefficient: 0.88 • Overland Velocity: 1.4 m/s • Flow Direction: 915m ➔ 875m.',
    action: '2D Saint-Venant shallow water equations simulate real-time hydrodynamic flow vectors.',
    presenterNotes: 'Watch the animated sky-blue runoff lines and particles travel downhill along the slope into the central collection trough.',
    durationSeconds: 6,
    singleLabel: 'RUNOFF CONVERGING TOWARD LOWER TERRAIN',
    semanticColor: '#38bdf8',
    spotlightTarget: {
      center: [12.935, 77.635],
      radiusKm: 1.8
    },
    camera: {
      center: [12.935, 77.635],
      zoom: 14.5,
      pitch: 46,
      bearing: -18,
      durationMs: 1600
    },
    visibleLayers: {
      buildings: true,
      roads: true,
      facilities: false,
      radar: false,
      floodZoneBoundary: false,
      floodGrid: false,
      drainage: false,
      surchargeNodeHighlight: false,
      blockedRoadsHighlight: false,
      routes: false,
      ambulance: false,
      elevationContours: true,
      runoffVectors: true,
      drainageFlow: false
    }
  },
  {
    id: 5,
    stageNumber: 5,
    milestone: '05 FLOOD',
    progressMilestone: 'Flood',
    title: 'WATER ACCUMULATION & FLOOD FILL',
    subtitle: 'Dynamic Hydrodynamic Inundation Expansion (0 → 46.5 cm)',
    badge: 'PROGRESSIVE WATER FILLING',
    narration: 'Surface water accumulates faster than the ground can absorb it. Flood water gradually pools, reaching 46.5 cm depth.',
    problem: 'Water pools progressively in low-lying cells conforming to topography.',
    effect: 'Water depth increases from 5 cm to 46.5 cm, posing severe vehicle stranding risks.',
    evidence: 'Max Predicted Depth: 46.5 cm • Inundation Area: 1.84 km² • Population Exposed: ~12,400.',
    action: 'Real-time depth solver updates inundation extent cell-by-cell in graduated blue intensity.',
    presenterNotes: 'Notice that water is NOT a flat rectangle. It visibly fills the depression, turning from light blue (0-5cm) to deep blue (15-30cm) to strong dark blue (>30cm).',
    durationSeconds: 8,
    singleLabel: 'ACCUMULATED FLOOD WATER (46.5 cm)',
    semanticColor: '#2563eb',
    liveDepthCm: 46.5,
    spotlightTarget: {
      center: [12.934, 77.635],
      radiusKm: 1.6
    },
    camera: {
      center: [12.934, 77.635],
      zoom: 14.6,
      pitch: 48,
      bearing: -20,
      durationMs: 1800
    },
    visibleLayers: {
      buildings: true,
      roads: true,
      facilities: true,
      radar: false,
      floodZoneBoundary: true,
      floodGrid: true,
      drainage: false,
      surchargeNodeHighlight: false,
      blockedRoadsHighlight: false,
      routes: false,
      ambulance: false,
      elevationContours: false,
      runoffVectors: false,
      drainageFlow: false
    }
  },
  {
    id: 6,
    stageNumber: 6,
    milestone: '06 DRAINAGE',
    progressMilestone: 'Drainage',
    title: 'SUBTERRANEAN DRAINAGE CONDUITS',
    subtitle: 'White Drainage Network & Gravity Flow',
    badge: 'DRAINAGE CONDUITS ACTIVE',
    narration: 'Beneath the city, white drainage conduits carry stormwater away toward primary outfalls.',
    problem: 'Heavy surface inflow enters stormwater grates across the catchment.',
    effect: 'White pipes transport water at high velocity; conduit load increases from 42% to 85%.',
    evidence: 'Conduit Material: Reinforced Concrete • Design Q: 2.5 m³/s • Active Load: 85%.',
    action: 'UFNS monitors network graph topology, calculating Manning capacity and hydraulic utilization.',
    presenterNotes: 'Look at the white drainage pipes. Sky-blue particles move through them toward the outfall, demonstrating that the drainage system is functioning normally under early rainfall.',
    durationSeconds: 6,
    singleLabel: 'DRAINAGE CAPACITY INCREASING (85%)',
    semanticColor: '#ffffff',
    liveDrainageLoadPct: 85,
    spotlightTarget: {
      center: [12.934, 77.630],
      radiusKm: 1.4
    },
    camera: {
      center: [12.934, 77.630],
      zoom: 15.0,
      pitch: 50,
      bearing: -22,
      durationMs: 1600
    },
    visibleLayers: {
      buildings: true,
      roads: true,
      facilities: false,
      radar: false,
      floodZoneBoundary: false,
      floodGrid: false,
      drainage: true,
      surchargeNodeHighlight: false,
      blockedRoadsHighlight: false,
      routes: false,
      ambulance: false,
      elevationContours: false,
      runoffVectors: false,
      drainageFlow: true
    }
  },
  {
    id: 7,
    stageNumber: 7,
    milestone: '07 SURCHARGE',
    progressMilestone: 'Drainage',
    title: 'DRAINAGE SURCHARGE & BACKFLOW',
    subtitle: 'Localized Underground Cutaway • Node M02 (108% Load)',
    badge: 'SURCHARGE & REVERSE FLOW',
    narration: 'Conduit capacity is exceeded. At Junction M02, flow reverses direction—water erupts upward out of the manhole onto the street.',
    problem: 'Conduit inflow (2.7 m³/s) exceeds full-pipe capacity (2.5 m³/s), reaching 108% surcharge load.',
    effect: 'Positive hydraulic backpressure (+18 cm head) reverses up through manholes, flooding surrounding street grade.',
    evidence: 'Junction: M02 (80ft Rd) • Capacity: 2.5 m³/s • Inflow: 2.7 m³/s • Load: 108% • Backflow: ACTIVE.',
    action: '2-way coupled pipe-to-surface solver models reverse surcharge backflow and alerts commanders.',
    presenterNotes: 'Watch the localized cutaway around node M02. The node turns AMBER then RED. The sky-blue flow particles reverse direction, rising from the pipe up through the manhole onto the street.',
    durationSeconds: 8,
    singleLabel: '⚠ DRAINAGE SURCHARGE (108% LOAD) - BACKFLOW ACTIVE',
    semanticColor: '#ef4444',
    cutawayActive: true,
    backflowActive: true,
    liveDrainageLoadPct: 108,
    spotlightTarget: {
      center: [12.934, 77.625],
      radiusKm: 0.9
    },
    camera: {
      center: [12.934, 77.625],
      zoom: 15.6,
      pitch: 55,
      bearing: -25,
      durationMs: 1800
    },
    visibleLayers: {
      buildings: true,
      roads: true,
      facilities: true,
      radar: false,
      floodZoneBoundary: false,
      floodGrid: true,
      drainage: true,
      surchargeNodeHighlight: true,
      blockedRoadsHighlight: false,
      routes: false,
      ambulance: false,
      elevationContours: false,
      runoffVectors: false,
      drainageFlow: true
    }
  },
  {
    id: 8,
    stageNumber: 8,
    milestone: '08 ROADS',
    progressMilestone: 'Roads',
    title: 'ROAD IMPACT: KORAMANGALA 80FT RD',
    subtitle: 'Vehicular Clearance Limit Exceeded',
    badge: 'ROAD BLOCKED (46.5 cm)',
    narration: 'Backflow spills onto Koramangala 80ft Road. Water depth reaches 46.5 cm, exceeding the 25 cm ambulance clearance threshold.',
    problem: 'Standing water depth (46.5 cm) makes road impassable to civilian cars and emergency ambulances.',
    effect: 'Critical medical transport corridor is blocked; passing vehicles face catastrophic engine stalling.',
    evidence: 'Road: Koramangala 80ft Rd • Water Depth: 46.5 cm • Vehicle Clearance: 25 cm • Status: BLOCKED.',
    action: 'Clearance router updates road travel status to BLOCKED and flags intersection hazard.',
    presenterNotes: 'Show the red road blockage. Point out that dispatching an ambulance here without UFNS would submerge the vehicle in 46.5 cm of water.',
    durationSeconds: 6,
    singleLabel: '⛔ ROAD BLOCKED (46.5 cm > 25 cm clearance)',
    semanticColor: '#ef4444',
    roadStatusTransition: true,
    spotlightTarget: {
      center: [12.934, 77.625],
      radiusKm: 1.1
    },
    camera: {
      center: [12.934, 77.627],
      zoom: 15.0,
      pitch: 48,
      bearing: -20,
      durationMs: 1600
    },
    visibleLayers: {
      buildings: true,
      roads: true,
      facilities: true,
      radar: false,
      floodZoneBoundary: false,
      floodGrid: false,
      drainage: false,
      surchargeNodeHighlight: false,
      blockedRoadsHighlight: true,
      routes: false,
      ambulance: false,
      elevationContours: false,
      runoffVectors: false,
      drainageFlow: false
    }
  },
  {
    id: 9,
    stageNumber: 9,
    milestone: '09 ROUTE',
    progressMilestone: 'Emergency',
    title: 'FLOOD-AWARE EMERGENCY ROUTING',
    subtitle: 'St. John Hospital → Sakra Trauma Center (Guaranteed Safe Bypass)',
    badge: 'VERIFIED SAFE CORRIDOR',
    narration: 'Direct route through Koramangala 80ft Road is impassable. UFNS recalculates a guaranteed 0% flood hazard bypass for ambulance dispatch.',
    problem: 'Direct shortest route would strand ambulance in 46.5 cm of standing water.',
    effect: 'Verified green bypass adds 1.4 km but guarantees 100% passable passage with zero flood immersion.',
    evidence: 'Distance: 9.2 km • Time: 12.6 min • Max Depth: 0.2 cm • Hazard Exposure: 0% • Vehicle: 🚑 Active.',
    action: 'A* clearance router dispatches emergency ambulance 🚑 along verified green corridor.',
    presenterNotes: 'Watch the camera follow the safe green route as the live ambulance navigates around the flood zone directly to Sakra Trauma Center.',
    durationSeconds: 8,
    singleLabel: '✓ SAFE EMERGENCY ROUTE (0% FLOOD HAZARD)',
    semanticColor: '#10b981',
    safeRouteActive: true,
    shortestRouteBlocked: true,
    spotlightTarget: {
      center: [12.935, 77.650],
      radiusKm: 3.8
    },
    camera: {
      center: [12.935, 77.650],
      zoom: 13.7,
      pitch: 46,
      bearing: -12,
      durationMs: 1800
    },
    visibleLayers: {
      buildings: true,
      roads: true,
      facilities: true,
      radar: false,
      floodZoneBoundary: false,
      floodGrid: false,
      drainage: false,
      surchargeNodeHighlight: false,
      blockedRoadsHighlight: true,
      routes: true,
      ambulance: true,
      elevationContours: false,
      runoffVectors: false,
      drainageFlow: false
    }
  },
  {
    id: 10,
    stageNumber: 10,
    milestone: '10 SOLUTION',
    progressMilestone: 'Solution',
    title: 'UFNS COMPLETE FLOOD RESPONSE',
    subtitle: 'Unified Command Center Synthesis • From Prediction to Action',
    badge: 'SYSTEM-WIDE RESOLUTION',
    narration: 'The complete system operates in harmony: predicting rain, detecting surcharge, warning traffic, and ensuring safe emergency transit.',
    problem: 'Urban flood disasters require instantaneous convergence of multiple domain models.',
    effect: 'Zero lives lost, zero emergency vehicles stranded, automated infrastructure protection.',
    evidence: 'PREDICT: 45 min lead • DETECT: 108% load • WARN: 8 roads secured • RESPOND: 100% dispatch success.',
    action: 'UFNS delivers continuous real-time nowcasting, transforming theoretical simulations into decisive life-saving action.',
    presenterNotes: 'Conclude with the 4 pillars: PREDICT, DETECT, WARN, RESPOND. "From Prediction to Action".',
    durationSeconds: 8,
    singleLabel: 'UFNS: PREDICT → DETECT → WARN → RESPOND',
    semanticColor: '#06b6d4',
    camera: {
      center: [12.936, 77.642],
      zoom: 13.0,
      pitch: 40,
      bearing: -15,
      durationMs: 2200
    },
    visibleLayers: {
      buildings: true,
      roads: true,
      facilities: true,
      radar: true,
      floodZoneBoundary: true,
      floodGrid: true,
      drainage: true,
      surchargeNodeHighlight: true,
      blockedRoadsHighlight: true,
      routes: true,
      ambulance: true,
      elevationContours: true,
      runoffVectors: false,
      drainageFlow: true
    }
  }
];
// City-Adaptive Story Generator: Produces customized 10-Scene narratives for any Indian metropolis
export function getStoryStagesForCity(cityConfig: any): StoryStageConfig[] {
  if (!cityConfig) return STORY_STAGES;

  const cityName = cityConfig.city || 'Metropolitan';
  const basinName = cityConfig.focus_basin?.name || cityConfig.story?.basin_name || `${cityName} Basin`;
  const hotspotRoad = cityConfig.story?.hotspot_road || 'Central Arterial Underpass';
  const surchargeNode = cityConfig.story?.surcharge_node || 'Main Drainage Outfall Junction';
  const hospitalOrig = cityConfig.story?.hospital_origin || 'District General Hospital';
  const hospitalDest = cityConfig.story?.hospital_dest || 'Emergency Trauma Center';
  const safeBypass = cityConfig.story?.safe_bypass || 'Elevated Bypass Corridor';
  const highElev = cityConfig.story?.elevation_high ?? (cityConfig.dem?.max_elevation_m ?? 915.0);
  const lowElev = cityConfig.story?.elevation_low ?? (cityConfig.dem?.min_elevation_m ?? 875.0);
  const elevDiff = Math.max(10, Math.round(highElev - lowElev));
  
  const poses = cityConfig.story?.camera_poses || {};
  const cLat = cityConfig.center?.latitude || 12.936;
  const cLon = cityConfig.center?.longitude || 77.642;

  const getCamera = (poseKey: string, defZoom: number, defPitch: number, defBearing: number, defDur: number) => {
    const p = poses[poseKey];
    if (p && p.center) {
      return {
        center: [p.center[0], p.center[1]] as [number, number],
        zoom: p.zoom ?? defZoom,
        pitch: p.pitch ?? defPitch,
        bearing: p.bearing ?? defBearing,
        durationMs: defDur
      };
    }
    return {
      center: [cLat, cLon] as [number, number],
      zoom: defZoom,
      pitch: defPitch,
      bearing: defBearing,
      durationMs: defDur
    };
  };

  return [
    {
      id: 1,
      stageNumber: 1,
      milestone: '01 CITY',
      progressMilestone: 'Rainfall',
      title: 'NORMAL URBAN BASELINE',
      subtitle: `${basinName} (${cityName})`,
      badge: 'NORMAL URBAN CONDITION',
      narration: `Let's see how UFNS responds when an urban flood event begins in ${cityName}.`,
      problem: `Dry, normal conditions across arterial corridors with regular city traffic in ${cityName}.`,
      effect: 'Gravity drainage network operating with 12% baseline dry-weather flow.',
      evidence: 'Precipitation: 0.0 mm/hr • Roads: 100% Passable • Drainage: Normal capacity.',
      action: 'UFNS maintains continuous 2-way coupled hydrologic baselines across city infrastructure.',
      presenterNotes: `Start with the wide ${cityName} overview. Indian megacities experience flash flooding in 30-60 minutes. UFNS establishes a continuous physics-based baseline.`,
      durationSeconds: 4,
      singleLabel: `UFNS ${cityName.toUpperCase()} NOWCASTING BASELINE`,
      semanticColor: '#38bdf8',
      camera: getCamera('city_view', 13.0, 40, -15, 2000),
      visibleLayers: {
        buildings: true, roads: true, facilities: true, radar: false,
        floodZoneBoundary: false, floodGrid: false, drainage: false,
        surchargeNodeHighlight: false, blockedRoadsHighlight: false,
        routes: false, ambulance: false, elevationContours: false,
        runoffVectors: false, drainageFlow: false
      }
    },
    {
      id: 2,
      stageNumber: 2,
      milestone: '02 RAIN',
      progressMilestone: 'Rainfall',
      title: 'HEAVY RAINFALL DETECTED',
      subtitle: `Doppler Radar Convective Precipitation Tracking (${cityName})`,
      badge: 'SEVERE RAINFALL ALERT',
      narration: `Severe convective precipitation enters ${basinName}, concentrating intense rainfall over the central catchment.`,
      problem: 'Cloudburst intensity (82.0 mm/hr) overwhelms standard natural soil infiltration (12 mm/hr).',
      effect: 'Immediate generation of massive overland sheet runoff across 82.4% impervious urban concrete.',
      evidence: 'Rainfall: 82.0 mm/hr • Radar Reflectivity: 58 dBZ • Infiltration Deficit: 70 mm/hr • Lead Time: 45 min.',
      action: 'UFNS initiates high-resolution 2D overland flood nowcasting 45 minutes ahead of street accumulation.',
      presenterNotes: 'Notice how the rest of the city dims to 40% opacity while the rainfall hotspot stands out with animated sky-blue rain streaks.',
      durationSeconds: 6,
      singleLabel: 'RAINFALL HOTSPOT (82 mm/hr)',
      semanticColor: '#38bdf8',
      spotlightTarget: {
        center: getCamera('storm_focus', 13.8, 42, -12, 1800).center,
        radiusKm: 2.2
      },
      camera: getCamera('storm_focus', 13.8, 42, -12, 1800),
      visibleLayers: {
        buildings: true, roads: true, facilities: true, radar: true,
        floodZoneBoundary: false, floodGrid: false, drainage: false,
        surchargeNodeHighlight: false, blockedRoadsHighlight: false,
        routes: false, ambulance: false, elevationContours: false,
        runoffVectors: false, drainageFlow: false
      }
    },
    {
      id: 3,
      stageNumber: 3,
      milestone: '03 ALTITUDE',
      progressMilestone: 'Altitude',
      title: 'WHY HERE? ALTITUDE & CONTOURS',
      subtitle: `Digital Elevation Model (DEM) Topographic Survey (${lowElev}m – ${highElev}m AMSL)`,
      badge: 'TOPOGRAPHIC ELEVATION',
      narration: `Elevation dictates where water accumulates. The watershed slopes naturally from ${highElev}m AMSL down to an ${lowElev}m AMSL catchment trough.`,
      problem: `Natural topographic depression forms a low-lying bowl at ${lowElev} m AMSL.`,
      effect: 'Lower terrain contributes directly to runoff concentration and rapid water pooling.',
      evidence: `High: ${highElev} m • Low: ${lowElev} m AMSL • Watershed Drop: ${elevDiff} meters.`,
      action: 'UFNS DEM engine maps multi-scale elevation contours and catchment slope gradients without artificial coloring.',
      presenterNotes: `Point out the elevation contour lines and the clean AMSL labels directly on the map. Notice how the base map remains natural with zero color distortion.`,
      durationSeconds: 6,
      singleLabel: `ELEVATION PROFILE: ${highElev}m → ${lowElev}m AMSL`,
      semanticColor: '#cbd5e1',
      elevationProfileActive: true,
      spotlightTarget: {
        center: getCamera('altitude_focus', 14.4, 45, -16, 1800).center,
        radiusKm: 2.0
      },
      camera: getCamera('altitude_focus', 14.4, 45, -16, 1800),
      visibleLayers: {
        buildings: false, roads: true, facilities: false, radar: false,
        floodZoneBoundary: false, floodGrid: false, drainage: false,
        surchargeNodeHighlight: false, blockedRoadsHighlight: false,
        routes: false, ambulance: false, elevationContours: true,
        runoffVectors: false, drainageFlow: false
      }
    },
    {
      id: 4,
      stageNumber: 4,
      milestone: '04 RUNOFF',
      progressMilestone: 'Runoff',
      title: 'SURFACE RUNOFF CONVERGENCE',
      subtitle: 'Gravity-Driven Overland Sheet Flow (High → Low)',
      badge: 'OVERLAND SHEET FLOW',
      narration: `Runoff streams follow the terrain gradient, cascading from ${highElev}m elevation down towards the low-lying ${hotspotRoad} corridor.`,
      problem: 'Impervious urban surfaces convert 88% of precipitation into instant downhill sheet flow.',
      effect: 'Stormwater accelerates along road grades towards the central depression at 2.4 m³/s.',
      evidence: `Runoff Coefficient: 0.88 • Overland Velocity: 1.4 m/s • Flow Direction: ${highElev}m ➔ ${lowElev}m.`,
      action: '2D Saint-Venant shallow water equations simulate real-time hydrodynamic flow vectors.',
      presenterNotes: 'Watch the animated sky-blue runoff lines and particles travel downhill along the slope into the central collection trough.',
      durationSeconds: 6,
      singleLabel: 'RUNOFF CONVERGING TOWARD LOWER TERRAIN',
      semanticColor: '#38bdf8',
      spotlightTarget: {
        center: getCamera('runoff_focus', 14.5, 46, -18, 1600).center,
        radiusKm: 1.8
      },
      camera: getCamera('runoff_focus', 14.5, 46, -18, 1600),
      visibleLayers: {
        buildings: true, roads: true, facilities: false, radar: false,
        floodZoneBoundary: false, floodGrid: false, drainage: false,
        surchargeNodeHighlight: false, blockedRoadsHighlight: false,
        routes: false, ambulance: false, elevationContours: true,
        runoffVectors: true, drainageFlow: false
      }
    },
    {
      id: 5,
      stageNumber: 5,
      milestone: '05 FLOOD',
      progressMilestone: 'Flood',
      title: 'WATER ACCUMULATION & FLOOD FILL',
      subtitle: 'Dynamic Hydrodynamic Inundation Expansion (0 → 46.5 cm)',
      badge: 'PROGRESSIVE WATER FILLING',
      narration: `Surface water accumulates faster than the ground can absorb it. Flood water gradually pools along ${hotspotRoad}, reaching 46.5 cm depth.`,
      problem: 'Water pools progressively in low-lying cells conforming to topography.',
      effect: 'Water depth increases from 5 cm to 46.5 cm, posing severe vehicle stranding risks.',
      evidence: 'Max Predicted Depth: 46.5 cm • Inundation Area: 1.84 km² • Population Exposed: ~12,400.',
      action: 'Real-time depth solver updates inundation extent cell-by-cell in graduated blue intensity.',
      presenterNotes: 'Notice that water is NOT a flat rectangle. It visibly fills the depression, turning from light blue (0-5cm) to deep blue (15-30cm) to strong dark blue (>30cm).',
      durationSeconds: 8,
      singleLabel: 'ACCUMULATED FLOOD WATER (46.5 cm)',
      semanticColor: '#2563eb',
      liveDepthCm: 46.5,
      spotlightTarget: {
        center: getCamera('flood_trough', 14.6, 48, -20, 1800).center,
        radiusKm: 1.6
      },
      camera: getCamera('flood_trough', 14.6, 48, -20, 1800),
      visibleLayers: {
        buildings: true, roads: true, facilities: true, radar: false,
        floodZoneBoundary: true, floodGrid: true, drainage: false,
        surchargeNodeHighlight: false, blockedRoadsHighlight: false,
        routes: false, ambulance: false, elevationContours: false,
        runoffVectors: false, drainageFlow: false
      }
    },
    {
      id: 6,
      stageNumber: 6,
      milestone: '06 DRAINAGE',
      progressMilestone: 'Drainage',
      title: 'SUBTERRANEAN DRAINAGE CONDUITS',
      subtitle: 'White Drainage Network & Gravity Flow',
      badge: 'DRAINAGE CONDUITS ACTIVE',
      narration: `Beneath ${cityName}, white drainage conduits carry stormwater away toward primary outfalls.`,
      problem: 'Heavy surface inflow enters stormwater grates across the catchment.',
      effect: 'White pipes transport water at high velocity; conduit load increases from 42% to 85%.',
      evidence: 'Conduit Material: Reinforced Concrete • Design Q: 2.5 m³/s • Active Load: 85%.',
      action: 'UFNS monitors network graph topology, calculating Manning capacity and hydraulic utilization.',
      presenterNotes: 'Look at the white drainage pipes. Sky-blue particles move through them toward the outfall, demonstrating that the drainage system is functioning normally under early rainfall.',
      durationSeconds: 6,
      singleLabel: 'DRAINAGE CAPACITY INCREASING (85%)',
      semanticColor: '#ffffff',
      liveDrainageLoadPct: 85,
      spotlightTarget: {
        center: getCamera('drainage_subterranean', 15.0, 50, -22, 1600).center,
        radiusKm: 1.4
      },
      camera: getCamera('drainage_subterranean', 15.0, 50, -22, 1600),
      visibleLayers: {
        buildings: true, roads: true, facilities: false, radar: false,
        floodZoneBoundary: false, floodGrid: false, drainage: true,
        surchargeNodeHighlight: false, blockedRoadsHighlight: false,
        routes: false, ambulance: false, elevationContours: false,
        runoffVectors: false, drainageFlow: true
      }
    },
    {
      id: 7,
      stageNumber: 7,
      milestone: '07 SURCHARGE',
      progressMilestone: 'Drainage',
      title: 'DRAINAGE SURCHARGE & BACKFLOW',
      subtitle: `Localized Underground Cutaway • ${surchargeNode} (108% Load)`,
      badge: 'SURCHARGE & REVERSE FLOW',
      narration: `Conduit capacity is exceeded. At ${surchargeNode}, flow reverses direction—water erupts upward out of the manhole onto the street.`,
      problem: 'Conduit inflow (2.7 m³/s) exceeds full-pipe capacity (2.5 m³/s), reaching 108% surcharge load.',
      effect: 'Positive hydraulic backpressure (+18 cm head) reverses up through manholes, flooding surrounding street grade.',
      evidence: `Junction: ${surchargeNode} • Capacity: 2.5 m³/s • Inflow: 2.7 m³/s • Load: 108% • Backflow: ACTIVE.`,
      action: '2-way coupled pipe-to-surface solver models reverse surcharge backflow and alerts commanders.',
      presenterNotes: 'Watch the localized cutaway around the surcharging node. The node turns AMBER then RED. The sky-blue flow particles reverse direction, rising from the pipe up through the manhole onto the street.',
      durationSeconds: 8,
      singleLabel: '⚠ DRAINAGE SURCHARGE (108% LOAD) - BACKFLOW ACTIVE',
      semanticColor: '#ef4444',
      cutawayActive: true,
      backflowActive: true,
      liveDrainageLoadPct: 108,
      spotlightTarget: {
        center: getCamera('surcharge_manhole', 15.6, 55, -25, 1800).center,
        radiusKm: 0.9
      },
      camera: getCamera('surcharge_manhole', 15.6, 55, -25, 1800),
      visibleLayers: {
        buildings: true, roads: true, facilities: true, radar: false,
        floodZoneBoundary: false, floodGrid: true, drainage: true,
        surchargeNodeHighlight: true, blockedRoadsHighlight: false,
        routes: false, ambulance: false, elevationContours: false,
        runoffVectors: false, drainageFlow: true
      }
    },
    {
      id: 8,
      stageNumber: 8,
      milestone: '08 ROADS',
      progressMilestone: 'Roads',
      title: `ROAD IMPACT: ${hotspotRoad.toUpperCase()}`,
      subtitle: 'Vehicular Clearance Limit Exceeded',
      badge: 'ROAD BLOCKED (46.5 cm)',
      narration: `Backflow spills onto ${hotspotRoad}. Water depth reaches 46.5 cm, exceeding the 25 cm ambulance clearance threshold.`,
      problem: 'Standing water depth (46.5 cm) makes road impassable to civilian cars and emergency ambulances.',
      effect: 'Critical medical transport corridor is blocked; passing vehicles face catastrophic engine stalling.',
      evidence: `Road: ${hotspotRoad} • Water Depth: 46.5 cm • Vehicle Clearance: 25 cm • Status: BLOCKED.`,
      action: 'Clearance router updates road travel status to BLOCKED and flags intersection hazard.',
      presenterNotes: 'Show the red road blockage. Point out that dispatching an ambulance here without UFNS would submerge the vehicle in 46.5 cm of water.',
      durationSeconds: 6,
      singleLabel: '⛔ ROAD BLOCKED (46.5 cm > 25 cm clearance)',
      semanticColor: '#ef4444',
      roadStatusTransition: true,
      spotlightTarget: {
        center: getCamera('road_submerged', 15.0, 48, -20, 1600).center,
        radiusKm: 1.1
      },
      camera: getCamera('road_submerged', 15.0, 48, -20, 1600),
      visibleLayers: {
        buildings: true, roads: true, facilities: true, radar: false,
        floodZoneBoundary: false, floodGrid: false, drainage: false,
        surchargeNodeHighlight: false, blockedRoadsHighlight: true,
        routes: false, ambulance: false, elevationContours: false,
        runoffVectors: false, drainageFlow: false
      }
    },
    {
      id: 9,
      stageNumber: 9,
      milestone: '09 ROUTE',
      progressMilestone: 'Emergency',
      title: 'FLOOD-AWARE EMERGENCY ROUTING',
      subtitle: `${hospitalOrig} → ${hospitalDest} (${safeBypass})`,
      badge: 'VERIFIED SAFE CORRIDOR',
      narration: `Direct route through ${hotspotRoad} is impassable. UFNS recalculates a guaranteed 0% flood hazard bypass via ${safeBypass} for ambulance dispatch.`,
      problem: 'Direct shortest route would strand ambulance in 46.5 cm of standing water.',
      effect: 'Verified green bypass adds safe distance but guarantees 100% passable passage with zero flood immersion.',
      evidence: `Distance: 9.2 km • Time: 12.6 min • Max Depth: 0.2 cm • Hazard Exposure: 0% • Vehicle: 🚑 Active • Route: ${safeBypass}.`,
      action: 'A* clearance router dispatches emergency ambulance 🚑 along verified green corridor.',
      presenterNotes: `Watch the camera follow the safe green route as the live ambulance navigates around the flood zone directly to ${hospitalDest}.`,
      durationSeconds: 8,
      singleLabel: '✓ SAFE EMERGENCY ROUTE (0% FLOOD HAZARD)',
      semanticColor: '#10b981',
      safeRouteActive: true,
      shortestRouteBlocked: true,
      spotlightTarget: {
        center: getCamera('route_tracking', 13.7, 46, -12, 1800).center,
        radiusKm: 3.8
      },
      camera: getCamera('route_tracking', 13.7, 46, -12, 1800),
      visibleLayers: {
        buildings: true, roads: true, facilities: true, radar: false,
        floodZoneBoundary: false, floodGrid: false, drainage: false,
        surchargeNodeHighlight: false, blockedRoadsHighlight: true,
        routes: true, ambulance: true, elevationContours: false,
        runoffVectors: false, drainageFlow: false
      }
    },
    {
      id: 10,
      stageNumber: 10,
      milestone: '10 SOLUTION',
      progressMilestone: 'Solution',
      title: 'UFNS COMPLETE FLOOD RESPONSE',
      subtitle: `Unified Command Center Synthesis • ${cityName} Metropolitan Response`,
      badge: 'SYSTEM-WIDE RESOLUTION',
      narration: `The complete system operates in harmony across ${cityName}: predicting rain, detecting surcharge, warning traffic, and ensuring safe emergency transit.`,
      problem: 'Urban flood disasters require instantaneous convergence of multiple domain models.',
      effect: 'Zero lives lost, zero emergency vehicles stranded, automated infrastructure protection.',
      evidence: 'PREDICT: 45 min lead • DETECT: 108% load • WARN: 8 roads secured • RESPOND: 100% dispatch success.',
      action: 'UFNS delivers continuous real-time nowcasting, transforming theoretical simulations into decisive life-saving action.',
      presenterNotes: 'Conclude with the 4 pillars: PREDICT, DETECT, WARN, RESPOND. "From Prediction to Action".',
      durationSeconds: 8,
      singleLabel: 'UFNS: PREDICT → DETECT → WARN → RESPOND',
      semanticColor: '#06b6d4',
      camera: getCamera('solution_overview', 13.0, 40, -15, 2200),
      visibleLayers: {
        buildings: true, roads: true, facilities: true, radar: true,
        floodZoneBoundary: true, floodGrid: true, drainage: true,
        surchargeNodeHighlight: true, blockedRoadsHighlight: true,
        routes: true, ambulance: true, elevationContours: true,
        runoffVectors: false, drainageFlow: true
      }
    }
  ];
}

export function getWhyThisAreaForCity(cityConfig: any): WhyThisAreaFactor[] {
  if (!cityConfig) return WHY_THIS_AREA_DATA;

  const lowElev = cityConfig.story?.elevation_low ?? (cityConfig.dem?.min_elevation_m ?? 875.0);
  const basinName = cityConfig.focus_basin?.name || cityConfig.story?.basin_name || 'Catchment Basin';
  const surchargeNode = cityConfig.story?.surcharge_node || 'Primary Drainage Node M02';
  const hotspotRoad = cityConfig.story?.hotspot_road || 'Central Arterial Corridor';

  return [
    {
      stepNumber: '01',
      factor: 'HEAVY RAINFALL',
      value: '82.0 mm/hr',
      benchmark: '> 50 mm/hr extreme',
      impact: `Massive precipitation volume overwhelming surface retention across ${basinName}`,
      icon: 'CloudRain',
      color: '#38bdf8',
      actionSummary: 'Doppler radar detects severe convective precipitation hotspot'
    },
    {
      stepNumber: '02',
      factor: 'SURFACE RUNOFF',
      value: '0.88 Runoff Coeff',
      benchmark: '82.4% Impervious',
      impact: 'Zero soil infiltration; rainwater converts instantly into overland sheet flow',
      icon: 'Activity',
      color: '#38bdf8',
      actionSummary: 'Overland flow vectors direct 2.4 m³/s of water into depression'
    },
    {
      stepNumber: '03',
      factor: 'LOW ELEVATION',
      value: `${lowElev.toFixed(1)} m AMSL`,
      benchmark: `Lowest Point in ${basinName}`,
      impact: 'Gravity-driven surface runoff concentrates into natural valley trough',
      icon: 'Mountain',
      color: '#cbd5e1',
      actionSummary: 'Terrain depression acts as an inescapable natural collection basin'
    },
    {
      stepNumber: '04',
      factor: 'DRAINAGE BOTTLENECK',
      value: '2.5 m³/s Limit',
      benchmark: `108% Surcharge at ${surchargeNode}`,
      impact: 'Subterranean conduit exceeds capacity, forcing reverse backflow to surface',
      icon: 'GitFork',
      color: '#f97316',
      actionSummary: 'Drainage network surcharges, turning stormwater drains into surface flood emitters'
    },
    {
      stepNumber: '05',
      factor: 'CRITICAL FLOOD RISK',
      value: '46.5 cm Depth',
      benchmark: '> 25 cm Ambulance Clearance',
      impact: `Surface inundation blocks ${hotspotRoad} and isolates medical facilities`,
      icon: 'AlertTriangle',
      color: '#ef4444',
      actionSummary: 'UFNS detects road impassability and dynamically reroutes emergency services'
    }
  ];
}

export function getAltitudeMarkersForCity(cityConfig: any) {
  if (cityConfig?.dem?.markers && Array.isArray(cityConfig.dem.markers) && cityConfig.dem.markers.length > 0) {
    return cityConfig.dem.markers;
  }
  return DEMO_ALTITUDE_MARKERS;
}
