import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  ChevronRight, X, ShieldAlert, DollarSign, Activity, 
  Clock, AlertTriangle, Layers, ExternalLink, ChevronLeft
} from 'lucide-react';
import { FuturesPosition } from '../types/futures';
import { Trade } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

interface ActivePositionBarProps {
  tradingMode: 'binary' | 'futures';
  futuresPositions: FuturesPosition[];
  activeBinaryTrades: Trade[];
  currentAssetPrice?: number;
  onCloseFuturesPosition: (positionId: string) => void;
}

export const ActivePositionBar: React.FC<ActivePositionBarProps> = ({
  tradingMode,
  futuresPositions,
  activeBinaryTrades,
  currentAssetPrice,
  onCloseFuturesPosition
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Smooth, high-frequency 50ms tick interval for real-time second-by-second countdown
  useEffect(() => {
    if (activeBinaryTrades.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 50);
    return () => clearInterval(interval);
  }, [activeBinaryTrades.length]);

  // Helper for safe, clean PnL currency formatting: +₹X.XX or -₹X.XX (never ₹-X.XX)
  const formatPnL = (amount: number) => {
    const num = Number(amount || 0);
    const isPositive = num >= 0;
    const sign = isPositive ? '+' : '-';
    const val = Math.abs(num).toFixed(2);
    return `${sign}₹${val}`;
  };

  const formatPercent = (percent: number) => {
    const num = Number(percent || 0);
    const isPositive = num >= 0;
    const sign = isPositive ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  // --- FUTURES ACTIVE POSITION BAR ---
  if (tradingMode === 'futures' && futuresPositions.length > 0) {
    // Ensure index is within range
    const activeIndex = Math.min(selectedIndex, futuresPositions.length - 1);
    const position = futuresPositions[activeIndex] || futuresPositions[0];
    const isLong = position.type === 'LONG';
    const isProfit = position.pnl >= 0;

    // Total floating PnL across all current open positions
    const totalFloatingPnL = futuresPositions.reduce((acc, p) => acc + (p.pnl || 0), 0);

    const handleQuickClose = (e: React.MouseEvent) => {
      e.stopPropagation();
      triggerHaptic('medium');
      setIsClosing(true);
      onCloseFuturesPosition(position.id);
      setTimeout(() => setIsClosing(false), 500);
    };

    return (
      <>
        {/* Sleek Floating Position Bar (Zero Collision 2-Row Design) */}
        <div 
          onClick={() => { triggerHaptic('light'); setShowDetailsModal(true); }}
          className={`border-t border-b px-3 py-1.5 flex flex-col justify-center text-xs z-20 shrink-0 transition-colors cursor-pointer select-none gap-1 ${
            isProfit 
              ? 'bg-gradient-to-r from-[#0d1c24] via-[#0f2324] to-[#0c1a20] border-emerald-900/60 shadow-[0_0_15px_rgba(0,176,103,0.08)]' 
              : 'bg-gradient-to-r from-[#1c1218] via-[#24141c] to-[#1a1016] border-rose-900/60 shadow-[0_0_15px_rgba(255,59,48,0.08)]'
          }`}
        >
          {/* Row 1: Direction & Leverage, Real-Time PnL, Quick Close */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Position Direction Pill */}
              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider shadow-xs shrink-0 ${
                isLong 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}>
                {isLong ? <ArrowUpRight className="w-3 h-3 stroke-[2.5]" /> : <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />}
                <span>{position.type} {position.leverage || 20}X</span>
              </div>

              {/* Entry Price */}
              <div className="text-[11px] font-mono text-slate-300 truncate">
                <span className="text-slate-400 font-sans text-[10px] mr-1">Entry:</span>
                <span className="font-bold text-slate-100">{position.entryPrice.toLocaleString()}</span>
              </div>

              {futuresPositions.length > 1 && (
                <span className="text-blue-400 font-bold bg-blue-500/10 px-1 py-0.2 rounded text-[9px] shrink-0">
                  {activeIndex + 1}/{futuresPositions.length}
                </span>
              )}
            </div>

            {/* PnL Value and Quick Close */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`font-mono font-black text-xs whitespace-nowrap ${
                isProfit ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {formatPnL(position.pnl)}
              </span>

              <button
                onClick={handleQuickClose}
                disabled={isClosing}
                className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-[10px] font-bold border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer shrink-0"
                title="Close position"
              >
                Close
              </button>
            </div>
          </div>

          {/* Row 2: Margin Deposited, ROE Badge & Details Link */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span>Margin: ₹{position.margin.toLocaleString()}</span>
              <span className="text-slate-600">•</span>
              <span>Mark: {(position.currentPrice || position.entryPrice).toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                ROE: {formatPercent(position.pnlPercent)}
              </span>
              <span className="text-[#0088cc] font-sans font-bold flex items-center gap-0.5 hover:underline">
                Details &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Position Bottom Sheet Modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            {/* Backdrop click to close */}
            <div 
              className="absolute inset-0" 
              onClick={() => setShowDetailsModal(false)} 
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-lg bg-slate-900 text-white rounded-t-3xl border-t border-slate-800 shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200">
              
              {/* Grab Handle */}
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className={`px-2 py-0.5 rounded-md text-xs font-black flex items-center gap-1 ${
                    isLong 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}>
                    {isLong ? <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" /> : <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>{position.type} {position.leverage || 20}X</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{position.assetName || position.assetSymbol}</h3>
                    <div className="text-[10px] text-slate-400 font-mono">{position.assetSymbol} • Isolated Margin</div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Multiple Positions Switcher */}
              {futuresPositions.length > 1 && (
                <div className="flex items-center justify-between mt-3 px-3 py-1.5 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Position {activeIndex + 1} of {futuresPositions.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                      disabled={activeIndex === 0}
                      className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedIndex(prev => Math.min(futuresPositions.length - 1, prev + 1))}
                      disabled={activeIndex === futuresPositions.length - 1}
                      className="p-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Big Profit / Loss Display Box */}
              <div className={`mt-3.5 p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${
                isProfit 
                  ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_20px_rgba(0,176,103,0.1)]' 
                  : 'bg-rose-950/20 border-rose-500/30 shadow-[0_0_20px_rgba(255,59,48,0.1)]'
              }`}>
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">
                  Unrealized Profit / Loss (PnL)
                </div>
                <div className={`text-2xl font-black font-mono tracking-tight ${
                  isProfit ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatPnL(position.pnl)}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                    isProfit 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    ROE: {formatPercent(position.pnlPercent)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Est. Payout: ₹{Math.max(0, Number(position.margin || 0) + Number(position.pnl || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Matrix of Position Key Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-3.5">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Entry Price</div>
                  <div className="text-sm font-black font-mono text-slate-100 mt-0.5">
                    {Number(position.entryPrice || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Current Mark Price</div>
                  <div className="text-sm font-black font-mono text-slate-100 mt-0.5">
                    {(Number(position.currentPrice || position.entryPrice || 0)).toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Margin Deposited</div>
                  <div className="text-sm font-black font-mono text-slate-100 mt-0.5">
                    ₹{Number(position.margin || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Position Size</div>
                  <div className="text-sm font-black font-mono text-slate-100 mt-0.5">
                    ₹{Number(position.positionSize || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
                  <div className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Liquidation Price</span>
                  </div>
                  <div className="text-sm font-black font-mono text-rose-400 mt-0.5">
                    {Number(position.liquidationPrice || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Trading Fee</div>
                  <div className="text-sm font-black font-mono text-slate-300 mt-0.5">
                    ₹{position.tradingFee != null ? Number(position.tradingFee).toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    handleQuickClose(e);
                    setShowDetailsModal(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] font-bold text-sm text-white shadow-lg shadow-rose-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Close Position (Market)</span>
                </button>

                <Link
                  to="/deals?mode=futures"
                  onClick={() => setShowDetailsModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] font-bold text-sm text-slate-200 hover:text-white border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Deals</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>
        )}
      </>
    );
  }

  // --- BINARY ACTIVE TRADES BAR ---
  if (tradingMode === 'binary' && activeBinaryTrades.length > 0) {
    const activeIndex = Math.min(selectedIndex, activeBinaryTrades.length - 1);
    const trade = activeBinaryTrades[activeIndex] || activeBinaryTrades[0];
    const isCall = trade.type === 'CALL';
    const currentPrice = currentAssetPrice || trade.entryPrice;
    const isWinning = isCall ? (currentPrice > trade.entryPrice) : (currentPrice < trade.entryPrice);
    const profitAmount = Number((trade.amount * (trade.profitMargin || 0.85)).toFixed(2));
    
    // Time remaining calculation (using synchronized 50ms reactive timer)
    const now = currentTime;
    const remainingMs = Math.max(0, (trade.strikeTime || (trade.createdAt + (trade.duration || 60) * 1000)) - now);
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return (
      <div 
        className={`border-t border-b px-3 py-1.5 flex items-center justify-between text-xs z-20 shrink-0 select-none transition-colors ${
          isWinning 
            ? 'bg-gradient-to-r from-[#0a1b14] via-[#0d221a] to-[#0a1b14] border-emerald-800/60 shadow-[0_0_15px_rgba(0,192,118,0.12)]' 
            : 'bg-gradient-to-r from-[#1c0f13] via-[#241318] to-[#1c0f13] border-rose-800/60 shadow-[0_0_15px_rgba(255,77,77,0.12)]'
        }`}
      >
        {/* Left Info: Asset, Amount, Direction */}
        <div className="flex items-center gap-2 min-w-0">
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider shadow-xs shrink-0 ${
            isCall 
              ? 'bg-[#00c076]/20 text-[#00c076] border border-[#00c076]/40' 
              : 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
          }`}>
            {isCall ? <TrendingUp className="w-3 h-3 stroke-[2.5]" /> : <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
            <span>₹{trade.amount.toFixed(0)} {isCall ? 'CALL ↑' : 'PUT ↓'}</span>
          </div>

          <div className="text-[11px] font-medium text-slate-300 truncate">
            <span className="font-bold text-white">{trade.assetName || trade.assetId}</span>
            <span className="text-slate-400 text-[10px] ml-1">({Math.round((trade.profitMargin || 0.85) * 100)}%)</span>
          </div>

          {activeBinaryTrades.length > 1 && (
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <button 
                type="button"
                onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
                className="w-4 h-4 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center disabled:opacity-30"
              >
                ‹
              </button>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">
                {activeIndex + 1}/{activeBinaryTrades.length}
              </span>
              <button 
                type="button"
                onClick={() => setSelectedIndex(prev => Math.min(activeBinaryTrades.length - 1, prev + 1))}
                disabled={activeIndex === activeBinaryTrades.length - 1}
                className="w-4 h-4 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center disabled:opacity-30"
              >
                ›
              </button>
            </div>
          )}
        </div>

        {/* Right Info: Countdown & Live Floating Result */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            <Clock className="w-3 h-3 animate-spin text-amber-400" style={{ animationDuration: '3s' }} />
            <span>{timeFormatted}</span>
          </div>

          <div className={`font-mono font-black text-xs px-2 py-0.5 rounded-md flex items-center gap-1 ${
            isWinning 
              ? 'bg-emerald-500/20 text-[#00c076] border border-emerald-500/30' 
              : 'bg-rose-500/20 text-[#ff4d4d] border border-rose-500/30'
          }`}>
            <span>{isWinning ? `+₹${profitAmount}` : `-₹${trade.amount}`}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

