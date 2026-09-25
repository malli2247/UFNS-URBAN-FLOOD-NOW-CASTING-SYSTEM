// Centralized Scientific Semantic Color Palette for UFNS Urban Flood Engine
// STRICT WATER & INFRASTRUCTURE SEMANTICS ENFORCED:
// - SKY BLUE: Moving Water (rain, downhill runoff, pipe flow, rising backflow)
// - BLUE: Accumulated Flood Water (graduated 5-tier depth intensity)
// - WHITE: Drainage Infrastructure (pipes, collectors, manholes)
// - NO ALTITUDE COLORS: Neutral technical contour lines only

export const DEMO_FLOOD_COLORS = {
  SHALLOW: '#93c5fd',    // 0–5 cm: light translucent blue
  MODERATE: '#3b82f6',   // 5–15 cm: clear medium hydrological blue
  HIGH: '#2563eb',       // 15–30 cm: deep blue
  VERY_HIGH: '#1d4ed8',  // 30–50 cm: strong dark blue
  CRITICAL: '#1e3a8a',   // >50 cm: deep midnight blue
} as const;

export const ROUTE_PALETTE = {
  SHORTEST: '#cbd5e1',   // Neutral white / slate
  FASTEST: '#06b6d4',    // Bright cyan
  SAFEST: '#10b981',     // Emerald green (safe bypass)
  EMERGENCY: '#f43f5e',  // Neon magenta / emergency priority
  shortest: '#cbd5e1',
  fastest: '#06b6d4',
  safest: '#10b981',
  emergency: '#f43f5e',
} as const;

export const DRAINAGE_PALETTE = {
  NORMAL: '#ffffff',     // Pure White: normal drainage conduits & manholes
  WARNING: '#f59e0b',    // Surcharge warning amber (>85% load)
  SURCHARGED: '#ef4444', // Surcharge backflow red (>100% capacity)
  normal: '#ffffff',
  warning: '#f59e0b',
  surcharged: '#ef4444',
} as const;

// Dedicated Moving Water Color
export const WATER_MOVING_COLOR = '#38bdf8'; // Sky Blue for moving water / rain / runoff / backflow

// Neutral Technical Topographic Contours (No elevation color coding)
export const CONTOUR_NEUTRAL_COLOR = 'rgba(203, 213, 225, 0.65)'; // Technical slate/silver

/**
 * Maps predicted water depth in cm to the scientific blue flood palette
 */
export const getFloodDepthColor = (depthCm: number): string => {
  if (depthCm <= 0.5) return 'transparent';
  if (depthCm < 5) return DEMO_FLOOD_COLORS.SHALLOW;
  if (depthCm < 15) return DEMO_FLOOD_COLORS.MODERATE;
  if (depthCm < 30) return DEMO_FLOOD_COLORS.HIGH;
  if (depthCm < 50) return DEMO_FLOOD_COLORS.VERY_HIGH;
  return DEMO_FLOOD_COLORS.CRITICAL;
};

/**
 * Returns human-readable depth classification label
 */
export const getFloodDepthLabel = (depthCm: number): string => {
  if (depthCm <= 0.5) return 'NORMAL (DRY)';
  if (depthCm < 5) return 'SHALLOW RUNOFF (0–5 cm)';
  if (depthCm < 15) return 'MODERATE PONDING (5–15 cm)';
  if (depthCm < 30) return 'DEEP WATER (15–30 cm)';
  if (depthCm < 50) return 'SEVERE FLOOD (30–50 cm)';
  return 'CRITICAL INUNDATION (>50 cm)';
};
