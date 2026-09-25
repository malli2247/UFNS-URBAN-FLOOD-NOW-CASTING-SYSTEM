import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  FileText,
  X,
  AlertTriangle,
  Waves,
  CloudRain,
  GitFork,
  Navigation,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Building,
  Mountain,
  Gauge,
  Activity,
  Check,
  TrendingDown,
  Droplet
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';
import { StoryStageConfig } from '../../types';
import {
  STORY_STAGES,
  WHY_THIS_AREA_DATA,
  DEMO_ALTITUDE_MARKERS,
  getStoryStagesForCity,
  getWhyThisAreaForCity,
  getAltitudeMarkersForCity
} from '../../data/storyStepsData';
import { DEMO_FLOOD_COLORS, WATER_MOVING_COLOR, DRAINAGE_PALETTE } from '../../config/floodColors';
import { globalStoryCamera } from '../../utils/StoryCameraController';

export const StoryModeOverlay: React.FC = () => {
  const {
    isStoryMode,
    storyStep,
    setStoryStep,
    isStoryAutoPlaying,
    setIsStoryAutoPlaying,
    isPresenterMode,
    setIsPresenterMode,
    showPresenterNotes,
    setShowPresenterNotes,
    stopStoryMode,
    replayStoryMode,
    storySpeed,
    setStorySpeed,
    setFocusTarget,
    prediction,
    roads,
    drainageNetwork,
    activeRoute,
    selectedCity,
    selectedCityConfig,
  } = useSimulation();

  const [timerProgress, setTimerProgress] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(8);
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [showCutawayModal, setShowCutawayModal] = useState<boolean>(false);
  const [routeAnalysisStep, setRouteAnalysisStep] = useState<number>(0);
  const [isExplanationPanelOpen, setIsExplanationPanelOpen] = useState<boolean>(true);

  // Animated live values during specific scenes
  const [animatedDepth, setAnimatedDepth] = useState<number>(0);
  const [animatedDrainLoad, setAnimatedDrainLoad] = useState<number>(42);

  // Allow ESC key to dismiss the explanation panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExplanationPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentStage: StoryStageConfig = useMemo(() => {
    const stages = getStoryStagesForCity(selectedCityConfig);
    return stages.find(s => s.id === storyStep) || stages[0];
  }, [storyStep, selectedCityConfig]);

  const whyThisAreaList = useMemo(() => {
    return getWhyThisAreaForCity(selectedCityConfig);
  }, [selectedCityConfig]);

  // Dynamic simulation values
  const maxWaterDepth = useMemo(() => {
    if (!prediction?.grid || prediction.grid.length === 0) return 46.5;
    const maxVal = Math.max(...prediction.grid.map(c => c.water_depth_cm || 0));
    return maxVal > 1.0 ? Math.round(maxVal * 10) / 10 : 46.5;
  }, [prediction]);

  const blockedRoadCount = useMemo(() => {
    if (!roads || roads.length === 0) return 8;
    const blocked = roads.filter(r => r.travel_status === 'BLOCKED' || r.predicted_depth_cm > 25);
    return blocked.length > 0 ? blocked.length : 8;
  }, [roads]);

  const surchargedNodeInfo = useMemo(() => {
    const defaultName = selectedCityConfig?.story?.surcharge_node || 'Central Outfall Junction M02';
    if (!drainageNetwork?.nodes) return { name: defaultName, capacity: 2.5, inflow: 2.7, util: 108 };
    const sn = drainageNetwork.nodes.find(n => n.is_surcharged) || drainageNetwork.nodes[1];
    const cap = sn?.inlet_capacity_m3_s || 2.5;
    const inf = sn?.current_inflow_m3_s || 2.7;
    const util = Math.round((inf / cap) * 100);
    return { name: selectedCityConfig?.story?.surcharge_node || sn?.name || defaultName, capacity: cap, inflow: inf, util: Math.max(util, 108) };
  }, [drainageNetwork, selectedCityConfig]);

  const safeRouteStats = useMemo(() => {
    if (!activeRoute?.routes) return { dist: 9.2, time: 12.6, maxWater: 0.2 };
    const safest = activeRoute.routes.find(r => r.route_type === 'safest') || activeRoute.routes[0];
    return {
      dist: safest?.distance_km || 9.2,
      time: safest?.travel_time_min || 12.6,
      maxWater: safest?.max_depth_cm || 0.2
    };
  }, [activeRoute]);

  // Stage 5 Depth Animation (0 -> 46.5 cm)
  useEffect(() => {
    if (storyStep === 5) {
      setAnimatedDepth(0);
      const target = maxWaterDepth;
      const durationMs = 3500;
      const startTime = performance.now();

      const animId = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        // easeOutQuad
        const current = Math.round(progress * (2 - progress) * target * 10) / 10;
        setAnimatedDepth(current);
        if (progress >= 1) clearInterval(animId);
      }, 50);

      return () => clearInterval(animId);
    } else if (storyStep > 5) {
      setAnimatedDepth(maxWaterDepth);
    } else {
      setAnimatedDepth(0);
    }
  }, [storyStep, maxWaterDepth]);

  // Stage 7 Surcharge Load Animation (42% -> 108%)
  useEffect(() => {
    if (storyStep === 7) {
      setAnimatedDrainLoad(42);
      const target = surchargedNodeInfo.util;
      const durationMs = 3000;
      const startTime = performance.now();

      const animId = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const current = Math.round(42 + progress * (target - 42));
        setAnimatedDrainLoad(current);
        if (progress >= 1) clearInterval(animId);
      }, 50);

      return () => clearInterval(animId);
    } else if (storyStep > 7) {
      setAnimatedDrainLoad(surchargedNodeInfo.util);
    } else {
      setAnimatedDrainLoad(42);
    }
  }, [storyStep, surchargedNodeInfo]);

  // Dynamic auto-play timer respecting stage-specific duration and user speed multiplier
  useEffect(() => {
    if (!isStoryMode || !isStoryAutoPlaying) {
      setTimerProgress(0);
      return;
    }

    const stageDurationSec = currentStage?.durationSeconds || 8;
    const effectiveDurationMs = (stageDurationSec / storySpeed) * 1000;
    const intervalMs = 100;
    const stepIncrement = (intervalMs / effectiveDurationMs) * 100;
    let elapsedMs = 0;

    const timer = setInterval(() => {
      elapsedMs += intervalMs;
      const secLeft = Math.max(0, Math.ceil((effectiveDurationMs - elapsedMs) / 1000));
      setSecondsRemaining(secLeft);

      setTimerProgress(prev => {
        if (prev >= 100) {
          if (storyStep < 10) {
            setStoryStep(storyStep + 1);
            return 0;
          } else {
            setIsStoryAutoPlaying(false);
            return 100;
          }
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isStoryMode, isStoryAutoPlaying, storyStep, currentStage, storySpeed, setStoryStep, setIsStoryAutoPlaying]);

  // Synchronize camera smoothly on stage transition using StoryCameraController
  useEffect(() => {
    if (isStoryMode && currentStage?.camera) {
      setFocusTarget(currentStage.camera);
      globalStoryCamera.focusArea(
        currentStage.camera.center,
        currentStage.camera.zoom,
        currentStage.camera.pitch,
        currentStage.camera.bearing,
        currentStage.camera.durationMs || 1800
      );
    }
  }, [isStoryMode, storyStep, currentStage, setFocusTarget]);

  // Route calculation animation simulation in Stage 9
  useEffect(() => {
    if (storyStep === 9) {
      setRouteAnalysisStep(1);
      const t1 = setTimeout(() => setRouteAnalysisStep(2), 1200);
      const t2 = setTimeout(() => setRouteAnalysisStep(3), 2600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setRouteAnalysisStep(0);
    }
  }, [storyStep]);

  if (!isStoryMode) return null;

  // 10 Chronological Milestones
  const milestoneList = [
    { id: 1, label: '01 CITY', title: 'City Baseline' },
    { id: 2, label: '02 RAIN', title: 'Precipitation' },
    { id: 3, label: '03 ALTITUDE', title: 'Terrain & DEM' },
    { id: 4, label: '04 RUNOFF', title: 'Overland Flow' },
    { id: 5, label: '05 FLOOD', title: 'Water Accumulation' },
    { id: 6, label: '06 DRAINAGE', title: 'Subterranean Pipes' },
    { id: 7, label: '07 SURCHARGE', title: 'Backflow Surcharge' },
    { id: 8, label: '08 ROADS', title: 'Road Inundation' },
    { id: 9, label: '09 ROUTE', title: 'UFNS Safe Route' },
    { id: 10, label: '10 SOLUTION', title: 'Command Synthesis' },
  ];

  const handleRecenter = () => {
    if (currentStage?.camera) {
      globalStoryCamera.focusArea(
        currentStage.camera.center,
        currentStage.camera.zoom,
        currentStage.camera.pitch,
        currentStage.camera.bearing,
        1400
      );
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. TOP PROGRESS BAR: UFNS DEMO STORY + 10 MILESTONES + CONTROLS         */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-col items-center space-y-2 pointer-events-auto">
        <div className="w-full max-w-7xl rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Branding & Current Stage Badge */}
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-950 to-cyan-950 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-black tracking-wider text-cyan-300">UFNS DEMO STORY</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-200 font-bold">
                STAGE {storyStep}/10
              </span>
            </div>

            {/* Stage Badge */}
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase border"
              style={{
                backgroundColor: `${currentStage.semanticColor}20`,
                borderColor: `${currentStage.semanticColor}60`,
                color: currentStage.semanticColor
              }}
            >
              {currentStage.badge}
            </span>
          </div>

          {/* Center: 10 Chronological Milestones */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            {milestoneList.map((m) => {
              const isCurrent = m.id === storyStep;
              const isCompleted = storyStep > m.id;

              return (
                <button
                  key={m.id}
                  onClick={() => setStoryStep(m.id)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap ${
                    isCurrent
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)] scale-105 font-bold'
                      : isCompleted
                      ? 'text-slate-300 hover:text-white bg-slate-800/40'
                      : 'text-slate-500 hover:text-slate-400 opacity-40 hover:opacity-80'
                  }`}
                  title={`Jump to Scene ${m.id}: ${m.title}`}
                >
                  {isCompleted ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-[8px] text-emerald-300">
                      ✓
                    </span>
                  ) : (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCurrent ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'
                      }`}
                    />
                  )}
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Director Controls & Speed Switch */}
          <div className="flex items-center space-x-1.5">
            {/* Speed Toggle (0.5x, 1x, 1.5x) */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
              {[0.5, 1.0, 1.5].map((s) => (
                <button
                  key={s}
                  onClick={() => setStorySpeed(s)}
                  className={`px-1.5 py-0.5 rounded transition-all font-bold ${
                    storySpeed === s
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Playback Speed ${s}x`}
                >
                  {s}×
                </button>
              ))}
            </div>

            {/* Back Button */}
            <button
              onClick={() => setStoryStep(Math.max(1, storyStep - 1))}
              disabled={storyStep === 1}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 border border-slate-800 transition-all"
              title="Previous Stage"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Play / Pause Toggle with remaining seconds indicator */}
            <button
              onClick={() => setIsStoryAutoPlaying(!isStoryAutoPlaying)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                isStoryAutoPlaying
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 hover:bg-emerald-500/30'
              }`}
              title={isStoryAutoPlaying ? 'Pause Demonstration' : 'Auto Play Demonstration'}
            >
              {isStoryAutoPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span className="font-mono text-[11px]">{secondsRemaining}s</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[11px]">AUTO</span>
                </>
              )}
            </button>

            {/* Next Button */}
            <button
              onClick={() => setStoryStep(Math.min(10, storyStep + 1))}
              disabled={storyStep === 10}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 border border-slate-800 transition-all"
              title="Next Stage"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Replay */}
            <button
              onClick={replayStoryMode}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all"
              title="Replay from Scene 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Camera Recenter */}
            <button
              onClick={handleRecenter}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-all"
              title="Focus Active Problem"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>

            {/* Presenter Mode Toggle */}
            <button
              onClick={() => setIsPresenterMode(!isPresenterMode)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                isPresenterMode
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Toggle Projector Presentation View"
            >
              PROJECTOR
            </button>

            {/* Speaker Notes */}
            <button
              onClick={() => setShowPresenterNotes(!showPresenterNotes)}
              className={`p-1.5 rounded-lg border transition-all ${
                showPresenterNotes
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Presenter Talking Points"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>

            {/* Exit */}
            <button
              onClick={stopStoryMode}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-700/60 transition-all"
              title="Exit Story Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Auto-Play Progress Bar */}
        {isStoryAutoPlaying && (
          <div className="w-full max-w-7xl h-1 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/60">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-100 ease-linear shadow-[0_0_8px_#06b6d4]"
              style={{ width: `${timerProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER: SINGLE DOMINANT SPOTLIGHT LABEL (Only 1 visible at a time)    */}
      {/* ========================================================================= */}
      {currentStage.singleLabel && (
        <div className="self-center pointer-events-auto my-auto animate-in fade-in zoom-in-95 duration-200">
          <div
            className="px-4 py-2 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center space-x-2.5"
            style={{
              backgroundColor: 'rgba(11, 15, 25, 0.88)',
              borderColor: currentStage.semanticColor,
              boxShadow: `0 0 25px ${currentStage.semanticColor}40`
            }}
          >
            <span
              className="w-3 h-3 rounded-full animate-ping"
              style={{ backgroundColor: currentStage.semanticColor }}
            />
            <span
              className="text-xs sm:text-sm font-black tracking-wider uppercase font-mono"
              style={{ color: currentStage.semanticColor }}
            >
              {currentStage.singleLabel}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BOTTOM: PROBLEM → EFFECT → UFNS ACTION NARRATIVE CARD               */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-col sm:flex-row items-end justify-between gap-4 pointer-events-auto transition-all duration-300 ease-in-out">
        {isExplanationPanelOpen ? (
          /* Main Narrative Card with smooth animation */
          <div className="w-full max-w-3xl rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-4 space-y-3 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2">
            {/* Card Header with dedicated X button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    SCENE {storyStep} of 10
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] text-slate-400 font-mono">{currentStage.subtitle}</span>
                </div>
                <h3 className="text-base font-black text-slate-100 flex items-center space-x-2">
                  <span>{currentStage.title}</span>
                </h3>
              </div>

              {/* Contextual Action Trigger Buttons & Panel Close Button (X) */}
              <div className="flex items-center space-x-1.5">
                {storyStep === 3 && (
                  <button
                    onClick={() => setShowWhyModal(true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700 flex items-center space-x-1.5 transition-all shadow-sm"
                  >
                    <Mountain className="w-3.5 h-3.5 text-slate-300" />
                    <span>WATERSHED FACTORS (5)</span>
                  </button>
                )}

                {storyStep === 7 && (
                  <button
                    onClick={() => setShowCutawayModal(true)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/50 hover:bg-orange-500/30 flex items-center space-x-1.5 transition-all shadow-sm"
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    <span>CUTAWAY & BACKFLOW</span>
                  </button>
                )}

                {storyStep === 8 && (
                  <div className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center space-x-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>SHORTEST PATH IMPASSABLE</span>
                  </div>
                )}

                {/* Minimalist Professional Panel Close Button (X) */}
                <button
                  onClick={() => setIsExplanationPanelOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 hover:border-slate-500 flex items-center justify-center transition-all duration-200 ml-1 shadow-sm"
                  title="Hide Explanation Panel (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3-Part Core Structure: PROBLEM -> EFFECT -> UFNS ACTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              {/* 1. Problem */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/30 space-y-1">
                <div className="flex items-center space-x-1 text-rose-400 font-mono font-bold text-[10px] tracking-wider uppercase">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Problem</span>
                </div>
                <p className="text-slate-200 text-[11px] leading-snug">{currentStage.problem}</p>
              </div>

              {/* 2. Effect */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-1">
                <div className="flex items-center space-x-1 text-amber-400 font-mono font-bold text-[10px] tracking-wider uppercase">
                  <Activity className="w-3 h-3" />
                  <span>Physical Effect</span>
                </div>
                <p className="text-slate-200 text-[11px] leading-snug">{currentStage.effect}</p>
              </div>

              {/* 3. UFNS Action */}
              <div className="p-2.5 rounded-xl bg-sky-950/40 border border-cyan-500/40 space-y-1">
                <div className="flex items-center space-x-1 text-cyan-400 font-mono font-bold text-[10px] tracking-wider uppercase">
                  <Shield className="w-3 h-3" />
                  <span>UFNS Action</span>
                </div>
                <p className="text-cyan-100 text-[11px] leading-snug font-medium">{currentStage.action}</p>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SCENE-SPECIFIC TECHNICAL INSTRUMENTATION PANELS                           */}
            {/* ========================================================================= */}

            {/* SCENE 3: Topographic Elevation Profile Card (No Altitude Colors) */}
            {storyStep === 3 && (
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Mountain className="w-3.5 h-3.5 text-slate-400" />
                    <span>Topographic Watershed Elevation Profile</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">Cartosat-1 / SRTM DEM</span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                  <div className="text-center">
                    <span className="text-slate-400 block text-[9px]">WEST RIDGE</span>
                    <span className="text-slate-200 font-bold">▲ 915 m</span>
                  </div>
                  <TrendingDown className="w-4 h-4 text-slate-500" />
                  <div className="text-center">
                    <span className="text-slate-400 block text-[9px]">UPPER SLOPE</span>
                    <span className="text-slate-300 font-semibold">905 m</span>
                  </div>
                  <TrendingDown className="w-4 h-4 text-slate-500" />
                  <div className="text-center">
                    <span className="text-slate-400 block text-[9px]">MID SLOPE</span>
                    <span className="text-slate-300 font-semibold">895 m</span>
                  </div>
                  <TrendingDown className="w-4 h-4 text-slate-500" />
                  <div className="text-center">
                    <span className="text-slate-400 block text-[9px]">LOWER BASIN</span>
                    <span className="text-slate-300 font-semibold">885 m</span>
                  </div>
                  <TrendingDown className="w-4 h-4 text-slate-500" />
                  <div className="text-center">
                    <span className="text-rose-400 font-bold block text-[9px]">VALLEY TROUGH</span>
                    <span className="text-rose-400 font-bold">▼ 875 m</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Natural Gravity Drop: <b className="text-slate-200">Δh = 40.0 meters</b> across 3.4 km</span>
                  <span className="text-emerald-400 font-medium">Contour lines render engineering topography without color distortion</span>
                </div>
              </div>
            )}

            {/* SCENE 4: Overland Runoff Dynamics */}
            {storyStep === 4 && (
              <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-600/40 flex items-center justify-between text-xs animate-in fade-in duration-200">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-sky-300 font-bold">
                    <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
                    <span>D8 GRAVITY RUNOFF DISCHARGE ACTIVE</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Sky-blue moving arrows track overland sheet flow following the 40m terrain gradient into the basin.
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sky-400 font-bold text-sm">2.4 m³/s</span>
                  <span className="text-slate-400 text-[10px] block">Runoff Coeff: 0.88</span>
                </div>
              </div>
            )}

            {/* SCENE 5: Gradual Blue Flood Depth Fill Gauge */}
            {storyStep === 5 && (
              <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/50 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-200 flex items-center space-x-1.5">
                    <Waves className="w-3.5 h-3.5 text-blue-400" />
                    <span>Gradual Water Accumulation (Depression Filling)</span>
                  </span>
                  <span className="font-mono text-sm font-black text-blue-300">{animatedDepth.toFixed(1)} cm</span>
                </div>

                {/* 5-Tier Scientific Blue Gradient Bar */}
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#93c5fd] via-[#3b82f6] to-[#1e3a8a] transition-all duration-100 ease-out"
                    style={{ width: `${Math.min(100, (animatedDepth / 50) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>0 cm (Dry)</span>
                  <span>5 cm (Shallow)</span>
                  <span>15 cm (Moderate)</span>
                  <span>30 cm (Deep)</span>
                  <span className="text-blue-300 font-bold">46.5 cm (Max Basin Ponding)</span>
                </div>
              </div>
            )}

            {/* SCENE 6: Drainage Flow inside Conduits */}
            {storyStep === 6 && (
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between text-xs animate-in fade-in duration-200">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-slate-200 font-bold">
                    <span className="w-3 h-1 bg-white rounded-sm inline-block shadow-sm" />
                    <span>SUBTERRANEAN DRAINAGE CONDUITS ACTIVE</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    White conduits carry stormwater underground with sky-blue flow towards Bellandur outfalls.
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-white font-bold text-sm">2.4 m³/s</span>
                  <span className="text-slate-400 text-[10px] block">Capacity: 2.5 m³/s</span>
                </div>
              </div>
            )}

            {/* SCENE 7: Drainage Surcharge & Reverse Backflow Gauge */}
            {storyStep === 7 && (
              <div className="p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/50 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-200 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                    <span>Junction M02 Surcharge & Reverse Backflow Spill</span>
                  </span>
                  <span className={`font-mono text-sm font-black ${animatedDrainLoad > 100 ? 'text-rose-400' : 'text-orange-300'}`}>
                    {animatedDrainLoad}% LOAD
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    className={`h-full transition-all duration-100 ease-out ${
                      animatedDrainLoad > 100
                        ? 'bg-gradient-to-r from-amber-500 to-rose-600 animate-pulse'
                        : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (animatedDrainLoad / 120) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Pipe Full: 2.5 m³/s (100%)</span>
                  <span className="text-rose-400 font-bold">Current Inflow: 2.7 m³/s (+18 cm backflow spill)</span>
                </div>
              </div>
            )}

            {/* SCENE 8: Road Inundation Impact */}
            {storyStep === 8 && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/60 flex items-center justify-between text-xs animate-in fade-in duration-200">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span>8 ARTERIAL ROAD SEGMENTS IMPASSABLE</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {(selectedCityConfig?.story?.hotspot_road || 'Arterial corridor')} submerged under 46.5cm flood water. Emergency vehicle clearance (25cm) breached.
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-rose-400 font-bold text-sm">⛔ BLOCKED</span>
                  <span className="text-slate-400 text-[10px] block">Direct path cut off</span>
                </div>
              </div>
            )}

            {/* SCENE 9: UFNS Safe Route Activation */}
            {storyStep === 9 && (
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between text-xs animate-in fade-in duration-200">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {routeAnalysisStep === 1
                        ? 'ANALYZING FLOOD CONDITIONS...'
                        : routeAnalysisStep === 2
                        ? 'FLOOD-AWARE ROUTING ACTIVE'
                        : 'RECOMMENDED SAFE ROUTE VERIFIED'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Direct road bypassed safely via Outer Ring Rd corridor. Zero submersion hazard for ambulance 🚑.
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-emerald-400 font-bold text-sm">{safeRouteStats.dist} km</span>
                  <span className="text-slate-400 text-[10px] block">{safeRouteStats.time} min • 0% hazard</span>
                </div>
              </div>
            )}

            {/* SCENE 10: Complete Solution & Command Synthesis */}
            {storyStep === 10 && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-sky-950/60 via-indigo-950/60 to-cyan-950/60 border border-cyan-500/50 text-xs space-y-2.5">
                <div className="text-center font-black text-sm tracking-wider text-cyan-300">
                  UFNS: REAL-TIME CLOSED-LOOP URBAN FLOOD DEFENSE
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-mono">
                  <div className="p-1.5 rounded-lg bg-slate-900/80 border border-sky-500/40">
                    <span className="text-sky-400 font-bold block text-xs">PREDICT</span>
                    <span className="text-slate-300">Flood depth 45m ahead</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900/80 border border-orange-500/40">
                    <span className="text-orange-400 font-bold block text-xs">DETECT</span>
                    <span className="text-slate-300">108% drain surcharge</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900/80 border border-rose-500/40">
                    <span className="text-rose-400 font-bold block text-xs">WARN</span>
                    <span className="text-slate-300">8 blocked roads</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900/80 border border-emerald-500/40">
                    <span className="text-emerald-400 font-bold block text-xs">RESPOND</span>
                    <span className="text-slate-300">Safe ambulance path</span>
                  </div>
                </div>

                {/* Technical Semantic Color Key */}
                <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                    Technical Semantic Color Standards
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
                      <span className="text-slate-300">Sky Blue: Moving Water</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
                      <span className="text-slate-300">Blue: Standing Flood</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-white" />
                      <span className="text-slate-300">White: Drainage Pipes</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                      <span className="text-slate-300">Amber: Load &gt;85%</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                      <span className="text-slate-300">Red: Blocked / Surcharge</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                      <span className="text-slate-300">Green: Safe Route</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Narration Line */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span className="italic">"{currentStage.narration}"</span>
              <span className="font-mono text-[10px] text-slate-500">{currentStage.evidence}</span>
            </div>
          </div>
        ) : (
          /* Small Floating Button when panel is hidden */
          <button
            onClick={() => setIsExplanationPanelOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-950/90 hover:bg-slate-900 backdrop-blur-md border border-slate-700 hover:border-cyan-400/80 text-slate-200 hover:text-white shadow-2xl flex items-center space-x-2 text-xs font-bold transition-all duration-200 group animate-in fade-in slide-in-from-bottom-2"
            title="Show Scene Explanation Panel (Story Info)"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>STORY INFO</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
              SCENE {storyStep}/10
            </span>
          </button>
        )}

        {/* Compact Right Side Info (Routes comparison during stage 8 & 9) */}
        {(storyStep === 8 || storyStep === 9) && isExplanationPanelOpen && (
          <div className="w-full sm:w-72 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-3 text-xs space-y-2 animate-in fade-in duration-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">
              Multi-Objective Route Evaluation
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center p-1.5 rounded bg-slate-900 border border-rose-900/50">
                <span className="text-slate-300 font-semibold">Direct Route:</span>
                <span className="text-rose-400 font-mono font-bold">IMPASSABLE (46.5cm)</span>
              </div>
              <div className="flex justify-between items-center p-1.5 rounded bg-slate-900 border border-amber-900/50">
                <span className="text-slate-300 font-semibold">Fastest Path:</span>
                <span className="text-amber-400 font-mono">12.0 min (High Exposure)</span>
              </div>
              <div className="flex justify-between items-center p-1.5 rounded bg-emerald-950/60 border border-emerald-500/60 font-bold shadow-sm">
                <span className="text-emerald-300 flex items-center space-x-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Safest Bypass:</span>
                </span>
                <span className="text-emerald-400 font-mono">{safeRouteStats.time} min (0% Hazard)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS: "WHY THIS AREA FLOODING?" (WATERSHED CAUSAL CHAIN)             */}
      {/* ========================================================================= */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
                <Mountain className="w-4 h-4 text-slate-400" />
                <span>Physical Causal Factors: {selectedCityConfig?.focus_basin?.name || selectedCityConfig?.story?.basin_name || 'Catchment Basin'} ({selectedCityConfig?.city || 'Metropolitan'})</span>
              </div>
              <button onClick={() => setShowWhyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {whyThisAreaList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-[10px] text-slate-300">
                      {item.stepNumber}
                    </span>
                    <div>
                      <div className="font-bold text-slate-100 flex items-center space-x-2">
                        <span>{item.factor}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {item.benchmark}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{item.impact}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-sm" style={{ color: item.color }}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300">
              <b>Hydraulic Conclusion:</b> The natural bowl depression (875m AMSL) receives 40m of vertical gravity runoff from the western ridge (915m AMSL). Combined with an impervious surface coefficient of 0.88 and a 2.5 m³/s drainage bottleneck, extreme rainfall guarantees rapid surface ponding without dynamic nowcasting.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODALS: UNDERGROUND CUTAWAY & BACKFLOW SCHEMATIC (SCENE 7)             */}
      {/* ========================================================================= */}
      {showCutawayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
          <div className="w-full max-w-xl rounded-2xl bg-slate-950 border border-orange-500/50 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-orange-400 font-bold text-sm">
                <GitFork className="w-4 h-4" />
                <span>Underground Cutaway: {surchargedNodeInfo.name} Surcharge & Backflow</span>
              </div>
              <button onClick={() => setShowCutawayModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cutaway Schematic */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700">
                <span>[1] Surface Grade (Street Elevation)</span>
                <span className="text-slate-300 font-bold">882.5 m AMSL</span>
              </div>

              <div className="flex items-center justify-center text-sky-400 font-bold space-x-2 animate-bounce">
                <span>▲ SKY-BLUE REVERSE BACKFLOW SPILL (+18 cm) ▲</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-orange-950/40 border border-orange-500/60 text-orange-200">
                <div>
                  <b className="block">{surchargedNodeInfo.name}</b>
                  <span className="text-[10px] text-orange-300">Intake Capacity: 2.5 m³/s • Inflow: 2.7 m³/s</span>
                </div>
                <span className="px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px]">
                  108% LOAD
                </span>
              </div>

              <div className="flex items-center justify-center text-slate-500 text-[10px]">
                <span>▼ Subterranean Conduit (3.2m Depth) ▼</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-800/60 border border-slate-700 text-slate-400 text-[11px]">
                <span>Downstream Choke Conduit (P-082)</span>
                <span>Capacity 2.5 m³/s (Exceeded by 0.2 m³/s)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-950/30 border border-orange-800/40 text-[11px] text-orange-200">
              <b>2-Way Coupling Physics:</b> When pipe hydraulic grade line (HGL) exceeds ground rim elevation, the drainage network acts as a pressurized water source, spewing surplus water directly onto road grade.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PRESENTER NOTES DRAWER ("What to say")                                 */}
      {/* ========================================================================= */}
      {showPresenterNotes && (
        <div className="fixed top-20 right-4 z-40 w-96 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-cyan-500/50 shadow-2xl p-4 space-y-3 pointer-events-auto animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
              <FileText className="w-4 h-4" />
              <span>Presenter Script (What to say)</span>
            </div>
            <button onClick={() => setShowPresenterNotes(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed italic">
            "{currentStage.presenterNotes}"
          </div>

          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>Stage Duration: <b>{currentStage.durationSeconds}s</b></span>
            <span>Speed: <b>{storySpeed}x</b></span>
          </div>
        </div>
      )}
    </div>
  );
};
