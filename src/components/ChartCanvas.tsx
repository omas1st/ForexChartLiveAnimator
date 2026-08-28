import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Point, 
  Candle, 
  CandleSizing, 
  UserDrawing, 
  UserText, 
  DrawingToolType, 
  ExportSettings 
} from '../types';
import { renderForexChartToContext, getTextBounds } from './renderForexChart';
import { Check, RotateCcw } from 'lucide-react';

interface ChartCanvasProps {
  backgroundImage: HTMLImageElement | null;
  pathPoints: Point[];
  onUpdatePathPoints: (newPoints: Point[]) => void;
  candles: Candle[];
  candleSizing: CandleSizing;
  userDrawings: UserDrawing[];
  onAddUserDrawing: (drawing: UserDrawing) => void;
  userTexts: UserText[];
  onAddUserText: (text: UserText) => void;
  onUpdateUserText: (id: string, updated: Partial<UserText>) => void;
  onDeleteUserText: (id: string) => void;
  selectedTextId: string | null;
  onSelectTextId: (id: string | null) => void;
  activeTool: DrawingToolType;
  currentTimeRatio: number; // 0.0 to 1.0
  exportSettings?: ExportSettings;
  bullishColor: string;
  bearishColor: string;
}

export { renderForexChartToContext };

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  backgroundImage,
  pathPoints,
  onUpdatePathPoints,
  candles,
  candleSizing,
  userDrawings,
  onAddUserDrawing,
  userTexts,
  onAddUserText,
  onUpdateUserText,
  onDeleteUserText,
  selectedTextId,
  onSelectTextId,
  activeTool,
  currentTimeRatio,
  exportSettings,
  bullishColor,
  bearishColor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Path Tool In-Progress Waypoints
  const [activePathPoints, setActivePathPoints] = useState<Point[]>([]);
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Freehand Pen In-Progress State
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Text Dragging State
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);

  // Resize canvas according to container dimensions
  const updateCanvasDimensions = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvasRef.current.width = Math.floor(rect.width * dpr);
    canvasRef.current.height = Math.floor(rect.height * dpr);
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    const ro = new ResizeObserver(updateCanvasDimensions);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateCanvasDimensions]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderForexChartToContext(ctx, canvas.width, canvas.height, {
      backgroundImage,
      pathPoints,
      candles,
      candleSizing,
      userDrawings,
      userTexts,
      selectedTextId,
      currentTimeRatio,
      exportSettings,
      livePenPoints: isDrawing && activeTool === 'pen' ? currentDrawingPoints : [],
      activePathPoints: activeTool === 'path' ? activePathPoints : [],
      cursorPoint: activeTool === 'path' && activePathPoints.length > 0 ? cursorPoint : null,
      isPathDrawing: activeTool === 'path' && activePathPoints.length > 0,
      bullishColor,
      bearishColor,
    });
  }, [
    backgroundImage,
    pathPoints,
    candles,
    candleSizing,
    userDrawings,
    userTexts,
    selectedTextId,
    currentDrawingPoints,
    activePathPoints,
    cursorPoint,
    isDrawing,
    activeTool,
    currentTimeRatio,
    exportSettings,
    bullishColor,
    bearishColor,
  ]);

  // Mouse & Touch coordinate normalizer
  const getNormalizedCoords = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  };

  // Accurate text hit test using canvas bounds
  const findHitText = (normPt: Point): UserText | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const width = canvas.width;
    const height = canvas.height;
    const px = normPt.x * width;
    const py = normPt.y * height;

    // Check in reverse (topmost text first)
    for (let i = userTexts.length - 1; i >= 0; i--) {
      const t = userTexts[i];
      const bounds = getTextBounds(ctx, t, width, height);
      if (
        px >= bounds.x - 4 &&
        px <= bounds.x + bounds.width + 4 &&
        py >= bounds.y - 4 &&
        py <= bounds.y + bounds.height + 4
      ) {
        return t;
      }
    }
    return null;
  };

  // Finish Path Tool Drawing
  const handleFinishPath = useCallback(() => {
    if (activePathPoints.length >= 2) {
      onUpdatePathPoints(activePathPoints);
    }
    setActivePathPoints([]);
    setCursorPoint(null);
  }, [activePathPoints, onUpdatePathPoints]);

  // Cancel in-progress path
  const handleCancelPath = () => {
    setActivePathPoints([]);
    setCursorPoint(null);
  };

  // Keyboard shortcut: Enter or Esc to finish/cancel path
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleFinishPath();
      } else if (e.key === 'Escape') {
        handleCancelPath();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFinishPath]);

  // Pointer Down (Single tap / click)
  const handlePointerDown = (clientX: number, clientY: number, isDoubleClick: boolean = false) => {
    const pt = getNormalizedCoords(clientX, clientY);

    // Double click / tap detection on touch devices
    const now = Date.now();
    const isDoubleTap = isDoubleClick || (now - lastTapTimeRef.current < 320);
    lastTapTimeRef.current = now;

    // Check if clicking on existing text
    const hitText = findHitText(pt);

    if (hitText) {
      onSelectTextId(hitText.id);
      setDraggedTextId(hitText.id);
      setDragOffset({ x: pt.x - hitText.x, y: pt.y - hitText.y });
      return;
    }

    // PATH TOOL: Tap to place point, Double-tap to finish path
    if (activeTool === 'path') {
      if (isDoubleTap && activePathPoints.length >= 1) {
        const finalPoints = [...activePathPoints, pt];
        if (finalPoints.length >= 2) {
          onUpdatePathPoints(finalPoints);
        }
        setActivePathPoints([]);
        setCursorPoint(null);
        return;
      }

      // Add waypoint to path
      setActivePathPoints((prev) => [...prev, pt]);
      setCursorPoint(pt);
      return;
    }

    // FREEHAND PEN TOOL
    if (activeTool === 'pen') {
      setIsDrawing(true);
      setCurrentDrawingPoints([pt]);
    } else if (activeTool === 'text') {
      // Create new text annotation directly at exact click position!
      const newText: UserText = {
        id: `text-${Date.now()}`,
        x: Math.max(0.01, Math.min(0.99, pt.x)),
        y: Math.max(0.01, Math.min(0.99, pt.y)),
        text: 'Key Level',
        fontSize: 18,
        fontFamily: 'Montserrat, sans-serif',
        color: '#ffffff',
        fontWeight: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        hasBorder: true,
        borderColor: '#38bdf8',
      };
      onAddUserText(newText);
      onSelectTextId(newText.id);
    } else {
      // Deselect text if clicking blank area
      onSelectTextId(null);
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    const pt = getNormalizedCoords(clientX, clientY);

    // Update hovered text state for cursor styling
    const hit = findHitText(pt);
    setHoveredTextId(hit ? hit.id : null);

    if (draggedTextId) {
      onUpdateUserText(draggedTextId, {
        x: Math.max(0.005, Math.min(0.995, pt.x - dragOffset.x)),
        y: Math.max(0.005, Math.min(0.995, pt.y - dragOffset.y)),
      });
      return;
    }

    if (activeTool === 'path' && activePathPoints.length > 0) {
      setCursorPoint(pt);
    }

    if (isDrawing && activeTool === 'pen') {
      setCurrentDrawingPoints((prev) => {
        const last = prev[prev.length - 1];
        if (last && Math.abs(last.x - pt.x) < 0.001 && Math.abs(last.y - pt.y) < 0.001) {
          return prev;
        }
        return [...prev, pt];
      });
    }
  };

  const handlePointerUp = () => {
    if (draggedTextId) {
      setDraggedTextId(null);
    }

    if (isDrawing && activeTool === 'pen') {
      setIsDrawing(false);
      if (currentDrawingPoints.length > 1) {
        onUpdatePathPoints(currentDrawingPoints);
      }
      setCurrentDrawingPoints([]);
    }
  };

  const handleDoubleClick = (clientX: number, clientY: number) => {
    if (activeTool === 'path' && activePathPoints.length >= 1) {
      const pt = getNormalizedCoords(clientX, clientY);
      const finalPoints = [...activePathPoints, pt];
      if (finalPoints.length >= 2) {
        onUpdatePathPoints(finalPoints);
      }
      setActivePathPoints([]);
      setCursorPoint(null);
    }
  };

  const cursorClass = draggedTextId
    ? 'cursor-grabbing'
    : hoveredTextId
    ? 'cursor-grab'
    : activeTool === 'path' || activeTool === 'pen'
    ? 'cursor-crosshair'
    : activeTool === 'text'
    ? 'cursor-text'
    : 'cursor-default';

  return (
    <div
      ref={containerRef}
      id="chart-canvas-wrapper"
      className="relative w-full h-full min-h-[420px] sm:min-h-[520px] bg-[#0A0B0D] rounded-3xl overflow-hidden border border-[#2D3139] shadow-2xl flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        id="forex-chart-canvas"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onDoubleClick={(e) => handleDoubleClick(e.clientX, e.clientY)}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length > 0) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={handlePointerUp}
        className={`w-full h-full block touch-none ${cursorClass}`}
      />

      {/* Path Tool Active Status & Actions Banner */}
      {activeTool === 'path' && (
        <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-10 max-w-[95%]">
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#12141A]/95 backdrop-blur-md border border-cyan-500/50 text-[11px] sm:text-xs font-semibold text-cyan-300 shadow-xl flex items-center gap-2 truncate">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="truncate">
              {activePathPoints.length === 0
                ? 'Tap chart to place 1st waypoint'
                : `Pt ${activePathPoints.length} set · Tap next (Double-tap finish)`}
            </span>
          </div>

          {activePathPoints.length >= 2 && (
            <button
              id="finish-path-btn"
              onClick={handleFinishPath}
              className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] sm:text-xs shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 shrink-0"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Done</span>
            </button>
          )}

          {activePathPoints.length > 0 && (
            <button
              id="cancel-path-btn"
              onClick={handleCancelPath}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-[#2D3139]/90 hover:bg-[#3E4451] text-slate-300 text-[11px] sm:text-xs font-semibold border border-slate-600 transition-colors shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Freehand Pen Instructions Banner */}
      {activeTool === 'pen' && (
        <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 text-[11px] sm:text-xs font-semibold text-cyan-300 pointer-events-none shadow-lg flex items-center gap-1.5 sm:gap-2 max-w-[90%] truncate">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="truncate">Draw freehand to define trajectory</span>
        </div>
      )}

      {/* Floating Text Instructions Banner */}
      {activeTool === 'text' && (
        <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-[11px] sm:text-xs font-semibold text-emerald-300 pointer-events-none shadow-lg flex items-center gap-1.5 sm:gap-2 max-w-[90%] truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">Tap chart to add text label</span>
        </div>
      )}

      {/* Helpful overlay when no path exists on uploaded chart */}
      {pathPoints.length < 2 && activePathPoints.length === 0 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-[#12141A]/95 backdrop-blur-md border border-[#2D3139] text-[11px] sm:text-xs text-slate-300 shadow-2xl flex items-center gap-2 pointer-events-none max-w-[90%] text-center">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
          <span>Tap on chart with <strong>Path Tool</strong> to generate live animated candles</span>
        </div>
      )}
    </div>
  );
};
