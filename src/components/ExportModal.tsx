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
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExportSettings, AspectRatioType, Point, Candle, CandleSizing, UserDrawing, UserText, AudioTrack } from '../types';
import { recordAnimationToVideo, RecordingResult, downloadVideoBlob, shareVideoFile } from '../utils/videoRecorder';
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
  const [settings, setSettings] = useState<ExportSettings>({
    aspectRatio: backgroundImage ? 'original' : '16:9',
    durationSeconds: videoDurationSeconds,
    fps: 60,
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
  const [exportResult, setExportResult] = useState<RecordingResult | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);
      setStatusText(`Rendering ${settings.durationSeconds}s video frames...`);
      setExportResult(null);
      setShareSuccess(null);

      const result = await recordAnimationToVideo({
        durationSeconds: settings.durationSeconds,
        fps: 60,
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
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setIsExporting(false);
      setStatusText(`Export failed: ${err.message}`);
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
      setShareSuccess('Downloaded video file!');
    }
    setTimeout(() => setShareSuccess(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="export-modal-dialog"
        className="relative w-full max-w-lg bg-[#16181D] border border-[#2D3139] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3139] bg-[#0A0B0D]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Export {settings.durationSeconds}s Live Video
              </h2>
              <p className="text-xs text-slate-400">Shareable MP4 video for social media with soundtrack</p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={onClose}
            disabled={isExporting}
            className="p-2 rounded-xl hover:bg-[#2D3139] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!exportResult ? (
            <>
              {/* Aspect Ratio Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                  Select Video Aspect Ratio
                </label>
                <div className={`grid ${backgroundImage ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2.5`}>
                  {[
                    ...(backgroundImage
                      ? [
                          {
                            id: 'original' as AspectRatioType,
                            title: 'Original',
                            sub: 'Exact 1:1 Screen',
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
                      sub: 'TikTok / Reels (Auto-Crop)',
                      icon: <Smartphone className="w-4 h-4" />,
                    },
                    {
                      id: '1:1' as AspectRatioType,
                      title: '1:1 Square',
                      sub: 'Instagram (Auto-Crop)',
                      icon: <Square className="w-4 h-4" />,
                    },
                  ].map((preset) => {
                    const isSelected = settings.aspectRatio === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, aspectRatio: preset.id })}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                            : 'bg-[#1F2229] border-[#2D3139] text-slate-400 hover:text-slate-200 hover:bg-[#2D3139]'
                        }`}
                      >
                        {preset.recommended && (
                          <span className="absolute -top-2 px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 text-[8px] font-extrabold uppercase">
                            1:1 Match
                          </span>
                        )}
                        <div className="mb-1">{preset.icon}</div>
                        <span className="text-xs font-bold text-slate-200">{preset.title}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{preset.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Video Config Summary Card */}
              <div className="p-3.5 rounded-2xl bg-[#0A0B0D] border border-[#2D3139] space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Duration:
                  </span>
                  <span className="font-bold text-cyan-300">{settings.durationSeconds} Seconds</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Music className="w-4 h-4 text-emerald-400" />
                    Audio Track:
                  </span>
                  <span className="font-bold text-slate-200 truncate max-w-[180px]">
                    {audioTrack && !audioTrack.isMuted ? audioTrack.name : 'None (Muted)'}
                  </span>
                </div>
              </div>

              {/* Progress bar when rendering */}
              {isExporting && (
                <div className="p-4 rounded-2xl bg-[#0A0B0D] border border-[#2D3139] space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-300">
                    <span>{statusText}</span>
                    <span className="font-bold text-cyan-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#2D3139] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-150 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Result Ready Screen */
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mb-1">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Video Ready!</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {settings.durationSeconds}-Second 60FPS {settings.aspectRatio} video rendered ({(exportResult.sizeBytes / 1024 / 1024).toFixed(2)} MB).
                </p>
              </div>

              {/* Video Preview */}
              <div className="max-h-[260px] flex items-center justify-center bg-[#0A0B0D] rounded-2xl overflow-hidden border border-[#2D3139] p-2">
                <video
                  src={exportResult.url}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-h-[240px] rounded-xl shadow-2xl object-contain"
                />
              </div>

              {shareSuccess && (
                <p className="text-xs text-cyan-400 font-semibold animate-pulse">{shareSuccess}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2D3139] bg-[#0A0B0D]/80">
          {!exportResult ? (
            <>
              <button
                id="cancel-export-btn"
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                id="start-export-btn"
                type="button"
                onClick={handleStartExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
              >
                <Video className="w-4 h-4" />
                <span>{isExporting ? 'Rendering Video...' : `Render ${settings.durationSeconds}s Video`}</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="re-render-export-btn"
                type="button"
                onClick={() => setExportResult(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Re-Render
              </button>
              <div className="flex items-center gap-2">
                <button
                  id="share-video-btn"
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#1F2229] hover:bg-[#2D3139] border border-[#2D3139] text-slate-200 font-bold text-xs transition-colors"
                >
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>Share</span>
                </button>
                <button
                  id="download-video-btn"
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all"
                >
                  <Download className="w-4 h-4" />
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
