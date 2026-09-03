import { 
  Point, 
  Candle, 
  CandleSizing, 
  UserDrawing, 
  UserText, 
  ExportSettings 
} from '../types';
import { getLiveAnimationState } from '../utils/candleGenerator';

export interface TextBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ContentTransform {
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;
  scale: number;
  toPixelX: (normX: number) => number;
  toPixelY: (normY: number) => number;
}

/**
 * Computes coordinate transform preserving original aspect ratio (Auto-Crop / Cover) for video export.
 * Prevents any squeezing/stretching when rendering to vertical 9:16 or 1:1 aspect ratios.
 */
export function getContentTransform(
  targetWidth: number,
  targetHeight: number,
  srcAspect: number,
  focusPoints?: Point[]
): ContentTransform {
  const targetAspect = targetWidth / targetHeight;

  let contentWidth = targetWidth;
  let contentHeight = targetHeight;
  let contentX = 0;
  let contentY = 0;

  if (Math.abs(targetAspect - srcAspect) <= 0.005) {
    contentWidth = targetWidth;
    contentHeight = targetHeight;
    contentX = 0;
    contentY = 0;
  } else if (targetAspect < srcAspect) {
    // Target is narrower/taller (e.g. 9:16 vertical 1080x1920 vs wide 16:9 chart)
    // Fit height, auto-crop excess width
    contentHeight = targetHeight;
    contentWidth = targetHeight * srcAspect;

    let targetMidX = 0.5;
    if (focusPoints && focusPoints.length > 0) {
      let sumX = 0;
      focusPoints.forEach((p) => {
        sumX += p.x;
      });
      targetMidX = sumX / focusPoints.length;
    }

    const minX = targetWidth - contentWidth;
    const desiredX = targetWidth / 2 - targetMidX * contentWidth;
    contentX = Math.max(minX, Math.min(0, desiredX));
    contentY = 0;
  } else {
    // Target is wider than source
    // Fit width, auto-crop excess height
    contentWidth = targetWidth;
    contentHeight = targetWidth / srcAspect;

    let targetMidY = 0.5;
    if (focusPoints && focusPoints.length > 0) {
      let sumY = 0;
      focusPoints.forEach((p) => {
        sumY += p.y;
      });
      targetMidY = sumY / focusPoints.length;
    }

    const minY = targetHeight - contentHeight;
    const desiredY = targetHeight / 2 - targetMidY * contentHeight;
    contentX = 0;
    contentY = Math.max(minY, Math.min(0, desiredY));
  }

  const scale = Math.min(contentWidth, contentHeight) / 600;

  return {
    contentX,
    contentY,
    contentWidth,
    contentHeight,
    scale,
    toPixelX: (normX: number) => contentX + normX * contentWidth,
    toPixelY: (normY: number) => contentY + normY * contentHeight,
  };
}

export function getTextBounds(
  ctx: CanvasRenderingContext2D,
  t: UserText,
  width: number,
  height: number,
  isExporting?: boolean,
  srcAspect?: number,
  focusPoints?: Point[]
): TextBoundingBox {
  let toPixelX = (normX: number) => normX * width;
  let toPixelY = (normY: number) => normY * height;
  let scale = Math.min(width, height) / 600;

  if (isExporting && srcAspect) {
    const transform = getContentTransform(width, height, srcAspect, focusPoints);
    toPixelX = transform.toPixelX;
    toPixelY = transform.toPixelY;
    scale = transform.scale;
  }

  const size = Math.max(10, Math.round((t.fontSize || 18) * scale));
  const fontFam = t.fontFamily || 'Plus Jakarta Sans, sans-serif';
  const weight = t.fontWeight || 'bold';

  ctx.save();
  ctx.font = `${weight} ${size}px "${fontFam}", sans-serif`;
  const textMetrics = ctx.measureText(t.text || 'Text');
  const textW = Math.max(16 * scale, textMetrics.width);
  const textH = size * 1.2;
  ctx.restore();

  const padX = Math.round(10 * scale);
  const padY = Math.round(6 * scale);
  const boxW = textW + padX * 2;
  const boxH = textH + padY * 2;
  const centerX = toPixelX(t.x);
  const centerY = toPixelY(t.y);

  return {
    x: centerX - boxW / 2,
    y: centerY - boxH / 2,
    width: boxW,
    height: boxH,
  };
}

/**
 * Pure rendering function used for both real-time canvas preview and high-resolution video export.
 * In interactive mode: 100% direct 1:1 pixel accuracy for cursor, path, pen, and text.
 * In video export mode: Auto-crops cleanly to target ratio (9:16, 1:1, 16:9) without squeezing.
 */
export function renderForexChartToContext(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  props: {
    backgroundImage: HTMLImageElement | null;
    pathPoints: Point[];
    candles: Candle[];
    candleSizing: CandleSizing;
    userDrawings: UserDrawing[];
    userTexts: UserText[];
    selectedTextId?: string | null;
    selectedDrawingId?: string | null;
    currentTimeRatio: number;
    exportSettings?: ExportSettings;
    isExporting?: boolean;
    livePenPoints?: Point[];
    activeDrawingPreview?: {
      type: UserDrawing['type'];
      points: Point[];
      color: string;
      strokeWidth: number;
      fillColor?: string;
    } | null;
    activePathPoints?: Point[]; // Points in progress from Path Tool
    cursorPoint?: Point | null; // Current mouse position for straight line preview
    isPathDrawing?: boolean;
    bullishColor?: string;
    bearishColor?: string;
  }
) {
  const {
    backgroundImage,
    pathPoints = [],
    candles = [],
    candleSizing,
    userDrawings = [],
    userTexts = [],
    selectedTextId = null,
    selectedDrawingId = null,
    currentTimeRatio,
    exportSettings,
    isExporting = false,
    livePenPoints = [],
    activeDrawingPreview = null,
    activePathPoints = [],
    cursorPoint = null,
    isPathDrawing = false,
    bullishColor = '#089981',
    bearishColor = '#f23645',
  } = props;

  let contentX = 0;
  let contentY = 0;
  let contentWidth = width;
  let contentHeight = height;
  let scale = Math.min(width, height) / 600;
  let toPixelX = (normX: number) => normX * width;
  let toPixelY = (normY: number) => normY * height;

  // Apply auto-crop cover transform ONLY during video export when aspect ratio differs
  if (isExporting && exportSettings && exportSettings.aspectRatio !== 'original') {
    const srcAspect = backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0
      ? backgroundImage.naturalWidth / backgroundImage.naturalHeight
      : 16 / 9;

    const focusPoints: Point[] = [];
    if (pathPoints && pathPoints.length > 0) focusPoints.push(...pathPoints);
    if (candles && candles.length > 0) {
      candles.forEach((c) => {
        if (typeof c.xNormalized === 'number' && typeof c.yNormalized === 'number') {
          focusPoints.push({ x: c.xNormalized, y: c.yNormalized });
        }
      });
    }

    const transform = getContentTransform(width, height, srcAspect, focusPoints);
    contentX = transform.contentX;
    contentY = transform.contentY;
    contentWidth = transform.contentWidth;
    contentHeight = transform.contentHeight;
    scale = transform.scale;
    toPixelX = transform.toPixelX;
    toPixelY = transform.toPixelY;
  }

  // 1. Clear canvas background & set clip boundary
  ctx.save();
  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, width, height);

  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();

  // 2. Draw user's background chart image
  if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
    ctx.drawImage(backgroundImage, contentX, contentY, contentWidth, contentHeight);
  } else {
    // Subtle background grid when no image is uploaded
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const y = contentY + (contentHeight / 8) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let i = 1; i < 10; i++) {
      const x = contentX + (contentWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  // Helper function to render a technical shape (freehand, rectangle, line, arrow)
  const renderShape = (
    d: {
      type: UserDrawing['type'];
      points: Point[];
      color: string;
      strokeWidth: number;
      fillColor?: string;
    },
    isSelected: boolean = false
  ) => {
    if (!d.points || d.points.length === 0) return;
    const color = d.color || '#38bdf8';
    const strokeW = Math.max(1.5, (d.strokeWidth || 2.5) * scale);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (d.type === 'rectangle' || d.type === 'box') {
      if (d.points.length >= 2) {
        const x0 = toPixelX(d.points[0].x);
        const y0 = toPixelY(d.points[0].y);
        const x1 = toPixelX(d.points[1].x);
        const y1 = toPixelY(d.points[1].y);
        const rx = Math.min(x0, x1);
        const ry = Math.min(y0, y1);
        const rw = Math.max(2, Math.abs(x1 - x0));
        const rh = Math.max(2, Math.abs(y1 - y0));

        // Semi-transparent zone fill
        ctx.fillStyle = d.fillColor || `${color}25`;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      }
    } else if (
      d.type === 'arrow-up' ||
      d.type === 'arrow-down'
    ) {
      if (d.points.length >= 2) {
        const x0 = toPixelX(d.points[0].x);
        const y0 = toPixelY(d.points[0].y);
        const x1 = toPixelX(d.points[1].x);
        const y1 = toPixelY(d.points[1].y);

        // Arrow shaft
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        // Arrow head at target point
        const angle = Math.atan2(y1 - y0, x1 - x0);
        const headLen = Math.max(12, 16 * scale);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(
          x1 - headLen * Math.cos(angle - Math.PI / 6),
          y1 - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x1 - headLen * Math.cos(angle + Math.PI / 6),
          y1 - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }
    } else if (d.type === 'line') {
      if (d.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(toPixelX(d.points[0].x), toPixelY(d.points[0].y));
        ctx.lineTo(toPixelX(d.points[1].x), toPixelY(d.points[1].y));
        ctx.stroke();

        // Small endpoint dots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(toPixelX(d.points[0].x), toPixelY(d.points[0].y), 3 * scale, 0, Math.PI * 2);
        ctx.arc(toPixelX(d.points[1].x), toPixelY(d.points[1].y), 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Freehand / pen polyline
      if (d.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(toPixelX(d.points[0].x), toPixelY(d.points[0].y));
        for (let i = 1; i < d.points.length; i++) {
          ctx.lineTo(toPixelX(d.points[i].x), toPixelY(d.points[i].y));
        }
        ctx.stroke();
      }
    }

    // Draw Selected Highlight Box
    if (isSelected && d.points.length > 0) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      d.points.forEach((pt) => {
        const px = toPixelX(pt.x);
        const py = toPixelY(pt.y);
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      });

      if (minX !== Infinity) {
        const pad = Math.round(8 * scale);
        ctx.save();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5 * scale;
        ctx.setLineDash([5 * scale, 4 * scale]);
        ctx.strokeRect(
          minX - pad,
          minY - pad,
          maxX - minX + pad * 2,
          maxY - minY + pad * 2
        );
        ctx.setLineDash([]);

        // Small corner nodes
        const nodeSize = 6 * scale;
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(minX - pad - nodeSize / 2, minY - pad - nodeSize / 2, nodeSize, nodeSize);
        ctx.fillRect(maxX + pad - nodeSize / 2, minY - pad - nodeSize / 2, nodeSize, nodeSize);
        ctx.fillRect(minX - pad - nodeSize / 2, maxY + pad - nodeSize / 2, nodeSize, nodeSize);
        ctx.fillRect(maxX + pad - nodeSize / 2, maxY + pad - nodeSize / 2, nodeSize, nodeSize);

        // "Drag to Move" visual indicator badge
        const badgeText = '✥ Drag to Move';
        ctx.font = `600 ${Math.max(10, Math.round(11 * scale))}px system-ui, -apple-system, sans-serif`;
        const textMetrics = ctx.measureText(badgeText);
        const badgeW = textMetrics.width + 12 * scale;
        const badgeH = 18 * scale;
        const badgeX = minX - pad;
        const badgeY = Math.max(4, minY - pad - badgeH - 3 * scale);

        ctx.fillStyle = 'rgba(10, 14, 23, 0.92)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4 * scale);
        } else {
          ctx.rect(badgeX, badgeY, badgeW, badgeH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#67e8f9';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, badgeX + 6 * scale, badgeY + badgeH / 2);

        ctx.restore();
      }
    }

    ctx.restore();
  };

  // 3. Draw Saved User Drawings (Freehand, Rectangle, Line, Arrows)
  if (userDrawings && userDrawings.length > 0) {
    userDrawings.forEach((d) => {
      renderShape(d, selectedDrawingId === d.id);
    });
  }

  // 3b. Draw Active Shape Preview while user is actively drawing
  if (activeDrawingPreview && activeDrawingPreview.points.length > 0) {
    renderShape(activeDrawingPreview, false);
  }

  // 4. Draw Active Path Tool In-Progress Waypoints & Straight Guide Segments
  if (isPathDrawing && activePathPoints.length > 0) {
    ctx.save();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
    ctx.shadowBlur = 8 * scale;

    // Draw confirmed straight path segments
    ctx.beginPath();
    ctx.moveTo(toPixelX(activePathPoints[0].x), toPixelY(activePathPoints[0].y));
    for (let i = 1; i < activePathPoints.length; i++) {
      ctx.lineTo(toPixelX(activePathPoints[i].x), toPixelY(activePathPoints[i].y));
    }
    ctx.stroke();

    // Draw dashed straight guide line to current cursor
    if (cursorPoint) {
      const lastPoint = activePathPoints[activePathPoints.length - 1];
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5 * scale;
      ctx.setLineDash([5 * scale, 4 * scale]);
      ctx.beginPath();
      ctx.moveTo(toPixelX(lastPoint.x), toPixelY(lastPoint.y));
      ctx.lineTo(toPixelX(cursorPoint.x), toPixelY(cursorPoint.y));
      ctx.stroke();
      ctx.restore();
    }

    // Draw distinct circular waypoints on each click
    activePathPoints.forEach((pt, idx) => {
      ctx.fillStyle = idx === 0 ? '#10b981' : '#06b6d4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(toPixelX(pt.x), toPixelY(pt.y), 5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();
  }

  // 5. Draw Live Active Freehand Pen Stroke while user is dragging
  if (livePenPoints && livePenPoints.length > 1) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(toPixelX(livePenPoints[0].x), toPixelY(livePenPoints[0].y));
    for (let i = 1; i < livePenPoints.length; i++) {
      ctx.lineTo(toPixelX(livePenPoints[i].x), toPixelY(livePenPoints[i].y));
    }
    ctx.stroke();
    ctx.restore();
  }

  // 6. Draw Realistic Candlesticks (Only when path has at least 2 points)
  if (candles.length > 0 && pathPoints.length >= 2) {
    const animState = getLiveAnimationState(candles, currentTimeRatio);
    const allToRender = [...animState.completedCandles];
    if (animState.activeCandle) {
      allToRender.push(animState.activeCandle);
    }

    // Calculate distance between adjacent candles to guarantee proportional unsqueezed width
    let minSpatialDist = Infinity;
    for (let i = 0; i < candles.length - 1; i++) {
      const c1 = candles[i];
      const c2 = candles[i + 1];
      const dx = (c2.xNormalized - c1.xNormalized) * contentWidth;
      const dy = (c2.yNormalized - c1.yNormalized) * contentHeight;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1 && dist < minSpatialDist) {
        minSpatialDist = dist;
      }
    }

    if (minSpatialDist === Infinity) {
      minSpatialDist = (contentWidth * 0.4) / Math.max(5, candles.length);
    }

    // Candle body width is scaled to fit comfortably along trajectory
    const maxSafeWidth = Math.max(3 * scale, minSpatialDist * 0.75);
    const baseWidth = Math.max(3 * scale, (contentWidth * 0.35) / Math.max(8, candles.length));
    const targetW = baseWidth * (candleSizing?.widthScale || 0.65);
    const effectiveCandleW = Math.max(2 * scale, Math.min(maxSafeWidth, targetW));
    const halfW = effectiveCandleW / 2;

    allToRender.forEach((c) => {
      if (!c || typeof c.openNormY !== 'number' || typeof c.xNormalized !== 'number') return;
      const cx = toPixelX(c.xNormalized);
      
      const openY = toPixelY(c.openNormY);
      const closeY = toPixelY(typeof c.closeNormY === 'number' ? c.closeNormY : c.openNormY);
      const highY = toPixelY(typeof c.highNormY === 'number' ? c.highNormY : Math.min(openY, closeY));
      const lowY = toPixelY(typeof c.lowNormY === 'number' ? c.lowNormY : Math.max(openY, closeY));

      const isBull = c.isBullish;
      const bodyFill = isBull ? bullishColor : bearishColor;
      const bodyStroke = isBull ? bullishColor : bearishColor;
      const wickColor = isBull ? bullishColor : bearishColor;

      ctx.save();
      
      // Draw Center Wick (High to Low)
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = Math.max(1, Math.min(2.5 * scale, effectiveCandleW * 0.18));
      ctx.beginPath();
      ctx.moveTo(cx, highY);
      ctx.lineTo(cx, lowY);
      ctx.stroke();

      // Draw Candle Body (Between Open & Close)
      const topY = Math.min(openY, closeY);
      const bodyH = Math.max(1.5 * scale, Math.abs(closeY - openY));

      ctx.fillStyle = bodyFill;
      ctx.strokeStyle = bodyStroke;
      ctx.lineWidth = 1;
      ctx.fillRect(cx - halfW, topY, effectiveCandleW, bodyH);
      ctx.strokeRect(cx - halfW, topY, effectiveCandleW, bodyH);

      ctx.restore();
    });
  }

  // 7. Draw User Text Annotations
  if (userTexts && userTexts.length > 0) {
    userTexts.forEach((t) => {
      if (!t || !t.text) return;
      ctx.save();
      const centerX = toPixelX(t.x);
      const centerY = toPixelY(t.y);
      const isSelected = selectedTextId === t.id;

      const fontFam = t.fontFamily || 'Plus Jakarta Sans, sans-serif';
      const weight = t.fontWeight || 'bold';
      const size = Math.max(10, Math.round((t.fontSize || 18) * scale));

      ctx.font = `${weight} ${size}px "${fontFam}", sans-serif`;
      const textMetrics = ctx.measureText(t.text);
      const textW = Math.max(16 * scale, textMetrics.width);
      const textH = size * 1.2;

      const padX = Math.round(10 * scale);
      const padY = Math.round(6 * scale);
      const boxW = textW + padX * 2;
      const boxH = textH + padY * 2;
      const boxX = centerX - boxW / 2;
      const boxY = centerY - boxH / 2;
      const cornerRadius = Math.round(8 * scale);

      // Draw Background Pill / Badge
      const bg = t.backgroundColor || 'rgba(15, 23, 42, 0.85)';
      if (bg !== 'transparent') {
        ctx.fillStyle = bg;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(boxX, boxY, boxW, boxH, cornerRadius);
        } else {
          ctx.rect(boxX, boxY, boxW, boxH);
        }
        ctx.fill();
      }

      // Draw Optional Border / Glow
      if (t.hasBorder && t.borderColor) {
        ctx.strokeStyle = t.borderColor;
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(boxX, boxY, boxW, boxH, cornerRadius);
        } else {
          ctx.rect(boxX, boxY, boxW, boxH);
        }
        ctx.stroke();
      }

      // Draw Selection Highlight
      if (isSelected) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2 * scale;
        ctx.setLineDash([5 * scale, 4 * scale]);
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(boxX - 2 * scale, boxY - 2 * scale, boxW + 4 * scale, boxH + 4 * scale, cornerRadius + 2);
        } else {
          ctx.rect(boxX - 2 * scale, boxY - 2 * scale, boxW + 4 * scale, boxH + 4 * scale);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Corner indicator
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(boxX + boxW + 2 * scale, boxY + boxH + 2 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Shadow if enabled
      if (t.hasShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 6 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;
      }

      // Draw Text String Centered Exactly
      ctx.fillStyle = t.color || '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, centerX, centerY);

      ctx.restore();
    });
  }

  // 8. Draw Financial Disclaimer Watermark Badge at designated angle/corner
  const showWatermark = exportSettings?.showWatermark !== false;
  if (showWatermark && (isExporting || exportSettings?.showWatermark)) {
    ctx.save();

    const titleText = exportSettings?.watermarkText || '⚠️ NOT FINANCIAL ADVICE • DO YOUR OWN RESEARCH (DYOR)';
    const subText = "DO NOT TRADE • AI ANIMATION CONTENT ONLY";
    const authorHandle = exportSettings?.authorHandle ? `@${exportSettings.authorHandle.replace(/^@/, '')}` : null;
    const position = exportSettings?.watermarkPosition || 'bottom-left';

    const titleFontSize = Math.max(9, Math.round(11 * scale));
    const subFontSize = Math.max(8, Math.round(9.5 * scale));
    const tagFontSize = Math.max(8, Math.round(9 * scale));

    const fontFam = 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    ctx.font = `bold ${titleFontSize}px ${fontFam}`;
    const titleMetrics = ctx.measureText(titleText);
    
    ctx.font = `600 ${subFontSize}px ${fontFam}`;
    const subMetrics = ctx.measureText(subText);

    let tagMetrics = { width: 0 };
    if (authorHandle) {
      ctx.font = `bold ${tagFontSize}px "JetBrains Mono", monospace`;
      tagMetrics = ctx.measureText(authorHandle);
    }

    const padX = Math.round(10 * scale);
    const padY = Math.round(7 * scale);
    const lineGap = Math.round(3 * scale);

    const maxTextW = Math.max(titleMetrics.width, subMetrics.width, tagMetrics.width);
    const boxW = maxTextW + padX * 2;
    const titleH = titleFontSize * 1.2;
    const subH = subFontSize * 1.2;
    const tagH = authorHandle ? tagFontSize * 1.2 + lineGap : 0;
    const boxH = padY * 2 + titleH + subH + lineGap + tagH;

    const marginX = Math.round(14 * scale);
    const marginY = Math.round(14 * scale);

    let boxX = marginX;
    let boxY = height - marginY - boxH;

    if (position === 'bottom-right') {
      boxX = width - marginX - boxW;
      boxY = height - marginY - boxH;
    } else if (position === 'top-left') {
      boxX = marginX;
      boxY = marginY;
    } else if (position === 'top-right') {
      boxX = width - marginX - boxW;
      boxY = marginY;
    } else {
      // bottom-left is default
      boxX = marginX;
      boxY = height - marginY - boxH;
    }

    const radius = Math.round(8 * scale);

    // Draw Glassmorphism Container with subtle amber border
    ctx.fillStyle = 'rgba(10, 14, 22, 0.88)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2 * scale;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxW, boxH, radius);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.stroke();

    // Reset shadow for crisp text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw Title (Amber Warning)
    const textStartX = boxX + padX;
    let currentY = boxY + padY + titleH / 2;

    ctx.font = `bold ${titleFontSize}px ${fontFam}`;
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, textStartX, currentY);

    // Draw Subtitle (Slate 200)
    currentY += titleH / 2 + lineGap + subH / 2;
    ctx.font = `600 ${subFontSize}px ${fontFam}`;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(subText, textStartX, currentY);

    // Draw Author Tag if present
    if (authorHandle) {
      currentY += subH / 2 + lineGap + tagFontSize * 0.6;
      ctx.font = `bold ${tagFontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(authorHandle, textStartX, currentY);
    }

    ctx.restore();
  }

  ctx.restore();
}

