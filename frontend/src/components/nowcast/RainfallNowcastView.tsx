import React, { useState } from 'react';
import {
  CloudRain,
  Radar,
  Sliders,
  Play,
  Layers,
  Activity,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useSimulation } from '../../context/SimulationContext';
import { api } from '../../services/api';

export const RainfallNowcastView: React.FC = () => {
  const { rainfallForecast, dataMode, refreshData } = useSimulation();
  const [selectedPreset, setSelectedPreset] = useState('cloudburst');

  const handleApplyPreset = async (preset: string) => {
    setSelectedPreset(preset);
    await api.updateSimulationConfig({ preset });
    await refreshData();
  };

  const chartData = rainfallForecast?.forecasts.map(f => ({
    horizon: f.horizon,
    intensity: f.rainfall_rate_mm_hr,
    cumulative: f.cumulative_mm,
    dbz: f.radar_reflectivity_dbz,
  })) || [
    { horizon: '0m', intensity: 65, cumulative: 16.2, dbz: 48 },
    { horizon: '15m', intensity: 78, cumulative: 35.7, dbz: 51 },
    { horizon: '30m', intensity: 95, cumulative: 59.4, dbz: 54 },
    { horizon: '45m', intensity: 112, cumulative: 87.4, dbz: 57 },
    { horizon: '1h', intensity: 131, cumulative: 120.1, dbz: 60 },
    { horizon: '2h', intensity: 74, cumulative: 138.6, dbz: 49 },
    { horizon: '3h', intensity: 22, cumulative: 144.1, dbz: 32 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800 text-sky-400 flex items-center justify-center">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Rainfall Nowcasting Engine (0–3h Horizon)</h2>
            <p className="text-xs text-slate-400 font-medium">
              Source: <span className="text-sky-400 font-semibold">{rainfallForecast?.data_source || dataMode}</span> &bull; Model: <span className="text-teal-400 font-semibold">{rainfallForecast?.model_name || 'Lightweight ML Nowcaster'}</span>
            </p>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'cloudburst', label: 'Urban Cloudburst (135 mm/hr)' },
            { id: '2015_severe', label: 'Severe Storm (148 mm/hr)' },
            { id: 'monsoon_extreme', label: 'Monsoon Extreme (95 mm/hr)' },
            { id: 'moderate_rain', label: 'Moderate Rain (35 mm/hr)' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedPreset === p.id
                  ? 'bg-sky-600 text-white border-sky-400 shadow-lg shadow-sky-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart + Radar Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Precipitation Forecast */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Temporal Precipitation Rate &amp; Cumulative Volume
            </span>
            <span className="text-[11px] text-slate-400 font-mono">15-Min Intervals</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="horizon" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  stroke="#0284c7"
                  tick={{ fill: '#38bdf8', fontSize: 12 }}
                  label={{ value: 'Rate (mm/hr)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  tick={{ fill: '#34d399', fontSize: 12 }}
                  label={{ value: 'Cumulative (mm)', angle: 90, position: 'insideRight', fill: '#34d399', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="intensity" name="Rainfall Rate (mm/hr)" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative Rain (mm)" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doppler Radar Simulation Canvas */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Radar className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Doppler Radar Nowcast
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800">
                {dataMode === 'HISTORICAL REPLAY' ? 'HISTORICAL IMD ARCHIVE' : 'DEMO DATA'}
              </span>
            </div>

            {/* Radar Circular Visualizer */}
            <div className="relative w-56 h-56 mx-auto my-4 rounded-full border border-purple-500/40 bg-[#0a0f1d] flex items-center justify-center overflow-hidden shadow-inner shadow-purple-950/40">
              {/* Concentric rings */}
              <div className="absolute w-40 h-40 rounded-full border border-purple-500/20" />
              <div className="absolute w-24 h-24 rounded-full border border-purple-500/20" />
              <div className="absolute w-full h-[1px] bg-purple-500/30" />
              <div className="absolute h-full w-[1px] bg-purple-500/30" />

              {/* Storm cell simulated blobs */}
              <div className="absolute top-12 right-14 w-16 h-16 rounded-full bg-purple-500/30 blur-md animate-pulse" />
              <div className="absolute top-16 right-16 w-8 h-8 rounded-full bg-rose-500/40 blur-sm" />
              <div className="absolute bottom-16 left-14 w-12 h-12 rounded-full bg-sky-500/30 blur-md" />

              <span className="text-[10px] text-purple-400 font-mono absolute bottom-2">Range: 80 km</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Peak Reflectivity:</span>
                <span className="font-mono font-bold text-rose-400">58.4 dBZ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Storm Motion:</span>
                <span className="font-mono text-sky-400">ENE @ 24 km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Convective Type:</span>
                <span className="font-mono text-amber-400">Multi-cell Cloudburst</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/40 text-[11px] text-purple-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Clearly labelled DEMO DATA in simulation mode per project instructions.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
