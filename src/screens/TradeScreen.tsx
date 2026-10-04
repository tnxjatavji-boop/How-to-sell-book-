import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CandlestickChart } from '../components/CandlestickChart';
import { TradingViewChart } from '../components/TradingViewChart';
import { FuturesOrderPad } from '../components/FuturesOrderPad';
import { ActivePositionBar } from '../components/ActivePositionBar';
import { TradeResultNotification } from '../components/TradeResultNotification';
import { AssetLogo } from '../components/AssetLogo';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../utils/haptics';
import { 
  Plus, Minus, TrendingUp, TrendingDown, BarChart2, 
  Volume2, VolumeX, Activity, CheckCircle2, XCircle, ChevronDown, 
  Clock, Sun, Moon, History, Check, Timer, ArrowUpRight, ArrowDownRight,
  Maximize2, Minimize2, Crown
} from 'lucide-react';

const DURATION_OPTIONS = [
  { seconds: 15, label: '15s', display: '00:00:15', title: '15 Seconds' },
  { seconds: 30, label: '30s', display: '00:00:30', title: '30 Seconds' },
  { seconds: 60, label: '1 min', display: '00:01:00', title: '1 Minute' },
  { seconds: 120, label: '2 min', display: '00:02:00', title: '2 Minutes' },
  { seconds: 180, label: '3 min', display: '00:03:00', title: '3 Minutes' },
  { seconds: 300, label: '5 min', display: '00:05:00', title: '5 Minutes' },
  { seconds: 600, label: '10 min', display: '00:10:00', title: '10 Minutes' },
  { seconds: 900, label: '15 min', display: '00:15:00', title: '15 Minutes' },
];

const TIMEFRAME_OPTIONS = [
  { id: '15s', label: '15s', title: '15 Seconds' },
  { id: '30s', label: '30s', title: '30 Seconds' },
  { id: '1m', label: '1m', title: '1 Minute (Default)' },
  { id: '3m', label: '3m', title: '3 Minutes' },
  { id: '5m', label: '5m', title: '5 Minutes' },
  { id: '15m', label: '15m', title: '15 Minutes' },
];

const FUTURES_TIMEFRAME_OPTIONS = [
  { id: '1', label: '1m', title: '1 Minute' },
  { id: '5', label: '5m', title: '5 Minutes' },
  { id: '15', label: '15m', title: '15 Minutes' },
  { id: '60', label: '1h', title: '1 Hour' },
  { id: '240', label: '4h', title: '4 Hours' },
  { id: 'D', label: '1D', title: '1 Day' },
];

export const TradeScreen = () => {
  const { 
    userId,
    accountType, setAccountType, 
    realBalance, demoBalance, 
    refillDemoBalance,
    currentAsset, placeTrade, trades,
    soundEnabled, toggleSound,
    lastTradeResult, dismissTradeResult,
    // 20X Futures Trading
    tradingMode, setTradingMode,
    currentFuturesAsset,
    futuresPositions, placeFuturesOrder, closeFuturesPosition,
    // Fullscreen and Layout Control
    isFullScreen, toggleFullScreen, isExpandedLayout
  } = useAppContext();

  const MIN_AMOUNT = 50;
  const MAX_AMOUNT = 5000;

  // Binary options state
  const [amount, setAmount] = useState(100);
  const [amountInput, setAmountInput] = useState('100');
  const [durationIndex, setDurationIndex] = useState(2); // Default 60s (1 min)
  const [chartType, setChartType] = useState<'candle' | 'area' | 'bars' | 'heikin'>('candle');
  const [chartTheme, setChartTheme] = useState<'light' | 'dark'>('light');
  const [showChartType, setShowChartType] = useState(false);
  const [showTimeFramePicker, setShowTimeFramePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [chartTimeFrame, setChartTimeFrame] = useState('1m'); // Default 1 min
  const [isPlacingTrade, setIsPlacingTrade] = useState(false);

  // Futures order pad state
  const [isFuturesPadOpen, setIsFuturesPadOpen] = useState(false);
  const [futuresOrderType, setFuturesOrderType] = useState<'LONG' | 'SHORT'>('LONG');
  const [futuresTimeFrame, setFuturesTimeFrame] = useState('15'); // Default 15m as requested
  const [showFuturesTimeFramePicker, setShowFuturesTimeFramePicker] = useState(false);

  const balance = accountType === 'real' ? realBalance : demoBalance;
  const currentDuration = DURATION_OPTIONS[durationIndex] || DURATION_OPTIONS[2];

  const handleAmountChange = (delta: number) => {
    setAmount(prev => {
      const next = Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, prev + delta));
      setAmountInput(String(next));
      return next;
    });
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmountInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(Math.min(MAX_AMOUNT, parsed));
    }
  };

  const handleAmountInputBlur = () => {
    const parsed = parseInt(amountInput, 10);
    if (isNaN(parsed) || parsed < MIN_AMOUNT) {
      setAmount(MIN_AMOUNT);
      setAmountInput(String(MIN_AMOUNT));
    } else if (parsed > MAX_AMOUNT) {
      setAmount(MAX_AMOUNT);
      setAmountInput(String(MAX_AMOUNT));
    } else {
      setAmount(parsed);
      setAmountInput(String(parsed));
    }
  };
  
  const handleDurationStep = (delta: number) => {
    setDurationIndex(prev => {
      const next = prev + delta;
      return Math.max(0, Math.min(DURATION_OPTIONS.length - 1, next));
    });
  };

  const setFixedAmount = (amt: number) => {
    const validAmt = Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, amt));
    setAmount(validAmt);
    setAmountInput(String(validAmt));
  };

  const handleTrade = (type: 'CALL' | 'PUT') => {
    triggerHaptic('heavy');
    if (amount > MAX_AMOUNT) {
      alert(`Maximum investment limit is ₹${MAX_AMOUNT.toLocaleString()} per trade.`);
      return;
    }
    if (amount > balance) {
      alert(`Insufficient ${accountType === 'real' ? 'Real' : 'Demo'} Account Balance.`);
      return;
    }
    placeTrade(amount, type, currentDuration.seconds);
  };

  const openFuturesOrder = (type: 'LONG' | 'SHORT') => {
    triggerHaptic('medium');
    setFuturesOrderType(type);
    setIsFuturesPadOpen(true);
  };

  const expectedProfit = amount * currentAsset.profitMargin;
  const activeTradesCount = trades.filter(t => t.status === 'active').length;
  const assetActiveTrades = trades.filter(t => t.status === 'active' && t.assetId === currentAsset.id);

  // Open futures positions for current asset or overall
  const openFuturesPositions = futuresPositions.filter(p => p.status === 'open');
  const currentAssetFuturesPositions = openFuturesPositions.filter(p => p.assetId === currentFuturesAsset.id);

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans overflow-hidden relative select-none">
      {/* Top Header: Account Type Switcher & Deposit Button + Fullscreen Button */}
      <div className="px-3 pt-[max(env(safe-area-inset-top,0px),8px)] pb-1 flex justify-between items-center bg-white z-10 shrink-0">
        <div className="flex bg-gray-100 p-0.5 rounded-full text-[11px] font-bold w-40">
          <button 
            className={`flex-1 py-0.5 text-center rounded-full transition-all cursor-pointer ${accountType === 'real' ? 'bg-[#0088cc] text-white shadow-xs' : 'text-gray-500'}`}
            onClick={() => setAccountType('real')}
          >
            Real
          </button>
          <button 
            className={`flex-1 py-0.5 text-center rounded-full transition-all cursor-pointer ${accountType === 'demo' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
            onClick={() => setAccountType('demo')}
          >
            Demo
          </button>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Direct Link to Deposit Screen */}
          <Link 
            to="/deposit"
            className="bg-emerald-50 hover:bg-[#00b067] border border-[#00b067] hover:text-white text-[#00b067] font-black px-3.5 py-0.5 rounded-full text-[11px] uppercase transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0 tracking-wide"
          >
            <span>Deposit</span>
          </Link>

          {/* Full Screen Toggle Button */}
          <button
            onClick={toggleFullScreen}
            className={`p-1 rounded-full border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isFullScreen || isExpandedLayout 
                ? 'bg-blue-50 text-[#0088cc] border-blue-200 shadow-xs' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
            }`}
            title={isFullScreen || isExpandedLayout ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label="Toggle Fullscreen"
          >
            {isFullScreen || isExpandedLayout ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Balance Bar & Active Deals Counter */}
      <div className="px-3 py-0.5 flex items-baseline justify-between shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Balance:</span>
          <span className="text-lg font-black text-[#00b067] tracking-tight">
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {accountType === 'demo' && balance <= 0 && (
            <button
              onClick={refillDemoBalance}
              className="text-[10px] font-bold text-[#0088cc] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-all cursor-pointer animate-pulse"
              title="Click to Refill Demo Balance"
            >
              Refill ₹10,000
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Active indicator */}
          {(tradingMode === 'binary' ? activeTradesCount : openFuturesPositions.length) > 0 && (
            <Link 
              to={tradingMode === 'futures' ? '/deals?mode=futures' : '/deals?mode=binary'} 
              className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-[#0088cc] px-2 py-0.2 rounded-full text-[10px] font-bold animate-pulse"
              title="View Active Deals / PnL"
            >
              <Activity className="w-2.5 h-2.5" />
              <span>{tradingMode === 'binary' ? activeTradesCount : openFuturesPositions.length} Active</span>
            </Link>
          )}

          <Link 
            to="/history" 
            className="text-gray-400 hover:text-[#0088cc] p-0.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            title="Transaction History"
          >
            <History className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Mode Specific Asset Header */}
      {tradingMode === 'binary' ? (
        /* BINARY ASSET BAR */
        <div className="px-3 py-1 flex gap-1.5 items-center relative z-20 shrink-0 border-b border-gray-100">
          {/* Expanded Asset Selector Button */}
          <Link 
            to="/assets" 
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg flex-1 font-bold text-gray-800 text-xs transition-colors truncate min-w-0"
          >
            <AssetLogo symbol={currentAsset?.symbol || 'EUR/USD'} name={currentAsset?.name || 'EUR/USD'} size={22} />
            <span className="truncate text-xs font-black text-gray-900">{currentAsset?.name || 'EUR/USD'}</span>
            <span className="text-[#00b067] font-black text-[9px] bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 ml-auto shrink-0">
              {((currentAsset?.profitMargin ?? 0.85) * 100).toFixed(0)}%
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
          </Link>

          {/* Compact Single Timeframe Dropdown Button */}
          <div className="relative shrink-0">
            <button 
              onClick={() => {
                setShowTimeFramePicker(!showTimeFramePicker);
                setShowChartType(false);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-extrabold transition-all cursor-pointer ${
                showTimeFramePicker 
                  ? 'bg-[#0088cc] text-white border-[#0088cc] shadow-xs' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
              title="Select Chart Candle Timeframe"
            >
              <Clock className="w-3 h-3 shrink-0" />
              <span>{chartTimeFrame}</span>
              <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showTimeFramePicker ? 'rotate-180 text-white' : 'text-gray-400'}`} />
            </button>

            {/* Timeframe Dropdown Selector Menu */}
            {showTimeFramePicker && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowTimeFramePicker(false)} 
                />
                <div className="absolute top-10 right-0 z-40 bg-white border border-gray-200 shadow-2xl rounded-2xl p-1.5 flex flex-col gap-1 w-44 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Candle Timeframe
                  </div>
                  {TIMEFRAME_OPTIONS.map(tf => (
                    <button
                      key={tf.id}
                      onClick={() => {
                        setChartTimeFrame(tf.id);
                        setShowTimeFramePicker(false);
                      }}
                      className={`px-2.5 py-2 text-left rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                        chartTimeFrame === tf.id 
                          ? 'bg-blue-50 text-[#0088cc] font-black' 
                          : 'text-gray-700 hover:bg-gray-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold w-7 text-center bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-[10px]">
                          {tf.label}
                        </span>
                        <span className="text-xs">{tf.title}</span>
                      </div>
                      {chartTimeFrame === tf.id && (
                        <Check className="w-3.5 h-3.5 text-[#0088cc]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Chart Style, Theme & Sound Toolbar */}
          <div className="flex gap-1 shrink-0">
            <button 
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${showIndicators ? 'bg-[#0088cc] text-white border-[#0088cc]' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
              onClick={() => {
                setShowIndicators(!showIndicators);
                setShowChartType(false);
                setShowTimeFramePicker(false);
              }}
              title="Technical Indicators (इंडिकेटर्स)"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button 
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${showChartType ? 'bg-[#0088cc] text-white border-[#0088cc]' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
              onClick={() => {
                setShowChartType(!showChartType);
                setShowTimeFramePicker(false);
                setShowIndicators(false);
              }}
              title="Chart Type"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button 
              className="p-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors cursor-pointer"
              onClick={() => setChartTheme(chartTheme === 'light' ? 'dark' : 'light')}
              title="Toggle Light/Dark Canvas"
            >
              {chartTheme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            <button 
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${soundEnabled ? 'bg-emerald-50 text-[#00b067] border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
              onClick={toggleSound}
              title="Audio FX"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ) : (
        /* FUTURES (20X) ASSET BAR */
        <div className="px-3 py-1 flex gap-1.5 items-center relative z-20 shrink-0 border-b border-gray-100 bg-white">
          {/* Expanded Futures Asset Selector */}
          <Link 
            to="/assets" 
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg flex-1 font-bold text-gray-800 text-xs transition-colors truncate min-w-0"
          >
            <AssetLogo symbol={(currentFuturesAsset?.symbol || 'BTC').split('/')[0]} name={currentFuturesAsset?.name || 'Bitcoin'} size={22} />
            <div className="truncate flex items-center gap-1.5 min-w-0">
              <span className="truncate text-xs font-black text-gray-900">{currentFuturesAsset?.name || 'Bitcoin'}</span>
              <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">{currentFuturesAsset?.symbol || 'BTC/USDT'}</span>
            </div>
            <span className="text-amber-900 font-black text-[9px] bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 ml-auto shrink-0">
              20X
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
          </Link>

          {/* Manual Timeframe Dropdown for Futures (No auto-favorites; user switches manually) */}
          <div className="relative shrink-0">
            <button 
              onClick={() => {
                setShowFuturesTimeFramePicker(!showFuturesTimeFramePicker);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-extrabold transition-all cursor-pointer ${
                showFuturesTimeFramePicker 
                  ? 'bg-[#0088cc] text-white border-[#0088cc] shadow-xs' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
              title="Select Chart Timeframe (Manual)"
            >
              <Clock className="w-3 h-3 shrink-0" />
              <span>{FUTURES_TIMEFRAME_OPTIONS.find(o => o.id === futuresTimeFrame)?.label || '1m'}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60 shrink-0" />
            </button>

            {showFuturesTimeFramePicker && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowFuturesTimeFramePicker(false)} 
                />
                <div className="absolute top-8 right-0 z-40 bg-white border border-gray-200 shadow-xl rounded-xl p-1.5 flex flex-col gap-1 w-36 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Select Timeframe
                  </div>
                  {FUTURES_TIMEFRAME_OPTIONS.map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setFuturesTimeFrame(tf.id);
                        setShowFuturesTimeFramePicker(false);
                      }}
                      className={`px-2.5 py-1.5 text-left rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                        futuresTimeFrame === tf.id
                          ? 'bg-blue-50 text-[#0088cc] font-black'
                          : 'text-gray-700 hover:bg-gray-100 font-medium'
                      }`}
                    >
                      <span>{tf.label}</span>
                      <span className="text-[10px] text-gray-400">{tf.title}</span>
                      {futuresTimeFrame === tf.id && (
                        <Check className="w-3 h-3 text-[#0088cc]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme & Sound Toggles */}
          <div className="flex gap-1 shrink-0">
            <button 
              className="p-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors cursor-pointer"
              onClick={() => setChartTheme(chartTheme === 'light' ? 'dark' : 'light')}
              title="Toggle Light/Dark Chart"
            >
              {chartTheme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            <button 
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${soundEnabled ? 'bg-emerald-50 text-[#00b067] border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
              onClick={toggleSound}
              title="Audio FX"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Chart Type Selector Dropdown Menu for Binary */}
      {tradingMode === 'binary' && showChartType && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setShowChartType(false)} 
          />
          <div className="absolute top-[108px] right-3 z-40 bg-white border border-gray-200 shadow-xl rounded-xl p-1.5 flex flex-col gap-1 w-36 text-xs animate-in fade-in slide-in-from-top-2">
            {[
              { id: 'candle', label: 'Candlesticks' },
              { id: 'area', label: 'Area Line' },
              { id: 'bars', label: 'Classic Bars' },
              { id: 'heikin', label: 'Heikin-Ashi' }
            ].map(ct => (
              <button
                key={ct.id}
                onClick={() => { setChartType(ct.id as any); setShowChartType(false); }}
                className={`px-3 py-1.5 text-left rounded-lg transition-colors cursor-pointer flex items-center justify-between ${chartType === ct.id ? 'bg-blue-50 text-[#0088cc] font-black' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <span>{ct.label}</span>
                {chartType === ct.id && <span className="w-1.5 h-1.5 rounded-full bg-[#0088cc]" />}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Main Chart Area */}
      <div className="flex-1 min-h-0 w-full relative bg-slate-950 overflow-hidden">
        {tradingMode === 'binary' ? (
          /* Custom Binary Candlestick Chart */
          <CandlestickChart
            assetId={currentAsset.id}
            assetSymbol={currentAsset.symbol}
            assetName={currentAsset.name}
            currentPrice={currentAsset.price}
            timeFrame={chartTimeFrame}
            chartType={chartType}
            activeTrades={assetActiveTrades}
            lastTradeResult={lastTradeResult}
            theme={chartTheme}
            onTradeSignal={handleTrade}
            isIndicatorsOpen={showIndicators}
            onToggleIndicators={() => setShowIndicators(false)}
          />
        ) : (
          /* OFFICIAL TRADINGVIEW REAL-TIME CHART EMBED ONLY */
          <TradingViewChart 
            tvSymbol={currentFuturesAsset.tvSymbol} 
            theme={chartTheme} 
            interval={futuresTimeFrame}
          />
        )}
      </div>

      {/* Upgraded Active Positions & Profit/Loss Strip (Futures Only) */}
      {tradingMode === 'futures' && currentAssetFuturesPositions.length > 0 && (
        <ActivePositionBar
          tradingMode="futures"
          futuresPositions={currentAssetFuturesPositions}
          activeBinaryTrades={[]}
          currentAssetPrice={currentFuturesAsset?.price}
          onCloseFuturesPosition={closeFuturesPosition}
        />
      )}

      {/* Bottom Trading Controls */}
      {tradingMode === 'binary' ? (
        /* BINARY CONTROLS (Duration + Amount + Call / Put) */
        <div className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.04)] border-t border-slate-100 p-2.5 shrink-0 z-20 space-y-2.5">
          
          {/* Controls Row: Duration & Amount */}
          <div className="flex gap-2.5">
            
            {/* Trade Duration Selector */}
            <div className="flex-1 bg-slate-50/90 hover:bg-slate-50 border border-slate-200/90 rounded-xl p-1.5 flex flex-col justify-between relative shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3 h-3 text-slate-400" strokeWidth={2.2} />
                  <span>Time</span>
                </span>
                <button 
                  onClick={() => setShowDurationPicker(true)}
                  className="text-slate-700 hover:text-indigo-600 bg-white hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-200/60 px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px] flex items-center gap-0.5 cursor-pointer transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-95"
                >
                  <span>{currentDuration.label}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                </button>
              </div>
              
              <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-lg p-0.5 shadow-inner">
                <button 
                  onClick={() => handleDurationStep(-1)}
                  disabled={durationIndex === 0}
                  className="w-7 h-7 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70 rounded-md flex items-center justify-center active:scale-90 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
                  title="Shorter Duration"
                >
                  <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
                
                <button
                  onClick={() => setShowDurationPicker(true)}
                  className="font-mono font-black text-[13px] text-slate-900 hover:text-indigo-600 tracking-wider transition-colors cursor-pointer px-1.5 select-none"
                  title="Click to pick duration"
                >
                  {currentDuration.display}
                </button>
                
                <button 
                  onClick={() => handleDurationStep(1)}
                  disabled={durationIndex === DURATION_OPTIONS.length - 1}
                  className="w-7 h-7 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70 rounded-md flex items-center justify-center active:scale-90 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
                  title="Longer Duration"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Amount Selector */}
            <div className="flex-1 bg-slate-50/90 hover:bg-slate-50 border border-slate-200/90 rounded-xl p-1.5 flex flex-col justify-between relative shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1 text-slate-500">
                  <span>Invest</span>
                </span>
                <span className="text-[#00a862] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-black text-[10px] flex items-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  +₹{Number(expectedProfit || 0).toFixed(0)}
                </span>
              </div>
              
              <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-lg p-0.5 shadow-inner focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all">
                <button 
                  onClick={() => handleAmountChange(-50)}
                  disabled={amount <= MIN_AMOUNT}
                  className="w-7 h-7 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70 rounded-md flex items-center justify-center active:scale-90 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer shrink-0 shadow-xs"
                  title="Decrease Amount"
                >
                  <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
                <div className="flex-1 min-w-0 flex items-center justify-center px-1">
                  <span className="text-slate-400 font-mono font-bold text-[13px] select-none mr-0.5">₹</span>
                  <input 
                    type="number"
                    inputMode="numeric"
                    value={amountInput}
                    onChange={handleAmountInputChange}
                    onBlur={handleAmountInputBlur}
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    className="w-full text-center font-mono font-black text-[13px] text-slate-900 bg-transparent outline-none border-none p-0 appearance-none selection:bg-indigo-100"
                    placeholder="Amount"
                  />
                </div>
                <button 
                  onClick={() => handleAmountChange(50)}
                  disabled={amount >= MAX_AMOUNT}
                  className="w-7 h-7 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70 rounded-md flex items-center justify-center active:scale-90 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer shrink-0 shadow-xs"
                  title="Increase Amount"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons: UP (CALL) & DOWN (PUT) */}
          <div className="flex gap-2.5 pt-0.5">
            {/* DOWN (PUT) BUTTON */}
            <motion.button 
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -1 }}
              onClick={() => handleTrade('PUT')}
              disabled={balance < amount}
              className="flex-1 relative overflow-hidden bg-[#f6354a] hover:bg-[#ff3b51] active:bg-[#e0263b] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-2xl flex flex-col items-center justify-center shadow-[0_6px_20px_rgba(246,53,74,0.38)] hover:shadow-[0_8px_24px_rgba(246,53,74,0.48)] active:shadow-[0_2px_8px_rgba(246,53,74,0.4)] transition-all cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5 z-10">
                <TrendingDown className="w-4 h-4 text-white" strokeWidth={2.8} />
                <span className="text-[13px] font-black tracking-wider uppercase text-white">
                  DOWN
                </span>
              </div>
              <div className="text-[9.5px] font-bold text-white/90 mt-0.5 tracking-wider uppercase z-10">
                Put • {Math.round(currentAsset.profitMargin * 100)}% Payout
              </div>
            </motion.button>

            {/* UP (CALL) BUTTON */}
            <motion.button 
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -1 }}
              onClick={() => handleTrade('CALL')}
              disabled={balance < amount}
              className="flex-1 relative overflow-hidden bg-[#00b067] hover:bg-[#00c271] active:bg-[#009e5c] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-2xl flex flex-col items-center justify-center shadow-[0_6px_20px_rgba(0,176,103,0.38)] hover:shadow-[0_8px_24px_rgba(0,176,103,0.48)] active:shadow-[0_2px_8px_rgba(0,176,103,0.4)] transition-all cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5 z-10">
                <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.8} />
                <span className="text-[13px] font-black tracking-wider uppercase text-white">
                  UP
                </span>
              </div>
              <div className="text-[9.5px] font-bold text-white/90 mt-0.5 tracking-wider uppercase z-10">
                Call • {Math.round(currentAsset.profitMargin * 100)}% Payout
              </div>
            </motion.button>
          </div>
        </div>
      ) : (
        /* FUTURES (20X) CONTROLS: ONLY BUY & SELL BUTTONS AS REQUESTED */
        <div className="bg-white border-t border-gray-100 p-3 shrink-0 z-20">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <span>Mark Price:</span>
              <span className="font-mono font-black text-gray-900">
                {currentFuturesAsset.currencySymbol}
                {currentFuturesAsset.price.toLocaleString('en-US', { minimumFractionDigits: currentFuturesAsset.precision, maximumFractionDigits: currentFuturesAsset.precision })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Leverage:</span>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-mono font-black px-1.5 py-0.2 rounded text-[10px]">
                20X
              </span>
            </div>
          </div>

          <div className="flex gap-2.5">
            {/* SELL / SHORT 20X BUTTON */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -1 }}
              onClick={() => openFuturesOrder('SHORT')}
              className="flex-1 relative overflow-hidden bg-[#f6354a] hover:bg-[#ff3b51] active:bg-[#e0263b] text-white py-3 rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(246,53,74,0.38)] hover:shadow-[0_8px_24px_rgba(246,53,74,0.48)] transition-all cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ArrowDownRight className="w-5 h-5 text-white" strokeWidth={2.8} />
              </div>
              <div className="text-left leading-tight">
                <div className="text-[9px] font-bold text-rose-100 uppercase tracking-wider">Short</div>
                <div className="text-sm font-black tracking-wide">SELL (20X)</div>
              </div>
            </motion.button>

            {/* BUY / LONG 20X BUTTON */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -1 }}
              onClick={() => openFuturesOrder('LONG')}
              className="flex-1 relative overflow-hidden bg-[#00b067] hover:bg-[#00c271] active:bg-[#009e5c] text-white py-3 rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_6px_20px_rgba(0,176,103,0.38)] hover:shadow-[0_8px_24px_rgba(0,176,103,0.48)] transition-all cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5 text-white" strokeWidth={2.8} />
              </div>
              <div className="text-left leading-tight">
                <div className="text-[9px] font-bold text-emerald-100 uppercase tracking-wider">Long</div>
                <div className="text-sm font-black tracking-wide">BUY (20X)</div>
              </div>
            </motion.button>
          </div>
        </div>
      )}

      {/* Futures Order Pad (On-Screen Tab Modal) */}
      <FuturesOrderPad
        isOpen={isFuturesPadOpen}
        onClose={() => setIsFuturesPadOpen(false)}
        orderType={futuresOrderType}
        asset={currentFuturesAsset}
        balance={balance}
        accountType={accountType}
        onPlaceOrder={(params) => {
          return placeFuturesOrder(params);
        }}
      />

      {/* Binary Trade Duration Quick Selector Modal */}
      <AnimatePresence>
        {showDurationPicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-[#0088cc]" />
                  <h3 className="text-sm font-black text-gray-900">Trade Expiry Duration</h3>
                </div>
                <button 
                  onClick={() => setShowDurationPicker(false)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {DURATION_OPTIONS.map((opt, idx) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={opt.seconds}
                    onClick={() => {
                      setDurationIndex(idx);
                      setShowDurationPicker(false);
                    }}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      durationIndex === idx
                        ? 'border-[#0088cc] bg-blue-50 text-[#0088cc] shadow-xs'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <span className="text-sm font-black">{opt.label}</span>
                    <span className="text-[10px] font-mono text-gray-400 mt-0.5">{opt.display}</span>
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDurationPicker(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-black rounded-xl transition-colors cursor-pointer"
              >
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
