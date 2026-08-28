import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Point, 
  Candle, 
  CandleSizing, 
  UserDrawing, 
  UserText, 
  DrawingToolType, 
  PlaybackState,
  AudioTrack
} from './types';
import { generateCandlesAlongPath } from './utils/candleGenerator';
import { synchronizedAudioPlayer, playTickSound } from './utils/audio';
import { Header } from './components/Header';
import { ChartCanvas } from './components/ChartCanvas';
import { AppBottomDock } from './components/AppBottomDock';
import { FloatingTextToolbar } from './components/FloatingTextToolbar';
import { TextLayersModal } from './components/TextLayersModal';
import { AudioModal } from './components/AudioModal';
import { ExportModal } from './components/ExportModal';

export const App: React.FC = () => {
  // Chart Image State
  const [chartImage, setChartImage] = useState<HTMLImageElement | null>(null);

  // Candlestick Appearance & Size State
  const [candleSizing, setCandleSizing] = useState<CandleSizing>({
    widthScale: 0.65,   // Slim width that matches screenshot candles
    heightScale: 0.85,  // Balanced height
    candleCount: 22,    // Base candle count along trajectory
    spacingScale: 1.0,  // Distance/closeness multiplier between candles
  });

  const [bullishColor, setBullishColor] = useState<string>('#089981');
  const [bearishColor, setBearishColor] = useState<string>('#f23645');

  // Drawing Path (Waypoints for trajectory)
  const [pathPoints, setPathPoints] = useState<Point[]>([
    { x: 0.22, y: 0.72 },
    { x: 0.44, y: 0.38 },
    { x: 0.64, y: 0.54 },
    { x: 0.84, y: 0.22 },
  ]);

  // Generated Candlesticks (guaranteed non-overlapping, uniform equidistant)
  const [candles, setCandles] = useState<Candle[]>(() => 
    generateCandlesAlongPath(
      [
        { x: 0.22, y: 0.72 },
        { x: 0.44, y: 0.38 },
        { x: 0.64, y: 0.54 },
        { x: 0.84, y: 0.22 },
      ],
      22,
      0.85,
      1.0
    )
  );

  // User Drawings & Multiple Rich Text Annotations
  const [userDrawings, setUserDrawings] = useState<UserDrawing[]>([]);
  const [userTexts, setUserTexts] = useState<UserText[]>([
    {
      id: 'text-default-tp',
      x: 0.76,
      y: 0.18,
      text: 'Take Profit (TP) 🎯',
      fontSize: 18,
      fontFamily: 'Montserrat, sans-serif',
      color: '#10b981',
      fontWeight: 'bold',
      backgroundColor: 'rgba(6, 78, 59, 0.92)',
      hasBorder: true,
      borderColor: '#10b981',
    },
    {
      id: 'text-default-entry',
      x: 0.22,
      y: 0.80,
      text: 'Liquidity Entry ⚡',
      fontSize: 16,
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      color: '#38bdf8',
      fontWeight: 'bold',
      backgroundColor: 'rgba(8, 47, 73, 0.92)',
      hasBorder: true,
      borderColor: '#06b6d4',
    }
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>('text-default-tp');

  // Active Tool: Default to 'path'
  const [activeTool, setActiveTool] = useState<DrawingToolType>('path');

  // Background Soundtrack & Audio Trimming State
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);

  // Playback Animation Engine (Configurable Duration 3s to 120s, default 10s)
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: true,
    currentTime: 0,
    duration: 10.0, // Default 10 seconds, configurable up to 120s (2 minutes)
    playbackRate: 1.0,
    isLooping: true,
    soundEnabled: false,
    audioTrack: null,
  });

  // Modals State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isTextLayersModalOpen, setIsTextLayersModalOpen] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(performance.now());
  const lastCandleTickIndexRef = useRef<number>(-1);

  // Keep playback audioTrack in sync with audioTrack state
  useEffect(() => {
    setPlayback((prev) => ({ ...prev, audioTrack }));
  }, [audioTrack]);

  // Regenerate candlesticks whenever path or sizing changes
  useEffect(() => {
    if (pathPoints.length < 2) {
      setCandles([]);
      return;
    }
    const generated = generateCandlesAlongPath(
      pathPoints,
      candleSizing.candleCount,
      candleSizing.heightScale,
      candleSizing.spacingScale
    );
    setCandles(generated);
  }, [pathPoints, candleSizing.candleCount, candleSizing.heightScale, candleSizing.spacingScale]);

  // Sync background music with playback state
  useEffect(() => {
    synchronizedAudioPlayer.syncPlayback(
      playback.audioTrack,
      playback.isPlaying,
      playback.currentTime,
      playback.duration
    );
  }, [playback.isPlaying, playback.audioTrack, playback.currentTime, playback.duration]);

  // Animation Loop (60FPS requestAnimationFrame)
  const updateAnimation = useCallback((now: number) => {
    const deltaSeconds = (now - lastTickTimeRef.current) / 1000;
    lastTickTimeRef.current = now;

    setPlayback((prev) => {
      if (!prev.isPlaying) return prev;

      let nextTime = prev.currentTime + deltaSeconds * prev.playbackRate;
      if (nextTime >= prev.duration) {
        if (prev.isLooping) {
          nextTime = 0;
        } else {
          nextTime = prev.duration;
          return { ...prev, currentTime: nextTime, isPlaying: false };
        }
      }

      // Optional subtle market ticking sound FX
      if (prev.soundEnabled && candles.length > 0) {
        const candleIndex = Math.floor((nextTime / prev.duration) * candles.length);
        if (candleIndex !== lastCandleTickIndexRef.current && candleIndex < candles.length) {
          lastCandleTickIndexRef.current = candleIndex;
          playTickSound(1.0 + (candleIndex / candles.length) * 0.4, 0.05);
        }
      }

      return { ...prev, currentTime: nextTime };
    });

    animationFrameRef.current = requestAnimationFrame(updateAnimation);
  }, [candles]);

  useEffect(() => {
    lastTickTimeRef.current = performance.now();
    if (playback.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateAnimation);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playback.isPlaying, updateAnimation]);

  // Handle Screenshot Upload:
  const handleUploadImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setChartImage(img);
      setPathPoints([]); // Clear path so candlesticks only appear after user draws on the uploaded chart
      setCandles([]);
      setActiveTool('path');
    };
    img.src = url;
  };

  // Playback Handlers
  const handleTogglePlay = () => {
    setPlayback((prev) => {
      if (!prev.isPlaying && prev.currentTime >= prev.duration) {
        return { ...prev, isPlaying: true, currentTime: 0 };
      }
      return { ...prev, isPlaying: !prev.isPlaying };
    });
  };

  const handleSeek = (time: number) => {
    setPlayback((prev) => ({ ...prev, currentTime: Math.max(0, Math.min(prev.duration, time)) }));
  };

  const handleReset = () => {
    setPlayback((prev) => ({ ...prev, currentTime: 0, isPlaying: true }));
  };

  const handleSetPlaybackRate = (rate: number) => {
    setPlayback((prev) => ({ ...prev, playbackRate: rate }));
  };

  const handleToggleSound = () => {
    setPlayback((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleToggleLoop = () => {
    setPlayback((prev) => ({ ...prev, isLooping: !prev.isLooping }));
  };

  const handleSetDuration = (durationSecs: number) => {
    const clamped = Math.max(3, Math.min(120, durationSecs));
    setPlayback((prev) => ({
      ...prev,
      duration: clamped,
      currentTime: Math.min(prev.currentTime, clamped),
    }));
  };

  // Text Annotation Handlers
  const handleAddUserText = (text: UserText) => {
    setUserTexts((prev) => [...prev, text]);
    setSelectedTextId(text.id);
  };

  const handleUpdateUserText = (id: string, updated: Partial<UserText>) => {
    setUserTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };

  const handleDeleteUserText = (id: string) => {
    setUserTexts((prev) => prev.filter((t) => t.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };

  const handleDeleteSelectedText = () => {
    if (selectedTextId) {
      handleDeleteUserText(selectedTextId);
    }
  };

  const handleDuplicateSelectedText = () => {
    const current = userTexts.find((t) => t.id === selectedTextId);
    if (!current) return;
    const duplicated: UserText = {
      ...current,
      id: `text-${Date.now()}`,
      x: Math.min(0.98, current.x + 0.03),
      y: Math.min(0.98, current.y + 0.03),
    };
    setUserTexts((prev) => [...prev, duplicated]);
    setSelectedTextId(duplicated.id);
  };

  const handleAddTextDirectly = (presetText?: string) => {
    const newText: UserText = {
      id: `text-${Date.now()}`,
      x: 0.35 + (userTexts.length % 4) * 0.08,
      y: 0.35 + (userTexts.length % 4) * 0.08,
      text: presetText || 'Key Market Level',
      fontSize: 18,
      fontFamily: 'Montserrat, sans-serif',
      color: '#ffffff',
      fontWeight: 'bold',
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      hasBorder: true,
      borderColor: '#38bdf8',
    };
    setUserTexts((prev) => [...prev, newText]);
    setSelectedTextId(newText.id);
    setActiveTool('text');
  };

  const handleClearAll = () => {
    setUserDrawings([]);
    setUserTexts([]);
    setSelectedTextId(null);
    setPathPoints([]);
    setCandles([]);
  };

  const selectedText = userTexts.find((t) => t.id === selectedTextId) || null;
  const currentTimeRatio = playback.duration > 0 ? playback.currentTime / playback.duration : 0;

  return (
    <div className="h-[100dvh] w-full bg-[#0A0C10] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Native App Header */}
      <Header
        onUploadImage={handleUploadImage}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        bullishColor={bullishColor}
        bearishColor={bearishColor}
        onChangeBullishColor={setBullishColor}
        onChangeBearishColor={setBearishColor}
      />

      {/* Center Maximized Interactive Canvas Stage */}
      <main className="flex-1 min-h-0 w-full relative flex items-center justify-center p-1.5 sm:p-3 overflow-hidden bg-[#08090C]">
        <div 
          className="w-full h-full relative flex items-center justify-center"
          style={
            chartImage && chartImage.naturalWidth > 0
              ? {
                  aspectRatio: `${chartImage.naturalWidth} / ${chartImage.naturalHeight}`,
                  maxHeight: '100%',
                  maxWidth: '100%',
                }
              : {
                  aspectRatio: '16 / 9',
                  maxHeight: '100%',
                  maxWidth: '100%',
                }
          }
        >
          <ChartCanvas
            backgroundImage={chartImage}
            pathPoints={pathPoints}
            onUpdatePathPoints={(pts) => {
              setPathPoints(pts);
              setPlayback((prev) => ({ ...prev, currentTime: 0, isPlaying: true }));
            }}
            candles={candles}
            candleSizing={candleSizing}
            userDrawings={userDrawings}
            onAddUserDrawing={(d) => setUserDrawings((prev) => [...prev, d])}
            userTexts={userTexts}
            onAddUserText={handleAddUserText}
            onUpdateUserText={handleUpdateUserText}
            onDeleteUserText={handleDeleteUserText}
            selectedTextId={selectedTextId}
            onSelectTextId={setSelectedTextId}
            activeTool={activeTool}
            currentTimeRatio={currentTimeRatio}
            bullishColor={bullishColor}
            bearishColor={bearishColor}
          />

          {/* Floating Rich Text Properties Toolbar (Bottom sheet style overlay) */}
          {(selectedText || activeTool === 'text') && (
            <FloatingTextToolbar
              selectedText={selectedText}
              allTexts={userTexts}
              onUpdateSelectedText={(updated) => {
                if (selectedTextId) {
                  handleUpdateUserText(selectedTextId, updated);
                }
              }}
              onDeleteSelectedText={handleDeleteSelectedText}
              onDuplicateSelectedText={handleDuplicateSelectedText}
              onAddNewText={handleAddTextDirectly}
              onClose={() => setSelectedTextId(null)}
              onOpenLayersModal={() => setIsTextLayersModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Bottom Native App Dock: Scrubber, Playback, and Tools Bar */}
      <AppBottomDock
        playback={playback}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onReset={handleReset}
        onSetDuration={handleSetDuration}
        onOpenAudioModal={() => setIsAudioModalOpen(true)}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onResetPath={() => {
          setPathPoints([]);
          setCandles([]);
        }}
        candleSizing={candleSizing}
        onUpdateCandleSizing={(sizing) => setCandleSizing((prev) => ({ ...prev, ...sizing }))}
        userTexts={userTexts}
        selectedTextId={selectedTextId}
        onAddTextDirectly={() => handleAddTextDirectly('Order Block (OB)')}
        onDeleteSelectedText={handleDeleteSelectedText}
        onClearAll={handleClearAll}
      />

      {/* Text Layers Management Modal */}
      <TextLayersModal
        isOpen={isTextLayersModalOpen}
        onClose={() => setIsTextLayersModalOpen(false)}
        userTexts={userTexts}
        selectedTextId={selectedTextId}
        onSelectTextId={setSelectedTextId}
        onAddUserText={handleAddUserText}
        onUpdateUserText={handleUpdateUserText}
        onDeleteUserText={handleDeleteUserText}
      />

      {/* Background Music & Audio Trimmer Studio Modal */}
      <AudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        audioTrack={audioTrack}
        onUpdateAudioTrack={setAudioTrack}
        videoDurationSeconds={playback.duration}
      />

      {/* MP4 Video Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        backgroundImage={chartImage}
        pathPoints={pathPoints}
        candles={candles}
        candleSizing={candleSizing}
        userDrawings={userDrawings}
        userTexts={userTexts}
        bullishColor={bullishColor}
        bearishColor={bearishColor}
        videoDurationSeconds={playback.duration}
        audioTrack={audioTrack}
      />
    </div>
  );
};

export default App;
