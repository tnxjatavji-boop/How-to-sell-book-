export interface TraderRankingItem {
  id: string;
  rank: number;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  avatarColor: string;
  avatarLetter: string;
  isRealUser?: boolean;
  isCurrentUser?: boolean;
  profit: number; // in INR
  winRate: number; // e.g. 94.5%
  totalTrades: number;
  winningTrades: number;
  favoriteAsset: string;
  tradingStyle: string;
  badge: 'crown' | 'diamond' | 'star' | 'verified' | 'rising';
  tier: 'VIP Legend' | 'Diamond Master' | 'Gold Pro' | 'Silver Trader' | 'Bronze Explorer';
  recentTrades: ('win' | 'loss')[];
  trend: 'up' | 'down' | 'same';
  rankChange: number;
  copiedCount: number;
}

export interface LiveTradeWinFeed {
  id: string;
  traderName: string;
  flag: string;
  asset: string;
  type: 'CALL' | 'PUT';
  profit: number;
  timeAgo: string;
}

export const BASE_TOP_TRADERS: Omit<TraderRankingItem, 'rank'>[] = [
  {
    id: 'trader_1',
    name: 'Aarav "Apex" Sharma',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatarColor: 'from-amber-400 to-orange-600',
    avatarLetter: 'AS',
    profit: 1485600,
    winRate: 95.8,
    totalTrades: 342,
    winningTrades: 328,
    favoriteAsset: 'Crypto IDX',
    tradingStyle: 'Price Action & Momentum Sniper',
    badge: 'crown',
    tier: 'VIP Legend',
    recentTrades: ['win', 'win', 'win', 'win', 'win', 'loss', 'win', 'win', 'win', 'win'],
    trend: 'up',
    rankChange: 0,
    copiedCount: 3840
  },
  {
    id: 'trader_2',
    name: 'Matheus "Silva" Santos',
    country: 'Brazil',
    countryCode: 'BR',
    flag: '🇧🇷',
    avatarColor: 'from-emerald-400 to-teal-700',
    avatarLetter: 'MS',
    profit: 1294800,
    winRate: 94.2,
    totalTrades: 298,
    winningTrades: 281,
    favoriteAsset: 'EUR/USD',
    tradingStyle: 'Trend Flow & Support Scalp',
    badge: 'diamond',
    tier: 'VIP Legend',
    recentTrades: ['win', 'win', 'win', 'loss', 'win', 'win', 'win', 'win', 'win', 'win'],
    trend: 'up',
    rankChange: 1,
    copiedCount: 2950
  },
  {
    id: 'trader_3',
    name: 'Tariq Al-Mansoori',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    flag: '🇦🇪',
    avatarColor: 'from-blue-500 to-indigo-700',
    avatarLetter: 'TA',
    profit: 1152000,
    winRate: 93.6,
    totalTrades: 275,
    winningTrades: 257,
    favoriteAsset: 'Gold (OTC)',
    tradingStyle: 'Breakout Volume Precision',
    badge: 'diamond',
    tier: 'VIP Legend',
    recentTrades: ['win', 'win', 'loss', 'win', 'win', 'win', 'win', 'win', 'loss', 'win'],
    trend: 'same',
    rankChange: 0,
    copiedCount: 2410
  },
  {
    id: 'trader_4',
    name: 'Priya "Queen" Patel',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatarColor: 'from-purple-500 to-pink-600',
    avatarLetter: 'PP',
    profit: 984500,
    winRate: 92.4,
    totalTrades: 240,
    winningTrades: 222,
    favoriteAsset: 'BTC/USDT',
    tradingStyle: 'Candle Wick Reversal Scalper',
    badge: 'star',
    tier: 'Diamond Master',
    recentTrades: ['win', 'win', 'win', 'win', 'loss', 'win', 'win', 'win', 'win', 'win'],
    trend: 'up',
    rankChange: 2,
    copiedCount: 1980
  },
  {
    id: 'trader_5',
    name: 'Nguyen Van Minh',
    country: 'Vietnam',
    countryCode: 'VN',
    flag: '🇻🇳',
    avatarColor: 'from-rose-500 to-red-700',
    avatarLetter: 'NM',
    profit: 875200,
    winRate: 91.8,
    totalTrades: 215,
    winningTrades: 197,
    favoriteAsset: 'GBP/USD',
    tradingStyle: '1-Minute Turbo Binary Scalp',
    badge: 'verified',
    tier: 'Diamond Master',
    recentTrades: ['win', 'win', 'loss', 'win', 'win', 'win', 'loss', 'win', 'win', 'win'],
    trend: 'down',
    rankChange: -1,
    copiedCount: 1650
  },
  {
    id: 'trader_6',
    name: 'Alex Tan Keng',
    country: 'Singapore',
    countryCode: 'SG',
    flag: '🇸🇬',
    avatarColor: 'from-cyan-500 to-blue-600',
    avatarLetter: 'AT',
    profit: 764000,
    winRate: 90.5,
    totalTrades: 195,
    winningTrades: 176,
    favoriteAsset: 'USD/JPY (OTC)',
    tradingStyle: 'RSI & Bollinger Bounce',
    badge: 'verified',
    tier: 'Diamond Master',
    recentTrades: ['win', 'win', 'win', 'win', 'win', 'loss', 'win', 'win', 'loss', 'win'],
    trend: 'up',
    rankChange: 3,
    copiedCount: 1420
  },
  {
    id: 'trader_7',
    name: 'Vikram "Bull" Singh',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatarColor: 'from-emerald-500 to-green-700',
    avatarLetter: 'VS',
    profit: 692400,
    winRate: 89.7,
    totalTrades: 184,
    winningTrades: 165,
    favoriteAsset: 'Crypto IDX',
    tradingStyle: 'Fibonacci Trend Wave Rider',
    badge: 'verified',
    tier: 'Gold Pro',
    recentTrades: ['win', 'loss', 'win', 'win', 'win', 'win', 'win', 'loss', 'win', 'win'],
    trend: 'same',
    rankChange: 0,
    copiedCount: 1210
  },
  {
    id: 'trader_8',
    name: 'Lukas Weber',
    country: 'Germany',
    countryCode: 'DE',
    flag: '🇩🇪',
    avatarColor: 'from-slate-700 to-zinc-900',
    avatarLetter: 'LW',
    profit: 618900,
    winRate: 88.9,
    totalTrades: 172,
    winningTrades: 153,
    favoriteAsset: 'EUR/GBP',
    tradingStyle: 'European Session High Volatility',
    badge: 'verified',
    tier: 'Gold Pro',
    recentTrades: ['win', 'win', 'win', 'loss', 'win', 'win', 'win', 'win', 'loss', 'win'],
    trend: 'down',
    rankChange: -1,
    copiedCount: 980
  },
  {
    id: 'trader_9',
    name: 'Budi "Delta" Santoso',
    country: 'Indonesia',
    countryCode: 'ID',
    flag: '🇮🇩',
    avatarColor: 'from-red-600 to-amber-600',
    avatarLetter: 'BS',
    profit: 542000,
    winRate: 88.1,
    totalTrades: 160,
    winningTrades: 141,
    favoriteAsset: 'ETH/USDT',
    tradingStyle: 'Breakdown Retest Strategy',
    badge: 'verified',
    tier: 'Gold Pro',
    recentTrades: ['win', 'win', 'win', 'win', 'loss', 'win', 'loss', 'win', 'win', 'win'],
    trend: 'up',
    rankChange: 1,
    copiedCount: 890
  },
  {
    id: 'trader_10',
    name: 'Dmitry Volkov',
    country: 'Russia',
    countryCode: 'RU',
    flag: '🇷🇺',
    avatarColor: 'from-sky-500 to-indigo-800',
    avatarLetter: 'DV',
    profit: 489000,
    winRate: 87.5,
    totalTrades: 152,
    winningTrades: 133,
    favoriteAsset: 'Oil Brent',
    tradingStyle: 'Volume Weighted Average Price (VWAP)',
    badge: 'rising',
    tier: 'Gold Pro',
    recentTrades: ['win', 'win', 'loss', 'win', 'win', 'win', 'win', 'loss', 'win', 'win'],
    trend: 'same',
    rankChange: 0,
    copiedCount: 760
  },
  {
    id: 'trader_11',
    name: 'Rohan Deshmukh',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatarColor: 'from-orange-500 to-amber-600',
    avatarLetter: 'RD',
    profit: 432100,
    winRate: 86.8,
    totalTrades: 145,
    winningTrades: 126,
    favoriteAsset: 'Silver (OTC)',
    tradingStyle: 'Support Resistance Sniping',
    badge: 'rising',
    tier: 'Gold Pro',
    recentTrades: ['win', 'win', 'win', 'loss', 'win', 'win', 'win', 'loss', 'win', 'win'],
    trend: 'up',
    rankChange: 2,
    copiedCount: 650
  },
  {
    id: 'trader_12',
    name: 'Carlos "El Toro" Gomez',
    country: 'Mexico',
    countryCode: 'MX',
    flag: '🇲🇽',
    avatarColor: 'from-green-600 to-emerald-800',
    avatarLetter: 'CG',
    profit: 384000,
    winRate: 85.9,
    totalTrades: 138,
    winningTrades: 118,
    favoriteAsset: 'USD/CAD',
    tradingStyle: 'News Breakout & Martingale Safety',
    badge: 'rising',
    tier: 'Silver Trader',
    recentTrades: ['win', 'loss', 'win', 'win', 'win', 'win', 'loss', 'win', 'win', 'loss'],
    trend: 'down',
    rankChange: -2,
    copiedCount: 540
  },
  {
    id: 'trader_13',
    name: 'Elena Smirnova',
    country: 'Kazakhstan',
    countryCode: 'KZ',
    flag: '🇰🇿',
    avatarColor: 'from-teal-400 to-cyan-700',
    avatarLetter: 'ES',
    profit: 326000,
    winRate: 85.2,
    totalTrades: 129,
    winningTrades: 110,
    favoriteAsset: 'EUR/JPY',
    tradingStyle: 'Moving Average Crossover',
    badge: 'rising',
    tier: 'Silver Trader',
    recentTrades: ['win', 'win', 'win', 'loss', 'win', 'win', 'loss', 'win', 'win', 'win'],
    trend: 'same',
    rankChange: 0,
    copiedCount: 430
  },
  {
    id: 'trader_14',
    name: 'Ananya Roy',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatarColor: 'from-pink-500 to-purple-700',
    avatarLetter: 'AR',
    profit: 295000,
    winRate: 84.6,
    totalTrades: 120,
    winningTrades: 101,
    favoriteAsset: 'Crypto IDX',
    tradingStyle: 'Stochastic Oscillator Micro Scalp',
    badge: 'rising',
    tier: 'Silver Trader',
    recentTrades: ['win', 'loss', 'win', 'win', 'win', 'loss', 'win', 'win', 'win', 'win'],
    trend: 'up',
    rankChange: 1,
    copiedCount: 390
  },
  {
    id: 'trader_15',
    name: 'Emirhan "Pasha" Yilmaz',
    country: 'Turkey',
    countryCode: 'TR',
    flag: '🇹🇷',
    avatarColor: 'from-red-500 to-rose-800',
    avatarLetter: 'EY',
    profit: 245000,
    winRate: 83.9,
    totalTrades: 114,
    winningTrades: 95,
    favoriteAsset: 'Gold (OTC)',
    tradingStyle: 'London/NY Overlap Hunter',
    badge: 'rising',
    tier: 'Silver Trader',
    recentTrades: ['win', 'win', 'loss', 'win', 'win', 'loss', 'win', 'win', 'loss', 'win'],
    trend: 'same',
    rankChange: 0,
    copiedCount: 310
  }
];

export const INITIAL_LIVE_WINS: LiveTradeWinFeed[] = [
  { id: 'win_1', traderName: 'Aarav "Apex" S.', flag: '🇮🇳', asset: 'Crypto IDX', type: 'CALL', profit: 14500, timeAgo: '2s ago' },
  { id: 'win_2', traderName: 'Matheus Silva', flag: '🇧🇷', asset: 'EUR/USD', type: 'PUT', profit: 9800, timeAgo: '6s ago' },
  { id: 'win_3', traderName: 'Priya Patel', flag: '🇮🇳', asset: 'BTC/USDT', type: 'CALL', profit: 12200, timeAgo: '11s ago' },
  { id: 'win_4', traderName: 'Tariq Al-Mansoori', flag: '🇦🇪', asset: 'Gold (OTC)', type: 'CALL', profit: 24000, timeAgo: '18s ago' },
  { id: 'win_5', traderName: 'Nguyen Van M.', flag: '🇻🇳', asset: 'GBP/USD', type: 'PUT', profit: 7500, timeAgo: '24s ago' },
  { id: 'win_6', traderName: 'Vikram Singh', flag: '🇮🇳', asset: 'Crypto IDX', type: 'CALL', profit: 8900, timeAgo: '31s ago' }
];

/**
 * Generate combined leaderboard list incorporating simulated master traders and real user's actual profit!
 */
export function getCalculatedLeaderboard(
  currentUser: {
    userId: string;
    userName?: string;
    totalProfit: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
  },
  timeframeFilter: 'today' | 'weekly' | 'monthly' | 'all' = 'today'
): { leaderboard: TraderRankingItem[]; currentUserItem: TraderRankingItem } {
  // Multipliers based on timeframe
  const multiplier = timeframeFilter === 'all' ? 4.8 : timeframeFilter === 'monthly' ? 2.6 : timeframeFilter === 'weekly' ? 1.6 : 1.0;
  
  // Clone and scale base traders
  const traders: TraderRankingItem[] = BASE_TOP_TRADERS.map((t, idx) => {
    const scaledProfit = Math.round(t.profit * multiplier);
    const scaledTotal = Math.round(t.totalTrades * multiplier);
    const scaledWins = Math.round(t.winningTrades * multiplier);
    return {
      ...t,
      rank: idx + 1,
      profit: scaledProfit,
      totalTrades: scaledTotal,
      winningTrades: scaledWins,
      copiedCount: Math.round(t.copiedCount * (timeframeFilter === 'today' ? 1 : 1.4))
    };
  });

  // Calculate current user's effective profit
  const userProfit = currentUser.totalProfit * (timeframeFilter === 'today' ? 1 : multiplier);
  const userTrades = Math.max(currentUser.totalTrades, 1);
  const userWinRate = currentUser.totalTrades > 0 ? currentUser.winRate : 75.0;

  // Determine user tier based on profit
  let userTier: TraderRankingItem['tier'] = 'Bronze Explorer';
  let userBadge: TraderRankingItem['badge'] = 'rising';
  if (userProfit >= 800000) {
    userTier = 'VIP Legend';
    userBadge = 'crown';
  } else if (userProfit >= 500000) {
    userTier = 'Diamond Master';
    userBadge = 'diamond';
  } else if (userProfit >= 250000) {
    userTier = 'Gold Pro';
    userBadge = 'star';
  } else if (userProfit >= 50000) {
    userTier = 'Silver Trader';
    userBadge = 'verified';
  }

  const currentUserItem: TraderRankingItem = {
    id: `current_user_${currentUser.userId}`,
    rank: 1, // Will be computed after sorting
    name: currentUser.userName || currentUser.userId || 'You (Master Trader)',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    avatarColor: 'from-[#0088cc] to-blue-600',
    avatarLetter: (currentUser.userId || 'ME').substring(0, 2).toUpperCase(),
    isRealUser: true,
    isCurrentUser: true,
    profit: Math.max(0, userProfit),
    winRate: userWinRate,
    totalTrades: userTrades,
    winningTrades: currentUser.winningTrades,
    favoriteAsset: 'Crypto IDX',
    tradingStyle: 'Strategic Binary Scalping',
    badge: userBadge,
    tier: userTier,
    recentTrades: ['win', 'win', 'win', 'loss', 'win'],
    trend: 'up',
    rankChange: 1,
    copiedCount: 48
  };

  // Add user to the list and sort by profit descending
  const combined = [...traders, currentUserItem].sort((a, b) => b.profit - a.profit);

  // Assign updated ranks
  const rankedList = combined.map((item, index) => ({
    ...item,
    rank: index + 1
  }));

  const myRankedItem = rankedList.find(i => i.isCurrentUser) || {
    ...currentUserItem,
    rank: rankedList.length
  };

  return {
    leaderboard: rankedList,
    currentUserItem: myRankedItem
  };
}
