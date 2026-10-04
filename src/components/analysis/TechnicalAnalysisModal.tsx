import React from 'react';
import { 
  X, Sparkles, TrendingUp, TrendingDown, 
  Activity, ShieldCheck, ArrowRight, Gauge, CheckCircle2
} from 'lucide-react';
import { AutoAnalysisSummary } from '../../types/analysis';

interface TechnicalAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AutoAnalysisSummary | null;
  assetSymbol: string;
  assetName: string;
  currentPrice: number;
  timeFrame: string;
  onTradeSignal?: (direction: 'CALL' | 'PUT') => void;
  theme?: 'light' | 'dark';
}

export const TechnicalAnalysisModal: React.FC<TechnicalAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  assetSymbol,
  assetName,
  currentPrice,
  timeFrame,
  onTradeSignal,
  theme = 'light'
}) => {
  if (!isOpen || !analysis) return null;

  const isDark = theme === 'dark';

  const getSignalBadge = (sig: string) => {
    switch (sig) {
      case 'STRONG_BUY':
        return { text: 'STRONG BUY ▲▲', bg: 'bg-emerald-500 text-white', color: 'text-emerald-500' };
      case 'BUY':
        return { text: 'BUY ▲', bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-400/40', color: 'text-emerald-500' };
      case 'STRONG_SELL':
        return { text: 'STRONG SELL ▼▼', bg: 'bg-rose-500 text-white', color: 'text-rose-500' };
      case 'SELL':
        return { text: 'SELL ▼', bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-400/40', color: 'text-rose-500' };
      default:
        return { text: 'NEUTRAL ━', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-400/40', color: 'text-amber-500' };
    }
  };

  const badge = getSignalBadge(analysis.overallSignal);
  const isBullish = analysis.overallSignal.includes('BUY');
  const isBearish = analysis.overallSignal.includes('SELL');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col max-h-[88vh] overflow-hidden ${
        isDark 
          ? 'bg-slate-900 border-slate-700 text-slate-100' 
          : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black tracking-tight">{assetName} AI Analysis</h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                  {timeFrame}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-400">
                Live algorithm calculated from MA, RSI, MACD & Pivots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Signal Score Card */}
          <div className={`p-4 rounded-2xl border text-center relative overflow-hidden ${
            isBullish 
              ? 'bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 border-emerald-500/30'
              : isBearish 
                ? 'bg-gradient-to-b from-rose-500/10 to-rose-500/5 border-rose-500/30'
                : 'bg-gradient-to-b from-amber-500/10 to-amber-500/5 border-amber-500/30'
          }`}>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-400 mb-1">
              Overall Market Consensus
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wide uppercase shadow-sm ${badge.bg}`}>
                {badge.text}
              </span>
            </div>

            <div className="text-xs font-medium text-gray-600 dark:text-slate-300 max-w-sm mx-auto">
              {analysis.summaryText}
            </div>

            {/* Score Bar Meter */}
            <div className="mt-3 flex items-center gap-2 max-w-xs mx-auto">
              <span className="text-[9px] font-black text-rose-500">STRONG SELL</span>
              <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden relative">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isBullish ? 'bg-emerald-500' : isBearish ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, (analysis.score + 100) / 2))}%` }}
                />
              </div>
              <span className="text-[9px] font-black text-emerald-500">STRONG BUY</span>
            </div>
          </div>

          {/* Core Technical Matrix */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Moving Averages Consensus */}
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Moving Averages</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  analysis.movingAveragesSignal === 'BUY' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                  analysis.movingAveragesSignal === 'SELL' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {analysis.movingAveragesSignal}
                </span>
              </div>
              <div className="text-[11px] text-gray-600 dark:text-slate-300 font-medium">
                SMA 20, SMA 50 & EMA 12/26 alignment
              </div>
            </div>

            {/* Oscillators Consensus */}
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">RSI & MACD</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  analysis.oscillatorsSignal === 'BUY' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                  analysis.oscillatorsSignal === 'SELL' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  RSI: {analysis.rsiValue}
                </span>
              </div>
              <div className="text-[11px] text-gray-600 dark:text-slate-300 font-medium">
                {analysis.rsiValue > 70 ? 'Overbought zone (Sell signal)' : analysis.rsiValue < 30 ? 'Oversold zone (Buy signal)' : 'Normal trading momentum'}
              </div>
            </div>
          </div>

          {/* Pivot Points Floor Support & Resistance */}
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">
              Support & Resistance Levels
            </div>
            <div className="grid grid-cols-5 gap-1 text-center font-mono">
              <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="text-[9px] font-bold text-rose-500">R2</div>
                <div className="text-[10px] font-black text-rose-600 dark:text-rose-400 truncate">
                  {analysis.pivotLevels?.r2 != null ? Number(analysis.pivotLevels.r2).toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="p-1.5 rounded-xl bg-rose-500/5 border border-rose-500/15">
                <div className="text-[9px] font-bold text-rose-400">R1</div>
                <div className="text-[10px] font-black text-rose-500 truncate">
                  {analysis.pivotLevels?.r1 != null ? Number(analysis.pivotLevels.r1).toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-[9px] font-bold text-amber-500">PIVOT</div>
                <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 truncate">
                  {analysis.pivotLevels?.pivot != null ? Number(analysis.pivotLevels.pivot).toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="p-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <div className="text-[9px] font-bold text-emerald-400">S1</div>
                <div className="text-[10px] font-black text-emerald-500 truncate">
                  {analysis.pivotLevels?.s1 != null ? Number(analysis.pivotLevels.s1).toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[9px] font-bold text-emerald-500">S2</div>
                <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 truncate">
                  {analysis.pivotLevels?.s2 != null ? Number(analysis.pivotLevels.s2).toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          </div>

          {/* Detected Candlestick Patterns */}
          {analysis.activePatterns.length > 0 && (
            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">
                Recent Candlestick Formations
              </div>
              <div className="space-y-1.5">
                {analysis.activePatterns.map((pat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-slate-800 last:border-none">
                    <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        pat.type === 'bullish' ? 'bg-emerald-500' : pat.type === 'bearish' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      {pat.name}
                    </span>
                    <span className="font-mono text-[11px] text-gray-500">
                      ₹{Number(pat.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Quick Action Buttons */}
        <div className="p-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-800 flex gap-2 shrink-0">
          {onTradeSignal && (
            <>
              <button
                onClick={() => {
                  onTradeSignal('PUT');
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <TrendingDown className="w-4 h-4" />
                <span>Trade Put (Down)</span>
              </button>

              <button
                onClick={() => {
                  onTradeSignal('CALL');
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Trade Call (Up)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
