import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  CloudRain,
  Network,
  Navigation,
  Radio,
  CheckCircle,
  BarChart3,
  Cpu,
  Database,
  SlidersHorizontal,
  ChevronRight,
  Box,
  Building2,
  FileText
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, dataStatus, alerts, setIsDigitalTwinOpen, selectedCity, selectedCityConfig } = useSimulation();

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'overview', label: 'Metropolitan Overview', icon: Building2, badge: '10 Cities' },
    { id: 'map', label: 'Flood Map (GIS)', icon: MapPin },
    { id: 'digital-twin', label: '3D Digital Twin', icon: Box, badge: 'DEMO', isSpecial: true },
    { id: 'nowcast', label: 'Rainfall Nowcast', icon: CloudRain, badge: '0-3h' },
    { id: 'drainage', label: 'Drainage Network', icon: Network },
    { id: 'routing', label: 'Safe Routes', icon: Navigation },
    { id: 'sensors', label: 'Sensors & Reports', icon: Radio },
    { id: 'validation', label: 'Model Validation', icon: CheckCircle, badge: 'Physics+ML' },
    { id: 'model-card', label: 'Model Card & Governance', icon: FileText, badge: 'v2.0' },
    { id: 'analytics', label: 'Analytics & Scenarios', icon: BarChart3 },
    { id: 'architecture', label: 'System Architecture', icon: Cpu },
    { id: 'sources', label: 'Data Sources', icon: Database },
  ];

  return (
    <aside className="w-64 bg-[#0d1527] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-6">
        {/* Navigation Section */}
        <div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 px-3">
            Core Modules
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'digital-twin') {
                      setIsDigitalTwinOpen(true);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    item.id === 'digital-twin'
                      ? 'text-cyan-300 hover:text-white hover:bg-cyan-950/40 border border-cyan-500/30 bg-cyan-950/10 shadow-sm'
                      : (isActive
                        ? 'bg-gradient-to-r from-sky-600/30 to-sky-500/10 text-sky-300 border border-sky-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50')
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800/60">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live Telemetry Mini-Card */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Domain Basin</span>
            <span className="text-sky-400 font-mono font-bold line-clamp-1">{selectedCityConfig?.city || selectedCity.toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Grid Resolution</span>
            <span className="text-slate-200 font-mono">16x16 (350m)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Active Gauges</span>
            <span className="text-emerald-400 font-mono font-bold">{dataStatus?.sensor_count || 14} Online</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Coupling</span>
            <span className="text-purple-400 font-mono font-semibold">2-Way Surcharge</span>
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <div className="text-[11px]">
            <p className="font-bold text-slate-200">UFNS v1.0</p>
            <p className="text-slate-400 text-[10px]">SIH 2026 Disaster Management</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
