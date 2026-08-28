import { Point, Candle } from '../types';

/**
 * Computes cumulative Euclidean arc lengths along the path.
 * Guarantees uniform equidistant sampling along any polyline or freehand trajectory.
 */
export function computePathArcLengths(points: Point[]): {
  totalLength: number;
  cumulativeDistances: number[];
} {
  if (!points || points.length === 0) {
    return { totalLength: 0, cumulativeDistances: [0] };
  }

  const cumulativeDistances: number[] = [0];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    totalLength += dist;
    cumulativeDistances.push(totalLength);
  }

  return { totalLength, cumulativeDistances };
}

/**
 * Samples a point at exact arc-length fraction t (0.0 to 1.0).
 * Produces perfectly equidistant sampling along the entire trajectory.
 */
export function getPointAtArcLengthFraction(
  points: Point[],
  t: number,
  arcData?: { totalLength: number; cumulativeDistances: number[] }
): Point {
  if (!points || points.length === 0) {
    return { x: 0.5, y: 0.5 };
  }
  if (points.length === 1) {
    return points[0];
  }

  const { totalLength, cumulativeDistances } =
    arcData || computePathArcLengths(points);

  if (totalLength === 0 || cumulativeDistances.length < 2) {
    return points[0];
  }

  const clampedT = Math.max(0, Math.min(1, t));
  const targetDist = clampedT * totalLength;

  let segIndex = 0;
  for (let i = 0; i < cumulativeDistances.length - 1; i++) {
    if (
      targetDist >= cumulativeDistances[i] &&
      targetDist <= cumulativeDistances[i + 1]
    ) {
      segIndex = i;
      break;
    }
    if (i === cumulativeDistances.length - 2) {
      segIndex = i;
    }
  }

  const segStartDist = cumulativeDistances[segIndex];
  const segEndDist = cumulativeDistances[segIndex + 1];
  const segLength = segEndDist - segStartDist;

  if (segLength <= 0.000001) {
    return points[segIndex];
  }

  const segFraction = Math.max(0, Math.min(1, (targetDist - segStartDist) / segLength));
  const p1 = points[segIndex];
  const p2 = points[segIndex + 1];

  return {
    x: p1.x + (p2.x - p1.x) * segFraction,
    y: p1.y + (p2.y - p1.y) * segFraction,
  };
}

/**
 * Generate authentic financial candlesticks along the drawn trajectory.
 * Guarantees that the first candle starts EXACTLY at the user's initial waypoint (pathPoints[0]),
 * and all candles strictly follow the drawn path coordinates with no auto-displacement.
 */
export function generateCandlesAlongPath(
  pathPoints: Point[],
  candleCount: number = 22,
  heightScale: number = 0.85,
  spacingScale: number = 1.0
): Candle[] {
  if (!pathPoints || pathPoints.length < 2) {
    return [];
  }

  const arcData = computePathArcLengths(pathPoints);
  if (arcData.totalLength <= 0.0001) {
    return [];
  }

  // Spacing Scale: smaller = closer candles (more dense), larger = farther candles (less dense)
  const safeSpacing = Math.max(0.25, Math.min(3.0, spacingScale || 1.0));
  const baseCount = Math.max(4, Math.min(80, candleCount || 22));
  
  // Calculate effective candle count so candles follow path evenly
  const effectiveCandleCount = Math.max(
    2,
    Math.min(80, Math.round(baseCount / safeSpacing))
  );

  const candles: Candle[] = [];
  let previousCloseNormY = pathPoints[0].y;

  for (let i = 0; i < effectiveCandleCount; i++) {
    // Current candle position along the path from 0.0 (start) to 1.0 (end)
    const tCurrent = effectiveCandleCount > 1 ? i / (effectiveCandleCount - 1) : 0;
    const ptCurrent = getPointAtArcLengthFraction(pathPoints, tCurrent, arcData);

    // Next point along the path for calculating candle close direction
    const tNext = effectiveCandleCount > 1 ? Math.min(1.0, (i + 1) / (effectiveCandleCount - 1)) : 1.0;
    const ptNext = getPointAtArcLengthFraction(pathPoints, tNext, arcData);

    const candleX = ptCurrent.x;
    const openNormY = i === 0 ? pathPoints[0].y : previousCloseNormY;
    
    // For intermediate candles, close moves toward the next segment point
    const closeNormY = i === effectiveCandleCount - 1 ? ptCurrent.y : ptNext.y;

    // In charts, smaller Y = higher price (Bullish)
    const isBullish = closeNormY <= openNormY;
    const bodyHeightNorm = Math.abs(closeNormY - openNormY);

    // Dynamic clean wicks matching price movement
    const topOfBodyNormY = Math.min(openNormY, closeNormY);
    const bottomOfBodyNormY = Math.max(openNormY, closeNormY);

    const wickExtension = Math.max(0.003, bodyHeightNorm * 0.25) * heightScale;
    const highNormY = Math.max(0.002, topOfBodyNormY - wickExtension);
    const lowNormY = Math.min(0.998, bottomOfBodyNormY + wickExtension);

    candles.push({
      open: 100,
      high: 105,
      low: 95,
      close: isBullish ? 103 : 97,
      volume: 1500,
      xNormalized: candleX,
      yNormalized: closeNormY,
      openNormY,
      closeNormY,
      highNormY,
      lowNormY,
      isBullish,
      timeIndex: i,
    });

    previousCloseNormY = closeNormY;
  }

  return candles;
}

/**
 * Calculates current live candle state given progress ratio t (0.0 to 1.0)
 */
export function getLiveAnimationState(
  candles: Candle[],
  progressRatio: number
) {
  if (!Array.isArray(candles) || candles.length === 0) {
    return {
      completedCandles: [],
      activeCandle: null,
      progressRatio: 0,
      activeCandleIndex: 0,
    };
  }

  const safeRatio =
    typeof progressRatio === 'number' && !isNaN(progressRatio)
      ? Math.max(0, Math.min(1, progressRatio))
      : 0;

  const totalCandles = candles.length;
  const currentFloatIndex = Math.max(
    0,
    Math.min(safeRatio * totalCandles, totalCandles - 0.0001)
  );
  const activeCandleIndex = Math.max(
    0,
    Math.min(totalCandles - 1, Math.floor(currentFloatIndex))
  );
  const candleInternalProgress = Math.max(
    0,
    Math.min(1, currentFloatIndex - activeCandleIndex)
  );

  const completedCandles = candles
    .slice(0, activeCandleIndex)
    .filter((c): c is Candle => Boolean(c && typeof c.openNormY === 'number'));
  const fullCandle = candles[activeCandleIndex];

  if (!fullCandle || typeof fullCandle.openNormY !== 'number') {
    return {
      completedCandles,
      activeCandle: null,
      progressRatio: safeRatio,
      activeCandleIndex,
    };
  }

  const openNormY = fullCandle.openNormY;
  const targetCloseNormY =
    typeof fullCandle.closeNormY === 'number'
      ? fullCandle.closeNormY
      : openNormY;
  const targetHighNormY =
    typeof fullCandle.highNormY === 'number'
      ? fullCandle.highNormY
      : Math.min(openNormY, targetCloseNormY);
  const targetLowNormY =
    typeof fullCandle.lowNormY === 'number'
      ? fullCandle.lowNormY
      : Math.max(openNormY, targetCloseNormY);

  // Micro-tick geometry interpolation
  const liveCloseNormY =
    openNormY + (targetCloseNormY - openNormY) * candleInternalProgress;

  const isLiveBullish = liveCloseNormY <= openNormY;

  // Live wicks expand as candle develops
  const liveHighNormY = Math.min(
    openNormY,
    liveCloseNormY,
    openNormY +
      (targetHighNormY - openNormY) *
        Math.min(1, candleInternalProgress * 1.4)
  );

  const liveLowLow = Math.max(
    openNormY,
    liveCloseNormY,
    openNormY +
      (targetLowNormY - openNormY) *
        Math.min(1, candleInternalProgress * 1.4)
  );

  const activeCandle: Candle = {
    ...fullCandle,
    openNormY,
    closeNormY: liveCloseNormY,
    highNormY: liveHighNormY,
    lowNormY: liveLowLow,
    isBullish: isLiveBullish,
  };

  return {
    completedCandles,
    activeCandle,
    progressRatio: safeRatio,
    activeCandleIndex,
  };
}
