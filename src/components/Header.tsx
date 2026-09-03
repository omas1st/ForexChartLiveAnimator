import React, { useRef, useState } from 'react';
import { 
  CandlestickChart, 
  Upload, 
  Download,
  Palette,
  X,
  Sparkles
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onUploadImage: (file: File) => void;
  onOpenExportModal: () => void;
  bullishColor: string;
  bearishColor: string;
  onChangeBullishColor: (color: string) => void;
  onChangeBearishColor: (color: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onUploadImage,
  onOpenExportModal,
  bullishColor,
  bearishColor,
  onChangeBullishColor,
  onChangeBearishColor,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  return (
    <header 
      id="main-app-header" 
      className="h-13 sm:h-14 px-3 sm:px-4 bg-[#12141A]/95 backdrop-blur-xl border-b border-[#232731] flex items-center justify-between z-30 shrink-0 select-none"
    >
      {/* Left: App Brand */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.35)] shrink-0">
          <CandlestickChart className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-white leading-none">Forex Animator</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">PRO</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">10s Candlestick Video Generator</span>
        </div>
      </div>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Colors Palette Button & Popover */}
        <div className="relative">
          <button
            id="color-picker-toggle-btn"
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Adjust Bullish & Bearish Candle Colors"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#252933] border border-[#2D3139] text-slate-300 text-xs font-medium transition-colors"
          >
            <div className="flex items-center -space-x-1">
              <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: bullishColor }} />
              <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: bearishColor }} />
            </div>
            <span className="hidden md:inline text-[11px] text-slate-300">Theme</span>
          </button>

          {showColorPicker && (
            <div className="absolute right-0 top-full mt-2 w-56 p-3 rounded-2xl bg-[#16181D] border border-[#2D3139] shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  Candle Colors
                </span>
                <button 
                  onClick={() => setShowColorPicker(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bullish Color */}
              <div className="flex items-center justify-between bg-[#1A1D24] p-2 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300 font-medium">Bullish (Up):</span>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md border border-white/20" style={{ backgroundColor: bullishColor }} />
                  <input
                    type="color"
                    value={bullishColor}
                    onChange={(e) => onChangeBullishColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>

              {/* Bearish Color */}
              <div className="flex items-center justify-between bg-[#1A1D24] p-2 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300 font-medium">Bearish (Down):</span>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md border border-white/20" style={{ backgroundColor: bearishColor }} />
                  <input
                    type="color"
                    value={bearishColor}
                    onChange={(e) => onChangeBearishColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onChangeBullishColor('#089981');
                    onChangeBearishColor('#f23645');
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#222630] hover:bg-[#2D3139] text-slate-300 transition-colors"
                >
                  TradingView Classic
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeBullishColor('#10b981');
                    onChangeBearishColor('#e11d48');
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#222630] hover:bg-[#2D3139] text-slate-300 transition-colors"
                >
                  Neon Glow
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Install App PWA Button */}
        <PWAInstallButton />

        {/* Upload Screenshot Button */}
        <button
          id="upload-chart-btn"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Upload Chart Screenshot"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#252933] active:scale-95 border border-[#2D3139] text-slate-100 font-semibold text-xs transition-all shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xs:inline sm:inline text-[11px] sm:text-xs">Upload</span>
        </button>

        {/* Export Video Button */}
        <button
          id="open-export-modal-btn"
          type="button"
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export MP4</span>
        </button>
      </div>
    </header>
  );
};

