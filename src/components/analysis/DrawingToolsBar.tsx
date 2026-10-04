import React, { useState, useRef, useEffect } from 'react';
import { 
  Pencil, TrendingUp, Minus, Split, 
  Square, Eye, EyeOff, Activity, ArrowUpRight, MousePointer, Trash2, X
} from 'lucide-react';
import { DrawingToolType } from '../../types/analysis';

interface DrawingToolsBarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  magnetMode?: boolean;
  onToggleMagnet?: () => void;
  drawingsCount: number;
  onClearDrawings?: () => void;
  hideAllDrawings: boolean;
  onToggleHideAllDrawings: () => void;
  theme?: 'light' | 'dark';
}

interface ToolItem {
  id: DrawingToolType;
  icon: React.ReactNode;
  label: string;
  desc: string;
}

export const DrawingToolsBar: React.FC<DrawingToolsBarProps> = ({
  activeTool,
  onSelectTool,
  drawingsCount,
  onClearDrawings,
  hideAllDrawings,
  onToggleHideAllDrawings,
  theme = 'light'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  // Close when clicking or touching outside (armed with delay so opening tap doesn't instantly close it)
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideInteraction = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideInteraction);
      document.addEventListener('touchstart', handleOutsideInteraction, { passive: true });
    }, 60);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, [isOpen]);

  // Robust tools strictly supported by CandlestickChart engine
  const tools: ToolItem[] = [
    { id: 'none', icon: <MousePointer className="w-4 h-4" />, label: 'Pointer', desc: 'Select / Move' },
    { id: 'trendline', icon: <TrendingUp className="w-4 h-4" />, label: 'Trendline', desc: '2 Points' },
    { id: 'horizontal', icon: <Minus className="w-4 h-4" />, label: 'Horizontal', desc: 'Support / Resist' },
    { id: 'horizontal_ray', icon: <span className="font-mono text-xs font-bold leading-none">─→</span>, label: 'Ray', desc: 'Right Ray' },
    { id: 'arrow', icon: <ArrowUpRight className="w-4 h-4" />, label: 'Arrow', desc: 'Direction' },
    { id: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Zone Box', desc: 'Supply / Demand' },
    { id: 'fibonacci', icon: <Split className="w-4 h-4 rotate-90" />, label: 'Fibonacci', desc: 'Retracement' },
    { id: 'brush', icon: <Pencil className="w-4 h-4" />, label: 'Brush', desc: 'Freehand Draw' },
    { id: 'ruler', icon: <Activity className="w-4 h-4" />, label: 'Price Ruler', desc: 'Measure Pips' },
    { id: 'vertical', icon: <span className="font-mono text-xs font-bold leading-none rotate-90 inline-block">─</span>, label: 'Vertical', desc: 'Time Line' },
  ];

  const handleToolSelect = (toolId: DrawingToolType) => {
    onSelectTool(toolId);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      data-interactive="true"
      className="absolute top-9 left-2 z-30 flex items-start select-none pointer-events-auto"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* 1. Main Pencil Toggle Button */}
      <button
        type="button"
        data-interactive="true"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-md transition-all cursor-pointer active:scale-95 shrink-0 ${
          activeTool !== 'none'
            ? 'bg-[#0088cc] text-white border-[#0088cc] shadow-blue-500/25 ring-2 ring-blue-400/40 scale-105'
            : isOpen
              ? isDark 
                ? 'bg-slate-800 border-[#0088cc] text-[#38bdf8]' 
                : 'bg-blue-50 border-[#0088cc] text-[#0088cc]'
              : isDark
                ? 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                : 'bg-white/95 border-gray-300 text-gray-700 hover:bg-gray-100'
        }`}
        title="Drawing Tools (ड्रॉइंग टूल्स)"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {/* 2. Compact, Viewport-Bounded Floating Drawer (Zero screen overflow, touch-safe) */}
      {isOpen && (
        <div 
          data-interactive="true"
          className={`absolute top-9 left-0 p-2 rounded-xl shadow-2xl border backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 w-64 max-w-[calc(100vw-24px)] max-h-[min(300px,65vh)] overflow-y-auto no-scrollbar flex flex-col gap-1.5 z-50 ${
            isDark 
              ? 'bg-slate-900/98 border-slate-700 text-slate-100 shadow-black/80' 
              : 'bg-white/98 border-gray-300 text-gray-900 shadow-slate-400/30'
          }`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Header with Title and Close Button */}
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-200/80 dark:border-slate-800 px-1 shrink-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-300 flex items-center gap-1">
              <Pencil className="w-3.5 h-3.5 text-[#0088cc]" />
              <span>Drawing Tools</span>
            </span>
            <button
              type="button"
              data-interactive="true"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer active:scale-90 transition-colors"
              title="Close palette"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2-Column Touch-Friendly Grid of Tools */}
          <div className="grid grid-cols-2 gap-1.5 py-0.5">
            {tools.map(tool => {
              const isSelected = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  data-interactive="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolSelect(tool.id);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer active:scale-95 min-h-[38px] ${
                    isSelected
                      ? 'bg-[#0088cc] text-white shadow-xs font-black'
                      : isDark
                        ? 'hover:bg-slate-800 text-slate-200 active:bg-slate-700'
                        : 'hover:bg-blue-50/70 text-gray-800 active:bg-gray-100'
                  }`}
                  title={tool.desc}
                >
                  <span className={`shrink-0 ${isSelected ? 'text-white' : 'text-[#0088cc] dark:text-[#38bdf8]'}`}>
                    {tool.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold truncate leading-tight">
                      {tool.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Row: Hide / Unhide & Clear All */}
          <div className="pt-1.5 mt-0.5 border-t border-gray-200/80 dark:border-slate-800 flex items-center justify-between gap-1.5 px-0.5 shrink-0">
            <button
              type="button"
              data-interactive="true"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHideAllDrawings();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-black transition-all cursor-pointer min-h-[32px] ${
                hideAllDrawings
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {hideAllDrawings ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{hideAllDrawings ? 'Hidden' : 'Hide All'}</span>
            </button>

            {drawingsCount > 0 && onClearDrawings && (
              <button
                type="button"
                data-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearDrawings();
                  setIsOpen(false);
                }}
                className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer min-h-[32px]"
                title="Clear all drawings"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear ({drawingsCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Active Drawing Tool Indicator Badge (When tool is active) */}
      {activeTool !== 'none' && !isOpen && (
        <div 
          data-interactive="true"
          className={`ml-1.5 px-2.5 py-1 rounded-lg border shadow-md flex items-center gap-1.5 text-[11px] font-extrabold backdrop-blur-md animate-in fade-in duration-100 ${
            isDark 
              ? 'bg-slate-900/95 border-[#0088cc]/60 text-white' 
              : 'bg-white/95 border-[#0088cc]/50 text-gray-900'
          }`}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <span className="w-2 h-2 rounded-full bg-[#0088cc] animate-ping" />
          <span className="capitalize">{activeTool.replace('_', ' ')}</span>
          <button
            type="button"
            data-interactive="true"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTool('none');
            }}
            className="ml-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-800 dark:hover:text-white cursor-pointer active:scale-90"
            title="Cancel drawing"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
