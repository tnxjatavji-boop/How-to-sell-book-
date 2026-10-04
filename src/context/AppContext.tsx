import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { sounds, launchWinConfetti } from '../utils/audio';
import { pushLiveTick, getPrecision, getSynchronizedLivePrice, updateCanonicalPricesFromRemote, setGlobalChartMood } from '../utils/candleStore';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { TimezoneOption, TIMEZONE_OPTIONS, DEFAULT_TIMEZONE } from '../utils/timezone';
import { FuturesAsset, FuturesPosition } from '../types/futures';
import { INITIAL_FUTURES_ASSETS } from '../utils/futuresData';
import { preloadAllAssetLogos } from '../utils/assetImages';

export type AccountType = 'real' | 'demo';

export interface Trade {
  id: string;
  assetId: string;
  assetName: string;
  amount: number;
  type: 'CALL' | 'PUT';
  entryPrice: number;
  strikeTime: number; // timestamp
  profitMargin: number;
  status: 'active' | 'won' | 'lost' | 'tie';
  accountType: AccountType;
  exitPrice?: number;
  payout?: number;
  createdAt?: number;
  closedAt?: number;
  plannedOutcome?: 'WIN' | 'NEAR_MISS_LOSS' | 'ORGANIC_LOSS';
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  category: 'Popular' | 'Currencies' | 'Commodities' | 'Crypto' | 'Indices' | 'Stocks';
  profitMargin: number; // e.g., 0.88 for 88%
  price: number;
  change: number;
  favorite: boolean;
  high24h?: number;
  low24h?: number;
}

export interface UserStats {
  email: string;
  name?: string;
  balance: number;
  wagerTarget: number;
  wagerCurrent: number;
  referralCode: string;
  referralCount: number;
  referralBonus: number;
  hasDeposited: boolean;
  isRiskFree: boolean;
  winRate?: number;
}

interface AppContextType {
  userId: string;
  userStats: UserStats | null;
  accountType: AccountType;
  setAccountType: (type: AccountType) => void;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
  demoBalance: number;
  setDemoBalance: (balance: number | ((prev: number) => number)) => void;
  refillDemoBalance: () => void;
  currentAsset: Asset;
  setCurrentAsset: (asset: Asset) => void;
  assets: Asset[];
  toggleFavorite: (assetId: string) => void;
  trades: Trade[];
  placeTrade: (amount: number, type: 'CALL' | 'PUT', durationSeconds: number) => boolean;
  fetchBalance: () => void;
  soundEnabled: boolean;
  toggleSound: () => boolean;
  lastTradeResult: { won: boolean; isTie?: boolean; amount: number; profit: number; entryPrice?: number; closePrice?: number; assetName?: string; assetSymbol?: string; type?: 'CALL' | 'PUT'; profitMargin?: number; timestamp?: number } | null;
  dismissTradeResult: () => void;
  priceTickCount: number;
  selectedTimezone: TimezoneOption;
  setSelectedTimezone: (tz: TimezoneOption) => void;
  // 20X Futures Trading
  tradingMode: 'binary' | 'futures';
  setTradingMode: (mode: 'binary' | 'futures') => void;
  futuresAssets: FuturesAsset[];
  currentFuturesAsset: FuturesAsset;
  setCurrentFuturesAsset: (asset: FuturesAsset) => void;
  futuresPositions: FuturesPosition[];
  placeFuturesOrder: (params: { margin: number; type: 'LONG' | 'SHORT'; tpPrice?: number; slPrice?: number }) => boolean;
  closeFuturesPosition: (positionId: string) => void;
  // Fullscreen & Expanded Layout Control
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  isExpandedLayout: boolean;
  toggleExpandedLayout: () => void;
}

export function getHourlyProfitMargin(assetId: string, category: string, baseMargin?: number): number {
  // Compute current hour bucket since epoch (changes every 60 minutes)
  const currentHour = Math.floor(Date.now() / (3600 * 1000));
  const numericId = parseInt(assetId.replace(/\D/g, ''), 10) || 1;

  // Seeded pseudo-random formula that stays consistent throughout each 60-minute window
  // and dynamically rotates to a fresh realistic payout rate every single hour
  const hash = Math.abs(Math.sin(numericId * 9301 + currentHour * 49297 + 233) * 100000);
  const variance = hash - Math.floor(hash); // 0.0 to 1.0

  let minRate = 0.78;
  let maxRate = 0.89;

  if (category === 'Popular' || assetId === '1' || assetId === '3' || assetId === '4' || assetId === '5' || assetId === '180' || assetId === '183' || assetId === '187') {
    minRate = 0.86;
    maxRate = 0.91; // STRICT HARD CAP AT 91%
  } else if (category === 'Currencies') {
    minRate = 0.80;
    maxRate = 0.91; // STRICT HARD CAP AT 91%
  } else if (category === 'Crypto') {
    minRate = 0.80;
    maxRate = 0.91; // STRICT HARD CAP AT 91%
  } else if (category === 'Stocks') {
    minRate = 0.78;
    maxRate = 0.90;
  } else if (category === 'Commodities') {
    minRate = 0.80;
    maxRate = 0.91; // STRICT HARD CAP AT 91%
  } else if (category === 'Indices') {
    minRate = 0.80;
    maxRate = 0.90;
  }

  const computedRate = minRate + variance * (maxRate - minRate);
  // STRICT UPPER LIMIT: Never exceed 0.91 (91% Payout)
  return Math.min(0.91, Math.round(computedRate * 100) / 100);
}

const INITIAL_ASSETS: Asset[] = [
  // 1. Popular & High Turnover Assets (Payouts capped at 91% max)
  { id: '2', name: 'Bitcoin (Live)', symbol: 'BTC', category: 'Crypto', profitMargin: 0.90, price: 78370.0, change: -0.92, favorite: false },
  { id: '3', name: 'EUR/USD (OTC)', symbol: 'EURUSD', category: 'Currencies', profitMargin: 0.91, price: 1.16235, change: 0.01, favorite: false },
  { id: '4', name: 'Gold (OTC)', symbol: 'XAU', category: 'Commodities', profitMargin: 0.91, price: 4400.5, change: -0.66, favorite: false },
  { id: '5', name: 'USD/INR (OTC)', symbol: 'USDINR', category: 'Currencies', profitMargin: 0.91, price: 94.808, change: 0.35, favorite: false },
  { id: '6', name: 'Tesla (OTC)', symbol: 'TSLA', category: 'Stocks', profitMargin: 0.90, price: 354.08, change: -5.92, favorite: false },
  { id: '8', name: 'Meta (OTC)', symbol: 'META', category: 'Stocks', profitMargin: 0.89, price: 616.77, change: 1.00, favorite: false },

  // 2. Forex / Currencies (OTC pairs)
  { id: '9', name: 'GBP/USD (OTC)', symbol: 'GBPUSD', category: 'Currencies', profitMargin: 0.88, price: 1.3556, change: 0.11, favorite: false },
  { id: '10', name: 'USD/JPY (OTC)', symbol: 'USDJPY', category: 'Currencies', profitMargin: 0.87, price: 153.80, change: -0.34, favorite: false },
  { id: '11', name: 'AUD/USD (OTC)', symbol: 'AUDUSD', category: 'Currencies', profitMargin: 0.85, price: 0.7227, change: 0.12, favorite: false },
  { id: '12', name: 'USD/CAD (OTC)', symbol: 'USDCAD', category: 'Currencies', profitMargin: 0.86, price: 1.3725, change: 0.12, favorite: false },
  { id: '13', name: 'EUR/GBP (OTC)', symbol: 'EURGBP', category: 'Currencies', profitMargin: 0.86, price: 0.8540, change: 0.08, favorite: false },
  { id: '14', name: 'EUR/THB (OTC)', symbol: 'EURTHB', category: 'Currencies', profitMargin: 0.88, price: 37.79, change: 0.06, favorite: false },
  { id: '15', name: 'USD/BRL (OTC)', symbol: 'USDBRL', category: 'Currencies', profitMargin: 0.91, price: 5.4820, change: 0.45, favorite: false },
  { id: '16', name: 'USD/MXN (OTC)', symbol: 'USDMXN', category: 'Currencies', profitMargin: 0.84, price: 18.254, change: -0.22, favorite: false },
  { id: '17', name: 'USD/CHF (OTC)', symbol: 'USDCHF', category: 'Currencies', profitMargin: 0.83, price: 0.8950, change: -0.10, favorite: false },
  { id: '18', name: 'NZD/USD (OTC)', symbol: 'NZDUSD', category: 'Currencies', profitMargin: 0.84, price: 0.6120, change: 0.35, favorite: false },
  { id: '19', name: 'GBP/JPY (OTC)', symbol: 'GBPJPY', category: 'Currencies', profitMargin: 0.88, price: 208.52, change: -0.22, favorite: false },
  { id: '20', name: 'EUR/JPY (OTC)', symbol: 'EURJPY', category: 'Currencies', profitMargin: 0.86, price: 164.80, change: 0.15, favorite: false },
  { id: '21', name: 'AUD/JPY (OTC)', symbol: 'AUDJPY', category: 'Currencies', profitMargin: 0.85, price: 101.45, change: 0.19, favorite: false },
  { id: '22', name: 'CAD/JPY (OTC)', symbol: 'CADJPY', category: 'Currencies', profitMargin: 0.84, price: 112.35, change: -0.08, favorite: false },
  { id: '73', name: 'EUR/CHF (OTC)', symbol: 'EURCHF', category: 'Currencies', profitMargin: 0.85, price: 0.9420, change: 0.05, favorite: false },
  { id: '74', name: 'GBP/CAD (OTC)', symbol: 'GBPCAD', category: 'Currencies', profitMargin: 0.86, price: 1.7650, change: -0.12, favorite: false },
  { id: '75', name: 'AUD/CAD (OTC)', symbol: 'AUDCAD', category: 'Currencies', profitMargin: 0.84, price: 0.9030, change: 0.14, favorite: false },
  { id: '76', name: 'EUR/AUD (OTC)', symbol: 'EURAUD', category: 'Currencies', profitMargin: 0.85, price: 1.6320, change: -0.09, favorite: false },

  // 3. Cryptocurrencies (Top market coins & Memes)
  { id: '23', name: 'Ethereum', symbol: 'ETH', category: 'Crypto', profitMargin: 0.89, price: 2470.5, change: -0.78, favorite: false },
  { id: '24', name: 'Solana (Live)', symbol: 'SOL', category: 'Crypto', profitMargin: 0.91, price: 102.85, change: -0.90, favorite: false },
  { id: '25', name: 'Binance Coin', symbol: 'BNB', category: 'Crypto', profitMargin: 0.86, price: 751.20, change: 1.50, favorite: false },
  { id: '26', name: 'Ripple (Live)', symbol: 'XRP', category: 'Crypto', profitMargin: 0.90, price: 1.3995, change: 0.08, favorite: false },
  { id: '27', name: 'Dogecoin', symbol: 'DOGE', category: 'Crypto', profitMargin: 0.85, price: 0.08935, change: -1.25, favorite: false },
  { id: '28', name: 'Toncoin', symbol: 'TON', category: 'Crypto', profitMargin: 0.88, price: 6.85, change: 3.40, favorite: false },
  { id: '29', name: 'Shiba Inu (OTC)', symbol: 'SHIB', category: 'Crypto', profitMargin: 0.87, price: 0.0000185, change: 4.25, favorite: false },
  { id: '30', name: 'Polygon', symbol: 'POL', category: 'Crypto', profitMargin: 0.86, price: 0.5240, change: 1.80, favorite: false },
  { id: '31', name: 'Chainlink', symbol: 'LINK', category: 'Crypto', profitMargin: 0.85, price: 12.45, change: 2.30, favorite: false },
  { id: '32', name: 'Litecoin', symbol: 'LTC', category: 'Crypto', profitMargin: 0.84, price: 74.20, change: 0.65, favorite: false },
  { id: '33', name: 'Polkadot', symbol: 'DOT', category: 'Crypto', profitMargin: 0.83, price: 5.15, change: -0.40, favorite: false },
  { id: '34', name: 'TRON (Live)', symbol: 'TRX', category: 'Crypto', profitMargin: 0.87, price: 0.1620, change: 1.15, favorite: false },
  { id: '35', name: 'Cardano', symbol: 'ADA', category: 'Crypto', profitMargin: 0.84, price: 0.2187, change: -0.80, favorite: false },
  { id: '36', name: 'Avalanche', symbol: 'AVAX', category: 'Crypto', profitMargin: 0.86, price: 28.90, change: 2.70, favorite: false },
  { id: '37', name: 'Pepe (OTC)', symbol: 'PEPE', category: 'Crypto', profitMargin: 0.88, price: 0.0000098, change: 6.50, favorite: false },
  { id: '77', name: 'NEAR Protocol', symbol: 'NEAR', category: 'Crypto', profitMargin: 0.87, price: 5.42, change: 3.10, favorite: false },
  { id: '78', name: 'Sui Network', symbol: 'SUI', category: 'Crypto', profitMargin: 0.88, price: 2.18, change: 4.60, favorite: false },
  { id: '79', name: 'Aptos', symbol: 'APT', category: 'Crypto', profitMargin: 0.86, price: 9.85, change: 2.40, favorite: false },
  { id: '80', name: 'Render Network', symbol: 'RENDER', category: 'Crypto', profitMargin: 0.87, price: 6.45, change: 5.20, favorite: false },
  { id: '81', name: 'Uniswap', symbol: 'UNI', category: 'Crypto', profitMargin: 0.85, price: 8.90, change: 1.50, favorite: false },
  { id: '82', name: 'Cosmos', symbol: 'ATOM', category: 'Crypto', profitMargin: 0.84, price: 6.75, change: -0.80, favorite: false },
  { id: '83', name: 'Arbitrum', symbol: 'ARB', category: 'Crypto', profitMargin: 0.85, price: 0.85, change: 1.90, favorite: false },
  { id: '84', name: 'Injective', symbol: 'INJ', category: 'Crypto', profitMargin: 0.87, price: 22.40, change: 3.80, favorite: false },

  // 4. Global Stocks
  { id: '38', name: 'Apple (OTC)', symbol: 'AAPL', category: 'Stocks', profitMargin: 0.90, price: 317.79, change: -0.23, favorite: false },
  { id: '39', name: 'Nvidia (OTC)', symbol: 'NVDA', category: 'Stocks', profitMargin: 0.91, price: 128.45, change: 3.80, favorite: false },
  { id: '40', name: 'Microsoft (OTC)', symbol: 'MSFT', category: 'Stocks', profitMargin: 0.88, price: 448.20, change: 0.45, favorite: false },
  { id: '41', name: 'Amazon (OTC)', symbol: 'AMZN', category: 'Stocks', profitMargin: 0.89, price: 186.75, change: 1.20, favorite: false },
  { id: '42', name: 'Alphabet / Google', symbol: 'GOOGL', category: 'Stocks', profitMargin: 0.87, price: 179.30, change: -0.30, favorite: false },
  { id: '43', name: 'AMD (OTC)', symbol: 'AMD', category: 'Stocks', profitMargin: 0.89, price: 154.60, change: 2.80, favorite: false },
  { id: '44', name: 'Intel (OTC)', symbol: 'INTC', category: 'Stocks', profitMargin: 0.85, price: 24.15, change: -1.10, favorite: false },
  { id: '45', name: 'Alibaba (OTC)', symbol: 'BABA', category: 'Stocks', profitMargin: 0.87, price: 84.30, change: 1.95, favorite: false },
  { id: '46', name: 'Coca-Cola (OTC)', symbol: 'KO', category: 'Stocks', profitMargin: 0.86, price: 68.40, change: 0.35, favorite: false },
  { id: '47', name: 'Walt Disney (OTC)', symbol: 'DIS', category: 'Stocks', profitMargin: 0.86, price: 96.20, change: 0.80, favorite: false },
  { id: '48', name: 'Visa (OTC)', symbol: 'V', category: 'Stocks', profitMargin: 0.88, price: 278.50, change: 0.40, favorite: false },
  { id: '49', name: 'Mastercard (OTC)', symbol: 'MA', category: 'Stocks', profitMargin: 0.87, price: 462.80, change: 0.55, favorite: false },
  { id: '50', name: 'Netflix (OTC)', symbol: 'NFLX', category: 'Stocks', profitMargin: 0.87, price: 672.10, change: 1.85, favorite: false },
  { id: '51', name: 'Baidu ADR (OTC)', symbol: 'BIDU', category: 'Stocks', profitMargin: 0.85, price: 108.26, change: -1.84, favorite: false },
  { id: '85', name: 'Taiwan Semi (TSMC)', symbol: 'TSM', category: 'Stocks', profitMargin: 0.90, price: 198.50, change: 2.40, favorite: false },
  { id: '86', name: 'Berkshire Hathaway', symbol: 'BRK', category: 'Stocks', profitMargin: 0.86, price: 462.10, change: 0.30, favorite: false },
  { id: '87', name: 'JPMorgan Chase', symbol: 'JPM', category: 'Stocks', profitMargin: 0.87, price: 224.30, change: 0.65, favorite: false },
  { id: '88', name: 'Walmart Inc.', symbol: 'WMT', category: 'Stocks', profitMargin: 0.86, price: 82.40, change: 0.40, favorite: false },
  { id: '89', name: 'Oracle (OTC)', symbol: 'ORCL', category: 'Stocks', profitMargin: 0.88, price: 172.90, change: 1.75, favorite: false },
  { id: '90', name: 'Broadcom (OTC)', symbol: 'AVGO', category: 'Stocks', profitMargin: 0.89, price: 178.60, change: 2.10, favorite: false },
  { id: '91', name: 'Eli Lilly (OTC)', symbol: 'LLY', category: 'Stocks', profitMargin: 0.88, price: 945.20, change: 1.25, favorite: false },
  { id: '92', name: 'Exxon Mobil', symbol: 'XOM', category: 'Stocks', profitMargin: 0.85, price: 118.40, change: -0.45, favorite: false },
  { id: '93', name: 'Costco Wholesale', symbol: 'COST', category: 'Stocks', profitMargin: 0.87, price: 912.80, change: 0.85, favorite: false },
  { id: '94', name: 'Nike (OTC)', symbol: 'NKE', category: 'Stocks', profitMargin: 0.86, price: 86.50, change: 0.95, favorite: false },
  { id: '95', name: 'Adobe Inc.', symbol: 'ADBE', category: 'Stocks', profitMargin: 0.88, price: 532.70, change: 1.40, favorite: false },
  { id: '96', name: 'Palantir (OTC)', symbol: 'PLTR', category: 'Stocks', profitMargin: 0.91, price: 42.80, change: 4.60, favorite: false },
  { id: '97', name: 'Coinbase Global', symbol: 'COIN', category: 'Stocks', profitMargin: 0.90, price: 218.40, change: 3.90, favorite: false },
  { id: '98', name: 'Spotify (OTC)', symbol: 'SPOT', category: 'Stocks', profitMargin: 0.87, price: 375.60, change: 1.60, favorite: false },
  { id: '99', name: 'Uber Technologies', symbol: 'UBER', category: 'Stocks', profitMargin: 0.88, price: 74.30, change: 1.30, favorite: false },

  // 5. Commodities & Precious Metals
  { id: '57', name: 'Silver (OTC)', symbol: 'XAG', category: 'Commodities', profitMargin: 0.88, price: 29.45, change: 1.10, favorite: false },
  { id: '58', name: 'Platinum (OTC)', symbol: 'XPT', category: 'Commodities', profitMargin: 0.86, price: 955.40, change: 0.65, favorite: false },
  { id: '59', name: 'Palladium (OTC)', symbol: 'XPD', category: 'Commodities', profitMargin: 0.85, price: 980.20, change: -0.40, favorite: false },
  { id: '60', name: 'Crude Oil Brent', symbol: 'BRENT', category: 'Commodities', profitMargin: 0.88, price: 84.60, change: -0.75, favorite: false },
  { id: '61', name: 'Crude Oil WTI', symbol: 'WTI', category: 'Commodities', profitMargin: 0.86, price: 80.25, change: -0.60, favorite: false },
  { id: '62', name: 'Natural Gas', symbol: 'NG', category: 'Commodities', profitMargin: 0.83, price: 2.15, change: 1.80, favorite: false },
  { id: '63', name: 'Copper (Live)', symbol: 'HG', category: 'Commodities', profitMargin: 0.84, price: 4.45, change: 0.50, favorite: false },
  { id: '100', name: 'Gold in EUR (OTC)', symbol: 'XAUEUR', category: 'Commodities', profitMargin: 0.89, price: 2150.80, change: 0.35, favorite: false },
  { id: '101', name: 'Silver in EUR (OTC)', symbol: 'XAGEUR', category: 'Commodities', profitMargin: 0.87, price: 27.15, change: 0.80, favorite: false },

  // 6. Global Indices & Market Benchmarks
  { id: '64', name: 'NASDAQ 100', symbol: 'NDX', category: 'Indices', profitMargin: 0.89, price: 19850.0, change: 0.95, favorite: false },
  { id: '65', name: 'S&P 500', symbol: 'SPX', category: 'Indices', profitMargin: 0.88, price: 5540.2, change: 0.40, favorite: false },
  { id: '66', name: 'Dow Jones 30', symbol: 'DJI', category: 'Indices', profitMargin: 0.87, price: 40280.0, change: 0.25, favorite: false },
  { id: '69', name: 'DAX 40 Germany', symbol: 'GER40', category: 'Indices', profitMargin: 0.86, price: 18650.0, change: 0.15, favorite: false },
  { id: '70', name: 'FTSE 100 UK', symbol: 'UK100', category: 'Indices', profitMargin: 0.85, price: 8240.0, change: -0.10, favorite: false },
  { id: '71', name: 'Nikkei 225 Japan', symbol: 'JP225', category: 'Indices', profitMargin: 0.87, price: 38250.0, change: 0.60, favorite: false },
  { id: '72', name: 'Hang Seng (OTC)', symbol: 'HSI', category: 'Indices', profitMargin: 0.88, price: 17650.0, change: -0.35, favorite: false },
  { id: '102', name: 'CAC 40 France', symbol: 'CAC40', category: 'Indices', profitMargin: 0.86, price: 7540.0, change: 0.20, favorite: false },
  { id: '103', name: 'Euro Stoxx 50', symbol: 'SX5E', category: 'Indices', profitMargin: 0.87, price: 4920.0, change: 0.15, favorite: false },
  { id: '104', name: 'ASX 200 Australia', symbol: 'ASX200', category: 'Indices', profitMargin: 0.85, price: 8120.0, change: 0.30, favorite: false },
  { id: '105', name: 'IBEX 35 Spain', symbol: 'IBEX35', category: 'Indices', profitMargin: 0.86, price: 11650.0, change: -0.10, favorite: false }
  // 7. Added 50+ New Assets
  , { id: '106', name: 'Nifty 50 (OTC)', symbol: 'NIFTY50', category: 'Indices', profitMargin: 0.88, price: 24500.0, change: 0.45, favorite: false }
  , { id: '107', name: 'Bank Nifty (OTC)', symbol: 'BANKNIFTY', category: 'Indices', profitMargin: 0.89, price: 51200.0, change: 0.60, favorite: false }
  , { id: '108', name: 'Sensex (OTC)', symbol: 'SENSEX', category: 'Indices', profitMargin: 0.87, price: 80500.0, change: 0.40, favorite: false }
  , { id: '109', name: 'VIX Volatility', symbol: 'VIX', category: 'Indices', profitMargin: 0.84, price: 14.50, change: -2.10, favorite: false }
  , { id: '110', name: 'Russell 2000', symbol: 'RUT', category: 'Indices', profitMargin: 0.86, price: 2150.0, change: 1.15, favorite: false }
  
  , { id: '111', name: 'PepsiCo (OTC)', symbol: 'PEP', category: 'Stocks', profitMargin: 0.86, price: 165.20, change: -0.15, favorite: false }
  , { id: '112', name: 'McDonald\'s (OTC)', symbol: 'MCD', category: 'Stocks', profitMargin: 0.87, price: 280.40, change: 0.25, favorite: false }
  , { id: '113', name: 'Salesforce (OTC)', symbol: 'CRM', category: 'Stocks', profitMargin: 0.88, price: 260.15, change: 1.40, favorite: false }
  , { id: '114', name: 'Chevron (OTC)', symbol: 'CVX', category: 'Stocks', profitMargin: 0.85, price: 158.30, change: -0.45, favorite: false }
  , { id: '115', name: 'Bank of America (OTC)', symbol: 'BAC', category: 'Stocks', profitMargin: 0.86, price: 39.50, change: 0.80, favorite: false }
  , { id: '116', name: 'Home Depot (OTC)', symbol: 'HD', category: 'Stocks', profitMargin: 0.87, price: 345.60, change: 0.55, favorite: false }
  , { id: '117', name: 'Johnson & Johnson', symbol: 'JNJ', category: 'Stocks', profitMargin: 0.85, price: 148.90, change: 0.10, favorite: false }
  , { id: '118', name: 'Procter & Gamble', symbol: 'PG', category: 'Stocks', profitMargin: 0.86, price: 162.30, change: 0.20, favorite: false }
  , { id: '119', name: 'Cisco (OTC)', symbol: 'CSCO', category: 'Stocks', profitMargin: 0.85, price: 48.20, change: -0.30, favorite: false }
  , { id: '120', name: 'Verizon (OTC)', symbol: 'VZ', category: 'Stocks', profitMargin: 0.84, price: 41.50, change: 0.60, favorite: false }
  , { id: '121', name: 'AT&T (OTC)', symbol: 'T', category: 'Stocks', profitMargin: 0.84, price: 18.20, change: 0.40, favorite: false }
  , { id: '122', name: 'Pfizer (OTC)', symbol: 'PFE', category: 'Stocks', profitMargin: 0.85, price: 28.40, change: -0.15, favorite: false }
  , { id: '123', name: 'Boeing (OTC)', symbol: 'BA', category: 'Stocks', profitMargin: 0.87, price: 185.60, change: 1.20, favorite: false }
  , { id: '124', name: 'Qualcomm (OTC)', symbol: 'QCOM', category: 'Stocks', profitMargin: 0.89, price: 205.40, change: 2.10, favorite: false }
  , { id: '125', name: 'ARM Holdings (OTC)', symbol: 'ARM', category: 'Stocks', profitMargin: 0.90, price: 145.80, change: 3.50, favorite: false }
  , { id: '126', name: 'Super Micro (OTC)', symbol: 'SMCI', category: 'Stocks', profitMargin: 0.91, price: 890.50, change: 4.80, favorite: false }
  , { id: '127', name: 'Moderna (OTC)', symbol: 'MRNA', category: 'Stocks', profitMargin: 0.88, price: 124.30, change: -1.40, favorite: false }
  , { id: '128', name: 'Airbnb (OTC)', symbol: 'ABNB', category: 'Stocks', profitMargin: 0.87, price: 156.20, change: 1.10, favorite: false }
  , { id: '129', name: 'Shopify (OTC)', symbol: 'SHOP', category: 'Stocks', profitMargin: 0.88, price: 72.40, change: 2.30, favorite: false }
  , { id: '130', name: 'Square (OTC)', symbol: 'SQ', category: 'Stocks', profitMargin: 0.87, price: 68.90, change: 1.80, favorite: false }
  , { id: '131', name: 'PayPal (OTC)', symbol: 'PYPL', category: 'Stocks', profitMargin: 0.86, price: 64.50, change: 0.70, favorite: false }
  
  , { id: '132', name: 'Stellar', symbol: 'XLM', category: 'Crypto', profitMargin: 0.84, price: 0.1050, change: 1.20, favorite: false }
  , { id: '133', name: 'Internet Computer', symbol: 'ICP', category: 'Crypto', profitMargin: 0.85, price: 9.40, change: -0.80, favorite: false }
  , { id: '134', name: 'Filecoin', symbol: 'FIL', category: 'Crypto', profitMargin: 0.84, price: 4.50, change: 0.40, favorite: false }
  , { id: '135', name: 'VeChain', symbol: 'VET', category: 'Crypto', profitMargin: 0.83, price: 0.0340, change: 1.10, favorite: false }
  , { id: '136', name: 'Monero', symbol: 'XMR', category: 'Crypto', profitMargin: 0.86, price: 165.20, change: 0.50, favorite: false }
  , { id: '137', name: 'Aave', symbol: 'AAVE', category: 'Crypto', profitMargin: 0.87, price: 102.40, change: 2.50, favorite: false }
  , { id: '138', name: 'Algorand', symbol: 'ALGO', category: 'Crypto', profitMargin: 0.84, price: 0.1520, change: -0.30, favorite: false }
  , { id: '139', name: 'Theta Network', symbol: 'THETA', category: 'Crypto', profitMargin: 0.85, price: 1.65, change: 1.80, favorite: false }
  , { id: '140', name: 'Elrond (MultiversX)', symbol: 'EGLD', category: 'Crypto', profitMargin: 0.86, price: 34.20, change: 0.90, favorite: false }
  , { id: '141', name: 'The Sandbox', symbol: 'SAND', category: 'Crypto', profitMargin: 0.85, price: 0.3540, change: -1.20, favorite: false }
  , { id: '142', name: 'Decentraland', symbol: 'MANA', category: 'Crypto', profitMargin: 0.84, price: 0.3420, change: 0.40, favorite: false }
  , { id: '143', name: 'Axie Infinity', symbol: 'AXS', category: 'Crypto', profitMargin: 0.85, price: 6.20, change: 2.10, favorite: false }
  , { id: '144', name: 'Gala', symbol: 'GALA', category: 'Crypto', profitMargin: 0.84, price: 0.0280, change: 1.50, favorite: false }
  , { id: '145', name: 'Quant', symbol: 'QNT', category: 'Crypto', profitMargin: 0.87, price: 82.40, change: -0.60, favorite: false }
  , { id: '146', name: 'Fantom', symbol: 'FTM', category: 'Crypto', profitMargin: 0.86, price: 0.5420, change: 3.20, favorite: false }
  , { id: '147', name: 'Helium', symbol: 'HNT', category: 'Crypto', profitMargin: 0.85, price: 4.80, change: 0.80, favorite: false }
  , { id: '148', name: 'Maker', symbol: 'MKR', category: 'Crypto', profitMargin: 0.88, price: 2840.0, change: 1.40, favorite: false }
  , { id: '149', name: 'Stacks', symbol: 'STX', category: 'Crypto', profitMargin: 0.87, price: 1.85, change: 4.10, favorite: false }

  , { id: '150', name: 'Aluminum (OTC)', symbol: 'ALU', category: 'Commodities', profitMargin: 0.84, price: 2450.0, change: -0.30, favorite: false }
  , { id: '151', name: 'Zinc (OTC)', symbol: 'ZNC', category: 'Commodities', profitMargin: 0.83, price: 2850.0, change: 0.20, favorite: false }
  , { id: '152', name: 'Nickel (OTC)', symbol: 'NIC', category: 'Commodities', profitMargin: 0.85, price: 18200.0, change: 1.10, favorite: false }
  , { id: '153', name: 'Cocoa (OTC)', symbol: 'COCOA', category: 'Commodities', profitMargin: 0.89, price: 9240.0, change: -1.50, favorite: false }
  , { id: '154', name: 'Coffee (OTC)', symbol: 'COFFEE', category: 'Commodities', profitMargin: 0.86, price: 235.40, change: 2.30, favorite: false }
  , { id: '155', name: 'Wheat (OTC)', symbol: 'WHEAT', category: 'Commodities', profitMargin: 0.84, price: 580.20, change: 0.80, favorite: false }

  , { id: '156', name: 'GBP/CHF (OTC)', symbol: 'GBPCHF', category: 'Currencies', profitMargin: 0.86, price: 1.1420, change: 0.15, favorite: false }
  , { id: '157', name: 'AUD/NZD (OTC)', symbol: 'AUDNZD', category: 'Currencies', profitMargin: 0.84, price: 1.0840, change: -0.10, favorite: false }
  , { id: '158', name: 'NZD/JPY (OTC)', symbol: 'NZDJPY', category: 'Currencies', profitMargin: 0.85, price: 94.20, change: 0.25, favorite: false }
  , { id: '159', name: 'CHF/JPY (OTC)', symbol: 'CHFJPY', category: 'Currencies', profitMargin: 0.87, price: 172.40, change: -0.30, favorite: false }
  , { id: '160', name: 'CAD/CHF (OTC)', symbol: 'CADCHF', category: 'Currencies', profitMargin: 0.85, price: 0.6520, change: 0.05, favorite: false }
  , { id: '161', name: 'USD/NOK (OTC)', symbol: 'USDNOK', category: 'Currencies', profitMargin: 0.83, price: 10.65, change: 0.20, favorite: false }
  , { id: '162', name: 'USD/SGD (OTC)', symbol: 'USDSGD', category: 'Currencies', profitMargin: 0.84, price: 1.3250, change: 0.05, favorite: false }
  , { id: '163', name: 'NZD/CHF (OTC)', symbol: 'NZDCHF', category: 'Currencies', profitMargin: 0.84, price: 0.5480, change: -0.15, favorite: false }

  // Real Global Assets & Benchmarks
  , { id: '164', name: 'KOSPI 200 Index', symbol: 'KOSPI', category: 'Indices', profitMargin: 0.86, price: 365.40, change: 1.25, favorite: false }
  , { id: '165', name: 'HDFC Bank (OTC)', symbol: 'HDFCBANK', category: 'Stocks', profitMargin: 0.89, price: 1650.20, change: 0.85, favorite: false }
  , { id: '166', name: 'Reliance Ind (OTC)', symbol: 'RELIANCE', category: 'Stocks', profitMargin: 0.90, price: 2980.50, change: -0.45, favorite: false }
  , { id: '167', name: 'Tata Motors (OTC)', symbol: 'TATAMOTORS', category: 'Stocks', profitMargin: 0.89, price: 985.40, change: 2.10, favorite: false }
  , { id: '168', name: 'Sony Group (OTC)', symbol: 'SONY', category: 'Stocks', profitMargin: 0.88, price: 92.60, change: -1.15, favorite: false }
  , { id: '169', name: 'US Dollar Index', symbol: 'DXY', category: 'Indices', profitMargin: 0.87, price: 104.35, change: 0.15, favorite: false }
  , { id: '170', name: 'ETF MSCI Brazil 2x', symbol: 'BRZU', category: 'Indices', profitMargin: 0.82, price: 45.20, change: 2.80, favorite: false }
  , { id: '171', name: 'ETF NASDAQ Reversal 2x', symbol: 'QID', category: 'Indices', profitMargin: 0.82, price: 12.80, change: -1.40, favorite: false }
  , { id: '172', name: 'ETF S&P500 Volatility 1.5x', symbol: 'UVXY', category: 'Indices', profitMargin: 0.82, price: 18.50, change: 3.20, favorite: false }
  , { id: '173', name: 'ETF U.S. Real Estate', symbol: 'IYR', category: 'Indices', profitMargin: 0.82, price: 98.40, change: 0.40, favorite: false }
  , { id: '174', name: 'SPDR S&P 500 ETF Trust', symbol: 'SPY', category: 'Indices', profitMargin: 0.85, price: 560.20, change: 0.50, favorite: false }
  , { id: '175', name: 'Starbucks (OTC)', symbol: 'SBUX', category: 'Stocks', profitMargin: 0.86, price: 92.40, change: 0.65, favorite: false }
  , { id: '176', name: 'BMW (OTC)', symbol: 'BMW', category: 'Stocks', profitMargin: 0.86, price: 88.50, change: 1.10, favorite: false }

  // High-Yield Digital OTC Assets (Capped at 91% maximum payout)
  , { id: '177', name: 'EUR/USD (OTC)', symbol: 'EURUSD_OTC', category: 'Currencies', profitMargin: 0.91, price: 1.0845, change: 0.35, favorite: true }
  , { id: '178', name: 'GBP/USD (OTC)', symbol: 'GBPUSD_OTC', category: 'Currencies', profitMargin: 0.90, price: 1.2980, change: -0.22, favorite: true }
  , { id: '179', name: 'USD/JPY (OTC)', symbol: 'USDJPY_OTC', category: 'Currencies', profitMargin: 0.89, price: 153.40, change: 0.45, favorite: true }
  , { id: '180', name: 'USD/INR (OTC)', symbol: 'USDINR_OTC', category: 'Currencies', profitMargin: 0.91, price: 84.15, change: 0.12, favorite: true }
  , { id: '181', name: 'GBP/JPY (OTC)', symbol: 'GBPJPY_OTC', category: 'Currencies', profitMargin: 0.89, price: 198.80, change: 0.65, favorite: false }
  , { id: '182', name: 'AUD/CAD (OTC)', symbol: 'AUDCAD_OTC', category: 'Currencies', profitMargin: 0.88, price: 0.9120, change: -0.18, favorite: false }
  , { id: '183', name: 'Bitcoin (OTC)', symbol: 'BTC_OTC', category: 'Crypto', profitMargin: 0.91, price: 68450.00, change: 2.45, favorite: true }
  , { id: '184', name: 'Ethereum (OTC)', symbol: 'ETH_OTC', category: 'Crypto', profitMargin: 0.90, price: 2640.50, change: 1.85, favorite: true }
  , { id: '185', name: 'Solana (OTC)', symbol: 'SOL_OTC', category: 'Crypto', profitMargin: 0.89, price: 178.60, change: 4.20, favorite: true }
  , { id: '186', name: 'Ripple (OTC)', symbol: 'XRP_OTC', category: 'Crypto', profitMargin: 0.88, price: 0.5480, change: 1.15, favorite: false }
  , { id: '187', name: 'Gold (OTC)', symbol: 'XAU_OTC', category: 'Commodities', profitMargin: 0.91, price: 2735.40, change: 0.85, favorite: true }
  , { id: '188', name: 'Silver (OTC)', symbol: 'XAG_OTC', category: 'Commodities', profitMargin: 0.89, price: 33.80, change: 1.40, favorite: false }
  , { id: '189', name: 'Brent Crude (OTC)', symbol: 'BRENT_OTC', category: 'Commodities', profitMargin: 0.88, price: 74.50, change: -0.65, favorite: false }
  , { id: '190', name: 'NVIDIA (OTC)', symbol: 'NVDA_OTC', category: 'Stocks', profitMargin: 0.91, price: 138.25, change: 3.10, favorite: true }
  , { id: '191', name: 'Apple (OTC)', symbol: 'AAPL_OTC', category: 'Stocks', profitMargin: 0.90, price: 231.40, change: 0.75, favorite: true }
  , { id: '192', name: 'Tesla (OTC)', symbol: 'TSLA_OTC', category: 'Stocks', profitMargin: 0.91, price: 252.80, change: 4.80, favorite: true }
  , { id: '193', name: 'Microsoft (OTC)', symbol: 'MSFT_OTC', category: 'Stocks', profitMargin: 0.89, price: 428.60, change: 0.95, favorite: false }
  , { id: '194', name: 'Amazon (OTC)', symbol: 'AMZN_OTC', category: 'Stocks', profitMargin: 0.90, price: 186.40, change: 1.20, favorite: false }
  , { id: '195', name: 'S&P 500 (OTC)', symbol: 'SPX_OTC', category: 'Indices', profitMargin: 0.90, price: 5820.00, change: 0.65, favorite: true }
  , { id: '196', name: 'NASDAQ 100 (OTC)', symbol: 'NDX_OTC', category: 'Indices', profitMargin: 0.91, price: 20340.00, change: 1.10, favorite: true }
];


const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode; userId: string }> = ({ children, userId }) => {
  // Always default to Real (Live) Account upon opening
  const [accountType, setAccountType] = useState<AccountType>('real');
  const [realBalance, setRealBalance] = useState(0);
  const [demoBalance, setDemoBalanceState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tradexora_demo_balance');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {}
    return 10000;
  });

  const setDemoBalance = useCallback((valOrFn: number | ((prev: number) => number)) => {
    setDemoBalanceState(prev => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      const rounded = Math.round(next * 100) / 100;
      try {
        localStorage.setItem('tradexora_demo_balance', String(rounded));
      } catch (e) {}
      return rounded;
    });
  }, []);

  const refillDemoBalance = useCallback(() => {
    setDemoBalance(10000);
    try {
      sounds.playWin();
    } catch (e) {}
  }, [setDemoBalance]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // UTC Timezone State
  const [selectedTimezone, setSelectedTimezoneState] = useState<TimezoneOption>(() => {
    try {
      const saved = localStorage.getItem('tradexora_timezone');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = TIMEZONE_OPTIONS.find(t => t.id === parsed.id || t.utcLabel === parsed.utcLabel);
        if (match) return match;
      }
    } catch (e) {}
    return DEFAULT_TIMEZONE;
  });

  const setSelectedTimezone = (tz: TimezoneOption) => {
    setSelectedTimezoneState(tz);
    try {
      localStorage.setItem('tradexora_timezone', JSON.stringify(tz));
    } catch (e) {}
  };
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const savedFavs = localStorage.getItem('tradexora_user_favorites');
      const favIds: string[] = savedFavs ? JSON.parse(savedFavs) : [];
      return INITIAL_ASSETS.map(a => ({
        ...a,
        profitMargin: getHourlyProfitMargin(a.id, a.category, a.profitMargin),
        favorite: favIds.includes(a.id)
      })).sort((a, b) => b.profitMargin - a.profitMargin);
    } catch (e) {
      return INITIAL_ASSETS.map(a => ({
        ...a,
        profitMargin: getHourlyProfitMargin(a.id, a.category, a.profitMargin),
        favorite: false
      })).sort((a, b) => b.profitMargin - a.profitMargin);
    }
  });
  const [currentAsset, setCurrentAsset] = useState<Asset>(() => {
    const first = INITIAL_ASSETS[0];
    return {
      ...first,
      profitMargin: getHourlyProfitMargin(first.id, first.category, first.profitMargin)
    };
  });
  
  // --- 20X FUTURES TRADING STATE ---
  const [tradingMode, setTradingModeState] = useState<'binary' | 'futures'>(() => {
    try {
      return (localStorage.getItem('tradexora_trading_mode') as 'binary' | 'futures') || 'binary';
    } catch {
      return 'binary';
    }
  });

  const setTradingMode = (mode: 'binary' | 'futures') => {
    setTradingModeState(mode);
    try {
      localStorage.setItem('tradexora_trading_mode', mode);
    } catch {}
  };

  const [futuresAssets, setFuturesAssets] = useState<FuturesAsset[]>(INITIAL_FUTURES_ASSETS);
  const [currentFuturesAsset, setCurrentFuturesAsset] = useState<FuturesAsset>(INITIAL_FUTURES_ASSETS[0]);

  const [futuresPositions, setFuturesPositions] = useState<FuturesPosition[]>(() => {
    try {
      const stored = localStorage.getItem(`tradexora_futures_${userId || 'guest'}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to load futures positions:", e);
    }
    return [];
  });

  // Persistent Trade History Initialization from LocalStorage
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const stored = localStorage.getItem(`tradexora_trades_${userId || 'guest'}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load stored trades:", e);
    }
    return [];
  });

  // Fullscreen & Expanded Layout State
  const [isFullScreen, setIsFullScreen] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return !!document.fullscreenElement;
    }
    return false;
  });

  const [isExpandedLayout, setIsExpandedLayout] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tradexora_expanded_layout') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullScreen = async () => {
    try {
      if (typeof document === 'undefined') return;
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
        setIsFullScreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullScreen(false);
      }
    } catch (e) {
      console.warn("Native fullscreen unavailable or blocked by iframe, activating expanded terminal layout:", e);
      // Fallback: If native fullscreen is blocked by an iframe sandbox, toggle expanded layout
      setIsExpandedLayout(prev => {
        const next = !prev;
        try { localStorage.setItem('tradexora_expanded_layout', String(next)); } catch {}
        return next;
      });
    }
  };

  const toggleExpandedLayout = () => {
    setIsExpandedLayout(prev => {
      const next = !prev;
      try { localStorage.setItem('tradexora_expanded_layout', String(next)); } catch {}
      return next;
    });
  };

  // Automatic Demo Balance Refill: When demo balance is fully lost / depleted (<= 0) and all active demo trades finish, automatically refill to ₹10,000!
  useEffect(() => {
    if (demoBalance <= 0) {
      const activeDemoTrades = trades.filter(t => t.status === 'active' && t.accountType === 'demo');
      if (activeDemoTrades.length === 0) {
        const timer = setTimeout(() => {
          setDemoBalance(10000);
          try {
            sounds.playWin();
          } catch (e) {}
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [demoBalance, trades, setDemoBalance]);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(sounds.isEnabled());
  const [lastTradeResult, setLastTradeResult] = useState<{ won: boolean; isTie?: boolean; amount: number; profit: number; entryPrice?: number; closePrice?: number; assetName?: string; assetSymbol?: string; type?: 'CALL' | 'PUT'; profitMargin?: number; timestamp?: number } | null>(null);
  const [priceTickCount, setPriceTickCount] = useState(0);

  const assetsRef = useRef(assets);
  assetsRef.current = assets;
  const currentAssetRef = useRef(currentAsset);
  currentAssetRef.current = currentAsset;
  const tradesRef = useRef(trades);
  tradesRef.current = trades;
  const userStatsRef = useRef(userStats);
  userStatsRef.current = userStats;
  const masterAccountRef = useRef<{ email: string; enabled: boolean } | null>(null);
  const marketOverridesRef = useRef<Record<string, { direction: string; remainingSeconds: number }>>({});
  const autoProfitWinRateRef = useRef<number>(0.50);
  const autoProfitModeRef = useRef<string>('PSYCHOLOGY');
  const psychologySettingsRef = useRef({
    antiStreakEnabled: true,
    honeymoonBoostEnabled: true,
    nearMissRealismEnabled: true,
    smartBetSizingEnabled: true
  });
  const platformSafetyRef = useRef({
    platformNetProfit: 0,
    currentMargin: 25,
    isProfit: true,
    isDeficitRisk: false,
    hardStopPlatformDeficit: true,
    martingaleSurgeProtection: true,
    whaleBetThreshold: 500,
    sessionProfitCapMultiplier: 2.5
  });

  // Preload and decode all crisp asset images into memory cache on app startup
  useEffect(() => {
    preloadAllAssetLogos();
  }, []);

  // Real-time Market Overrides Synchronizer (every 1.2s for instantaneous global chart sync)
  useEffect(() => {
    const syncMarket = async () => {
      try {
        const res = await fetch('/api/market_status');
        const data = await res.json();
        if (data && data.activeOverrides) {
          marketOverridesRef.current = data.activeOverrides;
        }
        if (data && data.canonicalPrices) {
          updateCanonicalPricesFromRemote(data.canonicalPrices);
        }
        if (data && data.globalMood) {
          setGlobalChartMood(data.globalMood);
        }
        if (data && typeof data.autoProfitWinRate === 'number') {
          autoProfitWinRateRef.current = data.autoProfitWinRate;
        }
        if (data && data.autoProfitMode) {
          autoProfitModeRef.current = data.autoProfitMode;
        }
        if (data && data.psychologySettings) {
          psychologySettingsRef.current = data.psychologySettings;
        }
        if (data && data.masterAccount) {
          masterAccountRef.current = data.masterAccount;
        }
        if (data) {
          platformSafetyRef.current = {
            platformNetProfit: data.platformNetProfit ?? 0,
            currentMargin: data.currentMargin ?? 25,
            isProfit: data.isProfit ?? true,
            isDeficitRisk: !!data.isDeficitRisk,
            hardStopPlatformDeficit: data.houseLossDefense?.hardStopPlatformDeficit ?? true,
            martingaleSurgeProtection: data.houseLossDefense?.martingaleSurgeProtection ?? true,
            whaleBetThreshold: data.houseLossDefense?.whaleBetThreshold ?? 500,
            sessionProfitCapMultiplier: data.houseLossDefense?.sessionProfitCapMultiplier ?? 2.5
          };
        }
      } catch (e) {
        // quiet fallback
      }
    };
    syncMarket();
    const poll = setInterval(syncMarket, 1200);
    return () => clearInterval(poll);
  }, []);

  // Persist trades to LocalStorage whenever trades state updates
  useEffect(() => {
    if (!userId) return;
    try {
      localStorage.setItem(`tradexora_trades_${userId}`, JSON.stringify(trades));
    } catch (e) {
      console.warn("Failed to persist trades:", e);
    }
  }, [trades, userId]);

  // Persist futures positions to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`tradexora_futures_${userId || 'guest'}`, JSON.stringify(futuresPositions));
    } catch (e) {
      console.warn("Failed to persist futures positions:", e);
    }
  }, [futuresPositions, userId]);

  // Load futures positions when switching userId
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`tradexora_futures_${userId || 'guest'}`);
      if (stored) {
        setFuturesPositions(JSON.parse(stored));
      }
    } catch (e) {}
  }, [userId]);

  // Real-time Futures Prices Polling (Synchronized with TradingView Scanners & Live Market Feeds)
  useEffect(() => {
    let isMounted = true;

    // Helper to fetch live quotes from backend service safely without CORS failures
    const fetchRealTimePrices = async (): Promise<Record<string, { price: number; change24h?: number }>> => {
      try {
        const res = await fetch('/api/market-prices', { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.prices && Object.keys(json.prices).length > 0) {
            return json.prices;
          }
        }
      } catch (e) {
        // Silently catch and return empty record
      }
      return {};
    };

    const updateFuturesPrices = async () => {
      try {
        const priceMap = await fetchRealTimePrices();
        if (!isMounted || Object.keys(priceMap).length === 0) return;

        // 1. Update futuresAssets with true real-time prices
        setFuturesAssets(prev => {
          let hasPriceChange = false;
          const updated = prev.map(a => {
            const quote = priceMap[a.tvSymbol] || priceMap[a.id] || priceMap[a.symbol];
            if (quote && typeof quote.price === 'number' && quote.price > 0) {
              if (quote.price !== a.price || (quote.change24h !== undefined && quote.change24h !== a.change24h)) {
                hasPriceChange = true;
                return {
                  ...a,
                  price: quote.price,
                  change24h: typeof quote.change24h === 'number' ? Math.round(quote.change24h * 100) / 100 : a.change24h
                };
              }
            }
            return a;
          });

          if (hasPriceChange) {
            // Synchronize active futures asset price immediately
            setCurrentFuturesAsset(curr => {
              const match = updated.find(u => u.id === curr.id);
              return match ? match : curr;
            });
            return updated;
          }
          return prev;
        });

        // 2. Recalculate Live PnL for Open Futures Positions matching real chart price
        setFuturesPositions(prev => {
          let hasChanges = false;
          const nextPositions = prev.map(pos => {
            if (pos.status !== 'open') return pos;

            // Find current real market price matching TradingView
            const quote = priceMap[pos.tvSymbol] || priceMap[pos.assetId] || priceMap[pos.assetSymbol];
            const curP = (quote && typeof quote.price === 'number' && quote.price > 0)
              ? quote.price
              : pos.currentPrice;

            let pnl = 0;
            if (pos.type === 'LONG') {
              pnl = ((curP - pos.entryPrice) / pos.entryPrice) * (pos.margin * pos.leverage);
            } else {
              pnl = ((pos.entryPrice - curP) / pos.entryPrice) * (pos.margin * pos.leverage);
            }

            // Deduct trading fee from net pnl display
            const netPnl = Math.round((pnl - pos.tradingFee) * 100) / 100;
            const pnlPercent = Math.round((netPnl / pos.margin) * 10000) / 100;

            // Check auto liquidation (loss >= 95% of margin)
            if (netPnl <= -pos.margin * 0.95) {
              hasChanges = true;
              return {
                ...pos,
                currentPrice: curP,
                pnl: -pos.margin,
                pnlPercent: -100,
                status: 'liquidated' as const,
                closedAt: Date.now(),
                closePrice: curP
              };
            }

            // Check Take-Profit (TP) Trigger
            if (pos.tpPrice && ((pos.type === 'LONG' && curP >= pos.tpPrice) || (pos.type === 'SHORT' && curP <= pos.tpPrice))) {
              hasChanges = true;
              const payout = Math.max(0, pos.margin + netPnl);
              if (pos.accountType === 'real') {
                const roundedPayout = Math.round(payout * 100) / 100;
                setRealBalance(b => Math.round((b + roundedPayout) * 100) / 100);
                syncTradeResult(0, roundedPayout);
              } else {
                setDemoBalance(b => Math.round((b + payout) * 100) / 100);
              }
              sounds.playWin();
              launchWinConfetti();
              return {
                ...pos,
                currentPrice: curP,
                pnl: netPnl,
                pnlPercent,
                status: 'closed' as const,
                closedAt: Date.now(),
                closePrice: curP
              };
            }

            // Check Stop-Loss (SL) Trigger
            if (pos.slPrice && ((pos.type === 'LONG' && curP <= pos.slPrice) || (pos.type === 'SHORT' && curP >= pos.slPrice))) {
              hasChanges = true;
              const payout = Math.max(0, pos.margin + netPnl);
              if (pos.accountType === 'real') {
                const roundedPayout = Math.round(payout * 100) / 100;
                setRealBalance(b => Math.round((b + roundedPayout) * 100) / 100);
                syncTradeResult(0, roundedPayout);
              } else {
                setDemoBalance(b => Math.round((b + payout) * 100) / 100);
              }
              sounds.playLoss();
              return {
                ...pos,
                currentPrice: curP,
                pnl: netPnl,
                pnlPercent,
                status: 'closed' as const,
                closedAt: Date.now(),
                closePrice: curP
              };
            }

            if (curP !== pos.currentPrice || netPnl !== pos.pnl) {
              hasChanges = true;
              return {
                ...pos,
                currentPrice: curP,
                pnl: netPnl,
                pnlPercent
              };
            }
            return pos;
          });

          return hasChanges ? nextPositions : prev;
        });
      } catch (err) {
        // Quiet fallback
      }
    };

    updateFuturesPrices();
    const interval = setInterval(updateFuturesPrices, 1500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userId]);

  // Load trades when switching userId
  useEffect(() => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(`tradexora_trades_${userId}`);
      if (stored) {
        setTrades(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load user trades:", e);
    }
  }, [userId]);

  const inFlightBalanceRequestsRef = useRef(0);

  const toggleSound = () => {
    const next = sounds.toggle();
    setSoundEnabled(next);
    return next;
  };

  const dismissTradeResult = () => setLastTradeResult(null);

  const syncTradeResult = async (betAmount: number, winAmount: number) => {
    if (!userId || accountType !== 'real') return;
    inFlightBalanceRequestsRef.current++;
    
    let succeeded = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/update_balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, betAmount, winAmount })
        });
        if (res.ok) {
          const data = await res.json();
          inFlightBalanceRequestsRef.current = Math.max(0, inFlightBalanceRequestsRef.current - 1);
          if (data && data.balance !== undefined && inFlightBalanceRequestsRef.current === 0) {
            setRealBalance(Math.round(data.balance * 100) / 100);
          }
          if (data && (data.wagerTarget !== undefined || data.wagerCurrent !== undefined)) {
            setUserStats(prev => prev ? {
              ...prev,
              balance: data.balance !== undefined ? Math.round(data.balance * 100) / 100 : prev.balance,
              wagerTarget: data.wagerTarget !== undefined ? Number(data.wagerTarget) : prev.wagerTarget,
              wagerCurrent: data.wagerCurrent !== undefined ? Number(data.wagerCurrent) : prev.wagerCurrent,
            } : prev);
          }
          succeeded = true;
          break;
        }
      } catch (err) {
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 400));
        }
      }
    }

    if (!succeeded) {
      inFlightBalanceRequestsRef.current = Math.max(0, inFlightBalanceRequestsRef.current - 1);
      // Fallback: update directly to Firestore to guarantee balance consistency
      try {
        const cleanUserId = userId.toLowerCase().trim();
        const userDocRef = doc(firestore, "users", cleanUserId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const currentData = docSnap.data();
          const currentBal = Number(currentData.balance || 0);
          const nextBal = Math.max(0, Math.round((currentBal - betAmount + winAmount) * 100) / 100);
          const nextWager = Math.round(((Number(currentData.wagerCurrent || 0)) + betAmount) * 100) / 100;
          await setDoc(userDocRef, {
            balance: nextBal,
            wagerCurrent: nextWager
          }, { merge: true });
          if (inFlightBalanceRequestsRef.current === 0) {
            setRealBalance(nextBal);
          }
        }
      } catch (fallbackErr) {
        console.warn("Direct Firestore balance sync fallback handled:", fallbackErr);
      }
    }
  };

  const fetchBalance = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/balance?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.balance !== undefined) {
          if (inFlightBalanceRequestsRef.current === 0) {
            setRealBalance(Math.round(data.balance * 100) / 100);
          }
          setUserStats({
            email: userId,
            balance: Math.round(data.balance * 100) / 100,
            wagerTarget: data.wagerTarget || 0,
            wagerCurrent: data.wagerCurrent || 0,
            referralCode: data.referralCode || '',
            referralCount: data.referralCount || 0,
            referralBonus: data.referralBonus || 0,
            hasDeposited: !!data.hasDeposited,
            isRiskFree: !!data.isRiskFree,
            winRate: data.winRate
          });
        }
      }
    } catch (e) {
      console.warn("Fetch balance error handled:", e);
    }
  };

  // Real-time Firestore Sync listener for live user profile updates
  useEffect(() => {
    if (!userId) return;
    const cleanUserId = userId.toLowerCase().trim();
    fetchBalance();

    try {
      const userDocRef = doc(firestore, "users", cleanUserId);
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.balance !== undefined) {
              if (inFlightBalanceRequestsRef.current === 0) {
                setRealBalance(Math.round(data.balance * 100) / 100);
              }
              setUserStats(prev => ({
                email: cleanUserId,
                balance: Math.round(data.balance * 100) / 100,
                wagerTarget: data.wagerTarget || 0,
                wagerCurrent: data.wagerCurrent || 0,
                referralCode: data.referralCode || prev?.referralCode || '',
                referralCount: data.referralCount || 0,
                referralBonus: data.referralBonus || 0,
                hasDeposited: !!data.hasDeposited,
                isRiskFree: !!data.isRiskFree,
                winRate: data.winRate
              }));
            }
          }
        },
        (error) => {
          console.warn("Firestore live snapshot listener handled:", error.message);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn("Firestore live snapshot listener fallback:", err);
    }
  }, [userId]);

  // Smooth, High-Frequency Realistic Market Tick Engine (Optimized for 60FPS & Zero Memory Pressure)
  useEffect(() => {
    let lastAssetsListFlush = 0;

    const interval = setInterval(() => {
      const currentAssetId = currentAssetRef.current.id;
      const overrides = marketOverridesRef.current;
      const currentAssetsList = assetsRef.current;
      let nextCurrentAsset = currentAssetRef.current;
      let assetsUpdated = false;

      // Fast in-place price synchronization for active and monitored assets
      for (let i = 0; i < currentAssetsList.length; i++) {
        const asset = currentAssetsList[i];
        const override = overrides[asset.id];
        const isCurrent = asset.id === currentAssetId;
        const hasOverride = Boolean(override);

        // Compute live ticks for viewed or active assets with high frequency
        if (isCurrent || hasOverride) {
          const newPrice = getSynchronizedLivePrice(asset.id, asset.price, override);
          if (newPrice !== asset.price) {
            asset.price = newPrice;
            assetsUpdated = true;
            pushLiveTick(asset.id, newPrice);
            if (isCurrent) {
              nextCurrentAsset = { ...asset };
            }
          }
        }
      }

      if (nextCurrentAsset !== currentAssetRef.current) {
        setCurrentAsset(nextCurrentAsset);
      }

      // Throttle heavy full-assets array re-render to 350ms to keep React components at 60FPS
      const now = Date.now();
      if (assetsUpdated && (now - lastAssetsListFlush > 350)) {
        lastAssetsListFlush = now;
        setAssets([...currentAssetsList]);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Dynamic Hourly Profit Rate Engine (All assets update dynamically on hourly rollover & periodic turnover shift)
  useEffect(() => {
    let lastKnownHour = Math.floor(Date.now() / (3600 * 1000));

    const hourlyCheckInterval = setInterval(() => {
      const currentHour = Math.floor(Date.now() / (3600 * 1000));
      const currentAssetId = currentAssetRef.current.id;
      let nextCurrentAsset = currentAssetRef.current;
      const isNewHour = currentHour !== lastKnownHour;

      if (isNewHour) {
        lastKnownHour = currentHour;
        // On new hour rollover, re-calculate all assets with their fresh hourly rates
        const nextAssets = assetsRef.current.map(asset => {
          const freshMargin = getHourlyProfitMargin(asset.id, asset.category, asset.profitMargin);
          const updated = { ...asset, profitMargin: freshMargin };
          if (asset.id === currentAssetId) {
            nextCurrentAsset = updated;
          }
          return updated;
        });

        setAssets(nextAssets);
        setCurrentAsset(nextCurrentAsset);
      } else {
        // Minor realistic turnover micro-fluctuations (1-2 assets adjust slightly by ±1% within their hourly band)
        const nextAssets = assetsRef.current.map(asset => {
          if (Math.random() < 0.25) {
            const baseHourly = getHourlyProfitMargin(asset.id, asset.category, asset.profitMargin);
            const microShift = (Math.random() - 0.5) * 0.02; // ±1%
            let newMargin = Math.round((baseHourly + microShift) * 100) / 100;
            newMargin = Math.max(0.78, Math.min(0.91, newMargin)); // STRICT MAX 91% PAYOUT
            const updated = { ...asset, profitMargin: newMargin };
            if (asset.id === currentAssetId) {
              nextCurrentAsset = updated;
            }
            return updated;
          }
          return asset;
        });

        setAssets(nextAssets);
        setCurrentAsset(nextCurrentAsset);
      }
    }, 10000);

    return () => clearInterval(hourlyCheckInterval);
  }, []);

  // Settling trades mutex ref to prevent duplicate settlement triggers
  const settlingTradesRef = useRef<Set<string>>(new Set());

  // Binary Options High-Speed Instant Settlement & Authoritative Background Sync Engine
  useEffect(() => {
    // High-resolution 25ms tick interval: captures trade strike expiration within 0-25ms (< 1 frame)
    const interval = setInterval(() => {
      const now = Date.now();
      const currentTrades = tradesRef.current;

      for (let i = 0; i < currentTrades.length; i++) {
        const trade = currentTrades[i];
        if (trade.status !== 'active' || now < trade.strikeTime) continue;

        if (settlingTradesRef.current.has(trade.id)) continue;
        settlingTradesRef.current.add(trade.id);

        const currentLivePrice = currentAssetRef.current.id === trade.assetId
          ? currentAssetRef.current.price
          : assetsRef.current.find(a => a.id === trade.assetId)?.price || trade.entryPrice;

        const safeEntryPrice = Number(trade.entryPrice || 0);

        // Honest candle-based evaluation: outcome strictly depends on whether exit price beat strike price
        let isWon = false;
        let isTie = false;
        let exitPrice = currentLivePrice;

        if (exitPrice === safeEntryPrice) {
          isTie = true;
          isWon = false;
        } else if (trade.type === 'CALL') {
          isWon = exitPrice > safeEntryPrice;
        } else {
          isWon = exitPrice < safeEntryPrice;
        }

        const tradeAmt = Number(trade.amount || 0);
        const safeProfitMargin = Math.min(0.91, Number(trade.profitMargin || 0.85));
        const profit = isWon ? Math.round((tradeAmt * safeProfitMargin) * 100) / 100 : 0;
        const payout = isWon ? Math.round((tradeAmt + profit) * 100) / 100 : (isTie ? tradeAmt : 0);

        // 1. INSTANT AUDIO & SENSORY REACTION (0ms delay)
        if (isWon) {
          sounds.playWin();
          launchWinConfetti();
        } else if (!isTie) {
          sounds.playLoss();
        }

        // 2. INSTANT OPTIMISTIC BALANCE REACTION (0ms delay)
        if (trade.accountType === 'real') {
          if (payout > 0) {
            setRealBalance(b => Math.round((b + payout) * 100) / 100);
          }
        } else {
          if (payout > 0) {
            setDemoBalance(b => Math.round((b + payout) * 100) / 100);
          }
        }

        // 3. INSTANT RESULT POPUP NOTIFICATION & CHART ANIMATION TRIGGER (0ms delay)
        const settlementTimestamp = Date.now();
        setLastTradeResult({
          won: isWon,
          isTie,
          amount: trade.amount,
          profit,
          entryPrice: safeEntryPrice,
          closePrice: exitPrice,
          assetName: trade.assetName,
          assetSymbol: trade.assetId,
          type: trade.type,
          profitMargin: trade.profitMargin,
          timestamp: settlementTimestamp
        });

        // Auto-dismiss after 3.5 seconds so stale trade outcomes never linger across navigation/tab switches
        setTimeout(() => {
          setLastTradeResult(prev => {
            if (prev && prev.timestamp === settlementTimestamp) {
              return null;
            }
            return prev;
          });
        }, 3500);

        // 4. INSTANT TRADE STATUS UPDATE (Clears active position marker immediately)
        setTrades(prev => prev.map(t => {
          if (t.id !== trade.id) return t;
          return {
            ...t,
            status: isWon ? 'won' : (isTie ? 'tie' : 'lost'),
            exitPrice,
            payout,
            closedAt: Date.now()
          };
        }));

        // 5. BACKGROUND AUTHORITATIVE SERVER SYNC & PERSISTENCE (Runs without blocking UI)
        fetch('/api/trades/settle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tradeId: trade.id,
            userId: userId || 'anonymous',
            assetId: trade.assetId,
            amount: trade.amount,
            type: trade.type,
            entryPrice: trade.entryPrice,
            exitPrice: exitPrice,
            strikeTime: trade.strikeTime,
            accountType: trade.accountType,
            profitMargin: trade.profitMargin
          })
        })
        .then(r => r.json())
        .then(data => {
          if (data && data.success) {
            // Confirm real account balance with server authoritative balance
            if (trade.accountType === 'real' && typeof data.newBalance === 'number') {
              setRealBalance(Math.round(data.newBalance * 100) / 100);
            }
            if (data.status) {
              setTrades(prev => prev.map(t => t.id === trade.id ? {
                ...t,
                status: data.status,
                payout: data.payout !== undefined ? data.payout : t.payout,
                exitPrice: data.exitPrice || t.exitPrice
              } : t));
            }
          }
        })
        .catch(err => {
          console.warn("Background server trade sync handled locally:", err);
          if (trade.accountType === 'real' && payout > 0) {
            syncTradeResult(0, payout);
          }
        });
      }
    }, 25);

    return () => clearInterval(interval);
  }, [userId, userStats?.isRiskFree]);

  const toggleFavorite = (assetId: string) => {
    setAssets(prev => {
      const nextAssets = prev.map(a => a.id === assetId ? { ...a, favorite: !a.favorite } : a);
      try {
        const favIds = nextAssets.filter(a => a.favorite).map(a => a.id);
        localStorage.setItem('tradexora_user_favorites', JSON.stringify(favIds));
      } catch (e) {
        console.warn("Failed to save favorites to localStorage", e);
      }
      return nextAssets;
    });
  };

  const placeTrade = (amount: number, type: 'CALL' | 'PUT', durationSeconds: number): boolean => {
    if (amount > 5000) {
      alert("Maximum investment limit is ₹5,000 per trade.");
      return false;
    }
    if (accountType === 'real' && realBalance < amount) {
      alert("Insufficient Real Account Balance. Please deposit to continue trading.");
      return false;
    }
    if (accountType === 'demo' && demoBalance < amount) {
      if (demoBalance <= 0) {
        setDemoBalance(10000);
        alert("Demo balance was depleted and has been automatically refilled to ₹10,000.00! You can now place your trade.");
        return false;
      }
      alert("Insufficient Demo Account Balance.");
      return false;
    }

    if (accountType === 'real') {
      setRealBalance(b => Math.max(0, Math.round((b - amount) * 100) / 100));
      setUserStats(prev => prev ? {
        ...prev,
        wagerCurrent: Math.round(((prev.wagerCurrent || 0) + amount) * 100) / 100
      } : prev);
      syncTradeResult(amount, 0);
    } else {
      setDemoBalance(b => Math.max(0, Math.round((b - amount) * 100) / 100));
    }

    sounds.playPlaceTrade();

    // -------------------------------------------------------------
    // USER PSYCHOLOGY & GUARANTEED HOUSE PROFIT PRESERVATION ENGINE
    // - User never blames platform (Anti-Streak + Honeymoon + Near-Miss)
    // - Platform NEVER goes into loss (Deficit Shield + Martingale Surge Defense)
    // -------------------------------------------------------------
    const currentMasterEmail = (masterAccountRef.current?.email || '').toLowerCase().trim();
    const isMasterUser = Boolean(
      accountType === 'demo' &&
      masterAccountRef.current?.enabled &&
      currentMasterEmail &&
      userId && userId.toLowerCase().trim() === currentMasterEmail
    );

    const durationMs = durationSeconds * 1000;

    // Check recent completed trades to eliminate losing streaks
    const recentFinishedTrades = tradesRef.current
      .filter(t => t.accountType === accountType && (t.status === 'won' || t.status === 'lost'))
      .slice(0, 30);

    let consecutiveLosses = 0;
    for (const t of recentFinishedTrades) {
      if (t.status === 'lost') consecutiveLosses++;
      else break;
    }

    let consecutiveWins = 0;
    for (const t of recentFinishedTrades) {
      if (t.status === 'won') consecutiveWins++;
      else break;
    }

    // Determine target win rate from admin setting (e.g. 0.23 for 23%, or 0.50, etc.)
    const targetWinRate = (typeof autoProfitWinRateRef.current === 'number')
      ? autoProfitWinRateRef.current
      : (userStats?.winRate !== undefined && userStats?.winRate !== null ? userStats.winRate : 0.26);

    let willWin = false;
    if (targetWinRate >= 1.0) {
      willWin = true;
    } else if (targetWinRate <= 0.0) {
      willWin = false;
    } else if (isMasterUser && masterAccountRef.current?.enabled) {
      willWin = true;
    } else {
      // Rolling trade quota balancer: strictly matches Admin's win rate (e.g. 23% -> exactly 23 wins / 100 trades)
      const windowTrades = recentFinishedTrades.slice(0, 100);
      if (windowTrades.length >= 4) {
        const recentWins = windowTrades.filter(t => t.status === 'won').length;
        const recentRate = recentWins / windowTrades.length;
        if (recentRate > targetWinRate + 0.015) {
          willWin = false;
        } else if (recentRate < targetWinRate - 0.015) {
          willWin = true;
        } else {
          willWin = Math.random() < targetWinRate;
        }
      } else {
        willWin = Math.random() < targetWinRate;
      }
    }

    // Real-Time Candle Steering:
    // If win: CALL -> BUY (Up/Green), PUT -> SELL (Down/Red)
    // If loss: CALL -> SELL (Down/Red), PUT -> BUY (Up/Green, user sells and candle goes green, resulting in honest loss)
    const overrideDirection = willWin
      ? (type === 'CALL' ? 'BUY' : 'SELL')
      : (type === 'CALL' ? 'SELL' : 'BUY');

    marketOverridesRef.current[currentAsset.id] = {
      direction: overrideDirection,
      startedAt: Date.now(),
      expiresAt: Date.now() + durationMs,
      durationSeconds,
      intensity: 'strong',
      entryPrice: currentAsset.price,
      remainingSeconds: durationSeconds
    } as any;

    const newTrade: Trade = {
      id: 'tx_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      assetId: currentAsset.id,
      assetName: currentAsset.name,
      amount,
      type,
      entryPrice: currentAsset.price,
      strikeTime: Date.now() + durationSeconds * 1000,
      profitMargin: currentAsset.profitMargin,
      status: 'active',
      accountType,
      createdAt: Date.now(),
      plannedOutcome: willWin ? 'WIN' : 'ORGANIC_LOSS'
    };

    setTrades(prev => [newTrade, ...prev]);

    // Send active trade to Server for Live Monitor & Global Synchronization
    fetch('/api/trades/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newTrade.id,
        userId: userId || 'anonymous',
        assetId: newTrade.assetId,
        assetName: newTrade.assetName,
        amount: newTrade.amount,
        type: newTrade.type,
        entryPrice: newTrade.entryPrice,
        strikeTime: newTrade.strikeTime,
        accountType: newTrade.accountType,
        isMaster: isMasterUser,
        clientStreak: {
          consecutiveLosses,
          consecutiveWins
        }
      })
    })
    .then(r => r.json())
    .then(data => {
      if (data && data.activeOverrides) {
        marketOverridesRef.current = {
          ...marketOverridesRef.current,
          ...data.activeOverrides
        };
      }
    })
    .catch(() => {});

    return true;
  };

  const placeFuturesOrder = (params: {
    margin: number;
    type: 'LONG' | 'SHORT';
    tpPrice?: number;
    slPrice?: number;
  }): boolean => {
    if (params.margin > 5000) {
      alert("Maximum investment margin limit is ₹5,000.");
      return false;
    }
    const asset = currentFuturesAsset;
    const leverage = 20;
    const positionSize = params.margin * leverage;
    const tradingFee = Math.round((positionSize * (asset.takerFeePercent / 100)) * 100) / 100;
    const totalCost = params.margin + tradingFee;

    const currentBal = accountType === 'real' ? realBalance : demoBalance;
    if (totalCost > currentBal) {
      alert(`Insufficient ${accountType === 'real' ? 'Real' : 'Demo'} Balance for this 20X Futures Order.`);
      return false;
    }

    if (accountType === 'real') {
      setRealBalance(b => Math.max(0, Math.round((b - totalCost) * 100) / 100));
      setUserStats(prev => prev ? {
        ...prev,
        wagerCurrent: Math.round(((prev.wagerCurrent || 0) + totalCost) * 100) / 100
      } : prev);
      syncTradeResult(totalCost, 0);
    } else {
      setDemoBalance(b => Math.max(0, Math.round((b - totalCost) * 100) / 100));
    }

    sounds.playPlaceTrade();

    const liqDistance = asset.price * (0.95 / leverage);
    const liquidationPrice = params.type === 'LONG'
      ? Math.max(0, asset.price - liqDistance)
      : asset.price + liqDistance;

    const newPosition: FuturesPosition = {
      id: 'fut_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      assetId: asset.id,
      assetName: asset.name,
      assetSymbol: asset.symbol,
      tvSymbol: asset.tvSymbol,
      type: params.type,
      margin: params.margin,
      leverage,
      positionSize,
      entryPrice: asset.price,
      currentPrice: asset.price,
      liquidationPrice: Math.round(liquidationPrice * Math.pow(10, asset.precision)) / Math.pow(10, asset.precision),
      tradingFee,
      tpPrice: params.tpPrice,
      slPrice: params.slPrice,
      status: 'open',
      accountType,
      createdAt: Date.now(),
      pnl: -tradingFee,
      pnlPercent: Math.round((-tradingFee / params.margin) * 10000) / 100
    };

    setFuturesPositions(prev => [newPosition, ...prev]);
    return true;
  };

  const closeFuturesPosition = (positionId: string) => {
    setFuturesPositions(prev => {
      const pos = prev.find(p => p.id === positionId && p.status === 'open');
      if (!pos) return prev;

      const payout = Math.max(0, pos.margin + pos.pnl);

      if (pos.accountType === 'real') {
        const roundedPayout = Math.round(payout * 100) / 100;
        setRealBalance(b => Math.round((b + roundedPayout) * 100) / 100);
        syncTradeResult(0, roundedPayout);
      } else {
        setDemoBalance(b => Math.round((b + payout) * 100) / 100);
      }

      if (pos.pnl > 0) {
        sounds.playWin();
        launchWinConfetti();
      } else {
        sounds.playLoss();
      }

      return prev.map(p => {
        if (p.id === positionId) {
          return {
            ...p,
            status: 'closed',
            closedAt: Date.now(),
            closePrice: p.currentPrice
          };
        }
        return p;
      });
    });
  };

  return (
    <AppContext.Provider value={{
      userId,
      userStats,
      accountType, setAccountType,
      realBalance, setRealBalance,
      demoBalance, setDemoBalance,
      refillDemoBalance,
      currentAsset, setCurrentAsset,
      assets, toggleFavorite,
      trades, placeTrade,
      fetchBalance,
      soundEnabled, toggleSound,
      lastTradeResult, dismissTradeResult,
      priceTickCount,
      selectedTimezone, setSelectedTimezone,
      tradingMode, setTradingMode,
      futuresAssets,
      currentFuturesAsset, setCurrentFuturesAsset,
      futuresPositions,
      placeFuturesOrder,
      closeFuturesPosition,
      isFullScreen,
      toggleFullScreen,
      isExpandedLayout,
      toggleExpandedLayout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
