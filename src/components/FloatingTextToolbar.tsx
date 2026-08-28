import React from 'react';
import { UserText } from '../types';
import { 
  Type, 
  Trash2, 
  Copy, 
  Palette, 
  Plus, 
  Minus, 
  Check, 
  Sparkles, 
  Layers,
  X
} from 'lucide-react';

interface FloatingTextToolbarProps {
  selectedText: UserText | null;
  allTexts: UserText[];
  onUpdateSelectedText: (updated: Partial<UserText>) => void;
  onDeleteSelectedText: () => void;
  onDuplicateSelectedText: () => void;
  onAddNewText: (presetText?: string) => void;
  onClose: () => void;
  onOpenLayersModal: () => void;
}

export const FONT_FAMILIES = [
  { label: 'Clean Modern', value: 'Plus Jakarta Sans, sans-serif' },
  { label: 'Bold Display', value: 'Montserrat, sans-serif' },
  { label: 'Code / Terminal', value: 'JetBrains Mono, monospace' },
  { label: 'Cyber / Neon', value: 'Orbitron, sans-serif' },
  { label: 'Classic Serif', value: 'Playfair Display, serif' },
  { label: 'Handwritten', value: 'Caveat, cursive' },
  { label: 'Heavy Impact', value: 'Impact, sans-serif' },
];

export const COLOR_PALETTE = [
  '#ffffff', // White
  '#38bdf8', // Sky Cyan
  '#10b981', // Mint Emerald
  '#f59e0b', // Gold Amber
  '#f43f5e', // Crimson Rose
  '#a855f7', // Purple
  '#fb923c', // Neon Orange
  '#94a3b8', // Slate Gray
  '#000000', // Black
];

export const BG_PRESETS = [
  { label: 'Dark Badge', bg: 'rgba(15, 23, 42, 0.88)', border: '#334155', hasBorder: false },
  { label: 'Cyan Glow', bg: 'rgba(8, 47, 73, 0.90)', border: '#06b6d4', hasBorder: true },
  { label: 'Emerald Badge', bg: 'rgba(6, 78, 59, 0.90)', border: '#10b981', hasBorder: true },
  { label: 'Rose Stop', bg: 'rgba(76, 5, 25, 0.90)', border: '#f43f5e', hasBorder: true },
  { label: 'Amber Level', bg: 'rgba(69, 26, 3, 0.90)', border: '#f59e0b', hasBorder: true },
  { label: 'Transparent', bg: 'transparent', border: 'transparent', hasBorder: false },
];

export const FloatingTextToolbar: React.FC<FloatingTextToolbarProps> = ({
  selectedText,
  allTexts,
  onUpdateSelectedText,
  onDeleteSelectedText,
  onDuplicateSelectedText,
  onAddNewText,
  onClose,
  onOpenLayersModal,
}) => {
  if (!selectedText) {
    return (
      <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-[#16181D]/95 backdrop-blur-xl border border-[#2D3139] shadow-2xl">
        <button
          id="add-first-text-btn"
          onClick={() => onAddNewText('Analysis Point')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-transform active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add Text Note</span>
        </button>

        {allTexts.length > 0 && (
          <button
            onClick={onOpenLayersModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#222630] hover:bg-[#2D3139] text-slate-300 text-xs font-medium border border-[#3E4451]"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manage ({allTexts.length})</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id="floating-text-toolbar"
      className="w-full max-w-4xl p-3 sm:p-4 rounded-2xl bg-[#12141A]/95 backdrop-blur-xl border border-cyan-500/30 shadow-2xl text-slate-100 flex flex-col gap-3 transition-all animate-in fade-in zoom-in-95"
    >
      {/* Top Row: Live Text Input + Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-[#1A1D24] px-3 py-1.5 rounded-xl border border-slate-700 focus-within:border-cyan-400 transition-colors">
          <Type className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            id="text-content-input"
            type="text"
            value={selectedText.text}
            onChange={(e) => onUpdateSelectedText({ text: e.target.value })}
            placeholder="Type note (e.g. TP: 1.0920)..."
            className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Action Buttons: Add Another, Duplicate, Delete, Layer Manager, Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="add-more-text-btn"
            onClick={() => onAddNewText('Key Level')}
            title="Add another text annotation"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Text</span>
          </button>

          <button
            id="duplicate-text-btn"
            onClick={onDuplicateSelectedText}
            title="Duplicate selected text"
            className="p-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#262A35] text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            id="delete-text-btn"
            onClick={onDeleteSelectedText}
            title="Delete selected text"
            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            id="text-layers-manager-btn"
            onClick={onOpenLayersModal}
            title="View all text layers"
            className="p-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#262A35] text-cyan-400 border border-slate-700"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            id="close-text-toolbar-btn"
            onClick={onClose}
            title="Deselect text"
            className="p-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#262A35] text-slate-400 hover:text-slate-200 border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Typography, Size, Color Palette, Badge Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
        
        {/* 1. Font Family Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-slate-400">Font Style</label>
          <select
            id="text-font-family-select"
            value={selectedText.fontFamily || 'Plus Jakarta Sans, sans-serif'}
            onChange={(e) => onUpdateSelectedText({ fontFamily: e.target.value })}
            className="w-full bg-[#1A1D24] text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 outline-none font-medium focus:border-cyan-400"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Font Size & Weight */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Size: {selectedText.fontSize || 18}px</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  onUpdateSelectedText({
                    fontWeight: selectedText.fontWeight === '900' ? 'bold' : selectedText.fontWeight === 'bold' ? 'normal' : '900',
                  })
                }
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  selectedText.fontWeight === '900'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : selectedText.fontWeight === 'bold'
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {selectedText.fontWeight === '900' ? 'Black' : selectedText.fontWeight === 'bold' ? 'Bold' : 'Regular'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateSelectedText({ fontSize: Math.max(10, (selectedText.fontSize || 18) - 2) })}
              className="p-1.5 rounded-lg bg-[#1A1D24] hover:bg-[#262A35] border border-slate-700 text-slate-300"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              id="text-font-size-slider"
              type="range"
              min="12"
              max="54"
              step="1"
              value={selectedText.fontSize || 18}
              onChange={(e) => onUpdateSelectedText({ fontSize: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <button
              onClick={() => onUpdateSelectedText({ fontSize: Math.min(64, (selectedText.fontSize || 18) + 2) })}
              className="p-1.5 rounded-lg bg-[#1A1D24] hover:bg-[#262A35] border border-slate-700 text-slate-300"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3. Text Color Palette */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Color</span>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={selectedText.color || '#ffffff'}
                onChange={(e) => onUpdateSelectedText({ color: e.target.value })}
                className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                title="Custom color"
              />
              <span className="text-[10px] text-slate-500">{selectedText.color || '#ffffff'}</span>
            </div>
          </label>

          <div className="flex items-center gap-1.5 flex-wrap">
            {COLOR_PALETTE.map((c) => {
              const isSelected = selectedText.color?.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  onClick={() => onUpdateSelectedText({ color: c })}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    isSelected ? 'ring-2 ring-cyan-400 scale-110 border-white' : 'border-slate-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              );
            })}
          </div>
        </div>

        {/* 4. Background Pill & Border Presets */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-slate-400">Badge Style</label>
          <div className="grid grid-cols-3 gap-1">
            {BG_PRESETS.map((preset) => {
              const isActive = selectedText.backgroundColor === preset.bg;
              return (
                <button
                  key={preset.label}
                  onClick={() =>
                    onUpdateSelectedText({
                      backgroundColor: preset.bg,
                      borderColor: preset.border,
                      hasBorder: preset.hasBorder,
                    })
                  }
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-medium border text-center transition-all truncate ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-[#1A1D24] text-slate-400 hover:text-slate-200 border-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
