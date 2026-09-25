import React from 'react';
import {
  AlertOctagon,
  Waves,
  Clock,
  Route,
  Network,
  ShieldCheck,
  Percent,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const HeroMetrics: React.FC = () => {
  const { dashboardData, dataMode, activeHorizon } = useSimulation();

  const maxDepth = dashboardData?.predicted_max_water_depth_cm ?? 42.0;
  const riskLevel = dashboardData?.current_risk_level ?? 'HIGH';
  const peakTime = dashboardData?.peak_expected_time ?? '1h 15m';
  const affectedRoads = dashboardData?.affected_roads_count ?? 8;
  const critNodes = dashboardData?.critical_drainage_nodes_count ?? 3;
  const safeRoutes = dashboardData?.safe_routes_available ?? 12;
  const confidence = dashboardData?.prediction_confidence_pct ?? 86;

  const riskColor =
    riskLevel === 'CRITICAL'
      ? 'from-rose-600/30 to-rose-950/40 border-rose-600/60 text-rose-300'
      : riskLevel === 'HIGH'
      ? 'from-amber-600/30 to-amber-950/40 border-amber-600/60 text-amber-300'
      : riskLevel === 'MODERATE'
      ? 'from-yellow-600/30 to-yellow-950/40 border-yellow-600/60 text-yellow-300'
      : 'from-emerald-600/30 to-emerald-950/40 border-emerald-600/60 text-emerald-300';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {/* 1. Flood Risk Level */}
      <div className={`p-4 rounded-2xl bg-gradient-to-b border ${riskColor} shadow-lg col-span-2 md:col-span-1`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">Flood Risk</span>
          <AlertOctagon className="w-4 h-4" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black tracking-tight">{riskLevel}</span>
          <p className="text-[10px] opacity-75 mt-0.5">Horizon: +{activeHorizon}</p>
        </div>
      </div>

      {/* 2. Predicted Max Depth */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold tracking-wider uppercase">Max Water Depth</span>
          <Waves className="w-4 h-4 text-sky-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black text-white font-mono">{maxDepth}</span>
          <span className="text-xs text-sky-400 font-bold ml-1">cm</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Street Surface Inundation</p>
        </div>
      </div>

      {/* 3. Peak Expected */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold tracking-wider uppercase">Peak Expected</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black text-white font-mono">{peakTime}</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Max Inundation Window</p>
        </div>
      </div>

      {/* 4. Affected Roads */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold tracking-wider uppercase">Affected Roads</span>
          <Route className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black text-white font-mono">{affectedRoads}</span>
          <span className="text-xs text-rose-400 ml-1 font-semibold">&gt; 10cm depth</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Transit Constrained</p>
        </div>
      </div>

      {/* 5. Critical Drainage Nodes */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold tracking-wider uppercase">Drainage Nodes</span>
          <Network className="w-4 h-4 text-purple-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black text-white font-mono">{critNodes}</span>
          <span className="text-xs text-purple-400 ml-1 font-semibold">Surcharged</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Capacity Exceeded</p>
        </div>
      </div>

      {/* 6. Safe Routes Available */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold tracking-wider uppercase">Safe Corridors</span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black text-white font-mono">{safeRoutes}</span>
          <span className="text-xs text-emerald-400 ml-1 font-semibold">Clear</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Emergency Accessible</p>
        </div>
      </div>

      {/* 7. Confidence Breakdown */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold tracking-wider uppercase">Confidence</span>
          <Percent className="w-4 h-4 text-teal-400" />
        </div>
        <div className="mt-2">
          <span className="text-2xl font-black text-white font-mono">{confidence}%</span>
          <p className="text-[10px] text-teal-400 mt-0.5 font-medium">Multi-source Weighted</p>
        </div>
      </div>
    </div>
  );
};
