import { CandleData } from './candleStore';

/**
 * High-performance, numerical technical analysis algorithms
 * Designed for 60FPS canvas rendering on financial charts.
 */

// Simple Moving Average (SMA)
export function calculateSMA(candles: CandleData[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period || period <= 0) return result;

  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) {
      sum -= candles[i - period].close;
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }
  return result;
}

// Exponential Moving Average (EMA)
export function calculateEMA(candles: CandleData[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period || period <= 0) return result;

  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEma = sum / period;
  result[period - 1] = prevEma;

  for (let i = period; i < candles.length; i++) {
    prevEma = candles[i].close * k + prevEma * (1 - k);
    result[i] = prevEma;
  }
  return result;
}

// Weighted Moving Average (WMA)
export function calculateWMA(candles: CandleData[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period || period <= 0) return result;

  const weightSum = (period * (period + 1)) / 2;

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close * (period - j);
    }
    result[i] = sum / weightSum;
  }
  return result;
}

// Bollinger Bands (Upper, Middle, Lower)
export function calculateBollingerBands(
  candles: CandleData[],
  period = 20,
  stdDevMultiplier = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = calculateSMA(candles, period);
  const upper: (number | null)[] = new Array(candles.length).fill(null);
  const lower: (number | null)[] = new Array(candles.length).fill(null);

  if (candles.length < period) return { upper, middle, lower };

  for (let i = period - 1; i < candles.length; i++) {
    const mean = middle[i];
    if (mean === null) continue;

    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      const diff = candles[i - j].close - mean;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper[i] = mean + stdDev * stdDevMultiplier;
    lower[i] = mean - stdDev * stdDevMultiplier;
  }

  return { upper, middle, lower };
}

// Average True Range (ATR)
export function calculateATR(candles: CandleData[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < 2) return result;

  const trs: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    trs.push(tr);
  }

  if (trs.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trs[i];
  }
  let prevAtr = sum / period;
  result[period - 1] = prevAtr;

  for (let i = period; i < candles.length; i++) {
    prevAtr = (prevAtr * (period - 1) + trs[i]) / period;
    result[i] = prevAtr;
  }

  return result;
}

// SuperTrend (Trend indicator with ATR multiplier)
export function calculateSuperTrend(
  candles: CandleData[],
  period = 10,
  multiplier = 3
): { line: (number | null)[]; isBullish: (boolean | null)[] } {
  const atr = calculateATR(candles, period);
  const line: (number | null)[] = new Array(candles.length).fill(null);
  const isBullish: (boolean | null)[] = new Array(candles.length).fill(null);

  if (candles.length < period) return { line, isBullish };

  let inTrend = true;
  let prevUpper = 0;
  let prevLower = 0;

  for (let i = period - 1; i < candles.length; i++) {
    const c = candles[i];
    const curAtr = atr[i] || (c.high - c.low);
    const hl2 = (c.high + c.low) / 2;

    let basicUpper = hl2 + multiplier * curAtr;
    let basicLower = hl2 - multiplier * curAtr;

    const prevClose = i > 0 ? candles[i - 1].close : c.close;

    let finalUpper = (basicUpper < prevUpper || prevClose > prevUpper) ? basicUpper : prevUpper;
    let finalLower = (basicLower > prevLower || prevClose < prevLower) ? basicLower : prevLower;

    if (inTrend) {
      if (c.close < finalLower) {
        inTrend = false;
        line[i] = finalUpper;
      } else {
        line[i] = finalLower;
      }
    } else {
      if (c.close > finalUpper) {
        inTrend = true;
        line[i] = finalLower;
      } else {
        line[i] = finalUpper;
      }
    }

    isBullish[i] = inTrend;
    prevUpper = finalUpper;
    prevLower = finalLower;
  }

  return { line, isBullish };
}

// Parabolic SAR
export function calculateParabolicSAR(
  candles: CandleData[],
  step = 0.02,
  maximum = 0.2
): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < 3) return result;

  let isUp = candles[1].close >= candles[0].close;
  let sar = isUp ? candles[0].low : candles[0].high;
  let ep = isUp ? candles[1].high : candles[1].low;
  let af = step;

  result[1] = sar;

  for (let i = 2; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];

    sar = sar + af * (ep - sar);

    if (isUp) {
      sar = Math.min(sar, candles[i - 1].low, candles[i - 2].low);
      if (cur.low < sar) {
        isUp = false;
        sar = ep;
        ep = cur.low;
        af = step;
      } else {
        if (cur.high > ep) {
          ep = cur.high;
          af = Math.min(af + step, maximum);
        }
      }
    } else {
      sar = Math.max(sar, candles[i - 1].high, candles[i - 2].high);
      if (cur.high > sar) {
        isUp = true;
        sar = ep;
        ep = cur.high;
        af = step;
      } else {
        if (cur.low < ep) {
          ep = cur.low;
          af = Math.min(af + step, maximum);
        }
      }
    }

    result[i] = sar;
  }

  return result;
}

// Donchian Channels
export function calculateDonchian(
  candles: CandleData[],
  period = 20
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const upper: (number | null)[] = new Array(candles.length).fill(null);
  const middle: (number | null)[] = new Array(candles.length).fill(null);
  const lower: (number | null)[] = new Array(candles.length).fill(null);

  if (candles.length < period) return { upper, middle, lower };

  for (let i = period - 1; i < candles.length; i++) {
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = 0; j < period; j++) {
      const c = candles[i - j];
      if (c.high > highest) highest = c.high;
      if (c.low < lowest) lowest = c.low;
    }
    upper[i] = highest;
    lower[i] = lowest;
    middle[i] = (highest + lowest) / 2;
  }

  return { upper, middle, lower };
}

// Envelopes
export function calculateEnvelopes(
  candles: CandleData[],
  period = 20,
  percent = 0.1
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = calculateSMA(candles, period);
  const upper: (number | null)[] = new Array(candles.length).fill(null);
  const lower: (number | null)[] = new Array(candles.length).fill(null);

  for (let i = 0; i < middle.length; i++) {
    const m = middle[i];
    if (m !== null) {
      upper[i] = m * (1 + percent / 100);
      lower[i] = m * (1 - percent / 100);
    }
  }

  return { upper, middle, lower };
}

// Bill Williams Alligator (Jaws, Teeth, Lips)
export function calculateAlligator(
  candles: CandleData[]
): { jaws: (number | null)[]; teeth: (number | null)[]; lips: (number | null)[] } {
  // Jaws: 13-period SMMA shifted 8 bars
  // Teeth: 8-period SMMA shifted 5 bars
  // Lips: 5-period SMMA shifted 3 bars
  const medianPrices = candles.map(c => ({ ...c, close: (c.high + c.low) / 2 }));
  const rawJaws = calculateSMA(medianPrices, 13);
  const rawTeeth = calculateSMA(medianPrices, 8);
  const rawLips = calculateSMA(medianPrices, 5);

  const jaws: (number | null)[] = new Array(candles.length).fill(null);
  const teeth: (number | null)[] = new Array(candles.length).fill(null);
  const lips: (number | null)[] = new Array(candles.length).fill(null);

  for (let i = 0; i < candles.length; i++) {
    jaws[i] = rawJaws[i];
    teeth[i] = rawTeeth[i];
    lips[i] = rawLips[i];
  }

  return { jaws, teeth, lips };
}

// Bill Williams Fractals
export function calculateFractals(
  candles: CandleData[]
): { up: (number | null)[]; down: (number | null)[] } {
  const up: (number | null)[] = new Array(candles.length).fill(null);
  const down: (number | null)[] = new Array(candles.length).fill(null);

  if (candles.length < 5) return { up, down };

  for (let i = 2; i < candles.length - 2; i++) {
    const c = candles[i];
    const isPeakHigh =
      c.high > candles[i - 2].high &&
      c.high > candles[i - 1].high &&
      c.high > candles[i + 1].high &&
      c.high > candles[i + 2].high;

    const isPeakLow =
      c.low < candles[i - 2].low &&
      c.low < candles[i - 1].low &&
      c.low < candles[i + 1].low &&
      c.low < candles[i + 2].low;

    if (isPeakHigh) up[i] = c.high;
    if (isPeakLow) down[i] = c.low;
  }

  return { up, down };
}

// Ichimoku Kinko Hyo (Cloud)
export function calculateIchimoku(
  candles: CandleData[],
  conversionPeriod = 9,
  basePeriod = 26,
  spanBPeriod = 52
): {
  tenkan: (number | null)[];
  kijun: (number | null)[];
  spanA: (number | null)[];
  spanB: (number | null)[];
} {
  const tenkan: (number | null)[] = new Array(candles.length).fill(null);
  const kijun: (number | null)[] = new Array(candles.length).fill(null);
  const spanA: (number | null)[] = new Array(candles.length).fill(null);
  const spanB: (number | null)[] = new Array(candles.length).fill(null);

  const getMid = (startIdx: number, p: number) => {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = 0; j < p; j++) {
      const c = candles[startIdx - j];
      if (c.high > hi) hi = c.high;
      if (c.low < lo) lo = c.low;
    }
    return (hi + lo) / 2;
  };

  for (let i = conversionPeriod - 1; i < candles.length; i++) {
    tenkan[i] = getMid(i, conversionPeriod);
  }
  for (let i = basePeriod - 1; i < candles.length; i++) {
    kijun[i] = getMid(i, basePeriod);
  }
  for (let i = 0; i < candles.length; i++) {
    if (tenkan[i] !== null && kijun[i] !== null) {
      spanA[i] = (tenkan[i]! + kijun[i]!) / 2;
    }
  }
  for (let i = spanBPeriod - 1; i < candles.length; i++) {
    spanB[i] = getMid(i, spanBPeriod);
  }

  return { tenkan, kijun, spanA, spanB };
}

// ZigZag High / Low Swings
export function calculateZigZag(
  candles: CandleData[],
  depth = 12,
  deviation = 1
): { index: number; time: number; price: number; type: 'high' | 'low' }[] {
  const points: { index: number; time: number; price: number; type: 'high' | 'low' }[] = [];
  if (candles.length < depth * 2) return points;

  let lastPointType: 'high' | 'low' | null = null;
  let lastPointVal = 0;

  for (let i = depth; i < candles.length - depth; i++) {
    const c = candles[i];
    let isHighest = true;
    let isLowest = true;

    for (let j = 1; j <= depth; j++) {
      if (candles[i - j].high >= c.high || candles[i + j].high > c.high) isHighest = false;
      if (candles[i - j].low <= c.low || candles[i + j].low < c.low) isLowest = false;
    }

    if (isHighest) {
      if (lastPointType !== 'high' || c.high > lastPointVal) {
        if (lastPointType === 'high') points.pop();
        points.push({ index: i, time: c.time, price: c.high, type: 'high' });
        lastPointType = 'high';
        lastPointVal = c.high;
      }
    } else if (isLowest) {
      if (lastPointType !== 'low' || c.low < lastPointVal) {
        if (lastPointType === 'low') points.pop();
        points.push({ index: i, time: c.time, price: c.low, type: 'low' });
        lastPointType = 'low';
        lastPointVal = c.low;
      }
    }
  }

  return points;
}

// Standard Floor Pivot Points
export function calculatePivotPoints(
  candles: CandleData[]
): { r2: number; r1: number; pivot: number; s1: number; s2: number } | null {
  if (candles.length < 20) return null;
  const recent = candles.slice(-20);
  let high = -Infinity;
  let low = Infinity;
  for (const c of recent) {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
  }
  const close = recent[recent.length - 1].close;
  const pivot = (high + low + close) / 3;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);

  return { r2, r1, pivot, s1, s2 };
}

// -------------------------------------------------------------
// SUB-PANE OSCILLATORS (RSI, MACD, STOCHASTIC, CCI, ETC.)
// -------------------------------------------------------------

// Relative Strength Index (RSI)
export function calculateRSI(candles: CandleData[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - (100 / (1 + rs));

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i] = 100 - (100 / (1 + rs));
  }

  return result;
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  candles: CandleData[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] } {
  const fastEma = calculateEMA(candles, fastPeriod);
  const slowEma = calculateEMA(candles, slowPeriod);

  const macd: (number | null)[] = new Array(candles.length).fill(null);
  for (let i = 0; i < candles.length; i++) {
    if (fastEma[i] !== null && slowEma[i] !== null) {
      macd[i] = fastEma[i]! - slowEma[i]!;
    }
  }

  // Calculate signal EMA on macd line
  const macdCandles: CandleData[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < macd.length; i++) {
    if (macd[i] !== null) {
      macdCandles.push({
        time: candles[i].time,
        open: macd[i]!,
        high: macd[i]!,
        low: macd[i]!,
        close: macd[i]!
      });
      validIndices.push(i);
    }
  }

  const rawSignal = calculateEMA(macdCandles, signalPeriod);
  const signal: (number | null)[] = new Array(candles.length).fill(null);
  const hist: (number | null)[] = new Array(candles.length).fill(null);

  for (let j = 0; j < validIndices.length; j++) {
    const origIdx = validIndices[j];
    const sigVal = rawSignal[j];
    signal[origIdx] = sigVal;
    if (macd[origIdx] !== null && sigVal !== null) {
      hist[origIdx] = macd[origIdx]! - sigVal;
    }
  }

  return { macd, signal, hist };
}

// Stochastic Oscillator (%K, %D)
export function calculateStochastic(
  candles: CandleData[],
  kPeriod = 14,
  dPeriod = 3,
  slowing = 3
): { k: (number | null)[]; d: (number | null)[] } {
  const rawK: (number | null)[] = new Array(candles.length).fill(null);

  for (let i = kPeriod - 1; i < candles.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      const c = candles[i - j];
      if (c.high > hi) hi = c.high;
      if (c.low < lo) lo = c.low;
    }
    const range = hi - lo;
    if (range > 0) {
      rawK[i] = ((candles[i].close - lo) / range) * 100;
    } else {
      rawK[i] = 50;
    }
  }

  // Smoothed %K
  const k = calculateSMA(
    candles.map((c, idx) => ({ ...c, close: rawK[idx] || 50 })),
    slowing
  );
  // %D is SMA of %K
  const d = calculateSMA(
    candles.map((c, idx) => ({ ...c, close: k[idx] || 50 })),
    dPeriod
  );

  return { k, d };
}

// Commodity Channel Index (CCI)
export function calculateCCI(candles: CandleData[], period = 20): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period) return result;

  const tps = candles.map(c => (c.high + c.low + c.close) / 3);

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += tps[i - j];
    const smaTp = sum / period;

    let meanDev = 0;
    for (let j = 0; j < period; j++) meanDev += Math.abs(tps[i - j] - smaTp);
    meanDev = meanDev / period;

    if (meanDev === 0) result[i] = 0;
    else result[i] = (tps[i] - smaTp) / (0.015 * meanDev);
  }

  return result;
}

// Williams %R
export function calculateWilliamsR(candles: CandleData[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period) return result;

  for (let i = period - 1; i < candles.length; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = 0; j < period; j++) {
      const c = candles[i - j];
      if (c.high > hi) hi = c.high;
      if (c.low < lo) lo = c.low;
    }
    const range = hi - lo;
    if (range === 0) result[i] = -50;
    else result[i] = ((hi - candles[i].close) / range) * -100;
  }

  return result;
}

// Awesome Oscillator (AO)
export function calculateAwesomeOscillator(
  candles: CandleData[]
): { ao: (number | null)[]; isGreen: boolean[] } {
  const medianCandles = candles.map(c => ({ ...c, close: (c.high + c.low) / 2 }));
  const fastSMA = calculateSMA(medianCandles, 5);
  const slowSMA = calculateSMA(medianCandles, 34);

  const ao: (number | null)[] = new Array(candles.length).fill(null);
  const isGreen: boolean[] = new Array(candles.length).fill(true);

  for (let i = 0; i < candles.length; i++) {
    if (fastSMA[i] !== null && slowSMA[i] !== null) {
      ao[i] = fastSMA[i]! - slowSMA[i]!;
      if (i > 0 && ao[i - 1] !== null) {
        isGreen[i] = ao[i]! >= ao[i - 1]!;
      }
    }
  }

  return { ao, isGreen };
}

// Momentum Indicator
export function calculateMomentum(candles: CandleData[], period = 10): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period) return result;

  for (let i = period; i < candles.length; i++) {
    result[i] = (candles[i].close / candles[i - period].close) * 100;
  }

  return result;
}
