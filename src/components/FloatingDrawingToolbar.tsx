import React from 'react';
import { 
  Flame, 
  Trash2, 
  X, 
  Square, 
  Minus, 
  ArrowUpRight, 
  ArrowDownRight, 
  PenTool,
  Sparkles,
  Check
} from 'lucide-react';
import { UserDrawing } from '../types';

interface FloatingDrawingToolbarProps {
  selectedDrawing: UserDrawing;
  onConvert: (drawing: UserDrawing) => void;
  onUpdateColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const COLOR_PALETTE = [
  { name: 'Cyan Glow', hex: '#38bdf8' },
  { name: 'Bullish Green', hex: '#10b981' },
  { name: 'Bearish Red', hex: '#f43f5e' },
  { name: 'Amber Gold', hex: '#fbbf24' },
  { name: 'Purple Neon', hex: '#a855f7' },
  { name: 'Clean White', hex: '#f8fafc' },
];

export const FloatingDrawingToolbar: React.FC<FloatingDrawingToolbarProps> = ({
  selectedDrawing,
  onConvert,
  onUpdateColor,
  onDelete,
  onClose,
}) => {
  const getShapeIconAndLabel = () => {
    switch (selectedDrawing.type) {
      case 'rectangle':
      case 'box':
        return { icon: <Square className="w-3.5 h-3.5 text-cyan-400" />, label: 'Zone / Box' };
      case 'line':
        return { icon: <Minus className="w-3.5 h-3.5 text-cyan-400" />, label: 'Straight Line' };
      case 'arrow-up':
        return { icon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />, label: 'Up Arrow' };
      case 'arrow-down':
        return { icon: <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />, label: 'Down Arrow' };
      case 'freehand':
      case 'pen':
      default:
        return { icon: <PenTool className="w-3.5 h-3.5 text-purple-400" />, label: 'Freehand' };
    }
  };

  const { icon, label } = getShapeIconAndLabel();

  return (
    <div 
      id="floating-drawing-toolbar"
      className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-[96%] sm:max-w-xl w-auto bg-[#12151D]/95 backdrop-blur-2xl border border-cyan-500/50 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 text-slate-200 animate-in fade-in slide-in-from-top-3 select-none"
    >
      {/* Shape Type Badge & Move indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1B1E28] border border-slate-700/60 text-xs font-semibold text-slate-200">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-[11px] text-cyan-300 font-medium hidden sm:inline-flex items-center gap-1 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/40">
          ✥ Drag to move
        </span>
      </div>

      {/* Primary Action: Convert to Candlestick Pattern */}
      <button
        id="convert-drawing-to-candles-btn"
        type="button"
        onClick={() => onConvert(selectedDrawing)}
        title="Transform this technical drawing into animated candlesticks"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-[13px] shadow-[0_0_20px_rgba(6,182,212,0.45)] transition-all cursor-pointer shrink-0"
      >
        <Sparkles className="w-4 h-4 fill-slate-950" />
        <span>Make Candle Pattern</span>
      </button>

      {/* Quick Color Pickers */}
      <div className="flex items-center gap-1 shrink-0">
        {COLOR_PALETTE.map((c) => {
          const isActive = selectedDrawing.color.toLowerCase() === c.hex.toLowerCase();
          return (
            <button
              key={c.hex}
              type="button"
              onClick={() => onUpdateColor(selectedDrawing.id, c.hex)}
              title={c.name}
              className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-[#12151D] scale-105' : 'opacity-85'
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {isActive && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
            </button>
          );
        })}
      </div>

      {/* Delete and Close buttons */}
      <div className="flex items-center gap-1 border-l border-slate-800 pl-2 shrink-0">
        <button
          type="button"
          onClick={() => onDelete(selectedDrawing.id)}
          title="Delete drawing"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Close selection"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
