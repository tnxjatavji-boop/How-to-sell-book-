import { useState, useEffect } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Gamepad2,
  Trophy,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";
import { getApiUrl } from "../apiConfig";
import { toast } from "./Toast";

export function History({ userId }: { userId: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          getApiUrl(`/api/history?userId=${encodeURIComponent(userId)}`),
        );
        const data = await res.json();
        if (data.history) {
          setHistory(data.history);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  const getIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine size={16} className="text-indigo-400" />;
      case "withdraw":
        return <ArrowUpRight size={16} className="text-rose-400" />;
      case "bet":
        return <Gamepad2 size={16} className="text-slate-400" />;
      case "win":
        return <Trophy size={16} className="text-emerald-400" />;
      default:
        return <Clock size={16} className="text-slate-500" />;
    }
  };

  const getColor = (type: string, status: string) => {
    if (status === "pending") return "text-amber-400";
    if (status === "rejected") return "text-rose-400";

    switch (type) {
      case "deposit":
        return "text-indigo-400";
      case "withdraw":
        return "text-rose-400";
      case "bet":
        return "text-slate-400";
      case "win":
        return "text-emerald-400";
      default:
        return "text-slate-400";
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "border-indigo-900/40 bg-indigo-950/20";
      case "withdraw":
        return "border-rose-900/40 bg-rose-950/20";
      case "bet":
        return "border-slate-800/60 bg-slate-900/20";
      case "win":
        return "border-emerald-900/40 bg-emerald-950/20";
      default:
        return "border-slate-800/60 bg-slate-900/20";
    }
  };

  const formatType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="w-full space-y-6 pb-20">
      <div className="glass-premium rounded-[20px] p-6 relative overflow-hidden min-h-[400px] border border-slate-800/80 bg-slate-900/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <h2 className="text-xl font-display font-black text-slate-100 mb-8 relative z-10 flex items-center gap-3 drop-shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/80 flex items-center justify-center border border-indigo-900/50 shadow-inner">
            <Clock size={20} className="text-indigo-400 stroke-[2.5]" />
          </div>
          Transaction History
        </h2>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-48 gap-4 relative z-10">
            <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Loading Records...</div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center relative z-10">
            <div className="w-16 h-16 rounded-xl bg-slate-950 flex items-center justify-center mb-4 border border-slate-800">
               <Clock size={24} className="text-slate-600" />
            </div>
            <div className="text-[11px] text-slate-500 font-black uppercase tracking-[0.15em]">
              No transactions yet
            </div>
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            {history.map((tx, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={idx}
                onClick={() => {
                  if (tx.gameDetails) {
                    setExpandedId(expandedId === tx.id ? null : tx.id);
                  } else {
                    toast("Game details are only available for new games.");
                  }
                }}
                className={`p-5 rounded-[20px] border ${getBgColor(tx.type)} shadow-sm transition-all bg-slate-950/40 backdrop-blur-md ${tx.gameDetails ? 'cursor-pointer hover:border-indigo-500/30 hover:shadow-md' : 'cursor-pointer active:scale-[0.98]'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center shadow-inner border border-slate-800 ${getColor(tx.type, "approved")}`}
                    >
                      {getIcon(tx.type)}
                    </div>
                    <div>
                      <div className="font-black text-slate-200 text-sm tracking-tight">
                        {formatType(tx.type)}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-[0.15em] font-bold mt-1">
                        {new Date(tx.date).toLocaleDateString()}{" "}
                        {new Date(tx.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[8px] text-indigo-400/80 font-mono mt-0.5 truncate max-w-[100px]">
                        TX: {tx.id.substring(0, 12)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black text-base tracking-tight ${getColor(tx.type, tx.status)}`}>
                      {tx.type === "withdraw" || tx.type === "bet" ? "-" : "+"}₹{Number(tx.amount || 0).toFixed(2)}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] mt-1 text-slate-500">
                      {tx.status}
                    </div>
                  </div>
                </div>

                {expandedId === tx.id && tx.gameDetails && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="mt-5 pt-5 border-t border-slate-800/60"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950 p-4 rounded-[12px] border border-slate-800 shadow-inner">
                        <div className="text-[9px] uppercase tracking-[0.15em] font-black text-slate-500 mb-1.5">Result</div>
                        <div className={`font-black text-sm ${tx.gameDetails.isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.gameDetails.isWin ? 'WIN' : 'BOMB HIT'}
                        </div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-[12px] border border-slate-800 shadow-inner">
                        <div className="text-[9px] uppercase tracking-[0.15em] font-black text-slate-500 mb-1.5">Mines</div>
                        <div className="font-black text-sm text-slate-300">{tx.gameDetails.mineCount}</div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-[12px] border border-slate-800 shadow-inner">
                        <div className="text-[9px] uppercase tracking-[0.15em] font-black text-slate-500 mb-1.5">Revealed</div>
                        <div className="font-black text-sm text-slate-300">{tx.gameDetails.revealedCount} Gems</div>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-[12px] border border-slate-800 shadow-inner">
                        <div className="text-[9px] uppercase tracking-[0.15em] font-black text-slate-500 mb-1.5">Multiplier</div>
                        <div className="font-black text-sm text-indigo-400">{tx.gameDetails.multiplier}x</div>
                      </div>
                      <div className="col-span-2 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 p-4 rounded-[12px] border border-indigo-900/30 flex justify-between items-center shadow-inner">
                        <div className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400">Total Profit</div>
                        <div className={`font-black text-lg ${tx.gameDetails.isWin ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {tx.gameDetails.isWin ? `+₹${(Number(tx.gameDetails.winAmount || 0) - Number(tx.gameDetails.betAmount || 0)).toFixed(2)}` : '₹0.00'}
                        </div>
                      </div>
                      
                      {tx.gameDetails.mineLocations && (
                        <div className="col-span-2 mt-3 flex flex-col items-center">
                          <div className="text-[9px] uppercase tracking-[0.15em] font-black text-slate-500 mb-3">Board Layout</div>
                          <div className="grid grid-cols-5 gap-1.5 bg-slate-950 p-3 rounded-[14px] border border-slate-800 shadow-sm inline-block">
                            {Array.from({ length: 25 }).map((_, i) => {
                              const isMine = tx.gameDetails.mineLocations.includes(i);
                              const isRevealed = tx.gameDetails.revealedCells?.includes(i);
                              return (
                                <div 
                                  key={i} 
                                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shadow-inner
                                    ${isMine ? 'bg-rose-950/40 border border-rose-900/40 text-rose-400' : (isRevealed ? 'bg-emerald-950/40 border border-emerald-900/40 text-emerald-400' : 'bg-slate-900 border border-slate-800')}`}
                                >
                                  {isMine ? '💣' : (isRevealed ? '💎' : '')}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
