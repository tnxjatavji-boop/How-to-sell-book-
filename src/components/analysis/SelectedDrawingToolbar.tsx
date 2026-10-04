import React from 'react';
import { 
  Trash2, Copy, Lock, Unlock, X
} from 'lucide-react';
import { DrawingItem } from '../../types/analysis';

interface SelectedDrawingToolbarProps {
  drawing: DrawingItem | null;
  onUpdateDrawing: (updated: DrawingItem) => void;
  onDeleteDrawing: (id: string) => void;
  onCloneDrawing?: (drawing: DrawingItem) => void;
  onDeselect: () => void;
  theme?: 'light' | 'dark';
}

const COLORS = [
  '#fbbf24', // Yellow / Amber
  '#0088cc', // Blue
  '#00b067', // Green
  '#ef4444', // Red
  '#a855f7', // Purple
  '#ffffff', // White
];

export const SelectedDrawingToolbar: React.FC<SelectedDrawingToolbarProps> = ({
  drawing,
  onUpdateDrawing,
  onDeleteDrawing,
  onCloneDrawing,
  onDeselect,
  theme = 'light'
}) => {
  if (!drawing) return null;
  const isDark = theme === 'dark';

  const stopEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      data-interactive="true"
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto select-none max-w-[calc(100vw-24px)]"
      onMouseDown={stopEvent}
      onMouseUp={stopEvent}
      onTouchStart={stopEvent}
      onTouchMove={stopEvent}
      onPointerDown={stopEvent}
      onClick={stopEvent}
    >
      <div 
        data-interactive="true"
        className={`px-3 py-1.5 rounded-2xl shadow-2xl border backdrop-blur-2xl flex items-center gap-2 overflow-x-auto no-scrollbar ${
          isDark 
            ? 'bg-slate-900/98 border-slate-700 text-slate-100 shadow-black/80' 
            : 'bg-white/98 border-gray-300 text-gray-900 shadow-slate-400/40'
        }`}
      >
        {/* Color Palette Dots */}
        <div data-interactive="true" className="flex items-center gap-1.5 shrink-0">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              data-interactive="true"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateDrawing({ ...drawing, color: c });
              }}
              className={`w-5 h-5 rounded-full border transition-transform cursor-pointer active:scale-90 shrink-0 ${
                drawing.color === c 
                  ? 'scale-125 ring-2 ring-blue-500 border-white dark:border-slate-900 shadow-sm' 
                  : 'hover:scale-110 border-black/20 dark:border-white/30'
              }`}
              style={{ backgroundColor: c }}
              title={`Color: ${c}`}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 shrink-0" />

        {/* Line Thickness Toggle */}
        <button
          type="button"
          data-interactive="true"
          onClick={(e) => {
            e.stopPropagation();
            const nextWidth = drawing.lineWidth === 1 ? 2 : drawing.lineWidth === 2 ? 3 : 1;
            onUpdateDrawing({ ...drawing, lineWidth: nextWidth });
          }}
          className="h-7 px-2 rounded-lg flex items-center justify-center text-[10px] font-black border border-blue-500/30 bg-[#0088cc]/15 text-[#0088cc] hover:bg-[#0088cc]/25 transition-transform cursor-pointer active:scale-90 shrink-0"
          title={`Line Width: ${drawing.lineWidth}px (Tap to change)`}
        >
          {drawing.lineWidth}px
        </button>

        {/* Line Style Toggle: Solid / Dash */}
        <button
          type="button"
          data-interactive="true"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateDrawing({
              ...drawing,
              lineStyle: drawing.lineStyle === 'dashed' ? 'solid' : 'dashed'
            });
          }}
          className={`h-7 px-2 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors cursor-pointer active:scale-90 shrink-0 ${
            drawing.lineStyle === 'dashed'
              ? 'bg-blue-500/20 text-[#0088cc] border-blue-400 font-black' 
              : isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
          title="Line Style (Solid / Dash)"
        >
          {drawing.lineStyle === 'dashed' ? 'Dash' : 'Solid'}
        </button>

        {/* Lock / Unlock Toggle */}
        <button
          type="button"
          data-interactive="true"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateDrawing({ ...drawing, locked: !drawing.locked });
          }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer active:scale-90 shrink-0 ${
            drawing.locked 
              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
              : 'text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
          title={drawing.locked ? "Unlock position" : "Lock position"}
        >
          {drawing.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        {/* Clone / Duplicate Button */}
        {onCloneDrawing && (
          <button
            type="button"
            data-interactive="true"
            onClick={(e) => {
              e.stopPropagation();
              onCloneDrawing(drawing);
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer active:scale-90 transition-all shrink-0"
            title="Duplicate Drawing"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Delete Button */}
        <button
          type="button"
          data-interactive="true"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteDrawing(drawing.id);
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-500/15 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white active:scale-90 transition-all cursor-pointer shrink-0"
          title="Delete Drawing"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 shrink-0" />

        {/* Close / Deselect Button */}
        <button
          type="button"
          data-interactive="true"
          onClick={(e) => {
            e.stopPropagation();
            onDeselect();
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer active:scale-90 transition-all shrink-0"
          title="Deselect"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
