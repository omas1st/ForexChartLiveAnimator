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
    return null;
  }

  return (
    <div
      id="floating-text-toolbar"
      className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-2xl p-2.5 sm:p-3.5 rounded-2xl bg-[#12141A]/95 backdrop-blur-xl border border-cyan-500/40 shadow-2xl text-slate-100 flex flex-col gap-2 z-30 transition-all animate-in fade-in slide-in-from-bottom-2"
    >
      {/* Top Row: Live Text Input + Action Buttons */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-[#1A1D24] px-2.5 py-1.5 rounded-xl border border-slate-700 focus-within:border-cyan-400 transition-colors">
          <Type className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <input
            id="text-content-input"
            type="text"
            value={selectedText.text}
            onChange={(e) => onUpdateSelectedText({ text: e.target.value })}
            placeholder="Type note (e.g. TP: 1.0920)..."
            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-white outline-none placeholder:text-slate-500 truncate"
          />
        </div>

        {/* Action Buttons: Add Another, Duplicate, Delete, Layer Manager, Close */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            id="duplicate-text-btn"
            onClick={onDuplicateSelectedText}
            title="Duplicate selected text"
            className="p-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#262A35] text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            id="delete-text-btn"
            onClick={onDeleteSelectedText}
            title="Delete selected text"
            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            id="text-layers-manager-btn"
            onClick={onOpenLayersModal}
            title="View all text layers"
            className="p-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#262A35] text-cyan-400 border border-slate-700"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            id="close-text-toolbar-btn"
            onClick={onClose}
            title="Done / Deselect text"
            className="p-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#262A35] text-slate-400 hover:text-slate-200 border border-slate-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Typography, Size, Color Palette, Badge Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5 border-t border-slate-800/80 text-[11px]">
        
        {/* 1. Font Family Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-slate-400">Font</label>
          <select
            id="text-font-family-select"
            value={selectedText.fontFamily || 'Plus Jakarta Sans, sans-serif'}
            onChange={(e) => onUpdateSelectedText({ fontFamily: e.target.value })}
            className="w-full bg-[#1A1D24] text-slate-200 border border-slate-700 rounded-lg px-2 py-1 outline-none font-medium focus:border-cyan-400 text-[11px]"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Font Size & Weight */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
            <span>Size: {selectedText.fontSize || 18}px</span>
            <button
              type="button"
              onClick={() =>
                onUpdateSelectedText({
                  fontWeight: selectedText.fontWeight === '900' ? 'bold' : selectedText.fontWeight === 'bold' ? 'normal' : '900',
                })
              }
              className="px-1 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-cyan-300 border border-slate-700"
            >
              {selectedText.fontWeight === '900' ? 'Black' : selectedText.fontWeight === 'bold' ? 'Bold' : 'Regular'}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdateSelectedText({ fontSize: Math.max(10, (selectedText.fontSize || 18) - 2) })}
              className="p-1 rounded bg-[#1A1D24] hover:bg-[#262A35] border border-slate-700 text-slate-300"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <input
              id="text-font-size-slider"
              type="range"
              min="12"
              max="48"
              step="1"
              value={selectedText.fontSize || 18}
              onChange={(e) => onUpdateSelectedText({ fontSize: parseInt(e.target.value, 10) })}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <button
              onClick={() => onUpdateSelectedText({ fontSize: Math.min(64, (selectedText.fontSize || 18) + 2) })}
              className="p-1 rounded bg-[#1A1D24] hover:bg-[#262A35] border border-slate-700 text-slate-300"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* 3. Text Color Palette */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-slate-400 flex items-center justify-between">
            <span>Color</span>
            <input
              type="color"
              value={selectedText.color || '#ffffff'}
              onChange={(e) => onUpdateSelectedText({ color: e.target.value })}
              className="w-3.5 h-3.5 rounded cursor-pointer border-0 bg-transparent"
              title="Custom color"
            />
          </label>

          <div className="flex items-center gap-1 flex-wrap">
            {COLOR_PALETTE.slice(0, 6).map((c) => {
              const isSelected = selectedText.color?.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  onClick={() => onUpdateSelectedText({ color: c })}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    isSelected ? 'ring-2 ring-cyan-400 scale-110 border-white' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              );
            })}
          </div>
        </div>

        {/* 4. Background Pill & Border Presets */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-slate-400">Badge</label>
          <div className="grid grid-cols-3 gap-1">
            {BG_PRESETS.slice(0, 3).map((preset) => {
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
                  className={`px-1 py-0.5 rounded text-[9px] font-medium border text-center transition-all truncate ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-[#1A1D24] text-slate-400 hover:text-slate-200 border-slate-700'
                  }`}
                >
                  {preset.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
