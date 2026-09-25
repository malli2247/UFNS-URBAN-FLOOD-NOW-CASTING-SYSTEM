import React, { useState } from 'react';
import {
  Waves,
  Activity,
  Play,
  Pause,
  Tv,
  Bell,
  Sliders,
  CloudRain,
  History,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Box,
  Sparkles,
  MapPin,
  Cpu
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedCity,
    switchCity,
    dataMode,
    setDataMode,
    activeHorizon,
    presentationMode,
    setPresentationMode,
    isRunningScenario,
    runFloodScenario,
    stopScenario,
    alerts,
    isDigitalTwinOpen,
    setIsDigitalTwinOpen,
    isStoryMode,
    startStoryMode,
    stopStoryMode,
  } = useSimulation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const unreadAlerts = alerts.filter(a => !a.acknowledged);

  React.useEffect(() => {
    fetch('http://127.0.0.1:8000/api/model/updates')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.update_available) {
          setUpdateAvailable(true);
        }
      })
      .catch(() => {});

    fetch('http://127.0.0.1:8000/api/model/status')
      .then(r => r.ok ? r.json() : null)
      .then(s => {
        if (s) setModelStatus(s);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 px-6 py-3 sticky top-0 z-40 flex items-center justify-between shadow-xl">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
          <Waves className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-teal-300 to-white">
              UFNS
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950 text-sky-400 border border-sky-800/60 uppercase tracking-wider">
              SIH 2026 #26085
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Real-Time Urban Flood Nowcasting Engine &bull; NEXORA</p>
        </div>

        {/* City Selector */}
        <div className="ml-2 flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-inner">
          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CITY:</span>
          <select
            value={selectedCity}
            onChange={(e) => switchCity(e.target.value)}
            className="bg-slate-800 text-sky-300 font-extrabold text-xs rounded-lg px-2.5 py-1 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer shadow-sm hover:border-sky-500 transition-all"
          >
            <option value="bengaluru">Bengaluru (Koramangala)</option>
            <option value="delhi">Delhi (ITO &bull; Yamuna)</option>
            <option value="mumbai">Mumbai (Hindmata &bull; Mithi)</option>
            <option value="hyderabad">Hyderabad (Begumpet)</option>
            <option value="chennai">Chennai (Velachery)</option>
            <option value="kolkata">Kolkata (Ultadanga)</option>
            <option value="pune">Pune (Sinhagad Rd)</option>
            <option value="ahmedabad">Ahmedabad (Akhbarnagar)</option>
            <option value="jaipur">Jaipur (Gopalpura)</option>
            <option value="lucknow">Lucknow (Mawaiya)</option>
          </select>
        </div>
      </div>

      {/* Center Data Mode & Operational Status */}
      <div className="hidden lg:flex items-center space-x-4">
        {/* Operational Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-semibold text-emerald-400">OPERATIONAL</span>
        </div>

        {/* Data Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => setDataMode('DEMO SIMULATION')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
              dataMode === 'DEMO SIMULATION'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>DEMO SIMULATION</span>
          </button>
          <button
            onClick={() => setDataMode('HISTORICAL REPLAY', 'bengaluru_2022_rainbow_drive')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
              dataMode === 'HISTORICAL REPLAY'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>HISTORICAL REPLAY</span>
          </button>
          <button
            onClick={() => setDataMode('LIVE DATA')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
              dataMode === 'LIVE DATA'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>LIVE DATA</span>
          </button>
        </div>

        {/* Forecast Horizon Badge */}
        <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
          Horizon: <span className="text-sky-400 font-bold">+{activeHorizon}</span> (0-3h window)
        </div>

        {/* Model Governance Status Pill */}
        <div
          onClick={() => setActiveTab('model-card')}
          className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-[11px] font-mono cursor-pointer hover:border-sky-500 hover:bg-slate-800/80 transition-all shadow-inner"
          title="Click to view Model Card & Governance Registry"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300 font-bold">MODEL: <span className="text-sky-300">UFNS v2.0</span></span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-slate-400">TRAINED: <span className="text-slate-200">2019-2022</span></span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-emerald-400 font-bold">TEST MAE: 4.15cm</span>
          <span className="text-slate-600">&bull;</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
            INFERENCE: LIVE
          </span>
        </div>

        {/* Update Notification Pill */}
        {updateAvailable && (
          <button
            onClick={() => setActiveTab('model-card')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/60 hover:bg-amber-500/30 text-xs font-bold animate-pulse transition-all shadow-md"
            title="New external dataset updates available. Click to review."
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px]">NEW DATASET AVAILABLE: <span className="underline font-black">[Review Data Update]</span></span>
          </button>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        {/* Story Mode Demonstration Launch Button */}
        <button
          onClick={() => {
            if (isStoryMode) {
              stopStoryMode();
            } else {
              startStoryMode();
            }
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all shadow-lg flex items-center space-x-1.5 border ${
            isStoryMode
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse'
              : 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.45)]'
          }`}
          title="Start 9-Stage Guided Evaluator Demonstration"
        >
          <Sparkles className="w-4 h-4 fill-current text-slate-950" />
          <span>{isStoryMode ? 'EXIT DEMO STORY' : 'START DEMO STORY'}</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-950/20 text-slate-950">
            CINEMATIC
          </span>
        </button>

        {/* 3D Digital Twin Dedicated Launch Button */}
        <button
          onClick={() => setIsDigitalTwinOpen(true)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg flex items-center space-x-1.5 border ${
            isDigitalTwinOpen
              ? 'bg-cyan-500 text-slate-950 font-black border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
              : 'bg-gradient-to-r from-cyan-950/90 to-slate-900 border-cyan-500/60 text-cyan-300 hover:text-white hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.35)]'
          }`}
          title="Open Dedicated 3D Urban Flood Digital Twin Demonstration"
        >
          <Box className="w-4 h-4 text-cyan-400" />
          <span className="font-extrabold tracking-wide">3D DIGITAL TWIN</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            DEMO
          </span>
        </button>

        {/* Scenario Launcher */}
        <button
          onClick={isRunningScenario ? stopScenario : runFloodScenario}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 ${
            isRunningScenario
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              : 'bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white'
          }`}
        >
          {isRunningScenario ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isRunningScenario ? 'PAUSE SCENARIO' : 'RUN FLOOD SCENARIO'}</span>
        </button>

        {/* Presentation Mode Toggle */}
        <button
          onClick={() => setPresentationMode(!presentationMode)}
          className={`p-2 rounded-lg border transition-all text-xs flex items-center space-x-1.5 ${
            presentationMode
              ? 'bg-purple-600/30 border-purple-500 text-purple-300 ring-2 ring-purple-500/30'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title="Toggle SIH Judging Presentation Mode"
        >
          <Tv className="w-4 h-4 text-purple-400" />
          <span className="hidden md:inline font-semibold">JUDGE MODE</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white relative"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#111827] border border-slate-700 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-200">Active Flood Alerts ({alerts.length})</span>
                <span className="text-[10px] text-slate-400 font-mono">Real-time Feed</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {alerts.slice(0, 5).map(a => (
                  <div
                    key={a.alert_id}
                    className={`p-2.5 rounded-lg border text-xs ${
                      a.severity === 'CRITICAL'
                        ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                        : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                    }`}
                  >
                    <div className="font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{a.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">{a.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{a.location}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
