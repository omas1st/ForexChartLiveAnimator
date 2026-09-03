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
import { findHitDrawing } from '../utils/drawingConverter';
import { FloatingDrawingToolbar } from './FloatingDrawingToolbar';
import { Check, RotateCcw, Upload, Image as ImageIcon } from 'lucide-react';

interface ChartCanvasProps {
  backgroundImage: HTMLImageElement | null;
  onUploadImage: (file: File) => void;
  pathPoints: Point[];
  onUpdatePathPoints: (newPoints: Point[]) => void;
  candles: Candle[];
  candleSizing: CandleSizing;
  userDrawings: UserDrawing[];
  onAddUserDrawing: (drawing: UserDrawing) => void;
  onUpdateUserDrawing?: (id: string, updated: Partial<UserDrawing>) => void;
  onDeleteUserDrawing?: (id: string) => void;
  selectedDrawingId?: string | null;
  onSelectDrawingId?: (id: string | null) => void;
  onConvertDrawingToCandles: (drawing: UserDrawing) => void;
  userTexts: UserText[];
  onAddUserText: (text: UserText) => void;
  onUpdateUserText: (id: string, updated: Partial<UserText>) => void;
  onDeleteUserText: (id: string) => void;
  selectedTextId: string | null;
  onSelectTextId: (id: string | null) => void;
  activeTool: DrawingToolType;
  drawingColor?: string;
  drawingStrokeWidth?: number;
  currentTimeRatio: number; // 0.0 to 1.0
  exportSettings?: ExportSettings;
  bullishColor: string;
  bearishColor: string;
}

export { renderForexChartToContext };

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  backgroundImage,
  onUploadImage,
  pathPoints,
  onUpdatePathPoints,
  candles,
  candleSizing,
  userDrawings,
  onAddUserDrawing,
  onUpdateUserDrawing,
  onDeleteUserDrawing,
  selectedDrawingId = null,
  onSelectDrawingId,
  onConvertDrawingToCandles,
  userTexts,
  onAddUserText,
  onUpdateUserText,
  onDeleteUserText,
  selectedTextId,
  onSelectTextId,
  activeTool,
  drawingColor = '#38bdf8',
  drawingStrokeWidth = 2.5,
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

  // Drawing Tools In-Progress State (Shapes without forming candles)
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<Point[]>([]);
  const [shapeStartPoint, setShapeStartPoint] = useState<Point | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeDrawingPreview, setActiveDrawingPreview] = useState<{
    type: UserDrawing['type'];
    points: Point[];
    color: string;
    strokeWidth: number;
    fillColor?: string;
  } | null>(null);
  const [hoveredDrawingId, setHoveredDrawingId] = useState<string | null>(null);
  const [draggedDrawingId, setDraggedDrawingId] = useState<string | null>(null);
  const [drawingDragStartPt, setDrawingDragStartPt] = useState<Point | null>(null);

  // Text Dragging State
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);

  // Upload & Drag-and-Drop State
  const centerFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dismissUploadPrompt, setDismissUploadPrompt] = useState(false);

  const selectedDrawing = userDrawings.find((d) => d.id === selectedDrawingId) || null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onUploadImage(file);
      }
    }
  };

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
      selectedDrawingId,
      activeDrawingPreview,
      userTexts,
      selectedTextId,
      currentTimeRatio,
      exportSettings,
      livePenPoints: isDrawing && (activeTool === 'pen' || activeTool === 'freehand') ? currentDrawingPoints : [],
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
    selectedDrawingId,
    activeDrawingPreview,
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

    // 1. Check if clicking on existing text
    const hitText = findHitText(pt);
    if (hitText) {
      onSelectTextId(hitText.id);
      onSelectDrawingId?.(null);
      setDraggedTextId(hitText.id);
      setDragOffset({ x: pt.x - hitText.x, y: pt.y - hitText.y });
      return;
    }

    // 2. Check if clicking on existing drawing shape (Selection for conversion, edits, or DRAGGING)
    const canvas = canvasRef.current;
    if (canvas) {
      // Check if clicking inside currently selected drawing bounding box (with generous grab margin)
      let hitDrawing: UserDrawing | null = null;
      if (selectedDrawing && selectedDrawing.points && selectedDrawing.points.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        selectedDrawing.points.forEach((p) => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });
        const grabMargin = 0.04;
        if (
          pt.x >= minX - grabMargin &&
          pt.x <= maxX + grabMargin &&
          pt.y >= minY - grabMargin &&
          pt.y <= maxY + grabMargin
        ) {
          hitDrawing = selectedDrawing;
        }
      }

      if (!hitDrawing) {
        hitDrawing = findHitDrawing(pt, userDrawings, canvas.width, canvas.height);
      }

      if (hitDrawing) {
        onSelectDrawingId?.(hitDrawing.id);
        onSelectTextId(null);
        setDraggedDrawingId(hitDrawing.id);
        setDrawingDragStartPt(pt);
        return;
      }
    }

    // Deselect active selections if clicking open space
    onSelectDrawingId?.(null);
    onSelectTextId(null);

    // 3. PATH TOOL: Tap to place point, Double-tap to finish path
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

    // 4. FREEHAND PEN TOOL (Draw without forming candlestick)
    if (activeTool === 'pen' || activeTool === 'freehand') {
      setIsDrawing(true);
      setCurrentDrawingPoints([pt]);
      setActiveDrawingPreview({
        type: 'freehand',
        points: [pt],
        color: drawingColor,
        strokeWidth: drawingStrokeWidth,
      });
      return;
    }

    // 5. RECTANGLE / ZONE TOOL (Draw without forming candlestick)
    if (activeTool === 'rectangle') {
      setIsDrawing(true);
      setShapeStartPoint(pt);
      setActiveDrawingPreview({
        type: 'rectangle',
        points: [pt, pt],
        color: drawingColor,
        strokeWidth: drawingStrokeWidth,
        fillColor: `${drawingColor}25`,
      });
      return;
    }

    // 6. STRAIGHT LINE TOOL (Draw without forming candlestick)
    if (activeTool === 'line') {
      setIsDrawing(true);
      setShapeStartPoint(pt);
      setActiveDrawingPreview({
        type: 'line',
        points: [pt, pt],
        color: drawingColor,
        strokeWidth: drawingStrokeWidth,
      });
      return;
    }

    // 7. UP ARROW (BULLISH)
    if (activeTool === 'arrow-up') {
      setIsDrawing(true);
      setShapeStartPoint(pt);
      setActiveDrawingPreview({
        type: 'arrow-up',
        points: [pt, pt],
        color: drawingColor || '#10b981',
        strokeWidth: drawingStrokeWidth,
      });
      return;
    }

    // 8. DOWN ARROW (BEARISH)
    if (activeTool === 'arrow-down') {
      setIsDrawing(true);
      setShapeStartPoint(pt);
      setActiveDrawingPreview({
        type: 'arrow-down',
        points: [pt, pt],
        color: drawingColor || '#f23645',
        strokeWidth: drawingStrokeWidth,
      });
      return;
    }

    // 9. TEXT ANNOTATION TOOL
    if (activeTool === 'text') {
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
      return;
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    const pt = getNormalizedCoords(clientX, clientY);

    // Update hovered states for cursor styling
    const hitText = findHitText(pt);
    setHoveredTextId(hitText ? hitText.id : null);

    const canvas = canvasRef.current;
    if (canvas) {
      const hitDrawing = findHitDrawing(pt, userDrawings, canvas.width, canvas.height);
      setHoveredDrawingId(hitDrawing ? hitDrawing.id : null);
    }

    if (draggedTextId) {
      onUpdateUserText(draggedTextId, {
        x: Math.max(0.005, Math.min(0.995, pt.x - dragOffset.x)),
        y: Math.max(0.005, Math.min(0.995, pt.y - dragOffset.y)),
      });
      return;
    }

    // Drag and move user drawings (Technical drawn items)
    if (draggedDrawingId && drawingDragStartPt) {
      const dx = pt.x - drawingDragStartPt.x;
      const dy = pt.y - drawingDragStartPt.y;

      if (Math.hypot(dx, dy) > 0.0001) {
        const drawing = userDrawings.find((d) => d.id === draggedDrawingId);
        if (drawing && drawing.points.length > 0) {
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          drawing.points.forEach((p) => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });

          // Prevent moving completely off screen
          const clampedDx = Math.max(-minX + 0.005, Math.min(0.995 - maxX, dx));
          const clampedDy = Math.max(-minY + 0.005, Math.min(0.995 - maxY, dy));

          const updatedPoints = drawing.points.map((p) => ({
            x: Math.max(0.005, Math.min(0.995, p.x + clampedDx)),
            y: Math.max(0.005, Math.min(0.995, p.y + clampedDy)),
          }));

          onUpdateUserDrawing?.(draggedDrawingId, { points: updatedPoints });
          setDrawingDragStartPt(pt);
        }
      }
      return;
    }

    if (activeTool === 'path' && activePathPoints.length > 0) {
      setCursorPoint(pt);
    }

    if (isDrawing) {
      if (activeTool === 'pen' || activeTool === 'freehand') {
        setCurrentDrawingPoints((prev) => {
          const next = [...prev, pt];
          setActiveDrawingPreview({
            type: 'freehand',
            points: next,
            color: drawingColor,
            strokeWidth: drawingStrokeWidth,
          });
          return next;
        });
      } else if (shapeStartPoint) {
        if (activeTool === 'rectangle') {
          setActiveDrawingPreview({
            type: 'rectangle',
            points: [shapeStartPoint, pt],
            color: drawingColor,
            strokeWidth: drawingStrokeWidth,
            fillColor: `${drawingColor}25`,
          });
        } else if (activeTool === 'line') {
          setActiveDrawingPreview({
            type: 'line',
            points: [shapeStartPoint, pt],
            color: drawingColor,
            strokeWidth: drawingStrokeWidth,
          });
        } else if (activeTool === 'arrow-up') {
          setActiveDrawingPreview({
            type: 'arrow-up',
            points: [shapeStartPoint, pt],
            color: drawingColor || '#10b981',
            strokeWidth: drawingStrokeWidth,
          });
        } else if (activeTool === 'arrow-down') {
          setActiveDrawingPreview({
            type: 'arrow-down',
            points: [shapeStartPoint, pt],
            color: drawingColor || '#f23645',
            strokeWidth: drawingStrokeWidth,
          });
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (draggedTextId) {
      setDraggedTextId(null);
    }
    if (draggedDrawingId) {
      setDraggedDrawingId(null);
      setDrawingDragStartPt(null);
    }

    if (isDrawing) {
      setIsDrawing(false);

      if (activeTool === 'pen' || activeTool === 'freehand') {
        if (currentDrawingPoints.length > 1) {
          const newDrawing: UserDrawing = {
            id: `draw-${Date.now()}`,
            type: 'freehand',
            points: currentDrawingPoints,
            color: drawingColor,
            strokeWidth: drawingStrokeWidth,
          };
          onAddUserDrawing(newDrawing);
          onSelectDrawingId?.(newDrawing.id);
        }
        setCurrentDrawingPoints([]);
      } else if (shapeStartPoint && activeDrawingPreview) {
        const p0 = shapeStartPoint;
        const p1 = activeDrawingPreview.points[1] || p0;
        const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);

        let finalP1 = p1;
        if (dist < 0.01) {
          // If clicked or tapped without drag, provide a clean default shape
          if (activeTool === 'rectangle') {
            finalP1 = { x: Math.min(0.98, p0.x + 0.15), y: Math.min(0.98, p0.y + 0.1) };
          } else if (activeTool === 'line') {
            finalP1 = { x: Math.min(0.98, p0.x + 0.18), y: Math.max(0.02, p0.y - 0.08) };
          } else if (activeTool === 'arrow-up') {
            finalP1 = { x: p0.x, y: Math.max(0.02, p0.y - 0.14) };
          } else if (activeTool === 'arrow-down') {
            finalP1 = { x: p0.x, y: Math.min(0.98, p0.y + 0.14) };
          }
        }

        const newDrawing: UserDrawing = {
          id: `draw-${Date.now()}`,
          type: activeTool as UserDrawing['type'],
          points: [p0, finalP1],
          color: activeDrawingPreview.color,
          strokeWidth: activeDrawingPreview.strokeWidth,
          fillColor: activeDrawingPreview.fillColor,
        };

        onAddUserDrawing(newDrawing);
        onSelectDrawingId?.(newDrawing.id);
      }

      setShapeStartPoint(null);
      setActiveDrawingPreview(null);
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

  const cursorClass = draggedTextId || draggedDrawingId
    ? 'cursor-grabbing'
    : hoveredTextId
    ? 'cursor-grab'
    : hoveredDrawingId
    ? 'cursor-grab'
    : ['path', 'freehand', 'rectangle', 'line', 'arrow-up', 'arrow-down', 'pen'].includes(activeTool)
    ? 'cursor-crosshair'
    : activeTool === 'text'
    ? 'cursor-text'
    : 'cursor-default';

  return (
    <div
      ref={containerRef}
      id="chart-canvas-wrapper"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) {
          setIsDraggingOver(false);
        }
      }}
      onDrop={handleFileDrop}
      className={`relative w-full h-full min-h-[420px] sm:min-h-[520px] bg-[#0A0B0D] rounded-3xl overflow-hidden border border-[#2D3139] shadow-2xl flex items-center justify-center select-none ${
        isDraggingOver ? 'ring-2 ring-cyan-400/80 ring-inset' : ''
      }`}
    >
      {/* Hidden file input for Center & Floating Upload buttons */}
      <input
        ref={centerFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onUploadImage(e.target.files[0]);
          }
        }}
        className="hidden"
      />

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

      {/* Center of Screen: Upload Chart First Card & Prominent Button */}
      {!backgroundImage && !dismissUploadPrompt && (
        <div 
          id="center-chart-upload-card"
          className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-auto bg-[#0A0B0D]/60 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-3xl bg-[#12151C]/95 backdrop-blur-2xl border-2 border-[#2D3340] hover:border-cyan-500/50 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center flex flex-col items-center gap-4 transition-all animate-in fade-in zoom-in-95">
            {/* Glow badge icon */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] shrink-0">
              <Upload className="w-8 h-8 stroke-[2.2]" />
            </div>

            {/* Title & Explanatory Copy */}
            <div className="space-y-1.5 max-w-xs sm:max-w-sm">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Upload Your Chart First
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                Upload your screenshot from TradingView, MT4/MT5, or your broker before drawing path or text.
              </p>
            </div>

            {/* Prominent Center Upload Button */}
            <button
              id="center-upload-chart-btn"
              type="button"
              onClick={() => centerFileInputRef.current?.click()}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-extrabold text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 stroke-[2.8]" />
              <span>Upload Chart Screenshot</span>
            </button>

            {/* Format advice and bypass option */}
            <div className="flex flex-col items-center gap-2 pt-0.5">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                PNG, JPG, WebP · Drag & drop supported
              </span>
              <button
                type="button"
                onClick={() => setDismissUploadPrompt(true)}
                className="text-[11px] text-slate-500 hover:text-cyan-300 underline underline-offset-4 transition-colors"
              >
                or start drawing directly on dark grid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Change Chart Button when chart is already uploaded */}
      {backgroundImage && (
        <button
          id="replace-chart-floating-btn"
          type="button"
          onClick={() => centerFileInputRef.current?.click()}
          title="Change or replace chart screenshot"
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12141A]/90 hover:bg-[#1A1D24] active:scale-95 border border-[#2D3139] text-slate-300 hover:text-white text-xs font-semibold shadow-lg backdrop-blur-md transition-all"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Change Chart</span>
          <span className="sm:hidden">Change</span>
        </button>
      )}

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

      {/* Floating Drawing Toolbar for Selected Technical Drawing */}
      {selectedDrawing && (
        <FloatingDrawingToolbar
          selectedDrawing={selectedDrawing}
          onConvert={(drawing) => onConvertDrawingToCandles(drawing)}
          onUpdateColor={(id, color) => {
            onUpdateUserDrawing?.(id, { color, fillColor: `${color}25` });
          }}
          onDelete={(id) => {
            onDeleteUserDrawing?.(id);
            onSelectDrawingId?.(null);
          }}
          onClose={() => onSelectDrawingId?.(null)}
        />
      )}

      {/* Floating Technical Drawing Mode Instructions Banner (When not currently selecting a shape) */}
      {['freehand', 'pen', 'rectangle', 'line', 'arrow-up', 'arrow-down'].includes(activeTool) && !selectedDrawing && (
        <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#12141A]/95 backdrop-blur-md border border-cyan-500/50 text-[11px] sm:text-xs font-semibold text-cyan-300 shadow-xl flex items-center gap-2 max-w-[92%] truncate pointer-events-none z-10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <span className="truncate">
            {(activeTool === 'freehand' || activeTool === 'pen') && 'Draw freehand shape (No candles · Tap shape to convert)'}
            {activeTool === 'rectangle' && 'Drag to draw zone / box (Tap shape to convert to candles)'}
            {activeTool === 'line' && 'Drag to draw straight line (Tap shape to convert to candles)'}
            {activeTool === 'arrow-up' && 'Drag or tap to place up arrow (Tap shape to convert to candles)'}
            {activeTool === 'arrow-down' && 'Drag or tap to place down arrow (Tap shape to convert to candles)'}
          </span>
        </div>
      )}

      {/* Floating Text Instructions Banner */}
      {activeTool === 'text' && (
        <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-[11px] sm:text-xs font-semibold text-emerald-300 pointer-events-none shadow-lg flex items-center gap-1.5 sm:gap-2 max-w-[90%] truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">Tap chart to add text label</span>
        </div>
      )}

      {/* Helpful overlay when no path exists on uploaded chart or after dismissing prompt */}
      {(backgroundImage || dismissUploadPrompt) && pathPoints.length < 2 && activePathPoints.length === 0 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-[#12141A]/95 backdrop-blur-md border border-[#2D3139] text-[11px] sm:text-xs text-slate-300 shadow-2xl flex items-center gap-2 pointer-events-none max-w-[90%] text-center">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
          <span>Draw with <strong>Path Tool</strong> or <strong>Drawing Tools</strong> (Tap any drawing to convert to candles)</span>
        </div>
      )}
    </div>
  );
};
