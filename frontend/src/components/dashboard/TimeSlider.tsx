import React from 'react';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const TimeSlider: React.FC = () => {
  const { activeHorizon, setActiveHorizon, isRunningScenario, runFloodScenario, stopScenario } = useSimulation();

  const horizons = [
    { key: '0m', label: 'NOW' },
    { key: '15m', label: '+15 MIN' },
    { key: '30m', label: '+30 MIN' },
    { key: '45m', label: '+45 MIN' },
    { key: '1h', label: '+1 HR' },
    { key: '2h', label: '+2 HR' },
    { key: '3h', label: '+3 HR' },
  ];

  return (
    <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Nowcast Time Horizon Slider (0-3h Ahead)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={isRunningScenario ? stopScenario : runFloodScenario}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              isRunningScenario
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            {isRunningScenario ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunningScenario ? 'Pause Time-Lapse' : 'Auto Play'}</span>
          </button>
          <button
            onClick={() => setActiveHorizon('0m')}
            className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            title="Reset to NOW"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stepped Horizontal Slider */}
      <div className="grid grid-cols-7 gap-2 pt-1">
        {horizons.map(h => {
          const isActive = activeHorizon === h.key;
          return (
            <button
              key={h.key}
              onClick={() => setActiveHorizon(h.key)}
              className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition-all text-center flex flex-col items-center justify-center border ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-400 shadow-lg shadow-sky-600/30 scale-105'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{h.label}</span>
              <span className="text-[10px] opacity-75 font-sans mt-0.5">{h.key}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
