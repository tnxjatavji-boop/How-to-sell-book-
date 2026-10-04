import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext, Trade } from '../context/AppContext';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, BarChart3, RotateCcw, ArrowUpRight, ArrowDownRight, ShieldAlert } from 'lucide-react';
import { AssetLogo } from '../components/AssetLogo';
import { FuturesPosition } from '../types/futures';

export const DealsScreen = () => {
  const { 
    trades, accountType, setAccountType, currentAsset, assets,
    futuresPositions, closeFuturesPosition,
    tradingMode
  } = useAppContext();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const modeParam = searchParams.get('mode') as 'binary' | 'futures' | null;

  // Initialize with the mode the user is actively trading in (futures -> futures PnL, binary -> binary PnL)
  const [dealsMode, setDealsMode] = useState<'binary' | 'futures'>(() => {
    if (modeParam === 'binary' || modeParam === 'futures') return modeParam;
    return tradingMode;
  });

  // Automatically switch tab when user navigates or active tradingMode changes
  useEffect(() => {
    if (modeParam === 'binary' || modeParam === 'futures') {
      setDealsMode(modeParam);
    } else {
      setDealsMode(tradingMode);
    }
  }, [tradingMode, modeParam]);

  // Binary Tabs
  const [dealTab, setDealTab] = useState<'all' | 'active' | 'closed'>('all');
  const [filterType, setFilterType] = useState<'all' | 'won' | 'lost'>('all');
  const [statsPeriod, setStatsPeriod] = useState<'today' | 'all'>('today');

  // Futures Tabs
  const [futuresTab, setFuturesTab] = useState<'all' | 'open' | 'closed'>('all');

  // Helper to extract timestamp
  const getTradeTimestamp = (t: Trade): number => {
    if (typeof t.closedAt === 'number' && !isNaN(t.closedAt) && t.closedAt > 0) return t.closedAt;
    if (typeof t.strikeTime === 'number' && !isNaN(t.strikeTime) && t.strikeTime > 0) return t.strikeTime;
    if (typeof t.createdAt === 'number' && !isNaN(t.createdAt) && t.createdAt > 0) return t.createdAt;
    if (typeof t.id === 'string') {
      const match = t.id.match(/\d{10,13}/);
      if (match) return parseInt(match[0], 10);
    }
    return 0;
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  // Binary filtering
  const accountTrades = trades.filter(t => (t.accountType || 'real') === accountType);
  const activeTrades = accountTrades.filter(t => t.status === 'active');
  const closedTrades = accountTrades.filter(t => t.status !== 'active');

  const closedTradesToday = closedTrades.filter(t => {
    const tradeTime = getTradeTimestamp(t);
    return tradeTime >= startOfTodayMs;
  });

  const targetClosedTrades = statsPeriod === 'today' ? closedTradesToday : closedTrades;
  const totalTradesCount = targetClosedTrades.length;
  const wonTradesCount = targetClosedTrades.filter(t => t.status === 'won').length;
  const winRate = totalTradesCount > 0 ? Math.round((wonTradesCount / totalTradesCount) * 100) : 0;
  
  const netProfit = targetClosedTrades.reduce((acc, t) => {
    if (t.status === 'won') return acc + (t.amount * t.profitMargin);
    if (t.status === 'lost') return acc - t.amount;
    return acc;
  }, 0);

  const filteredClosedTrades = targetClosedTrades.filter(t => {
    if (filterType === 'won') return t.status === 'won';
    if (filterType === 'lost') return t.status === 'lost';
    return true;
  });

  const displayTrades = dealTab === 'active' 
    ? activeTrades 
    : dealTab === 'closed' 
    ? filteredClosedTrades 
    : [...activeTrades, ...filteredClosedTrades];

  // Futures filtering
  const accountFuturesPositions = futuresPositions.filter(p => (p.accountType || 'real') === accountType);
  const openFutures = accountFuturesPositions.filter(p => p.status === 'open');
  const closedFutures = accountFuturesPositions.filter(p => p.status !== 'open');

  const futuresTotalPnL = accountFuturesPositions.reduce((acc, p) => acc + (p.pnl || 0), 0);
  const futuresWinCount = closedFutures.filter(p => (p.pnl || 0) > 0).length;
  const futuresWinRate = closedFutures.length > 0 ? Math.round((futuresWinCount / closedFutures.length) * 100) : 0;

  const displayFutures = futuresTab === 'open'
    ? openFutures
    : futuresTab === 'closed'
    ? closedFutures
    : accountFuturesPositions;

  // Helper for clean currency PnL format (+₹X.XX or -₹X.XX)
  const formatPnLCurrency = (val: number) => {
    const num = Number(val || 0);
    if (num > 0) return `+₹${num.toFixed(2)}`;
    if (num < 0) return `-₹${Math.abs(num).toFixed(2)}`;
    return `₹0.00`;
  };

  const formatPnLPercent = (percent: number) => {
    const num = Number(percent || 0);
    if (num > 0) return `+${num.toFixed(2)}%`;
    if (num < 0) return `${num.toFixed(2)}%`;
    return `0.00%`;
  };

  return (
    <div className="flex flex-col min-h-full bg-white font-sans pb-24 select-none">
      {/* Top Header Account Toggle */}
      <div className="px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3 flex justify-center items-center bg-white border-b border-gray-100">
        <div className="flex bg-gray-100 p-1 rounded-full text-sm font-medium w-64">
          <button 
            className={`flex-1 py-1.5 text-center rounded-full transition-colors cursor-pointer ${accountType === 'real' ? 'bg-[#0088cc] text-white shadow-sm font-bold' : 'text-gray-500'}`}
            onClick={() => setAccountType('real')}
          >
            Real Account
          </button>
          <button 
            className={`flex-1 py-1.5 text-center rounded-full transition-colors cursor-pointer ${accountType === 'demo' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-500'}`}
            onClick={() => setAccountType('demo')}
          >
            Demo Account
          </button>
        </div>
      </div>

      {/* Binary vs Futures Segment Switcher */}
      <div className="px-4 py-2 bg-white border-b border-gray-100">
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-black">
          <button
            onClick={() => setDealsMode('binary')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              dealsMode === 'binary' ? 'bg-white text-[#0088cc] shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>Binary Deals</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-[#0088cc]">
              {accountTrades.length}
            </span>
          </button>
          <button
            onClick={() => setDealsMode('futures')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              dealsMode === 'futures' ? 'bg-[#0088cc] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Futures (20X)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 font-black">
              {accountFuturesPositions.length}
            </span>
          </button>
        </div>
      </div>

      {dealsMode === 'binary' ? (
        /* BINARY DEALS VIEW */
        <>
          {/* Summary Stats Banner with Daily & All-Time Toggle */}
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 via-blue-50/40 to-gray-50 border-b border-gray-100">
            {/* Period Selector Tabs */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 bg-gray-200/70 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  onClick={() => setStatsPeriod('today')}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    statsPeriod === 'today'
                      ? 'bg-white text-[#0088cc] shadow-xs font-black'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setStatsPeriod('all')}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    statsPeriod === 'all'
                      ? 'bg-white text-gray-900 shadow-xs font-black'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  All-Time
                </button>
              </div>

              <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                <RotateCcw className="w-3 h-3 text-[#0088cc]" />
                <span>{statsPeriod === 'today' ? 'Resets at 00:00 AM' : 'Lifetime record'}</span>
              </div>
            </div>

            {/* 3-Column Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {statsPeriod === 'today' ? "Today's Deals" : "Total Deals"}
                </div>
                <div className="text-base font-extrabold text-gray-900">
                  {statsPeriod === 'today' ? closedTradesToday.length : accountTrades.length}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Win Rate</div>
                <div className={`text-base font-extrabold ${winRate >= 50 ? 'text-[#00b067]' : totalTradesCount === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                  {totalTradesCount > 0 ? `${winRate}%` : '0%'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <span>Net P&L</span>
                  <span className={`text-[9px] font-semibold px-1 py-0.2 rounded ${statsPeriod === 'today' ? 'text-[#0088cc] bg-blue-50' : 'text-gray-600 bg-gray-100'}`}>
                    {statsPeriod === 'today' ? 'Today' : 'All'}
                  </span>
                </div>
                <div className={`text-base font-extrabold ${netProfit > 0 ? 'text-[#00b067]' : netProfit < 0 ? 'text-[#ff3b30]' : 'text-gray-800'}`}>
                  {formatPnLCurrency(netProfit)}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Filter Bar */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-100 bg-white">
            <div className="flex gap-2">
              <button
                onClick={() => setDealTab('all')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer ${dealTab === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All ({activeTrades.length + targetClosedTrades.length})
              </button>
              <button
                onClick={() => setDealTab('active')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer ${dealTab === 'active' ? 'bg-[#0088cc] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Active ({activeTrades.length})
              </button>
              <button
                onClick={() => setDealTab('closed')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer ${dealTab === 'closed' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Closed ({targetClosedTrades.length})
              </button>
            </div>

            {dealTab === 'closed' && (
              <div className="flex gap-1">
                {(['all', 'won', 'lost'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterType(f)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded capitalize cursor-pointer ${filterType === f ? 'bg-blue-100 text-[#0088cc]' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Deals List */}
          <div className="flex-1 overflow-y-auto bg-gray-50/40">
            {displayTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-300">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <p className="font-semibold text-gray-700">No binary deals found</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  {dealTab === 'active' ? "You don't have any active running binary deals right now." : "Your executed binary trade deals will be listed here."}
                </p>
              </div>
            ) : (
              displayTrades.map(trade => {
                const isLive = trade.status === 'active';
                const remainingSecs = Math.max(0, Math.ceil((trade.strikeTime - Date.now()) / 1000));
                const livePrice = currentAsset.id === trade.assetId ? currentAsset.price : (assets.find(a => a.id === trade.assetId)?.price || trade.entryPrice);
                const inTheMoney = trade.type === 'CALL' ? livePrice > trade.entryPrice : livePrice < trade.entryPrice;

                return (
                  <div 
                    key={trade.id} 
                    className={`bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between transition-colors ${isLive ? 'bg-blue-50/20 border-l-4 border-l-[#0088cc]' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <AssetLogo symbol={(trade.assetName || 'Asset').split(' ')[0]} name={trade.assetName || 'Asset'} size={36} />
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{trade.assetName || 'Asset'}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <span>Strike: {typeof trade.entryPrice === 'number' ? trade.entryPrice.toFixed(2) : trade.entryPrice}</span>
                          {trade.exitPrice !== undefined && trade.exitPrice !== null && (
                            <span>→ Exit: {typeof trade.exitPrice === 'number' ? trade.exitPrice.toFixed(2) : trade.exitPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 mb-1">
                        {trade.type === 'CALL' ? (
                          <span className="flex items-center gap-0.5 text-xs font-bold text-[#00b067] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <TrendingUp className="w-3.5 h-3.5" /> CALL
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-xs font-bold text-[#ff3b30] bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            <TrendingDown className="w-3.5 h-3.5" /> PUT
                          </span>
                        )}
                        <span className="font-extrabold text-gray-900 text-sm">₹{Number(trade.amount || 0).toFixed(2)}</span>
                      </div>

                      {isLive ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[11px] font-mono text-gray-500 font-bold bg-gray-100 px-1.5 py-0.5 rounded">
                              ⏱ {remainingSecs}s
                            </span>
                            <span className={`text-xs font-bold ${inTheMoney ? 'text-[#00b067]' : 'text-[#ff3b30]'}`}>
                              {inTheMoney ? `+₹${((Number(trade.amount || 0)) * (Number(trade.profitMargin || 0))).toFixed(2)}` : 'OTM'}
                            </span>
                          </div>
                          {inTheMoney && (
                            <div className="text-[10px] font-semibold text-[#00b067]">
                              Payout: ₹{((Number(trade.amount || 0)) * (1 + Number(trade.profitMargin || 0))).toFixed(2)}
                            </div>
                          )}
                        </div>
                      ) : trade.status === 'won' ? (
                        <div className="text-right">
                          <div className="text-xs text-[#00b067] font-extrabold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            +₹{((Number(trade.amount || 0)) * (Number(trade.profitMargin || 0))).toFixed(2)} (+{((Number(trade.profitMargin || 0)) * 100).toFixed(0)}%)
                          </div>
                          <div className="text-[10px] font-bold text-gray-600">
                            Payout: ₹{(Number(trade.payout ?? ((Number(trade.amount || 0)) * (1 + Number(trade.profitMargin || 0))))).toFixed(2)}
                          </div>
                        </div>
                      ) : trade.status === 'lost' ? (
                        <div className="text-xs text-[#ff3b30] font-extrabold flex items-center justify-end gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          -₹{Number(trade.amount || 0).toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 font-bold">Tie (Refunded ₹{Number(trade.amount || 0).toFixed(2)})</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* FUTURES (20X) POSITIONS VIEW */
        <>
          {/* Futures Summary Banner */}
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 via-amber-50/30 to-gray-50 border-b border-gray-100">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Open Positions
                </div>
                <div className="text-base font-extrabold text-gray-900">
                  {openFutures.length}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Closed Win Rate
                </div>
                <div className={`text-base font-extrabold ${futuresWinRate >= 50 ? 'text-[#00b067]' : closedFutures.length === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                  {closedFutures.length > 0 ? `${futuresWinRate}%` : '0%'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Total Futures P&L
                </div>
                <div className={`text-base font-extrabold ${futuresTotalPnL > 0 ? 'text-[#00b067]' : futuresTotalPnL < 0 ? 'text-[#ff3b30]' : 'text-gray-800'}`}>
                  {formatPnLCurrency(futuresTotalPnL)}
                </div>
              </div>
            </div>
          </div>

          {/* Futures Filter Tabs */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-100 bg-white">
            <div className="flex gap-2">
              <button
                onClick={() => setFuturesTab('all')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                  futuresTab === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({accountFuturesPositions.length})
              </button>
              <button
                onClick={() => setFuturesTab('open')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                  futuresTab === 'open' ? 'bg-[#0088cc] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Open ({openFutures.length})
              </button>
              <button
                onClick={() => setFuturesTab('closed')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                  futuresTab === 'closed' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                History ({closedFutures.length})
              </button>
            </div>
          </div>

          {/* Futures Positions List */}
          <div className="flex-1 overflow-y-auto bg-gray-50/40">
            {displayFutures.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-300">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <p className="font-semibold text-gray-700">No 20X futures positions found</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  {futuresTab === 'open' 
                    ? "You don't have any open 20X leverage positions right now." 
                    : "Your closed futures trades and PnL will appear here."}
                </p>
              </div>
            ) : (
              displayFutures.map((pos: FuturesPosition) => {
                const isOpen = pos.status === 'open';
                const isLong = pos.type === 'LONG';
                const isProfitable = (pos.pnl || 0) >= 0;

                return (
                  <div
                    key={pos.id}
                    className={`bg-white border-b border-gray-100 p-4 transition-colors ${
                      isOpen ? 'border-l-4 border-l-[#0088cc] bg-blue-50/10' : ''
                    }`}
                  >
                    {/* Position Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AssetLogo symbol={(pos.assetSymbol || 'ASSET').split('/')[0]} name={pos.assetName || 'Asset'} size={30} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-gray-900 text-xs">{pos.assetName || 'Asset'}</span>
                            <span className="text-[10px] font-mono text-gray-400 font-bold">{pos.assetSymbol || ''}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                              isLong ? 'bg-emerald-50 text-[#00b067] border border-emerald-200' : 'bg-rose-50 text-[#ff3b30] border border-rose-200'
                            }`}>
                              {isLong ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {pos.type} 20X
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Margin: ₹{Number(pos.margin || 0).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Floating / Realized PnL */}
                      <div className="text-right">
                        <div className={`font-mono font-black text-sm ${isProfitable ? 'text-[#00b067]' : 'text-[#ff3b30]'}`}>
                          {formatPnLCurrency(pos.pnl)}
                        </div>
                        <div className={`text-[10px] font-bold font-mono ${isProfitable ? 'text-[#00b067]' : 'text-[#ff3b30]'}`}>
                          {formatPnLPercent(pos.pnlPercent)}
                        </div>
                      </div>
                    </div>

                    {/* Position Details Matrix */}
                    <div className="bg-gray-50 rounded-xl p-2 grid grid-cols-3 gap-2 text-[10px] font-mono mb-2 border border-gray-100">
                      <div>
                        <span className="text-gray-400 block text-[9px]">ENTRY</span>
                        <span className="font-bold text-gray-800">{pos.entryPrice.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px]">{isOpen ? 'MARK' : 'EXIT'}</span>
                        <span className="font-bold text-gray-800">
                          {(pos.closePrice || pos.currentPrice).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px]">LIQ. PRICE</span>
                        <span className="font-bold text-rose-500">{pos.liquidationPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="text-gray-400">
                        Exposure: <span className="font-mono font-bold text-gray-700">₹{pos.positionSize.toLocaleString()}</span>
                      </div>

                      {isOpen ? (
                        <button
                          onClick={() => closeFuturesPosition(pos.id)}
                          className="px-3 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-black text-xs transition-colors cursor-pointer shadow-xs"
                        >
                          Close Position (Market)
                        </button>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pos.status === 'liquidated' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {pos.status === 'liquidated' ? 'Liquidated' : 'Closed'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};
