import React from 'react';
import { 
  Waypoints,
  PenTool, 
  Type, 
  Trash2, 
  RotateCcw, 
  Sliders, 
  Plus, 
  Minus,
  MoveHorizontal
} from 'lucide-react';
import { DrawingToolType, CandleSizing, UserText } from '../types';

interface DrawingToolbarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  onResetPath: () => void;
  onDeleteSelectedText: () => void;
  selectedTextId: string | null;
  candleSizing: CandleSizing;
  onUpdateCandleSizing: (sizing: Partial<CandleSizing>) => void;
  userTexts: UserText[];
  onAddTextDirectly: () => void;
  onClearAll: () => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  onResetPath,
  onDeleteSelectedText,
  selectedTextId,
  candleSizing,
  onUpdateCandleSizing,
  onAddTextDirectly,
  onClearAll,
}) => {
  return (
    <div
      id="drawing-toolbar"
      className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-[#16181D] border border-[#2D3139] rounded-2xl text-xs text-slate-300 shadow-md"
    >
      {/* Left: Interactive Tools (Path Tool first & primary) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 hidden sm:inline">
          Tools:
        </span>

        {/* Path Tool (Point-to-Point Waypoints & Double-tap finish) */}
        <button
          id="tool-btn-path"
          type="button"
          onClick={() => onSelectTool('path')}
          title="Path Tool: Tap to place straight directional segments, double-tap to finish"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all ${
            activeTool === 'path'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-[#1F2229] hover:bg-[#2D3139] text-slate-300 hover:text-white border border-[#2D3139]'
          }`}
        >
          <Waypoints className="w-4 h-4 text-cyan-400" />
          <span className="text-xs">Path Tool</span>
        </button>

        {/* Freehand Pen */}
        <button
          id="tool-btn-pen"
          type="button"
          onClick={() => onSelectTool('pen')}
          title="Freehand Pen: Draw freely on chart"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all ${
            activeTool === 'pen'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'bg-[#1F2229] hover:bg-[#2D3139] text-slate-300 hover:text-white border border-[#2D3139]'
          }`}
        >
          <PenTool className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs">Freehand Pen</span>
        </button>

        {/* Text Annotation Tool */}
        <button
          id="tool-btn-text"
          type="button"
          onClick={onAddTextDirectly}
          title="Add Text annotation onto video"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all ${
            activeTool === 'text'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              : 'bg-[#1F2229] hover:bg-[#2D3139] text-slate-300 hover:text-white border border-[#2D3139]'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-xs">+ Add Text</span>
        </button>

        {/* Delete Selected Text Button */}
        {selectedTextId && (
          <button
            id="delete-selected-text-btn"
            type="button"
            onClick={onDeleteSelectedText}
            title="Delete selected text element"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-semibold text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Text</span>
          </button>
        )}
      </div>

      {/* Right: Candlestick Closeness/Spacing & Geometry Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
        {/* Candle Spacing / Closeness Control */}
        <div
          id="candle-spacing-control"
          className="flex items-center gap-1.5 bg-[#1F2229] border border-[#2D3139] px-2.5 py-1.5 rounded-xl shadow-sm"
          title="Adjust distance between all candles: closer (tighter) vs farther (wider)"
        >
          <MoveHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
            Spacing:
          </span>
          <button
            id="spacing-decrease-closer-btn"
            type="button"
            onClick={() =>
              onUpdateCandleSizing({
                spacingScale: Math.max(
                  0.3,
                  +((candleSizing.spacingScale || 1.0) - 0.1).toFixed(1)
                ),
              })
            }
            className="p-1 rounded hover:bg-[#2D3139] text-slate-300 hover:text-emerald-300 font-bold transition-colors"
            title="Bring candles closer to each other (tighter spacing)"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono text-xs font-bold text-emerald-300 min-w-[34px] text-center">
            {((candleSizing.spacingScale || 1.0) * 100).toFixed(0)}%
          </span>
          <button
            id="spacing-increase-farther-btn"
            type="button"
            onClick={() =>
              onUpdateCandleSizing({
                spacingScale: Math.min(
                  2.5,
                  +((candleSizing.spacingScale || 1.0) + 0.1).toFixed(1)
                ),
              })
            }
            className="p-1 rounded hover:bg-[#2D3139] text-slate-300 hover:text-emerald-300 font-bold transition-colors"
            title="Space candles farther apart from each other (wider spacing)"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Candlestick Width Adjuster */}
        <div
          id="candle-width-control"
          className="flex items-center gap-1.5 bg-[#1F2229] border border-[#2D3139] px-2.5 py-1.5 rounded-xl shadow-sm"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
            Width:
          </span>
          <button
            id="width-decrease-btn"
            type="button"
            onClick={() =>
              onUpdateCandleSizing({
                widthScale: Math.max(
                  0.2,
                  +(candleSizing.widthScale - 0.1).toFixed(1)
                ),
              })
            }
            className="p-1 rounded hover:bg-[#2D3139] text-slate-300 hover:text-amber-300 font-bold transition-colors"
            title="Narrower candle bodies"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono text-xs font-bold text-amber-300 min-w-[32px] text-center">
            {(candleSizing.widthScale * 100).toFixed(0)}%
          </span>
          <button
            id="width-increase-btn"
            type="button"
            onClick={() =>
              onUpdateCandleSizing({
                widthScale: Math.min(
                  3.0,
                  +(candleSizing.widthScale + 0.1).toFixed(1)
                ),
              })
            }
            className="p-1 rounded hover:bg-[#2D3139] text-slate-300 hover:text-amber-300 font-bold transition-colors"
            title="Wider candle bodies"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Candlestick Height Adjuster */}
        <div
          id="candle-height-control"
          className="flex items-center gap-1.5 bg-[#1F2229] border border-[#2D3139] px-2.5 py-1.5 rounded-xl shadow-sm"
        >
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
            Height:
          </span>
          <button
            id="height-decrease-btn"
            type="button"
            onClick={() =>
              onUpdateCandleSizing({
                heightScale: Math.max(
                  0.2,
                  +(candleSizing.heightScale - 0.1).toFixed(1)
                ),
              })
            }
            className="p-1 rounded hover:bg-[#2D3139] text-slate-300 hover:text-cyan-300 font-bold transition-colors"
            title="Shorter candle bodies"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono text-xs font-bold text-cyan-300 min-w-[32px] text-center">
            {(candleSizing.heightScale * 100).toFixed(0)}%
          </span>
          <button
            id="height-increase-btn"
            type="button"
            onClick={() =>
              onUpdateCandleSizing({
                heightScale: Math.min(
                  3.0,
                  +(candleSizing.heightScale + 0.1).toFixed(1)
                ),
              })
            }
            className="p-1 rounded hover:bg-[#2D3139] text-slate-300 hover:text-cyan-300 font-bold transition-colors"
            title="Taller candle bodies"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Base Candle Count */}
        <div
          id="candle-count-control"
          className="flex items-center gap-1.5 bg-[#1F2229] border border-[#2D3139] px-2.5 py-1.5 rounded-xl shadow-sm"
        >
          <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
            Candles:
          </span>
          <button
            id="count-decrease-btn"
            type="button"
            onClick={() =>
              onUpdateCandleSizing({
                candleCount: Math.max(6, candleSizing.candleCount - 2),
              })
            }
            className="p-1 rounded hover:bg-[#2D3139] text-slate-300 hover:text-white font-bold transition-colors"
            title="Fewer candles"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono text-xs font-bold text-white min-w-[20px] text-center">
            {candleSizing.candleCount}
          </span>
          <button
            id="count-increase-btn"
            type="button"
            onClick={() =>
              onUpdateCandleSizing({
                candleCount: Math.min(50, candleSizing.candleCount + 2),
              })
            }
            className="p-1 rounded hover:bg-[#2D3139] text-slate-300 hover:text-white font-bold transition-colors"
            title="More candles"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Reset / Clear */}
        <button
          id="clear-all-drawings-btn"
          type="button"
          onClick={onClearAll}
          title="Clear path and drawings"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
