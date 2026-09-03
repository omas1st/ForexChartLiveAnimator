import { Point, UserDrawing } from '../types';
import { computePathArcLengths, getPointAtArcLengthFraction } from './candleGenerator';

/**
 * Calculates Euclidean distance between point p and line segment v-w in pixel space.
 */
export function distToSegment(
  p: Point,
  v: Point,
  w: Point,
  width: number,
  height: number
): number {
  const px = p.x * width;
  const py = p.y * height;
  const vx = v.x * width;
  const vy = v.y * height;
  const wx = w.x * width;
  const wy = w.y * height;

  const dx = wx - vx;
  const dy = wy - vy;
  const l2 = dx * dx + dy * dy;

  if (l2 === 0) {
    return Math.hypot(px - vx, py - vy);
  }

  let t = ((px - vx) * dx + (py - vy) * dy) / l2;
  t = Math.max(0, Math.min(1, t));

  const projX = vx + t * dx;
  const projY = vy + t * dy;

  return Math.hypot(px - projX, py - projY);
}

/**
 * Checks if normalized point pt is within threshold pixels of a user drawing.
 */
export function isPointNearDrawing(
  pt: Point,
  drawing: UserDrawing,
  width: number,
  height: number,
  thresholdPixels: number = 18
): boolean {
  if (!drawing.points || drawing.points.length === 0) return false;

  const px = pt.x * width;
  const py = pt.y * height;

  if (drawing.type === 'rectangle' || drawing.type === 'box') {
    if (drawing.points.length < 2) return false;
    const p0 = drawing.points[0];
    const p1 = drawing.points[1];
    const minX = Math.min(p0.x, p1.x) * width - thresholdPixels;
    const maxX = Math.max(p0.x, p1.x) * width + thresholdPixels;
    const minY = Math.min(p0.y, p1.y) * height - thresholdPixels;
    const maxY = Math.max(p0.y, p1.y) * height + thresholdPixels;
    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  }

  if (
    drawing.type === 'line' ||
    drawing.type === 'arrow-up' ||
    drawing.type === 'arrow-down'
  ) {
    if (drawing.points.length < 2) return false;
    return (
      distToSegment(pt, drawing.points[0], drawing.points[1], width, height) <=
      thresholdPixels
    );
  }

  // Freehand / pen polyline
  for (let i = 0; i < drawing.points.length - 1; i++) {
    const dist = distToSegment(
      pt,
      drawing.points[i],
      drawing.points[i + 1],
      width,
      height
    );
    if (dist <= thresholdPixels) {
      return true;
    }
  }

  return false;
}

/**
 * Finds the topmost drawing hit by the pointer click.
 */
export function findHitDrawing(
  pt: Point,
  drawings: UserDrawing[],
  width: number,
  height: number
): UserDrawing | null {
  if (!drawings || drawings.length === 0) return null;
  // Iterate from top to bottom (last drawn is top)
  for (let i = drawings.length - 1; i >= 0; i--) {
    if (isPointNearDrawing(pt, drawings[i], width, height)) {
      return drawings[i];
    }
  }
  return null;
}

/**
 * Converts ANY technical drawing into a clean set of waypoints for candlestick generation!
 * Enables the trader to turn any shape/line/freehand pattern into an animated candlestick pattern.
 */
export function convertDrawingToPathPoints(drawing: UserDrawing): Point[] {
  if (!drawing.points || drawing.points.length === 0) {
    return [];
  }

  // 1. Straight Line or Arrows: Sample 6-10 equidistant points from start to end
  if (
    drawing.type === 'line' ||
    drawing.type === 'arrow-up' ||
    drawing.type === 'arrow-down'
  ) {
    if (drawing.points.length < 2) return [];
    const p0 = drawing.points[0];
    const p1 = drawing.points[1];
    const count = 8;
    const pts: Point[] = [];
    for (let i = 0; i < count; i++) {
      const frac = i / (count - 1);
      pts.push({
        x: p0.x + (p1.x - p0.x) * frac,
        y: p0.y + (p1.y - p0.y) * frac,
      });
    }
    return pts;
  }

  // 2. Rectangle: Generates an ascending or descending swing structure through the box
  if (drawing.type === 'rectangle' || drawing.type === 'box') {
    if (drawing.points.length < 2) return [];
    const p0 = drawing.points[0];
    const p1 = drawing.points[1];
    const leftX = Math.min(p0.x, p1.x);
    const rightX = Math.max(p0.x, p1.x);
    const topY = Math.min(p0.y, p1.y);
    const botY = Math.max(p0.y, p1.y);

    // Create a 4-point price oscillation/structure through the order block zone
    return [
      { x: leftX, y: botY },
      { x: leftX + (rightX - leftX) * 0.33, y: topY },
      { x: leftX + (rightX - leftX) * 0.66, y: botY * 0.8 + topY * 0.2 },
      { x: rightX, y: topY },
    ];
  }

  // 3. Freehand / Pen: Sub-sample along arc-length so candles are smooth without jitter
  if (drawing.points.length <= 16) {
    return drawing.points;
  }

  const arcData = computePathArcLengths(drawing.points);
  const sampleCount = Math.min(26, Math.max(10, Math.round(arcData.totalLength * 40)));
  const sampledPts: Point[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const t = i / (sampleCount - 1);
    sampledPts.push(getPointAtArcLengthFraction(drawing.points, t, arcData));
  }

  return sampledPts;
}

/**
 * Computes bounding box for drawing selection UI
 */
export function getDrawingBoundingBox(
  drawing: UserDrawing,
  width: number,
  height: number
): { minX: number; minY: number; maxX: number; maxY: number; centerX: number; centerY: number } {
  if (!drawing.points || drawing.points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, centerX: 0, centerY: 0 };
  }

  let minX = drawing.points[0].x * width;
  let maxX = drawing.points[0].x * width;
  let minY = drawing.points[0].y * height;
  let maxY = drawing.points[0].y * height;

  drawing.points.forEach((p) => {
    const px = p.x * width;
    const py = p.y * height;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}
