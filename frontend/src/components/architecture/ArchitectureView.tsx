import React, { useState } from 'react';
import { Cpu, Database, CheckCircle, ArrowDown, ArrowRight, RefreshCw, Layers, Radio, ShieldCheck } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<string>('coupler');

  const components: Record<string, { title: string; role: string; math: string; status: string; limitation: string }> = {
    radar: {
      title: 'Doppler Weather Radar & Ingestion',
      role: 'Ingests spatial reflectivity grids (Z in dBZ) to compute rainfall intensity R via Marshall-Palmer equation Z = 200 * R^1.6.',
      math: 'Z = a * R^b &bull; dBZ = 10 * log10(Z)',
      status: 'Supports Historical IMD Archives & Open-Meteo Live Streams; Fallback to Calibrated Synthetic',
      limitation: 'Beam blockage at lower elevations; attenuation in heavy convective cores.',
    },
    nowcast: {
      title: '0–3 Hour Nowcasting Engine',
      role: 'Translates convective storm cells using motion vectors and advection decay models (ConvLSTM/advection baseline).',
      math: 'R(t + dt) = R(t) * exp(-lambda * dt) + V_advection',
      status: 'Validated Baseline vs ML Nowcaster fitted on 2019-2023 monsoon convection data',
      limitation: 'Rapid convective initiation beyond 90 minutes exhibits standard meteorological entropy.',
    },
    runoff: {
      title: '2D Physics-Inspired Surface Runoff',
      role: 'Calculates overland flow and depression storage based on 30m Cartosat/SRTM DEM slope and land-use imperviousness.',
      math: 'Q_runoff = C_impervious * I_rain * Area * dt &bull; Horton Infiltration',
      status: 'Operational Physics Model with Conservation of Mass',
      limitation: 'Requires high-resolution micro-topography for localized curb-level ponding.',
    },
    coupler: {
      title: 'Bidirectional Drainage Coupling (UFNS Innovation)',
      role: 'Couples surface runoff with underground conduits. When conduit flow exceeds Manning capacity, node surcharges and backflow spills onto the street.',
      math: 'Q_cap = (1/n) * A * R^(2/3) * S^(1/2) &bull; Delta_Depth = V_surcharge / Area',
      status: 'Fully Operational 2-Way Surcharge Graph',
      limitation: 'Municipal storm drain GIS often missing minor branch pipes; estimated from DEM flow paths.',
    },
    routing: {
      title: 'Flood-Safe Emergency Routing',
      role: 'Dijkstra/A* shortest path graph penalizing edges with water depth and strictly blocking roads exceeding vehicle clearance.',
      math: 'Weight = Base_Time / Speed_Factor; If Depth > Clearance: Weight = Infinity',
      status: 'Multi-Modal (Ambulance, Fire Truck, Police, Car, Pedestrian)',
      limitation: 'Requires real-time road closure synchronization during extreme events.',
    },
    calibration: {
      title: 'Ground-Truth Self-Calibration Loop',
      role: 'Compares predicted depth against live IoT sensors and verified citizen reports to dynamically tune Manning roughness and runoff coefficients.',
      math: 'Ratio = Mean(Observed) / Mean(Predicted) &bull; Error Correction Multiplier',
      status: 'Active with 14 ultrasonic gauges + verified crowdsourced observations',
      limitation: 'Sensor density varies across suburban sectors.',
    },
  };

  const comp = components[activeComponent];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 text-purple-400 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">UFNS End-to-End System Architecture</h2>
            <p className="text-xs text-slate-400 font-medium">
              Coupled Hydrology Pipeline &bull; Click Any Component Below To Inspect
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Architecture Flowchart */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block border-b border-slate-800 pb-2">
          Interactive Operational Pipeline Flow
        </span>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {[
            { id: 'radar', title: '1. Radar / Ingestion', icon: Database },
            { id: 'nowcast', title: '2. Nowcast (0-3h)', icon: RefreshCw },
            { id: 'runoff', title: '3. Surface Runoff', icon: Layers },
            { id: 'coupler', title: '4. Drainage Coupler', icon: RefreshCw },
            { id: 'routing', title: '5. Safe Routing', icon: ShieldCheck },
            { id: 'calibration', title: '6. Ground Truth Loop', icon: Radio },
          ].map(c => {
            const Icon = c.icon;
            const isSel = activeComponent === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveComponent(c.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSel
                    ? 'bg-purple-950/50 border-purple-500 text-purple-300 ring-2 ring-purple-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5 mb-2 text-purple-400" />
                <span className="font-bold text-xs block">{c.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Component Inspection Panel */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-sm text-purple-300">{comp.title}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800">
              Active Module
            </span>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 font-semibold block uppercase text-[10px]">Operational Role:</span>
              <p className="mt-0.5">{comp.role}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block uppercase text-[10px]">Governing Physics / Formula:</span>
              <p className="mt-0.5 font-mono text-teal-400 bg-slate-950 p-2 rounded-lg border border-slate-800">{comp.math}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Status:</span>
                <p className="mt-0.5 text-emerald-400 font-medium">{comp.status}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Documented Limitation:</span>
                <p className="mt-0.5 text-amber-400 font-medium">{comp.limitation}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-World Data Sources Catalog */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block border-b border-slate-800 pb-2">
          Transparent Data Sources Catalog &bull; Distinguishing Live vs. Simulated
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200 block">IMD Doppler Weather Radar</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800 inline-block">
              HISTORICAL / LIVE ADAPTER
            </span>
            <p className="text-slate-400 text-[11px]">
              Trained on regional radar reflectivity sweeps. Falls back transparently to calibrated convective benchmarks if endpoint is offline.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200 block">ISRO Bhuvan / Cartosat DEM</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 inline-block">
              REAL TOPOGRAPHIC DEM
            </span>
            <p className="text-slate-400 text-[11px]">
              30m spatial elevation matrix capturing regional slopes, lake sinks, and roadway depressions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200 block">Municipal Drainage GIS</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-800 inline-block">
              ESTIMATED TRUNK GRAPH
            </span>
            <p className="text-slate-400 text-[11px]">
              Explicitly labelled as estimated prototype drainage network derived from topographic low points and trunk outfalls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
