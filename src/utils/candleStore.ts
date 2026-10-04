export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type TimeFrame = '5s' | '15s' | '30s' | '1m' | '3m' | '5m' | '15m' | '1min' | '3min' | '5min' | '15min';

export const normalizeTimeFrame = (tf: string): '5s' | '15s' | '30s' | '1m' | '3m' | '5m' | '15m' => {
  if (tf === '15min' || tf === '15m') return '15m';
  if (tf === '5min' || tf === '5m') return '5m';
  if (tf === '3min' || tf === '3m') return '3m';
  if (tf === '1min' || tf === '1m') return '1m';
  if (tf === '30s') return '30s';
  if (tf === '15s') return '15s';
  return '5s';
};

export const getTimeFrameMs = (tf: string): number => {
  const norm = normalizeTimeFrame(tf);
  switch (norm) {
    case '5s': return 5000;
    case '15s': return 15000;
    case '30s': return 30000;
    case '1m': return 60000;
    case '3m': return 180000;
    case '5m': return 300000;
    case '15m': return 900000;
    default: return 60000;
  }
};

export const getPrecision = (price: number): number => {
  if (!price || isNaN(price) || price <= 0) return 2;
  if (price < 0.0001) return 8; // e.g. SHIB (0.0000185), PEPE (0.0000098)
  if (price < 0.01) return 6;
  if (price < 1) return 4;    // e.g. XRP, DOGE, TRX, EURUSD
  if (price < 10) return 3;   // e.g. TON, LINK, SUI, NEAR
  return 2;                   // e.g. Gold, Bitcoin, Apple, Index
};

// Canonical benchmark base prices across all platforms ensuring all users see identical charts
export const CANONICAL_PRICES: Record<string, number> = {
  '1': 2499.07,
  '2': 78370.0,
  '3': 1.16235,
  '4': 4400.5,
  '5': 94.808,
  '6': 354.08,
  '8': 616.77,
  '9': 1.3556,
  '10': 153.80,
  '11': 0.7227,
  '12': 1.3725,
  '13': 0.8540,
  '14': 37.79,
  '15': 5.4820,
  '16': 18.254,
  '17': 0.8950,
  '18': 0.6120,
  '19': 208.52,
  '20': 164.80,
  '21': 101.45,
  '22': 112.35,
  '23': 2470.5,
  '24': 102.85,
  '25': 751.20,
  '26': 1.3995,
  '27': 0.08935,
  '28': 6.85,
  '29': 0.0000185,
  '30': 0.5240,
  '31': 12.45,
  '32': 74.20,
  '33': 5.15,
  '34': 0.1620,
  '35': 0.2187,
  '36': 28.90,
  '37': 0.0000098,
  '38': 317.79,
  '39': 128.45,
  '40': 448.20,
  '41': 186.75,
  '42': 179.30,
  '43': 154.60,
  '44': 24.15,
  '45': 84.30,
  '46': 68.40,
  '47': 96.20,
  '48': 278.50,
  '49': 462.80,
  '50': 672.10,
  '51': 108.26,
  '57': 29.45,
  '58': 955.40,
  '59': 980.20,
  '60': 84.60,
  '61': 80.25,
  '62': 2.15,
  '63': 4.45,
  '64': 19850.0,
  '65': 5540.2,
  '66': 40280.0,
  '69': 18650.0,
  '70': 8240.0,
  '71': 38250.0,
  '72': 17650.0,
  '73': 0.9420,
  '74': 1.7650,
  '75': 0.9030,
  '76': 1.6320,
  '77': 5.42,
  '78': 2.18,
  '79': 9.85,
  '80': 6.45,
  '81': 8.90,
  '82': 6.75,
  '83': 0.85,
  '84': 22.40,
  '85': 198.50,
  '86': 462.10,
  '87': 224.30,
  '88': 82.40,
  '89': 172.90,
  '90': 178.60,
  '91': 945.20,
  '92': 118.40,
  '93': 912.80,
  '94': 86.50,
  '95': 532.70,
  '96': 42.80,
  '97': 218.40,
  '98': 375.60,
  '99': 74.30,
  '100': 2150.80,
  '101': 27.15,
  '102': 7540.0,
  '103': 4920.0,
  '104': 8120.0,
  '105': 11650.0,
  '106': 24500.0,
  '107': 51200.0,
  '108': 80500.0,
  '109': 14.50,
  '110': 2150.0,
  '111': 165.20,
  '112': 280.40,
  '113': 260.15,
  '114': 158.30,
  '115': 39.50,
  '116': 345.60,
  '117': 148.90,
  '118': 162.30,
  '119': 48.20,
  '120': 41.50,
  '121': 18.20,
  '122': 28.40,
  '123': 185.60,
  '124': 205.40,
  '125': 145.80,
  '126': 890.50,
  '127': 124.30,
  '128': 156.20,
  '129': 72.40,
  '130': 68.90,
  '131': 64.50,
  '132': 0.1050,
  '133': 9.40,
  '134': 4.50,
  '135': 0.0340,
  '136': 165.20,
  '137': 102.40,
  '138': 0.1520,
  '139': 1.65,
  '140': 34.20,
  '141': 0.3540,
  '142': 0.3420,
  '143': 6.20,
  '144': 0.0280,
  '145': 82.40,
  '146': 0.5420,
  '147': 4.80,
  '148': 2840.0,
  '149': 1.85,
  '150': 2450.0,
  '151': 2850.0,
  '152': 18200.0,
  '153': 9240.0,
  '154': 235.40,
  '155': 580.20,
  '156': 1.1420,
  '157': 1.0840,
  '158': 94.20,
  '159': 172.40,
  '160': 0.6520,
  '161': 10.65,
  '162': 1.3250,
  '163': 0.5480,
  '164': 365.40,
  '165': 1650.20,
  '166': 2980.50,
  '167': 985.40,
  '168': 92.60,
  '169': 104.35,
  '170': 45.20,
  '171': 12.80,
  '172': 18.50,
  '173': 98.40,
  '174': 560.20,
  '175': 92.40,
  '176': 88.50,
  '177': 1.0845,
  '178': 1.2980,
  '179': 153.40,
  '180': 84.15,
  '181': 198.80,
  '182': 0.9120,
  '183': 68450.00,
  '184': 2640.50,
  '185': 178.60,
  '186': 0.5480,
  '187': 2735.40,
  '188': 33.80,
  '189': 74.50,
  '190': 138.25,
  '191': 231.40,
  '192': 252.80,
  '193': 428.60,
  '194': 186.40,
  '195': 5820.00,
  '196': 20340.00,

  // ==========================================
  // Direct Futures Asset Canonical Benchmark Prices
  // ==========================================
  'fut_btc': 78370.00,
  'fut_eth': 2470.50,
  'fut_sol': 102.85,
  'fut_bnb': 751.20,
  'fut_xrp': 1.3995,
  'fut_doge': 0.08935,
  'fut_ada': 0.7225,
  'fut_shib': 0.00001850,
  'fut_pepe': 0.00000980,
  'fut_ton': 5.420,
  'fut_avax': 28.90,
  'fut_link': 18.25,
  'fut_sui': 3.450,
  'fut_near': 6.80,
  'fut_apt': 9.85,
  'fut_dot': 8.20,
  'fut_pol': 0.4850,
  'fut_ltc': 96.50,
  'fut_bch': 475.20,
  'fut_trx': 0.2150,
  'fut_uni': 11.40,
  'fut_render': 7.95,
  'fut_fet': 1.420,
  'fut_tao': 485.00,

  'fut_eurusd': 1.08450,
  'fut_gbpusd': 1.29800,
  'fut_usdjpy': 153.800,
  'fut_usdinr': 87.250,
  'fut_audusd': 0.65400,
  'fut_gbpjpy': 199.500,
  'fut_usdcad': 1.39200,
  'fut_eurgbp': 0.83500,
  'fut_eurjpy': 166.800,
  'fut_audcad': 0.91000,
  'fut_nzdusd': 0.58900,
  'fut_usdchf': 0.88700,
  'fut_euraud': 1.63200,
  'fut_gbpcad': 1.76500,
  'fut_audjpy': 101.450,
  'fut_cadjpy': 112.350,
  'fut_eurchf': 0.94200,
  'fut_usdmxn': 18.254,
  'fut_usdbrl': 5.482,
  'fut_eurthb': 37.790,

  'fut_nvda': 128.45,
  'fut_aapl': 234.80,
  'fut_tsla': 248.50,
  'fut_msft': 428.20,
  'fut_amzn': 186.75,
  'fut_meta': 585.40,
  'fut_googl': 179.30,
  'fut_amd': 138.50,
  'fut_intc': 24.15,
  'fut_nflx': 672.10,
  'fut_coin': 208.50,
  'fut_pltr': 37.80,
  'fut_baba': 84.30,

  'fut_nifty': 24850.00,
  'fut_banknifty': 52350.00,
  'fut_reliance': 2890.00,
  'fut_tatamotors': 955.40,
  'fut_hdfcbank': 1740.00,
  'fut_infosys': 1865.00,
  'fut_sbi': 815.00,
  'fut_icicibank': 1245.00,
  'fut_tcs': 4150.00,
  'fut_itc': 485.20,
  'fut_bhartiairtel': 1680.00,
  'fut_lt': 3620.00,
  'fut_maruti': 12450.00,

  'fut_gold': 2735.50,
  'fut_silver': 33.700,
  'fut_crude': 74.20,
  'fut_brent': 78.45,
  'fut_natgas': 2.840,
  'fut_copper': 4.380,
  'fut_platinum': 985.00,
  'fut_aluminum': 2580.00
};

const PERMANENT_CANONICAL_PRICES = new Map<string, number>();

export type GlobalChartMood = 'NORMAL' | 'BULLISH' | 'BEARISH' | 'HIGH_VOLATILITY';
let activeGlobalMood: GlobalChartMood = 'NORMAL';

export const setGlobalChartMood = (mood?: GlobalChartMood) => {
  if (mood && ['NORMAL', 'BULLISH', 'BEARISH', 'HIGH_VOLATILITY'].includes(mood)) {
    activeGlobalMood = mood;
  }
};

export const getGlobalChartMood = (): GlobalChartMood => activeGlobalMood;

export const updateCanonicalPricesFromRemote = (remotePrices: Record<string, number>) => {
  if (!remotePrices || typeof remotePrices !== 'object') return;
  for (const [k, v] of Object.entries(remotePrices)) {
    if (typeof v === 'number' && !isNaN(v) && v > 0) {
      CANONICAL_PRICES[k] = v;
      PERMANENT_CANONICAL_PRICES.set(k, v);
    }
  }
};

export const getCanonicalPrice = (assetId: string, fallbackPrice?: number): number => {
  const cached = PERMANENT_CANONICAL_PRICES.get(assetId);
  if (cached && cached > 0) return cached;

  if (CANONICAL_PRICES[assetId]) {
    PERMANENT_CANONICAL_PRICES.set(assetId, CANONICAL_PRICES[assetId]);
    return CANONICAL_PRICES[assetId];
  }
  if (typeof fallbackPrice === 'number' && !isNaN(fallbackPrice) && fallbackPrice > 0) {
    PERMANENT_CANONICAL_PRICES.set(assetId, fallbackPrice);
    return fallbackPrice;
  }
  return 100;
};

// Fixed global epoch reference point (Jan 1, 2024 00:00:00 UTC)
export const GLOBAL_EPOCH = 1704067200000;

// High-speed 32-bit FNV-1a seeded hash generator returning float in [-0.5, 0.5]
export function hashSlot(assetId: string, slotIndex: number): number {
  let h = 2166136261;
  const str = assetId || '1';
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  h = Math.imul(h ^ (slotIndex & 0xffff), 16777619);
  h = Math.imul(h ^ ((slotIndex >>> 16) & 0xffff), 16777619);
  return ((h >>> 0) / 4294967296) - 0.5;
}

export interface MarketOverrideConfig {
  direction: 'AUTO' | 'BUY' | 'SELL';
  startedAt?: number;
  expiresAt?: number;
  durationSeconds?: number;
  intensity?: 'gentle' | 'moderate' | 'strong';
  remainingSeconds?: number;
  targetPrice?: number;
  entryPrice?: number;
}

// Deterministic closed-form price at any slotIndex, identical on ALL client browsers
// Incorporates true market psychology: Accumulation, Markup, Distribution, Markdown, and Harmonic Swings
export function getSlotPrice(
  assetId: string,
  slotIndex: number,
  basePrice: number,
  intervalMs: number
): number {
  // Calculate deterministic numericId using string hash for alphanumeric IDs (like fut_btc)
  let numericId = parseInt((assetId || '1').replace(/\D/g, ''), 10);
  if (!numericId || isNaN(numericId)) {
    let h = 2166136261;
    for (let i = 0; i < (assetId || '1').length; i++) {
      h ^= (assetId || '1').charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    numericId = (Math.abs(h) % 9999) + 7;
  }
  const precision = getPrecision(basePrice);
  
  // Phase seeds derived deterministically per asset
  const phi = numericId * 0.718281828;
  
  // 1. Macro Trend Cycle (~6-8 hour Wyckoff structural wave)
  const macroWave = Math.sin((slotIndex / 420) * 2 * Math.PI + phi) * 0.024;
  
  // 2. Intermediate Market Structure Swing (~90 min cycle, creating Double Bottoms / Double Tops)
  const swingWave = Math.cos((slotIndex / 96) * 2 * Math.PI + phi * 1.618) * 0.012;
  
  // 3. Fibonacci Retracement Wave (~24 min rhythm, simulating 0.382 / 0.618 pullbacks)
  const fiboWave = Math.sin((slotIndex / 24) * 2 * Math.PI + phi * 2.618) * 0.005;
  
  // 4. Fast Liquidity Search Wave (~8 min rhythm, testing local support/resistance)
  const microWave = Math.cos((slotIndex / 8) * 2 * Math.PI + phi * 3.141) * 0.0022;

  // 5. Psychological Rounding Anchor: assets naturally react near round institutional price numbers
  const roundScale = basePrice > 100 ? 5 : basePrice > 10 ? 0.5 : 0.005;
  const roundDistance = (basePrice % roundScale) / roundScale;
  const psychologicalMagnet = Math.sin(roundDistance * Math.PI * 2) * 0.0008;
  
  // 6. Natural Organic Noise (100% deterministic hash per slot on all devices)
  const organicNoise = hashSlot(assetId, slotIndex) * 0.0028;
  
  // Timeframe volatility scaling
  const tfScale = Math.sqrt(intervalMs / 60000);
  const totalOffsetFactor = (macroWave + swingWave + fiboWave + microWave + psychologicalMagnet + organicNoise) * tfScale;
  
  let price = basePrice * (1 + totalOffsetFactor);
  if (price <= 0 || isNaN(price)) price = basePrice;
  return Number(price.toFixed(precision));
}

// Generate an authentic psychology-based candle for a specific slot timestamp
export function getSlotCandle(
  assetId: string,
  slotTime: number,
  basePrice: number,
  intervalMs: number
): CandleData {
  const slotIndex = Math.floor((slotTime - GLOBAL_EPOCH) / intervalMs);
  const precision = getPrecision(basePrice);
  const pipSize = Math.pow(10, -precision);
  
  const open = getSlotPrice(assetId, slotIndex - 1, basePrice, intervalMs);
  const close = getSlotPrice(assetId, slotIndex, basePrice, intervalMs);
  
  const hHash = Math.abs(hashSlot(assetId, slotIndex + 5000000));
  const lHash = Math.abs(hashSlot(assetId, slotIndex + 9000000));
  const bodySize = Math.abs(close - open);
  const isBullish = close >= open;

  // Authentic Candlestick Anatomy:
  // In real psychology, wicks reflect rejection at swing highs/lows:
  // - Bullish expansion candles have smaller upper wicks and rejection lower wicks (buyers stepped in)
  // - Bearish expansion candles have smaller lower wicks and rejection upper wicks (sellers pushed down)
  // - When body is very small (< 1.5 pips), indecision wicks form (Doji / Spinning top)
  const minWickVol = Math.max(basePrice * 0.00035, pipSize * 3);
  const baseWickVol = Math.max(bodySize * 0.65, minWickVol);
  let upperWickExtra = hHash * baseWickVol;
  let lowerWickExtra = lHash * baseWickVol;

  if (isBullish) {
    lowerWickExtra *= 1.25; // Rejection at the base (Hammer / Bullish momentum)
    upperWickExtra *= 0.75;
  } else {
    upperWickExtra *= 1.25; // Rejection at the high (Shooting star / Bearish momentum)
    lowerWickExtra *= 0.75;
  }

  const high = Number(Math.max(open, close, Math.max(open, close) + upperWickExtra).toFixed(precision));
  const low = Number(Math.max(pipSize, Math.min(open, close, Math.min(open, close) - lowerWickExtra)).toFixed(precision));

  return {
    time: slotTime,
    open,
    high,
    low,
    close,
    volume: Math.floor(150 + Math.abs(hashSlot(assetId, slotIndex + 12000000)) * 950)
  };
}

// In-memory cache holding historical and live candles per asset and timeframe
const candleCache = new Map<string, CandleData[]>();

// Generate 100% deterministic, mathematically identical initial candles for all users
export const generateInitialCandles = (
  assetId: string,
  basePrice: number,
  timeFrame: string,
  count = 350
): CandleData[] => {
  const canonicalBase = getCanonicalPrice(assetId, basePrice);
  const normTf = normalizeTimeFrame(timeFrame);
  const intervalMs = getTimeFrameMs(normTf);
  const now = Date.now();
  const currentSlot = Math.floor(now / intervalMs) * intervalMs;
  const precision = getPrecision(canonicalBase);
  const pip = Math.pow(10, -precision);
  
  const candles: CandleData[] = [];
  
  // Historical completed candles with strict continuous open = prev.close
  let prevClose = getSlotPrice(assetId, Math.floor((currentSlot - count * intervalMs - GLOBAL_EPOCH) / intervalMs), canonicalBase, intervalMs);

  for (let i = count - 1; i >= 1; i--) {
    const slotTime = currentSlot - i * intervalMs;
    const candle = getSlotCandle(assetId, slotTime, canonicalBase, intervalMs);
    // Enforce perfect chain continuity: open is strictly previous candle's close
    candle.open = prevClose;
    candle.high = Number(Math.max(candle.open, candle.close, candle.high).toFixed(precision));
    candle.low = Number(Math.min(candle.open, candle.close, candle.low).toFixed(precision));
    candles.push(candle);
    prevClose = candle.close;
  }

  // Active live candle at currentSlot
  const currentSlotIndex = Math.floor((currentSlot - GLOBAL_EPOCH) / intervalMs);
  const activeOpen = prevClose;
  const activeTarget = getSlotPrice(assetId, currentSlotIndex, canonicalBase, intervalMs);
  const progress = Math.min(1, Math.max(0, (now - currentSlot) / intervalMs));
  const baseVol = Math.max(canonicalBase * 0.00028, pip * 2.5);
  
  // Smooth micro-tick interpolation (750ms cadence)
  const subTickIndex = Math.floor(now / 750);
  const tickNoise = hashSlot(assetId, subTickIndex);
  const smoothProgress = progress * progress * (3 - 2 * progress);
  const currentLive = Number((activeOpen + (activeTarget - activeOpen) * smoothProgress + tickNoise * baseVol * 0.35).toFixed(precision));

  candles.push({
    time: currentSlot,
    open: activeOpen,
    high: Number(Math.max(activeOpen, currentLive).toFixed(precision)),
    low: Number(Math.min(activeOpen, currentLive).toFixed(precision)),
    close: currentLive,
    volume: Math.floor(50 + progress * 200)
  });

  return candles;
};

// Retrieve candles for asset and timeframe, creating persistent store if not exists
export const getCandleSeries = (
  assetId: string,
  basePrice: number,
  timeFrame: string
): CandleData[] => {
  const canonicalBase = getCanonicalPrice(assetId, basePrice);
  const normTf = normalizeTimeFrame(timeFrame);
  const key = `${assetId}_${normTf}`;
  const intervalMs = getTimeFrameMs(normTf);
  const now = Date.now();
  const currentSlot = Math.floor(now / intervalMs) * intervalMs;
  
  let series = candleCache.get(key);
  // If cache is empty or older than 5 candles, re-initialize deterministically
  if (!series || series.length === 0 || (series[series.length - 1].time < currentSlot - 5 * intervalMs)) {
    series = generateInitialCandles(assetId, canonicalBase, normTf, 350);
    candleCache.set(key, series);
  }
  return series;
};

// Compute the current live synchronized price for any asset at this exact millisecond
// Features:
// 1. Organic, realistic price discovery with smooth multi-frequency market waves (zero unnatural 160ms oscillation).
// 2. Buttery smooth Hermite interpolation between ticks.
// 3. Directional trade steering uses gentle S-curve drift with natural market breathing, pullbacks, and wicks.
//    Never jumps, never jerks, and looks 100% authentic and fair to the trader.
export const getSynchronizedLivePrice = (
  assetId: string,
  basePrice: number,
  override?: 'BUY' | 'SELL' | MarketOverrideConfig
): number => {
  const canonicalBase = getCanonicalPrice(assetId, basePrice);
  const now = Date.now();
  const intervalMs = 60000; // 1-minute base interval
  const currentSlot = Math.floor(now / intervalMs) * intervalMs;
  const currentSlotIndex = Math.floor((currentSlot - GLOBAL_EPOCH) / intervalMs);
  
  const slotOpen = getSlotPrice(assetId, currentSlotIndex - 1, canonicalBase, intervalMs);
  const slotTarget = getSlotPrice(assetId, currentSlotIndex, canonicalBase, intervalMs);
  const progress = Math.min(1, Math.max(0, (now - currentSlot) / intervalMs));
  const precision = getPrecision(canonicalBase);
  const pip = Math.pow(10, -precision);
  
  // Asset-proportional micro-volatility modulated by Admin global mood
  let moodBias = 0;
  let moodVolMultiplier = 1.0;
  if (activeGlobalMood === 'BULLISH') {
    moodBias = canonicalBase * 0.00015 + pip * 1.5;
  } else if (activeGlobalMood === 'BEARISH') {
    moodBias = -(canonicalBase * 0.00015 + pip * 1.5);
  } else if (activeGlobalMood === 'HIGH_VOLATILITY') {
    moodVolMultiplier = 1.6;
  }

  const baseVol = Math.max(canonicalBase * 0.00028, pip * 2.5) * moodVolMultiplier;

  // Smooth Hermite-interpolated micro-ticks with 650ms cadence (gentle and market-like)
  const tickPeriod = 650;
  const subTickIndex = Math.floor(now / tickPeriod);
  const subTickPhase = (now % tickPeriod) / tickPeriod;
  const smoothSubPhase = subTickPhase * subTickPhase * (3 - 2 * subTickPhase);
  const tick1 = hashSlot(assetId, subTickIndex);
  const tick2 = hashSlot(assetId, subTickIndex + 1);
  const interpolatedTick = tick1 + (tick2 - tick1) * smoothSubPhase;

  // Realistic market breathing waves with natural, slow periods (4s, 12s, 36s - NOT 160ms!)
  const wave1 = Math.sin(now / 3800) * 0.28;
  const wave2 = Math.cos(now / 11500) * 0.22;
  const wave3 = Math.sin(now / 34000) * 0.18;
  const microWobble = (wave1 + wave2 + wave3) * baseVol * 0.35;
  const microNoise = interpolatedTick * baseVol * 0.45;

  // Smooth S-curve transition between candle slot open and target + admin mood bias
  const smoothProgress = progress * progress * (3 - 2 * progress);
  const naturalPrice = slotOpen + (slotTarget - slotOpen) * smoothProgress + microNoise + microWobble + moodBias;
  
  // Extract override parameters
  let overrideDirection: 'BUY' | 'SELL' | undefined = undefined;
  let startedAt = currentSlot;
  let expiresAt = currentSlot + 60000;
  let durationSeconds = 60;
  let entryPrice: number | undefined = undefined;

  if (typeof override === 'string') {
    if (override === 'BUY' || override === 'SELL') {
      overrideDirection = override;
      startedAt = currentSlot;
      expiresAt = currentSlot + 60000;
      durationSeconds = 60;
    }
  } else if (override && (override.direction === 'BUY' || override.direction === 'SELL')) {
    const isStillActive = !override.expiresAt || override.expiresAt > now;
    const isRecent = override.expiresAt && (now - override.expiresAt < 25000); // 25s smooth decay window
    if (isStillActive || isRecent) {
      overrideDirection = override.direction;
      durationSeconds = override.durationSeconds || 60;
      startedAt = override.startedAt || (override.expiresAt ? override.expiresAt - durationSeconds * 1000 : currentSlot);
      expiresAt = override.expiresAt || (startedAt + durationSeconds * 1000);
      entryPrice = override.entryPrice;
    }
  }

  // If no active or recent override, return deterministic natural price
  if (!overrideDirection) {
    if (naturalPrice <= 0 || isNaN(naturalPrice)) return canonicalBase;
    return Number(naturalPrice.toFixed(precision));
  }

  // -------------------------------------------------------------
  // Active Trade / Steered Price Engine:
  // Subtly influences the natural market price by a realistic micro-margin (1.5 to 2.5 pips).
  // 100% preserves natural market breathing, pullbacks, and wicks without artificial spikes.
  // -------------------------------------------------------------
  // Realistic market move distance (1.5 to 2.5 pips)
  const targetMargin = Math.max(canonicalBase * 0.00020, 2.0 * pip);

  const totalMs = Math.max(5000, expiresAt - startedAt);
  const elapsedMs = Math.max(0, now - startedAt);

  if (now <= expiresAt) {
    const t = Math.min(1, Math.max(0, elapsedMs / totalMs));

    // Smooth easeInOut S-curve:
    // At t = 0: sCurve is 0 (exact smooth start at natural price).
    // Mid-trade: smooth progressive drift with realistic market fluctuations.
    // Near expiry: settles safely on the target win/loss side.
    const sCurve = t * t * (3 - 2 * t);
    
    // Directional signed move: positive for BUY, negative for SELL
    const signedMargin = overrideDirection === 'BUY' ? targetMargin : -targetMargin;
    
    // Gentle drift offset added to the natural price curve
    const driftOffset = signedMargin * sCurve;
    
    let finalPrice = naturalPrice + driftOffset;

    if (finalPrice <= 0 || isNaN(finalPrice)) finalPrice = canonicalBase;
    return Number(finalPrice.toFixed(precision));
  } else {
    // Post-trade smooth decay back to baseline over 15 seconds
    const postElapsed = now - expiresAt;
    const decayT = Math.min(1, postElapsed / 15000);
    const decayWeight = (1 - decayT) * (1 - decayT); // Smooth ease-out from 1 to 0

    const signedMargin = overrideDirection === 'BUY' ? targetMargin : -targetMargin;
    const decayedOffset = signedMargin * decayWeight;
    
    let finalPrice = naturalPrice + decayedOffset;

    if (finalPrice <= 0 || isNaN(finalPrice)) finalPrice = canonicalBase;
    return Number(finalPrice.toFixed(precision));
  }
};

// Feed live tick into active timeframes for an asset (optimized for zero garbage collection overhead and timeline durability)
export const pushLiveTick = (assetId: string, currentPrice: number) => {
  if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) return;
  const canonicalBase = getCanonicalPrice(assetId, currentPrice);
  const timeFrames: ('5s' | '15s' | '30s' | '1m' | '3m' | '5m' | '15m')[] = ['5s', '15s', '30s', '1m', '3m', '5m', '15m'];
  const now = Date.now();

  for (let i = 0; i < timeFrames.length; i++) {
    const tf = timeFrames[i];
    const key = `${assetId}_${tf}`;
    let series = candleCache.get(key);
    
    const intervalMs = getTimeFrameMs(tf);
    const currentSlot = Math.floor(now / intervalMs) * intervalMs;

    if (!series || series.length === 0) {
      // Lazy initialization on first tick with canonical price
      series = generateInitialCandles(assetId, canonicalBase, tf, 250);
      candleCache.set(key, series);
      continue;
    }

    const lastIndex = series.length - 1;
    const lastCandle = series[lastIndex];

    if (!lastCandle) continue;

    if (lastCandle.time === currentSlot) {
      // In-place mutation of active candle
      lastCandle.close = currentPrice;
      if (currentPrice > lastCandle.high) lastCandle.high = currentPrice;
      if (currentPrice < lastCandle.low) lastCandle.low = currentPrice;
    } else if (currentSlot > lastCandle.time) {
      // Backfill any missed completed candles if tab was in background
      const missedCount = Math.floor((currentSlot - lastCandle.time) / intervalMs);
      if (missedCount > 1 && missedCount < 60) {
        let prevC = lastCandle.close;
        for (let m = 1; m < missedCount; m++) {
          const missedTime = lastCandle.time + m * intervalMs;
          const slotC = getSlotCandle(assetId, missedTime, canonicalBase, intervalMs);
          slotC.open = prevC;
          slotC.high = Math.max(prevC, slotC.close, slotC.high);
          slotC.low = Math.min(prevC, slotC.close, slotC.low);
          series.push(slotC);
          prevC = slotC.close;
        }
      }

      // New candle interval starts with perfect continuity: open = prev.close
      const prevClose = series[series.length - 1].close;
      const newCandle: CandleData = {
        time: currentSlot,
        open: prevClose,
        high: Math.max(prevClose, currentPrice),
        low: Math.min(prevClose, currentPrice),
        close: currentPrice,
        volume: 25
      };
      series.push(newCandle);

      // Memory efficiency: maintain max 500 historical candles
      if (series.length > 500) {
        series.splice(0, series.length - 500);
      }
    }
  }
};
