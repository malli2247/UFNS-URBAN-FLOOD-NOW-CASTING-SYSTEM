import React, { useEffect, useState } from 'react';
import {
  Building2,
  CloudRain,
  AlertTriangle,
  Route,
  Network,
  ArrowRight,
  CheckCircle2,
  Radio,
  Sliders,
  Sparkles,
  MapPin,
  Waves
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { api } from '../../services/api';
import { MetropolitanOverviewItem } from '../../types';

export const MetropolitanOverviewView: React.FC = () => {
  const { selectedCity, switchCity, setActiveTab } = useSimulation();
  const [overviewData, setOverviewData] = useState<MetropolitanOverviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterRegion, setFilterRegion] = useState<string>('all');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.getMetropolitanOverview();
      if (res?.cities) {
        setOverviewData(res.cities);
      }
    } catch (e) {
      console.warn('Failed to fetch metropolitan overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  const handleSelectCity = async (cityId: string) => {
    await switchCity(cityId);
    setActiveTab('dashboard');
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MODERATE':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-wide">
                Metropolitan Multi-City Overview
              </h1>
              <p className="text-xs text-slate-400">
                Cross-city comparative flood telemetry &bull; Pure descriptive operational monitoring
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>10 Major Metropolitan Catchments Online</span>
          </div>
          <button
            onClick={fetchOverview}
            className="px-3 py-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40 font-semibold transition-all"
          >
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Grid of 10 Metropolitan Cities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {overviewData.map(item => {
          const isActive = item.city_id === selectedCity;
          return (
            <div
              key={item.city_id}
              className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-sky-950/40 to-slate-900/90 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                  Active in UFNS
                </div>
              )}

              <div>
                {/* Title & Region */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-black text-white tracking-wide">{item.city}</h2>
                      <span className="text-[11px] text-slate-400 font-medium">({item.state})</span>
                    </div>
                    <p className="text-xs text-sky-400 font-semibold mt-0.5 line-clamp-1">{item.basin_name}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border ${getRiskBadge(
                      item.flood_risk_level
                    )}`}
                  >
                    {item.flood_risk_level}
                  </span>
                </div>

                {/* 4 Metric Pills */}
                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  {/* Rainfall */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                      <span>Rainfall</span>
                      <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <div className="mt-1 font-mono font-black text-white text-base">
                      {item.rainfall_rate_mm_hr}
                      <span className="text-[10px] text-sky-400 font-normal ml-1">mm/hr</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-medium">● {item.rainfall_status}</span>
                  </div>

                  {/* Max Depth */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                      <span>Max Depth</span>
                      <Waves className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="mt-1 font-mono font-black text-white text-base">
                      {item.max_water_depth_cm}
                      <span className="text-[10px] text-cyan-400 font-normal ml-1">cm</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">Predicted Inundation</span>
                  </div>

                  {/* Affected Roads */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                      <span>Affected Roads</span>
                      <Route className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="mt-1 font-mono font-black text-white text-base">
                      {item.affected_roads_count}
                      <span className="text-[10px] text-amber-400 font-normal ml-1">blocked</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">Clearance &gt; 15cm</span>
                  </div>

                  {/* Drainage Load */}
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                      <span>Drain Load</span>
                      <Network className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="mt-1 font-mono font-black text-white text-base">
                      {item.drainage_utilization_pct}
                      <span className="text-[10px] text-purple-400 font-normal ml-1">%</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">{item.critical_nodes_count} surcharged nodes</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Coord: {item.center.latitude.toFixed(2)}°N, {item.center.longitude.toFixed(2)}°E
                </span>
                <button
                  onClick={() => handleSelectCity(item.city_id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md hover:bg-cyan-400'
                      : 'bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{isActive ? 'View in Command Center' : 'Switch to City'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
