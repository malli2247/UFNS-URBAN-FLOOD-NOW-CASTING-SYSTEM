import React from 'react';
import { HeroMetrics } from './HeroMetrics';
import { TimeSlider } from './TimeSlider';
import { StreetDepthTable } from './StreetDepthTable';
import { AlertsFeed } from './AlertsFeed';
import { FloodMap } from '../map/FloodMap';
import { Info, Database, Layers, Radio, Sparkles, ArrowRight } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const DashboardView: React.FC = () => {
  const { dataMode, activeHorizon, setActiveTab, twinMode, setTwinMode } = useSimulation();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Top Hero Metrics (Dynamic 7 KPIs) */}
      <HeroMetrics />

      {/* 2. Nowcast Time Slider */}
      <TimeSlider />

      {/* 3. Main Operational Split: Map + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0f172a] h-[540px] flex flex-col">
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>{twinMode === '3d' ? 'UFNS 3D Urban Digital Twin' : 'Interactive 2D GIS Inundation Layer'}</span>
            </span>
            <div className="flex items-center space-x-3">
              <div className="bg-slate-950 border border-slate-700/80 rounded-lg p-0.5 flex items-center space-x-0.5">
                <button
                  onClick={() => setTwinMode('2d')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    twinMode === '2d' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2D GIS
                </button>
                <button
                  onClick={() => setTwinMode('3d')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    twinMode === '3d' ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_#06b6d4]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3D TWIN
                </button>
              </div>
              <button
                onClick={() => setActiveTab('map')}
                className="text-sky-400 hover:text-sky-300 text-[11px] font-bold flex items-center space-x-1"
              >
                <span>Full Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full h-full relative">
            <FloodMap compact={true} />
          </div>
        </div>

        <div className="space-y-6">
          <AlertsFeed />

          {/* Provenance & Scientific Transparency Card */}
          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl text-xs space-y-3">
            <div className="flex items-center space-x-2 text-slate-300 font-bold border-b border-slate-800 pb-2">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Prediction Provenance &bull; Why This Result?</span>
            </div>
            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Rainfall Source:</span>
                <span className="font-semibold text-sky-400 font-mono">
                  {dataMode === 'LIVE DATA' ? 'Open-Meteo Live API' : (dataMode === 'HISTORICAL REPLAY' ? 'Bengaluru 2022 Archive' : 'Calibrated Convective')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hydrology Engine:</span>
                <span className="font-semibold text-teal-400 font-mono">2D Rational + Kinematic Runoff</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Drainage Coupling:</span>
                <span className="font-semibold text-purple-400 font-mono">Manning Surcharge &bull; 2-Way</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ground Truth Check:</span>
                <span className="font-semibold text-emerald-400 font-mono">14 Sensors Calibrated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Arterial Street Depth Table */}
      <StreetDepthTable />
    </div>
  );
};
