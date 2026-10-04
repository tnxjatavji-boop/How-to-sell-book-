import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';
import { 
  ArrowLeft, ShieldCheck, Globe, Award, 
  TrendingUp, CheckCircle2, ChevronRight, HelpCircle,
  RefreshCw, BarChart2, Headphones, Lock, Smartphone,
  PlayCircle, Clock, Layers, DollarSign, Wallet, FileText,
  Search, ArrowRight, ExternalLink, Activity
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

type TabType = 'overview' | 'markets' | 'tools' | 'banking' | 'security' | 'faqs';

export const AboutScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'markets', label: 'Markets & Assets', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'tools', label: 'Charting & Tools', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'banking', label: 'Deposits & Payouts', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: 'security', label: 'Safety & Support', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'faqs', label: 'Knowledge Base', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  ];

  const platformHighlights = [
    { label: "Tradable Assets", value: "50+", sub: "Forex, Crypto, OTC & Commodities" },
    { label: "Platform Commission", value: "0%", sub: "Zero Fee on Deposits & Trades" },
    { label: "Practice Balance", value: "₹10,000", sub: "Instant 1-Tap Refillable" },
    { label: "Market Access", value: "24/7", sub: "Continuous Live & OTC Streams" },
  ];

  const assetClasses = [
    {
      title: "Currencies (Forex & OTC)",
      payout: "Up to 91%",
      badge: "Major & Cross Pairs",
      desc: "Trade global currency pairs including EUR/USD, GBP/USD, USD/JPY, USD/INR, and AUD/CAD. Available in both standard spot market hours and 24/7 weekend OTC mode."
    },
    {
      title: "Digital Cryptocurrencies",
      payout: "Up to 91%",
      badge: "High Volatility",
      desc: "Real-time tick streams for top digital assets including Bitcoin (BTC), Ethereum (ETH), Solana (SOL), and Ripple (XRP) with 24/7 continuous liquidity."
    },
    {
      title: "Precious Metals & Energy",
      payout: "Up to 91%",
      badge: "Gold, Silver, Crude",
      desc: "Trade commodity price movements on Spot Gold (XAU), Silver (XAG), and Brent Crude Oil with institutional-grade price precision."
    },
    {
      title: "Global Stock Equities & Tech",
      payout: "Up to 91%",
      badge: "Blue Chips & Titans",
      desc: "Participate in price action of mega-cap tech innovators and global enterprises including Nvidia, Apple, Tesla, Microsoft, Amazon, and Indian benchmark leaders."
    },
    {
      title: "Market Indices",
      payout: "Up to 91%",
      badge: "Broad Market Benchmarks",
      desc: "Forecast aggregate market direction on world-renowned index benchmarks including S&P 500, NASDAQ 100, and regional economic indices."
    }
  ];

  const analysisToolsList = [
    {
      name: "Trend Indicators",
      items: ["Simple Moving Average (SMA)", "Exponential Moving Average (EMA)", "Bollinger Bands", "Parabolic SAR", "Ichimoku Cloud"],
      desc: "Identify directional trends, price smoothing channels, and dynamic support/resistance zones."
    },
    {
      name: "Momentum Oscillators",
      items: ["Relative Strength Index (RSI)", "MACD (Moving Average Convergence)", "Stochastic Oscillator", "Awesome Oscillator", "ATR"],
      desc: "Detect overbought and oversold conditions, momentum divergences, and volatility expansion."
    },
    {
      name: "Pro Drawing Palette",
      items: ["Trendlines", "Horizontal Support/Resistance Lines", "Horizontal Rays", "Supply & Demand Zone Boxes", "Fibonacci Retracements", "Price / Pip Measurement Ruler", "Freehand Brush"],
      desc: "Draw and annotate directly on live candles with customized colors, line widths, and lockable anchor handles."
    }
  ];

  const allFaqs = [
    {
      category: "Platform Basics",
      q: "What is TradeXora and how does digital trading work?",
      a: "TradeXora is a high-speed financial market forecasting platform. Traders predict whether the price of a selected asset (such as EUR/USD, Gold, or Bitcoin) will be Higher (Call / Buy) or Lower (Put / Sell) than the current strike price at the end of a chosen expiry timeframe (e.g., 1 Minute, 2 Minutes, 5 Minutes). If your forecast is correct upon expiration, you receive your investment back plus the fixed payout percentage (up to 91%)."
    },
    {
      category: "Demo & Practice",
      q: "How does the Demo Practice Account work?",
      a: "Every registered user is instantly allocated a ₹10,000 virtual demo balance upon creating an account. The demo environment streams identical real-time market candles, ticks, and indicators as the real trading engine. It serves as a 100% risk-free practice sandbox where you can test indicator setups, chart patterns, and timing strategies. You can reset your demo balance to ₹10,000 anytime with a single tap."
    },
    {
      category: "Deposits & Payments",
      q: "How do I deposit funds into my Real Account?",
      a: "1. Navigate to the Wallet or Deposit section.\n2. Select your desired deposit amount.\n3. Complete the payment using your preferred UPI app (Google Pay, PhonePe, Paytm, BHIM, CRED) by scanning the dynamic QR code or sending to the displayed UPI VPA.\n4. Enter the 12-digit UTR / UPI Transaction Reference Number into the form and submit.\n5. Your balance is instantly credited upon automated transaction verification."
    },
    {
      category: "Withdrawals & Payouts",
      q: "How do withdrawals work and how will I receive my money?",
      a: "Withdrawals on TradeXora are processed directly to your verified Indian Bank Account via IMPS (Immediate Payment Service). To initiate a withdrawal:\n1. Open the Wallet section and select 'Withdraw'.\n2. Enter the amount you wish to withdraw (Minimum ₹100).\n3. Provide your Bank Account details: Account Holder Name, Bank Account Number, and IFSC Code.\n4. Submit your request. Funds will be dispatched directly to your bank account with 0% platform deductions."
    },
    {
      category: "Markets & Pricing",
      q: "Are market prices real and how do OTC markets operate?",
      a: "During standard international exchange hours, asset prices are synchronized with tier-1 interbank and spot exchange tickers (Binance, Bybit, TradingView scanners). Over weekends and off-exchange hours, our algorithmic Digital OTC (Over-The-Counter) engine provides smooth, continuous price discovery based on multi-frequency market wave models, enabling uninterrupted 24/7 trading."
    },
    {
      category: "Trading Rules",
      q: "What happens if a trade expires at the exact same price as the strike price (Tie)?",
      a: "If the asset's closing price at the exact expiration second is equal to your entry strike price (Tie / At-the-Money), your full investment amount is immediately returned to your account balance with zero loss."
    },
    {
      category: "Fees & Charges",
      q: "Are there any hidden fees or account maintenance charges?",
      a: "No. TradeXora maintains a strict Zero Hidden Commission policy. There are no registration fees, no monthly maintenance charges, and no deposit or withdrawal processing fees deducted by the platform."
    },
    {
      category: "Security",
      q: "How is my account data and balance protected?",
      a: "All platform communications, authentication sessions, and financial data transfers are secured with 256-bit SSL encryption. Furthermore, Demo and Real account ledgers are strictly segregated, ensuring complete financial transparency and data privacy."
    }
  ];

  const filteredFaqs = allFaqs.filter(faq => 
    faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans select-none overflow-y-auto no-scrollbar">
      {/* Top Header */}
      <div className="bg-white px-4 py-3.5 border-b border-gray-200/80 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { triggerHaptic('light'); navigate(-1); }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer active:scale-95"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900 tracking-tight">About TradeXora</h1>
            <div className="text-[10px] text-gray-500 font-semibold">Platform Guide & Documentation</div>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-blue-50 text-[#0088cc] border border-blue-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0088cc]" />
          <span>Official Portal</span>
        </span>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full pb-10">
        
        {/* Brand Mission Hero */}
        <div className="bg-gradient-to-br from-[#0a1128] via-[#0f1c3f] to-[#070d1e] rounded-3xl p-5 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden bg-white/10 border border-white/20 p-1 backdrop-blur-md shrink-0">
                <BrandLogo className="w-full h-full object-contain rounded-xl" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest font-black text-blue-400">TradeXora Platform</div>
                <h2 className="text-xl font-black text-white tracking-tight">Transparent Digital Trading</h2>
                <div className="text-[11px] text-slate-300 font-medium">Precision Speed • Zero Fees • 24/7 Markets</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal mb-4">
              TradeXora is an institutional-grade digital market trading interface designed for retail traders. We provide real-time tick streaming, flexible trade expiries, comprehensive charting tools, and direct IMPS bank payouts with complete transparency.
            </p>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
              {platformHighlights.map((stat, i) => (
                <div key={i} className={`p-1.5 ${i % 2 === 1 ? 'border-l border-white/10 pl-3' : ''}`}>
                  <div className="text-lg font-black text-white font-mono">{stat.value}</div>
                  <div className="text-[10px] font-bold text-blue-300/90">{stat.label}</div>
                  <div className="text-[9px] text-slate-400">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Navigation Tabs */}
        <div className="bg-white p-1.5 rounded-2xl border border-gray-200/90 shadow-2xs overflow-x-auto no-scrollbar flex items-center gap-1">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[#0088cc] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & QUICKSTART */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 4-Step Quickstart Guide */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-[#0088cc]" />
                  <span>How to Get Started (4 Simple Steps)</span>
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quickstart</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#0088cc] text-white text-xs font-black flex items-center justify-center">1</span>
                    <span className="font-bold text-gray-900 text-xs">Create Account</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed pl-8">
                    Register in seconds with your email or phone. Instant access to both Real and Demo accounts.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#0088cc] text-white text-xs font-black flex items-center justify-center">2</span>
                    <span className="font-bold text-gray-900 text-xs">Practice on Demo</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed pl-8">
                    Use your ₹10,000 refillable virtual fund to test indicators and familiarize with live candles.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#0088cc] text-white text-xs font-black flex items-center justify-center">3</span>
                    <span className="font-bold text-gray-900 text-xs">Instant UPI Deposit</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed pl-8">
                    Deposit via GPay, PhonePe, Paytm, BHIM, or CRED with automated 12-digit UTR verification.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#0088cc] text-white text-xs font-black flex items-center justify-center">4</span>
                    <span className="font-bold text-gray-900 text-xs">Trade & Withdraw</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed pl-8">
                    Forecast price movements and withdraw earnings directly to your bank account via fast IMPS.
                  </p>
                </div>
              </div>
            </div>

            {/* Core Pillars */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-sm">Core Platform Principles</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Features</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-emerald-950 mb-0.5">Fixed Pre-Determined Payouts</div>
                    <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                      Know your exact profit return (up to 91%) before placing any trade. No variable spreads or unpredictable slippage.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-[#0088cc] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-blue-950 mb-0.5">Zero Hidden Commission</div>
                    <p className="text-[11px] text-blue-900/80 leading-relaxed">
                      Enjoy 100% free account creation, zero deposit fees, zero withdrawal fees, and zero overnight rollover charges.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl flex items-start gap-3">
                  <Award className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs text-purple-950 mb-0.5">Identical Demo & Real Data Stream</div>
                    <p className="text-[11px] text-purple-900/80 leading-relaxed">
                      Our Demo account connects to the exact same live tick stream as the Real Account, ensuring realistic practice.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MARKETS & ASSETS */}
        {/* ========================================================================= */}
        {activeTab === 'markets' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#0088cc]" />
                  <span>Available Asset Classes</span>
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">50+ Markets</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {assetClasses.map((asset, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100/80 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-black text-xs text-gray-900">{asset.title}</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold bg-gray-200/80 text-gray-700 px-2 py-0.5 rounded-md">
                          {asset.badge}
                        </span>
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          {asset.payout}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed font-normal">
                      {asset.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* OTC Market Explanation */}
            <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl text-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-blue-400">
                <Clock className="w-4 h-4" />
                <span>24/7 Digital OTC Market Discovery</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                Standard international Forex exchanges close during weekends. To ensure traders can practice and trade without interruption, TradeXora provides Digital OTC (Over-The-Counter) assets that maintain continuous liquidity and smooth price action 24 hours a day, 7 days a week.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CHARTING & ANALYSIS TOOLS */}
        {/* ========================================================================= */}
        {activeTab === 'tools' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#0088cc]" />
                  <span>Technical Analysis & Drawing Suite</span>
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pro Charting</span>
              </div>

              <div className="space-y-3">
                {analysisToolsList.map((toolGroup, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                    <div className="font-black text-xs text-gray-900">{toolGroup.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {toolGroup.items.map((item, itemIdx) => (
                        <span key={itemIdx} className="text-[10px] font-bold bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg shadow-2xs">
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-normal pt-1 border-t border-gray-200/60">
                      {toolGroup.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeframes Card */}
            <div className="p-4 bg-white border border-gray-200/90 rounded-2xl shadow-xs space-y-2">
              <div className="font-black text-xs text-gray-900">Supported Candlestick Timeframes</div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Switch seamlessly between 5 Seconds (5s), 15 Seconds (15s), 30 Seconds (30s), 1 Minute (1m), 5 Minutes (5m), and 15 Minutes (15m) chart views to identify micro-scalping entries or macro market trends.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: DEPOSITS & PAYOUTS */}
        {/* ========================================================================= */}
        {activeTab === 'banking' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Deposit Process Card */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Instant UPI Deposit Procedure</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Automated</span>
              </div>

              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-black text-[#0088cc] w-4 shrink-0">1.</span>
                  <div>
                    <span className="font-bold text-gray-900">Open Deposit Screen:</span> Choose your deposit amount (e.g. ₹500, ₹1000, ₹2000, or custom amount).
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-black text-[#0088cc] w-4 shrink-0">2.</span>
                  <div>
                    <span className="font-bold text-gray-900">Complete Payment:</span> Scan the dynamic UPI QR or copy the active UPI VPA into Google Pay, PhonePe, Paytm, BHIM, or CRED.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-black text-[#0088cc] w-4 shrink-0">3.</span>
                  <div>
                    <span className="font-bold text-gray-900">Submit 12-Digit UTR:</span> Copy the 12-digit UPI Reference / UTR Number from your payment receipt and enter it into TradeXora for immediate verification.
                  </div>
                </div>
              </div>
            </div>

            {/* Withdrawal Process Card */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  <span>Direct IMPS Bank Payout Procedure</span>
                </h3>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">0% Fee</span>
              </div>

              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-black text-[#0088cc] w-4 shrink-0">1.</span>
                  <div>
                    <span className="font-bold text-gray-900">Minimum Withdrawal:</span> You can withdraw any amount starting from ₹100 up to your full available real balance.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-black text-[#0088cc] w-4 shrink-0">2.</span>
                  <div>
                    <span className="font-bold text-gray-900">Bank Details Required:</span> Enter your Account Holder Name, Bank Account Number, and IFSC Code accurately.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="font-black text-[#0088cc] w-4 shrink-0">3.</span>
                  <div>
                    <span className="font-bold text-gray-900">IMPS Dispatch:</span> Payouts are routed directly to your Indian bank account via IMPS with 0% platform commission deducted.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SAFETY & SUPPORT */}
        {/* ========================================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Account Security & Ledgers</span>
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Safety</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2 mb-1 font-bold text-xs text-gray-900">
                    <Lock className="w-4 h-4 text-[#0088cc]" />
                    <span>256-Bit SSL Data Encryption</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed pl-6">
                    All network communications, authentication tokens, and user credentials are encrypted to prevent unauthorized data interception.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div className="flex items-center gap-2 mb-1 font-bold text-xs text-gray-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Independent Balance Accounting</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed pl-6">
                    Virtual Demo funds and Real Account balances are maintained in completely isolated database records to guarantee full ledger integrity.
                  </p>
                </div>
              </div>
            </div>

            {/* Support Desk Card */}
            <div className="p-4 bg-gradient-to-br from-blue-950 to-slate-900 text-white rounded-2xl border border-blue-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Headphones className="w-4 h-4 text-[#38bdf8]" />
                  <span>24/7 Dedicated Trader Assistance</span>
                </div>
                <span className="text-[10px] font-black bg-blue-500/20 text-[#38bdf8] border border-blue-500/30 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Need help with deposit verification, trade mechanics, or account management? Our dedicated 24/7 In-App Live Support Desk is always available in your Profile section.
              </p>
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  navigate('/help');
                }}
                className="w-full py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-md shadow-blue-900/30"
              >
                <span>Open Help & Support Center</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: FAQS & KNOWLEDGE BASE */}
        {/* ========================================================================= */}
        {activeTab === 'faqs' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search questions (e.g. Deposit, Demo, Payout, OTC)..."
                className="w-full bg-white border border-gray-200/90 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0088cc] transition shadow-2xs font-medium"
              />
            </div>

            {/* FAQ List */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-sm">Frequently Asked Questions</h3>
                <span className="text-[10px] font-bold text-gray-400">
                  {filteredFaqs.length} {filteredFaqs.length === 1 ? 'Result' : 'Results'}
                </span>
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  No matching questions found. Try searching for a different keyword.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFaqs.map((faq, idx) => (
                    <div key={idx} className="border border-gray-200/70 rounded-xl overflow-hidden">
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setActiveFaq(activeFaq === idx ? null : idx);
                        }}
                        className="w-full p-3 text-left flex items-center justify-between bg-gray-50/70 hover:bg-gray-100/70 transition cursor-pointer"
                      >
                        <div className="pr-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#0088cc] block mb-0.5">
                            {faq.category}
                          </span>
                          <span className="text-xs font-bold text-gray-900 leading-snug">
                            {faq.q}
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${activeFaq === idx ? 'rotate-90 text-[#0088cc]' : ''}`} />
                      </button>
                      {activeFaq === idx && (
                        <div className="p-3.5 bg-white text-xs text-gray-600 leading-relaxed border-t border-gray-100 whitespace-pre-line animate-in fade-in duration-150">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Action Navigation Footer */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => {
              triggerHaptic('medium');
              navigate('/trade');
            }}
            className="py-3 px-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
          >
            <Activity className="w-4 h-4" />
            <span>Go to Live Chart</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              navigate('/wallet');
            }}
            className="py-3 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-2xs"
          >
            <Wallet className="w-4 h-4 text-[#0088cc]" />
            <span>Open Wallet</span>
          </button>
        </div>

        {/* Footer Info */}
        <div className="text-center py-4 space-y-1 text-gray-400 border-t border-gray-200/60">
          <div className="text-xs font-bold text-gray-600">TradeXora Platform © 2026. All Rights Reserved.</div>
          <div className="text-[10px] text-gray-400 font-medium">Encrypted Financial Terminal • Real-Time Market Analytics</div>
        </div>

      </div>
    </div>
  );
};
