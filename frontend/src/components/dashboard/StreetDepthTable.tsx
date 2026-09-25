import React from 'react';
import { Route, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const StreetDepthTable: React.FC = () => {
  const { dashboardData, activeHorizon } = useSimulation();

  // Monitored arterial roads across Bengaluru Koramangala - Bellandur tech corridor
  const roads = [
    { id: 'R13', name: 'EcoSpace Outer Ring Road Underpass', depth: 46.5, status: 'IMPASSABLE', risk: 'CRITICAL', type: 'Arterial' },
    { id: 'R15', name: 'Rainbow Drive Low-Lying Access Way', depth: 58.2, status: 'IMPASSABLE', risk: 'CRITICAL', type: 'Residential Link' },
    { id: 'R06', name: 'Intermediate Ring Road Underpass', depth: 38.0, status: 'RESTRICTED', risk: 'HIGH', type: 'Primary Highway' },
    { id: 'R07', name: 'Sarjapur - Agara Link Road', depth: 24.5, status: 'CAUTION', risk: 'MODERATE', type: 'Primary' },
    { id: 'R04', name: 'Koramangala 80ft Road Corridor', depth: 16.0, status: 'CAUTION', risk: 'LOW', type: 'Commercial' },
    { id: 'R18', name: 'Marathahalli Elevated Expressway', depth: 0.0, status: 'OPEN', risk: 'SAFE', type: 'Elevated Bypass' },
    { id: 'R12', name: 'Challaghatta - Bellandur High Flyover', depth: 0.0, status: 'OPEN', risk: 'SAFE', type: 'Elevated Bypass' },
    { id: 'R01', name: 'Hosur Road Arterial Highway', depth: 4.5, status: 'OPEN', risk: 'SAFE', type: 'Primary Highway' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">OPEN</span>;
      case 'CAUTION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950 text-yellow-400 border border-yellow-800">CAUTION</span>;
      case 'RESTRICTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">RESTRICTED</span>;
      case 'IMPASSABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">BLOCKED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Route className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Street-Level Water Depth &amp; Road Accessibility Status
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">Horizon: +{activeHorizon}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800 text-[11px] font-semibold">
              <th className="pb-2">Road Name</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Predicted Water Depth</th>
              <th className="pb-2">Risk Level</th>
              <th className="pb-2 text-right">Travel Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {roads.map(r => (
              <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 font-semibold text-slate-200 flex items-center space-x-1.5">
                  <span>{r.name}</span>
                </td>
                <td className="py-2.5 text-slate-400 text-[11px]">{r.type}</td>
                <td className="py-2.5 font-mono font-bold text-sky-400">
                  {r.depth > 0 ? `${r.depth.toFixed(1)} cm` : 'Dry (0 cm)'}
                </td>
                <td className="py-2.5">
                  <span
                    className={`font-semibold text-[11px] ${
                      r.risk === 'CRITICAL'
                        ? 'text-rose-400'
                        : r.risk === 'HIGH'
                        ? 'text-amber-400'
                        : r.risk === 'MODERATE'
                        ? 'text-yellow-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {r.risk}
                  </span>
                </td>
                <td className="py-2.5 text-right">{getStatusBadge(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
