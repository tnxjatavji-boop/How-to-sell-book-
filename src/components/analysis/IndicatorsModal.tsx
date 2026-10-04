import React, { useState } from 'react';
import { 
  X, Check, Sliders, Activity, TrendingUp, 
  Layers, Sparkles, RotateCcw, Eye, EyeOff, Search,
  SlidersHorizontal, Trash2
} from 'lucide-react';
import { IndicatorConfig, IndicatorType, IndicatorCategory } from '../../types/analysis';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: IndicatorConfig[];
  onUpdateIndicator: (indicator: IndicatorConfig) => void;
  onApplyPreset: (presetName: string) => void;
  theme?: 'light' | 'dark';
}

export const A_TO_Z_INDICATORS: {
  id: string;
  type: IndicatorType;
  name: string;
  category: IndicatorCategory;
  description: string;
  defaultPeriod?: number;
  defaultPeriod2?: number;
  defaultPeriod3?: number;
  defaultColor: string;
  defaultColor2?: string;
  defaultColor3?: string;
  defaultStdDev?: number;
  defaultMultiplier?: number;
  defaultStep?: number;
  defaultMaximum?: number;
  defaultOverbought?: number;
  defaultOversold?: number;
}[] = [
  // --- A ---
  {
    id: 'alligator',
    type: 'alligator',
    name: 'Alligator (Bill Williams)',
    category: 'trend',
    description: 'Jaws (13, 8), Teeth (8, 5), Lips (5, 3) moving averages',
    defaultColor: '#3b82f6',
    defaultColor2: '#ef4444',
    defaultColor3: '#10b981'
  },
  {
    id: 'atr',
    type: 'atr',
    name: 'ATR (Average True Range)',
    category: 'oscillators',
    description: 'Volatility metric showing market expansion and contraction',
    defaultPeriod: 14,
    defaultColor: '#8b5cf6'
  },
  {
    id: 'awesome_oscillator',
    type: 'awesome_oscillator',
    name: 'Awesome Oscillator (AO)',
    category: 'oscillators',
    description: 'Market momentum oscillator comparing 5 & 34 median price SMAs',
    defaultColor: '#10b981'
  },

  // --- B ---
  {
    id: 'bollinger',
    type: 'bollinger',
    name: 'Bollinger Bands (20, 2)',
    category: 'volatility',
    description: 'Upper/Lower standard deviation volatility bands & middle SMA',
    defaultPeriod: 20,
    defaultStdDev: 2,
    defaultColor: '#0088cc',
    defaultColor2: '#38bdf8'
  },

  // --- C ---
  {
    id: 'cci',
    type: 'cci',
    name: 'CCI (Commodity Channel Index)',
    category: 'oscillators',
    description: 'Cyclical momentum oscillator with +100/-100 threshold levels',
    defaultPeriod: 20,
    defaultColor: '#f59e0b',
    defaultOverbought: 100,
    defaultOversold: -100
  },

  // --- D ---
  {
    id: 'donchian',
    type: 'donchian',
    name: 'Donchian Channels',
    category: 'volatility',
    description: 'Highest high and lowest low bands over N periods for breakout trading',
    defaultPeriod: 20,
    defaultColor: '#14b8a6'
  },

  // --- E ---
  {
    id: 'ema_9',
    type: 'ema',
    name: 'EMA 9 (Fast Signal)',
    category: 'trend',
    description: 'Exponential Moving Average 9 period (Rapid momentum)',
    defaultPeriod: 9,
    defaultColor: '#00b067'
  },
  {
    id: 'ema_21',
    type: 'ema',
    name: 'EMA 21 (Swing Dynamic)',
    category: 'trend',
    description: 'Exponential Moving Average 21 period (Short-to-medium swing support)',
    defaultPeriod: 21,
    defaultColor: '#3b82f6'
  },
  {
    id: 'ema_50',
    type: 'ema',
    name: 'EMA 50 (Major Trend)',
    category: 'trend',
    description: 'Exponential Moving Average 50 period (Institutional baseline)',
    defaultPeriod: 50,
    defaultColor: '#a855f7'
  },
  {
    id: 'ema_200',
    type: 'ema',
    name: 'EMA 200 (Macro Anchor)',
    category: 'trend',
    description: 'Exponential Moving Average 200 period (Macro Bull/Bear boundary)',
    defaultPeriod: 200,
    defaultColor: '#f43f5e'
  },
  {
    id: 'envelopes',
    type: 'envelopes',
    name: 'Envelopes (SMA % Bands)',
    category: 'volatility',
    description: 'Moving average envelope bands with percentage offset',
    defaultPeriod: 20,
    defaultMultiplier: 0.1,
    defaultColor: '#f97316'
  },

  // --- F ---
  {
    id: 'fractals',
    type: 'fractals',
    name: 'Fractals (Bill Williams)',
    category: 'structure',
    description: 'Highlights 5-bar swing high & low reversal pivots on chart',
    defaultColor: '#e11d48'
  },

  // --- I ---
  {
    id: 'ichimoku',
    type: 'ichimoku',
    name: 'Ichimoku Cloud (9, 26, 52)',
    category: 'trend',
    description: 'Tenkan, Kijun, and Leading Senkou Spans with cloud shading',
    defaultPeriod: 9,
    defaultPeriod2: 26,
    defaultPeriod3: 52,
    defaultColor: '#0ea5e9',
    defaultColor2: '#ef4444'
  },

  // --- M ---
  {
    id: 'macd',
    type: 'macd',
    name: 'MACD (12, 26, 9)',
    category: 'oscillators',
    description: 'Moving Average Convergence Divergence & Histogram',
    defaultPeriod: 12,
    defaultPeriod2: 26,
    defaultPeriod3: 9,
    defaultColor: '#3b82f6',
    defaultColor2: '#f97316'
  },
  {
    id: 'momentum',
    type: 'momentum',
    name: 'Momentum (10)',
    category: 'oscillators',
    description: 'Measures the rate of price change over 10 periods',
    defaultPeriod: 10,
    defaultColor: '#06b6d4'
  },

  // --- P ---
  {
    id: 'sar',
    type: 'sar',
    name: 'Parabolic SAR',
    category: 'trend',
    description: 'Trailing stop-and-reverse dots on price chart',
    defaultStep: 0.02,
    defaultMaximum: 0.2,
    defaultColor: '#06b6d4'
  },
  {
    id: 'pivot_points',
    type: 'pivot_points',
    name: 'Pivot Points Floor (S/R)',
    category: 'structure',
    description: 'Calculates R2, R1, Pivot, S1, S2 support & resistance horizontal levels',
    defaultPeriod: 20,
    defaultColor: '#f59e0b'
  },
  {
    id: 'patterns',
    type: 'patterns',
    name: 'Pattern Recognition AI',
    category: 'structure',
    description: 'Highlights Hammers, Shooting Stars, Engulfings and Doji candles',
    defaultPeriod: 5,
    defaultColor: '#10b981'
  },

  // --- R ---
  {
    id: 'rsi',
    type: 'rsi',
    name: 'RSI (Relative Strength Index)',
    category: 'oscillators',
    description: '14-period momentum oscillator with 70/30 Overbought/Oversold levels',
    defaultPeriod: 14,
    defaultOverbought: 70,
    defaultOversold: 30,
    defaultColor: '#f97316'
  },

  // --- S ---
  {
    id: 'sma_fast',
    type: 'sma',
    name: 'SMA 7 (Fast Scalp)',
    category: 'trend',
    description: 'Simple Moving Average 7 period (Short-term scalp guidance)',
    defaultPeriod: 7,
    defaultColor: '#fbbf24'
  },
  {
    id: 'sma_slow',
    type: 'sma',
    name: 'SMA 25 (Standard)',
    category: 'trend',
    description: 'Simple Moving Average 25 period (Medium-term trend direction)',
    defaultPeriod: 25,
    defaultColor: '#0088cc'
  },
  {
    id: 'stochastic',
    type: 'stochastic',
    name: 'Stochastic Oscillator (14, 3, 3)',
    category: 'oscillators',
    description: 'Fast %K and slow %D oscillator with 80/20 Overbought/Oversold levels',
    defaultPeriod: 14,
    defaultPeriod2: 3,
    defaultPeriod3: 3,
    defaultOverbought: 80,
    defaultOversold: 20,
    defaultColor: '#3b82f6',
    defaultColor2: '#ef4444'
  },
  {
    id: 'supertrend',
    type: 'supertrend',
    name: 'SuperTrend (10, 3)',
    category: 'trend',
    description: 'ATR-based dynamic trend indicator with Bullish Green & Bearish Red lines',
    defaultPeriod: 10,
    defaultMultiplier: 3,
    defaultColor: '#00b067'
  },

  // --- W ---
  {
    id: 'williams_r',
    type: 'williams_r',
    name: 'Williams %R (14)',
    category: 'oscillators',
    description: 'Inverse momentum oscillator ranging between 0 and -100 (-20 / -80 levels)',
    defaultPeriod: 14,
    defaultOverbought: -20,
    defaultOversold: -80,
    defaultColor: '#ec4899'
  },
  {
    id: 'wma_20',
    type: 'wma',
    name: 'WMA 20 (Weighted)',
    category: 'trend',
    description: 'Weighted Moving Average 20 period giving higher weight to recent prices',
    defaultPeriod: 20,
    defaultColor: '#6366f1'
  },

  // --- Z ---
  {
    id: 'zigzag',
    type: 'zigzag',
    name: 'ZigZag Swings (12, 1)',
    category: 'structure',
    description: 'Filters out noise and connects key swing highs and swing lows',
    defaultPeriod: 12,
    defaultMultiplier: 1,
    defaultColor: '#ec4899'
  }
];

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onUpdateIndicator,
  onApplyPreset,
  theme = 'light'
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | IndicatorCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const categories: { id: 'all' | IndicatorCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: `All (${A_TO_Z_INDICATORS.length})`, icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'trend', label: 'Trend & MAs', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'oscillators', label: 'Oscillators (RSI/MACD)', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'volatility', label: 'Volatility & Bands', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'structure', label: 'S/R & Patterns', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  const getIndicatorState = (item: typeof A_TO_Z_INDICATORS[0]): IndicatorConfig => {
    const existing = indicators.find(i => i.id === item.id);
    if (existing) return existing;
    return {
      id: item.id,
      type: item.type,
      name: item.name,
      enabled: false,
      color: item.defaultColor,
      color2: item.defaultColor2,
      color3: item.defaultColor3,
      period: item.defaultPeriod,
      period2: item.defaultPeriod2,
      period3: item.defaultPeriod3,
      multiplier: item.defaultMultiplier,
      stdDev: item.defaultStdDev,
      step: item.defaultStep,
      maximum: item.defaultMaximum,
      overbought: item.defaultOverbought,
      oversold: item.defaultOversold,
      lineWidth: 2,
      lineStyle: 'solid',
      showLabels: true,
      fillCloud: true
    };
  };

  const filteredList = A_TO_Z_INDICATORS.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = !searchQuery.trim() || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeCount = indicators.filter(i => i.enabled).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
        isDark 
          ? 'bg-slate-900 border-slate-700 text-slate-100' 
          : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-[#0088cc]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight flex items-center gap-2">
                <span>Technical Indicators</span>
                <span className="text-[11px] font-mono text-gray-500 dark:text-slate-400 bg-transparent">
                  ({A_TO_Z_INDICATORS.length} Available)
                </span>
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                {activeCount} active indicator{activeCount === 1 ? '' : 's'} on chart
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Quick Presets */}
        <div className="p-3 bg-gray-50 dark:bg-slate-800/40 border-b border-gray-200 dark:border-slate-800 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search indicators: e.g. RSI, EMA, Bollinger, Supertrend, MACD..."
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-[#0088cc]' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0088cc]'
              } focus:outline-none`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Presets Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 shrink-0">
              Presets:
            </span>
            <button
              onClick={() => onApplyPreset('scalping')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-500/15 hover:bg-blue-500/25 text-[#0088cc] dark:text-blue-400 border border-blue-500/30 shrink-0 cursor-pointer transition active:scale-95"
            >
              Scalping (SMA 7 + RSI)
            </button>
            <button
              onClick={() => onApplyPreset('trend')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 cursor-pointer transition active:scale-95"
            >
              📈 Trend Following (EMA + BB)
            </button>
            <button
              onClick={() => onApplyPreset('snr')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 cursor-pointer transition active:scale-95"
            >
              🎯 S/R & Fractals
            </button>
            <button
              onClick={() => onApplyPreset('clean')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors shrink-0 cursor-pointer active:scale-95"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 px-3 overflow-x-auto no-scrollbar shrink-0 bg-white dark:bg-slate-900">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedIndicatorId(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-black border-b-2 transition-all shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? 'border-[#0088cc] text-[#0088cc] dark:text-[#38bdf8]'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Indicator List & Settings Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-slate-500 text-xs">
              No indicator found matching "{searchQuery}"
            </div>
          ) : (
            filteredList.map(item => {
              const state = getIndicatorState(item);
              const isConfiguring = selectedIndicatorId === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all ${
                    state.enabled 
                      ? 'border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs' 
                      : isDark 
                        ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700' 
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                  } p-3.5`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div 
                        className="w-4 h-4 rounded-full border shadow-xs shrink-0"
                        style={{ backgroundColor: state.color, borderColor: state.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-gray-900 dark:text-white truncate">
                            {item.name}
                          </span>
                          {state.enabled && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Settings Cog */}
                      <button
                        onClick={() => setSelectedIndicatorId(isConfiguring ? null : item.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isConfiguring 
                            ? 'bg-[#0088cc] text-white border-[#0088cc] shadow-xs' 
                            : isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Adjust Parameters & Colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>

                      {/* Enable / Disable Toggle Switch */}
                      <button
                        onClick={() => onUpdateIndicator({ ...state, enabled: !state.enabled })}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          state.enabled ? 'bg-[#0088cc]' : isDark ? 'bg-slate-700' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs flex items-center justify-center ${
                            state.enabled ? 'translate-x-5 text-[#0088cc]' : 'text-gray-400'
                          }`}
                        >
                          {state.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Parameters Customizer */}
                  {isConfiguring && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                      {/* Period Setting */}
                      {state.period !== undefined && (
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                            Period: <span className="text-[#0088cc] font-mono">{state.period}</span>
                          </label>
                          <input
                            type="range"
                            min="2"
                            max={state.type === 'ema' ? 200 : 100}
                            value={state.period}
                            onChange={(e) => onUpdateIndicator({ ...state, period: Number(e.target.value) })}
                            className="w-full accent-[#0088cc] cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Secondary Period (MACD Slow, Ichimoku Kijun, Stoch %D) */}
                      {state.period2 !== undefined && (
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                            Slow Period: <span className="text-[#0088cc] font-mono">{state.period2}</span>
                          </label>
                          <input
                            type="range"
                            min="3"
                            max="60"
                            value={state.period2}
                            onChange={(e) => onUpdateIndicator({ ...state, period2: Number(e.target.value) })}
                            className="w-full accent-[#0088cc] cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Third Period (Signal Period, Ichimoku Span B) */}
                      {state.period3 !== undefined && (
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                            Signal / Span Period: <span className="text-[#0088cc] font-mono">{state.period3}</span>
                          </label>
                          <input
                            type="range"
                            min="2"
                            max="60"
                            value={state.period3}
                            onChange={(e) => onUpdateIndicator({ ...state, period3: Number(e.target.value) })}
                            className="w-full accent-[#0088cc] cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Multiplier / Std Dev */}
                      {(state.stdDev !== undefined || state.multiplier !== undefined) && (
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                            {state.stdDev !== undefined ? 'Std Deviation' : 'Multiplier'}: <span className="text-[#0088cc] font-mono">{state.stdDev ?? state.multiplier}</span>
                          </label>
                          <div className="flex gap-1">
                            {[1.5, 2.0, 2.5, 3.0].map(val => (
                              <button
                                key={val}
                                onClick={() => {
                                  if (state.stdDev !== undefined) onUpdateIndicator({ ...state, stdDev: val });
                                  else onUpdateIndicator({ ...state, multiplier: val });
                                }}
                                className={`flex-1 py-1 text-[10px] font-black rounded border cursor-pointer ${
                                  (state.stdDev === val || state.multiplier === val)
                                    ? 'bg-[#0088cc] text-white border-[#0088cc]' 
                                    : 'border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Line Thickness */}
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                          Line Thickness: <span className="text-[#0088cc] font-mono">{state.lineWidth || 2}px</span>
                        </label>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map(w => (
                            <button
                              key={w}
                              onClick={() => onUpdateIndicator({ ...state, lineWidth: w })}
                              className={`flex-1 py-1 text-[10px] font-black rounded border cursor-pointer ${
                                (state.lineWidth || 2) === w
                                  ? 'bg-[#0088cc] text-white border-[#0088cc]'
                                  : 'border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {w}px
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Primary Line Color Picker */}
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                          Primary Color
                        </label>
                        <div className="flex gap-1.5 items-center flex-wrap">
                          {['#0088cc', '#00b067', '#ff3b30', '#fbbf24', '#a855f7', '#06b6d4', '#ec4899', '#ffffff'].map(c => (
                            <button
                              key={c}
                              onClick={() => onUpdateIndicator({ ...state, color: c })}
                              className={`w-5 h-5 rounded-full transition-transform cursor-pointer border border-gray-300 dark:border-slate-600 ${
                                state.color === c ? 'scale-125 ring-2 ring-blue-400 shadow-sm' : 'hover:scale-110'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-gray-500 dark:text-slate-400 font-mono">
            {activeCount} active on chart
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-black transition-colors shadow-md cursor-pointer active:scale-95"
          >
            Apply & View Chart
          </button>
        </div>
      </div>
    </div>
  );
};
