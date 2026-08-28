import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Waypoints, 
  PenTool, 
  Type, 
  Sliders, 
  Music, 
  Clock, 
  ChevronDown, 
  Plus, 
  Minus, 
  MoveHorizontal, 
  Maximize2, 
  BarChart2, 
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  Trash2
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
  onResetPath: () => void;
  candleSizing: CandleSizing;
  onUpdateCandleSizing: (sizing: Partial<CandleSizing>) => void;
  userTexts: UserText[];
  selectedTextId: string | null;
  onAddTextDirectly: () => void;
  onDeleteSelectedText: () => void;
  onClearAll: () => void;
}

const DURATION_PRESETS = [
  { label: '5s', value: 5 },
  { label: '10s (Default)', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s (1m)', value: 60 },
  { label: '120s (2m)', value: 120 },
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
  onResetPath,
  candleSizing,
  onUpdateCandleSizing,
  userTexts,
  selectedTextId,
  onAddTextDirectly,
  onDeleteSelectedText,
  onClearAll,
}) => {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showCandleTuneDrawer, setShowCandleTuneDrawer] = useState(false);

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
          
          {/* Path Tool (Primary Waypoint Engine) */}
          <button
            id="dock-tool-path"
            type="button"
            onClick={() => onSelectTool('path')}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 sm:py-1.5 px-1.5 rounded-xl font-semibold transition-all ${
              activeTool === 'path'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1D24]'
            }`}
          >
            <Waypoints className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-cyan-400" />
            <span className="text-[10px] sm:text-xs">Path Tool</span>
          </button>

          {/* Freehand Pen */}
          <button
            id="dock-tool-pen"
            type="button"
            onClick={() => onSelectTool('pen')}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1 sm:py-1.5 px-1.5 rounded-xl font-semibold transition-all ${
              activeTool === 'pen'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1D24]'
            }`}
          >
            <PenTool className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-cyan-400" />
            <span className="text-[10px] sm:text-xs">Freehand</span>
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
