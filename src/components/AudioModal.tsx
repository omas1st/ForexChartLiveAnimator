import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioTrack } from '../types';
import { 
  Music, 
  Upload, 
  Play, 
  Pause, 
  Scissors, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Check, 
  X, 
  Trash2, 
  Clock,
  RotateCcw,
  Zap
} from 'lucide-react';
import { 
  PRESET_TRACKS_META, 
  generatePresetAudioBuffer, 
  decodeUploadedAudioFile, 
  extractWaveformPeaks,
  synchronizedAudioPlayer
} from '../utils/audio';

interface AudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioTrack: AudioTrack | null;
  onUpdateAudioTrack: (track: AudioTrack | null) => void;
  videoDurationSeconds: number; // Current video duration (e.g. 10s or user chosen)
}

export const AudioModal: React.FC<AudioModalProps> = ({
  isOpen,
  onClose,
  audioTrack,
  onUpdateAudioTrack,
  videoDurationSeconds,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [previewProgress, setPreviewProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Stop preview on unmount or close
  useEffect(() => {
    if (!isOpen) {
      synchronizedAudioPlayer.stop();
      setIsPreviewPlaying(false);
    }
  }, [isOpen]);

  // Handle Preset selection
  const handleSelectPreset = async (presetId: string) => {
    try {
      setIsLoading(true);
      setLoadingText('Synthesizing soundtrack...');
      synchronizedAudioPlayer.stop();
      setIsPreviewPlaying(false);

      const meta = PRESET_TRACKS_META.find((t) => t.id === presetId)!;
      const buffer = await generatePresetAudioBuffer(presetId, meta.durationSeconds);

      const initialTrimEnd = Math.min(meta.durationSeconds, videoDurationSeconds);

      const newTrack: AudioTrack = {
        id: presetId,
        name: meta.name,
        artist: meta.artist,
        sourceType: 'preset',
        audioBuffer: buffer,
        duration: meta.durationSeconds,
        trimStart: 0,
        trimEnd: initialTrimEnd,
        volume: 0.8,
        isMuted: false,
      };

      onUpdateAudioTrack(newTrack);
    } catch (err) {
      console.error('Error generating audio preset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Custom File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      setIsLoading(true);
      setLoadingText('Decoding audio file...');
      synchronizedAudioPlayer.stop();
      setIsPreviewPlaying(false);

      const track = await decodeUploadedAudioFile(file);
      // Auto-cut slice to video duration
      track.trimEnd = Math.min(track.duration, videoDurationSeconds);

      onUpdateAudioTrack(track);
      setActiveTab('custom');
    } catch (err) {
      console.error('Failed to decode audio file:', err);
      alert('Could not decode this audio file. Please try standard MP3 or WAV format.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 1-Click "Auto-Cut to Video Length"
  const handleAutoCut = () => {
    if (!audioTrack) return;
    const trimStart = audioTrack.trimStart || 0;
    const newTrimEnd = Math.min(audioTrack.duration, trimStart + videoDurationSeconds);

    onUpdateAudioTrack({
      ...audioTrack,
      trimEnd: newTrimEnd,
    });
  };

  // Toggle Audio Preview
  const handleTogglePreview = () => {
    if (!audioTrack || !audioTrack.audioBuffer) return;

    if (isPreviewPlaying) {
      synchronizedAudioPlayer.stop();
      setIsPreviewPlaying(false);
    } else {
      setIsPreviewPlaying(true);
      synchronizedAudioPlayer.playPreview(audioTrack, () => {
        setIsPreviewPlaying(false);
      });
    }
  };

  // Draw Waveform Canvas
  const drawWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !audioTrack || !audioTrack.audioBuffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const peaks = extractWaveformPeaks(audioTrack.audioBuffer, 100);
    const totalDuration = audioTrack.duration || 1;
    const trimStart = audioTrack.trimStart || 0;
    const trimEnd = audioTrack.trimEnd || totalDuration;

    const barWidth = (width / peaks.length) * 0.75;
    const barGap = (width / peaks.length) * 0.25;

    peaks.forEach((peak, index) => {
      const x = index * (barWidth + barGap);
      const pointTime = (index / peaks.length) * totalDuration;
      const isInTrim = pointTime >= trimStart && pointTime <= trimEnd;

      const barHeight = Math.max(4, peak * (height * 0.78));
      const y = (height - barHeight) / 2;

      ctx.beginPath();
      if (isInTrim) {
        ctx.fillStyle = '#06b6d4'; // Active bright cyan
        ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
        ctx.shadowBlur = 4;
      } else {
        ctx.fillStyle = '#334155'; // Dimmed out-of-slice
        ctx.shadowBlur = 0;
      }

      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    });

    // Draw Trim Region Shading & Markers
    const startX = (trimStart / totalDuration) * width;
    const endX = (trimEnd / totalDuration) * width;

    // Start handle
    ctx.fillStyle = '#10b981';
    ctx.fillRect(startX - 2, 0, 4, height);

    // End handle
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(endX - 2, 0, 4, height);
  }, [audioTrack]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  if (!isOpen) return null;

  const currentTrimLength = audioTrack
    ? Math.max(0, (audioTrack.trimEnd || audioTrack.duration) - (audioTrack.trimStart || 0))
    : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        id="audio-studio-modal"
        className="w-full max-w-2xl bg-[#12141A] rounded-3xl border border-[#2D3139] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222630] bg-[#16181D]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Background Music & Audio</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wide">
                  Synced to {videoDurationSeconds}s Video
                </span>
              </h2>
              <p className="text-xs text-slate-400">Add royalty-free music, trim slice, and auto-cut to video length</p>
            </div>
          </div>
          <button
            onClick={() => {
              synchronizedAudioPlayer.stop();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#222630] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Presets vs Custom Upload */}
        <div className="px-6 pt-4 flex gap-2 border-b border-[#222630] bg-[#12141A]">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'presets'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Soundtracks ({PRESET_TRACKS_META.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'custom'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Your Own Audio</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Preset Tracks Grid */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Select Soundtrack
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_TRACKS_META.map((preset) => {
                  const isSelected = audioTrack?.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                          : 'bg-[#16181D] border-[#222630] hover:border-slate-700 hover:bg-[#1A1D24]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white">{preset.name}</h4>
                          <p className="text-xs text-slate-400">{preset.artist} • {preset.genre}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                          {preset.bpm} BPM
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Upload Dropzone */}
          {activeTab === 'custom' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Upload Audio File (MP3, WAV, AAC, M4A, OGG)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-3xl border-2 border-dashed border-[#2D3139] hover:border-cyan-500/50 bg-[#16181D]/60 hover:bg-cyan-500/5 cursor-pointer text-center transition-all flex flex-col items-center justify-center gap-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Click or drag & drop audio track</p>
                  <p className="text-xs text-slate-400 mt-1">Supports any music, beats, or voiceover track</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center justify-center gap-3 animate-pulse">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span className="text-xs font-semibold">{loadingText}</span>
            </div>
          )}

          {/* Active Audio Waveform & Trimmer Studio */}
          {audioTrack && audioTrack.audioBuffer && (
            <div className="p-5 rounded-3xl bg-[#16181D] border border-cyan-500/30 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTogglePreview}
                    className={`p-3 rounded-2xl font-bold transition-transform active:scale-95 flex items-center justify-center ${
                      isPreviewPlaying
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                    }`}
                  >
                    {isPreviewPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-white">{audioTrack.name}</h3>
                    <p className="text-xs text-slate-400">
                      Total: {formatTime(audioTrack.duration)} • Slice: <strong className="text-cyan-400">{formatTime(currentTrimLength)}</strong>
                    </p>
                  </div>
                </div>

                {/* Auto-Cut to Video Length Action */}
                <div className="flex items-center gap-2">
                  <button
                    id="auto-cut-music-btn"
                    onClick={handleAutoCut}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-transform active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Auto-Cut to {videoDurationSeconds}s Video</span>
                  </button>

                  <button
                    onClick={() => {
                      synchronizedAudioPlayer.stop();
                      onUpdateAudioTrack(null);
                    }}
                    title="Remove audio track"
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Waveform Visual Canvas */}
              <div className="relative w-full h-24 bg-[#0A0B0D] rounded-2xl overflow-hidden border border-[#2D3139] p-2">
                <canvas
                  ref={waveformCanvasRef}
                  width={600}
                  height={80}
                  className="w-full h-full block"
                />
              </div>

              {/* Trimmer Sliders: Start & End Offset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Trim Start */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300 font-medium">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Trim Start:
                    </span>
                    <span className="font-mono font-bold">{formatTime(audioTrack.trimStart || 0)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, audioTrack.duration - 1)}
                    step="0.5"
                    value={audioTrack.trimStart || 0}
                    onChange={(e) => {
                      const newStart = parseFloat(e.target.value);
                      const currentEnd = audioTrack.trimEnd || audioTrack.duration;
                      onUpdateAudioTrack({
                        ...audioTrack,
                        trimStart: newStart,
                        trimEnd: Math.max(newStart + 1, currentEnd),
                      });
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* Trim End */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300 font-medium">
                    <span className="flex items-center gap-1 text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Trim End:
                    </span>
                    <span className="font-mono font-bold">{formatTime(audioTrack.trimEnd || audioTrack.duration)}</span>
                  </div>
                  <input
                    type="range"
                    min={(audioTrack.trimStart || 0) + 1}
                    max={audioTrack.duration}
                    step="0.5"
                    value={audioTrack.trimEnd || audioTrack.duration}
                    onChange={(e) => {
                      const newEnd = parseFloat(e.target.value);
                      onUpdateAudioTrack({
                        ...audioTrack,
                        trimEnd: newEnd,
                      });
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                  />
                </div>
              </div>

              {/* Volume & Mute Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onUpdateAudioTrack({
                        ...audioTrack,
                        isMuted: !audioTrack.isMuted,
                      })
                    }
                    className="p-1.5 rounded-lg bg-[#222630] hover:bg-[#2D3139] text-slate-300"
                  >
                    {audioTrack.isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                  <span className="text-slate-400">Track Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioTrack.isMuted ? 0 : audioTrack.volume ?? 0.8}
                    onChange={(e) =>
                      onUpdateAudioTrack({
                        ...audioTrack,
                        volume: parseFloat(e.target.value),
                        isMuted: false,
                      })
                    }
                    className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="font-mono text-slate-300 font-bold">
                    {audioTrack.isMuted ? 'Muted' : `${Math.round((audioTrack.volume ?? 0.8) * 100)}%`}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  Matches {videoDurationSeconds}s video animation
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#222630] bg-[#16181D]">
          <span className="text-xs text-slate-400">
            Music will play automatically during live preview and be baked into exported MP4.
          </span>
          <button
            onClick={() => {
              synchronizedAudioPlayer.stop();
              onClose();
            }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-transform active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
