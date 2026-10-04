import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Gauge,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  Trash2,
  Server,
  Cpu,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  HelpCircle,
} from "lucide-react";
import { perfTracker, PerformanceStats, measureApiCall } from "../utils/performanceTracker";
import { getApiUrl } from "../apiConfig";

interface PerformanceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PerformanceOverlay({ isOpen, onClose }: PerformanceOverlayProps) {
  const [stats, setStats] = useState<PerformanceStats>(() => perfTracker.getStats());
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [showLogs, setShowLogs] = useState(true);

  useEffect(() => {
    const unsubscribe = perfTracker.subscribe((updatedStats) => {
      setStats(updatedStats);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handlePingTest = async () => {
    setIsPinging(true);
    try {
      await measureApiCall(
        "/api/about",
        "Diagnostic Ping",
        async () => {
          const res = await fetch(getApiUrl("/api/about"));
          return await res.json();
        },
        false
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsPinging(false);
    }
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return "text-emerald-400 border-emerald-500/40 bg-emerald-950/40";
    if (fps >= 35) return "text-amber-400 border-amber-500/40 bg-amber-950/40";
    return "text-rose-400 border-rose-500/40 bg-rose-950/40";
  };

  const getLatencyColor = (latency: number | null) => {
    if (latency === null) return "text-slate-400 border-slate-700 bg-slate-900/50";
    if (latency <= 120) return "text-emerald-400 border-emerald-500/40 bg-emerald-950/40";
    if (latency <= 300) return "text-amber-400 border-amber-500/40 bg-amber-950/40";
    return "text-rose-400 border-rose-500/40 bg-rose-950/40";
  };

  const getLatencyRating = (latency: number | null) => {
    if (latency === null) return "No moves yet";
    if (latency <= 80) return "Ultra Fast (<80ms)";
    if (latency <= 150) return "Optimal (80-150ms)";
    if (latency <= 300) return "Acceptable (150-300ms)";
    return "High Latency (>300ms)";
  };

  return (
    <div className="fixed top-4 right-4 z-50 font-mono select-none">
      <AnimatePresence>
        {isMinimized ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsMinimized(false)}
            className="cursor-pointer bg-slate-950/90 text-slate-200 border border-slate-700 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-2.5 backdrop-blur-md hover:border-indigo-500 transition-colors"
          >
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold">{stats.fps} FPS</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1">
              <Activity size={11} className="text-indigo-400" />
              <span className="text-xs font-bold text-indigo-300">
                {stats.avgMoveLatencyMs !== null ? `${stats.avgMoveLatencyMs}ms` : "--"}
              </span>
            </div>
            <Maximize2 size={11} className="text-slate-400 ml-1" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: -10 }}
            className="w-80 sm:w-96 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl text-slate-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Activity size={13} className="text-indigo-400" />
                  Performance Telemetry
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Minimize"
                >
                  <Minimize2 size={13} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                  title="Close Debug Overlay"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            <div className="p-3.5 space-y-3 text-xs">
              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* FPS Card */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    <span className="flex items-center gap-1">
                      <Gauge size={11} className="text-emerald-400" />
                      Client FPS
                    </span>
                    <span className="text-slate-500">{stats.frameTimeMs}ms</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className={`text-2xl font-black ${getFpsColor(stats.fps).split(" ")[0]}`}>
                      {stats.fps}
                    </div>
                    <div className="text-[10px] text-slate-400 text-right">
                      <div>Avg: <span className="text-slate-200 font-bold">{stats.avgFps}</span></div>
                      <div>Min: <span className="text-slate-400">{stats.minFps}</span></div>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="h-4 flex items-end gap-[2px] pt-1">
                    {stats.fpsHistory.map((val, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-t-[1px] ${
                          val >= 55 ? "bg-emerald-400" : val >= 35 ? "bg-amber-400" : "bg-rose-400"
                        }`}
                        style={{ height: `${Math.max(15, (val / 60) * 100)}%` }}
                        title={`${val} FPS`}
                      />
                    ))}
                  </div>
                </div>

                {/* API Move Latency Card */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    <span className="flex items-center gap-1">
                      <Activity size={11} className="text-indigo-400" />
                      Avg Move Ping
                    </span>
                    <span className="text-slate-500">{stats.totalMoveRequests} moves</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className={`text-2xl font-black ${getLatencyColor(stats.avgMoveLatencyMs).split(" ")[0]}`}>
                      {stats.avgMoveLatencyMs !== null ? `${stats.avgMoveLatencyMs}` : "--"}
                      <span className="text-xs font-normal text-slate-400 ml-0.5">ms</span>
                    </div>
                    <div className="text-[10px] text-slate-400 text-right">
                      <div>Last: <span className="text-indigo-300 font-bold">{stats.lastMoveLatencyMs !== null ? `${stats.lastMoveLatencyMs}ms` : "--"}</span></div>
                      <div>Min: <span className="text-slate-400">{stats.minMoveLatencyMs !== null ? `${stats.minMoveLatencyMs}ms` : "--"}</span></div>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {getLatencyRating(stats.avgMoveLatencyMs)}
                  </div>
                </div>
              </div>

              {/* Action Buttons & Status */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                <button
                  onClick={handlePingTest}
                  disabled={isPinging}
                  className="flex-1 py-1.5 px-2 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/50 rounded-lg text-[10px] font-bold text-indigo-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={11} className={isPinging ? "animate-spin" : ""} />
                  {isPinging ? "Testing Ping..." : "Diagnostic Ping"}
                </button>
                <button
                  onClick={() => perfTracker.clearStats()}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                  title="Clear telemetry logs"
                >
                  <Trash2 size={11} />
                  Reset
                </button>
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showLogs ? "Hide Logs" : "Logs"}
                </button>
              </div>

              {/* Recent Request Logs */}
              {showLogs && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">
                    <span>Recent Network Calls</span>
                    <span>Latency</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {stats.recentLogs.length === 0 ? (
                      <div className="text-center py-4 text-slate-600 text-[11px]">
                        No API calls recorded yet. Place a bet or click cells to measure move latency.
                      </div>
                    ) : (
                      stats.recentLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-1.5 rounded-md bg-slate-900/40 border border-slate-800/60 text-[10px]"
                        >
                          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                            {log.isGameMove ? (
                              <Activity size={10} className="text-indigo-400 shrink-0" />
                            ) : (
                              <Server size={10} className="text-slate-500 shrink-0" />
                            )}
                            <span className="font-bold text-slate-300 truncate">{log.action}</span>
                            <span className="text-slate-600 text-[9px] truncate">{log.endpoint}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`font-mono font-bold ${getLatencyColor(log.durationMs).split(" ")[0]}`}>
                              {log.durationMs}ms
                            </span>
                            <span className="text-[9px] text-slate-500">
                              {log.timestamp.toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Hotkey hint */}
              <div className="text-[9px] text-slate-500 text-center pt-1 border-t border-slate-900 flex items-center justify-center gap-1">
                <HelpCircle size={10} />
                <span>Toggle overlay with <b>Shift + D</b> or tap logo 5 times</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
