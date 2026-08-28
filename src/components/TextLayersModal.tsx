import React from 'react';
import { UserText } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Copy, 
  Type, 
  Layers, 
  Edit3,
  Check
} from 'lucide-react';

interface TextLayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userTexts: UserText[];
  selectedTextId: string | null;
  onSelectTextId: (id: string | null) => void;
  onAddUserText: (text: UserText) => void;
  onUpdateUserText: (id: string, updated: Partial<UserText>) => void;
  onDeleteUserText: (id: string) => void;
}

const TRADING_TEXT_PRESETS = [
  { text: 'Take Profit (TP)', color: '#10b981', bg: 'rgba(6, 78, 59, 0.9)', font: 'Montserrat, sans-serif' },
  { text: 'Stop Loss (SL)', color: '#f43f5e', bg: 'rgba(76, 5, 25, 0.9)', font: 'Montserrat, sans-serif' },
  { text: 'Entry Point', color: '#38bdf8', bg: 'rgba(8, 47, 73, 0.9)', font: 'Plus Jakarta Sans, sans-serif' },
  { text: 'Break of Structure (BOS)', color: '#f59e0b', bg: 'rgba(69, 26, 3, 0.9)', font: 'JetBrains Mono, monospace' },
  { text: 'Order Block (OB)', color: '#a855f7', bg: 'rgba(59, 7, 100, 0.9)', font: 'Orbitron, sans-serif' },
  { text: 'Fair Value Gap (FVG)', color: '#fb923c', bg: 'rgba(67, 20, 7, 0.9)', font: 'JetBrains Mono, monospace' },
  { text: 'Liquidity Sweep 💧', color: '#38bdf8', bg: 'rgba(15, 23, 42, 0.9)', font: 'Caveat, cursive' },
];

export const TextLayersModal: React.FC<TextLayersModalProps> = ({
  isOpen,
  onClose,
  userTexts,
  selectedTextId,
  onSelectTextId,
  onAddUserText,
  onUpdateUserText,
  onDeleteUserText,
}) => {
  if (!isOpen) return null;

  const handleAddPreset = (preset: typeof TRADING_TEXT_PRESETS[0]) => {
    const newText: UserText = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      x: 0.25 + (userTexts.length % 5) * 0.08,
      y: 0.25 + (userTexts.length % 5) * 0.08,
      text: preset.text,
      fontSize: 18,
      fontFamily: preset.font,
      color: preset.color,
      fontWeight: 'bold',
      backgroundColor: preset.bg,
      hasBorder: true,
      borderColor: preset.color,
    };
    onAddUserText(newText);
    onSelectTextId(newText.id);
  };

  const handleCreateCustom = () => {
    const newText: UserText = {
      id: `text-${Date.now()}`,
      x: 0.4,
      y: 0.35,
      text: `Note ${userTexts.length + 1}`,
      fontSize: 18,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      color: '#ffffff',
      fontWeight: 'bold',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      hasBorder: false,
    };
    onAddUserText(newText);
    onSelectTextId(newText.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        id="text-layers-modal"
        className="w-full max-w-lg bg-[#12141A] rounded-3xl border border-[#2D3139] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222630] bg-[#16181D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Chart Text Annotations</h2>
              <p className="text-xs text-slate-400">Add, edit, style, and reorder text labels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#222630] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Trading Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
              1-Click Forex Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {TRADING_TEXT_PRESETS.map((preset) => (
                <button
                  key={preset.text}
                  onClick={() => handleAddPreset(preset)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-transform active:scale-95 hover:brightness-110"
                  style={{
                    backgroundColor: preset.bg,
                    borderColor: preset.color,
                    color: preset.color,
                  }}
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>{preset.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Layers List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Text Layers ({userTexts.length})
              </label>
              <button
                onClick={handleCreateCustom}
                className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Blank Text</span>
              </button>
            </div>

            {userTexts.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-[#16181D] border border-dashed border-[#2D3139]">
                <Type className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No text labels on chart yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click any preset above or click anywhere on chart in Text mode
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {userTexts.map((textItem, idx) => {
                  const isSelected = selectedTextId === textItem.id;
                  return (
                    <div
                      key={textItem.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg'
                          : 'bg-[#16181D] border-[#222630] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: textItem.color || '#ffffff' }}
                        />
                        <input
                          type="text"
                          value={textItem.text}
                          onChange={(e) => onUpdateUserText(textItem.id, { text: e.target.value })}
                          className="bg-transparent text-sm font-semibold text-white outline-none border-b border-transparent focus:border-cyan-400 w-full truncate"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => {
                            onSelectTextId(textItem.id);
                            onClose();
                          }}
                          title="Select & Edit on Canvas"
                          className="p-1.5 rounded-lg bg-[#222630] hover:bg-[#2D3139] text-cyan-400 text-xs font-semibold px-2 flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            const duplicate: UserText = {
                              ...textItem,
                              id: `text-${Date.now()}`,
                              x: Math.min(0.85, textItem.x + 0.05),
                              y: Math.min(0.85, textItem.y + 0.05),
                            };
                            onAddUserText(duplicate);
                          }}
                          title="Duplicate"
                          className="p-1.5 rounded-lg bg-[#222630] hover:bg-[#2D3139] text-slate-300 hover:text-white"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteUserText(textItem.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#222630] bg-[#16181D]">
          <span className="text-xs text-slate-400">
            Tip: Drag text freely anywhere on the chart
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-transform active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
