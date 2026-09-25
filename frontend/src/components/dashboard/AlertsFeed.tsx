import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Bell, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const AlertsFeed: React.FC = () => {
  const { alerts, acknowledgeAlert } = useSimulation();
  const [showAll, setShowAll] = useState(false);

  const visibleAlerts = showAll ? alerts : alerts.slice(0, 3);

  return (
    <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Real-Time Flood &amp; Infrastructure Alerts
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
          {alerts.length} Active
        </span>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {visibleAlerts.map(a => (
          <div
            key={a.alert_id}
            className={`p-3 rounded-xl border transition-all text-xs flex items-start justify-between space-x-3 ${
              a.acknowledged
                ? 'bg-slate-900/60 border-slate-800 opacity-60'
                : a.severity === 'CRITICAL'
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-100 shadow-md shadow-rose-950/30'
                : a.severity === 'WARNING'
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-100'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    a.severity === 'CRITICAL'
                      ? 'bg-rose-600 text-white'
                      : a.severity === 'WARNING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {a.severity}
                </span>
                <span className="font-bold text-slate-100">{a.title}</span>
              </div>
              <p className="text-[11px] text-slate-300">{a.message}</p>
              <div className="flex items-center space-x-3 text-[10px] text-slate-400 pt-0.5 font-mono">
                <span>Location: {a.location}</span>
                <span>&bull;</span>
                <span>{a.timestamp}</span>
              </div>
            </div>

            {!a.acknowledged && (
              <button
                onClick={() => acknowledgeAlert(a.alert_id)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0 border border-slate-700"
              >
                Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>

      {alerts.length > 3 && (
        <div className="pt-2 border-t border-slate-800 flex justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center space-x-1 py-1 px-3 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <span>{showAll ? 'SHOW LESS' : `VIEW ALL (${alerts.length})`}</span>
            {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};
