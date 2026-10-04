import React, { memo, useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

interface TradingViewChartProps {
  tvSymbol: string;
  theme?: 'dark' | 'light';
  interval?: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = memo(({
  tvSymbol,
  theme = 'dark',
  interval = '15',
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Auto-dismiss loading skeleton within 1.4s so user is never blocked
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, [tvSymbol, theme, interval]);

  // Pre-configured TradingView high-speed embed URL with optimized parameters
  const bgHex = theme === 'light' ? 'ffffff' : '0d131f';
  const iframeSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_futures_widget&symbol=${encodeURIComponent(
    tvSymbol
  )}&interval=${encodeURIComponent(interval)}&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=0&saveimage=0&toolbarbg=${bgHex}&studies=%5B%5D&theme=${theme}&style=1&timezone=Asia%2FKolkata&locale=en`;

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 flex flex-col select-none">
      {/* Instant High-Speed Skeleton / Live Status Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-slate-300 gap-2 backdrop-blur-2xs transition-opacity">
          <div className="relative">
            <Activity className="w-8 h-8 text-[#0088cc] animate-pulse" />
            <RefreshCw className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1 animate-spin" />
          </div>
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span>Connecting to TradingView Feed ({tvSymbol})</span>
          </div>
          <span className="text-[10px] text-slate-400">Loading institutional ticker stream...</span>
        </div>
      )}

      {/* Optimized TradingView Iframe with Immediate Loading */}
      <iframe
        key={`${tvSymbol}-${theme}-${interval}`}
        title={`TradingView Chart - ${tvSymbol}`}
        src={iframeSrc}
        onLoad={() => setIsLoading(false)}
        className="w-full h-full border-0 absolute inset-0 block"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: theme === 'light' ? '#ffffff' : '#0d131f',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-popups"
        loading="eager"
      />
    </div>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
