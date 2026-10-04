// Comprehensive High-Definition Real Asset Logos with Preloading, Instant Caching, and Image Locking
// Loaded directly from official & high-speed CDNs: Clearbit (128px high-DPI), SpotHQ (128px/SVG), CoinCap, CoinGecko, and FlagCDN (160px)

export interface RealAssetImageConfig {
  primary: string;
  fallback?: string;
  bg?: string;
  fit?: 'contain' | 'cover';
}

// -------------------------------------------------------------
// IMAGE LOCKING & PERSISTENT DETECTED CLEAR IMAGE CACHE
// -------------------------------------------------------------
const MEMORY_LOCKED_IMAGES = new Map<string, string>();
const SESSION_STORAGE_KEY = 'tradexora_locked_asset_images_v2';

// Load stored locked image mappings on startup
try {
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') MEMORY_LOCKED_IMAGES.set(k, v);
    }
  }
} catch (e) {
  // Ignore sessionStorage errors in sandbox
}

export const getLockedImage = (key: string, defaultUrl: string): string => {
  return MEMORY_LOCKED_IMAGES.get(key) || defaultUrl;
};

export const lockImage = (key: string, url: string) => {
  if (!key || !url) return;
  MEMORY_LOCKED_IMAGES.set(key, url);
  try {
    const obj: Record<string, string> = {};
    MEMORY_LOCKED_IMAGES.forEach((val, k) => {
      obj[k] = val;
    });
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {}
};

// -------------------------------------------------------------
// HIGH-DEFINITION ASSET LOGO DICTIONARY (128px Retina Sharp)
// -------------------------------------------------------------
export const REAL_ASSET_IMAGES: Record<string, RealAssetImageConfig> = {
  // ========================================================
  // 1. GLOBAL STOCKS (128px High-DPI Clearbit + Unavatar / Favicon)
  // ========================================================
  'AAPL': {
    primary: 'https://logo.clearbit.com/apple.com?size=128',
    fallback: 'https://unavatar.io/apple.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'TSLA': {
    primary: 'https://logo.clearbit.com/tesla.com?size=128',
    fallback: 'https://unavatar.io/tesla.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'MSFT': {
    primary: 'https://logo.clearbit.com/microsoft.com?size=128',
    fallback: 'https://unavatar.io/microsoft.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'AMZN': {
    primary: 'https://logo.clearbit.com/amazon.com?size=128',
    fallback: 'https://unavatar.io/amazon.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'GOOGL': {
    primary: 'https://logo.clearbit.com/google.com?size=128',
    fallback: 'https://unavatar.io/google.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'GOOG': {
    primary: 'https://logo.clearbit.com/google.com?size=128',
    fallback: 'https://unavatar.io/google.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'INTC': {
    primary: 'https://logo.clearbit.com/intel.com?size=128',
    fallback: 'https://unavatar.io/intel.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'DIS': {
    primary: 'https://logo.clearbit.com/disney.com?size=128',
    fallback: 'https://unavatar.io/disney.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'V': {
    primary: 'https://logo.clearbit.com/visa.com?size=128',
    fallback: 'https://unavatar.io/visa.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'MA': {
    primary: 'https://logo.clearbit.com/mastercard.com?size=128',
    fallback: 'https://unavatar.io/mastercard.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'NFLX': {
    primary: 'https://logo.clearbit.com/netflix.com?size=128',
    fallback: 'https://unavatar.io/netflix.com',
    bg: '#000000',
    fit: 'contain',
  },
  'BIDU': {
    primary: 'https://logo.clearbit.com/baidu.com?size=128',
    fallback: 'https://unavatar.io/baidu.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'TSM': {
    primary: 'https://logo.clearbit.com/tsmc.com?size=128',
    fallback: 'https://unavatar.io/tsmc.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'BRK': {
    primary: 'https://logo.clearbit.com/berkshirehathaway.com?size=128',
    fallback: 'https://unavatar.io/berkshirehathaway.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'JPM': {
    primary: 'https://logo.clearbit.com/jpmorganchase.com?size=128',
    fallback: 'https://unavatar.io/jpmorganchase.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'WMT': {
    primary: 'https://logo.clearbit.com/walmart.com?size=128',
    fallback: 'https://unavatar.io/walmart.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'ORCL': {
    primary: 'https://logo.clearbit.com/oracle.com?size=128',
    fallback: 'https://unavatar.io/oracle.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'AVGO': {
    primary: 'https://logo.clearbit.com/broadcom.com?size=128',
    fallback: 'https://unavatar.io/broadcom.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'LLY': {
    primary: 'https://logo.clearbit.com/lilly.com?size=128',
    fallback: 'https://unavatar.io/lilly.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'XOM': {
    primary: 'https://logo.clearbit.com/exxonmobil.com?size=128',
    fallback: 'https://unavatar.io/exxonmobil.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'COST': {
    primary: 'https://logo.clearbit.com/costco.com?size=128',
    fallback: 'https://unavatar.io/costco.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'NKE': {
    primary: 'https://logo.clearbit.com/nike.com?size=128',
    fallback: 'https://unavatar.io/nike.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'ADBE': {
    primary: 'https://logo.clearbit.com/adobe.com?size=128',
    fallback: 'https://unavatar.io/adobe.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'PLTR': {
    primary: 'https://logo.clearbit.com/palantir.com?size=128',
    fallback: 'https://unavatar.io/palantir.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'COIN': {
    primary: 'https://logo.clearbit.com/coinbase.com?size=128',
    fallback: 'https://unavatar.io/coinbase.com',
    bg: '#0052FF',
    fit: 'contain',
  },
  'SPOT': {
    primary: 'https://logo.clearbit.com/spotify.com?size=128',
    fallback: 'https://unavatar.io/spotify.com',
    bg: '#1DB954',
    fit: 'contain',
  },
  'UBER': {
    primary: 'https://logo.clearbit.com/uber.com?size=128',
    fallback: 'https://unavatar.io/uber.com',
    bg: '#000000',
    fit: 'contain',
  },
  'PEP': {
    primary: 'https://logo.clearbit.com/pepsico.com?size=128',
    fallback: 'https://unavatar.io/pepsico.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'MCD': {
    primary: 'https://logo.clearbit.com/mcdonalds.com?size=128',
    fallback: 'https://unavatar.io/mcdonalds.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'CRM': {
    primary: 'https://logo.clearbit.com/salesforce.com?size=128',
    fallback: 'https://unavatar.io/salesforce.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'CVX': {
    primary: 'https://logo.clearbit.com/chevron.com?size=128',
    fallback: 'https://unavatar.io/chevron.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'BAC': {
    primary: 'https://logo.clearbit.com/bankofamerica.com?size=128',
    fallback: 'https://unavatar.io/bankofamerica.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'HD': {
    primary: 'https://logo.clearbit.com/homedepot.com?size=128',
    fallback: 'https://unavatar.io/homedepot.com',
    bg: '#F96302',
    fit: 'contain',
  },
  'JNJ': {
    primary: 'https://logo.clearbit.com/jnj.com?size=128',
    fallback: 'https://unavatar.io/jnj.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'PG': {
    primary: 'https://logo.clearbit.com/pg.com?size=128',
    fallback: 'https://unavatar.io/pg.com',
    bg: '#003CAE',
    fit: 'contain',
  },
  'CSCO': {
    primary: 'https://logo.clearbit.com/cisco.com?size=128',
    fallback: 'https://unavatar.io/cisco.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'VZ': {
    primary: 'https://logo.clearbit.com/verizon.com?size=128',
    fallback: 'https://unavatar.io/verizon.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'T': {
    primary: 'https://logo.clearbit.com/att.com?size=128',
    fallback: 'https://unavatar.io/att.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'PFE': {
    primary: 'https://logo.clearbit.com/pfizer.com?size=128',
    fallback: 'https://unavatar.io/pfizer.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'BA': {
    primary: 'https://logo.clearbit.com/boeing.com?size=128',
    fallback: 'https://unavatar.io/boeing.com',
    bg: '#0033A0',
    fit: 'contain',
  },
  'QCOM': {
    primary: 'https://logo.clearbit.com/qualcomm.com?size=128',
    fallback: 'https://unavatar.io/qualcomm.com',
    bg: '#3253DC',
    fit: 'contain',
  },
  'ARM': {
    primary: 'https://logo.clearbit.com/arm.com?size=128',
    fallback: 'https://unavatar.io/arm.com',
    bg: '#0091BD',
    fit: 'contain',
  },
  'SMCI': {
    primary: 'https://logo.clearbit.com/supermicro.com?size=128',
    fallback: 'https://unavatar.io/supermicro.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'MRNA': {
    primary: 'https://logo.clearbit.com/modernatx.com?size=128',
    fallback: 'https://unavatar.io/modernatx.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'ABNB': {
    primary: 'https://logo.clearbit.com/airbnb.com?size=128',
    fallback: 'https://unavatar.io/airbnb.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'SHOP': {
    primary: 'https://logo.clearbit.com/shopify.com?size=128',
    fallback: 'https://unavatar.io/shopify.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'SQ': {
    primary: 'https://logo.clearbit.com/block.xyz?size=128',
    fallback: 'https://unavatar.io/block.xyz',
    bg: '#000000',
    fit: 'contain',
  },
  'SBUX': {
    primary: 'https://logo.clearbit.com/starbucks.com?size=128',
    fallback: 'https://unavatar.io/starbucks.com',
    bg: '#00704A',
    fit: 'contain',
  },
  'BMW': {
    primary: 'https://logo.clearbit.com/bmw.com?size=128',
    fallback: 'https://unavatar.io/bmw.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },

  // ========================================================
  // 2. INDIAN EQUITIES & CORPORATE GIANTS (Clearbit 128px)
  // ========================================================
  'RELIANCE': {
    primary: 'https://logo.clearbit.com/ril.com?size=128',
    fallback: 'https://unavatar.io/ril.com',
    bg: '#002B49',
    fit: 'contain',
  },
  'TCS': {
    primary: 'https://logo.clearbit.com/tcs.com?size=128',
    fallback: 'https://unavatar.io/tcs.com',
    bg: '#002D62',
    fit: 'contain',
  },
  'HDFCBANK': {
    primary: 'https://logo.clearbit.com/hdfcbank.com?size=128',
    fallback: 'https://unavatar.io/hdfcbank.com',
    bg: '#004C8F',
    fit: 'contain',
  },
  'HDFC': {
    primary: 'https://logo.clearbit.com/hdfcbank.com?size=128',
    fallback: 'https://unavatar.io/hdfcbank.com',
    bg: '#004C8F',
    fit: 'contain',
  },
  'INFY': {
    primary: 'https://logo.clearbit.com/infosys.com?size=128',
    fallback: 'https://unavatar.io/infosys.com',
    bg: '#007CC3',
    fit: 'contain',
  },
  'ICICIBANK': {
    primary: 'https://logo.clearbit.com/icicibank.com?size=128',
    fallback: 'https://unavatar.io/icicibank.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'TATAMOTORS': {
    primary: 'https://logo.clearbit.com/tatamotors.com?size=128',
    fallback: 'https://unavatar.io/tatamotors.com',
    bg: '#005A9C',
    fit: 'contain',
  },
  'SBIN': {
    primary: 'https://logo.clearbit.com/sbi.co.in?size=128',
    fallback: 'https://unavatar.io/sbi.co.in',
    bg: '#280071',
    fit: 'contain',
  },
  'BHARTIARTL': {
    primary: 'https://logo.clearbit.com/airtel.in?size=128',
    fallback: 'https://unavatar.io/airtel.in',
    bg: '#E40000',
    fit: 'contain',
  },
  'ITC': {
    primary: 'https://logo.clearbit.com/itcportal.com?size=128',
    fallback: 'https://unavatar.io/itcportal.com',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'KOTAKBANK': {
    primary: 'https://logo.clearbit.com/kotak.com?size=128',
    fallback: 'https://unavatar.io/kotak.com',
    bg: '#ED1C24',
    fit: 'contain',
  },
  'LT': {
    primary: 'https://logo.clearbit.com/larsentoubro.com?size=128',
    fallback: 'https://unavatar.io/larsentoubro.com',
    bg: '#003366',
    fit: 'contain',
  },
  'HINDUNILVR': {
    primary: 'https://logo.clearbit.com/hul.co.in?size=128',
    fallback: 'https://unavatar.io/hul.co.in',
    bg: '#00508F',
    fit: 'contain',
  },
  'AXISBANK': {
    primary: 'https://logo.clearbit.com/axisbank.com?size=128',
    fallback: 'https://unavatar.io/axisbank.com',
    bg: '#97144D',
    fit: 'contain',
  },
  'MARUTI': {
    primary: 'https://logo.clearbit.com/marutisuzuki.com?size=128',
    fallback: 'https://unavatar.io/marutisuzuki.com',
    bg: '#002B49',
    fit: 'contain',
  },
  'BAJFINANCE': {
    primary: 'https://logo.clearbit.com/bajajfinserv.in?size=128',
    fallback: 'https://unavatar.io/bajajfinserv.in',
    bg: '#0072BB',
    fit: 'contain',
  },

  // ========================================================
  // 3. CRYPTOCURRENCIES (SpotHQ 128px PNG + Vector SVG)
  // ========================================================
  'ETH': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/eth.svg',
    bg: '#627EEA',
    fit: 'contain',
  },
  'SOL': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/sol.png',
    fallback: 'https://assets.coincap.io/assets/icons/sol@2x.png',
    bg: '#000000',
    fit: 'contain',
  },
  'XRP': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xrp.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/xrp.svg',
    bg: '#23292F',
    fit: 'contain',
  },
  'DOGE': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/doge.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/doge.svg',
    bg: '#C2A633',
    fit: 'contain',
  },
  'SHIB': {
    primary: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
    fallback: 'https://assets.coincap.io/assets/icons/shib@2x.png',
    bg: '#FFA409',
    fit: 'contain',
  },
  'POL': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/matic.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/matic.svg',
    bg: '#8247E5',
    fit: 'contain',
  },
  'MATIC': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/matic.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/matic.svg',
    bg: '#8247E5',
    fit: 'contain',
  },
  'LINK': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/link.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/link.svg',
    bg: '#375BD2',
    fit: 'contain',
  },
  'LTC': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/ltc.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/ltc.svg',
    bg: '#345D9D',
    fit: 'contain',
  },
  'DOT': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/dot.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/dot.svg',
    bg: '#E6007A',
    fit: 'contain',
  },
  'ADA': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/ada.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/ada.svg',
    bg: '#0033AD',
    fit: 'contain',
  },
  'NEAR': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/near.png',
    fallback: 'https://assets.coincap.io/assets/icons/near@2x.png',
    bg: '#000000',
    fit: 'contain',
  },
  'SUI': {
    primary: 'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png',
    fallback: 'https://assets.coincap.io/assets/icons/sui@2x.png',
    bg: '#4DA2FF',
    fit: 'contain',
  },
  'APT': {
    primary: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
    fallback: 'https://assets.coincap.io/assets/icons/apt@2x.png',
    bg: '#212121',
    fit: 'contain',
  },
  'RENDER': {
    primary: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
    fallback: 'https://assets.coincap.io/assets/icons/rndr@2x.png',
    bg: '#000000',
    fit: 'contain',
  },
  'UNI': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/uni.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/uni.svg',
    bg: '#FF007A',
    fit: 'contain',
  },
  'ATOM': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/atom.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/atom.svg',
    bg: '#2E3148',
    fit: 'contain',
  },
  'ARB': {
    primary: 'https://assets.coingecko.com/coins/images/16547/large/arbitrum-shield.png',
    fallback: 'https://assets.coincap.io/assets/icons/arb@2x.png',
    bg: '#28A0F0',
    fit: 'contain',
  },
  'INJ': {
    primary: 'https://assets.coingecko.com/coins/images/12882/large/injective_logo.png',
    fallback: 'https://assets.coincap.io/assets/icons/inj@2x.png',
    bg: '#00F2FE',
    fit: 'contain',
  },
  'XLM': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xlm.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/xlm.svg',
    bg: '#14B6F7',
    fit: 'contain',
  },
  'ICP': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/icp.png',
    fallback: 'https://assets.coincap.io/assets/icons/icp@2x.png',
    bg: '#29ABE2',
    fit: 'contain',
  },
  'FIL': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/fil.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/fil.svg',
    bg: '#0090FF',
    fit: 'contain',
  },
  'VET': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/vet.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/vet.svg',
    bg: '#15BDFF',
    fit: 'contain',
  },
  'XMR': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xmr.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/xmr.svg',
    bg: '#FF6600',
    fit: 'contain',
  },
  'AAVE': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/aave.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/aave.svg',
    bg: '#B6509E',
    fit: 'contain',
  },
  'ALGO': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/algo.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/algo.svg',
    bg: '#000000',
    fit: 'contain',
  },
  'THETA': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/theta.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/theta.svg',
    bg: '#2AB8E6',
    fit: 'contain',
  },
  'EGLD': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/egld.png',
    fallback: 'https://assets.coincap.io/assets/icons/egld@2x.png',
    bg: '#1B46C2',
    fit: 'contain',
  },
  'SAND': {
    primary: 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg',
    fallback: 'https://assets.coincap.io/assets/icons/sand@2x.png',
    bg: '#0084FF',
    fit: 'contain',
  },
  'MANA': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/mana.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/mana.svg',
    bg: '#FF2D55',
    fit: 'contain',
  },
  'AXS': {
    primary: 'https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png',
    fallback: 'https://assets.coincap.io/assets/icons/axs@2x.png',
    bg: '#0055D5',
    fit: 'contain',
  },
  'GALA': {
    primary: 'https://assets.coingecko.com/coins/images/12493/large/GALA-COINGECKO.png',
    fallback: 'https://assets.coincap.io/assets/icons/gala@2x.png',
    bg: '#000000',
    fit: 'contain',
  },
  'QNT': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/qnt.png',
    fallback: 'https://assets.coincap.io/assets/icons/qnt@2x.png',
    bg: '#000000',
    fit: 'contain',
  },
  'FTM': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/ftm.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/ftm.svg',
    bg: '#1969FF',
    fit: 'contain',
  },
  'HNT': {
    primary: 'https://assets.coingecko.com/coins/images/4284/large/Helium_HNT.png',
    fallback: 'https://assets.coincap.io/assets/icons/hnt@2x.png',
    bg: '#474DFF',
    fit: 'contain',
  },
  'MKR': {
    primary: 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/mkr.png',
    fallback: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/mkr.svg',
    bg: '#1BAC9C',
    fit: 'contain',
  },
  'STX': {
    primary: 'https://assets.coingecko.com/coins/images/2069/large/Stacks_logo_full.png',
    fallback: 'https://assets.coincap.io/assets/icons/stx@2x.png',
    bg: '#5546FF',
    fit: 'contain',
  },

  // ========================================================
  // 4. COMMODITIES & PRECIOUS METALS (Ultra-Crisp Visual Assets)
  // ========================================================
  'XAU': {
    primary: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=160&auto=format&fit=crop&q=80',
    fallback: 'https://files.catbox.moe/idrymu.png',
    bg: '#D97706',
    fit: 'cover',
  },
  'XAUEUR': {
    primary: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=160&auto=format&fit=crop&q=80',
    fallback: 'https://files.catbox.moe/idrymu.png',
    bg: '#D97706',
    fit: 'cover',
  },
  'XAG': {
    primary: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=160&auto=format&fit=crop&q=80',
    bg: '#64748B',
    fit: 'cover',
  },
  'XAGEUR': {
    primary: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=160&auto=format&fit=crop&q=80',
    bg: '#64748B',
    fit: 'cover',
  },
  'XPT': {
    primary: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=160&auto=format&fit=crop&q=80',
    bg: '#94A3B8',
    fit: 'cover',
  },
  'XPD': {
    primary: 'https://images.unsplash.com/photo-1533749047139-189de3cf06d3?w=160&auto=format&fit=crop&q=80',
    bg: '#475569',
    fit: 'cover',
  },
  'BRENT': {
    primary: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=160&auto=format&fit=crop&q=80',
    bg: '#0F172A',
    fit: 'cover',
  },
  'WTI': {
    primary: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=160&auto=format&fit=crop&q=80',
    bg: '#991B1B',
    fit: 'cover',
  },
  'NG': {
    primary: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=160&auto=format&fit=crop&q=80',
    bg: '#0284C7',
    fit: 'cover',
  },
  'HG': {
    primary: 'https://images.unsplash.com/photo-1599818816933-2868c2d5b642?w=160&auto=format&fit=crop&q=80',
    bg: '#EA580C',
    fit: 'cover',
  },
  'COFFEE': {
    primary: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=160&auto=format&fit=crop&q=80',
    bg: '#78350F',
    fit: 'cover',
  },
  'COCOA': {
    primary: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=160&auto=format&fit=crop&q=80',
    bg: '#451A03',
    fit: 'cover',
  },
  'WHEAT': {
    primary: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=160&auto=format&fit=crop&q=80',
    bg: '#CA8A04',
    fit: 'cover',
  },
  'ALU': {
    primary: 'https://images.unsplash.com/photo-1588854337221-4cf9fa96059c?w=160&auto=format&fit=crop&q=80',
    bg: '#94A3B8',
    fit: 'cover',
  },
  'ZNC': {
    primary: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=160&auto=format&fit=crop&q=80',
    bg: '#64748B',
    fit: 'cover',
  },
  'NIC': {
    primary: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=160&auto=format&fit=crop&q=80',
    bg: '#475569',
    fit: 'cover',
  },

  // ========================================================
  // 5. INDICES & BENCHMARKS (Clearbit 128px Official Logos)
  // ========================================================
  'NDX': {
    primary: 'https://logo.clearbit.com/nasdaq.com?size=128',
    fallback: 'https://unavatar.io/nasdaq.com',
    bg: '#003366',
    fit: 'contain',
  },
  'SPX': {
    primary: 'https://logo.clearbit.com/spglobal.com?size=128',
    fallback: 'https://unavatar.io/spglobal.com',
    bg: '#ED1C24',
    fit: 'contain',
  },
  'DJI': {
    primary: 'https://logo.clearbit.com/dowjones.com?size=128',
    fallback: 'https://unavatar.io/dowjones.com',
    bg: '#002B49',
    fit: 'contain',
  },
  'GER40': {
    primary: 'https://logo.clearbit.com/deutsche-boerse.com?size=128',
    fallback: 'https://flagcdn.com/w160/de.png',
    bg: '#000000',
    fit: 'contain',
  },
  'UK100': {
    primary: 'https://logo.clearbit.com/lseg.com?size=128',
    fallback: 'https://flagcdn.com/w160/gb.png',
    bg: '#002B49',
    fit: 'contain',
  },
  'JP225': {
    primary: 'https://logo.clearbit.com/nikkei.com?size=128',
    fallback: 'https://flagcdn.com/w160/jp.png',
    bg: '#FFFFFF',
    fit: 'contain',
  },
  'HSI': {
    primary: 'https://logo.clearbit.com/hangseng.com?size=128',
    fallback: 'https://flagcdn.com/w160/hk.png',
    bg: '#008542',
    fit: 'contain',
  },
  'CAC40': {
    primary: 'https://logo.clearbit.com/euronext.com?size=128',
    fallback: 'https://flagcdn.com/w160/fr.png',
    bg: '#001A72',
    fit: 'contain',
  },
  'SX5E': {
    primary: 'https://logo.clearbit.com/stoxx.com?size=128',
    fallback: 'https://flagcdn.com/w160/eu.png',
    bg: '#003399',
    fit: 'contain',
  },
  'ASX200': {
    primary: 'https://logo.clearbit.com/asx.com.au?size=128',
    fallback: 'https://flagcdn.com/w160/au.png',
    bg: '#000000',
    fit: 'contain',
  },
  'IBEX35': {
    primary: 'https://logo.clearbit.com/bolsasymercados.es?size=128',
    fallback: 'https://flagcdn.com/w160/es.png',
    bg: '#003366',
    fit: 'contain',
  },
  'NIFTY50': {
    primary: 'https://logo.clearbit.com/nseindia.com?size=128',
    fallback: 'https://flagcdn.com/w160/in.png',
    bg: '#0B132B',
    fit: 'contain',
  },
  'NIFTY': {
    primary: 'https://logo.clearbit.com/nseindia.com?size=128',
    fallback: 'https://flagcdn.com/w160/in.png',
    bg: '#0B132B',
    fit: 'contain',
  },
  'BANKNIFTY': {
    primary: 'https://logo.clearbit.com/nseindia.com?size=128',
    fallback: 'https://flagcdn.com/w160/in.png',
    bg: '#064E3B',
    fit: 'contain',
  },
  'SENSEX': {
    primary: 'https://logo.clearbit.com/bseindia.com?size=128',
    fallback: 'https://flagcdn.com/w160/in.png',
    bg: '#1E40AF',
    fit: 'contain',
  },
  'VIX': {
    primary: 'https://logo.clearbit.com/cboe.com?size=128',
    fallback: 'https://unavatar.io/cboe.com',
    bg: '#002B49',
    fit: 'contain',
  },
  'RUT': {
    primary: 'https://logo.clearbit.com/ftserussell.com?size=128',
    fallback: 'https://unavatar.io/ftserussell.com',
    bg: '#002B49',
    fit: 'contain',
  },
  'SPY': {
    primary: 'https://logo.clearbit.com/ssga.com?size=128',
    fallback: 'https://unavatar.io/ssga.com',
    bg: '#002B49',
    fit: 'contain',
  },
  'QID': {
    primary: 'https://logo.clearbit.com/proshares.com?size=128',
    fallback: 'https://unavatar.io/proshares.com',
    bg: '#1E293B',
    fit: 'contain',
  },
  'UVXY': {
    primary: 'https://logo.clearbit.com/proshares.com?size=128',
    fallback: 'https://unavatar.io/proshares.com',
    bg: '#1E293B',
    fit: 'contain',
  },
  'BRZU': {
    primary: 'https://logo.clearbit.com/direxion.com?size=128',
    fallback: 'https://flagcdn.com/w160/br.png',
    bg: '#009739',
    fit: 'contain',
  },
  'IYR': {
    primary: 'https://logo.clearbit.com/ishares.com?size=128',
    fallback: 'https://unavatar.io/ishares.com',
    bg: '#000000',
    fit: 'contain',
  },
  'SONY': {
    primary: 'https://logo.clearbit.com/sony.com?size=128',
    fallback: 'https://unavatar.io/sony.com',
    bg: '#000000',
    fit: 'contain',
  },
  'KOSPI': {
    primary: 'https://flagcdn.com/w160/kr.png',
    fallback: 'https://logo.clearbit.com/krx.co.kr?size=128',
    bg: '#003478',
    fit: 'contain',
  },
  'DXY': {
    primary: 'https://flagcdn.com/w160/us.png',
    fallback: 'https://logo.clearbit.com/marketwatch.com?size=128',
    bg: '#1E293B',
    fit: 'contain',
  },
};

// Match asset by symbol or common name keywords
export const matchRealAssetImage = (symbol: string, name: string): RealAssetImageConfig | null => {
  const s = (symbol || '').toUpperCase().trim();
  const n = (name || '').toLowerCase().trim();

  // 1. Direct exact symbol match
  if (REAL_ASSET_IMAGES[s]) {
    return REAL_ASSET_IMAGES[s];
  }

  // 2. Clean symbol without slash or suffix
  const cleanSym = s.replace(/[^A-Z0-9]/g, '');
  if (REAL_ASSET_IMAGES[cleanSym]) {
    return REAL_ASSET_IMAGES[cleanSym];
  }

  // 3. Keyword matching for common names
  if (n.includes('nvidia') || n.includes('nvda')) return REAL_ASSET_IMAGES['NVDA'];
  if (n.includes('bitcoin') || n.includes('btc')) return REAL_ASSET_IMAGES['BTC'];
  if (n.includes('apple')) return REAL_ASSET_IMAGES['AAPL'];
  if (n.includes('tesla')) return REAL_ASSET_IMAGES['TSLA'];
  if (n.includes('microsoft')) return REAL_ASSET_IMAGES['MSFT'];
  if (n.includes('amazon')) return REAL_ASSET_IMAGES['AMZN'];
  if (n.includes('google') || n.includes('alphabet')) return REAL_ASSET_IMAGES['GOOGL'];
  if (n.includes('intel')) return REAL_ASSET_IMAGES['INTC'];
  if (n.includes('disney')) return REAL_ASSET_IMAGES['DIS'];
  if (n.includes('visa')) return REAL_ASSET_IMAGES['V'];
  if (n.includes('mastercard')) return REAL_ASSET_IMAGES['MA'];
  if (n.includes('netflix')) return REAL_ASSET_IMAGES['NFLX'];
  if (n.includes('baidu')) return REAL_ASSET_IMAGES['BIDU'];
  if (n.includes('tsmc') || n.includes('taiwan semi')) return REAL_ASSET_IMAGES['TSM'];
  if (n.includes('berkshire')) return REAL_ASSET_IMAGES['BRK'];
  if (n.includes('jpmorgan') || n.includes('jp morgan')) return REAL_ASSET_IMAGES['JPM'];
  if (n.includes('walmart')) return REAL_ASSET_IMAGES['WMT'];
  if (n.includes('oracle')) return REAL_ASSET_IMAGES['ORCL'];
  if (n.includes('broadcom')) return REAL_ASSET_IMAGES['AVGO'];
  if (n.includes('lilly')) return REAL_ASSET_IMAGES['LLY'];
  if (n.includes('exxon')) return REAL_ASSET_IMAGES['XOM'];
  if (n.includes('costco')) return REAL_ASSET_IMAGES['COST'];
  if (n.includes('nike')) return REAL_ASSET_IMAGES['NKE'];
  if (n.includes('adobe')) return REAL_ASSET_IMAGES['ADBE'];
  if (n.includes('palantir')) return REAL_ASSET_IMAGES['PLTR'];
  if (n.includes('coinbase')) return REAL_ASSET_IMAGES['COIN'];
  if (n.includes('spotify')) return REAL_ASSET_IMAGES['SPOT'];
  if (n.includes('uber')) return REAL_ASSET_IMAGES['UBER'];
  if (n.includes('pepsi')) return REAL_ASSET_IMAGES['PEP'];
  if (n.includes('mcdonald')) return REAL_ASSET_IMAGES['MCD'];
  if (n.includes('salesforce')) return REAL_ASSET_IMAGES['CRM'];
  if (n.includes('chevron')) return REAL_ASSET_IMAGES['CVX'];
  if (n.includes('bank of america')) return REAL_ASSET_IMAGES['BAC'];
  if (n.includes('home depot')) return REAL_ASSET_IMAGES['HD'];
  if (n.includes('johnson')) return REAL_ASSET_IMAGES['JNJ'];
  if (n.includes('procter') || n.includes('p&g')) return REAL_ASSET_IMAGES['PG'];
  if (n.includes('cisco')) return REAL_ASSET_IMAGES['CSCO'];
  if (n.includes('verizon')) return REAL_ASSET_IMAGES['VZ'];
  if (n.includes('at&t') || n.includes('att')) return REAL_ASSET_IMAGES['T'];
  if (n.includes('pfizer')) return REAL_ASSET_IMAGES['PFE'];
  if (n.includes('boeing')) return REAL_ASSET_IMAGES['BA'];
  if (n.includes('qualcomm')) return REAL_ASSET_IMAGES['QCOM'];
  if (n.includes('arm holdings') || n.includes('arm')) return REAL_ASSET_IMAGES['ARM'];
  if (n.includes('super micro')) return REAL_ASSET_IMAGES['SMCI'];
  if (n.includes('moderna')) return REAL_ASSET_IMAGES['MRNA'];
  if (n.includes('airbnb')) return REAL_ASSET_IMAGES['ABNB'];
  if (n.includes('shopify')) return REAL_ASSET_IMAGES['SHOP'];
  if (n.includes('starbucks')) return REAL_ASSET_IMAGES['SBUX'];
  if (n.includes('bmw')) return REAL_ASSET_IMAGES['BMW'];

  // Indian Equities
  if (n.includes('reliance')) return REAL_ASSET_IMAGES['RELIANCE'];
  if (n.includes('tcs') || n.includes('tata consultancy')) return REAL_ASSET_IMAGES['TCS'];
  if (n.includes('hdfc')) return REAL_ASSET_IMAGES['HDFCBANK'];
  if (n.includes('infosys')) return REAL_ASSET_IMAGES['INFY'];
  if (n.includes('icici')) return REAL_ASSET_IMAGES['ICICIBANK'];
  if (n.includes('tata motors')) return REAL_ASSET_IMAGES['TATAMOTORS'];
  if (n.includes('sbi') || n.includes('state bank')) return REAL_ASSET_IMAGES['SBIN'];
  if (n.includes('airtel') || n.includes('bharti')) return REAL_ASSET_IMAGES['BHARTIARTL'];
  if (n.includes('itc')) return REAL_ASSET_IMAGES['ITC'];
  if (n.includes('kotak')) return REAL_ASSET_IMAGES['KOTAKBANK'];
  if (n.includes('larsen')) return REAL_ASSET_IMAGES['LT'];
  if (n.includes('unilever') || n.includes('hindustan')) return REAL_ASSET_IMAGES['HINDUNILVR'];
  if (n.includes('axis')) return REAL_ASSET_IMAGES['AXISBANK'];
  if (n.includes('maruti')) return REAL_ASSET_IMAGES['MARUTI'];
  if (n.includes('bajaj')) return REAL_ASSET_IMAGES['BAJFINANCE'];

  // Cryptos
  if (n.includes('ethereum')) return REAL_ASSET_IMAGES['ETH'];
  if (n.includes('solana')) return REAL_ASSET_IMAGES['SOL'];
  if (n.includes('ripple')) return REAL_ASSET_IMAGES['XRP'];
  if (n.includes('dogecoin')) return REAL_ASSET_IMAGES['DOGE'];
  if (n.includes('shiba')) return REAL_ASSET_IMAGES['SHIB'];
  if (n.includes('polygon')) return REAL_ASSET_IMAGES['POL'];
  if (n.includes('chainlink')) return REAL_ASSET_IMAGES['LINK'];
  if (n.includes('litecoin')) return REAL_ASSET_IMAGES['LTC'];
  if (n.includes('polkadot')) return REAL_ASSET_IMAGES['DOT'];
  if (n.includes('cardano')) return REAL_ASSET_IMAGES['ADA'];
  if (n.includes('near protocol')) return REAL_ASSET_IMAGES['NEAR'];
  if (n.includes('sui')) return REAL_ASSET_IMAGES['SUI'];
  if (n.includes('aptos')) return REAL_ASSET_IMAGES['APT'];
  if (n.includes('render')) return REAL_ASSET_IMAGES['RENDER'];
  if (n.includes('uniswap')) return REAL_ASSET_IMAGES['UNI'];
  if (n.includes('cosmos')) return REAL_ASSET_IMAGES['ATOM'];
  if (n.includes('arbitrum')) return REAL_ASSET_IMAGES['ARB'];
  if (n.includes('injective')) return REAL_ASSET_IMAGES['INJ'];
  if (n.includes('stellar')) return REAL_ASSET_IMAGES['XLM'];
  if (n.includes('internet computer')) return REAL_ASSET_IMAGES['ICP'];
  if (n.includes('filecoin')) return REAL_ASSET_IMAGES['FIL'];
  if (n.includes('vechain')) return REAL_ASSET_IMAGES['VET'];
  if (n.includes('monero')) return REAL_ASSET_IMAGES['XMR'];
  if (n.includes('aave')) return REAL_ASSET_IMAGES['AAVE'];
  if (n.includes('algorand')) return REAL_ASSET_IMAGES['ALGO'];
  if (n.includes('theta')) return REAL_ASSET_IMAGES['THETA'];
  if (n.includes('multiversx') || n.includes('elrond')) return REAL_ASSET_IMAGES['EGLD'];
  if (n.includes('sandbox')) return REAL_ASSET_IMAGES['SAND'];
  if (n.includes('decentraland')) return REAL_ASSET_IMAGES['MANA'];
  if (n.includes('axie')) return REAL_ASSET_IMAGES['AXS'];
  if (n.includes('gala')) return REAL_ASSET_IMAGES['GALA'];
  if (n.includes('quant')) return REAL_ASSET_IMAGES['QNT'];
  if (n.includes('fantom')) return REAL_ASSET_IMAGES['FTM'];
  if (n.includes('helium')) return REAL_ASSET_IMAGES['HNT'];
  if (n.includes('maker')) return REAL_ASSET_IMAGES['MKR'];
  if (n.includes('stacks')) return REAL_ASSET_IMAGES['STX'];

  // Commodities
  if (n.includes('gold')) return REAL_ASSET_IMAGES['XAU'];
  if (n.includes('silver')) return REAL_ASSET_IMAGES['XAG'];
  if (n.includes('platinum')) return REAL_ASSET_IMAGES['XPT'];
  if (n.includes('palladium')) return REAL_ASSET_IMAGES['XPD'];
  if (n.includes('brent')) return REAL_ASSET_IMAGES['BRENT'];
  if (n.includes('oil') || n.includes('wti') || n.includes('crude')) return REAL_ASSET_IMAGES['WTI'];
  if (n.includes('gas')) return REAL_ASSET_IMAGES['NG'];
  if (n.includes('copper')) return REAL_ASSET_IMAGES['HG'];
  if (n.includes('coffee')) return REAL_ASSET_IMAGES['COFFEE'];
  if (n.includes('cocoa')) return REAL_ASSET_IMAGES['COCOA'];
  if (n.includes('wheat')) return REAL_ASSET_IMAGES['WHEAT'];
  if (n.includes('aluminum') || n.includes('aluminium')) return REAL_ASSET_IMAGES['ALU'];
  if (n.includes('zinc')) return REAL_ASSET_IMAGES['ZNC'];
  if (n.includes('nickel')) return REAL_ASSET_IMAGES['NIC'];

  // Indices
  if (n.includes('nasdaq')) return REAL_ASSET_IMAGES['NDX'];
  if (n.includes('s&p') || n.includes('sp 500')) return REAL_ASSET_IMAGES['SPX'];
  if (n.includes('dow jones')) return REAL_ASSET_IMAGES['DJI'];
  if (n.includes('dax')) return REAL_ASSET_IMAGES['GER40'];
  if (n.includes('ftse')) return REAL_ASSET_IMAGES['UK100'];
  if (n.includes('nikkei')) return REAL_ASSET_IMAGES['JP225'];
  if (n.includes('hang seng')) return REAL_ASSET_IMAGES['HSI'];
  if (n.includes('cac')) return REAL_ASSET_IMAGES['CAC40'];
  if (n.includes('stoxx')) return REAL_ASSET_IMAGES['SX5E'];
  if (n.includes('asx')) return REAL_ASSET_IMAGES['ASX200'];
  if (n.includes('ibex')) return REAL_ASSET_IMAGES['IBEX35'];
  if (n.includes('bank nifty')) return REAL_ASSET_IMAGES['BANKNIFTY'];
  if (n.includes('nifty')) return REAL_ASSET_IMAGES['NIFTY50'];
  if (n.includes('sensex')) return REAL_ASSET_IMAGES['SENSEX'];
  if (n.includes('vix')) return REAL_ASSET_IMAGES['VIX'];
  if (n.includes('sony')) return REAL_ASSET_IMAGES['SONY'];
  if (n.includes('kospi')) return REAL_ASSET_IMAGES['KOSPI'];
  if (n.includes('dollar index') || n.includes('dxy')) return REAL_ASSET_IMAGES['DXY'];
  if (n.includes('russell')) return REAL_ASSET_IMAGES['RUT'];

  return null;
};

// -------------------------------------------------------------
// EAGER IMAGE PRELOADER & GPU DECODER (Instant 0ms Asset Display)
// -------------------------------------------------------------
let isPreloadingInitiated = false;

export const preloadAllAssetLogos = () => {
  if (typeof window === 'undefined' || isPreloadingInitiated) return;
  isPreloadingInitiated = true;

  // Preload in requestIdleCallback or immediate microtask to avoid UI jank
  const runPreload = () => {
    // 1. Gather all high-frequency asset image URLs
    const urlsToPreload: { key: string; url: string }[] = [];

    // All predefined stocks, cryptos, commodities, indices
    for (const [key, cfg] of Object.entries(REAL_ASSET_IMAGES)) {
      if (cfg.primary) {
        urlsToPreload.push({ key, url: cfg.primary });
      }
    }

    // Top forex flags
    const topFlags = ['us', 'eu', 'gb', 'jp', 'ca', 'ch', 'au', 'nz', 'in', 'br', 'mx', 'th', 'no', 'sg'];
    for (const f of topFlags) {
      urlsToPreload.push({ key: `flag_${f}`, url: `https://flagcdn.com/w160/${f}.png` });
    }

    // Custom bundled logos
    const customLogos = [
      '/assets/logos/btc.png',
      '/assets/logos/bnb.jpeg',
      '/assets/logos/amd.png',
      '/assets/logos/meta.jpeg',
      '/assets/logos/pypl.png',
      '/assets/logos/trx.jpeg',
      '/assets/logos/ton.jpeg',
      '/assets/logos/pepe.jpeg',
      '/assets/logos/baba.png',
      '/assets/logos/ko.png',
      '/assets/logos/nvda.png',
      '/assets/logos/avax.jpeg'
    ];
    for (const c of customLogos) {
      urlsToPreload.push({ key: c, url: c });
    }

    // Batch preload with concurrency limit to preserve network bandwidth
    let index = 0;
    const batchSize = 8;

    const pumpNextBatch = () => {
      if (index >= urlsToPreload.length) return;
      const batch = urlsToPreload.slice(index, index + batchSize);
      index += batchSize;

      for (const item of batch) {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.onload = () => {
          lockImage(item.key, item.url);
        };
        img.src = item.url;
        if (typeof img.decode === 'function') {
          img.decode()
            .then(() => {
              lockImage(item.key, item.url);
            })
            .catch(() => {});
        }
      }

      setTimeout(pumpNextBatch, 80);
    };

    pumpNextBatch();
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runPreload, { timeout: 1500 });
  } else {
    setTimeout(runPreload, 300);
  }
};
