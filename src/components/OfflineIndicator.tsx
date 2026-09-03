import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../utils/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowReconnected(false);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div 
        id="pwa-offline-banner"
        className="fixed bottom-18 sm:bottom-4 left-3 sm:left-4 z-40 flex items-center gap-2.5 rounded-2xl bg-[#1A1813]/95 border border-amber-500/40 px-3.5 py-2 text-xs font-medium text-amber-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2"
      >
        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
          <WifiOff className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[11px] leading-tight">Offline Mode</span>
          <span className="text-[10px] text-amber-200/80 leading-tight">
            All charts, animations & video rendering work completely offline!
          </span>
        </div>
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0 ml-1" />
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div 
        id="pwa-online-toast"
        className="fixed bottom-18 sm:bottom-4 left-3 sm:left-4 z-40 flex items-center gap-2 rounded-2xl bg-[#0F1E19]/95 border border-emerald-500/40 px-3.5 py-2 text-xs font-medium text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
          <Wifi className="w-3.5 h-3.5" />
        </div>
        <span className="text-[11px] font-bold">Back Online</span>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
      </div>
    );
  }

  return null;
};
