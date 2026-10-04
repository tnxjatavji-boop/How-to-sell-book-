import { LogOut, ShieldCheck, Activity, HeadphonesIcon, Settings, Globe, Sun, Moon, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { toast } from "./Toast";

export function Profile({
  onLogout,
  userId,
  setActivePage,
  theme,
  toggleTheme,
  showDebugOverlay,
  toggleDebugOverlay,
}: {
  onLogout: () => void;
  userId: string;
  setActivePage: (page: string) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  showDebugOverlay?: boolean;
  toggleDebugOverlay?: () => void;
}) {
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem("backend_api_url") || "");

  const handleSaveServer = () => {
    if (serverUrl.trim()) {
      let formattedUrl = serverUrl.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = "https://" + formattedUrl;
      }
      localStorage.setItem("backend_api_url", formattedUrl);
      setServerUrl(formattedUrl);
      toast("Custom backend URL applied!");
    } else {
      localStorage.removeItem("backend_api_url");
      setServerUrl("");
      toast("Reset to default app server!");
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="glass-premium rounded-[20px] p-8 flex flex-col gap-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-800/80 bg-slate-900/40"
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[16px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-3xl sm:text-4xl font-display font-black shadow-xl shadow-indigo-500/25 text-white border border-indigo-400/20 relative shrink-0">
            <div className="absolute inset-0 bg-white/10 rounded-[16px] blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-[16px]" />
            <span className="relative z-10 drop-shadow-md">{(userId || 'ME').substring(0, 2).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl sm:text-3xl font-display font-black text-slate-100 tracking-tight drop-shadow-sm truncate">
              {(userId || 'Trader').split("@")[0]}
            </div>
            <div className="text-[9px] sm:text-[10px] text-indigo-400 mt-2 uppercase tracking-[0.2em] font-black flex items-center gap-1.5 bg-indigo-950/40 py-1.5 px-3 rounded-lg border border-indigo-900/40 w-fit">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]" /> Active Member
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-emerald-950/40 text-emerald-400 py-3 px-5 rounded-[12px] border border-emerald-900/40 text-[10px] font-black uppercase tracking-[0.2em] self-start relative z-10 shadow-sm">
          <ShieldCheck size={16} className="stroke-[2.5] text-emerald-400" /> Verified Account
        </div>
      </motion.div>
 
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        className="glass-premium rounded-[20px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-800/80 bg-slate-900/40"
      >
        <div className="p-6 border-b border-slate-800/60 flex justify-between items-center text-sm group hover:bg-slate-900/40 transition-colors cursor-default bg-slate-950/20">
          <span className="text-slate-400 font-black uppercase tracking-wider text-[11px] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 flex items-center justify-center border border-indigo-900/50">
               <Activity size={16} className="text-indigo-400 stroke-[2.5]" />
            </div>
            Games Played
          </span>
          <span className="font-black text-slate-100 font-display text-2xl drop-shadow-sm">
            142
          </span>
        </div>
        <button
          onClick={toggleTheme}
          className="w-full p-6 border-b border-slate-800/60 flex items-center justify-between text-slate-300 hover:text-indigo-400 hover:bg-slate-900/40 transition-colors cursor-pointer group bg-slate-950/20"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-indigo-950 flex items-center justify-center border border-slate-800 group-hover:border-indigo-900/50 transition-colors flex shrink-0">
                  {theme === "dark" ? (
                    <Sun
                      size={16}
                      className="text-amber-400 stroke-[2.5] group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <Moon
                      size={16}
                      className="text-indigo-600 stroke-[2.5] group-hover:scale-110 transition-transform"
                    />
                  )}
             </div>
             <span className="text-[11px] font-black uppercase tracking-wider text-left">
                Theme: {theme === "dark" ? "Dark Mode" : "Light Mode"}
             </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${theme === 'dark' ? 'bg-indigo-900/60 border border-indigo-800/80' : 'bg-slate-200 border border-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-6 bg-indigo-400' : 'translate-x-0 bg-white'}`}>
                {theme === "dark" ? <Moon size={8} className="text-indigo-950" /> : <Sun size={8} className="text-amber-500" />}
              </div>
            </div>
          </div>
        </button>
        <button
          onClick={() => setActivePage("support")}
          className="w-full p-6 border-b border-slate-800/60 flex items-center justify-between text-slate-300 hover:text-indigo-400 hover:bg-slate-900/40 transition-colors cursor-pointer group bg-slate-950/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-indigo-950 flex items-center justify-center border border-slate-800 group-hover:border-indigo-900/50 transition-colors">
               <HeadphonesIcon
                 size={16}
                 className="group-hover:scale-110 transition-transform stroke-[2.5]"
               />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider">
              Customer Support & FAQs
            </span>
          </div>
          <div className="w-6 h-6 rounded-full bg-slate-900 group-hover:bg-indigo-950 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
            <span className="font-black text-xs leading-none transform translate-x-0.5">&rsaquo;</span>
          </div>
        </button>
        <button
          onClick={toggleDebugOverlay}
          className="w-full p-6 border-b border-slate-800/60 flex items-center justify-between text-slate-300 hover:text-indigo-400 hover:bg-slate-900/40 transition-colors cursor-pointer group bg-slate-950/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-indigo-950 flex items-center justify-center border border-slate-800 group-hover:border-indigo-900/50 transition-colors">
               <Gauge
                 size={16}
                 className="group-hover:scale-110 transition-transform stroke-[2.5] text-indigo-400"
               />
            </div>
            <div className="text-left">
              <span className="text-[11px] font-black uppercase tracking-wider block">
                Performance Telemetry Overlay
              </span>
              <span className="text-[9px] text-slate-500 font-bold block">
                FPS & API Move Latency Monitor (Shift + D)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${showDebugOverlay ? 'bg-indigo-600 border border-indigo-500' : 'bg-slate-800 border border-slate-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${showDebugOverlay ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
        </button>
        <button
          onClick={() => setShowServerSettings(!showServerSettings)}
          className="w-full p-6 border-b border-slate-800/60 flex items-center justify-between text-slate-300 hover:text-indigo-400 hover:bg-slate-900/40 transition-colors cursor-pointer group bg-slate-950/20"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-indigo-950 flex items-center justify-center border border-slate-800 group-hover:border-indigo-900/50 transition-colors">
                 <Settings
                   size={16}
                   className={`group-hover:rotate-45 transition-transform duration-300 stroke-[2.5] ${showServerSettings ? "rotate-45 text-indigo-400" : ""}`}
                 />
             </div>
             <span className="text-[11px] font-black uppercase tracking-wider">
                Connection Settings
             </span>
          </div>
          <div className="w-6 h-6 rounded-full bg-slate-900 group-hover:bg-indigo-950 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
            <span className={`font-black text-xs leading-none transition-transform ${showServerSettings ? 'rotate-90' : 'transform translate-x-0.5'}`}>&rsaquo;</span>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="w-full p-6 flex items-center justify-between text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer group bg-slate-950/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 group-hover:bg-rose-950 flex items-center justify-center border border-slate-800 group-hover:border-rose-900/50 transition-colors">
               <LogOut
                 size={16}
                 className="group-hover:scale-110 transition-transform stroke-[2.5]"
               />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider">
              Logout
            </span>
          </div>
        </button>
      </motion.div>

      <AnimatePresence>
        {showServerSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-premium rounded-[20px] p-6 overflow-hidden border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] bg-slate-900/40"
          >
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-950/80 flex items-center justify-center border border-indigo-900/40">
                 <Globe size={14} className="text-indigo-400 stroke-[2.5]" />
              </div>
              Live Backend Server
            </h3>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed mb-5 px-1 uppercase tracking-wide">
              If running this app statically from Netlify or custom domains, enter your hosted Express API URL below.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="https://example-express-api.run.app"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 px-4 py-3.5 rounded-[12px] outline-none focus:border-indigo-500/50 transition-all text-xs font-bold shadow-inner"
              />
              <button
                onClick={handleSaveServer}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider px-6 py-3.5 rounded-[12px] transition-all cursor-pointer shadow-md shadow-indigo-500/20 active:scale-95 border-none"
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
