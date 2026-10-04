import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export interface TradeResultData {
  won: boolean;
  isTie?: boolean;
  amount: number;
  profit: number;
  entryPrice?: number;
  closePrice?: number;
  assetName?: string;
  assetSymbol?: string;
  type?: 'CALL' | 'PUT';
  profitMargin?: number;
  timestamp?: number;
}

interface TradeResultNotificationProps {
  result: TradeResultData | null;
  onDismiss: () => void;
}

export const TradeResultNotification: React.FC<TradeResultNotificationProps> = ({
  result,
  onDismiss
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!result) return;
    
    // Auto-dismiss immediately if result is stale (> 3.5 seconds old) e.g. after tab switch
    if (result.timestamp && Date.now() - result.timestamp > 3500) {
      onDismiss();
      return;
    }

    // Auto-dismiss countdown over 3.5 seconds
    setProgress(100);
    const duration = 3500;
    const intervalTime = 40;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [result, onDismiss]);

  if (!result) return null;
  if (result.timestamp && Date.now() - result.timestamp > 3500) return null;

  const isWon = Boolean(result.won);
  const isTie = Boolean(result.isTie);
  const tradeAmount = Number(result.amount || 0);
  const tradeProfit = Number(result.profit || 0);
  const totalPayout = isWon ? (tradeAmount + tradeProfit) : (isTie ? tradeAmount : 0);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('light');
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.96 }}
        transition={{ type: 'spring', damping: 26, stiffness: 400 }}
        onClick={handleClose}
        className="fixed top-14 sm:top-16 left-3 right-3 sm:left-auto sm:right-4 sm:w-[380px] z-[999] pointer-events-auto select-none cursor-pointer"
      >
        <div 
          className={`relative overflow-hidden rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center justify-between p-3 sm:p-3.5 gap-3 transition-all ${
            isWon 
              ? 'bg-slate-950/80 border-emerald-500/50 text-white shadow-[0_12px_30px_rgba(0,176,103,0.3)]' 
              : isTie
                ? 'bg-slate-950/80 border-cyan-500/50 text-white shadow-[0_12px_30px_rgba(6,182,212,0.3)]'
                : 'bg-slate-950/80 border-rose-500/50 text-white shadow-[0_12px_30px_rgba(244,63,94,0.3)]'
          }`}
        >
          {/* Subtle Ambient Radial Highlight */}
          <div 
            className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 ${
              isWon ? 'bg-emerald-500' : isTie ? 'bg-cyan-500' : 'bg-rose-500'
            }`}
          />

          {/* Left Circular Badge */}
          <div className="flex items-center gap-3 min-w-0 z-10">
            <div 
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center shrink-0 shadow-lg ${
                isWon 
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                  : isTie
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-rose-500/20 border-rose-400 text-rose-300'
              }`}
            >
              {isWon ? (
                <Check className="w-5 h-5 text-emerald-400 stroke-[3.2]" />
              ) : isTie ? (
                <span className="text-base font-black text-cyan-300 leading-none">＝</span>
              ) : (
                <X className="w-5 h-5 text-rose-400 stroke-[3.2]" />
              )}
            </div>

            {/* Middle Text Column */}
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs sm:text-sm font-black tracking-wide uppercase truncate">
                {isWon 
                  ? `TRADE WON (+₹${tradeProfit.toFixed(2)})` 
                  : isTie
                    ? `TRADE TIED (₹${tradeAmount.toFixed(2)})`
                    : `TRADE CLOSED (-₹${tradeAmount.toFixed(2)})`
                }
              </span>
              <span className="text-[11px] sm:text-xs text-slate-300/90 font-medium mt-0.5 truncate">
                {isWon 
                  ? `₹${totalPayout.toFixed(2)} Total Payout Credited` 
                  : isTie
                    ? `₹${tradeAmount.toFixed(2)} Stake 100% Refunded`
                    : 'Trade Expired Out of the Money'
                }
              </span>
            </div>
          </div>

          {/* Right Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 text-white/90 hover:text-white flex items-center justify-center border border-white/15 transition shrink-0 cursor-pointer shadow-xs z-10"
            title="Dismiss notification"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Auto-Dismiss Bottom Progress Bar */}
          <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-black/40 overflow-hidden">
            <div 
              className={`h-full transition-all duration-75 ${
                isWon ? 'bg-emerald-400' : isTie ? 'bg-cyan-400' : 'bg-rose-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
