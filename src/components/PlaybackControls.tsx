import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  Volume2, 
  VolumeX,
  Gauge,
  Music,
  Clock,
  ChevronDown
} from 'lucide-react';
import { PlaybackState } from '../types';

interface PlaybackControlsProps {
  playback: PlaybackState;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onReset: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleSound: () => void;
  onToggleLoop: () => void;
  onSetDuration: (duration: number) => void;
  onOpenAudioModal: () => void;
}

const DURATION_PRESETS = [
  { label: '5s', value: 5 },
  { label: '10s (Default)', value: 10 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s (1m)', value: 60 },
  { label: '120s (2m Max)', value: 120 },
];

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playback,
  onTogglePlay,
  onSeek,
  onReset,
  onSetPlaybackRate,
  onToggleSound,
  onToggleLoop,
  onSetDuration,
  onOpenAudioModal,
}) => {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const progressPercent = Math.min(100, Math.max(0, (playback.currentTime / (playback.duration || 10)) * 100));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div id="playback-controls-container" className="bg-[#16181D] border border-[#2D3139] rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      {/* Timeline scrubber */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold">
              Timeline:
            </span>
            <span className="text-cyan-400 font-bold tracking-wider">
              {formatTime(playback.currentTime)}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">
              {formatTime(playback.duration)}
            </span>
          </div>

          {/* Video Duration Selector dropdown/pill */}
          <div className="relative">
            <button
              id="duration-selector-btn"
              onClick={() => setShowDurationPicker(!showDurationPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#222630] hover:bg-[#2D3139] border border-cyan-500/30 text-cyan-300 text-xs font-semibold font-sans transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Length: {playback.duration}s</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {showDurationPicker && (
              <div className="absolute right-0 bottom-full mb-2 w-56 p-3 rounded-2xl bg-[#16181D] border border-[#2D3139] shadow-2xl z-30 animate-in fade-in zoom-in-95 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Video Duration (Max 2 min)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        onSetDuration(preset.value);
                        setShowDurationPicker(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left ${
                        playback.duration === preset.value
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-[#222630] text-slate-300 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom duration slider */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Custom Length:</span>
                    <span className="text-cyan-400 font-bold">{playback.duration}s</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="120"
                    step="1"
                    value={playback.duration}
                    onChange={(e) => onSetDuration(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom Scrubber bar */}
        <input
          id="timeline-scrubber"
          type="range"
          min="0"
          max={playback.duration}
          step="0.05"
          value={playback.currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-2 bg-[#2D3139] rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
          style={{
            background: `linear-gradient(to right, #06b6d4 ${progressPercent}%, #2D3139 ${progressPercent}%)`
          }}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#2D3139]">
        {/* Play / Pause / Reset */}
        <div className="flex items-center gap-2">
          <button
            id="reset-play-btn"
            onClick={onReset}
            title="Restart from beginning"
            className="p-2.5 rounded-xl bg-[#1F2229] hover:bg-[#2D3139] border border-[#2D3139] text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="main-play-pause-btn"
            onClick={onTogglePlay}
            title={playback.isPlaying ? 'Pause' : `Play ${playback.duration}s Live Animation`}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md ${
              playback.isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
          >
            {playback.isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play ({playback.duration}s)</span>
              </>
            )}
          </button>
        </div>

        {/* Music, Speed, Loop & Audio Toggles */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Music Button */}
          <button
            id="open-audio-studio-btn"
            onClick={onOpenAudioModal}
            title="Configure Background Music & Audio Trimming"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              playback.audioTrack
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                : 'bg-[#1F2229] border-[#2D3139] text-slate-300 hover:text-white hover:border-slate-600'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[90px] truncate hidden sm:inline">
              {playback.audioTrack ? playback.audioTrack.name : 'Add Music'}
            </span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-[#1F2229] border border-[#2D3139] p-1 rounded-xl">
            <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1.5 hidden sm:inline" />
            {[0.5, 1, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => onSetPlaybackRate(rate)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  playback.playbackRate === rate
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Loop Toggle */}
          <button
            id="toggle-loop-btn"
            onClick={onToggleLoop}
            title="Toggle Repeat Loop"
            className={`p-2.5 rounded-xl border transition-colors ${
              playback.isLooping
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-[#1F2229] border-[#2D3139] text-slate-400 hover:text-white'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Audio Sound FX Toggle */}
          <button
            id="toggle-sound-btn"
            onClick={onToggleSound}
            title={playback.soundEnabled ? 'Mute Market Sounds' : 'Unmute Market Sounds'}
            className={`p-2.5 rounded-xl border transition-colors ${
              playback.soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-[#1F2229] border-[#2D3139] text-slate-400 hover:text-white'
            }`}
          >
            {playback.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
