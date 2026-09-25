import React from 'react';
import { Network, AlertCircle, ArrowDown, ArrowUp, CheckCircle, RefreshCw } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const DrainageGraphView: React.FC = () => {
  const { drainageNetwork, activeHorizon } = useSimulation();

  const nodes = drainageNetwork?.nodes || [];
  const edges = drainageNetwork?.edges || [];
  const surchargedNodes = nodes.filter(n => n.is_surcharged);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Status */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Urban Stormwater Drainage Network Graph</h2>
            <p className="text-xs text-slate-400 font-medium">
              Mode: <span className="text-purple-400 font-semibold">{drainageNetwork?.mode || 'ESTIMATED DRAINAGE NETWORK'}</span> &bull; Horizon: +{activeHorizon}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Total Manholes: </span>
            <span className="font-bold text-white font-mono">{nodes.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300">
            <span className="text-rose-400 font-semibold">Surcharged Nodes: </span>
            <span className="font-black text-rose-200 font-mono">{surchargedNodes.length}</span>
          </div>
        </div>
      </div>

      {/* Bidirectional Coupling Schematic */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#131b2e] to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-200">
          <RefreshCw className="w-4 h-4 text-purple-400" />
          <span>UFNS Innovation: Bidirectional Surface-Drainage Coupling Mechanism</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2 text-center text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-sky-400 font-bold block">1. Rainfall</span>
            <span className="text-[11px] text-slate-400">Precipitation nowcast (0-3h)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-teal-400 font-bold block">2. Surface Runoff</span>
            <span className="text-[11px] text-slate-400">Rational equation &amp; slope flow</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-indigo-400 font-bold block">3. Inlet Capture</span>
            <span className="text-[11px] text-slate-400">Manholes accept water (Qin)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-purple-400 font-bold block">4. Capacity Check</span>
            <span className="text-[11px] text-slate-400">Manning full pipe formula</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-1">
            <span className="text-rose-400 font-bold block">5. Surcharge</span>
            <span className="text-[11px] text-rose-300">Conduit exceeds 100% cap</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-1">
            <span className="text-amber-400 font-bold block">6. Backflow Flood</span>
            <span className="text-[11px] text-amber-300">Water returns to street</span>
          </div>
        </div>
      </div>

      {/* Nodes & Conduits Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manhole Junctions */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block border-b border-slate-800 pb-2">
            Stormwater Manhole Junctions ({nodes.length})
          </span>
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {nodes.map(n => (
              <div
                key={n.node_id}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  n.is_surcharged
                    ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                    <span>{n.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({n.node_id})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 space-x-2 font-mono">
                    <span>Elev: {n.elevation_m}m</span>
                    <span>&bull;</span>
                    <span>Inflow: {n.current_inflow_m3_s} m³/s</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  {n.is_surcharged ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                      SURCHARGED (+{n.spill_depth_cm} cm)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Normal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underground Conduits */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block border-b border-slate-800 pb-2">
            Underground Storm Conduits ({edges.length})
          </span>
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {edges.map(e => (
              <div
                key={e.edge_id}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  e.status === 'SURCHARGED'
                    ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                    : e.status === 'WARNING'
                    ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-100 flex items-center space-x-1.5">
                    <span>Pipe {e.edge_id}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({e.from_node} &rarr; {e.to_node})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 space-x-2 font-mono">
                    <span>Diam: {e.diameter_m}m</span>
                    <span>&bull;</span>
                    <span>Cap: {e.capacity_m3_s} m³/s</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold block">{e.utilization_pct}% Load</span>
                  <span
                    className={`text-[10px] font-semibold ${
                      e.status === 'SURCHARGED'
                        ? 'text-rose-400'
                        : e.status === 'WARNING'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
