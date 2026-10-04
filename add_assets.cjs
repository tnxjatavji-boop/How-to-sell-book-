const fs = require('fs');

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. Remove Casino
content = content.replace(/[ \t]*\{ id: '1', name: 'Casino \(OTC\)', symbol: 'CAS', category: 'Popular', profitMargin: 0\.94, price: 2499\.07, change: 1\.45, favorite: false \},\n/, '');

// 2. Insert new assets at the end of the array (before the closing `];`)
const newAssets = `
  // 7. Added 50+ New Assets
  , { id: '106', name: 'Nifty 50 (OTC)', symbol: 'NIFTY50', category: 'Indices', profitMargin: 0.88, price: 24500.0, change: 0.45, favorite: false }
  , { id: '107', name: 'Bank Nifty (OTC)', symbol: 'BANKNIFTY', category: 'Indices', profitMargin: 0.89, price: 51200.0, change: 0.60, favorite: false }
  , { id: '108', name: 'Sensex (OTC)', symbol: 'SENSEX', category: 'Indices', profitMargin: 0.87, price: 80500.0, change: 0.40, favorite: false }
  , { id: '109', name: 'VIX Volatility', symbol: 'VIX', category: 'Indices', profitMargin: 0.84, price: 14.50, change: -2.10, favorite: false }
  , { id: '110', name: 'Russell 2000', symbol: 'RUT', category: 'Indices', profitMargin: 0.86, price: 2150.0, change: 1.15, favorite: false }
  
  , { id: '111', name: 'PepsiCo (OTC)', symbol: 'PEP', category: 'Stocks', profitMargin: 0.86, price: 165.20, change: -0.15, favorite: false }
  , { id: '112', name: 'McDonald\\'s (OTC)', symbol: 'MCD', category: 'Stocks', profitMargin: 0.87, price: 280.40, change: 0.25, favorite: false }
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
];
`;

content = content.replace(/\n\];/, newAssets);

fs.writeFileSync('src/context/AppContext.tsx', content);
console.log("Assets updated!");
