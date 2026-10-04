import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Star, X, TrendingUp, BarChart2 } from 'lucide-react';
import { AssetLogo } from '../components/AssetLogo';
import { triggerHaptic } from '../utils/haptics';
import { FuturesAsset } from '../types/futures';

export const AssetSelectorScreen = () => {
  const { 
    assets, currentAsset, setCurrentAsset, toggleFavorite,
    tradingMode, setTradingMode,
    futuresAssets, currentFuturesAsset, setCurrentFuturesAsset 
  } = useAppContext();
  const navigate = useNavigate();
  
  const [activeBinaryTab, setActiveBinaryTab] = useState<string>('All');
  const [activeFuturesTab, setActiveFuturesTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const binaryTabs = ['All', 'Favorites', 'Popular', 'Currencies (OTC)', 'Crypto', 'Stocks', 'Commodities', 'Indices'];
  const futuresTabs = ['All', 'Crypto', 'Forex', 'US Stocks', 'Indian', 'Commodities'];

  // Fast memoized filter for binary assets
  const filteredBinaryAssets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return assets.filter(a => {
      if (q && !a.name.toLowerCase().includes(q) && !a.symbol.toLowerCase().includes(q)) {
        return false;
      }
      if (activeBinaryTab === 'All') return true;
      if (activeBinaryTab === 'Favorites') return a.favorite;
      if (activeBinaryTab === 'Currencies (OTC)') return a.category === 'Currencies';
      return a.category === activeBinaryTab;
    }).sort((a, b) => b.profitMargin - a.profitMargin);
  }, [assets, searchQuery, activeBinaryTab]);

  // Fast memoized filter for futures assets
  const filteredFuturesAssets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return futuresAssets.filter(f => {
      if (q && !f.name.toLowerCase().includes(q) && !f.symbol.toLowerCase().includes(q) && !f.tvSymbol.toLowerCase().includes(q)) {
        return false;
      }
      if (activeFuturesTab === 'All') return true;
      return f.category === activeFuturesTab;
    });
  }, [futuresAssets, searchQuery, activeFuturesTab]);

  const getBinaryTabCount = (tab: string) => {
    if (tab === 'All') return assets.length;
    if (tab === 'Favorites') return assets.filter(a => a.favorite).length;
    if (tab === 'Currencies (OTC)') return assets.filter(a => a.category === 'Currencies').length;
    return assets.filter(a => a.category === tab).length;
  };

  const getFuturesTabCount = (tab: string) => {
    if (tab === 'All') return futuresAssets.length;
    return futuresAssets.filter(f => f.category === tab).length;
  };

  const totalAssetsCount = tradingMode === 'binary' ? assets.length : futuresAssets.length;

  return (
    <div className="flex flex-col min-h-full bg-white font-sans select-none pb-6">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3 border-b border-gray-100 bg-white sticky top-0 z-30">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 -ml-1 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        {showSearch ? (
          <div className="flex-1 mx-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={tradingMode === 'binary' ? "Search 150+ assets (Bitcoin, Apple, Gold)..." : "Search Futures (BTC, NIFTY, EUR/USD)..."}
              autoFocus
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-gray-400 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <h1 className="text-base font-black text-gray-900 leading-tight">
              Trading Assets ({totalAssetsCount})
            </h1>
          </div>
        )}

        <button 
          onClick={() => {
            setShowSearch(!showSearch);
            if (showSearch) setSearchQuery('');
          }} 
          className="p-1.5 -mr-1 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Binary to Futures Switch Button (Right Below Trading Assets Header) */}
      <div className="px-4 py-2 bg-white border-b border-gray-100">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => {
              triggerHaptic('light');
              setTradingMode('binary');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tradingMode === 'binary'
                ? 'bg-white text-[#0088cc] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>Binary Options</span>
          </button>
          
          <button
            onClick={() => {
              triggerHaptic('light');
              setTradingMode('futures');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tradingMode === 'futures'
                ? 'bg-[#0088cc] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Futures (20X)</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ml-0.5 ${
              tradingMode === 'futures' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
            }`}>
              20X
            </span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      {tradingMode === 'binary' ? (
        <div className="flex px-4 overflow-x-auto no-scrollbar border-b border-gray-100 bg-white">
          {binaryTabs.map(tab => {
            const count = getBinaryTabCount(tab);
            return (
              <button
                key={tab}
                onClick={() => setActiveBinaryTab(tab)}
                className={`px-3 py-2.5 whitespace-nowrap text-xs font-bold transition-colors relative flex items-center gap-1.5 cursor-pointer ${
                  activeBinaryTab === tab ? 'text-[#0088cc] font-black' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeBinaryTab === tab ? 'bg-blue-100 text-[#0088cc]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
                {activeBinaryTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0088cc]" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex px-4 overflow-x-auto no-scrollbar border-b border-gray-100 bg-white">
          {futuresTabs.map(tab => {
            const count = getFuturesTabCount(tab);
            return (
              <button
                key={tab}
                onClick={() => setActiveFuturesTab(tab)}
                className={`px-3 py-2.5 whitespace-nowrap text-xs font-bold transition-colors relative flex items-center gap-1.5 cursor-pointer ${
                  activeFuturesTab === tab ? 'text-[#0088cc] font-black' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>{tab === 'Indian' ? 'Indian Markets' : tab}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeFuturesTab === tab ? 'bg-blue-100 text-[#0088cc]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
                {activeFuturesTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0088cc]" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Table Headers */}
      <div className="flex justify-between px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/60 border-b border-gray-100">
        <span>Asset</span>
        <div className="flex gap-6">
          <span>Live Price</span>
          <span>{tradingMode === 'binary' ? 'Profit %' : 'Leverage'}</span>
          <span>{tradingMode === 'binary' ? 'Fav' : 'Chart'}</span>
        </div>
      </div>

      {/* Assets List */}
      <div className="flex-1 overflow-y-auto pb-8">
        {tradingMode === 'binary' ? (
          filteredBinaryAssets.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs font-medium">
              No binary assets match your criteria.
            </div>
          ) : (
            filteredBinaryAssets.map(asset => {
              const isSelected = currentAsset?.id === asset.id;
              const isOTC = (asset?.name || '').includes('(OTC)') || asset?.category === 'Currencies';
              return (
                <div 
                  key={asset.id} 
                  className={`flex items-center justify-between px-4 py-3 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/40 border-l-4 border-l-[#0088cc]' : 'hover:bg-gray-50/70'
                  }`}
                  onClick={() => {
                    triggerHaptic('light');
                    setCurrentAsset(asset);
                    setTradingMode('binary');
                    navigate('/');
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <AssetLogo symbol={asset.symbol} name={asset.name} size={32} />
                    <div className="truncate">
                      <div className="font-bold text-gray-900 text-sm truncate">{asset.name}</div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                        <span className="text-gray-400 uppercase">{asset.symbol}</span>
                        {isOTC ? (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-tight">
                            OTC
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-50 text-[#0088cc] border border-blue-200 uppercase tracking-tight">
                            LIVE
                          </span>
                        )}
                        <span className={`flex items-center ${asset.change >= 0 ? 'text-[#00b067]' : 'text-[#ff3b30]'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-extrabold text-gray-900">
                        {typeof asset.price === 'number'
                          ? asset.price > 100 
                            ? asset.price.toFixed(2) 
                            : asset.price > 1 
                            ? asset.price.toFixed(4) 
                            : asset.price.toFixed(6)
                          : Number(asset.price || 0).toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="text-[#00b067] font-black text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 min-w-[50px] text-center">
                      +{((Number(asset.profitMargin ?? 0.85)) * 100).toFixed(0)}%
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(asset.id);
                      }} 
                      className="p-1 text-gray-300 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${asset.favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* FUTURES (20X) ASSET LIST */
          filteredFuturesAssets.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs font-medium">
              No futures assets match your search.
            </div>
          ) : (
            filteredFuturesAssets.map((fAsset: FuturesAsset) => {
              const isSelected = currentFuturesAsset.id === fAsset.id;
              return (
                <div 
                  key={fAsset.id} 
                  className={`flex items-center justify-between px-4 py-3 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/40 border-l-4 border-l-[#0088cc]' : 'hover:bg-gray-50/70'
                  }`}
                  onClick={() => {
                    triggerHaptic('light');
                    setCurrentFuturesAsset(fAsset);
                    setTradingMode('futures');
                    navigate('/');
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <AssetLogo symbol={(fAsset?.symbol || 'BTC').split('/')[0]} name={fAsset?.name} size={32} />
                    <div className="truncate">
                      <div className="font-bold text-gray-900 text-sm truncate">{fAsset.name}</div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                        <span className="text-gray-400 uppercase font-mono">{fAsset.symbol}</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-50 text-[#0088cc] border border-blue-200 uppercase tracking-tight">
                          {fAsset.category}
                        </span>
                        <span className={`flex items-center font-mono ${fAsset.change24h >= 0 ? 'text-[#00b067]' : 'text-[#ff3b30]'}`}>
                          {fAsset.change24h >= 0 ? '+' : ''}{fAsset.change24h}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-extrabold text-gray-900">
                        {fAsset.currencySymbol}
                        {fAsset.price.toLocaleString('en-US', { minimumFractionDigits: fAsset.precision, maximumFractionDigits: fAsset.precision })}
                      </div>
                    </div>
                    
                    <div className="text-amber-800 font-black text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200 min-w-[50px] text-center">
                      20X
                    </div>
                    
                    <div className="p-1 text-[#0088cc]" title="Official TradingView Real-time Chart">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};
