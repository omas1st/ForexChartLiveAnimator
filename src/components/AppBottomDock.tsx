import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Waypoints, 
  PenTool, 
  Square,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Type, 
  Sliders, 
  Music, 
  Clock, 
  ChevronDown, 
  Plus, 
  MoveHorizontal, 
  Maximize2, 
  BarChart2, 
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  Trash2,
  Palette,
  Check
} from 'lucide-react';
import { 
  DrawingToolType, 
  CandleSizing, 
  PlaybackState, 
  UserText 
} from '../types';

interface AppBottomDockProps {
  // Playback Props
  playback: PlaybackState;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onReset: () => void;
  onSetDuration: (duration: number) => void;
  onOpenAudioModal: () => void;
  
  // Drawing & Tool Props
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  drawingColor?: string;
  onSelectDrawingColor?: (color: string) => void;
  onResetPath: () => void;
  candleSizing: CandleSizing;
  onUpdateCandleSizing: (sizing: Partial<CandleSizing>) => void;
  userTexts: UserText[];
  selectedTextId: string | null;
  onAddTextDirectly: () => void;
  onDeleteSelectedText: () => void;
  onClearAll: () => void;

  // Path Auto-Adjust Toggle props
  autoAdjustPath?: boolean;
  onToggleAutoAdjustPath?: (enabled: boolean) => void;
}

const DURATION_PRESETS = [
  { label: '5s', value: 5 },
  { label: '10s (Default)', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s (1m)', value: 60 },
  { label: '120s (2m)', value: 120 },
];

const DRAWING_TOOL_OPTIONS = [
  {
    id: 'freehand' as DrawingToolType,
    name: 'Freehand',
    badge: 'Pen',
    icon: <PenTool className="w-4 h-4 text-cyan-400" />,
    desc: 'Fluid curves, waves, and patterns without candles',
  },
  {
    id: 'rectangle' as DrawingToolType,
    name: 'Rectangle',
    badge: 'Box',
    icon: <Square className="w-4 h-4 text-amber-400" />,
    desc: 'Order blocks, zones, and liquidity boxes',
  },
  {
    id: 'line' as DrawingToolType,
    name: 'Straight Line',
    badge: 'Line',
    icon: <Minus className="w-4 h-4 text-cyan-300 stroke-[3]" />,
    desc: 'Trendlines, support, resistance, and key levels',
  },
  {
    id: 'arrow-up' as DrawingToolType,
    name: 'Up Arrow',
    badge: '↗ Bullish',
    icon: <ArrowUpRight className="w-4 h-4 text-emerald-400 stroke-[2.5]" />,
    desc: 'Bullish breakout, upward target, or markup',
  },
  {
    id: 'arrow-down' as DrawingToolType,
    name: 'Down Arrow',
    badge: '↘ Bearish',
    icon: <ArrowDownRight className="w-4 h-4 text-rose-400 stroke-[2.5]" />,
    desc: 'Bearish breakdown, downward target, or markdown',
  },
];

const DRAWING_PALETTE = [
  { name: 'Cyan Glow', hex: '#38bdf8' },
  { name: 'Bullish Green', hex: '#10b981' },
  { name: 'Bearish Red', hex: '#f43f5e' },
  { name: 'Amber Gold', hex: '#fbbf24' },
  { name: 'Purple Neon', hex: '#a855f7' },
  { name: 'Clean White', hex: '#f8fafc' },
];

export const AppBottomDock: React.FC<AppBottomDockProps> = ({
  playback,
  onTogglePlay,
  onSeek,
  onReset,
  onSetDuration,
  onOpenAudioModal,
  activeTool,
  onSelectTool,
  drawingColor = '#38bdf8',
  onSelectDrawingColor,
  onResetPath,
  candleSizing,
  onUpdateCandleSizing,
  userTexts,
  selectedTextId,
  onAddTextDirectly,
  onDeleteSelectedText,
  onClearAll,
  autoAdjustPath = true,
  onToggleAutoAdjustPath,
}) => {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showCandleTuneDrawer, setShowCandleTuneDrawer] = useState(false);
  const [showDrawingToolsPicker, setShowDrawingToolsPicker] = useState(false);
  const [showPathAdjustMenu, setShowPathAdjustMenu] = useState(false);

  const isTechnicalDrawingToolActive = [
    'freehand',
    'rectangle',
    'line',
    'arrow-up',
    'arrow-down',
    'pen',
  ].includes(activeTool);

  const activeDrawingToolObj = DRAWING_TOOL_OPTIONS.find((t) => t.id === activeTool);

  const progressPercent = Math.min(100, Math.max(0, (playback.currentTime / (playback.duration || 10)) * 100));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div id="app-bottom-dock-container" className="w-full shrink-0 relative select-none z-20">
      
      {/* Candle Tune Popover / Slide-Up Sheet */}
      {showCandleTuneDrawer && (
        <div 
          id="candle-tune-drawer"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[calc(100%-1rem)] max-w-xl p-3.5 sm:p-4 rounded-2xl bg-[#14161E]/95 backdrop-blur-xl border border-cyan-500/40 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-3 space-y-3 text-slate-100"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Candlestick Geometry & Spacing
              </span>
            </div>
            <button
              onClick={() => setShowCandleTuneDrawer(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* 1. Spacing */}
            <div className="bg-[#1A1D26] p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <MoveHorizontal className="w-3 h-3 text-emerald-400" /> Spacing
                </span>
                <span className="font-mono font-bold text-emerald-300">
                  {((candleSizing.spacingScale || 1.0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#12141A] rounded-lg p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCandleSizing({
                      spacingScale: Math.max(0.3, +((candleSizing.spacingScale || 1.0) - 0.1).toFixed(1)),
                    })
                  }
                  className="p-1 rounded text-slate-300 hover:text-emerald-300 hover:bg-slate-800"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCandleSizing({
                      spacingScale: Math.min(2.5, +((candleSizing.spacingScale || 1.0) + 0.1).toFixed(1)),
                    })
                  }
                  className="p-1 rounded text-slate-300 hover:text-emerald-300 hover:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Width */}
            <div className="bg-[#1A1D26] p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <BarChart2 className="w-3 h-3 text-cyan-400" /> Width
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  {((candleSizing.widthScale || 0.65) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#12141A] rounded-lg p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCandleSizing({
                      widthScale: Math.max(0.15, +((candleSizing.widthScale || 0.65) - 0.05).toFixed(2)),
                    })
                  }
                  className="p-1 rounded text-slate-300 hover:text-cyan-300 hover:bg-slate-800"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCandleSizing({
                      widthScale: Math.min(2.0, +((candleSizing.widthScale || 0.65) + 0.05).toFixed(2)),
                    })
                  }
                  className="p-1 rounded text-slate-300 hover:text-cyan-300 hover:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Height */}
            <div className="bg-[#1A1D26] p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <Maximize2 className="w-3 h-3 text-amber-400" /> Height
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {((candleSizing.heightScale || 0.85) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#12141A] rounded-lg p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCandleSizing({
                      heightScale: Math.max(0.2, +((candleSizing.heightScale || 0.85) - 0.05).toFixed(2)),
                    })
                  }
                  className="p-1 rounded text-slate-300 hover:text-amber-300 hover:bg-slate-800"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCandleSizing({
                      heightScale: Math.min(2.5, +((candleSizing.heightScale || 0.85) + 0.05).toFixed(2)),
                    })
                  }
                  className="p-1 rounded text-slate-300 hover:text-amber-300 hover:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. Candle Count */}
            <div className="bg-[#1A1D26] p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-medium text-slate-400">Candles</span>
                <span className="font-mono font-bold text-purple-300">
                  {candleSizing.candleCount}
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#12141A] rounded-lg p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCandleSizing({
                      candleCount: Math.max(6, candleSizing.candleCount - 2),
                    })
                  }
                  className="p-1 rounded text-slate-300 hover:text-purple-300 hover:bg-slate-800"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCandleSizing({
                      candleCount: Math.min(60, candleSizing.candleCount + 2),
                    })
                  }
                  className="p-1 rounded text-slate-300 hover:text-purple-300 hover:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawing Tools Popover Sheet */}
      {showDrawingToolsPicker && (
        <div 
          id="drawing-tools-popup"
          className="absolute bottom-full left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:left-24 mb-2 w-[calc(100%-1rem)] max-w-sm p-3.5 sm:p-4 rounded-2xl bg-[#14161E]/98 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_16px_40px_rgba(0,0,0,0.85)] z-40 animate-in fade-in slide-in-from-bottom-3 space-y-3 text-slate-100"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Drawing Tools (No Candles)
              </span>
            </div>
            <button
              onClick={() => setShowDrawingToolsPicker(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-snug">
            Draw technical shapes without forming candlesticks. Tap any drawing anytime to transform it into an animated candlestick pattern!
          </p>

          {/* Tool Options List */}
          <div className="flex flex-col gap-1.5">
            {DRAWING_TOOL_OPTIONS.map((tool) => {
              const isSelected = activeTool === tool.id || (tool.id === 'freehand' && activeTool === 'pen');
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    onSelectTool(tool.id);
                    setShowDrawingToolsPicker(false);
                  }}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-200 shadow-sm'
                      : 'bg-[#1A1D27] hover:bg-[#232734] border border-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 shrink-0">
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold">{tool.name}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {tool.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{tool.desc}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {/* Color Palette for Drawings */}
          {onSelectDrawingColor && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Default Color</span>
              </div>
              <div className="flex items-center gap-1.5">
                {DRAWING_PALETTE.map((c) => {
                  const isColorActive = drawingColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => onSelectDrawingColor(c.hex)}
                      title={c.name}
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                        isColorActive ? 'ring-2 ring-white scale-110' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isColorActive && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Candlestick Path Spacing & Auto-Adjust Drawer Popup */}
      {showPathAdjustMenu && (
        <div 
          id="dock-path-adjust-menu"
          className="absolute bottom-16 left-2 sm:left-4 z-40 w-[94vw] max-w-sm bg-[#12151E]/95 backdrop-blur-2xl border border-cyan-500/50 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.85)] p-3 sm:p-3.5 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-[13px] font-bold text-white flex items-center gap-1.5">
                  <span>Candlestick Auto-Adjust</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    autoAdjustPath 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {autoAdjustPath ? 'AUTO ON' : 'MANUAL RAW'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {autoAdjustPath 
                    ? 'Uniform time spacing, zero candle overlaps, smooth swings' 
                    : 'Exact drawn coordinates without auto-alignment'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPathAdjustMenu(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Option 1: Professional Auto-Adjust */}
          <button
            type="button"
            id="btn-enable-auto-adjust"
            onClick={() => {
              onToggleAutoAdjustPath?.(true);
              setShowPathAdjustMenu(false);
            }}
            className={`p-2.5 rounded-xl text-left border transition-all flex items-start gap-2.5 cursor-pointer ${
              autoAdjustPath
                ? 'bg-cyan-500/20 border-cyan-500/70 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-[#181B26] border-slate-800/80 text-slate-400 hover:bg-[#202433] hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${autoAdjustPath ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Auto-Adjust Path (Professional)</span>
                {autoAdjustPath && <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                Institutional spacing. Automatically equalizes candle distance, eliminates horizontal overlap, and smooths price curves like authentic financial charts.
              </p>
            </div>
          </button>

          {/* Option 2: Remove from Auto-Adjust (Manual Raw Mode) */}
          <button
            type="button"
            id="btn-remove-auto-adjust"
            onClick={() => {
              onToggleAutoAdjustPath?.(false);
              setShowPathAdjustMenu(false);
            }}
            className={`p-2.5 rounded-xl text-left border transition-all flex items-start gap-2.5 cursor-pointer ${
              !autoAdjustPath
                ? 'bg-amber-500/20 border-amber-500/70 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-[#181B26] border-slate-800/80 text-slate-400 hover:bg-[#202433] hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${!autoAdjustPath ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
              <Minus className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Remove Path from Auto (Manual Raw)</span>
                {!autoAdjustPath && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                Removes auto-adjust. Candles strictly follow your raw cursor or finger waypoints without automatic equalized spacing.
              </p>
            </div>
          </button>

          {/* Quick Toggle Helper Bar */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
            <span>Current: <strong className="text-slate-200">{autoAdjustPath ? 'Professional Auto' : 'Manual Raw'}</strong></span>
            <button
              type="button"
              onClick={() => {
                onToggleAutoAdjustPath?.(!autoAdjustPath);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold transition-colors cursor-pointer"
            >
              {autoAdjustPath ? 'Remove from Auto' : 'Add Back to Auto'}
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Dock Bar */}
      <div className="bg-[#12141A]/95 backdrop-blur-xl border-t border-[#232731] px-2.5 sm:px-4 py-2 flex flex-col gap-1.5">
        
        {/* Row 1: Timeline Scrubber & Quick Playback */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play/Pause Button */}
          <button
            id="dock-play-pause-btn"
            type="button"
            onClick={onTogglePlay}
            title={playback.isPlaying ? 'Pause Animation' : 'Play Live 10s Animation'}
            className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-transform active:scale-90 shrink-0 shadow-md ${
              playback.isPlaying
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                : 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
            }`}
          >
            {playback.isPlaying ? (
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Time text */}
          <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs shrink-0">
            <span className="text-cyan-400 font-bold">{formatTime(playback.currentTime)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{formatTime(playback.duration)}</span>
          </div>

          {/* Scrubber slider */}
          <div className="flex-1 relative flex items-center">
            <input
              id="dock-timeline-scrubber"
              type="range"
              min="0"
              max={playback.duration}
              step="0.05"
              value={playback.currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#252934] rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #06b6d4 ${progressPercent}%, #252934 ${progressPercent}%)`
              }}
            />
          </div>

          {/* Duration Selector Pill */}
          <div className="relative shrink-0">
            <button
              id="dock-duration-btn"
              type="button"
              onClick={() => setShowDurationPicker(!showDurationPicker)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1A1D26] hover:bg-[#252934] border border-[#2D3139] text-cyan-300 text-[11px] font-semibold transition-colors"
            >
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>{playback.duration}s</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>

            {showDurationPicker && (
              <div className="absolute right-0 bottom-full mb-2 w-48 p-2.5 rounded-xl bg-[#16181D] border border-[#2D3139] shadow-2xl z-40 animate-in fade-in zoom-in-95 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Video Duration
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        onSetDuration(preset.value);
                        setShowDurationPicker(false);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors text-left ${
                        playback.duration === preset.value
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-[#222630] text-slate-300 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Native Mobile App Tools Dock */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 pt-1 border-t border-[#232731]/80">
          
          {/* Path Tool (Primary Waypoint Engine) + Dropdown Toggle for Auto-Adjust */}
          <div className="flex-1 flex items-stretch rounded-xl border border-transparent">
            <button
              id="dock-tool-path"
              type="button"
              onClick={() => onSelectTool('path')}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 py-1 sm:py-1.5 px-1 rounded-l-xl font-semibold transition-all ${
                activeTool === 'path'
                  ? 'bg-cyan-500/20 text-cyan-300 border-y border-l border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1D24]'
              }`}
            >
              <Waypoints className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[10px] sm:text-xs">Path</span>
              {autoAdjustPath && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse hidden sm:inline-block" title="Auto-Adjust Active" />
              )}
            </button>

            {/* Small dropdown feature at the side of Path Tool */}
            <button
              id="dock-path-dropdown-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPathAdjustMenu(!showPathAdjustMenu);
                setShowDrawingToolsPicker(false);
                setShowCandleTuneDrawer(false);
                setShowDurationPicker(false);
              }}
              title="Path Candlestick Spacing: Add or Remove Auto-Adjust"
              className={`px-1 sm:px-1.5 flex items-center justify-center rounded-r-xl border-l border-slate-800 transition-colors cursor-pointer ${
                showPathAdjustMenu
                  ? 'bg-cyan-500/30 text-cyan-200 border-y border-r border-cyan-500/60'
                  : activeTool === 'path'
                  ? 'bg-cyan-500/20 text-cyan-400 border-y border-r border-cyan-500/60 hover:bg-cyan-500/30'
                  : 'bg-[#181B24] text-slate-400 hover:text-slate-200 hover:bg-[#202430]'
              }`}
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showPathAdjustMenu ? 'rotate-180 text-cyan-300' : ''}`} />
            </button>
          </div>

          {/* Drawing Tools (Freehand, Rectangle, Straight Line, Arrows - No Candles) */}
          <button
            id="dock-tool-drawing-menu"
            type="button"
            onClick={() => setShowDrawingToolsPicker(!showDrawingToolsPicker)}
            title="Drawing Tools (Shapes & Patterns without candles)"
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 sm:py-1.5 px-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              isTechnicalDrawingToolActive || showDrawingToolsPicker
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1D24]'
            }`}
          >
            {activeDrawingToolObj ? activeDrawingToolObj.icon : <PenTool className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-cyan-400" />}
            <span className="text-[10px] sm:text-xs">
              {activeDrawingToolObj ? activeDrawingToolObj.name : 'Drawing'}
            </span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60 hidden xs:inline" />
          </button>

          {/* Add Text Note */}
          <button
            id="dock-tool-text"
            type="button"
            onClick={onAddTextDirectly}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 sm:py-1.5 px-1.5 rounded-xl font-semibold transition-all ${
              activeTool === 'text'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1D24]'
            }`}
          >
            <Type className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            <span className="text-[10px] sm:text-xs">+ Text</span>
          </button>

          {/* Tune Candlestick Geometry Drawer Toggle */}
          <button
            id="dock-tool-tune"
            type="button"
            onClick={() => setShowCandleTuneDrawer(!showCandleTuneDrawer)}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 sm:py-1.5 px-1.5 rounded-xl font-semibold transition-all ${
              showCandleTuneDrawer
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1D24]'
            }`}
          >
            <Sliders className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-purple-400" />
            <span className="text-[10px] sm:text-xs">Tune</span>
          </button>

          {/* Audio Soundtrack Studio Modal Trigger */}
          <button
            id="dock-tool-audio"
            type="button"
            onClick={onOpenAudioModal}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 sm:py-1.5 px-1.5 rounded-xl font-semibold transition-all ${
              playback.audioTrack
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1D24]'
            }`}
          >
            <Music className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-pink-400" />
            <span className="text-[10px] sm:text-xs">{playback.audioTrack ? 'Audio ✓' : 'Music'}</span>
          </button>

          {/* Clear / Reset Path */}
          <button
            id="dock-tool-reset"
            type="button"
            onClick={onReset}
            title="Restart playback or clear"
            className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 py-1 sm:py-1.5 px-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-xs hidden xs:inline">Reset</span>
          </button>

        </div>

      </div>
    </div>
  );
};
