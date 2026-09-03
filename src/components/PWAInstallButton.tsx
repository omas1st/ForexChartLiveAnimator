import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Download, 
  Smartphone, 
  Share, 
  PlusSquare, 
  X, 
  Laptop, 
  Check, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'modal' | 'floating';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '',
  variant = 'header' 
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  // If already running as an installed standalone PWA, don't show the prompt button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstalledNotice(true);
        setTimeout(() => setInstalledNotice(false), 4000);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {/* Install Button Trigger */}
      <button
        id="pwa-install-app-btn"
        type="button"
        onClick={handleInstallClick}
        title="Install Forex Animator App on Android, iPhone, or PC"
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border font-semibold text-xs transition-all active:scale-95 select-none ${
          isInstallable
            ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
            : 'bg-[#1A1D24] hover:bg-[#252933] border-[#2D3139] text-slate-300 hover:text-white'
        } ${className}`}
      >
        <Smartphone className={`w-3.5 h-3.5 ${isInstallable ? 'text-emerald-400' : 'text-cyan-400'}`} />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
        {isInstallable && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
        )}
      </button>

      {/* Success Banner if installed - portaled to document.body to avoid parent positioning issues */}
      {installedNotice && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-16 right-4 z-[100] flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>App installed to your device home screen!</span>
        </div>,
        document.body
      )}

      {/* Installation Modal / Guide - Portaled to document.body so it is never clipped by headers or filters */}
      {showGuide && typeof document !== 'undefined' && createPortal(
        <div 
          id="pwa-install-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
        >
          <div className="relative w-full max-w-md bg-[#16181D] border border-[#2D3139] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header - shrink-0 ensures title is always fully visible */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#2D3139] bg-[#0A0B0D]/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Install App on Your Device
                  </h3>
                  <p className="text-[11px] text-slate-400">Works 100% offline with zero store downloads</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-xl hover:bg-[#2D3139] text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - scrollable if viewport is small */}
            <div className="flex-1 min-h-0 p-5 space-y-4 overflow-y-auto text-xs text-slate-300">
              {/* Feature Highlights */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-[#0A0B0D] border border-slate-800 flex flex-col items-center gap-1">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-[11px] text-white">Full Screen</span>
                  <span className="text-[9px] text-slate-400">No URL bars</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#0A0B0D] border border-slate-800 flex flex-col items-center gap-1">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-[11px] text-white">100% Offline</span>
                  <span className="text-[9px] text-slate-400">Works anywhere</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#0A0B0D] border border-slate-800 flex flex-col items-center gap-1">
                  <Laptop className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-[11px] text-white">Fast Export</span>
                  <span className="text-[9px] text-slate-400">Direct hardware</span>
                </div>
              </div>

              {/* Instructions per OS */}
              {isIOS ? (
                /* iOS iPhone / iPad Safari Guide */
                <div className="p-3.5 rounded-2xl bg-[#1A1D24] border border-cyan-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>Instructions for iPhone & iPad (Safari)</span>
                  </div>
                  <ol className="space-y-2.5 text-[11px] text-slate-200">
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Tap the <strong className="text-white">Share</strong> button <Share className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" /> at the bottom of Safari.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-0.5" />.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Tap <strong className="text-cyan-300 font-bold">Add</strong> in the top right. An app icon will appear on your Home Screen!
                      </span>
                    </li>
                  </ol>
                </div>
              ) : (
                /* Android & Desktop Guide */
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#1A1D24] border border-[#2D3139] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Smartphone className="w-4 h-4" />
                      <span>Android Phone or Tablet</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Tap the <strong>three dots menu (⋮)</strong> at the top right of Chrome and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#1A1D24] border border-[#2D3139] space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <Laptop className="w-4 h-4" />
                      <span>PC or Mac (Chrome / Edge / Brave)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Click the <strong>Install icon</strong> in your browser address bar (top right) or press the browser menu ➔ <strong>"Install Forex Chart Live Animator"</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer - shrink-0 ensures button is always visible */}
            <div className="shrink-0 px-5 py-3 border-t border-[#2D3139] bg-[#0A0B0D]/90 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
