import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Trade, useAppContext } from '../context/AppContext';
import { ZoomIn, ZoomOut, RotateCcw, SlidersHorizontal, Activity, Eye, EyeOff, Settings, X, Plus } from 'lucide-react';
import { CandleData, getCandleSeries, getTimeFrameMs, getPrecision, getCanonicalPrice } from '../utils/candleStore';
import { formatTimeInTz } from '../utils/timezone';
import { DrawingItem, DrawingToolType, ChartPoint, IndicatorConfig } from '../types/analysis';
import { DrawingToolsBar } from './analysis/DrawingToolsBar';
import { SelectedDrawingToolbar } from './analysis/SelectedDrawingToolbar';
import { IndicatorsModal } from './analysis/IndicatorsModal';
import {
  calculateSMA,
  calculateEMA,
  calculateWMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateSuperTrend,
  calculateParabolicSAR,
  calculateZigZag,
  calculatePivotPoints,
  calculateStochastic,
  calculateATR,
  calculateAwesomeOscillator,
  calculateCCI,
  calculateWilliamsR,
  calculateDonchianChannels,
  calculateEnvelopes,
  calculateAlligator,
  calculateIchimoku,
  calculateMomentum,
  calculateHMA
} from '../utils/technicalIndicators';

export type { CandleData };

interface CandlestickChartProps {
  assetId?: string;
  assetSymbol?: string;
  assetName?: string;
  currentPrice: number;
  timeFrame?: string;
  chartType?: 'area' | 'candle' | 'bars' | 'heikin';
  activeTrades?: Trade[];
  lastTradeResult?: any;
  theme?: 'light' | 'dark';
  isLoading?: boolean;
  onTradeSignal?: (direction: 'CALL' | 'PUT') => void;
  isIndicatorsOpen?: boolean;
  onToggleIndicators?: () => void;
}

// Distance helper: Point to Segment distance in pixels
function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

// Persistent tracker across unmount/remount (tab switches) to ensure a trade settlement animation plays ONLY ONCE in real time
const playedSettlementKeys = new Set<string>();

export const CandlestickChart: React.FC<CandlestickChartProps> = React.memo(({
  assetId = '1',
  assetSymbol = '',
  assetName = 'Asset',
  currentPrice,
  timeFrame = '1m',
  chartType = 'candle',
  activeTrades = [],
  lastTradeResult = null,
  theme = 'light',
  isLoading = false,
  isIndicatorsOpen = false,
  onToggleIndicators,
}) => {
  const { selectedTimezone } = useAppContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ width: 400, height: 380 });
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [candleCountdown, setCandleCountdown] = useState<number>(15);
  const [chartReady, setChartReady] = useState(false);

  // Technical Indicators State & Persistence
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(() => {
    try {
      const saved = localStorage.getItem('tradexora_chart_indicators');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('tradexora_chart_indicators', JSON.stringify(indicators));
    } catch {}
  }, [indicators]);

  const handleUpdateIndicator = useCallback((updated: IndicatorConfig) => {
    setIndicators(prev => {
      const idx = prev.findIndex(i => i.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });
  }, []);

  const handleApplyPreset = useCallback((presetName: string) => {
    if (presetName === 'clean') {
      setIndicators([]);
    } else if (presetName === 'scalping') {
      setIndicators([
        {
          id: 'sma_fast',
          type: 'sma',
          name: 'SMA 7 (Fast)',
          enabled: true,
          color: '#fbbf24',
          period: 7,
          lineWidth: 2,
          lineStyle: 'solid'
        },
        {
          id: 'rsi',
          type: 'rsi',
          name: 'RSI (14)',
          enabled: true,
          color: '#f97316',
          period: 14,
          overbought: 70,
          oversold: 30,
          lineWidth: 2
        }
      ]);
    } else if (presetName === 'trend') {
      setIndicators([
        {
          id: 'ema_21',
          type: 'ema',
          name: 'EMA 21',
          enabled: true,
          color: '#3b82f6',
          period: 21,
          lineWidth: 2,
          lineStyle: 'solid'
        },
        {
          id: 'bollinger',
          type: 'bollinger',
          name: 'Bollinger Bands (20, 2)',
          enabled: true,
          color: '#0088cc',
          color2: '#38bdf8',
          period: 20,
          stdDev: 2,
          lineWidth: 1.5,
          fillCloud: true
        }
      ]);
    } else if (presetName === 'snr') {
      setIndicators([
        {
          id: 'pivot_points',
          type: 'pivot_points',
          name: 'Pivot Points (S/R)',
          enabled: true,
          color: '#f59e0b',
          lineWidth: 1.2
        },
        {
          id: 'fractals',
          type: 'fractals',
          name: 'Fractals',
          enabled: true,
          color: '#e11d48'
        }
      ]);
    }
  }, []);

  // Settlement Result Animations (Swipe Right on Win, Drop Downward on Loss)
  const settlementAnimsRef = useRef<Array<{
    id: string;
    won: boolean;
    amount: number;
    profit: number;
    entryPrice: number;
    closePrice: number;
    strikeTime: number;
    createdAt: number;
    type: 'CALL' | 'PUT';
    startTime: number;
  }>>([]);
  const lastAnimatedTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!lastTradeResult || !lastTradeResult.timestamp) return;

    // Fix: Prevent re-animating old trades (e.g. yesterday's trade) when switching tabs!
    // Settlement animations must only trigger within 3.5 seconds of the actual live trade settlement.
    const ageMs = Date.now() - (lastTradeResult.timestamp || 0);
    if (ageMs > 3500 || ageMs < 0) {
      return;
    }

    // Strictly prevent duplicate animations for the same trade settlement across unmount/remount
    const settlementKey = `${lastTradeResult.timestamp}_${lastTradeResult.amount}_${lastTradeResult.won}`;
    if (playedSettlementKeys.has(settlementKey)) return;
    if (lastAnimatedTimestampRef.current === lastTradeResult.timestamp) return;

    playedSettlementKeys.add(settlementKey);
    if (playedSettlementKeys.size > 200) {
      const first = playedSettlementKeys.values().next().value;
      if (first) playedSettlementKeys.delete(first);
    }
    lastAnimatedTimestampRef.current = lastTradeResult.timestamp;

    const anim = {
      id: Math.random().toString(36).substring(7),
      won: Boolean(lastTradeResult.won),
      amount: Number(lastTradeResult.amount || 0),
      profit: Number(lastTradeResult.profit || 0),
      entryPrice: Number(lastTradeResult.entryPrice || 0),
      closePrice: Number(lastTradeResult.closePrice || 0),
      strikeTime: lastTradeResult.timestamp || Date.now(),
      createdAt: lastTradeResult.createdAt || (Date.now() - 15000),
      type: (lastTradeResult.type || 'CALL') as 'CALL' | 'PUT',
      startTime: Date.now()
    };
    settlementAnimsRef.current = [anim];
  }, [lastTradeResult]);

  // Zoom & 4-Directional Pan state
  const [visibleCount, setVisibleCount] = useState<number>(32);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [priceScaleMultiplier, setPriceScaleMultiplier] = useState<number>(1.0);
  const [priceCenterShift, setPriceCenterShift] = useState<number>(0);

  // Drawing Tools & Movable State
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('none');
  const [magnetMode, setMagnetMode] = useState<boolean>(() => {
    return localStorage.getItem('chart_magnet_mode') === 'true';
  });
  const [hideAllDrawings, setHideAllDrawings] = useState<boolean>(false);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [inProgressPoints, setInProgressPoints] = useState<ChartPoint[]>([]);

  // Persistent Drawings
  const [drawings, setDrawings] = useState<DrawingItem[]>(() => {
    try {
      const saved = localStorage.getItem(`chart_drawings_${assetId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save drawings per asset
  useEffect(() => {
    try {
      localStorage.setItem(`chart_drawings_${assetId}`, JSON.stringify(drawings));
    } catch {}
  }, [drawings, assetId]);

  // Load asset drawings on switch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`chart_drawings_${assetId}`);
      setDrawings(saved ? JSON.parse(saved) : []);
      setSelectedDrawingId(null);
      setInProgressPoints([]);
      setActiveDrawingTool('none');
    } catch {
      setDrawings([]);
    }
  }, [assetId]);

  // Interaction tracking state ref
  const interactionRef = useRef<{
    mode: 'none' | 'pan' | 'price_scale' | 'time_scale' | 'drag_drawing' | 'drag_handle' | 'brush';
    startX: number;
    startY: number;
    startPanOffset: number;
    startPriceScale: number;
    startPriceShift: number;
    startVisibleCount: number;
    hoverX: number | null;
    hoverY: number | null;
    hoverCursor: string;
    
    // Dragging drawing data
    dragDrawingId: string | null;
    dragHandleIndex: number | null; // 0, 1, 2, or null for entire body
    startPoints: ChartPoint[];
    startMousePrice: number;
    startMouseTime: number;
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    startPanOffset: 0,
    startPriceScale: 1.0,
    startPriceShift: 0,
    startVisibleCount: 32,
    hoverX: null,
    hoverY: null,
    hoverCursor: 'crosshair',
    dragDrawingId: null,
    dragHandleIndex: null,
    startPoints: [],
    startMousePrice: 0,
    startMouseTime: 0,
  });

  const [cursorStyle, setCursorStyle] = useState<string>('crosshair');

  const touchStateRef = useRef<{
    mode: 'none' | 'pan' | 'price_scale' | 'drag_drawing' | 'drag_handle';
    startX: number;
    startY: number;
    startPanOffset: number;
    startPriceScale: number;
    startPriceShift: number;
    initialPinchDistance: number | null;
    startVisibleCount: number;
    dragDrawingId: string | null;
    dragHandleIndex: number | null;
    startPoints: ChartPoint[];
    startMousePrice: number;
    startMouseTime: number;
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    startPanOffset: 0,
    startPriceScale: 1.0,
    startPriceShift: 0,
    initialPinchDistance: null,
    startVisibleCount: 32,
    dragDrawingId: null,
    dragHandleIndex: null,
    startPoints: [],
    startMousePrice: 0,
    startMouseTime: 0,
  });

  const rafRef = useRef<number | null>(null);

  // Resize Observer
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 50 && clientHeight > 50) {
          setDimensions({
            width: clientWidth,
            height: clientHeight
          });
        }
      }
    };

    updateSize();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => updateSize());
      ro.observe(containerRef.current);
    }
    window.addEventListener('resize', updateSize);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Display Price Ref & Smooth Y-Bounds Refs for silky-smooth 60FPS sub-pixel interpolation
  const displayPriceRef = useRef<number>(currentPrice || 100);
  const smoothYMinRef = useRef<number>(0);
  const smoothYMaxRef = useRef<number>(0);

  // Viewport reset and price sync on asset or timeframe change
  useEffect(() => {
    setChartReady(false);
    setPanOffset(0);
    setPriceScaleMultiplier(1.0);
    setPriceCenterShift(0);
    displayPriceRef.current = currentPrice || 100;
    smoothYMinRef.current = 0;
    smoothYMaxRef.current = 0;
    const timer = setTimeout(() => setChartReady(true), 60);
    return () => clearTimeout(timer);
  }, [assetId, timeFrame]);

  // Candle Countdown with precise 250ms polling for micro-second synchronization
  useEffect(() => {
    const intervalMs = getTimeFrameMs(timeFrame);
    const updateCountdown = () => {
      const now = Date.now();
      const nextEpoch = Math.floor(now / intervalMs) * intervalMs + intervalMs;
      const remainingSec = Math.max(0, Math.ceil((nextEpoch - now) / 1000));
      setCandleCountdown(remainingSec);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 250);
    return () => clearInterval(interval);
  }, [timeFrame]);

  // Layout Dimensions & Active Oscillators
  const priceAxisWidth = 62;
  const timeAxisHeight = 22;

  const activeOscillators = useMemo(() => {
    return indicators.filter(i => i.enabled && ['rsi', 'macd', 'stochastic', 'cci', 'williams_r', 'awesome_oscillator', 'atr', 'momentum'].includes(i.type));
  }, [indicators]);

  const hasOscillator = activeOscillators.length > 0;
  const oscPaneHeight = (hasOscillator && dimensions.height > 270) ? Math.min(80, Math.floor(dimensions.height * 0.22)) : 0;
  const mainPlotWidth = Math.max(dimensions.width - priceAxisWidth, 80);
  const mainPlotHeight = Math.max(dimensions.height - timeAxisHeight - oscPaneHeight, 80);

  // Coordinate Converters
  const getCoordinatesMapper = useCallback((
    candles: CandleData[],
    safeOffset: number,
    yMin: number,
    yRange: number
  ) => {
    const extraRightSlots = safeOffset < 0 ? Math.abs(safeOffset) + 3 : 3;
    const totalSlots = candles.length + extraRightSlots;
    const slotWidth = mainPlotWidth / Math.max(1, totalSlots);

    const getXForTime = (time: number): number => {
      if (candles.length === 0) return 0;
      for (let i = 0; i < candles.length; i++) {
        if (candles[i].time === time) {
          return i * slotWidth + slotWidth / 2;
        }
      }
      const firstTime = candles[0].time;
      const interval = getTimeFrameMs(timeFrame);
      const diffFromFirst = (time - firstTime) / Math.max(1, interval);
      return diffFromFirst * slotWidth + slotWidth / 2;
    };

    const getYForPrice = (price: number): number => {
      const ratio = (price - yMin) / (yRange || 1);
      return mainPlotHeight - ratio * mainPlotHeight;
    };

    const getPriceFromY = (y: number): number => {
      const ratio = (mainPlotHeight - y) / (mainPlotHeight || 1);
      return yMin + ratio * yRange;
    };

    const getTimeFromX = (x: number): number => {
      if (candles.length === 0) return Date.now();
      const idx = Math.floor(x / slotWidth);
      if (idx >= 0 && idx < candles.length) {
        return candles[idx].time;
      }
      if (idx >= candles.length) {
        const extraCandles = idx - (candles.length - 1);
        const lastTime = candles[candles.length - 1].time;
        return lastTime + extraCandles * getTimeFrameMs(timeFrame);
      }
      const firstTime = candles[0].time;
      return firstTime + idx * getTimeFrameMs(timeFrame);
    };

    return { getXForTime, getYForPrice, getPriceFromY, getTimeFromX, slotWidth };
  }, [mainPlotWidth, mainPlotHeight, timeFrame]);

  // Current Window Data Helper (Uses smoothed 60FPS display price and gentle vertical dampening)
  const getWindowData = useCallback((overridePrice?: number) => {
    const canonicalBase = currentPrice || getCanonicalPrice(assetId || '1');
    const rawSeries = getCandleSeries(assetId || '1', canonicalBase, timeFrame);
    if (!rawSeries || rawSeries.length === 0) return null;

    const count = Math.min(visibleCount, rawSeries.length);
    const maxOffset = Math.max(0, rawSeries.length - count);
    const minOffset = -12;
    const safeOffset = Math.min(Math.max(minOffset, panOffset), maxOffset);

    const endIndex = Math.min(rawSeries.length, Math.max(count, rawSeries.length - Math.max(0, safeOffset)));
    const startIndex = Math.max(0, endIndex - count);
    const candles = rawSeries.slice(startIndex, endIndex);

    if (candles.length === 0) return null;

    const activeP = (typeof overridePrice === 'number' && Number.isFinite(overridePrice) && overridePrice > 0)
      ? overridePrice
      : (displayPriceRef.current || currentPrice || 100);

    let rawMin = Infinity;
    let rawMax = -Infinity;
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      if (c.low < rawMin) rawMin = c.low;
      if (c.high > rawMax) rawMax = c.high;
    }

    if (activeP > rawMax) rawMax = activeP;
    if (activeP < rawMin) rawMin = activeP;

    const precision = getPrecision(activeP || 100);
    const minSpan = Math.pow(10, -precision) * 4;
    const rawRange = (rawMax - rawMin > minSpan) ? (rawMax - rawMin) : (rawMax > 0 ? rawMax * 0.005 : minSpan);
    const basePadding = rawRange * 0.12;
    const midPrice = (rawMax + rawMin) / 2 + (priceCenterShift * rawRange);
    const scaledHalfRange = Math.max(minSpan, ((rawRange + basePadding * 2) / 2) / Math.max(0.1, priceScaleMultiplier));

    const targetYMin = midPrice - scaledHalfRange;
    const targetYMax = midPrice + scaledHalfRange;

    // Smooth Y-axis bounds adjustment to eliminate jitter and vibration
    if (smoothYMinRef.current === 0 || Math.abs(smoothYMinRef.current - targetYMin) > scaledHalfRange * 1.5) {
      smoothYMinRef.current = targetYMin;
      smoothYMaxRef.current = targetYMax;
    } else {
      smoothYMinRef.current += (targetYMin - smoothYMinRef.current) * 0.20;
      smoothYMaxRef.current += (targetYMax - smoothYMaxRef.current) * 0.20;
    }

    const yMin = smoothYMinRef.current;
    const yMax = smoothYMaxRef.current;
    const yRange = (yMax - yMin > 0) ? (yMax - yMin) : minSpan;

    const mapper = getCoordinatesMapper(candles, safeOffset, yMin, yRange);

    return { candles, safeOffset, yMin, yMax, yRange, mapper, rawSeries, activePrice: activeP, startIndex, endIndex };
  }, [assetId, currentPrice, timeFrame, visibleCount, panOffset, priceCenterShift, priceScaleMultiplier, getCoordinatesMapper]);

  // Snap point to nearest candle High / Low / Close if magnet is ON
  const snapToCandle = useCallback((x: number, y: number): ChartPoint => {
    const data = getWindowData();
    if (!data) return { time: Date.now(), price: currentPrice || 100 };

    const { candles, mapper } = data;
    const time = mapper.getTimeFromX(x);
    let price = mapper.getPriceFromY(y);

    if (magnetMode) {
      const match = candles.find(c => c.time === time);
      if (match) {
        const dHigh = Math.abs(price - match.high);
        const dLow = Math.abs(price - match.low);
        const dClose = Math.abs(price - match.close);
        const dOpen = Math.abs(price - match.open);
        const minD = Math.min(dHigh, dLow, dClose, dOpen);
        if (minD === dHigh) price = match.high;
        else if (minD === dLow) price = match.low;
        else if (minD === dClose) price = match.close;
        else price = match.open;
      }
    }

    return { time, price };
  }, [getWindowData, magnetMode, currentPrice]);

  // Technical Indicator Rendering Helpers
  const drawIndicatorLine = useCallback((
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    color: string,
    width = 2,
    style: 'solid' | 'dashed' | 'dotted' = 'solid'
  ) => {
    if (points.length < 2) return;
    ctx.save();
    ctx.beginPath();
    if (style === 'dashed') ctx.setLineDash([5, 4]);
    else if (style === 'dotted') ctx.setLineDash([2, 2]);
    else ctx.setLineDash([]);

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }, []);

  const hexToRgba = useCallback((hex: string, alpha = 0.15): string => {
    if (!hex || !hex.startsWith('#')) return `rgba(0, 136, 204, ${alpha})`;
    let clean = hex.slice(1);
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return `rgba(0, 136, 204, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  // 60FPS High-DPI Canvas Rendering Engine
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.floor(dimensions.width * dpr);
    const targetH = Math.floor(dimensions.height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const isDark = theme === 'dark';
    const bg = isDark ? '#0b1118' : '#ffffff';
    const gridColor = isDark ? '#162231' : '#f1f5f9';
    const axisBg = isDark ? '#090e15' : '#f8fafc';
    const axisBorder = isDark ? '#1e293b' : '#e2e8f0';
    const textMuted = isDark ? '#64748b' : '#94a3b8';
    const green = '#00b067';
    const red = '#ff3b30';

    // 1. Clear background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // 2. Axis Panels
    ctx.fillStyle = axisBg;
    ctx.fillRect(mainPlotWidth, 0, priceAxisWidth, dimensions.height);
    ctx.fillRect(0, dimensions.height - timeAxisHeight, dimensions.width, timeAxisHeight);

    // 3. Axis Borders
    ctx.fillStyle = axisBorder;
    ctx.fillRect(mainPlotWidth, 0, 1, dimensions.height);
    ctx.fillRect(0, dimensions.height - timeAxisHeight, dimensions.width, 1);

    const data = getWindowData();
    if (!data) {
      ctx.restore();
      return;
    }

    const { candles, mapper, activePrice, rawSeries = candles, startIndex = 0, endIndex = candles.length } = data as any;
    const { getXForTime, getYForPrice, getPriceFromY, slotWidth } = mapper;
    const decimals = getPrecision(activePrice || currentPrice || 100);

    // 4. Horizontal Price Grid & Labels
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const gridSteps = 5;

    ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= gridSteps; i++) {
      const y = Math.floor((mainPlotHeight / gridSteps) * i) + 0.5;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(mainPlotWidth, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(mainPlotWidth, y);
      ctx.lineTo(mainPlotWidth + 4, y);
      ctx.stroke();

      const p = getPriceFromY(y);
      ctx.fillStyle = textMuted;
      ctx.fillText((Number(p) || 0).toFixed(decimals), mainPlotWidth + 6, y);
    }

    // 5. Time Axis Grid & Labels
    const timeStep = Math.max(4, Math.floor(candles.length / 5));

    for (let i = 0; i < candles.length; i += timeStep) {
      const c = candles[i];
      const x = Math.floor(i * slotWidth + slotWidth / 2) + 0.5;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mainPlotHeight);
      ctx.stroke();

      const timeStr = selectedTimezone 
        ? formatTimeInTz(c.time, selectedTimezone.offsetMinutes, true)
        : new Date(c.time).toLocaleTimeString([], { hour12: false });
      ctx.fillStyle = textMuted;
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, x, dimensions.height - 11);
    }

    // 6. Main Plot Elements (Clipped)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, mainPlotWidth, mainPlotHeight);
    ctx.clip();

    // 6a. Main Candlesticks / Area Chart
    if (chartType === 'area') {
      ctx.beginPath();
      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const x = i * slotWidth + slotWidth / 2;
        const closeP = (i === candles.length - 1) ? activePrice : c.close;
        const y = getYForPrice(closeP);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#0088cc';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      const lastX = (candles.length - 1) * slotWidth + slotWidth / 2;
      ctx.lineTo(lastX, mainPlotHeight);
      ctx.lineTo(slotWidth / 2, mainPlotHeight);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, mainPlotHeight);
      grad.addColorStop(0, isDark ? 'rgba(0, 136, 204, 0.45)' : 'rgba(0, 136, 204, 0.25)');
      grad.addColorStop(1, 'rgba(0, 136, 204, 0.00)');
      ctx.fillStyle = grad;
      ctx.fill();
    } else {
      const candleWidth = Math.max(3, Math.min(Math.floor(slotWidth * 0.76), 34));
      const halfWidth = Math.floor(candleWidth / 2);
      const actualWidth = Math.max(3, halfWidth * 2 + 1);

      let prevHaOpen = candles[0]?.open || 0;
      let prevHaClose = candles[0]?.close || 0;

      for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const rawX = i * slotWidth + slotWidth / 2;
        const centerX = Math.floor(rawX);

        // Viewport clipping: Skip rendering off-screen candles
        if (centerX < -candleWidth - 10 || centerX > mainPlotWidth + candleWidth + 10) {
          continue;
        }
        
        const isLastCandle = (i === candles.length - 1);
        let o = c.open;
        let cls = isLastCandle ? activePrice : c.close;
        let h = isLastCandle ? Math.max(c.high, activePrice, o) : c.high;
        let l = isLastCandle ? Math.min(c.low, activePrice, o) : c.low;

        if (chartType === 'heikin') {
          cls = (o + h + l + (isLastCandle ? activePrice : c.close)) / 4;
          if (i > 0) {
            o = (prevHaOpen + prevHaClose) / 2;
          }
          h = Math.max(c.high, o, cls);
          l = Math.min(c.low, o, cls);
          prevHaOpen = o;
          prevHaClose = cls;
        }

        const isUp = cls >= o;
        const color = isUp ? green : red;

        const openY = getYForPrice(o);
        const closeY = getYForPrice(cls);
        const highY = getYForPrice(h);
        const lowY = getYForPrice(l);

        const minY = Math.min(highY, lowY);
        const maxY = Math.max(highY, lowY);

        if (chartType === 'bars') {
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1, Math.floor(candleWidth / 4));
          
          // Vertical line (High to Low)
          ctx.beginPath();
          ctx.moveTo(centerX + 0.5, minY);
          ctx.lineTo(centerX + 0.5, maxY);
          ctx.stroke();

          // Left tick (Open)
          ctx.beginPath();
          ctx.moveTo(centerX + 0.5, openY);
          ctx.lineTo(centerX + 0.5 - halfWidth, openY);
          ctx.stroke();

          // Right tick (Close)
          ctx.beginPath();
          ctx.moveTo(centerX + 0.5, closeY);
          ctx.lineTo(centerX + 0.5 + halfWidth, closeY);
          ctx.stroke();
        } else {
          // Standard or Heikin Ashi candle
          // Wick
          ctx.strokeStyle = color;
          ctx.lineWidth = candleWidth > 12 ? 1.5 : 1;
          ctx.beginPath();
          ctx.moveTo(centerX + 0.5, minY);
          ctx.lineTo(centerX + 0.5, maxY);
          ctx.stroke();

          // Body
          ctx.fillStyle = color;
          const bodyTop = Math.min(openY, closeY);
          const rawBodyHeight = Math.abs(closeY - openY);
          const bodyHeight = rawBodyHeight < 1.5 ? 2 : rawBodyHeight;
          const bodyLeft = centerX - halfWidth;

          if (isLastCandle) {
            ctx.save();
            ctx.shadowColor = isUp ? 'rgba(0, 176, 103, 0.40)' : 'rgba(255, 59, 48, 0.40)';
            ctx.shadowBlur = 6;
            ctx.fillRect(bodyLeft, bodyTop, actualWidth, bodyHeight);
            ctx.restore();
          } else {
            ctx.fillRect(bodyLeft, bodyTop, actualWidth, bodyHeight);
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 6a-1. Active Technical Indicators (Overlay Suite)
    // -------------------------------------------------------------
    const activeOverlays = indicators.filter(ind => ind.enabled && !['rsi', 'macd', 'stochastic', 'cci', 'williams_r', 'awesome_oscillator', 'atr', 'momentum'].includes(ind.type));

    activeOverlays.forEach(ind => {
      const color = ind.color || '#0088cc';
      const lineWidth = ind.lineWidth || 2;
      const lineStyle = ind.lineStyle || 'solid';

      // 1. Moving Averages: SMA, EMA, WMA, HMA
      if (ind.type === 'sma' || ind.type === 'ema' || ind.type === 'wma' || ind.type === 'hma') {
        const period = ind.period || 20;
        let vals: (number | null)[] = [];
        if (ind.type === 'sma') vals = calculateSMA(rawSeries, period);
        else if (ind.type === 'ema') vals = calculateEMA(rawSeries, period);
        else if (ind.type === 'wma') vals = calculateWMA(rawSeries, period);
        else if (ind.type === 'hma') vals = calculateHMA(rawSeries, period);

        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < candles.length; i++) {
          const rawIdx = startIndex + i;
          const v = vals[rawIdx];
          if (v !== null && Number.isFinite(v)) {
            pts.push({
              x: i * slotWidth + slotWidth / 2,
              y: getYForPrice(v)
            });
          }
        }
        drawIndicatorLine(ctx, pts, color, lineWidth, lineStyle);
      }

      // 2. Bollinger Bands
      else if (ind.type === 'bollinger') {
        const period = ind.period || 20;
        const stdDev = ind.stdDev || 2;
        const { upper, middle, lower } = calculateBollingerBands(rawSeries, period, stdDev);

        const upperPts: { x: number; y: number }[] = [];
        const lowerPts: { x: number; y: number }[] = [];
        const midPts: { x: number; y: number }[] = [];

        for (let i = 0; i < candles.length; i++) {
          const rawIdx = startIndex + i;
          const u = upper[rawIdx];
          const m = middle[rawIdx];
          const l = lower[rawIdx];
          const x = i * slotWidth + slotWidth / 2;

          if (u !== null && Number.isFinite(u) && l !== null && Number.isFinite(l)) {
            upperPts.push({ x, y: getYForPrice(u) });
            lowerPts.push({ x, y: getYForPrice(l) });
          }
          if (m !== null && Number.isFinite(m)) {
            midPts.push({ x, y: getYForPrice(m) });
          }
        }

        // Shaded cloud between upper and lower bands
        if (ind.fillCloud !== false && upperPts.length > 1 && lowerPts.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(upperPts[0].x, upperPts[0].y);
          for (let k = 1; k < upperPts.length; k++) {
            ctx.lineTo(upperPts[k].x, upperPts[k].y);
          }
          for (let k = lowerPts.length - 1; k >= 0; k--) {
            ctx.lineTo(lowerPts[k].x, lowerPts[k].y);
          }
          ctx.closePath();
          ctx.fillStyle = hexToRgba(color, 0.08);
          ctx.fill();
          ctx.restore();
        }

        drawIndicatorLine(ctx, upperPts, color, lineWidth, lineStyle);
        drawIndicatorLine(ctx, lowerPts, color, lineWidth, lineStyle);
        drawIndicatorLine(ctx, midPts, ind.color2 || color, 1.2, 'dashed');
      }

      // 3. Supertrend
      else if (ind.type === 'supertrend') {
        const period = ind.period || 10;
        const mult = ind.multiplier || 3;
        const stPts = calculateSuperTrend(rawSeries, period, mult);

        for (let i = 1; i < candles.length; i++) {
          const prevPt = stPts[startIndex + i - 1];
          const currPt = stPts[startIndex + i];
          if (prevPt && currPt && prevPt.direction === currPt.direction) {
            const x1 = (i - 1) * slotWidth + slotWidth / 2;
            const y1 = getYForPrice(prevPt.value);
            const x2 = i * slotWidth + slotWidth / 2;
            const y2 = getYForPrice(currPt.value);

            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = currPt.direction === 'up' ? '#00b067' : '#ef4444';
            ctx.lineWidth = lineWidth;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // 4. Parabolic SAR
      else if (ind.type === 'sar') {
        const step = ind.step || 0.02;
        const maxStep = ind.maximum || 0.2;
        const sarVals = calculateParabolicSAR(rawSeries, step, maxStep);

        ctx.save();
        ctx.fillStyle = color;
        for (let i = 0; i < candles.length; i++) {
          const v = sarVals[startIndex + i];
          if (v !== null && Number.isFinite(v)) {
            const x = i * slotWidth + slotWidth / 2;
            const y = getYForPrice(v);
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 5. Ichimoku Cloud
      else if (ind.type === 'ichimoku') {
        const { tenkan, kijun, senkouA, senkouB } = calculateIchimoku(rawSeries, ind.period || 9, ind.period2 || 26, ind.period3 || 52);

        const tenkanPts: { x: number; y: number }[] = [];
        const kijunPts: { x: number; y: number }[] = [];
        const aPts: { x: number; y: number }[] = [];
        const bPts: { x: number; y: number }[] = [];

        for (let i = 0; i < candles.length; i++) {
          const idx = startIndex + i;
          const x = i * slotWidth + slotWidth / 2;
          const t = tenkan[idx];
          const k = kijun[idx];
          const a = senkouA[idx];
          const b = senkouB[idx];

          if (t !== null && Number.isFinite(t)) tenkanPts.push({ x, y: getYForPrice(t) });
          if (k !== null && Number.isFinite(k)) kijunPts.push({ x, y: getYForPrice(k) });
          if (a !== null && b !== null && Number.isFinite(a) && Number.isFinite(b)) {
            aPts.push({ x, y: getYForPrice(a) });
            bPts.push({ x, y: getYForPrice(b) });
          }
        }

        if (aPts.length > 1 && bPts.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(aPts[0].x, aPts[0].y);
          for (let k = 1; k < aPts.length; k++) ctx.lineTo(aPts[k].x, aPts[k].y);
          for (let k = bPts.length - 1; k >= 0; k--) ctx.lineTo(bPts[k].x, bPts[k].y);
          ctx.closePath();
          ctx.fillStyle = isDark ? 'rgba(14, 165, 233, 0.10)' : 'rgba(14, 165, 233, 0.12)';
          ctx.fill();
          ctx.restore();
        }

        drawIndicatorLine(ctx, tenkanPts, color, lineWidth, lineStyle);
        drawIndicatorLine(ctx, kijunPts, ind.color2 || '#ef4444', lineWidth, lineStyle);
      }

      // 6. Donchian Channels
      else if (ind.type === 'donchian') {
        const { upper, middle, lower } = calculateDonchianChannels(rawSeries, ind.period || 20);
        const upPts: { x: number; y: number }[] = [];
        const lowPts: { x: number; y: number }[] = [];
        const midPts: { x: number; y: number }[] = [];

        for (let i = 0; i < candles.length; i++) {
          const idx = startIndex + i;
          const x = i * slotWidth + slotWidth / 2;
          const u = upper[idx];
          const m = middle[idx];
          const l = lower[idx];
          if (u !== null && Number.isFinite(u)) upPts.push({ x, y: getYForPrice(u) });
          if (l !== null && Number.isFinite(l)) lowPts.push({ x, y: getYForPrice(l) });
          if (m !== null && Number.isFinite(m)) midPts.push({ x, y: getYForPrice(m) });
        }

        if (upPts.length > 1 && lowPts.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(upPts[0].x, upPts[0].y);
          for (let k = 1; k < upPts.length; k++) ctx.lineTo(upPts[k].x, upPts[k].y);
          for (let k = lowPts.length - 1; k >= 0; k--) ctx.lineTo(lowPts[k].x, lowPts[k].y);
          ctx.closePath();
          ctx.fillStyle = hexToRgba(color, 0.06);
          ctx.fill();
          ctx.restore();
        }

        drawIndicatorLine(ctx, upPts, color, lineWidth, lineStyle);
        drawIndicatorLine(ctx, lowPts, color, lineWidth, lineStyle);
        drawIndicatorLine(ctx, midPts, color, 1, 'dashed');
      }

      // 7. Envelopes
      else if (ind.type === 'envelopes') {
        const { upper, middle, lower } = calculateEnvelopes(rawSeries, ind.period || 20, ind.multiplier || 0.1);
        const upPts: { x: number; y: number }[] = [];
        const midPts: { x: number; y: number }[] = [];
        const lowPts: { x: number; y: number }[] = [];

        for (let i = 0; i < candles.length; i++) {
          const idx = startIndex + i;
          const x = i * slotWidth + slotWidth / 2;
          if (upper[idx] !== null) upPts.push({ x, y: getYForPrice(upper[idx]!) });
          if (middle[idx] !== null) midPts.push({ x, y: getYForPrice(middle[idx]!) });
          if (lower[idx] !== null) lowPts.push({ x, y: getYForPrice(lower[idx]!) });
        }

        drawIndicatorLine(ctx, upPts, color, lineWidth, lineStyle);
        drawIndicatorLine(ctx, midPts, color, 1, 'dashed');
        drawIndicatorLine(ctx, lowPts, color, lineWidth, lineStyle);
      }

      // 8. Alligator
      else if (ind.type === 'alligator') {
        const { jaws, teeth, lips } = calculateAlligator(rawSeries);
        const jPts: { x: number; y: number }[] = [];
        const tPts: { x: number; y: number }[] = [];
        const lPts: { x: number; y: number }[] = [];

        for (let i = 0; i < candles.length; i++) {
          const idx = startIndex + i;
          const x = i * slotWidth + slotWidth / 2;
          if (jaws[idx] !== null) jPts.push({ x, y: getYForPrice(jaws[idx]!) });
          if (teeth[idx] !== null) tPts.push({ x, y: getYForPrice(teeth[idx]!) });
          if (lips[idx] !== null) lPts.push({ x, y: getYForPrice(lips[idx]!) });
        }

        drawIndicatorLine(ctx, jPts, ind.color || '#3b82f6', lineWidth, lineStyle);
        drawIndicatorLine(ctx, tPts, ind.color2 || '#ef4444', lineWidth, lineStyle);
        drawIndicatorLine(ctx, lPts, ind.color3 || '#10b981', lineWidth, lineStyle);
      }

      // 9. Fractals
      else if (ind.type === 'fractals') {
        ctx.save();
        ctx.fillStyle = color;
        for (let i = 2; i < candles.length - 2; i++) {
          const c = candles[i];
          const isHighFractal = c.high > candles[i - 1].high && c.high > candles[i - 2].high &&
                                c.high > candles[i + 1].high && c.high > candles[i + 2].high;
          const isLowFractal = c.low < candles[i - 1].low && c.low < candles[i - 2].low &&
                               c.low < candles[i + 1].low && c.low < candles[i + 2].low;

          const x = i * slotWidth + slotWidth / 2;
          if (isHighFractal) {
            const y = getYForPrice(c.high) - 8;
            ctx.beginPath();
            ctx.moveTo(x, y - 4);
            ctx.lineTo(x - 4, y + 3);
            ctx.lineTo(x + 4, y + 3);
            ctx.closePath();
            ctx.fill();
          }
          if (isLowFractal) {
            const y = getYForPrice(c.low) + 8;
            ctx.beginPath();
            ctx.moveTo(x, y + 4);
            ctx.lineTo(x - 4, y - 3);
            ctx.lineTo(x + 4, y - 3);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 10. ZigZag
      else if (ind.type === 'zigzag') {
        const zigPoints = calculateZigZag(rawSeries, ind.multiplier || 0.6);
        const pts: { x: number; y: number }[] = [];
        for (const zp of zigPoints) {
          if (zp.index >= startIndex && zp.index < endIndex) {
            const localIdx = zp.index - startIndex;
            pts.push({
              x: localIdx * slotWidth + slotWidth / 2,
              y: getYForPrice(zp.price)
            });
          }
        }
        drawIndicatorLine(ctx, pts, color, lineWidth, lineStyle);
      }

      // 11. Pivot Points
      else if (ind.type === 'pivot_points') {
        const { r2, r1, pivot, s1, s2 } = calculatePivotPoints(rawSeries);
        const levels = [
          { label: 'R2', price: r2, col: '#ef4444' },
          { label: 'R1', price: r1, col: '#f97316' },
          { label: 'P', price: pivot, col: '#3b82f6' },
          { label: 'S1', price: s1, col: '#10b981' },
          { label: 'S2', price: s2, col: '#059669' }
        ];

        ctx.save();
        ctx.font = '600 9px monospace';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        for (const lv of levels) {
          const y = Math.floor(getYForPrice(lv.price)) + 0.5;
          if (y >= 0 && y <= mainPlotHeight) {
            ctx.strokeStyle = lv.col;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mainPlotWidth, y);
            ctx.stroke();

            ctx.fillStyle = lv.col;
            ctx.fillText(`${lv.label} ${lv.price.toFixed(decimals)}`, 6, y - 3);
          }
        }
        ctx.restore();
      }
    });

    // 6b. Active Trades Visual Markers (Start & End Lines, Transparent White Side Pill, Fluid Strike Line)
    const now = Date.now();
    const animPhase = (now % 1500) / 1500;
    const dashOffset = (now / 30) % 18;

    activeTrades.forEach(trade => {
      const tradeStartTime = trade.createdAt;
      const tradeEndTime = trade.strikeTime || (trade.createdAt + (trade.duration || 60) * 1000);
      
      // Instantly remove marker the exact moment trade reaches expiration or is non-active
      if (trade.status !== 'active' || now >= tradeEndTime || trade.assetId !== assetId) return;

      const y = getYForPrice(trade.entryPrice);
      const isCall = trade.type === 'CALL';
      // Exactly matched with UP (#00b067) and DOWN (#f6354a) buttons
      const primaryColor = isCall ? '#00b067' : '#f6354a';
      const glowColor = isCall ? 'rgba(0, 176, 103, 0.28)' : 'rgba(246, 53, 74, 0.28)';

      const startX = getXForTime(tradeStartTime);
      const endX = getXForTime(tradeEndTime);

      // A. Vertical "Trade start" line
      if (startX >= 0 && startX <= mainPlotWidth + 30) {
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, mainPlotHeight);
        ctx.stroke();
        ctx.restore();

        // Subtle Top Label (Lightweight and soft muted color)
        ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.45)';
        ctx.font = '400 8px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Trade', startX, 4);
        ctx.fillText('start', startX, 14);
      }

      // B. Vertical "Trade end" line
      if (endX >= 0 && endX <= mainPlotWidth + 120) {
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, mainPlotHeight);
        ctx.stroke();
        ctx.restore();

        // Subtle Top Label (Lightweight and soft muted color)
        ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.45)';
        ctx.font = '400 8px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Trade', endX, 4);
        ctx.fillText('end', endX, 14);
      }

      // C. Stuck Fixed Thin Dotted Strike Price Level Line (Holds steady at execution price, zero fluctuation, no dash animation)
      ctx.save();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.0;
      ctx.lineDashOffset = 0;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(Math.max(0, Math.min(startX, mainPlotWidth)), Math.floor(y) + 0.5);
      ctx.lineTo(mainPlotWidth, Math.floor(y) + 0.5);
      ctx.stroke();
      ctx.restore();

      // D. Clean Minimal Anchor Point (No side glow, no pulsing rings)
      const anchorX = Math.max(0, Math.min(startX, mainPlotWidth));
      if (anchorX > 0 && anchorX < mainPlotWidth) {
        ctx.save();
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(anchorX, Math.floor(y) + 0.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // E. Compact Transparent Side Pill (Side of candle - exact 3rd image match)
      const candleAnchorX = startX > 0 ? startX : mainPlotWidth - 100;
      const candleWidth = Math.max(3, Math.min(Math.floor(slotWidth * 0.76), 34));
      const halfWidth = Math.floor(candleWidth / 2);
      const candleLeft = candleAnchorX - halfWidth;
      const candleRight = candleAnchorX + halfWidth;

      const badgeW = 46;
      const badgeH = 18;
      const badgeRadius = 9;

      // Position strictly to the left side of the candle with 6px clear margin so candle is NEVER covered
      let pinX = candleLeft - 6 - (badgeW / 2);
      if (pinX - badgeW / 2 < 4) {
        // If not enough space on left, position strictly to right side of candle
        pinX = candleRight + 6 + (badgeW / 2);
      }
      const pinY = Math.max(12, Math.min(y, mainPlotHeight - 12));

      ctx.save();
      // Drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 1;

      // Transparent subtle background (matching 3rd image & user light/dark preference)
      ctx.fillStyle = isDark ? 'rgba(20, 26, 45, 0.78)' : 'rgba(255, 255, 255, 0.88)';
      ctx.beginPath();
      ctx.roundRect(pinX - badgeW / 2, pinY - badgeH / 2, badgeW, badgeH, badgeRadius);
      ctx.fill();
      ctx.restore();

      // Precision Border
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(pinX - badgeW / 2, pinY - badgeH / 2, badgeW, badgeH, badgeRadius);
      ctx.stroke();

      // Amount Text (Dark high-contrast in light mode, white in dark mode)
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = '800 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`₹${trade.amount}`, pinX - badgeW / 2 + 6, pinY + 0.5);

      // Direction circle badge on the right - Exact match with UP (#00b067) / DOWN (#f6354a) button
      const circleX = pinX + badgeW / 2 - 7.5;
      const circleY = pinY;
      const circleR = 5.5;

      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
      ctx.fill();

      // White direction arrow inside button circle
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isCall ? '↑' : '↓', circleX, circleY + (isCall ? -0.5 : 0.5));
      ctx.restore();
    });

    // 6c. Settlement Result Animations (Smooth 60FPS Swipe Right on Win, Drop Downward on Loss)
    if (settlementAnimsRef.current.length > 0) {
      settlementAnimsRef.current = settlementAnimsRef.current.filter(anim => now - anim.startTime < 900);

      settlementAnimsRef.current.forEach(anim => {
        const elapsed = now - anim.startTime;
        const progress = Math.min(1, Math.max(0, elapsed / 850));
        const alpha = Math.max(0, 1 - Math.pow(progress, 1.4));

        const baseEndX = getXForTime(anim.strikeTime);
        const baseEndY = getYForPrice(anim.closePrice || anim.entryPrice);
        const candleWidth = Math.max(3, Math.min(Math.floor(slotWidth * 0.76), 34));
        const halfWidth = Math.floor(candleWidth / 2);

        const pillW = anim.won ? 62 : 50;
        const pillH = 19;
        const pillRadius = 9.5;

        let curX = baseEndX;
        let curY = baseEndY;

        if (anim.won) {
          // Win: Starts to the right of the candle / trade end line, then SWIPES TO THE RIGHT!
          const startX = Math.max(baseEndX, baseEndX + halfWidth + 6 + (pillW / 2));
          curX = startX + (progress * 75);
          curY = baseEndY;
        } else {
          // Loss: Positioned on the SIDE of the candle (never on top of candle!), then DROPS DOWNWARD!
          const sideLeftX = (baseEndX - halfWidth) - 6 - (pillW / 2);
          const dropX = sideLeftX > pillW / 2 + 4 ? sideLeftX : (baseEndX + halfWidth) + 6 + (pillW / 2);
          curX = dropX;
          curY = baseEndY + (progress * 48);
        }

        // Clamp inside plot
        curX = Math.max(pillW / 2 + 4, Math.min(curX, mainPlotWidth - pillW / 2 - 4));
        curY = Math.max(12, Math.min(curY, mainPlotHeight - 12));

        const payoutText = anim.won 
          ? `+₹${(anim.amount + anim.profit).toFixed(anim.profit % 1 === 0 ? 0 : 2)}`
          : `-₹${anim.amount.toFixed(0)}`;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Glow & Shadow
        ctx.shadowColor = anim.won ? 'rgba(0, 176, 103, 0.35)' : 'rgba(246, 53, 74, 0.35)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 1.5;

        // Pill background
        ctx.fillStyle = anim.won ? '#00b067' : '#f6354a';
        ctx.beginPath();
        ctx.roundRect(curX - pillW / 2, curY - pillH / 2, pillW, pillH, pillRadius);
        ctx.fill();

        // Subtle White Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(curX - pillW / 2, curY - pillH / 2, pillW, pillH, pillRadius);
        ctx.stroke();

        // High contrast white text
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(payoutText, curX, curY + 0.5);

        ctx.restore();
      });
    }

    // Helper: Draw Handle Circle on Point (Crisp, high-contrast anchor handles)
    const drawHandle = (x: number, y: number, color: string, isSelected: boolean) => {
      ctx.save();
      ctx.setLineDash([]);
      // Outer glow
      ctx.fillStyle = isSelected ? 'rgba(0, 136, 204, 0.45)' : 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();

      // White body
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Colored border
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    // 6c. Render Drawings (Movable, Selected Highlight, Anchor Handles)
    if (!hideAllDrawings) {
      drawings.forEach(item => {
        const isSelected = item.id === selectedDrawingId;
        ctx.save();

        // Selected Outer Highlight Aura
        if (isSelected) {
          ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(0, 136, 204, 0.35)';
          ctx.lineWidth = (item.lineWidth || 2) + 6;
          ctx.lineCap = 'round';
          
          if (item.type === 'horizontal' && item.points.length >= 1) {
            const y = getYForPrice(item.points[0].price);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mainPlotWidth, y);
            ctx.stroke();
          } else if (item.type === 'trendline' && item.points.length >= 2) {
            const x1 = getXForTime(item.points[0].time);
            const y1 = getYForPrice(item.points[0].price);
            const x2 = getXForTime(item.points[1].time);
            const y2 = getYForPrice(item.points[1].price);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }

        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.lineWidth || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (item.lineStyle === 'dashed') ctx.setLineDash([6, 4]);
        else if (item.lineStyle === 'dotted') ctx.setLineDash([2, 3]);
        else ctx.setLineDash([]);

        // Render based on drawing type:
        if (item.type === 'horizontal' && item.points.length >= 1) {
          const y = getYForPrice(item.points[0].price);
          ctx.beginPath();
          ctx.moveTo(0, Math.floor(y) + 0.5);
          ctx.lineTo(mainPlotWidth, Math.floor(y) + 0.5);
          ctx.stroke();

          // Price Tag Badge
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.roundRect(4, y - 8, 56, 16, 4);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText((Number(item.points[0]?.price) || 0).toFixed(decimals), 32, y + 3);

          if (isSelected) {
            drawHandle(mainPlotWidth / 2, y, item.color, true);
          }
        } else if (item.type === 'horizontal_ray' && item.points.length >= 1) {
          const x = getXForTime(item.points[0].time);
          const y = getYForPrice(item.points[0].price);
          ctx.beginPath();
          ctx.moveTo(x, Math.floor(y) + 0.5);
          ctx.lineTo(mainPlotWidth, Math.floor(y) + 0.5);
          ctx.stroke();

          if (isSelected) {
            drawHandle(x, y, item.color, true);
            drawHandle(Math.min(mainPlotWidth - 20, (x + mainPlotWidth) / 2), y, item.color, true);
          } else {
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (item.type === 'vertical' && item.points.length >= 1) {
          const x = getXForTime(item.points[0].time);
          ctx.beginPath();
          ctx.moveTo(Math.floor(x) + 0.5, 0);
          ctx.lineTo(Math.floor(x) + 0.5, mainPlotHeight);
          ctx.stroke();

          if (isSelected) {
            drawHandle(x, mainPlotHeight / 2, item.color, true);
          }
        } else if (item.type === 'trendline' && item.points.length >= 2) {
          const x1 = getXForTime(item.points[0].time);
          const y1 = getYForPrice(item.points[0].price);
          const x2 = getXForTime(item.points[1].time);
          const y2 = getYForPrice(item.points[1].price);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          if (isSelected) {
            drawHandle(x1, y1, item.color, true);
            drawHandle(x2, y2, item.color, true);
            drawHandle((x1 + x2) / 2, (y1 + y2) / 2, item.color, true);
          }
        } else if (item.type === 'arrow' && item.points.length >= 2) {
          const x1 = getXForTime(item.points[0].time);
          const y1 = getYForPrice(item.points[0].price);
          const x2 = getXForTime(item.points[1].time);
          const y2 = getYForPrice(item.points[1].price);

          // Shaft
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Arrow head
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const headLen = 12;
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();

          if (isSelected) {
            drawHandle(x1, y1, item.color, true);
            drawHandle(x2, y2, item.color, true);
          }
        } else if (item.type === 'rectangle' && item.points.length >= 2) {
          const x1 = getXForTime(item.points[0].time);
          const y1 = getYForPrice(item.points[0].price);
          const x2 = getXForTime(item.points[1].time);
          const y2 = getYForPrice(item.points[1].price);

          const left = Math.min(x1, x2);
          const top = Math.min(y1, y2);
          const width = Math.abs(x2 - x1);
          const height = Math.abs(y2 - y1);

          // Semi-transparent box fill
          ctx.fillStyle = isDark ? 'rgba(0, 136, 204, 0.15)' : 'rgba(0, 136, 204, 0.12)';
          ctx.fillRect(left, top, width, height);

          // Border
          ctx.strokeRect(left, top, width, height);

          if (isSelected) {
            drawHandle(x1, y1, item.color, true);
            drawHandle(x2, y2, item.color, true);
            drawHandle(x1, y2, item.color, true);
            drawHandle(x2, y1, item.color, true);
            drawHandle((x1 + x2) / 2, (y1 + y2) / 2, item.color, true);
          }
        } else if (item.type === 'fibonacci' && item.points.length >= 2) {
          const p1 = item.points[0];
          const p2 = item.points[1];
          const x1 = getXForTime(p1.time);
          const x2 = getXForTime(p2.time);
          const y1 = getYForPrice(p1.price);
          const y2 = getYForPrice(p2.price);

          const leftX = Math.min(x1, x2);
          const rightX = Math.max(x1, x2, mainPlotWidth);

          const diffPrice = p2.price - p1.price;
          const fibRatios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
          const fibColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'];

          // Draw Trend Axis
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.setLineDash([]);

          fibRatios.forEach((ratio, fIdx) => {
            const fibPrice = p1.price + diffPrice * ratio;
            const fibY = getYForPrice(fibPrice);

            ctx.strokeStyle = fibColors[fIdx % fibColors.length];
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(leftX, Math.floor(fibY) + 0.5);
            ctx.lineTo(rightX, Math.floor(fibY) + 0.5);
            ctx.stroke();

            ctx.fillStyle = fibColors[fIdx % fibColors.length];
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${((Number(ratio) || 0) * 100).toFixed(1)}% (${(Number(fibPrice) || 0).toFixed(decimals)})`, leftX + 4, fibY - 3);
          });

          if (isSelected) {
            drawHandle(x1, y1, item.color, true);
            drawHandle(x2, y2, item.color, true);
          }
        } else if (item.type === 'ruler' && item.points.length >= 2) {
          const p1 = item.points[0];
          const p2 = item.points[1];
          const x1 = getXForTime(p1.time);
          const y1 = getYForPrice(p1.price);
          const x2 = getXForTime(p2.time);
          const y2 = getYForPrice(p2.price);

          ctx.fillStyle = isDark ? 'rgba(0, 136, 204, 0.15)' : 'rgba(0, 136, 204, 0.12)';
          ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));

          ctx.strokeStyle = '#0088cc';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          const priceDiff = p2.price - p1.price;
          const pctDiff = (priceDiff / (p1.price || 1)) * 100;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          ctx.fillStyle = priceDiff >= 0 ? green : red;
          ctx.beginPath();
          ctx.roundRect(midX - 35, midY - 10, 70, 20, 6);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${priceDiff >= 0 ? '+' : ''}${(Number(pctDiff) || 0).toFixed(2)}%`, midX, midY + 3);

          if (isSelected) {
            drawHandle(x1, y1, '#0088cc', true);
            drawHandle(x2, y2, '#0088cc', true);
          }
        } else if (item.type === 'brush' && item.points.length >= 2) {
          ctx.beginPath();
          item.points.forEach((pt, pIdx) => {
            const x = getXForTime(pt.time);
            const y = getYForPrice(pt.price);
            if (pIdx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();

          if (isSelected && item.points.length > 0) {
            const mid = item.points[Math.floor(item.points.length / 2)];
            drawHandle(getXForTime(mid.time), getYForPrice(mid.price), item.color, true);
          }
        }

        ctx.restore();
      });
    }

    // 6d. Live In-Progress Drawing Preview
    if (inProgressPoints.length > 0 && interactionRef.current.hoverX !== null && interactionRef.current.hoverY !== null) {
      const p1 = inProgressPoints[0];
      const x1 = getXForTime(p1.time);
      const y1 = getYForPrice(p1.price);
      const x2 = interactionRef.current.hoverX;
      const y2 = interactionRef.current.hoverY;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);

      if (activeDrawingTool === 'trendline' || activeDrawingTool === 'arrow' || activeDrawingTool === 'ruler') {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      } else if (activeDrawingTool === 'rectangle') {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
      } else if (activeDrawingTool === 'fibonacci') {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // 7. Live Laser Current Price Line (Tracks 60FPS activePrice smoothly)
    const currentY = getYForPrice(activePrice);
    const isCurrentUp = candles.length > 0 ? (activePrice >= (candles[candles.length - 1]?.open || activePrice)) : true;
    const liveColor = isCurrentUp ? green : red;

    if (currentY >= 0 && currentY <= mainPlotHeight) {
      ctx.beginPath();
      ctx.strokeStyle = liveColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.moveTo(0, Math.floor(currentY) + 0.5);
      ctx.lineTo(mainPlotWidth, Math.floor(currentY) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // 60FPS Breathing Pulse Beacon
      const pulsePhase = (now % 1100) / 1100;
      const rippleR = 3.5 + pulsePhase * 7.5;
      const rippleAlpha = (1 - pulsePhase) * 0.75;

      ctx.beginPath();
      ctx.arc(mainPlotWidth - 4, currentY, rippleR, 0, Math.PI * 2);
      ctx.strokeStyle = isCurrentUp ? `rgba(0, 176, 103, ${rippleAlpha})` : `rgba(255, 59, 48, ${rippleAlpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(mainPlotWidth - 4, currentY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = liveColor;
      ctx.fill();
    }

    // 8. Crosshair Lines
    const { hoverX, hoverY } = interactionRef.current;
    if (hoverX !== null && hoverY !== null && hoverX >= 0 && hoverX <= mainPlotWidth && hoverY >= 0 && hoverY <= mainPlotHeight) {
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(Math.floor(hoverX) + 0.5, 0);
      ctx.lineTo(Math.floor(hoverX) + 0.5, mainPlotHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, Math.floor(hoverY) + 0.5);
      ctx.lineTo(mainPlotWidth, Math.floor(hoverY) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore(); // Restore clip

    // 9. Live Price Badge on Right Axis
    if (currentY >= -15 && currentY <= dimensions.height + 15) {
      const badgeY = Math.max(12, Math.min(currentY, mainPlotHeight - 12));
      const badgeHeight = 18;
      const badgeWidth = priceAxisWidth - 2;

      ctx.fillStyle = liveColor;
      ctx.beginPath();
      ctx.moveTo(mainPlotWidth - 4, badgeY);
      ctx.lineTo(mainPlotWidth + 2, badgeY - badgeHeight / 2);
      ctx.lineTo(mainPlotWidth + badgeWidth, badgeY - badgeHeight / 2);
      ctx.lineTo(mainPlotWidth + badgeWidth, badgeY + badgeHeight / 2);
      ctx.lineTo(mainPlotWidth + 2, badgeY + badgeHeight / 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((Number(activePrice) || 0).toFixed(decimals), mainPlotWidth + badgeWidth / 2 + 1, badgeY);
    }

    // 9b. Stuck Execution Price Badge on Right Axis for Active Trades (Never fluctuates, holds locked on trade entry price)
    activeTrades.forEach(trade => {
      if (trade.status !== 'active' || trade.assetId !== assetId) return;
      const tradeEndTime = trade.strikeTime || (trade.createdAt + (trade.duration || 60) * 1000);
      if (now >= tradeEndTime) return;

      const tradeY = getYForPrice(trade.entryPrice);
      if (tradeY >= -15 && tradeY <= dimensions.height + 15) {
        const isCall = trade.type === 'CALL';
        const tradeColor = isCall ? '#00b067' : '#f6354a';
        const badgeY = Math.max(12, Math.min(tradeY, mainPlotHeight - 12));
        const badgeHeight = 18;
        const badgeWidth = priceAxisWidth - 2;

        ctx.save();
        ctx.fillStyle = tradeColor;
        ctx.beginPath();
        ctx.moveTo(mainPlotWidth - 4, badgeY);
        ctx.lineTo(mainPlotWidth + 2, badgeY - badgeHeight / 2);
        ctx.lineTo(mainPlotWidth + badgeWidth, badgeY - badgeHeight / 2);
        ctx.lineTo(mainPlotWidth + badgeWidth, badgeY + badgeHeight / 2);
        ctx.lineTo(mainPlotWidth + 2, badgeY + badgeHeight / 2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((Number(trade.entryPrice) || 0).toFixed(decimals), mainPlotWidth + badgeWidth / 2 + 1, badgeY);
        ctx.restore();
      }
    });

    // 10. Crosshair Hover Badge on Right Axis
    if (hoverX !== null && hoverY !== null && hoverX >= 0 && hoverY <= mainPlotHeight) {
      const hoverPrice = getPriceFromY(hoverY);
      ctx.fillStyle = isDark ? '#1e293b' : '#334155';
      ctx.fillRect(mainPlotWidth + 1, hoverY - 9, priceAxisWidth - 2, 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((Number(hoverPrice) || 0).toFixed(decimals), mainPlotWidth + (priceAxisWidth - 2) / 2 + 1, hoverY);
    }

    // -------------------------------------------------------------
    // 11. Render Oscillator Sub-Pane (RSI, MACD, Stochastic, etc.)
    // -------------------------------------------------------------
    if (oscPaneHeight > 0 && activeOscillators.length > 0) {
      const osc = activeOscillators[0]; // Primary active oscillator
      const oscTop = mainPlotHeight;
      const oscBottom = mainPlotHeight + oscPaneHeight;
      const oscH = oscPaneHeight;

      ctx.save();
      // Clip oscillator area
      ctx.beginPath();
      ctx.rect(0, oscTop, mainPlotWidth, oscH);
      ctx.clip();

      // Background & top border
      ctx.fillStyle = isDark ? '#090e15' : '#f8fafc';
      ctx.fillRect(0, oscTop, mainPlotWidth, oscH);
      ctx.strokeStyle = axisBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, oscTop);
      ctx.lineTo(mainPlotWidth, oscTop);
      ctx.stroke();

      // A. RSI
      if (osc.type === 'rsi') {
        const period = osc.period || 14;
        const ob = osc.overbought || 70;
        const os = osc.oversold || 30;
        const rsiVals = calculateRSI(rawSeries, period);

        const yOB = oscTop + oscH * (1 - ob / 100);
        const yOS = oscTop + oscH * (1 - os / 100);
        const yMid = oscTop + oscH * 0.5;

        // Shaded middle band (30 to 70)
        ctx.fillStyle = isDark ? 'rgba(249, 115, 22, 0.06)' : 'rgba(249, 115, 22, 0.08)';
        ctx.fillRect(0, yOB, mainPlotWidth, yOS - yOB);

        // Dashed threshold lines
        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        
        ctx.beginPath();
        ctx.moveTo(0, yOB);
        ctx.lineTo(mainPlotWidth, yOB);
        ctx.moveTo(0, yOS);
        ctx.lineTo(mainPlotWidth, yOS);
        ctx.moveTo(0, yMid);
        ctx.lineTo(mainPlotWidth, yMid);
        ctx.stroke();
        ctx.setLineDash([]);

        // RSI line
        const pts: { x: number; y: number }[] = [];
        let latestRsi = 50;
        for (let i = 0; i < candles.length; i++) {
          const v = rsiVals[startIndex + i];
          if (v !== null && Number.isFinite(v)) {
            const x = i * slotWidth + slotWidth / 2;
            const y = oscTop + oscH * (1 - Math.max(0, Math.min(100, v)) / 100);
            pts.push({ x, y });
            latestRsi = v;
          }
        }
        drawIndicatorLine(ctx, pts, osc.color || '#f97316', 2, 'solid');

        // RSI Badge
        ctx.fillStyle = osc.color || '#f97316';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`RSI (${period}): ${latestRsi.toFixed(1)}`, 8, oscTop + 12);
        ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
        ctx.fillText(`${ob}`, mainPlotWidth - 18, yOB - 2);
        ctx.fillText(`${os}`, mainPlotWidth - 18, yOS + 9);
      }

      // B. MACD
      else if (osc.type === 'macd') {
        const { macd, signal, histogram } = calculateMACD(rawSeries, osc.period || 12, osc.period2 || 26, osc.period3 || 9);
        const yZero = oscTop + oscH * 0.5;

        let maxAbs = 0.0001;
        for (let i = 0; i < candles.length; i++) {
          const idx = startIndex + i;
          if (macd[idx] !== null) maxAbs = Math.max(maxAbs, Math.abs(macd[idx]!));
          if (signal[idx] !== null) maxAbs = Math.max(maxAbs, Math.abs(signal[idx]!));
          if (histogram[idx] !== null) maxAbs = Math.max(maxAbs, Math.abs(histogram[idx]!));
        }

        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, yZero);
        ctx.lineTo(mainPlotWidth, yZero);
        ctx.stroke();

        const halfBar = Math.max(1, slotWidth * 0.35);
        for (let i = 0; i < candles.length; i++) {
          const hVal = histogram[startIndex + i];
          if (hVal !== null && Number.isFinite(hVal)) {
            const x = i * slotWidth + slotWidth / 2;
            const barH = (hVal / maxAbs) * (oscH * 0.42);
            ctx.fillStyle = hVal >= 0 ? '#00b067' : '#ef4444';
            ctx.fillRect(x - halfBar, yZero, halfBar * 2, -barH);
          }
        }

        const macdPts: { x: number; y: number }[] = [];
        const sigPts: { x: number; y: number }[] = [];
        let lastH = 0;
        for (let i = 0; i < candles.length; i++) {
          const idx = startIndex + i;
          const x = i * slotWidth + slotWidth / 2;
          const mv = macd[idx];
          const sv = signal[idx];
          if (mv !== null && Number.isFinite(mv)) macdPts.push({ x, y: yZero - (mv / maxAbs) * (oscH * 0.42) });
          if (sv !== null && Number.isFinite(sv)) sigPts.push({ x, y: yZero - (sv / maxAbs) * (oscH * 0.42) });
          if (histogram[idx] !== null) lastH = histogram[idx]!;
        }

        drawIndicatorLine(ctx, macdPts, osc.color || '#3b82f6', 1.8, 'solid');
        drawIndicatorLine(ctx, sigPts, osc.color2 || '#f97316', 1.5, 'solid');

        ctx.fillStyle = lastH >= 0 ? '#00b067' : '#ef4444';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`MACD (${osc.period || 12},${osc.period2 || 26},${osc.period3 || 9}): ${lastH.toFixed(4)}`, 8, oscTop + 12);
      }

      // C. Stochastic
      else if (osc.type === 'stochastic') {
        const { k, d } = calculateStochastic(rawSeries, osc.period || 14, osc.period2 || 3, osc.period3 || 3);
        const ob = osc.overbought || 80;
        const os = osc.oversold || 20;

        const yOB = oscTop + oscH * (1 - ob / 100);
        const yOS = oscTop + oscH * (1 - os / 100);

        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, yOB);
        ctx.lineTo(mainPlotWidth, yOB);
        ctx.moveTo(0, yOS);
        ctx.lineTo(mainPlotWidth, yOS);
        ctx.stroke();
        ctx.setLineDash([]);

        const kPts: { x: number; y: number }[] = [];
        const dPts: { x: number; y: number }[] = [];
        let lastK = 50;
        for (let i = 0; i < candles.length; i++) {
          const idx = startIndex + i;
          const x = i * slotWidth + slotWidth / 2;
          const kv = k[idx];
          const dv = d[idx];
          if (kv !== null) { kPts.push({ x, y: oscTop + oscH * (1 - Math.max(0, Math.min(100, kv)) / 100) }); lastK = kv; }
          if (dv !== null) dPts.push({ x, y: oscTop + oscH * (1 - Math.max(0, Math.min(100, dv)) / 100) });
        }

        drawIndicatorLine(ctx, kPts, osc.color || '#3b82f6', 1.8, 'solid');
        drawIndicatorLine(ctx, dPts, osc.color2 || '#ef4444', 1.5, 'solid');

        ctx.fillStyle = osc.color || '#3b82f6';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`Stoch (${osc.period || 14},${osc.period2 || 3}): %K ${lastK.toFixed(1)}`, 8, oscTop + 12);
      }

      // D. Awesome Oscillator
      else if (osc.type === 'awesome_oscillator') {
        const aoVals = calculateAwesomeOscillator(rawSeries);
        const yZero = oscTop + oscH * 0.5;

        let maxAbs = 0.0001;
        for (let i = 0; i < candles.length; i++) {
          const v = aoVals[startIndex + i];
          if (v !== null) maxAbs = Math.max(maxAbs, Math.abs(v));
        }

        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, yZero);
        ctx.lineTo(mainPlotWidth, yZero);
        ctx.stroke();

        const halfBar = Math.max(1, slotWidth * 0.35);
        for (let i = 0; i < candles.length; i++) {
          const v = aoVals[startIndex + i];
          if (v !== null && Number.isFinite(v)) {
            const x = i * slotWidth + slotWidth / 2;
            const barH = (v / maxAbs) * (oscH * 0.42);
            ctx.fillStyle = v >= 0 ? '#00b067' : '#ef4444';
            ctx.fillRect(x - halfBar, yZero, halfBar * 2, -barH);
          }
        }

        ctx.fillStyle = '#00b067';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('Awesome Oscillator (AO)', 8, oscTop + 12);
      }

      // E. CCI
      else if (osc.type === 'cci') {
        const cciVals = calculateCCI(rawSeries, osc.period || 20);
        const yOB = oscTop + oscH * 0.25;
        const yMid = oscTop + oscH * 0.5;
        const yOS = oscTop + oscH * 0.75;

        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, yOB);
        ctx.lineTo(mainPlotWidth, yOB);
        ctx.moveTo(0, yMid);
        ctx.lineTo(mainPlotWidth, yMid);
        ctx.moveTo(0, yOS);
        ctx.lineTo(mainPlotWidth, yOS);
        ctx.stroke();
        ctx.setLineDash([]);

        const pts: { x: number; y: number }[] = [];
        let lastVal = 0;
        for (let i = 0; i < candles.length; i++) {
          const v = cciVals[startIndex + i];
          if (v !== null) {
            const x = i * slotWidth + slotWidth / 2;
            const y = yMid - (v / 200) * (oscH * 0.4);
            pts.push({ x, y: Math.max(oscTop + 2, Math.min(oscBottom - 2, y)) });
            lastVal = v;
          }
        }

        drawIndicatorLine(ctx, pts, osc.color || '#f59e0b', 1.8, 'solid');
        ctx.fillStyle = osc.color || '#f59e0b';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`CCI (${osc.period || 20}): ${lastVal.toFixed(1)}`, 8, oscTop + 12);
      }

      // F. Williams %R
      else if (osc.type === 'williams_r') {
        const rVals = calculateWilliamsR(rawSeries, osc.period || 14);
        const yOB = oscTop + oscH * 0.2;
        const yOS = oscTop + oscH * 0.8;

        ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, yOB);
        ctx.lineTo(mainPlotWidth, yOB);
        ctx.moveTo(0, yOS);
        ctx.lineTo(mainPlotWidth, yOS);
        ctx.stroke();
        ctx.setLineDash([]);

        const pts: { x: number; y: number }[] = [];
        let lastVal = -50;
        for (let i = 0; i < candles.length; i++) {
          const v = rVals[startIndex + i];
          if (v !== null) {
            const x = i * slotWidth + slotWidth / 2;
            const y = oscTop + oscH * (Math.abs(v) / 100);
            pts.push({ x, y });
            lastVal = v;
          }
        }

        drawIndicatorLine(ctx, pts, osc.color || '#ec4899', 1.8, 'solid');
        ctx.fillStyle = osc.color || '#ec4899';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`Williams %R (${osc.period || 14}): ${lastVal.toFixed(1)}`, 8, oscTop + 12);
      }

      // G. ATR
      else if (osc.type === 'atr') {
        const atrVals = calculateATR(rawSeries, osc.period || 14);
        let maxAtr = 0.0001;
        let minAtr = Infinity;
        for (let i = 0; i < candles.length; i++) {
          const v = atrVals[startIndex + i];
          if (v !== null) {
            maxAtr = Math.max(maxAtr, v);
            minAtr = Math.min(minAtr, v);
          }
        }
        const range = (maxAtr - minAtr) || 0.0001;
        const pts: { x: number; y: number }[] = [];
        let lastVal = 0;
        for (let i = 0; i < candles.length; i++) {
          const v = atrVals[startIndex + i];
          if (v !== null) {
            const x = i * slotWidth + slotWidth / 2;
            const y = oscBottom - 6 - ((v - minAtr) / range) * (oscH - 24);
            pts.push({ x, y });
            lastVal = v;
          }
        }

        drawIndicatorLine(ctx, pts, osc.color || '#8b5cf6', 1.8, 'solid');
        ctx.fillStyle = osc.color || '#8b5cf6';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`ATR (${osc.period || 14}): ${lastVal.toFixed(decimals)}`, 8, oscTop + 12);
      }

      ctx.restore();
    }

    ctx.restore();
  }, [
    dimensions, theme, assetId, currentPrice, chartType, 
    activeTrades, mainPlotWidth, mainPlotHeight, selectedTimezone,
    drawings, hideAllDrawings, selectedDrawingId, inProgressPoints,
    activeDrawingTool, getWindowData, indicators, activeOscillators, oscPaneHeight
  ]);

  // High-performance continuous 60FPS animation loop with sub-pixel exponential lerp
  const renderCanvasRef = useRef(renderCanvas);
  renderCanvasRef.current = renderCanvas;
  const currentPriceRef = useRef(currentPrice);
  currentPriceRef.current = currentPrice;

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let isVisible = !document.hidden;

    const onVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        displayPriceRef.current = currentPriceRef.current;
        lastTime = performance.now();
        renderCanvasRef.current();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const loop = (time: number) => {
      if (!isVisible) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const targetP = currentPriceRef.current;
      if (!Number.isFinite(displayPriceRef.current) || displayPriceRef.current <= 0 || Math.abs(displayPriceRef.current - targetP) > targetP * 0.15) {
        displayPriceRef.current = targetP;
      } else {
        // High-velocity exponential easing (speed 22): rapid, crisp reaction with buttery 60fps continuity
        const lerpFactor = Math.min(1, dt * 22);
        displayPriceRef.current += (targetP - displayPriceRef.current) * lerpFactor;
      }

      renderCanvasRef.current();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      if (animId) cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Zoom Controls
  const handleZoom = (zoomIn: boolean) => {
    setVisibleCount(prev => {
      const step = prev > 100 ? 20 : prev > 50 ? 10 : prev > 20 ? 4 : 2;
      return zoomIn ? Math.max(6, prev - step) : Math.min(320, prev + step);
    });
  };

  const handleResetAll = () => {
    setPanOffset(0);
    setVisibleCount(32);
    setPriceScaleMultiplier(1.0);
    setPriceCenterShift(0);
  };

  // Keyboard shortcut to delete selected drawing or cancel tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedDrawingId) {
          setDrawings(prev => prev.filter(d => d.id !== selectedDrawingId));
          setSelectedDrawingId(null);
        }
      } else if (e.key === 'Escape') {
        setSelectedDrawingId(null);
        setActiveDrawingTool('none');
        setInProgressPoints([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrawingId]);

  // Hit-Testing: Check if cursor hits a handle or body of drawings (High tolerance for effortless control)
  const hitTestDrawings = useCallback((screenX: number, screenY: number) => {
    const data = getWindowData();
    if (!data) return null;
    const { mapper } = data;
    const { getXForTime, getYForPrice } = mapper;

    // 1. First check handles of the currently selected drawing (Touch-friendly Handle hit radius: 24px)
    if (selectedDrawingId) {
      const sel = drawings.find(d => d.id === selectedDrawingId);
      if (sel && !sel.locked) {
        // Point handles
        for (let i = 0; i < sel.points.length; i++) {
          const pt = sel.points[i];
          const hx = getXForTime(pt.time);
          const hy = getYForPrice(pt.price);
          if (Math.hypot(screenX - hx, screenY - hy) <= 24) {
            return { drawing: sel, handleIndex: i, type: 'handle' as const };
          }
        }
        // Center mid handle for moving trendlines / rectangles / horizontals
        if (sel.type === 'horizontal' && sel.points.length >= 1) {
          const hy = getYForPrice(sel.points[0].price);
          if (Math.hypot(screenX - (mainPlotWidth / 2), screenY - hy) <= 24) {
            return { drawing: sel, handleIndex: null, type: 'body' as const };
          }
        } else if (sel.points.length >= 2) {
          const x1 = getXForTime(sel.points[0].time);
          const y1 = getYForPrice(sel.points[0].price);
          const x2 = getXForTime(sel.points[1].time);
          const y2 = getYForPrice(sel.points[1].price);
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          if (Math.hypot(screenX - midX, screenY - midY) <= 24) {
            return { drawing: sel, handleIndex: null, type: 'body' as const };
          }
        }
      }
    }

    // 2. Check line / shape body of all drawings (Hit tolerance: 26px for effortless touch grab)
    const HIT_TOLERANCE = 26;
    for (let i = drawings.length - 1; i >= 0; i--) {
      const item = drawings[i];
      if (item.type === 'horizontal' && item.points.length >= 1) {
        const y = getYForPrice(item.points[0].price);
        if (Math.abs(screenY - y) <= HIT_TOLERANCE && screenX <= mainPlotWidth) {
          return { drawing: item, handleIndex: null, type: 'body' as const };
        }
      } else if (item.type === 'horizontal_ray' && item.points.length >= 1) {
        const x = getXForTime(item.points[0].time);
        const y = getYForPrice(item.points[0].price);
        if (screenX >= x - 10 && screenX <= mainPlotWidth && Math.abs(screenY - y) <= HIT_TOLERANCE) {
          return { drawing: item, handleIndex: null, type: 'body' as const };
        }
      } else if (item.type === 'vertical' && item.points.length >= 1) {
        const x = getXForTime(item.points[0].time);
        if (Math.abs(screenX - x) <= HIT_TOLERANCE && screenY <= mainPlotHeight) {
          return { drawing: item, handleIndex: null, type: 'body' as const };
        }
      } else if ((item.type === 'trendline' || item.type === 'arrow' || item.type === 'ruler') && item.points.length >= 2) {
        const x1 = getXForTime(item.points[0].time);
        const y1 = getYForPrice(item.points[0].price);
        const x2 = getXForTime(item.points[1].time);
        const y2 = getYForPrice(item.points[1].price);
        if (distToSegment(screenX, screenY, x1, y1, x2, y2) <= HIT_TOLERANCE) {
          return { drawing: item, handleIndex: null, type: 'body' as const };
        }
      } else if (item.type === 'rectangle' && item.points.length >= 2) {
        const x1 = getXForTime(item.points[0].time);
        const y1 = getYForPrice(item.points[0].price);
        const x2 = getXForTime(item.points[1].time);
        const y2 = getYForPrice(item.points[1].price);
        const left = Math.min(x1, x2);
        const right = Math.max(x1, x2);
        const top = Math.min(y1, y2);
        const bottom = Math.max(y1, y2);
        if (screenX >= left - HIT_TOLERANCE && screenX <= right + HIT_TOLERANCE && screenY >= top - HIT_TOLERANCE && screenY <= bottom + HIT_TOLERANCE) {
          return { drawing: item, handleIndex: null, type: 'body' as const };
        }
      } else if (item.type === 'fibonacci' && item.points.length >= 2) {
        const p1 = item.points[0];
        const p2 = item.points[1];
        const x1 = getXForTime(p1.time);
        const x2 = getXForTime(p2.time);
        const y1 = getYForPrice(p1.price);
        const y2 = getYForPrice(p2.price);
        const leftX = Math.min(x1, x2) - 20;
        const rightX = Math.max(x1, x2, mainPlotWidth);
        const diffPrice = p2.price - p1.price;
        const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];

        // Check if hitting any Fibonacci level line
        for (const r of ratios) {
          const fy = getYForPrice(p1.price + diffPrice * r);
          if (screenX >= leftX && screenX <= rightX && Math.abs(screenY - fy) <= HIT_TOLERANCE) {
            return { drawing: item, handleIndex: null, type: 'body' as const };
          }
        }
        if (distToSegment(screenX, screenY, x1, y1, x2, y2) <= HIT_TOLERANCE) {
          return { drawing: item, handleIndex: null, type: 'body' as const };
        }
      } else if (item.type === 'brush' && item.points.length >= 2) {
        for (let j = 0; j < item.points.length - 1; j++) {
          const bx1 = getXForTime(item.points[j].time);
          const by1 = getYForPrice(item.points[j].price);
          const bx2 = getXForTime(item.points[j + 1].time);
          const by2 = getYForPrice(item.points[j + 1].price);
          if (distToSegment(screenX, screenY, bx1, by1, bx2, by2) <= HIT_TOLERANCE) {
            return { drawing: item, handleIndex: null, type: 'body' as const };
          }
        }
      }
    }

    return null;
  }, [getWindowData, selectedDrawingId, drawings, mainPlotWidth, mainPlotHeight]);

  // Clone drawing handler
  const handleCloneDrawing = (d: DrawingItem) => {
    const data = getWindowData();
    if (!data) return;
    const priceOffset = (data.yRange || 10) * 0.04;
    const timeOffset = getTimeFrameMs(timeFrame) * 2;

    const cloned: DrawingItem = {
      ...d,
      id: `draw_${Date.now()}`,
      points: d.points.map(p => ({
        time: p.time + timeOffset,
        price: p.price + priceOffset
      }))
    };
    setDrawings(prev => [...prev, cloned]);
    setSelectedDrawingId(cloned.id);
  };

  // Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-interactive="true"]') || target.closest('button') || target.tagName === 'BUTTON') {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. Right Axis Drag -> Price Scale
    if (x >= mainPlotWidth) {
      interactionRef.current = {
        ...interactionRef.current,
        mode: 'price_scale',
        startX: e.clientX,
        startY: e.clientY,
        startPriceScale: priceScaleMultiplier,
        startPriceShift: priceCenterShift,
      };
      return;
    }

    // 2. Bottom Axis Drag -> Time Scale
    if (y >= dimensions.height - timeAxisHeight) {
      interactionRef.current = {
        ...interactionRef.current,
        mode: 'time_scale',
        startX: e.clientX,
        startY: e.clientY,
        startVisibleCount: visibleCount,
      };
      return;
    }

    // 3. Active Drawing Tool Creation (Click to Place)
    if (activeDrawingTool !== 'none' && x < mainPlotWidth && y < mainPlotHeight) {
      const snapped = snapToCandle(x, y);

      // Freehand Brush Mode
      if (activeDrawingTool === 'brush') {
        const newDrawing: DrawingItem = {
          id: `draw_${Date.now()}`,
          type: 'brush',
          points: [snapped],
          color: '#fbbf24',
          lineWidth: 2.5,
          lineStyle: 'solid'
        };
        setDrawings(prev => [...prev, newDrawing]);
        setSelectedDrawingId(newDrawing.id);
        interactionRef.current = {
          ...interactionRef.current,
          mode: 'brush',
          dragDrawingId: newDrawing.id,
        };
        return;
      }

      // 1-Click Tools (Horizontal Line, Horizontal Ray, Vertical Line)
      if (activeDrawingTool === 'horizontal' || activeDrawingTool === 'horizontal_ray' || activeDrawingTool === 'vertical') {
        const newDrawing: DrawingItem = {
          id: `draw_${Date.now()}`,
          type: activeDrawingTool,
          points: [snapped],
          color: activeDrawingTool === 'horizontal' ? '#fbbf24' : '#0088cc',
          lineWidth: 2,
          lineStyle: 'solid'
        };
        setDrawings(prev => [...prev, newDrawing]);
        setSelectedDrawingId(newDrawing.id);
        setActiveDrawingTool('none');
        return;
      }

      // 2-Click Tools (Trendline, Rectangle, Fibonacci, Arrow, Ruler, Channel)
      if (inProgressPoints.length === 0) {
        setInProgressPoints([snapped]);
      } else {
        const newDrawing: DrawingItem = {
          id: `draw_${Date.now()}`,
          type: activeDrawingTool,
          points: [inProgressPoints[0], snapped],
          color: activeDrawingTool === 'fibonacci' ? '#a855f7' : activeDrawingTool === 'rectangle' ? '#0088cc' : activeDrawingTool === 'arrow' ? '#00b067' : '#fbbf24',
          lineWidth: 2,
          lineStyle: 'solid'
        };
        setDrawings(prev => [...prev, newDrawing]);
        setSelectedDrawingId(newDrawing.id);
        setInProgressPoints([]);
        setActiveDrawingTool('none');
      }
      return;
    }

    // 4. Hit-Test Existing Drawings to Move / Drag
    const hit = hitTestDrawings(x, y);
    if (hit) {
      setSelectedDrawingId(hit.drawing.id);
      const data = getWindowData();
      if (!data) return;
      const { mapper } = data;

      if (hit.type === 'handle' && hit.handleIndex !== null) {
        // Dragging a specific handle (Anchor Point)
        interactionRef.current = {
          ...interactionRef.current,
          mode: 'drag_handle',
          startX: e.clientX,
          startY: e.clientY,
          dragDrawingId: hit.drawing.id,
          dragHandleIndex: hit.handleIndex,
          startPoints: hit.drawing.points.map(p => ({ ...p })),
          startMousePrice: mapper.getPriceFromY(y),
          startMouseTime: mapper.getTimeFromX(x),
        };
        return;
      } else {
        // Dragging entire Drawing Body (Whole Line / Box / Fib)
        interactionRef.current = {
          ...interactionRef.current,
          mode: 'drag_drawing',
          startX: e.clientX,
          startY: e.clientY,
          dragDrawingId: hit.drawing.id,
          dragHandleIndex: null,
          startPoints: hit.drawing.points.map(p => ({ ...p })),
          startMousePrice: mapper.getPriceFromY(y),
          startMouseTime: mapper.getTimeFromX(x),
        };
        return;
      }
    }

    // 5. Clicked empty plot area -> Deselect and Pan Chart
    setSelectedDrawingId(null);
    interactionRef.current = {
      ...interactionRef.current,
      mode: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      startPanOffset: panOffset,
      startPriceShift: priceCenterShift,
    };
  };

  // Mouse Move Event Handler (Smooth 60FPS Drag & Scale)
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.max(0, Math.min(e.clientX - rect.left, dimensions.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, dimensions.height));

    interactionRef.current.hoverX = x;
    interactionRef.current.hoverY = y;

    const { mode, startY, startX, startPriceScale, startPanOffset, startVisibleCount, dragDrawingId, dragHandleIndex, startPoints, startMousePrice, startMouseTime } = interactionRef.current;

    // Price Scale Dragging
    if (mode === 'price_scale') {
      const deltaY = startY - e.clientY;
      const sensitivity = 0.007;
      const newScale = Math.max(0.15, Math.min(8.0, startPriceScale * Math.exp(deltaY * sensitivity)));
      setPriceScaleMultiplier(newScale);
      return;
    }

    // Time Scale Dragging
    if (mode === 'time_scale') {
      const deltaX = e.clientX - startX;
      const shift = Math.round(deltaX / 15);
      setVisibleCount(Math.max(6, Math.min(320, startVisibleCount - shift)));
      return;
    }

    // Freehand Brush Dragging
    if (mode === 'brush' && dragDrawingId) {
      const snapped = snapToCandle(x, y);
      setDrawings(prev => prev.map(d => {
        if (d.id === dragDrawingId) {
          return { ...d, points: [...d.points, snapped] };
        }
        return d;
      }));
      return;
    }

    // Dragging an Anchor Handle (Resize / Adjust Angle)
    if (mode === 'drag_handle' && dragDrawingId && dragHandleIndex !== null) {
      const snapped = snapToCandle(x, y);
      setDrawings(prev => prev.map(d => {
        if (d.id === dragDrawingId) {
          const updatedPoints = [...d.points];
          updatedPoints[dragHandleIndex] = snapped;
          return { ...d, points: updatedPoints };
        }
        return d;
      }));
      return;
    }

    // Dragging Entire Drawing Body (Move whole line / box in price & time!)
    if (mode === 'drag_drawing' && dragDrawingId && startPoints.length > 0) {
      const data = getWindowData();
      if (!data) return;
      const { mapper } = data;
      const currentMousePrice = mapper.getPriceFromY(y);
      const currentMouseTime = mapper.getTimeFromX(x);

      const deltaPrice = currentMousePrice - startMousePrice;
      const deltaTime = currentMouseTime - startMouseTime;

      setDrawings(prev => prev.map(d => {
        if (d.id === dragDrawingId && !d.locked) {
          return {
            ...d,
            points: startPoints.map(p => ({
              time: p.time + deltaTime,
              price: p.price + deltaPrice
            }))
          };
        }
        return d;
      }));
      return;
    }

    // Pan Chart
    if (mode === 'pan') {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const slotWidth = mainPlotWidth / visibleCount;
      const candleShift = Math.round(deltaX / slotWidth);
      const rawSeries = getCandleSeries(assetId || '1', currentPrice || getCanonicalPrice(assetId || '1'), timeFrame);
      const maxOffset = Math.max(0, rawSeries.length - visibleCount);
      const newOffset = Math.max(-12, Math.min(maxOffset, startPanOffset + candleShift));
      setPanOffset(newOffset);

      const verticalRatio = deltaY / mainPlotHeight;
      setPriceCenterShift(touchStateRef.current.startPriceShift + verticalRatio * (1.2 / Math.max(0.2, priceScaleMultiplier)));
      return;
    }

    // Dynamic Hover Cursor Detection
    if (activeDrawingTool !== 'none') {
      setCursorStyle('crosshair');
    } else if (x >= mainPlotWidth) {
      setCursorStyle('ns-resize');
    } else if (y >= dimensions.height - timeAxisHeight) {
      setCursorStyle('ew-resize');
    } else {
      const hit = hitTestDrawings(x, y);
      if (hit) {
        setCursorStyle(hit.type === 'handle' ? 'pointer' : 'move');
      } else {
        setCursorStyle('crosshair');
      }
    }

    // Hover detection for OHLC HUD
    const data = getWindowData();
    if (data) {
      const { candles, mapper } = data;
      const idx = Math.min(Math.floor(x / mapper.slotWidth), candles.length - 1);
      if (idx >= 0 && idx < candles.length) {
        setHoveredCandle(candles[idx]);
      }
    }
  };

  const handleMouseUp = () => {
    if (interactionRef.current.mode === 'brush') {
      setActiveDrawingTool('none');
    }
    interactionRef.current.mode = 'none';
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;

    if (x >= mainPlotWidth) {
      setPriceScaleMultiplier(1.0);
      setPriceCenterShift(0);
    } else {
      handleResetAll();
    }
  };

  // Keyboard Shortcuts (Delete, Escape, Duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedDrawingId) {
          setDrawings(prev => prev.filter(d => d.id !== selectedDrawingId));
          setSelectedDrawingId(null);
        }
      } else if (e.key === 'Escape') {
        setActiveDrawingTool('none');
        setInProgressPoints([]);
        setSelectedDrawingId(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedDrawingId) {
          const sel = drawings.find(d => d.id === selectedDrawingId);
          if (sel) handleCloneDrawing(sel);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrawingId, drawings]);

  // Touch Handlers with Panning, Pinch Zoom, and Drawing
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-interactive="true"]') || target.closest('button') || target.tagName === 'BUTTON') {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.touches.length === 1) {
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;

      if (activeDrawingTool !== 'none' && x < mainPlotWidth && y < mainPlotHeight) {
        const snapped = snapToCandle(x, y);

        // Freehand Brush Mode on Touch
        if (activeDrawingTool === 'brush') {
          const newDrawing: DrawingItem = {
            id: `draw_${Date.now()}`,
            type: 'brush',
            points: [snapped],
            color: '#fbbf24',
            lineWidth: 2.5,
            lineStyle: 'solid'
          };
          setDrawings(prev => [...prev, newDrawing]);
          setSelectedDrawingId(newDrawing.id);
          touchStateRef.current = {
            ...touchStateRef.current,
            mode: 'brush',
            dragDrawingId: newDrawing.id,
          };
          return;
        }

        if (activeDrawingTool === 'horizontal' || activeDrawingTool === 'horizontal_ray' || activeDrawingTool === 'vertical') {
          const newDrawing: DrawingItem = {
            id: `draw_${Date.now()}`,
            type: activeDrawingTool,
            points: [snapped],
            color: activeDrawingTool === 'horizontal' ? '#fbbf24' : '#0088cc',
            lineWidth: 2,
            lineStyle: 'solid'
          };
          setDrawings(prev => [...prev, newDrawing]);
          setSelectedDrawingId(newDrawing.id);
          setActiveDrawingTool('none');
          return;
        }

        if (inProgressPoints.length === 0) {
          setInProgressPoints([snapped]);
          interactionRef.current.hoverX = x;
          interactionRef.current.hoverY = y;
        } else {
          const newDrawing: DrawingItem = {
            id: `draw_${Date.now()}`,
            type: activeDrawingTool,
            points: [inProgressPoints[0], snapped],
            color: activeDrawingTool === 'fibonacci' ? '#a855f7' : activeDrawingTool === 'rectangle' ? '#0088cc' : activeDrawingTool === 'arrow' ? '#00b067' : activeDrawingTool === 'ruler' ? '#0088cc' : '#fbbf24',
            lineWidth: 2,
            lineStyle: 'solid'
          };
          setDrawings(prev => [...prev, newDrawing]);
          setSelectedDrawingId(newDrawing.id);
          setInProgressPoints([]);
          setActiveDrawingTool('none');
          interactionRef.current.hoverX = null;
          interactionRef.current.hoverY = null;
        }
        return;
      }

      // Check hit test on touch
      const hit = hitTestDrawings(x, y);
      if (hit) {
        setSelectedDrawingId(hit.drawing.id);
        const data = getWindowData();
        if (data) {
          const { mapper } = data;
          touchStateRef.current = {
            ...touchStateRef.current,
            mode: hit.type === 'handle' ? 'drag_handle' : 'drag_drawing',
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            dragDrawingId: hit.drawing.id,
            dragHandleIndex: hit.handleIndex,
            startPoints: hit.drawing.points.map(p => ({ ...p })),
            startMousePrice: mapper.getPriceFromY(y),
            startMouseTime: mapper.getTimeFromX(x),
          };
          return;
        }
      }

      if (x >= mainPlotWidth) {
        touchStateRef.current = {
          ...touchStateRef.current,
          mode: 'price_scale',
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          startPriceScale: priceScaleMultiplier,
          startPriceShift: priceCenterShift,
        };
      } else {
        setSelectedDrawingId(null);
        touchStateRef.current = {
          ...touchStateRef.current,
          mode: 'pan',
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          startPanOffset: panOffset,
          startPriceShift: priceCenterShift,
          initialPinchDistance: null,
        };
      }
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStateRef.current = {
        ...touchStateRef.current,
        mode: 'none',
        initialPinchDistance: dist,
        startVisibleCount: visibleCount,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (activeDrawingTool !== 'none' && inProgressPoints.length > 0 && e.touches.length === 1) {
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      interactionRef.current.hoverX = x;
      interactionRef.current.hoverY = y;
      return;
    }

    if (touchStateRef.current.mode === 'brush' && touchStateRef.current.dragDrawingId && e.touches.length === 1) {
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const data = getWindowData();
      if (!data) return;
      const { mapper } = data;
      const pt: ChartPoint = {
        time: mapper.getTimeFromX(x),
        price: mapper.getPriceFromY(y)
      };
      setDrawings(prev => prev.map(d => {
        if (d.id === touchStateRef.current.dragDrawingId) {
          return { ...d, points: [...d.points, pt] };
        }
        return d;
      }));
      return;
    } else if (touchStateRef.current.mode === 'drag_drawing' && touchStateRef.current.dragDrawingId && e.touches.length === 1) {
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const data = getWindowData();
      if (!data) return;
      const { mapper } = data;
      const currentMousePrice = mapper.getPriceFromY(y);
      const currentMouseTime = mapper.getTimeFromX(x);
      const deltaPrice = currentMousePrice - touchStateRef.current.startMousePrice;
      const deltaTime = currentMouseTime - touchStateRef.current.startMouseTime;

      setDrawings(prev => prev.map(d => {
        if (d.id === touchStateRef.current.dragDrawingId && !d.locked) {
          return {
            ...d,
            points: touchStateRef.current.startPoints.map(p => ({
              time: p.time + deltaTime,
              price: p.price + deltaPrice
            }))
          };
        }
        return d;
      }));
    } else if (touchStateRef.current.mode === 'drag_handle' && touchStateRef.current.dragDrawingId && e.touches.length === 1) {
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const snapped = snapToCandle(x, y);
      setDrawings(prev => prev.map(d => {
        if (d.id === touchStateRef.current.dragDrawingId && touchStateRef.current.dragHandleIndex !== null) {
          const updated = [...d.points];
          updated[touchStateRef.current.dragHandleIndex] = snapped;
          return { ...d, points: updated };
        }
        return d;
      }));
    } else if (touchStateRef.current.mode === 'price_scale' && e.touches.length === 1) {
      const deltaY = touchStateRef.current.startY - e.touches[0].clientY;
      const sensitivity = 0.007;
      const newScale = Math.max(0.15, Math.min(8.0, touchStateRef.current.startPriceScale * Math.exp(deltaY * sensitivity)));
      setPriceScaleMultiplier(newScale);
    } else if (touchStateRef.current.mode === 'pan' && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchStateRef.current.startX;
      const deltaY = e.touches[0].clientY - touchStateRef.current.startY;

      const slotWidth = mainPlotWidth / visibleCount;
      const candleShift = Math.round(deltaX / slotWidth);
      const rawSeries = getCandleSeries(assetId || '1', currentPrice || getCanonicalPrice(assetId || '1'), timeFrame);
      const maxOffset = Math.max(0, rawSeries.length - visibleCount);
      const newOffset = Math.max(-12, Math.min(maxOffset, touchStateRef.current.startPanOffset + candleShift));
      setPanOffset(newOffset);

      const verticalRatio = deltaY / mainPlotHeight;
      setPriceCenterShift(touchStateRef.current.startPriceShift + verticalRatio * (1.2 / Math.max(0.2, priceScaleMultiplier)));
    } else if (touchStateRef.current.initialPinchDistance && e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = touchStateRef.current.initialPinchDistance / dist;
      const newVisible = Math.round(touchStateRef.current.startVisibleCount * scale);
      setVisibleCount(Math.max(6, Math.min(320, newVisible)));
    }
  };

  const handleTouchEnd = () => {
    if (touchStateRef.current.mode === 'brush') {
      setActiveDrawingTool('none');
    }
    touchStateRef.current.mode = 'none';
    touchStateRef.current.initialPinchDistance = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      handleZoom(e.deltaY < 0);
    } else {
      const rawSeries = getCandleSeries(assetId || '1', currentPrice || getCanonicalPrice(assetId || '1'), timeFrame);
      const maxOffset = Math.max(0, rawSeries.length - visibleCount);
      setPanOffset(prev => Math.max(-12, Math.min(maxOffset, prev + (e.deltaX > 0 ? 2 : -2))));
    }
  };

  const handlePointerLeave = () => {
    interactionRef.current.hoverX = null;
    interactionRef.current.hoverY = null;
    interactionRef.current.mode = 'none';
    setHoveredCandle(null);
  };

  const isDark = theme === 'dark';
  const decimals = getPrecision(currentPrice || 100);
  const fmt = (val: number | undefined | null) => (val !== undefined && val !== null ? Number(val).toFixed(decimals) : '0.00');

  const isScaleModified = priceScaleMultiplier !== 1.0 || priceCenterShift !== 0 || panOffset !== 0 || visibleCount !== 32;
  const selectedDrawing = drawings.find(d => d.id === selectedDrawingId) || null;

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative select-none overflow-hidden touch-none ${
        isDark ? 'bg-[#0b1118]' : 'bg-white'
      } transition-colors duration-150`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onWheel={handleWheel}
      onPointerLeave={handlePointerLeave}
      style={{ cursor: cursorStyle }}
    >
      {/* Loading Skeleton */}
      {(!chartReady || isLoading) && (
        <div className={`absolute inset-0 z-40 flex flex-col items-center justify-center backdrop-blur-xs transition-opacity duration-300 ${
          isDark ? 'bg-[#0b1118]/85' : 'bg-white/85'
        }`}>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#0088cc]/20 border-t-[#0088cc] animate-spin" />
            <span className="text-[10px] font-black tracking-widest text-[#0088cc] uppercase">
              Loading Feed
            </span>
          </div>
        </div>
      )}

      {/* 60FPS High-DPI Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Top OHLC & Candle Countdown HUD */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none flex items-center gap-2">
        {hoveredCandle ? (
          <div className={`flex items-center gap-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-xs ${
            isDark ? 'bg-slate-900/80 text-slate-300' : 'bg-white/80 text-slate-600'
          }`}>
            <span>O:{fmt(hoveredCandle.open)}</span>
            <span>H:{fmt(hoveredCandle.high)}</span>
            <span>L:{fmt(hoveredCandle.low)}</span>
            <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-[#00b067]' : 'text-[#ff3b30]'}>
              C:{fmt(hoveredCandle.close)}
            </span>
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${
            isDark ? 'bg-slate-900/80 text-slate-300' : 'bg-white/80 text-slate-600'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00b067] animate-pulse" />
            <span>{timeFrame}</span>
            <span className="text-gray-300">|</span>
            <span className="font-mono text-[#0088cc] dark:text-[#38bdf8]">
              {candleCountdown < 10 ? `0${candleCountdown}` : candleCountdown}s
            </span>
          </div>
        )}
      </div>

      {/* Top Floating Drawing Tools Palette */}
      <DrawingToolsBar
        activeTool={activeDrawingTool}
        onSelectTool={(tool) => {
          setActiveDrawingTool(tool);
          setInProgressPoints([]);
        }}
        magnetMode={magnetMode}
        onToggleMagnet={() => {
          const next = !magnetMode;
          setMagnetMode(next);
          localStorage.setItem('chart_magnet_mode', String(next));
        }}
        drawingsCount={drawings.length}
        onClearDrawings={() => {
          setDrawings([]);
          setSelectedDrawingId(null);
          setInProgressPoints([]);
        }}
        hideAllDrawings={hideAllDrawings}
        onToggleHideAllDrawings={() => setHideAllDrawings(!hideAllDrawings)}
        theme={theme}
      />

      {/* Active Indicators Quick Strip (Only shown when indicators are active) */}
      {indicators.some(i => i.enabled) && (
        <div 
          className={`absolute top-9 z-30 flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-md select-none pointer-events-auto transition-all ${
            activeDrawingTool !== 'none' ? 'left-36' : 'left-11'
          }`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {indicators.filter(i => i.enabled).map(ind => (
            <div
              key={ind.id}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border shadow-xs backdrop-blur-xs shrink-0 ${
                isDark 
                  ? 'bg-slate-900/85 border-slate-700 text-slate-200' 
                  : 'bg-white/90 border-gray-200 text-gray-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ind.color }} />
              <span 
                className="cursor-pointer hover:underline truncate max-w-[80px]"
                onClick={() => setIsIndicatorsModalOpen(true)}
              >
                {ind.name.split(' ')[0]} {ind.period ? `(${ind.period})` : ''}
              </span>
              <button
                type="button"
                onClick={() => handleUpdateIndicator({ ...ind, enabled: false })}
                className="hover:text-rose-500 text-gray-400 p-0.5 rounded cursor-pointer shrink-0"
                title="Remove Indicator"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Drawing Floating Action Toolbar (Color, Thickness, Styles, Lock, Duplicate, Delete) */}
      <SelectedDrawingToolbar
        drawing={selectedDrawing}
        onUpdateDrawing={(updated) => {
          setDrawings(prev => prev.map(d => d.id === updated.id ? updated : d));
        }}
        onDeleteDrawing={(id) => {
          setDrawings(prev => prev.filter(d => d.id !== id));
          setSelectedDrawingId(null);
        }}
        onCloneDrawing={handleCloneDrawing}
        onDeselect={() => setSelectedDrawingId(null)}
        theme={theme}
      />

      {/* Floating Zoom & Auto Scale Reset Pad */}
      <div className="absolute bottom-6 left-2 z-20 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-gray-200 dark:border-slate-700 p-0.5 rounded-lg shadow-md pointer-events-auto">
        <button
          onClick={() => handleZoom(true)}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom(false)}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        {isScaleModified && (
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1 px-1.5 py-1 rounded bg-blue-50 dark:bg-blue-950 text-[#0088cc] dark:text-[#38bdf8] text-[9px] font-black transition-all cursor-pointer"
            title="Auto-Center Live View"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Auto</span>
          </button>
        )}
      </div>

      {/* Floating Jump to Live Indicator when Panned to History */}
      {panOffset > 8 && (
        <button
          onClick={handleResetAll}
          className="absolute bottom-6 right-20 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#0088cc] hover:bg-[#0077b5] text-white text-[11px] font-black shadow-lg shadow-blue-500/25 animate-in fade-in zoom-in duration-200 cursor-pointer active:scale-95 transition-all"
          title="Jump to Latest Live Candles"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Live View →</span>
        </button>
      )}
      {/* Technical Indicators A-to-Z Settings & Catalog Modal */}
      <IndicatorsModal
        isOpen={isIndicatorsModalOpen || Boolean(isIndicatorsOpen)}
        onClose={() => {
          setIsIndicatorsModalOpen(false);
          if (onToggleIndicators) onToggleIndicators();
        }}
        indicators={indicators}
        onUpdateIndicator={handleUpdateIndicator}
        onApplyPreset={handleApplyPreset}
        theme={theme}
      />
    </div>
  );
});

CandlestickChart.displayName = 'CandlestickChart';
