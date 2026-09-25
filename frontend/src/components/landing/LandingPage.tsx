import React from 'react';
import {
  Waves,
  ArrowRight,
  Play,
  ShieldAlert,
  Navigation,
  CheckCircle2,
  Gauge,
  Activity,
  Layers,
  History,
  Tv
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const LandingPage: React.FC<{ onLaunch: () => void }> = ({ onLaunch }) => {
  const { runFloodScenario, setDataMode, setPresentationMode } = useSimulation();

  const handleLaunchDemo = () => {
    onLaunch();
    runFloodScenario();
  };

  const handleHistorical = () => {
    setDataMode('HISTORICAL REPLAY', 'bengaluru_2022_rainbow_drive');
    onLaunch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0f19] via-[#0d1527] to-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-sky-500">
      {/* Top Banner */}
      <nav className="border-b border-slate-800/80 px-8 py-5 flex items-center justify-between backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-wider text-white">UFNS</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              SIH 2026 #26085
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              setPresentationMode(true);
              onLaunch();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-purple-500/50 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 flex items-center space-x-2 transition-all"
          >
            <Tv className="w-4 h-4 text-purple-400" />
            <span>JUDGE DEMO MODE</span>
          </button>
          <button
            onClick={onLaunch}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-500 hover:to-teal-400 text-white shadow-lg shadow-sky-500/25 transition-all flex items-center space-x-2"
          >
            <span>LAUNCH DASHBOARD</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Main */}
      <main className="max-w-6xl mx-auto px-6 py-16 text-center space-y-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-sky-400 shadow-inner">
          <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span>Disaster Management &bull; Urban Flood Nowcasting &bull; Team NEXORA</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white">
            Predict Urban Flooding{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">
              Before It Reaches The Street.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-normal">
            A physics-inspired, data-driven hydrological nowcasting platform coupling Doppler radar, 2D terrain runoff,
            underground stormwater conduit networks, and real-time sensor assimilation for 0–3 hour street-level water depth predictions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button
            onClick={onLaunch}
            className="px-7 py-3.5 rounded-xl text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-xl shadow-sky-600/30 transition-all flex items-center space-x-2"
          >
            <span>Enter Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleLaunchDemo}
            className="px-7 py-3.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center space-x-2"
          >
            <Play className="w-4 h-4 text-emerald-400" />
            <span>Run 60s Flood Scenario</span>
          </button>

          <button
            onClick={handleHistorical}
            className="px-7 py-3.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center space-x-2"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Replay 2022 Cloudburst Event</span>
          </button>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-12 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-sky-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-950 text-sky-400 border border-sky-800/60 flex items-center justify-center mb-4">
              <Gauge className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">0–3h Nowcast Horizon</h3>
            <p className="text-xs text-slate-400">
              High-temporal 15-minute resolution forecasts capturing rapid convective rainband accumulation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 border border-teal-800/60 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Bidirectional Coupling</h3>
            <p className="text-xs text-slate-400">
              Couples 2D surface runoff with underground storm drain graph to predict surcharge and backflow spilling.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center mb-4">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Flood-Safe Routing</h3>
            <p className="text-xs text-slate-400">
              Dynamic vehicle clearance routing for Ambulances, Fire Trucks, and civilian transit avoiding impassable depths.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 border border-purple-800/60 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Scientific Validation</h3>
            <p className="text-xs text-slate-400">
              Authentic MAE, RMSE, and Spatial Error maps calibrated against real ultrasonic IoT gauges and citizen reports.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500 font-mono">
        Smart India Hackathon 2026 &bull; Problem Statement ID: 26085 &bull; Team NEXORA &bull; Predict. Prepare. Protect.
      </footer>
    </div>
  );
};
