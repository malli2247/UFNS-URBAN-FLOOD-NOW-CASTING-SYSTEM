import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Layers, Sliders, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { api } from '../../services/api';
import { useSimulation } from '../../context/SimulationContext';

export const AnalyticsView: React.FC = () => {
  const { dataMode, activeHorizon, setActiveHorizon } = useSimulation();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    api.compareScenarios().then(res => setScenarios(res.scenarios)).catch(console.warn);
    api.getAnalytics().then(res => setAnalyticsData(res)).catch(console.warn);
  }, [activeHorizon, dataMode]);

  const timeline = analyticsData?.timeline || [
    { horizon: '0m', rainfall_mm_hr: 35, predicted_depth_cm: 6, drainage_load_pct: 35 },
    { horizon: '15m', rainfall_mm_hr: 58, predicted_depth_cm: 14, drainage_load_pct: 55 },
    { horizon: '30m', rainfall_mm_hr: 89, predicted_depth_cm: 28, drainage_load_pct: 82 },
    { horizon: '45m', rainfall_mm_hr: 115, predicted_depth_cm: 39, drainage_load_pct: 96 },
    { horizon: '1h', rainfall_mm_hr: 131, predicted_depth_cm: 52, drainage_load_pct: 100 },
    { horizon: '2h', rainfall_mm_hr: 74, predicted_depth_cm: 36, drainage_load_pct: 75 },
    { horizon: '3h', rainfall_mm_hr: 22, predicted_depth_cm: 12, drainage_load_pct: 28 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800 text-sky-400 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Hydrological Analytics &amp; Scenario Comparison</h2>
            <p className="text-xs text-slate-400 font-medium">
              Multi-Scenario Stress Testing &bull; Infrastructure Capacity Evaluation ({dataMode})
            </p>
          </div>
        </div>

        {/* Horizon Quick Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Horizon:</span>
          {(['0m', '15m', '30m', '45m', '1h', '2h', '3h'] as const).map(h => (
            <button
              key={h}
              onClick={() => setActiveHorizon(h)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                activeHorizon === h
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              +{h}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Comparison Cards */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
          Infrastructure Scenario Stress Testing
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map(s => (
            <div key={s.id} className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
              <span className="font-bold text-sm text-slate-100 block">{s.name}</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Peak Water Depth:</span>
                  <span className="font-bold font-mono text-sky-400">{s.max_depth_cm} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Impassable Roads:</span>
                  <span className="font-bold font-mono text-rose-400">{s.affected_roads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Surcharged Nodes:</span>
                  <span className="font-bold font-mono text-purple-400">{s.surcharged_nodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ponding Volume:</span>
                  <span className="font-bold font-mono text-slate-200">{s.flow_retention_m3} m³</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Risk Assessment:</span>
                <span className="font-bold text-amber-400">{s.risk_category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rainfall vs Predicted Water Depth */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block border-b border-slate-800 pb-2">
            Rainfall Rate vs. Street Water Depth (0-3h Window)
          </span>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="horizon" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                <Legend />
                <Line type="monotone" dataKey="rainfall_mm_hr" name="Rainfall (mm/hr)" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="predicted_depth_cm" name="Predicted Depth (cm)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drainage Network Capacity Utilization */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block border-b border-slate-800 pb-2">
            Stormwater Conduit Hydraulic Capacity Load %
          </span>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="horizon" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }} />
                <Legend />
                <Area type="monotone" dataKey="drainage_load_pct" name="Conduit Load %" stroke="#a855f7" fill="#a855f7" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
