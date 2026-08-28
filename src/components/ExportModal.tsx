import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Video, 
  Smartphone, 
  Monitor, 
  Square, 
  CheckCircle2, 
  Film,
  Music,
  Clock,
  Zap,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExportSettings, AspectRatioType, Point, Candle, CandleSizing, UserDrawing, UserText, AudioTrack } from '../types';
import { recordAnimationToVideo, RecordingResult, downloadVideoBlob, shareVideoFile, isMobileDevice } from '../utils/videoRecorder';
import { renderForexChartToContext } from './renderForexChart';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  backgroundImage: HTMLImageElement | null;
  pathPoints: Point[];
  candles: Candle[];
  candleSizing: CandleSizing;
  userDrawings: UserDrawing[];
  userTexts: UserText[];
  bullishColor: string;
  bearishColor: string;
  videoDurationSeconds: number;
  audioTrack: AudioTrack | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  backgroundImage,
  pathPoints,
  candles,
  candleSizing,
  userDrawings,
  userTexts,
  bullishColor,
  bearishColor,
  videoDurationSeconds,
  audioTrack,
}) => {
  const isMobile = isMobileDevice();
  const [qualityPreset, setQualityPreset] = useState<'mobile' | 'hd' | 'ultra'>(isMobile ? 'mobile' : 'hd');

  const [settings, setSettings] = useState<ExportSettings>({
    aspectRatio: backgroundImage ? 'original' : '16:9',
    durationSeconds: videoDurationSeconds,
    fps: isMobile ? 30 : 60,
    authorHandle: '',
    showWatermark: false,
    audioTrack: audioTrack,
  });

  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      durationSeconds: videoDurationSeconds,
      audioTrack: audioTrack,
      aspectRatio: prev.aspectRatio === 'original' && !backgroundImage ? '16:9' : prev.aspectRatio,
    }));
  }, [videoDurationSeconds, audioTrack, backgroundImage]);

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<RecordingResult | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);
      setErrorMessage(null);
      setStatusText(`Initializing ${settings.durationSeconds}s video encoder...`);
      setExportResult(null);
      setShareSuccess(null);

      const targetFps = qualityPreset === 'ultra' ? 60 : 30;

      const result = await recordAnimationToVideo({
        durationSeconds: settings.durationSeconds,
        fps: targetFps,
        qualityPreset: qualityPreset,
        settings: {
          ...settings,
          audioTrack: audioTrack,
        },
        backgroundImage,
        onProgress: (p, msg) => {
          setProgress(p);
          setStatusText(msg);
        },
        renderFrame: (ctx, width, height, timeRatio) => {
          renderForexChartToContext(ctx, width, height, {
            backgroundImage,
            pathPoints,
            candles,
            candleSizing,
            userDrawings,
            userTexts,
            currentTimeRatio: timeRatio,
            exportSettings: settings,
            isExporting: true,
            bullishColor,
            bearishColor,
          });
        },
      });

      setExportResult(result);
      setIsExporting(false);

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setIsExporting(false);
      setErrorMessage(err.message || 'An error occurred during video rendering');
      setStatusText(`Export failed. Try switching to 'Mobile Fast (720p)' preset.`);
    }
  };

  const handleDownload = () => {
    if (!exportResult) return;
    downloadVideoBlob(exportResult.url, exportResult.filename);
  };

  const handleShare = async () => {
    if (!exportResult) return;
    const shared = await shareVideoFile(
      exportResult.blob,
      exportResult.filename,
      'Forex Live Animation Video',
      'Check out this educational candlestick pattern simulation!'
    );
    if (shared) {
      setShareSuccess('Shared successfully!');
    } else {
      handleDownload();
      setShareSuccess('Saved video to files / downloads!');
    }
    setTimeout(() => setShareSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="export-modal-dialog"
        className="relative w-full max-w-lg bg-[#16181D] border border-[#2D3139] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#2D3139] bg-[#0A0B0D]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Film className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Export {settings.durationSeconds}s Video
              </h2>
              <p className="text-[11px] text-slate-400">Shareable MP4 video for TikTok, Reels & Socials</p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-xl hover:bg-[#2D3139] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-100">
          {!exportResult ? (
            <>
              {/* Aspect Ratio Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  1. Select Video Aspect Ratio
                </label>
                <div className={`grid ${backgroundImage ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2`}>
                  {[
                    ...(backgroundImage
                      ? [
                          {
                            id: 'original' as AspectRatioType,
                            title: 'Original',
                            sub: 'Exact Screen',
                            icon: <Film className="w-4 h-4" />,
                            recommended: true,
                          },
                        ]
                      : []),
                    {
                      id: '16:9' as AspectRatioType,
                      title: '16:9 Wide',
                      sub: 'YouTube / Web',
                      icon: <Monitor className="w-4 h-4" />,
                      recommended: !backgroundImage,
                    },
                    {
                      id: '9:16' as AspectRatioType,
                      title: '9:16 Vertical',
                      sub: 'TikTok / Reels',
                      icon: <Smartphone className="w-4 h-4" />,
                    },
                    {
                      id: '1:1' as AspectRatioType,
                      title: '1:1 Square',
                      sub: 'Instagram',
                      icon: <Square className="w-4 h-4" />,
                    },
                  ].map((preset) => {
                    const isSelected = settings.aspectRatio === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, aspectRatio: preset.id })}
                        className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                            : 'bg-[#1F2229] border-[#2D3139] text-slate-400 hover:text-slate-200 hover:bg-[#2D3139]'
                        }`}
                      >
                        {preset.recommended && (
                          <span className="absolute -top-2 px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 text-[8px] font-extrabold uppercase">
                            Match
                          </span>
                        )}
                        <div className="mb-0.5">{preset.icon}</div>
                        <span className="text-xs font-bold text-slate-200">{preset.title}</span>
                        <span className="text-[9px] text-slate-400">{preset.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quality & Device Stability Preset */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    2. Quality & Device Optimization
                  </label>
                  {isMobile && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Mobile Optimized
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* Option 1: Mobile Fast */}
                  <button
                    type="button"
                    onClick={() => setQualityPreset('mobile')}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      qualityPreset === 'mobile'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                        : 'bg-[#1A1D24] border-[#2D3139] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" /> Fast (720p)
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                        Safe
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Lightweight 30fps. 100% stable on phones (no tab crashes).
                    </span>
                  </button>

                  {/* Option 2: Full HD 1080p */}
                  <button
                    type="button"
                    onClick={() => setQualityPreset('hd')}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      qualityPreset === 'hd'
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : 'bg-[#1A1D24] border-[#2D3139] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center gap-1">
                        <Film className="w-3.5 h-3.5 text-cyan-400" /> Full HD (1080p)
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono">
                        Sharp
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Standard crisp 1080p 30fps for social uploads.
                    </span>
                  </button>

                  {/* Option 3: Ultra HD 60fps */}
                  <button
                    type="button"
                    onClick={() => setQualityPreset('ultra')}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      qualityPreset === 'ultra'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10'
                        : 'bg-[#1A1D24] border-[#2D3139] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" /> 60 FPS Ultra
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-400 font-mono">
                        Desktop
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Ultra smooth. Recommended for PC / laptops.
                    </span>
                  </button>
                </div>
              </div>

              {/* Video Config Summary Card */}
              <div className="p-3 rounded-2xl bg-[#0A0B0D] border border-[#2D3139] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Duration:
                  </span>
                  <span className="font-bold text-cyan-300">{settings.durationSeconds} Seconds</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Music className="w-3.5 h-3.5 text-emerald-400" />
                    Audio Track:
                  </span>
                  <span className="font-bold text-slate-200 truncate max-w-[180px]">
                    {audioTrack && !audioTrack.isMuted ? audioTrack.name : 'None (Muted)'}
                  </span>
                </div>
              </div>

              {/* Progress bar when rendering */}
              {isExporting && (
                <div className="p-3.5 rounded-2xl bg-[#0A0B0D] border border-cyan-500/40 space-y-2 animate-in fade-in">
                  <div className="flex justify-between text-xs font-mono text-slate-300">
                    <span className="truncate pr-2">{statusText}</span>
                    <span className="font-bold text-cyan-400 shrink-0">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#2D3139] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-150 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    Please keep this tab open while the video finishes rendering.
                  </p>
                </div>
              )}

              {/* Error Message Display if failed */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Render Error</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Result Ready Screen */
            <div className="space-y-3.5 text-center">
              <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Video Ready!</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {settings.durationSeconds}s video rendered at {(exportResult.sizeBytes / 1024 / 1024).toFixed(2)} MB.
                </p>
              </div>

              {/* Video Preview */}
              <div className="max-h-[220px] flex items-center justify-center bg-[#0A0B0D] rounded-2xl overflow-hidden border border-[#2D3139] p-2">
                <video
                  src={exportResult.url}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-h-[200px] rounded-xl shadow-2xl object-contain"
                />
              </div>

              {shareSuccess && (
                <p className="text-xs text-cyan-400 font-semibold animate-pulse">{shareSuccess}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-[#2D3139] bg-[#0A0B0D]/80">
          {!exportResult ? (
            <>
              <button
                id="cancel-export-btn"
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                id="start-export-btn"
                type="button"
                onClick={handleStartExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
              >
                <Video className="w-4 h-4" />
                <span>{isExporting ? 'Encoding Video...' : `Render ${settings.durationSeconds}s Video`}</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="re-render-export-btn"
                type="button"
                onClick={() => setExportResult(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Re-Render
              </button>
              <div className="flex items-center gap-2">
                <button
                  id="share-video-btn"
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#1F2229] hover:bg-[#2D3139] border border-[#2D3139] text-slate-200 font-bold text-xs transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Share / Save</span>
                </button>
                <button
                  id="download-video-btn"
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

