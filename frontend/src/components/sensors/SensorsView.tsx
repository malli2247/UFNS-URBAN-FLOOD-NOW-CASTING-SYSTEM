import React, { useState } from 'react';
import { Radio, Plus, CheckCircle, Battery, Send, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { api } from '../../services/api';

export const SensorsView: React.FC = () => {
  const { sensors, refreshData } = useSimulation();

  const [lat, setLat] = useState(12.926);
  const [lon, setLon] = useState(77.660);
  const [category, setCategory] = useState('Waterlogging');
  const [depthCm, setDepthCm] = useState(35.0);
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.submitReport({
        lat,
        lon,
        category,
        water_depth_cm: depthCm,
        description: desc,
      });
      setSubmitted(true);
      await refreshData();
      setTimeout(() => setSubmitted(false), 3500);
      setDesc('');
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">IoT Water Sensors &amp; Crowdsourced Citizen Reporting</h2>
            <p className="text-xs text-slate-400 font-medium">
              Real-Time Ground-Truth Assimilation for Feedback Calibration
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="text-emerald-400 font-bold font-mono">{sensors?.length || 8} Active</span> Ultrasonic Stations
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IoT Sensor Telemetry Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block border-b border-slate-800 pb-2">
            Municipal IoT Ultrasonic Water Level Telemetry
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[11px] font-semibold">
                  <th className="pb-2">Station ID</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Water Level</th>
                  <th className="pb-2">Battery</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sensors?.map(s => {
                  const isWarning = s.depth_cm > 25;
                  const isCritical = s.depth_cm > 40;
                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 font-bold text-white">{s.id}</td>
                      <td className="py-2.5 text-slate-300 font-sans text-xs">{s.name}</td>
                      <td className="py-2.5 font-bold">
                        <span className={isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}>
                          {s.depth_cm} cm
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400 flex items-center space-x-1">
                        <Battery className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{s.battery_pct}%</span>
                      </td>
                      <td className="py-2.5 text-right font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCritical
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : isWarning
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'ONLINE'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Crowdsourced Citizen Incident Report Form */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
              Citizen Incident Submission
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Submit verified street inundation or drain backflow.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Problem Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="Waterlogging">Street Waterlogging</option>
                <option value="Drain Overflow">Storm Drain Overflow</option>
                <option value="Manhole Surcharge">Manhole Cover Backflow</option>
                <option value="Blocked Road">Road Blocked by Inundation</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Estimated Water Depth (cm)</label>
              <input
                type="number"
                value={depthCm}
                onChange={e => setDepthCm(parseFloat(e.target.value))}
                min="0"
                max="250"
                step="1"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Latitude</label>
                <input
                  type="number"
                  value={lat}
                  onChange={e => setLat(parseFloat(e.target.value))}
                  step="0.001"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Longitude</label>
                <input
                  type="number"
                  value={lon}
                  onChange={e => setLon(parseFloat(e.target.value))}
                  step="0.001"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Description / Location Details</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="e.g. Water accumulation near bus stop underpass"
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white shadow-lg transition-all flex items-center justify-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting...' : 'Submit Incident Report'}</span>
            </button>

            {submitted && (
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-center font-semibold text-[11px] animate-fade-in">
                Report recorded &bull; Ingested into ground truth matrix!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
