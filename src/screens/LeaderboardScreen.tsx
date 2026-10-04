import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Trophy, Flame, TrendingUp, Award, Crown, ShieldCheck, 
  Copy, Check, ChevronRight, X, Sparkles, Filter, Users, ArrowUpRight, Clock
} from 'lucide-react';
import { 
  TraderRankingItem, 
  getCalculatedLeaderboard, 
  INITIAL_LIVE_WINS, 
  LiveTradeWinFeed 
} from '../utils/leaderboardData';

export const LeaderboardScreen: React.FC = () => {
  const { userId, trades, accountType, userStats } = useAppContext();
  const [timeframe, setTimeframe] = useState<'today' | 'weekly' | 'monthly' | 'all'>('today');
  const [selectedTrader, setSelectedTrader] = useState<TraderRankingItem | null>(null);
  const [followedTraders, setFollowedTraders] = useState<Record<string, boolean>>({});
  const [liveWins, setLiveWins] = useState<LiveTradeWinFeed[]>(INITIAL_LIVE_WINS);
  const [copiedTraderId, setCopiedTraderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to reliably extract trade timestamp in milliseconds
  const getTradeTimestamp = (t: any): number => {
    if (typeof t.closedAt === 'number' && !isNaN(t.closedAt) && t.closedAt > 0) return t.closedAt;
    if (typeof t.strikeTime === 'number' && !isNaN(t.strikeTime) && t.strikeTime > 0) return t.strikeTime;
    if (typeof t.createdAt === 'number' && !isNaN(t.createdAt) && t.createdAt > 0) return t.createdAt;
    if (typeof t.id === 'string') {
      const match = t.id.match(/\d{10,13}/);
      if (match) return parseInt(match[0], 10);
    }
    return 0;
  };

  // Start of current day (midnight 00:00:00.000)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  // Compute current user's actual profit and trade counts from their trade history
  const userAccountTrades = trades.filter(t => {
    if ((t.accountType || 'real') !== accountType) return false;
    if (timeframe === 'today') {
      return getTradeTimestamp(t) >= startOfTodayMs;
    }
    return true;
  });
  const userWonTrades = userAccountTrades.filter(t => t.status === 'won');
  const userLostTrades = userAccountTrades.filter(t => t.status === 'lost');
  
  const userNetProfit = userAccountTrades.reduce((acc, t) => {
    if (t.status === 'won') return acc + (t.amount * t.profitMargin);
    if (t.status === 'lost') return acc - t.amount;
    return acc;
  }, 0);

  const userWinRate = userAccountTrades.length > 0 
    ? Math.round((userWonTrades.length / userAccountTrades.length) * 1000) / 10 
    : 0;

  const { leaderboard, currentUserItem } = getCalculatedLeaderboard(
    {
      userId: userId || 'Trader',
      userName: userStats?.name || userId || 'You',
      totalProfit: Math.max(0, userNetProfit),
      winRate: userWinRate,
      totalTrades: userAccountTrades.length,
      winningTrades: userWonTrades.length
    },
    timeframe
  );

  // Live real-time winning ticker simulation every 5-8 seconds
  useEffect(() => {
    const assetsPool = ['Crypto IDX', 'EUR/USD', 'BTC/USDT', 'Gold (OTC)', 'GBP/USD', 'USD/JPY (OTC)', 'ETH/USDT'];
    const namesPool = [
      { name: 'Aarav S.', flag: '🇮🇳' },
      { name: 'Matheus S.', flag: '🇧🇷' },
      { name: 'Priya P.', flag: '🇮🇳' },
      { name: 'Tariq M.', flag: '🇦🇪' },
      { name: 'Alex T.', flag: '🇸🇬' },
      { name: 'Lukas W.', flag: '🇩🇪' },
      { name: 'Nguyen M.', flag: '🇻🇳' },
      { name: 'Dmitry V.', flag: '🇷🇺' },
      { name: 'Budi S.', flag: '🇮🇩' },
      { name: 'Rohan D.', flag: '🇮🇳' }
    ];

    const interval = setInterval(() => {
      const randomTrader = namesPool[Math.floor(Math.random() * namesPool.length)];
      const randomAsset = assetsPool[Math.floor(Math.random() * assetsPool.length)];
      const randomProfit = Math.floor(Math.random() * 25000) + 3500;
      const randomType: 'CALL' | 'PUT' = Math.random() > 0.5 ? 'CALL' : 'PUT';

      const newWin: LiveTradeWinFeed = {
        id: `win_${Date.now()}`,
        traderName: randomTrader.name,
        flag: randomTrader.flag,
        asset: randomAsset,
        type: randomType,
        profit: randomProfit,
        timeAgo: 'Just now'
      };

      setLiveWins(prev => [newWin, ...prev.slice(0, 5)]);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const toggleFollow = (traderId: string, traderName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFollowedTraders(prev => {
      const nextState = !prev[traderId];
      if (nextState) {
        showToast(`🔔 Subscribed to copy signals from ${traderName}!`);
      } else {
        showToast(`Unsubscribed from ${traderName}.`);
      }
      return { ...prev, [traderId]: nextState };
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const top3 = leaderboard.slice(0, 3);
  const remainingTraders = leaderboard.slice(3);

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-28 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] bg-gray-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white px-4 pt-[max(env(safe-area-inset-top,0px),16px)] pb-6 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#0088cc]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tight">Top Traders Ranking</h1>
                <span className="text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded-full uppercase">
                  Global Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold">Real-time leaderboard & algorithmic rankings</p>
            </div>
          </div>
        </div>

        {/* Live Winners Ticker Stream */}
        <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-2.5 flex items-center gap-2 overflow-hidden shadow-inner">
          <div className="flex items-center gap-1 shrink-0 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase">
            <Flame className="w-3 h-3 animate-pulse text-emerald-400" />
            <span>Live Win:</span>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar text-xs font-bold whitespace-nowrap">
            {liveWins.slice(0, 2).map((win) => (
              <div key={win.id} className="flex items-center gap-1.5 text-slate-200">
                <span>{win.flag}</span>
                <span className="text-slate-300 font-extrabold">{win.traderName}</span>
                <span className={`text-[10px] px-1 rounded ${win.type === 'CALL' ? 'bg-emerald-900/60 text-emerald-400' : 'bg-rose-900/60 text-rose-400'}`}>
                  {win.type}
                </span>
                <span className="text-emerald-400 font-mono font-black">+₹{win.profit.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500">({win.asset})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeframe Filter Pills */}
        <div className="grid grid-cols-4 gap-1.5 mt-3.5 bg-slate-800/60 p-1 rounded-2xl border border-slate-700/60">
          {[
            { key: 'today', label: 'Today (24h)' },
            { key: 'weekly', label: 'This Week' },
            { key: 'monthly', label: 'This Month' },
            { key: 'all', label: 'All-Time' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setTimeframe(tab.key as any)}
              className={`py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer text-center ${
                timeframe === tab.key
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Your Personal Real-Time Rank Card */}
      <div className="mx-4 -mt-3 relative z-20 bg-white border border-amber-200/80 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md uppercase">
              {currentUserItem.avatarLetter}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-gray-900 text-sm">{currentUserItem.name}</span>
                <span className="text-xs">{currentUserItem.flag}</span>
                <span className="text-[9px] font-black bg-blue-50 text-[#0088cc] px-1.5 py-0.2 rounded-full border border-blue-200">
                  You
                </span>
              </div>
              <div className="text-[11px] text-gray-500 font-semibold flex items-center gap-2 mt-0.5">
                <span>Tier: <strong className="text-amber-600 font-black">{currentUserItem.tier}</strong></span>
                <span>•</span>
                <span>Win Rate: <strong className="text-emerald-600 font-black">{currentUserItem.winRate}%</strong></span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Rank</div>
            <div className="text-xl font-black text-[#0088cc] flex items-center justify-end gap-1">
              <span>#{currentUserItem.rank}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-2xl border border-gray-100 text-center">
          <div>
            <div className="text-[9px] font-bold text-gray-400 uppercase">Total Profit</div>
            <div className="text-xs font-black text-emerald-600 font-mono mt-0.5">
              +₹{currentUserItem.profit.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-gray-400 uppercase">Deals</div>
            <div className="text-xs font-black text-gray-900 font-mono mt-0.5">
              {currentUserItem.totalTrades}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-gray-400 uppercase">Next Rank</div>
            <div className="text-xs font-black text-amber-600 mt-0.5">
              Top 10 Pro
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Top 3 Champions</h2>
          </div>
          <span className="text-[11px] text-gray-400 font-bold">Auto-updates 24/7</span>
        </div>

        <div className="grid grid-cols-3 gap-2 items-end pt-4 pb-2">
          {/* 2nd Place */}
          {top3[1] && (
            <div 
              onClick={() => setSelectedTrader(top3[1])}
              className="bg-white border-2 border-slate-200 rounded-3xl p-2.5 flex flex-col items-center text-center shadow-md relative cursor-pointer hover:border-slate-400 transition-all"
            >
              <div className="absolute -top-3 w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center shadow-sm border-2 border-white">
                2
              </div>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${top3[1].avatarColor} flex items-center justify-center text-white font-black text-sm shadow-md mt-1 mb-1.5`}>
                {top3[1].avatarLetter}
              </div>
              <div className="font-black text-gray-900 text-xs truncate max-w-full">{(top3[1]?.name || 'Trader').split(' ')[0]}</div>
              <span className="text-xs mb-1">{top3[1].flag}</span>
              <div className="font-mono font-black text-[11px] text-emerald-600">+₹{((Number(top3[1]?.profit || 0)) / 100000).toFixed(1)}L</div>
              <span className="text-[9px] font-bold text-gray-400">{top3[1].winRate}% Win</span>
            </div>
          )}

          {/* 1st Place (Winner - Center Elevated) */}
          {top3[0] && (
            <div 
              onClick={() => setSelectedTrader(top3[0])}
              className="bg-gradient-to-b from-amber-50 to-white border-2 border-amber-400 rounded-3xl p-3 flex flex-col items-center text-center shadow-xl relative cursor-pointer hover:scale-[1.02] transition-transform -mt-3"
            >
              <div className="absolute -top-4 w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-black text-sm flex items-center justify-center shadow-lg border-2 border-white">
                👑
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${top3[0].avatarColor} flex items-center justify-center text-white font-black text-base shadow-lg mt-1 mb-1.5 ring-2 ring-amber-300`}>
                {top3[0].avatarLetter}
              </div>
              <div className="font-black text-gray-900 text-xs truncate max-w-full">{(top3[0]?.name || 'Trader').split(' ')[0]}</div>
              <span className="text-sm mb-1">{top3[0].flag}</span>
              <div className="font-mono font-black text-xs text-emerald-600">+₹{((Number(top3[0]?.profit || 0)) / 100000).toFixed(1)}L</div>
              <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full mt-0.5">
                {top3[0].winRate}% Win
              </span>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div 
              onClick={() => setSelectedTrader(top3[2])}
              className="bg-white border-2 border-amber-700/20 rounded-3xl p-2.5 flex flex-col items-center text-center shadow-md relative cursor-pointer hover:border-amber-700/40 transition-all"
            >
              <div className="absolute -top-3 w-6 h-6 rounded-full bg-amber-700/80 text-white font-black text-xs flex items-center justify-center shadow-sm border-2 border-white">
                3
              </div>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${top3[2].avatarColor} flex items-center justify-center text-white font-black text-sm shadow-md mt-1 mb-1.5`}>
                {top3[2].avatarLetter}
              </div>
              <div className="font-black text-gray-900 text-xs truncate max-w-full">{(top3[2]?.name || 'Trader').split(' ')[0]}</div>
              <span className="text-xs mb-1">{top3[2].flag}</span>
              <div className="font-mono font-black text-[11px] text-emerald-600">+₹{((Number(top3[2]?.profit || 0)) / 100000).toFixed(1)}L</div>
              <span className="text-[9px] font-bold text-gray-400">{top3[2].winRate}% Win</span>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table List (#4 - #20) */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#0088cc]" />
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">All Ranked Traders</h2>
          </div>
          <span className="text-[10px] text-gray-400 font-bold">Tap trader for signals</span>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs divide-y divide-gray-50">
          {remainingTraders.map((trader) => {
            const isFollowed = !!followedTraders[trader.id];

            return (
              <div
                key={trader.id}
                onClick={() => setSelectedTrader(trader)}
                className={`p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                  trader.isCurrentUser ? 'bg-blue-50/60 border-l-4 border-l-[#0088cc]' : ''
                }`}
              >
                {/* Left Rank & Avatar */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="font-mono font-black text-xs text-gray-400 w-5 text-center shrink-0">
                    #{trader.rank}
                  </span>

                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${trader.avatarColor} flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0`}>
                    {trader.avatarLetter}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-gray-900 text-xs truncate max-w-[130px]">
                        {trader.name}
                      </span>
                      <span className="text-xs shrink-0">{trader.flag}</span>
                      {trader.isCurrentUser && (
                        <span className="text-[9px] font-black bg-[#0088cc] text-white px-1.5 py-0.2 rounded-full shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold mt-0.5">
                      <span>{trader.favoriteAsset}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-bold">{trader.winRate}% Win</span>
                    </div>
                  </div>
                </div>

                {/* Right Profit & Copy Action */}
                <div className="flex items-center gap-2.5 shrink-0 pl-1">
                  <div className="text-right">
                    <div className="font-mono font-black text-xs text-emerald-600">
                      +₹{trader.profit.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[9px] text-gray-400 font-semibold">
                      {trader.totalTrades} Deals
                    </div>
                  </div>

                  <button
                    onClick={(e) => toggleFollow(trader.id, trader.name, e)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                      isFollowed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 hover:bg-[#0088cc] hover:text-white text-slate-700'
                    }`}
                  >
                    {isFollowed ? 'Following' : 'Copy'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trader Detail Modal */}
      {selectedTrader && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-5 bg-gradient-to-tr ${selectedTrader.avatarColor} text-white relative`}>
              <button
                onClick={() => setSelectedTrader(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-xl border border-white/30 shadow-lg">
                  {selectedTrader.avatarLetter}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-white">{selectedTrader.name}</h3>
                    <span className="text-base">{selectedTrader.flag}</span>
                  </div>
                  <p className="text-xs text-white/80 font-semibold">{selectedTrader.country}</p>
                  <span className="inline-block mt-1 text-[10px] font-black bg-white/25 text-white px-2 py-0.5 rounded-full uppercase">
                    Rank #{selectedTrader.rank} • {selectedTrader.tier}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Details */}
            <div className="p-4 space-y-3.5">
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase">Estimated Profit</div>
                  <div className="text-base font-black text-emerald-700 font-mono mt-0.5">
                    +₹{selectedTrader.profit.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="text-[10px] font-bold text-blue-700 uppercase">Win Accuracy</div>
                  <div className="text-base font-black text-blue-700 mt-0.5">
                    {selectedTrader.winRate}%
                  </div>
                </div>
              </div>

              {/* Trading Profile Info */}
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Trading Strategy:</span>
                  <span className="font-extrabold text-gray-900">{selectedTrader.tradingStyle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Top Traded Asset:</span>
                  <span className="font-extrabold text-[#0088cc]">{selectedTrader.favoriteAsset}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Total Deals Executed:</span>
                  <span className="font-extrabold text-gray-900">{selectedTrader.totalTrades}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Subscribers Copying:</span>
                  <span className="font-extrabold text-amber-600">{selectedTrader.copiedCount} Traders</span>
                </div>
              </div>

              {/* Recent 10 Trades Streak */}
              <div>
                <div className="text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                  Recent 10 Trades Track Record:
                </div>
                <div className="flex gap-1.5">
                  {selectedTrader.recentTrades.map((res, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-black uppercase text-white shadow-xs ${
                        res === 'win' ? 'bg-[#00b067]' : 'bg-[#ff3b30]'
                      }`}
                    >
                      {res === 'win' ? 'W' : 'L'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy Trading Button */}
              <button
                onClick={() => {
                  toggleFollow(selectedTrader.id, selectedTrader.name);
                  setSelectedTrader(null);
                }}
                className={`w-full py-3 rounded-2xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                  followedTraders[selectedTrader.id]
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#0088cc] hover:bg-[#0077b5] text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>
                  {followedTraders[selectedTrader.id]
                    ? 'Subscribed to Signals (Active)'
                    : `Copy ${selectedTrader.name.split(' ')[0]}'s Trading Signals`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
