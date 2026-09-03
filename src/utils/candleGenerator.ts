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
 * Samples a point along the path trajectory at arc distance `dist`.
 * - For dist <= 0: returns exact start point (points[0]).
 * - For dist in [0, totalLength]: returns exact point along the drawn path.
 * - For dist > totalLength: smoothly extrapolates along the exit direction vector of the
 *   final segment to prevent overlay when candles have reached minimum width.
 */
export function getTrajectoryPointAtDistance(
  points: Point[],
  dist: number,
  arcData: { totalLength: number; cumulativeDistances: number[] }
): Point {
  if (!points || points.length === 0) {
    return { x: 0.5, y: 0.5 };
  }
  if (points.length === 1) {
    return points[0];
  }

  const L = arcData.totalLength;
  if (dist <= 0.00001) {
    return { x: points[0].x, y: points[0].y };
  }

  if (dist <= L) {
    const fraction = Math.max(0, Math.min(1, dist / L));
    return getPointAtArcLengthFraction(points, fraction, arcData);
  }

  // Beyond path stop (overflow expansion to prevent overlay on very short paths)
  const lastIdx = points.length - 1;
  const pEnd = points[lastIdx];
  const pPrev = points[Math.max(0, lastIdx - 1)];
  const dx = pEnd.x - pPrev.x;
  const dy = pEnd.y - pPrev.y;
  const segLen = Math.hypot(dx, dy);

  if (segLen <= 0.0001) {
    return { x: pEnd.x, y: pEnd.y };
  }

  const excess = dist - L;
  return {
    x: Math.max(0.001, Math.min(0.999, pEnd.x + (dx / segLen) * excess)),
    y: Math.max(0.001, Math.min(0.999, pEnd.y + (dy / segLen) * excess)),
  };
}

/**
 * Generate authentic financial candlesticks along the drawn trajectory.
 * 
 * - Strictly follows the user's drawn path trajectory from start to stop.
 * - Starts at the point where the path starts, and stops where the path stops.
 * - Auto-adjusts candle spacing, width, and height to fit seamlessly.
 * - Only expands beyond the path stop when the candles have reached their lowest width/height
 *   and cannot fit inside the drawn path without overlaying.
 * - Clamps final candle wicks so they never overshoot or float above the destination.
 */
export function generateCandlesAlongPath(
  pathPoints: Point[],
  candleCount: number = 22,
  heightScale: number = 0.85,
  spacingScale: number = 1.0,
  autoAdjust: boolean = true
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
    3,
    Math.min(80, Math.round(baseCount / safeSpacing))
  );

  const totalLength = arcData.totalLength;
  const startPoint = pathPoints[0];
  const endPoint = pathPoints[pathPoints.length - 1];

  // Minimum safe step along the path between candle centers to avoid horizontal/spatial overlay
  const minSafeStep = 0.0075 * safeSpacing;
  const minRequiredDist = (effectiveCandleCount - 1) * minSafeStep;

  // Determine trajectory step and total span
  let stepDist: number;
  let totalTrajectoryDist: number;

  if (autoAdjust) {
    if (totalLength >= minRequiredDist) {
      // Standard: Candles fit within path by auto-adjusting space, width, and height.
      // Starts at start point, stops EXACTLY at destination point.
      stepDist = totalLength / (effectiveCandleCount - 1);
      totalTrajectoryDist = totalLength;
    } else {
      // Exception: Candles have fit to lowest width/height, but path is too short to fit all.
      // Expands along the path trajectory past the stop point just enough to avoid overlay.
      stepDist = minSafeStep;
      totalTrajectoryDist = (effectiveCandleCount - 1) * stepDist;
    }
  } else {
    // Manual Raw Mode: Strictly divide total length by candle count
    stepDist = totalLength / (effectiveCandleCount - 1);
    totalTrajectoryDist = totalLength;
  }

  const candles: Candle[] = [];
  let previousCloseNormY = startPoint.y;

  for (let i = 0; i < effectiveCandleCount; i++) {
    const sCurrent = i * stepDist;
    const ptCurrent = getTrajectoryPointAtDistance(pathPoints, sCurrent, arcData);

    const sNext = Math.min(totalTrajectoryDist, (i + 1) * stepDist);
    const ptNext = getTrajectoryPointAtDistance(pathPoints, sNext, arcData);

    // Candle X coordinate strictly follows the path trajectory
    const candleX = ptCurrent.x;

    // Open: First candle opens at exact path start point Y; subsequent candles open at previous close
    const openNormY = i === 0 ? startPoint.y : previousCloseNormY;

    // Close: Last candle closes at exact destination point Y (when not expanded);
    // intermediate candles close toward next path waypoint point Y
    let closeNormY: number;
    if (i === effectiveCandleCount - 1) {
      // Final candle terminates at destination point
      closeNormY = totalLength >= minRequiredDist ? endPoint.y : ptCurrent.y;
    } else {
      let targetY = ptNext.y;
      // Prevent completely flat zero-height body if segment is purely horizontal
      if (Math.abs(targetY - openNormY) < 0.0015) {
        const tinyOffset = ((i % 2 === 0 ? 1 : -1) * 0.003) * heightScale;
        targetY = openNormY + tinyOffset;
      }
      closeNormY = targetY;
    }

    // In chart coordinates: smaller Y = higher price (Bullish)
    const isBullish = closeNormY <= openNormY;
    const bodyHeightNorm = Math.abs(closeNormY - openNormY);

    const topOfBodyNormY = Math.min(openNormY, closeNormY);
    const bottomOfBodyNormY = Math.max(openNormY, closeNormY);

    let highNormY: number;
    let lowNormY: number;

    if (i === effectiveCandleCount - 1 && totalLength >= minRequiredDist) {
      // DESTINATION CANDLE:
      // Strictly clamp wicks at destination point so the candle never shoots above/below destination!
      if (isBullish) {
        // Bullish close is at topOfBodyNormY: Do not overshoot above the destination point!
        highNormY = topOfBodyNormY;
        lowNormY = Math.min(0.998, bottomOfBodyNormY + Math.max(0.002, bodyHeightNorm * 0.2) * heightScale);
      } else {
        // Bearish close is at bottomOfBodyNormY: Do not overshoot below the destination point!
        lowNormY = bottomOfBodyNormY;
        highNormY = Math.max(0.002, topOfBodyNormY - Math.max(0.002, bodyHeightNorm * 0.2) * heightScale);
      }
    } else {
      // INTERMEDIATE CANDLES:
      const pseudoRand = Math.sin(i * 791.9 + 23.4) * 0.5 + 0.5;
      const wickBase = Math.max(0.002, bodyHeightNorm * 0.22) * heightScale;
      const upperWick = wickBase * (isBullish ? 0.65 + 0.25 * pseudoRand : 0.35 + 0.2 * pseudoRand);
      const lowerWick = wickBase * (isBullish ? 0.35 + 0.2 * pseudoRand : 0.65 + 0.25 * pseudoRand);

      highNormY = Math.max(0.002, topOfBodyNormY - upperWick);
      lowNormY = Math.min(0.998, bottomOfBodyNormY + lowerWick);
    }

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
