import React, { useRef } from 'react';
import { 
  CandlestickChart, 
  Upload, 
  Download,
  Palette
} from 'lucide-react';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  return (
    <header id="main-app-header" className="flex flex-wrap justify-between items-center bg-[#16181D] px-5 sm:px-6 py-3.5 rounded-2xl border border-[#2D3139] shadow-lg shadow-black/40 gap-3">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.35)] shrink-0">
          <CandlestickChart className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">Forex Chart 10s Animator</h1>
          <p className="text-xs text-slate-400">Click path waypoints on chart & animate uniform non-overlapping candlesticks in 10s</p>
        </div>
      </div>

      {/* Action Deck */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 ml-auto">
        {/* Candlestick Color Pickers */}
        <div className="flex items-center gap-2 bg-[#1F2229] border border-[#2D3139] px-2.5 py-1.5 rounded-xl">
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400 font-medium">Colors:</span>
          
          <label className="flex items-center gap-1 cursor-pointer" title="Bullish (Up) Candle Color">
            <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: bullishColor }} />
            <input
              type="color"
              value={bullishColor}
              onChange={(e) => onChangeBullishColor(e.target.value)}
              className="sr-only"
            />
          </label>

          <label className="flex items-center gap-1 cursor-pointer" title="Bearish (Down) Candle Color">
            <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: bearishColor }} />
            <input
              type="color"
              value={bearishColor}
              onChange={(e) => onChangeBearishColor(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Screenshot Button */}
        <button
          id="upload-chart-btn"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D3139] hover:bg-[#3E4451] border border-[#3E4451] text-slate-100 font-semibold text-xs transition-colors shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>Upload Screenshot</span>
        </button>

        {/* Export Video Button */}
        <button
          id="open-export-modal-btn"
          type="button"
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export Video (MP4)</span>
        </button>
      </div>
    </header>
  );
};
