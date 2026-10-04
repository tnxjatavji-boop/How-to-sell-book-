import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  Newspaper, ArrowUpRight, Clock, ChevronRight,
  Calendar, Globe, TrendingUp, RefreshCw, Search,
  Flame, ExternalLink, Zap, Check, AlertCircle, Share2
} from 'lucide-react';

export interface LiveNewsItem {
  id: string;
  title: string;
  category: 'Stocks' | 'Economy' | 'Tech' | 'Crypto' | 'Global Market' | 'Forex';
  timeAgo: string;
  timestamp: number;
  source: string;
  summary: string;
  link: string;
  imageUrl?: string;
  volatilityImpact: 'High' | 'Moderate' | 'Low';
  relatedAsset?: string;
}

export interface CalendarEvent {
  id: string;
  time: string;
  currency: string;
  countryFlag: string;
  event: string;
  impact: 'HIGH' | 'MED' | 'LOW';
  actual: string;
  forecast: string;
  previous: string;
}

const CATEGORIES = ['All', 'Stocks', 'Crypto', 'Economy', 'Tech', 'Forex', 'Global Market'] as const;
type CategoryType = typeof CATEGORIES[number];

export const NewsScreen = () => {
  const { assets, setCurrentAsset } = useAppContext();
  const navigate = useNavigate();
  
  const [tab, setTab] = useState<'news' | 'calendar'>('news');
  const [selectedTag, setSelectedTag] = useState<CategoryType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState<LiveNewsItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [newNewsCount, setNewNewsCount] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const prevNewsIdsRef = useRef<Set<string>>(new Set());

  // Fetch live news from server API
  const loadNews = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const url = `/api/news${isManual ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.news)) {
          const freshList: LiveNewsItem[] = data.news;
          
          // Check for newly arrived headlines
          if (prevNewsIdsRef.current.size > 0) {
            let freshCount = 0;
            for (const item of freshList) {
              if (!prevNewsIdsRef.current.has(item.id)) {
                freshCount++;
              }
            }
            if (freshCount > 0) {
              setNewNewsCount(prev => prev + freshCount);
            }
          }

          const currentIds = new Set<string>(freshList.map(n => n.id));
          prevNewsIdsRef.current = currentIds;
          setNews(freshList);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      console.warn("Failed to load real-time news:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch economic calendar
  const loadCalendar = async () => {
    try {
      const res = await fetch('/api/news/calendar');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.calendar)) {
          setCalendarEvents(data.calendar);
        }
      }
    } catch (err) {
      console.warn("Failed to load economic calendar:", err);
    }
  };

  // Initial load
  useEffect(() => {
    loadNews();
    loadCalendar();

    // 24/7 Live Feed Auto-Polling every 45 seconds to fetch continuous breaking news
    const pollInterval = setInterval(() => {
      loadNews(false);
    }, 45 * 1000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleManualRefresh = () => {
    setNewNewsCount(0);
    loadNews(true);
    loadCalendar();
  };

  const handleTradeAsset = (assetName?: string) => {
    if (!assetName) {
      navigate('/assets');
      return;
    }
    const cleanSearch = assetName.toLowerCase();
    const matched = assets.find(a => 
      a.name.toLowerCase().includes(cleanSearch) || 
      cleanSearch.includes(a.name.toLowerCase()) ||
      a.symbol.toLowerCase().includes(cleanSearch)
    );
    if (matched) {
      setCurrentAsset(matched);
      navigate('/');
    } else {
      navigate('/assets');
    }
  };

  const handleCopyLink = (item: LiveNewsItem) => {
    const textToCopy = `${item.title} — ${item.link || window.location.href}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy);
      } else {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filter news by category
  const filteredNews = useMemo(() => {
    if (selectedTag === 'All') return news;
    return news.filter(item => item.category.toLowerCase() === selectedTag.toLowerCase());
  }, [news, selectedTag]);

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-24 select-none">
      {/* Top Header Bar (Original clean design) */}
      <div className="px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3 bg-white border-b border-gray-100 sticky top-0 z-30 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc]">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Market News
              </h1>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Financial Feed
              </div>
            </div>
          </div>

          <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-bold">
            <button
              onClick={() => setTab('news')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${tab === 'news' ? 'bg-[#0088cc] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              News Wire
            </button>
            <button
              onClick={() => setTab('calendar')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${tab === 'calendar' ? 'bg-[#0088cc] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Calendar
            </button>
          </div>
        </div>

        {tab === 'news' && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {["All", "Stocks", "Economy", "Tech", "Crypto", "Global Market"].map(b => (
              <button
                key={b}
                onClick={() => setSelectedTag(b as any)}
                className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  selectedTag === b 
                    ? 'bg-gray-900 text-white shadow-xs' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-3.5 space-y-3">
        {/* Global Financial Headlines & Macro Wire Banner (Original clean card) */}
        <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Flame className="w-4 h-4 text-[#0088cc]" />
              Global Financial Headlines & Macro Wire
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-[#0088cc] border border-blue-200 rounded">
              Updated Live
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Real-time economic developments, corporate earnings, central bank announcements, and institutional market drivers.
          </p>
        </div>

        {/* Tab 1: Live Real-Time News Wire */}
        {tab === 'news' && (
          <>

            {/* Loading Skeleton */}
            {loading && news.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-2.5 animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                    </div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                    <div className="h-3 w-5/6 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredNews.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
                <h3 className="text-sm font-bold text-gray-800">No matching headlines</h3>
                <p className="text-xs text-gray-500">
                  Try searching for another keyword or switch category filter to "All".
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedTag('All'); }}
                  className="mt-2 text-xs font-bold text-[#0088cc] hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* News Articles List */}
            <div className="space-y-3">
              {filteredNews.map(item => (
                <div 
                  key={item.id} 
                  className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs transition-all hover:border-[#0088cc]/40 hover:shadow-md"
                >
                  {/* Card Header: Source, Category & Time */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-[#0088cc] uppercase tracking-wider bg-blue-50/90 px-2 py-0.5 rounded border border-blue-100">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded">
                        {item.source}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono shrink-0">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{item.timeAgo}</span>
                    </div>
                  </div>

                  {/* Article Title */}
                  <h3 className="font-extrabold text-gray-900 text-sm leading-snug mb-2">
                    {item.title}
                  </h3>

                  {/* Image Preview (Optimized Fast Direct CDN Loading + Instant Fallback) */}
                  {item.imageUrl && (
                    <div className="mb-2.5 rounded-xl overflow-hidden h-40 bg-slate-900/10 border border-slate-200/80 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-linear-to-r from-slate-100 to-slate-200 animate-pulse" />
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover relative z-10 transition-opacity duration-200"
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.opacity = '1';
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // If direct failed, try proxy once
                          if (!target.src.includes('/api/news/image')) {
                            target.src = `/api/news/image?url=${encodeURIComponent(item.imageUrl!)}`;
                          } else {
                            // If proxy also fails, hide smoothly
                            (target.parentElement as HTMLElement).style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Article Excerpt */}
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    {item.summary}
                  </p>

                  {/* Card Footer: Volatility Impact, Trade Link & Read Source */}
                  <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 flex items-center gap-1 text-[10px] font-semibold">
                        Impact:
                        <strong className={`font-black flex items-center gap-1 ${
                          item.volatilityImpact === 'High' 
                            ? 'text-rose-600' 
                            : item.volatilityImpact === 'Moderate' 
                            ? 'text-amber-600' 
                            : 'text-emerald-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.volatilityImpact === 'High' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                          }`} />
                          {item.volatilityImpact}
                        </strong>
                      </span>

                      <button
                        onClick={() => handleCopyLink(item)}
                        title="Copy headline & link"
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        {copiedId === item.id ? (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          <Share2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-900 text-[10px] font-bold flex items-center gap-0.5 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          <span>Full Story</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {item.relatedAsset ? (
                        <button 
                          onClick={() => handleTradeAsset(item.relatedAsset)}
                          className="text-white font-bold bg-[#0088cc] hover:bg-[#0077b5] flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg transition-all shadow-xs text-[10px] active:scale-95"
                        >
                          <span>Trade {item.relatedAsset}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/assets')}
                          className="text-[#0088cc] font-bold hover:bg-blue-50 flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg transition-colors text-[10px]"
                        >
                          <span>Explore Assets</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Tab 2: Economic Calendar */}
        {tab === 'calendar' && (
          <div className="space-y-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-xs">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Today's High-Impact Macro Calendar
                    </h2>
                    <span className="text-[10px] text-gray-400 font-bold block">
                      Indian Standard Time (IST) • Live Central Bank Signals
                    </span>
                  </div>
                </div>
                <button
                  onClick={loadCalendar}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                {calendarEvents.map(ev => (
                  <div key={ev.id} className="p-3 bg-gray-50/70 border border-gray-200/80 rounded-xl space-y-2 hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl shadow-xs">{ev.countryFlag}</span>
                        <div>
                          <div className="font-black text-xs text-gray-900 leading-snug">{ev.event}</div>
                          <div className="text-[10px] text-gray-500 font-mono font-bold mt-0.5">
                            <span className="bg-white px-1.5 py-0.2 rounded border border-gray-200 text-gray-700">{ev.currency}</span>
                            <span className="ml-1.5">{ev.time}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        ev.impact === 'HIGH' 
                          ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {ev.impact} Impact
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1">
                      <div className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-xs">
                        <span className="text-gray-400 block text-[9px] uppercase font-bold">Actual</span>
                        <span className="font-black text-emerald-600 font-mono">{ev.actual}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-xs">
                        <span className="text-gray-400 block text-[9px] uppercase font-bold">Forecast</span>
                        <span className="font-bold text-gray-700 font-mono">{ev.forecast}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-xs">
                        <span className="text-gray-400 block text-[9px] uppercase font-bold">Previous</span>
                        <span className="font-bold text-gray-400 font-mono">{ev.previous}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
