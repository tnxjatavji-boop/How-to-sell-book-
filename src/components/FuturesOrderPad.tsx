import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FuturesAsset } from '../types/futures';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface FuturesOrderPadProps {
  isOpen: boolean;
  onClose: () => void;
  orderType: 'LONG' | 'SHORT';
  asset: FuturesAsset;
  balance: number;
  accountType: 'real' | 'demo';
  onPlaceOrder: (params: {
    margin: number;
    type: 'LONG' | 'SHORT';
    tpPrice?: number;
    slPrice?: number;
  }) => boolean;
}

const PRESET_AMOUNTS = [100, 500, 1000, 2500, 5000];

export const FuturesOrderPad: React.FC<FuturesOrderPadProps> = ({
  isOpen,
  onClose,
  orderType,
  asset,
  balance,
  accountType,
  onPlaceOrder,
}) => {
  const [margin, setMargin] = useState<number>(500);
  const [marginInput, setMarginInput] = useState<string>('500');
  const [showTpSl, setShowTpSl] = useState(false);
  const [tpPrice, setTpPrice] = useState<string>('');
  const [slPrice, setSlPrice] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Leverage is strictly 20X as requested
  const leverage = 20;
  const positionSize = margin * leverage;
  const tradingFee = Math.round((positionSize * (asset.takerFeePercent / 100)) * 100) / 100;

  // Calculate estimated liquidation price (~95% loss of margin with 20X leverage)
  const liqDistance = asset.price * (0.95 / leverage);
  const estLiqPrice = orderType === 'LONG' 
    ? Math.max(0, asset.price - liqDistance)
    : asset.price + liqDistance;

  // Reset inputs when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (margin > balance && balance >= 100) {
        setMargin(balance);
        setMarginInput(String(balance));
      }
    }
  }, [isOpen, balance]);

  const handleMarginChange = (val: number) => {
    const maxAllowed = Math.min(asset.maxMargin, 5000);
    const valid = Math.max(asset.minMargin, Math.min(maxAllowed, val));
    setMargin(valid);
    setMarginInput(String(valid));
    setErrorMsg(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMarginInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setMargin(Math.min(5000, parsed));
      setErrorMsg(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');

    if (margin > 5000) {
      setErrorMsg("Maximum investment limit is ₹5,000");
      return;
    }

    const totalRequired = margin + tradingFee;
    if (totalRequired > balance) {
      setErrorMsg(`Insufficient ${accountType === 'real' ? 'Real' : 'Demo'} balance (Needs ₹${Number(totalRequired || 0).toFixed(2)})`);
      return;
    }

    if (margin < asset.minMargin) {
      setErrorMsg(`Minimum margin for 20X Futures is ₹${asset.minMargin}`);
      return;
    }

    const parsedTp = tpPrice ? parseFloat(tpPrice) : undefined;
    const parsedSl = slPrice ? parseFloat(slPrice) : undefined;

    const success = onPlaceOrder({
      margin,
      type: orderType,
      tpPrice: parsedTp && !isNaN(parsedTp) ? parsedTp : undefined,
      slPrice: parsedSl && !isNaN(parsedSl) ? parsedSl : undefined,
    });

    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isLong = orderType === 'LONG';

  const modalContent = (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs"
        style={{ zIndex: 9999 }}
      >
        {/* Backdrop dismiss */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 flex flex-col max-h-[88vh] sm:max-h-[90vh] font-sans select-none overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header Bar (Fixed at top of modal) */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${
                  isLong ? 'bg-[#00b067]' : 'bg-[#ff3b30]'
                }`}
              >
                {isLong ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-gray-900">
                    {isLong ? 'Buy / Long' : 'Sell / Short'}
                  </h3>
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
                    20X LEVERAGE
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  {asset.name} ({asset.symbol})
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar">
            {/* Live Price & Leverage Strip */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Market Entry Price
                </span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {asset.currencySymbol}
                  {asset.price.toLocaleString('en-US', { minimumFractionDigits: asset.precision, maximumFractionDigits: asset.precision })}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Cross Margin
                </span>
                <span className="text-xs font-black text-[#0088cc] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  20X Isolated
                </span>
              </div>
            </div>

            {/* Margin Input Field */}
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <label className="font-bold text-gray-700">Margin (Your Stake)</label>
                <span className="text-gray-500 font-mono text-[10px]">
                  Available:{' '}
                  <span className="font-bold text-emerald-600">
                    ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </span>
              </div>

              <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-[#0088cc] focus-within:ring-2 focus-within:ring-[#0088cc]/20 rounded-xl px-3 py-2 transition-all">
                <span className="text-gray-400 font-mono font-bold text-sm mr-1">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={marginInput}
                  onChange={handleInputChange}
                  min={asset.minMargin}
                  max={asset.maxMargin}
                  placeholder="Enter margin"
                  className="w-full bg-transparent text-sm font-black text-gray-900 outline-none font-mono"
                />
                <span className="text-[10px] font-bold text-gray-400 uppercase ml-2 shrink-0">INR</span>
              </div>
            </div>

            {/* Quick Preset Amount Chips */}
            <div className="grid grid-cols-6 gap-1">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => handleMarginChange(amt)}
                  className={`py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    margin === amt
                      ? 'border-[#0088cc] bg-blue-50 text-[#0088cc] shadow-xs'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>

            {/* Financial Overview & Liquidation Estimation */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/90 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between items-center text-gray-600">
                <span className="flex items-center gap-1">
                  <span>Position Size (Exposure):</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-black">20X</span>
                </span>
                <span className="font-mono font-black text-gray-900">
                  ₹{positionSize.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>Estimated Liquidation:</span>
                <span className="font-mono font-bold text-rose-600">
                  {asset.currencySymbol}
                  {estLiqPrice.toLocaleString('en-US', { minimumFractionDigits: asset.precision, maximumFractionDigits: asset.precision })}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span className="flex items-center gap-1">
                  <span>Trading Fee ({asset.takerFeePercent}%):</span>
                </span>
                <span className="font-mono text-gray-700">
                  ₹{Number(tradingFee || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-gray-200 text-gray-800 text-[11px]">
                <span>1% Price Move PnL:</span>
                <span className="font-mono font-black text-emerald-600">
                  ±₹{(Number(positionSize || 0) * 0.01).toFixed(2)} (±20%)
                </span>
              </div>
            </div>

            {/* Optional Take Profit / Stop Loss Drawer Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowTpSl(!showTpSl)}
                className="text-[11px] font-bold text-[#0088cc] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showTpSl ? '− Hide TP / SL (Optional)' : '+ Add Take Profit / Stop Loss'}</span>
              </button>

              {showTpSl && (
                <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Take Profit ({asset.currencySymbol})</label>
                    <input
                      type="number"
                      step="any"
                      value={tpPrice}
                      onChange={(e) => setTpPrice(e.target.value)}
                      placeholder={isLong ? `>${asset.price}` : `<${asset.price}`}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Stop Loss ({asset.currencySymbol})</label>
                    <input
                      type="number"
                      step="any"
                      value={slPrice}
                      onChange={(e) => setSlPrice(e.target.value)}
                      placeholder={isLong ? `<${asset.price}` : `>${asset.price}`}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-xs text-red-600 flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* 3. Sticky Bottom Footer Bar: Confirm Button Is ALWAYS Visibly Positioned & Accessible */}
          <div className="p-4 pt-3 border-t border-gray-100 bg-white shrink-0 pb-[max(env(safe-area-inset-bottom,0px),16px)]">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleSubmit}
              className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isLong
                  ? 'bg-gradient-to-r from-[#00b067] to-emerald-600 hover:from-emerald-600 hover:to-[#00b067] shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-[#ff3b30] to-rose-600 hover:from-rose-600 hover:to-[#ff3b30] shadow-rose-500/20'
              }`}
            >
              {isLong ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                Confirm {isLong ? 'Buy / Long' : 'Sell / Short'} 20X • ₹{margin}
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
